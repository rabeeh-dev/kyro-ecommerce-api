import amqp from "amqplib";
import { Inventory } from "../modules/inventory/inventory.model.js";
import { rabbitPublisher } from "./rabbitmq-publisher.js";

type OrderItem = {
  productId: string;
  quantity: number;
};

type OrderData = {
  _id: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount?: number;
};

export async function handleOrderCreated(order: OrderData): Promise<void> {
  const deducted: { inventory: InstanceType<typeof Inventory>; quantity: number }[] = [];

  try {
    console.log(`📦 [SAGA LOCAL TX] Reserving stock for Order ${order._id}...`);

    // Attempt to reserve the stock in the local DB
    for (const item of order.items) {
      const inventory = await Inventory.findOne({ productId: item.productId });

      if (!inventory || inventory.stock < item.quantity) {
        throw new Error("OUT_OF_STOCK");
      }

      inventory.stock -= item.quantity;
      await inventory.save();
      deducted.push({ inventory, quantity: item.quantity });
    }

    // If successful, emit the success event!
    await rabbitPublisher.publish("saga-exchange", "inventory.reserved", {
      orderId: order._id,
    });
    console.log(`✅ [SAGA LOCAL TX] Stock reserved for Order ${order._id}. Emitted 'inventory.reserved'.`);
  } catch (error) {
    // Revert any partially deducted items from this failed attempt
    for (const { inventory, quantity } of deducted) {
      try {
        inventory.stock += quantity;
        await inventory.save();
      } catch (rollbackErr) {
        console.error(`Failed to revert stock for product ${inventory.productId}:`, rollbackErr);
      }
    }

    const reason = error instanceof Error ? error.message : "RESERVATION_FAILED";
    console.error(`❌ [SAGA LOCAL TX] Stock reservation failed for Order ${order._id}: ${reason}`);

    // If it fails, emit the FAILURE event (This triggers the Saga rollback!)
    await rabbitPublisher.publish("saga-exchange", "inventory.failed", {
      orderId: order._id,
      reason,
    });
  }
}

export async function startInventoryConsumer(): Promise<void> {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";
  const exchange = "saga-exchange";
  const queue = "inventory_saga_order_created_queue";

  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "order.created");

    console.log(`Inventory Saga Consumer waiting for [order.created] on [${exchange}]...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const order = JSON.parse(msg.content.toString());
          await handleOrderCreated(order);
          channel.ack(msg);
        } catch (err) {
          console.error("Error processing order.created message:", err);
          channel.nack(msg, false, false);
        }
      }
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed in Inventory Service. Reconnecting in 5s...");
      setTimeout(startInventoryConsumer, 5000);
    });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error in Inventory Service:", err.message);
    });
  } catch (error) {
    console.error("Failed to connect Inventory Service to RabbitMQ. Retrying in 5s...", error);
    setTimeout(startInventoryConsumer, 5000);
  }
}
