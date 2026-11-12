import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

export const gatewayRoutes = Router();

// Order Service Proxy
gatewayRoutes.use(
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || "http://order-service:3000",
    changeOrigin: true,
    pathFilter: "/api/orders",
  })
);

// Product Service Proxy
gatewayRoutes.use(
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || "http://product-service:3001",
    changeOrigin: true,
    pathFilter: "/api/products",
  })
);

// Inventory Service Proxy
gatewayRoutes.use(
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL || "http://inventory-service:3002",
    changeOrigin: true,
    pathFilter: "/api/inventory",
  })
);
