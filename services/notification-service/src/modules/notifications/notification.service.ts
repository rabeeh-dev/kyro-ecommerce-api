import { mailer } from "../../config/mailer.js";

export interface OrderNotificationPayload {
  _id: string;
  customerName: string;
  totalAmount?: number;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export class NotificationService {
  async sendOrderConfirmation(orderData: OrderNotificationPayload): Promise<void> {
    const customer = orderData.customerName || "Customer";
    const orderId = orderData._id || "Unknown";
    const total = orderData.totalAmount !== undefined ? `$${orderData.totalAmount}` : "N/A";

    const itemsSummary = Array.isArray(orderData.items)
      ? orderData.items.map((i) => ` - ${i.productName} (x${i.quantity}) @ $${i.unitPrice}`).join("\n")
      : "No item details";

    const text = `Hello ${customer},\n\nThank you for your order!\nOrder ID: ${orderId}\nTotal: ${total}\n\nItems:\n${itemsSummary}\n\nBest regards,\nKyro Store Team`;

    await mailer.sendMail({
      to: `${customer.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      subject: `Order Confirmation #${orderId}`,
      text,
    });
  }
}

export const notificationService = new NotificationService();
