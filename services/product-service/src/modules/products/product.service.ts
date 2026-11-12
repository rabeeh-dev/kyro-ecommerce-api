import { Product } from "./product.model.js";
import { redisClient } from '../../clients/redis.client.js';

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

export async function getProductById(productId: string) {
  const cacheKey = `product:${productId}`;

  // 1. Check Cache
  const cachedData = await redisClient.get(cacheKey);
  
  // 2. Cache Hit: Return immediately!
  if (cachedData) {
    console.log(`⚡ CACHE HIT for Product: ${productId}`);
    return JSON.parse(cachedData);
  }

  // 3. Cache Miss: Query MongoDB
  console.log(`🐢 CACHE MISS for Product: ${productId}. Hitting MongoDB...`);
  const product = await Product.findById(productId);
  
  if (!product) return null;

  // 4. Hydrate Cache: Save to Redis with a 1-hour expiration
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));

  return product;
}

export async function updateProduct(
  id: string,
  data: Record<string, unknown>
) {
  const updatedProduct = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (updatedProduct) {
    // 🚨 CACHE INVALIDATION 🚨
    // Wipe the old data from Redis so the next GET request fetches the fresh data
    await redisClient.del(`product:${id}`);
    console.log(`🗑️ CACHE CLEARED for Updated Product: ${id}`);
  }

  return updatedProduct;
}


export async function deleteProduct(id: string) {
  return Product.findByIdAndDelete(id);
}