import { startNotificationConsumer } from "./brokers/rabbitmq.consumer.js";

async function bootstrap() {
  console.log("🚀 Starting Notification Service...");
  await startNotificationConsumer();
}

bootstrap();
