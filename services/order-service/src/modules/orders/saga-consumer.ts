import amqp from "amqplib";
import { Order } from "./order.model.js";

type InventoryEventData = {
  orderId: string;
  reason?: string;
};

export async function handleInventoryEvents(routingKey: string, data: InventoryEventData): Promise<void> {
  const orderId = data.orderId;

  if (routingKey === "inventory.reserved") {
    // The Saga completed successfully!
    await Order.findByIdAndUpdate(orderId, { status: "CONFIRMED" });
    console.log(`✅ Order ${orderId} CONFIRMED.`);
  }

  if (routingKey === "inventory.failed") {
    // 🚨 THE COMPENSATING TRANSACTION 🚨
    // Inventory failed. We must roll back the Order state to CANCELLED.
    await Order.findByIdAndUpdate(orderId, {
      status: "CANCELLED",
      cancelReason: data.reason,
    });
    console.log(`❌ Order ${orderId} CANCELLED. Reason: ${data.reason}`);

    // (If you had a Payment Service, you would emit a 'refund.requested' event here)
  }
}

export async function startOrderSagaConsumer(): Promise<void> {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";
  const exchange = "saga-exchange";
  const queue = "order_saga_inventory_events_queue";

  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "inventory.*");

    console.log(`Order Saga Consumer waiting for [inventory.*] on [${exchange}]...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const routingKey = msg.fields.routingKey;
          const data = JSON.parse(msg.content.toString());

          await handleInventoryEvents(routingKey, data);
          channel.ack(msg);
        } catch (err) {
          console.error("Error processing inventory event message:", err);
          channel.nack(msg, false, false);
        }
      }
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed in Order Service. Reconnecting in 5s...");
      setTimeout(startOrderSagaConsumer, 5000);
    });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error in Order Service:", err.message);
    });
  } catch (error) {
    console.error("Failed to connect Order Service to RabbitMQ Saga Consumer. Retrying in 5s...", error);
    setTimeout(startOrderSagaConsumer, 5000);
  }
}
