import express  from "express";
import orderRoutes from "./modules/orders/order.route.js";

const app = express()

app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API is running",
  });
});

app.use("/api/orders", orderRoutes);

export default app;