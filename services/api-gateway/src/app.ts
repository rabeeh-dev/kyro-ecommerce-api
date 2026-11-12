import express from "express";
import cors from "cors";
import { requestLogger, authMiddleware } from "./middlewares/auth.middleware.js";
import { gatewayRoutes } from "./routes/gateway.routes.js";

export const app = express();

// Global Middlewares
app.use(cors());
app.use(requestLogger);
app.use(authMiddleware);

// Gateway Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "Gateway is alive" });
});

// Proxied Routes
app.use(gatewayRoutes);
