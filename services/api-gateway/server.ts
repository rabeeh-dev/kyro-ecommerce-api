import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Allow your frontend to talk to this Gateway
app.use(cors());

// --- PROXY RULES ---
// The target URLs use the Docker internal container names!

app.use(
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || "http://order-service:3000",
    changeOrigin: true,
    pathFilter: "/api/orders",
  }),
);

app.use(
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || "http://product-service:3001",
    changeOrigin: true,
    pathFilter: "/api/products",
  }),
);

app.use(
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL || "http://inventory-service:3002",
    changeOrigin: true,
    pathFilter: "/api/inventory",
  }),
);

// A simple health check for the gateway itself
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Gateway is alive" });
});

app.listen(PORT, () => {
  console.log(`🚪 API Gateway is open on http://localhost:${PORT}`);
});
