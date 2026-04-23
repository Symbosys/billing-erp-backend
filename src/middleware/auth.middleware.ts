import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.utils.js";
import { ErrorResponse } from "../utils/response.utils.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "./error.middleware.js";

interface JwtPayload {
  id: string;
}

export const protect = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    const decoded = verifyToken(token) as JwtPayload;

    if (!decoded || !decoded.id) {
      return next(new ErrorResponse("Not authorized to access this route", 401));
    }

    const user = await prisma.login.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return next(new ErrorResponse("User not found. Please log in again.", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

/**
 * Grant access to specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user?.role || "unknown"} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
