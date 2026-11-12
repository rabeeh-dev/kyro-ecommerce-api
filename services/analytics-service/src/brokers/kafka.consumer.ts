import { Kafka, Consumer, Admin } from "kafkajs";
import { OrderMetric } from "../modules/analytics/analytics.model.js";
import { analyticsController } from "../modules/analytics/analytics.controller.js";

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private admin: Admin;

  constructor() {
    this.kafka = new Kafka({
      clientId: "analytics-service",
      brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
    });
    this.consumer = this.kafka.consumer({ groupId: "analytics-group" });
    this.admin = this.kafka.admin();
  }

  async start() {
    await this.admin.connect();

    const existingTopics = await this.admin.listTopics();
    if (!existingTopics.includes("order-events")) {
      await this.admin.createTopics({
        topics: [{ topic: "order-events" }],
      });
      console.log("✅ Created missing 'order-events' topic");
    }

    await this.admin.disconnect();

    await this.consumer.connect();
    console.log("✅ Analytics Service connected to Kafka");

    await this.consumer.subscribe({ topic: "order-events", fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

        const orderData = JSON.parse(message.value.toString());
        const totalAmount = orderData.totalAmount || 0;

        analyticsController.recordOrder(totalAmount);

        // Attempt persistence in Mongo if DB is reachable
        try {
          await OrderMetric.create({
            orderId: orderData._id ? orderData._id.toString() : "unknown",
            customerName: orderData.customerName || "Anonymous",
            totalAmount,
            itemCount: Array.isArray(orderData.items) ? orderData.items.length : 1,
            eventTimestamp: new Date(),
          });
        } catch {
          // In-memory stats already updated
        }

        const stats = await analyticsController.getMetrics();
        console.log(`\n📊 [ANALYTICS UPDATE] New event on ${topic}!`);
        console.log(`📈 Total Orders to Date : ${stats.totalOrders}`);
        console.log(`💰 Total Gross Revenue  : $${stats.totalRevenue}`);
      },
    });
  }
}
