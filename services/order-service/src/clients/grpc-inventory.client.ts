import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

export interface InventoryDetails {
  id: string;
  productId: string;
  sku: string;
  stock: number;
  reserved: number;
  availableStock: number;
  location: string;
}

export interface InventoryCatalog {
  getInventory(productIdOrId: string): Promise<InventoryDetails | null>;
  checkStock(productId: string, quantity: number): Promise<boolean>;
}

function getProtoPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "protos/inventory.proto"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../protos/inventory.proto"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../protos/inventory.proto"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../protos/inventory.proto"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error("inventory.proto file not found for gRPC client");
}

type ProtoGrpcType = {
  inventory: {
    InventoryService: grpc.ServiceClientConstructor;
  };
};

export class GrpcInventoryCatalog implements InventoryCatalog {
  private client: any;
  private target: string;

  constructor(target?: string) {
    this.target = target || process.env.INVENTORY_GRPC_URL || "localhost:50051";

    const packageDefinition = protoLoader.loadSync(getProtoPath(), {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;

    this.client = new proto.inventory.InventoryService(
      this.target,
      grpc.credentials.createInsecure()
    );
  }

  async getInventory(productIdOrId: string): Promise<InventoryDetails | null> {
    return new Promise((resolve, reject) => {
      this.client.GetInventory(
        { product_id: productIdOrId },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            if (error.code === grpc.status.NOT_FOUND) {
              return resolve(null);
            }
            return reject(new Error(`GRPC_INVENTORY_ERROR: ${error.message}`));
          }

          if (!response) {
            return resolve(null);
          }

          const stock = Number(response.stock) || 0;
          const reserved = Number(response.reserved) || 0;

          resolve({
            id: response.id,
            productId: response.product_id,
            sku: response.sku,
            stock,
            reserved,
            availableStock: Number(response.available_stock) ?? Math.max(0, stock - reserved),
            location: response.location,
          });
        }
      );
    });
  }

  async checkStock(productId: string, quantity: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.CheckStock(
        { product_id: productId, quantity },
        (error: grpc.ServiceError | null, response: any) => {
          if (error) {
            return reject(new Error(`GRPC_INVENTORY_ERROR: ${error.message}`));
          }

          if (!response) {
            return resolve(false);
          }

          resolve(Boolean(response.is_available));
        }
      );
    });
  }
}
