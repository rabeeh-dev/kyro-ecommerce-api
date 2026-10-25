
import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as orderService from "./order.service.js";

export async function create(req: Request, res: Response) {
  const { customerName, items } = req.body;

  if (
    typeof customerName !== "string" ||
    !customerName.trim() ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      message: "Provide a customer name and at least one item",
    });
  }

  const validItems = items.every(
    (item: unknown) =>
      typeof item === "object" &&
      item !== null &&
      "productId" in item &&
      typeof item.productId === "string" &&
      "quantity" in item &&
      typeof item.quantity === "number" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
  );

  if (!validItems) {
    return res.status(400).json({
      message: "Each item needs a productId and positive integer quantity",
    });
  }

  try {
    const order = await orderService.createOrder({
      customerName: customerName.trim(),
      items,
    });

    return res.status(201).json(order);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_PRODUCT_ID") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "One or more products not found" });
    }

    console.error("Create order failed:", error);

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
}

export async function list(_req: Request, res: Response) {
  try {
    const orders = await orderService.getOrders();
    return res.status(200).json(orders);
  } catch {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch {
    return res.status(500).json({ message: "Failed to fetch order" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  const id = req.params.id;
  const { status } = req.body;

  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  try {
    const order = await orderService.updateOrderStatus(id, status);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch {
    return res.status(500).json({ message: "Failed to update order status" });
  }
}
