import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as inventoryService from "./inventory.service.js";

export async function create(req: Request, res: Response) {
  try {
    const { productId, sku, stock, reserved, location } = req.body;

    if (!productId || typeof productId !== "string" || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "A valid productId is required",
      });
    }

    if (
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      return res.status(400).json({
        message: "stock must be a non-negative integer",
      });
    }

    if (
      reserved !== undefined &&
      (typeof reserved !== "number" || !Number.isInteger(reserved) || reserved < 0)
    ) {
      return res.status(400).json({
        message: "reserved must be a non-negative integer",
      });
    }

    // Check if inventory for this productId already exists
    const existing = await inventoryService.getInventoryByProductId(productId);
    if (existing) {
      return res.status(409).json({
        message: "Inventory record for this product already exists",
      });
    }

    const inventory = await inventoryService.createInventory({
      productId,
      sku: typeof sku === "string" ? sku.trim() : undefined,
      stock,
      reserved: reserved ?? 0,
      location: typeof location === "string" ? location.trim() : undefined,
    });

    return res.status(201).json(inventory);
  } catch (error) {
    console.error("Failed to create inventory:", error);
    return res.status(500).json({
      message: "Failed to create inventory record",
    });
  }
}

export async function list(_req: Request, res: Response) {
  try {
    const records = await inventoryService.getAllInventory();
    return res.status(200).json(records);
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return res.status(500).json({
      message: "Failed to fetch inventory records",
    });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid ID parameter",
      });
    }

    const inventory = await inventoryService.getInventoryById(id);

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory record not found",
      });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("Failed to fetch inventory item:", error);
    return res.status(500).json({
      message: "Failed to fetch inventory record",
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid ID parameter",
      });
    }

    const allowedFields = ["stock", "reserved", "location", "sku"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid field to update (stock, reserved, location, sku)",
      });
    }

    if (
      "stock" in updates &&
      (typeof updates.stock !== "number" || !Number.isInteger(updates.stock) || updates.stock < 0)
    ) {
      return res.status(400).json({
        message: "stock must be a non-negative integer",
      });
    }

    if (
      "reserved" in updates &&
      (typeof updates.reserved !== "number" || !Number.isInteger(updates.reserved) || updates.reserved < 0)
    ) {
      return res.status(400).json({
        message: "reserved must be a non-negative integer",
      });
    }

    const updated = await inventoryService.updateInventory(id, updates);

    if (!updated) {
      return res.status(404).json({
        message: "Inventory record not found",
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update inventory:", error);
    return res.status(500).json({
      message: "Failed to update inventory record",
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid ID parameter",
      });
    }

    const deleted = await inventoryService.deleteInventory(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Inventory record not found",
      });
    }

    return res.status(200).json({
      message: "Inventory record deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete inventory:", error);
    return res.status(500).json({
      message: "Failed to delete inventory record",
    });
  }
}
