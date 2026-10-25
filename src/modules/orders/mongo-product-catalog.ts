
import { Product } from "../products/product.model.js";
import type {
  ProductCatalog,
  ProductDetails,
} from "./product-catalog.js";

export class MongoProductCatalog implements ProductCatalog {
  async getProductsByIds(ids: string[]): Promise<ProductDetails[]> {
    const products = await Product.find({
      _id: { $in: ids },
    });

    return products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
    }));
  }
}
