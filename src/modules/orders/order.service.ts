import mongoose from "mongoose";
import { Order } from "./order.model.js";
import { MongoProductCatalog } from "./mongo-product-catalog.js";
const productCatalog = new MongoProductCatalog();

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

  return Order.create({
    customerName: data.customerName,
    items,
    totalAmount,
  });
}

export async function getOrders() {
  return Order.find().sort({ createdAt: -1 });
}

export async function getOrderById(id: string) {
  return Order.findById(id);
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled",
) {
  return Order.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  );
}
