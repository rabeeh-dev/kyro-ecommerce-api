import "dotenv/config";
import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";

const PORT = Number(process.env.PORT) || 3001;

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
