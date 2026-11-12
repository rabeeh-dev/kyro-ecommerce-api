import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { HttpProductCatalog } from "../../clients/http-product.client.js";
import { RabbitMQPublisher } from "../../brokers/rabbitmq.client.js";
import { KafkaPublisher } from "../../brokers/kafka.client.js";

const productCatalog = new HttpProductCatalog();
const rabbitPublisher = new RabbitMQPublisher();
const kafkaPublisher = new KafkaPublisher();

type CreateOrderInput = {
  customerName: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};

export async function createOrder(data: CreateOrderInput) {
  const productIds = data.items.map((item) => item.productId);

  if (!productIds.every((id) => mongoose.isValidObjectId(id))) {
    throw new Error("INVALID_PRODUCT_ID");
  }

  const uniqueIds = [...new Set(productIds)];
  const products = await productCatalog.getProductsByIds(uniqueIds);

  if (products.length !== uniqueIds.length) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const items = data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
    };
  });

  const totalAmount = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const newOrder = await Order.create({
    customerName: data.customerName,
    items,
    totalAmount,
    status: "PENDING",
  });

  // Emit the event to RabbitMQ. The Order Service's job is now DONE.
  await rabbitPublisher.publish("saga-exchange", "order.created", newOrder);

  // We also send it to Kafka for the Analytics dashboard
  await kafkaPublisher.streamOrderEvent(newOrder);

  return newOrder;
}

export async function getOrders() {
  return Order.find().sort({ createdAt: -1 });
}

export async function getOrderById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Order.findById(id);
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled" | "PENDING" | "CONFIRMED" | "CANCELLED",
) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
}

export async function deleteOrder(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }
  return Order.findByIdAndDelete(id);
}
