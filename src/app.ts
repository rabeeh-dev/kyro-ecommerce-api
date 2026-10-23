import express  from "express";
import productRoutes from "./modules/products/product.route";

const app = express()

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API is running",
  });
});

app.use("/api/products", productRoutes);

export default app;