import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdSchema,
} from "../validation/purchase.validation.js";

function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

export const createPurchase = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createPurchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const purchase = await prisma.purchase.create({
      data: parsed.data,
    });

    return SuccessResponse(
      res,
      "Purchase created successfully",
      { purchase },
      statusCode.Created
    );
  }
);

export const getAllPurchases = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const purchases = await prisma.purchase.findMany();

    return SuccessResponse(res, "Purchases fetched successfully", {
      count: purchases.length,
      purchases,
    });
  }
);

export const getPurchaseById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = purchaseIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return next(new ErrorResponse("Purchase not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Purchase fetched successfully", { purchase });
  }
);

export const updatePurchase = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = purchaseIdSchema.safeParse(req.params);
    const parsedBody = updatePurchaseSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    const existingPurchase = await prisma.purchase.findUnique({ where: { id } });
    if (!existingPurchase) {
      return next(new ErrorResponse("Purchase not found", statusCode.Not_Found));
    }

    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Purchase updated successfully", { purchase: updatedPurchase });
  }
);

export const deletePurchase = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = purchaseIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const purchase = await prisma.purchase.findUnique({ where: { id } });
    if (!purchase) {
      return next(new ErrorResponse("Purchase not found", statusCode.Not_Found));
    }

    await prisma.purchase.delete({ where: { id } });

    return SuccessResponse(res, "Purchase deleted successfully");
  }
);
