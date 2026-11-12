import { OrderMetric } from "./analytics.model.js";

export class AnalyticsController {
  // In-memory aggregates for high-speed dashboard reads
  private inMemoryOrders: number = 0;
  private inMemoryRevenue: number = 0;

  recordOrder(amount: number) {
    this.inMemoryOrders += 1;
    this.inMemoryRevenue += amount;
  }

  async getMetrics() {
    try {
      const totalDocs = await OrderMetric.countDocuments();
      if (totalDocs > 0) {
        const [aggregate] = await OrderMetric.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$totalAmount" },
              totalOrders: { $sum: 1 },
            },
          },
        ]);

        return {
          totalOrders: aggregate?.totalOrders || 0,
          totalRevenue: aggregate?.totalRevenue || 0,
          source: "database",
        };
      }
    } catch {
      // Fall back to in-memory stats
    }

    return {
      totalOrders: this.inMemoryOrders,
      totalRevenue: this.inMemoryRevenue,
      source: "in-memory",
    };
  }
}

export const analyticsController = new AnalyticsController();
