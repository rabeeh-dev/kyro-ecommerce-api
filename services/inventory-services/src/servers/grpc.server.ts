import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as inventoryService from "../modules/inventory/inventory.service.js";

function getProtoPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "protos/inventory.proto"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../protos/inventory.proto"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../modules/inventory/protos/inventory.proto"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error("inventory.proto file not found");
}

const packageDefinition = protoLoader.loadSync(getProtoPath(), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const inventoryPackage = protoDescriptor.inventory;

async function getInventory(call: any, callback: any) {
  try {
    const { product_id } = call.request;

    const inventory = await inventoryService.getInventoryById(product_id);

    if (!inventory) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Inventory record not found",
      });
    }

    const stock = Number(inventory.stock) || 0;
    const reserved = Number(inventory.reserved) || 0;

    callback(null, {
      id: inventory._id.toString(),
      product_id: inventory.productId.toString(),
      sku: inventory.sku || "",
      stock,
      reserved,
      available_stock: Math.max(0, stock - reserved),
      location: inventory.location || "",
    });
  } catch (error) {
    console.error("gRPC getInventory error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : "Internal error",
    });
  }
}

async function checkStock(call: any, callback: any) {
  try {
    const { product_id, quantity } = call.request;

    const inventory = await inventoryService.getInventoryById(product_id);

    if (!inventory) {
      return callback(null, {
        product_id,
        is_available: false,
        available_stock: 0,
      });
    }

    const stock = Number(inventory.stock) || 0;
    const reserved = Number(inventory.reserved) || 0;
    const available = Math.max(0, stock - reserved);

    callback(null, {
      product_id,
      is_available: available >= Number(quantity),
      available_stock: available,
    });
  } catch (error) {
    console.error("gRPC checkStock error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : "Internal error",
    });
  }
}

async function updateStock(call: any, callback: any) {
  try {
    const { product_id, stock, reserved } = call.request;

    const updates: Record<string, number> = {};
    if (stock !== undefined) updates.stock = Number(stock);
    if (reserved !== undefined) updates.reserved = Number(reserved);

    const updated = await inventoryService.updateInventory(product_id, updates);

    if (!updated) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Inventory record not found",
      });
    }

    const s = Number(updated.stock) || 0;
    const r = Number(updated.reserved) || 0;

    callback(null, {
      id: updated._id.toString(),
      product_id: updated.productId.toString(),
      sku: updated.sku || "",
      stock: s,
      reserved: r,
      available_stock: Math.max(0, s - r),
      location: updated.location || "",
    });
  } catch (error) {
    console.error("gRPC updateStock error:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : "Internal error",
    });
  }
}

export function startGrpcServer(port: number = Number(process.env.GRPC_PORT) || 50051): Promise<grpc.Server> {
  return new Promise((resolve, reject) => {
    const server = new grpc.Server();

    server.addService(inventoryPackage.InventoryService.service, {
      GetInventory: getInventory,
      CheckStock: checkStock,
      UpdateStock: updateStock,
    });

    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, boundPort) => {
        if (err) {
          return reject(err);
        }
        console.log(`Inventory gRPC Server running on port ${boundPort}`);
        resolve(server);
      }
    );
  });
}
