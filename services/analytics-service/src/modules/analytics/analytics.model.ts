import mongoose, { Schema } from "mongoose";

const orderMetricSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      default: "Anonymous",
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    itemCount: {
      type: Number,
      required: true,
      default: 1,
    },
    eventTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const OrderMetric = mongoose.model("OrderMetric", orderMetricSchema);
