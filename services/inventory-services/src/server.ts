import "dotenv/config";
import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { startGrpcServer } from "./servers/grpc.server.js";
import { startInventoryConsumer } from "./brokers/rabbitmq.consumer.js";

const PORT = Number(process.env.PORT) || 3002;
const GRPC_PORT = Number(process.env.GRPC_PORT) || 50051;

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
