import { KafkaConsumerService } from "./adapters/kafka-consumer";

const analyticsConsumer = new KafkaConsumerService();

async function bootstrap() {
  try {
    await analyticsConsumer.start();
  } catch (error) {
    console.error("Failed to start Analytics Consumer:", error);
    process.exit(1);
  }
}

bootstrap();