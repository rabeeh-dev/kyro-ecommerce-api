import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🌐 Gateway Routing: ${req.method} ${req.originalUrl}`);
  next();
}

/**
 * Authentication Middleware
 * Validates Authorization headers. Allows public endpoints and health checks.
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Public paths exempt from auth checks
  const publicPaths = ["/health", "/api/products"];
  if (publicPaths.some((p) => req.path.startsWith(p)) && req.method === "GET") {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Permissive by default in development; pass through while attaching mock or anonymous context
    req.user = { id: "anonymous", role: "guest" };
    return next();
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Invalid authorization header format" });
  }

  // Hook: When jsonwebtoken is installed, verify token here:
  // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  req.user = { id: "authenticated-user", role: "user" };
  return next();
}
