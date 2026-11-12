import { Kafka, Producer } from "kafkajs";

export class KafkaPublisher {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "order-service",
      brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
    this.producer = this.kafka.producer();
  }

  private async connect() {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
      console.log("✅ Order Service connected to Kafka");
    }
  }

  async streamOrderEvent(orderData: any) {
    try {
      await this.connect();
      const topic = "order-events";

      await this.producer.send({
        topic,
        messages: [
          {
            key: orderData._id ? orderData._id.toString() : "new-order",
            value: JSON.stringify(orderData),
          },
        ],
      });

      console.log(`📡 [EVENT STREAMED] Order ${orderData._id} added to Kafka topic: ${topic}`);
    } catch (error) {
      console.error("Failed to stream to Kafka:", error);
    }
  }
}
