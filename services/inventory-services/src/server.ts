import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/db.js";
import inventoryRoutes from "./modules/inventory/inventory.route.js";
import { startGrpcServer } from "./grpc/grpc.server.js";
import { startInventoryConsumer } from "./rabbitmq/rabbitmq-consumer.js";

const app = express();
const PORT = Number(process.env.PORT) || 3002;
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

async function startServer() {
  try {
    await connectDatabase();

    // Start gRPC server
    await startGrpcServer(GRPC_PORT);

    // Start RabbitMQ Saga Consumer
    await startInventoryConsumer();

    // Start HTTP server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Inventory HTTP Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Inventory Service:", error);
    process.exit(1);
  }
}

startServer();
