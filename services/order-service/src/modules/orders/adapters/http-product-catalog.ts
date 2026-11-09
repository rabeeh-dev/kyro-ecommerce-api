import type {
  ProductCatalog,
  ProductDetails,
} from "./product-catalog.js";

type ProductApiResponse = {
  _id: string;
  name: string;
  price: number;
};

export class HttpProductCatalog implements ProductCatalog {
  private baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private getBaseUrl(): string {
    const url = this.baseUrl || process.env.PRODUCT_SERVICE_URL;
    if (!url) {
      throw new Error("PRODUCT_SERVICE_URL is not configured");
    }
    return url;
  }

  async getProductsByIds(ids: string[]): Promise<ProductDetails[]> {
    const baseUrl = this.getBaseUrl();

    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(
          `${baseUrl}/api/products/${encodeURIComponent(id)}`
        );

        if (response.status === 404) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        if (!response.ok) {
          throw new Error("PRODUCT_SERVICE_UNAVAILABLE");
        }

        const product = (await response.json()) as ProductApiResponse;

        return {
          id: product._id,
          name: product.name,
          price: product.price,
        };
      })
    );

    return results;
  }
}
