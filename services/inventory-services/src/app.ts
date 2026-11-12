import express from "express";
import cors from "cors";
import inventoryRoutes from "./modules/inventory/inventory.route.js";

export const app = express();
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "inventory-service",
    status: "healthy",
    grpcPort: GRPC_PORT,
  });
});

app.use("/api/inventory", inventoryRoutes);
