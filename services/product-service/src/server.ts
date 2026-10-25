
import "dotenv/config";
import express from "express";
import { connectDatabase } from "./config/db.js";
import productRoutes from "./modules/products/product.route.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "product-service",
    status: "healthy",
  });
});

app.use("/api/products", productRoutes);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Product Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Product Service:", error);
    process.exit(1);
  }
}

startServer();
