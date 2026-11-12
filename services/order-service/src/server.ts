import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { startOrderSagaConsumer } from "./modules/orders/saga-consumer.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await startOrderSagaConsumer();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Order Service:", error);
    process.exit(1);
  }
}

startServer();
