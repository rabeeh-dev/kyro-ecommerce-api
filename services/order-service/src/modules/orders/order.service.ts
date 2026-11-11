import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { HttpProductCatalog } from "./adapters/http-product-catalog.js";
import { GrpcInventoryCatalog } from "./adapters/grpc-inventory-catalog.js";
import { RabbitMQPublisher } from "./adapters/rabbitmq-client.js";

const productCatalog = new HttpProductCatalog();
const inventoryCatalog = new GrpcInventoryCatalog();

type CreateOrderInput = {
  customerName: string;
  items: {
    productId: string;
    quantity: number;
  }[];
};

const rabbitPublisher = new RabbitMQPublisher();

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

  // Check inventory stock via gRPC adapter if service is enabled
  if (process.env.INVENTORY_GRPC_URL || process.env.INVENTORY_SERVICE_URL) {
    for (const item of data.items) {
      const hasStock = await inventoryCatalog.checkStock(
        item.productId,
        item.quantity,
      );
      if (!hasStock) {
        throw new Error("INSUFFICIENT_STOCK");
      }
    }
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
