// services/order-service/src/modules/orders/adapters/inventory-client.ts
import CircuitBreaker from "opossum";
import { GrpcInventoryCatalog } from "./grpc-inventory-catalog.js";

const inventoryCatalog = new GrpcInventoryCatalog();

export class InventoryServiceUnavailableError extends Error {
  constructor(message = "INVENTORY_SERVICE_UNAVAILABLE") {
    super(message);
    this.name = "InventoryServiceUnavailableError";
  }
}

async function checkStockWithGrpc(productId: string, quantity: number): Promise<boolean> {
  return await inventoryCatalog.checkStock(productId, quantity);
}

const breakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

export const inventoryBreaker = new CircuitBreaker(checkStockWithGrpc, breakerOptions);

inventoryBreaker.on("open", () => {
  console.warn("⚠️ [CIRCUIT BREAKER] Inventory service circuit opened!");
});

inventoryBreaker.on("halfOpen", () => {
  console.info("🔄 [CIRCUIT BREAKER] Inventory service circuit half-open, testing health...");
});

inventoryBreaker.on("close", () => {
  console.info("✅ [CIRCUIT BREAKER] Inventory service circuit closed and healthy.");
});

// Wrapper function with clean return type and error propagation
export async function checkInventoryStock(productId: string, quantity: number): Promise<boolean> {
  try {
    return await inventoryBreaker.fire(productId, quantity);
  } catch (error) {
    console.error(`Inventory check failed for product ${productId}:`, error);
    throw new InventoryServiceUnavailableError();
  }
}