import amqp from "amqplib";
import { notificationService, OrderNotificationPayload } from "../modules/notifications/notification.service.js";

export async function startNotificationConsumer(): Promise<void> {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";
  const queue = "order_notifications";

  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: true });
    console.log(`Notification Service waiting for messages in [${queue}]...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const orderData: OrderNotificationPayload = JSON.parse(msg.content.toString());
          await notificationService.sendOrderConfirmation(orderData);
          channel.ack(msg);
        } catch (error) {
          console.error("Failed to process order notification message:", error);
          channel.nack(msg, false, false);
        }
      }
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed in Notification Service. Reconnecting in 5s...");
      setTimeout(startNotificationConsumer, 5000);
    });

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error in Notification Service:", err.message);
    });
  } catch (error) {
    console.error("Notification Service RabbitMQ connection failed. Retrying in 5s...", error);
    setTimeout(startNotificationConsumer, 5000);
  }
}
