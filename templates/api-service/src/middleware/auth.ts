import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || Array.isArray(authHeader)) {
    return res.status(401).json({ error: "Access token required" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userIdCandidate =
      typeof decoded === "object" && decoded !== null && "userId" in decoded
        ? (decoded as Record<string, unknown>).userId
        : undefined;

    const userId = Number(userIdCandidate);
    if (Number.isNaN(userId)) {
      return res.status(403).json({ error: "Invalid token payload" });
    }

    req.userId = userId;
    return next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
