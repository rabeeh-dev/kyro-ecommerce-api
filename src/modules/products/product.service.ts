import { Product } from "./product.model.js";

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  stock: number;
}) {
  return Product.create(data);
}

export async function getProducts() {
  return Product.find().sort({ createdAt: -1 });
}

export async function getProductById(id: string) {
  return Product.findById(id);
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>
) {
  return Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id);
}