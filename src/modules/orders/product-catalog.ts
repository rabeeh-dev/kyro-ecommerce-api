
export type ProductDetails = {
  id: string;
  name: string;
  price: number;
};

export interface ProductCatalog {
  getProductsByIds(ids: string[]): Promise<ProductDetails[]>;
}

