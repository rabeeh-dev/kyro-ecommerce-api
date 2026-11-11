import { Kafka, Consumer,Admin } from "kafkajs";

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private admin : Admin;
  // In-memory state for our simple analytics dashboard
  private totalRevenue: number = 0;
  private totalOrders: number = 0;

  constructor() {
    this.kafka = new Kafka({
      clientId: "analytics-service",
      brokers: [process.env.KAFKA_BROKERS || "kafka:9092"],
    });
    // The groupId is critical. If we restart the service, Kafka uses this ID 
    // to resume reading exactly where we left off!
    this.consumer = this.kafka.consumer({ groupId: "analytics-group" });
    this.admin = this.kafka.admin()
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

    // 2. Start the consumer normally
    await this.consumer.connect();
    console.log("✅ Analytics Service connected to Kafka");

    await this.consumer.subscribe({ topic: "order-events", fromBeginning: true });

    // This runs an infinite loop, processing events one by one as they arrive
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;
        
        const orderData = JSON.parse(message.value.toString());
        
        this.totalOrders += 1;
        // Assuming your orderData has a totalAmount field
        this.totalRevenue += (orderData.totalAmount || 0);

        console.log(`\n📊 [ANALYTICS UPDATE] New event on ${topic}!`);
        console.log(`📈 Total Orders to Date : ${this.totalOrders}`);
        console.log(`💰 Total Gross Revenue  : $${this.totalRevenue}`);
      },
    });
  }
}