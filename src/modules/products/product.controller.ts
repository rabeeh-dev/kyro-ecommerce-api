import type { Request, Response } from "express";
import mongoose from "mongoose";
import * as productService from "./product.service.js";

export async function create(req: Request, res: Response) {
  try {
    const { name, description, price, stock } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      (stock !== undefined &&
        (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0))
    ) {
      return res.status(400).json({
        message: "Invalid product data",
      });
    }

    const product = await productService.createProduct({
      name,
      description,
      price,
      stock: stock ?? 0,
    });

    return res.status(201).json(product);
  } catch {
    return res.status(500).json({
      message: "Failed to create product",
    });
  }
}

export async function list(_req: Request, res: Response) {
  try {
    const products = await productService.getProducts();
    return res.status(200).json(products);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch products",
    });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch {
    return res.status(500).json({
      message: "Failed to fetch product",
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const allowedFields = ["name", "description", "price", "stock"];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid field to update",
      });
    }

    if (
      ("name" in updates &&
        (typeof updates.name !== "string" || !updates.name.trim())) ||
      ("description" in updates &&
        (typeof updates.description !== "string" ||
          !updates.description.trim())) ||
      ("price" in updates &&
        (typeof updates.price !== "number" ||
          !Number.isFinite(updates.price) ||
          updates.price < 0)) ||
      ("stock" in updates &&
        (typeof updates.stock !== "number" ||
          !Number.isInteger(updates.stock) ||
          updates.stock < 0))
    ) {
      return res.status(400).json({
        message: "Invalid product data",
      });
    }

    const product = await productService.updateProduct(id, updates);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json(product);
  } catch {
    return res.status(500).json({
      message: "Failed to update product",
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await productService.deleteProduct(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch {
    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
}
