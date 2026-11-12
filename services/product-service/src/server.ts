import "dotenv/config";
import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { connectRedis } from './clients/redis.client.js';

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Product Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Product Service:", error);
    process.exit(1);
  }
}

startServer();
