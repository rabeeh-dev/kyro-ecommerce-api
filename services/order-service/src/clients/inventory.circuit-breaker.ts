import CircuitBreaker from "opossum";
import { GrpcInventoryCatalog } from "./grpc-inventory.client.js";

const inventoryCatalog = new GrpcInventoryCatalog();

async function checkStockWithGrpc(productId: string, quantity: number) {
  return await inventoryCatalog.checkStock(productId, quantity);
}

const breakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

export const inventoryBreaker = new CircuitBreaker(checkStockWithGrpc, breakerOptions);

inventoryBreaker.on("open", () => {
  console.warn("⚠️ Circuit Breaker OPEN for Inventory Service");
});

inventoryBreaker.on("close", () => {
  console.log("✅ Circuit Breaker CLOSED for Inventory Service");
});
