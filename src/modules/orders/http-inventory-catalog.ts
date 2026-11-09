import type {
  InventoryCatalog,
  InventoryDetails,
} from "./inventory-catalog.js";

type InventoryApiResponse = {
  _id: string;
  productId: string;
  sku?: string;
  stock: number;
  reserved: number;
  location?: string;
};

export class HttpInventoryCatalog implements InventoryCatalog {
  private baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private getBaseUrl(): string {
    const url = this.baseUrl || process.env.INVENTORY_SERVICE_URL;
    if (!url) {
      throw new Error("INVENTORY_SERVICE_URL is not configured");
    }
    return url;
  }

  async getInventory(productIdOrId: string): Promise<InventoryDetails | null> {
    const url = this.getBaseUrl();

    const response = await fetch(
      `${url}/api/inventory/${encodeURIComponent(productIdOrId)}`
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("INVENTORY_SERVICE_UNAVAILABLE");
    }

    const data = (await response.json()) as InventoryApiResponse;

    const stock = Number(data.stock) || 0;
    const reserved = Number(data.reserved) || 0;

    return {
      id: data._id,
      productId: data.productId,
      sku: data.sku,
      stock,
      reserved,
      availableStock: Math.max(0, stock - reserved),
      location: data.location,
    };
  }

  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const item = await this.getInventory(productId);
    if (!item) {
      return false;
    }
    return item.availableStock >= quantity;
  }
}
