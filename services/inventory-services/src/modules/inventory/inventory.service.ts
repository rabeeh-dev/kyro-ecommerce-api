import mongoose from "mongoose";
import { Inventory } from "./inventory.model.js";

type CreateInventoryInput = {
  productId: string;
  sku?: string;
  stock: number;
  reserved?: number;
  location?: string;
};

type UpdateInventoryInput = Partial<{
  stock: number;
  reserved: number;
  location: string;
  sku: string;
}>;

export async function createInventory(data: CreateInventoryInput) {
  return Inventory.create({
    productId: data.productId,
    sku: data.sku,
    stock: data.stock,
    reserved: data.reserved ?? 0,
    location: data.location ?? "Main-Warehouse",
  });
}

export async function getAllInventory() {
  return Inventory.find().sort({ createdAt: -1 });
}

export async function getInventoryById(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  // Find either by Inventory _id OR by productId
  const inventory = await Inventory.findById(id);
  if (inventory) {
    return inventory;
  }

  return Inventory.findOne({ productId: id });
}

export async function getInventoryByProductId(productId: string) {
  if (!mongoose.isValidObjectId(productId)) {
    return null;
  }
  return Inventory.findOne({ productId });
}

export async function updateInventory(id: string, updates: UpdateInventoryInput) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  // Update by _id first, if not found try by productId
  const updated = await Inventory.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (updated) {
    return updated;
  }

  return Inventory.findOneAndUpdate({ productId: id }, updates, {
    new: true,
    runValidators: true,
  });
}

export async function deleteInventory(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const deleted = await Inventory.findByIdAndDelete(id);
  if (deleted) {
    return deleted;
  }

  return Inventory.findOneAndDelete({ productId: id });
}
