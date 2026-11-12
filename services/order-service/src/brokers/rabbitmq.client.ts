import amqp from "amqplib";

export class RabbitMQPublisher {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || "amqp://admin:admin@rabbitmq:5672";
  }

  private async getChannel(): Promise<amqp.Channel> {
    if (!this.connection) {
      this.connection = await amqp.connect(this.url);

      this.connection.on("close", () => {
        this.connection = null;
        this.channel = null;
      });
      this.connection.on("error", () => {
        this.connection = null;
        this.channel = null;
      });
    }

    if (!this.channel) {
      this.channel = await this.connection.createChannel();
      this.channel.on("close", () => {
        this.channel = null;
      });
    }

    return this.channel;
  }

  async publish(exchange: string, routingKey: string, message: unknown) {
    try {
      const channel = await this.getChannel();
      await channel.assertExchange(exchange, "topic", { durable: true });
      channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
      console.log(`🚀 [EVENT PUBLISHED] Event sent to exchange '${exchange}' with routing key '${routingKey}'`);
    } catch (error) {
      console.error(`Failed to publish to exchange ${exchange}:`, error);
    }
  }

  async publishOrderCreated(orderData: unknown) {
    try {
      const channel = await this.getChannel();
      const queue = "order_notifications";

      await channel.assertQueue(queue, { durable: true });
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(orderData)));
      console.log(`🚀 [EVENT PUBLISHED] Order sent to RabbitMQ`);
    } catch (error) {
      console.error("Failed to publish to RabbitMQ:", error);
    }
  }
}
