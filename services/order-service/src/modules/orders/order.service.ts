// services/order-service/src/modules/orders/order.service.ts
import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { HttpProductCatalog } from "./adapters/http-product-catalog.js";
import { RabbitMQPublisher } from "./adapters/rabbitmq-client.js";
import { KafkaPublisher } from "./adapters/kafka-client.js";
import { checkInventoryStock } from "./adapters/inventory-client.js";

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

  // Aggregate quantities by product to avoid over-ordering across split lines
  if (process.env.INVENTORY_GRPC_URL || process.env.INVENTORY_SERVICE_URL) {
    const quantitiesByProduct = new Map<string, number>();
    for (const item of data.items) {
      const current = quantitiesByProduct.get(item.productId) || 0;
      quantitiesByProduct.set(item.productId, current + item.quantity);
    }

    // Check all products concurrently through the circuit breaker
    await Promise.all(
      Array.from(quantitiesByProduct.entries()).map(async ([productId, totalQty]) => {
        const hasStock = await checkInventoryStock(productId, totalQty);
        if (!hasStock) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      })
    );
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
  });

  await rabbitPublisher.publishOrderCreated(newOrder);
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
  status: "pending" | "confirmed" | "cancelled",
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