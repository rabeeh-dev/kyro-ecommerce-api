import { KafkaConsumerService } from "./brokers/kafka.consumer.js";
import { connectDatabase } from "./config/db.js";

const analyticsConsumer = new KafkaConsumerService();

async function bootstrap() {
  try {
    await connectDatabase();
    await analyticsConsumer.start();
  } catch (error) {
    console.error("Failed to start Analytics Service:", error);
    process.exit(1);
  }
}

bootstrap();
