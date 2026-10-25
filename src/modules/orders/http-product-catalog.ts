
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
  async getProductsByIds(ids: string[]): Promise<ProductDetails[]> {
    const baseUrl = process.env.PRODUCT_SERVICE_URL;

    if (!baseUrl) {
      throw new Error("PRODUCT_SERVICE_URL is not configured");
    }

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
