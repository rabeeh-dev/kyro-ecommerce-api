import amqp from "amqplib";

async function startNotificationService() {
  // Use the Docker service name 'rabbitmq' to connect
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";

  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    const queue = "order_notifications";

    // assertQueue creates the queue if it doesn't exist.
    // durable: true means the queue survives a RabbitMQ crash.
    await channel.assertQueue(queue, { durable: true });

    console.log(`Notification Service waiting for messages in [${queue}]...`);

    // Start listening to the queue
    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const orderData = JSON.parse(msg.content.toString());

        console.log(
          `\n📧 [EMAIL SENT] Order Confirmation to: ${orderData.customerName}`,
        );
        console.log(`📦 Order Details:`, orderData.items);

        // CRITICAL: We must Acknowledge (ACK) the message.
        // This tells RabbitMQ "I successfully processed this, you can delete it now."
        channel.ack(msg);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "RabbitMQ connection failed. Retrying in 5 seconds...",
        error.message,
      );
    } else {
      console.error("RabbitMQ connection failed with an unknown error.");
    }
    // Auto-reconnect logic
    setTimeout(startNotificationService, 5000);
  }
}

startNotificationService();
