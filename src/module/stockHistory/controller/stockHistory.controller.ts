import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createStockHistorySchema,
  updateStockHistorySchema,
  stockHistoryIdSchema,
} from "../validation/stockHistory.validation.js";

function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

export const createStockHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createStockHistorySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const stockHistory = await prisma.stockHistory.create({
      data: parsed.data,
    });

    return SuccessResponse(
      res,
      "StockHistory created successfully",
      { stockHistory },
      statusCode.Created
    );
  }
);

export const getAllStockHistories = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stockHistories = await prisma.stockHistory.findMany();

    return SuccessResponse(res, "StockHistories fetched successfully", {
      count: stockHistories.length,
      stockHistories,
    });
  }
);

export const getStockHistoryById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = stockHistoryIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const stockHistory = await prisma.stockHistory.findUnique({
      where: { id },
    });

    if (!stockHistory) {
      return next(new ErrorResponse("StockHistory not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "StockHistory fetched successfully", { stockHistory });
  }
);

export const updateStockHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = stockHistoryIdSchema.safeParse(req.params);
    const parsedBody = updateStockHistorySchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    const existingStockHistory = await prisma.stockHistory.findUnique({ where: { id } });
    if (!existingStockHistory) {
      return next(new ErrorResponse("StockHistory not found", statusCode.Not_Found));
    }

    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedStockHistory = await prisma.stockHistory.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "StockHistory updated successfully", { stockHistory: updatedStockHistory });
  }
);

export const deleteStockHistory = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = stockHistoryIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const stockHistory = await prisma.stockHistory.findUnique({ where: { id } });
    if (!stockHistory) {
      return next(new ErrorResponse("StockHistory not found", statusCode.Not_Found));
    }

    await prisma.stockHistory.delete({ where: { id } });

    return SuccessResponse(res, "StockHistory deleted successfully");
  }
);
