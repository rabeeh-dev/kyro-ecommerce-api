export type InventoryDetails = {
  id: string;
  productId: string;
  sku?: string;
  stock: number;
  reserved: number;
  availableStock: number;
  location?: string;
};

export interface InventoryCatalog {
  getInventory(productIdOrId: string): Promise<InventoryDetails | null>;
  checkStock(productId: string, quantity: number): Promise<boolean>;
}
