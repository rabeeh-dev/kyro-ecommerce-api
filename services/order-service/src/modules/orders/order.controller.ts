import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as orderService from "./order.service.js";

export async function create(req: Request, res: Response) {
  try {
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
        item.quantity > 0,
    );

    if (!validItems) {
      return res.status(400).json({
        message: "Each item needs a productId and positive integer quantity",
      });
    }

    const order = await orderService.createOrder({
      customerName: customerName.trim(),
      items,
    });

    return res.status(201).json(order);
  } catch (error) {
    // In services/order-service/src/modules/orders/order.controller.ts catch block:
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient inventory stock for one or more items",
      });
    }

    if (
      error instanceof Error &&
      (error.message === "INVENTORY_SERVICE_UNAVAILABLE" ||
        error.message === "PRODUCT_SERVICE_UNAVAILABLE")
    ) {
      return res.status(503).json({
        message: "A dependent service is temporarily unavailable. Please try again later.",
      });
    }
}
}

export async function list(_req: Request, res: Response) {
  try {
    const orders = await orderService.getOrders();
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await orderService.updateOrderStatus(id, status);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Failed to update order status:", error);
    return res.status(500).json({ message: "Failed to update order status" });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await orderService.deleteOrder(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return res.status(500).json({ message: "Failed to delete order" });
  }
}

