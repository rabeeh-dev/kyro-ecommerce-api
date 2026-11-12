import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://mongo:27017/kyro_analytics";

  try {
    await mongoose.connect(uri);
    console.log("✅ Analytics Service connected to MongoDB");
  } catch (error) {
    console.warn("⚠️ Analytics Service MongoDB connection skipped/failed:", (error as Error).message);
    // Graceful continuation so analytics can also function with in-memory fallback
  }
}
