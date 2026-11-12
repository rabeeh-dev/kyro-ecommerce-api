import express from "express";
import cors from "cors";
import productRoutes from "./modules/products/product.route.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "product-service",
    status: "healthy",
  });
});

app.use("/api/products", productRoutes);
