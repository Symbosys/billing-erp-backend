import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createTableSchema,
  updateTableSchema,
  tableIdSchema,
} from "../validation/diningTable.validation.js";

function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

export const createTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createTableSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const existing = await prisma.diningTable.findUnique({
      where: { tableName: parsed.data.tableName },
    });
    if (existing) {
      return next(new ErrorResponse("Table name must be unique", statusCode.Bad_Request));
    }

    const table = await prisma.diningTable.create({
      data: parsed.data,
    });

    return SuccessResponse(res, "Table created successfully", { table }, statusCode.Created);
  }
);

export const getAllTables = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const tables = await prisma.diningTable.findMany({
      orderBy: { tableName: "asc" },
    });

    return SuccessResponse(res, "Tables fetched successfully", {
      count: tables.length,
      tables,
    });
  }
);

export const getTableById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = tableIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    const table = await prisma.diningTable.findUnique({
      where: { id },
    });

    if (!table) {
      return next(new ErrorResponse("Table not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Table fetched successfully", { table });
  }
);

export const updateTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = tableIdSchema.safeParse(req.params);
    const parsedBody = updateTableSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    const existing = await prisma.diningTable.findUnique({ where: { id } });
    if (!existing) {
      return next(new ErrorResponse("Table not found", statusCode.Not_Found));
    }

    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    // If tableName changes, verify uniqueness
    if (updateData.tableName && updateData.tableName !== existing.tableName) {
      const nameConflict = await prisma.diningTable.findUnique({
        where: { tableName: updateData.tableName as string },
      });
      if (nameConflict) {
        return next(new ErrorResponse("Table name must be unique", statusCode.Bad_Request));
      }
    }

    const updatedTable = await prisma.diningTable.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Table updated successfully", { table: updatedTable });
  }
);

export const deleteTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = tableIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    const existing = await prisma.diningTable.findUnique({ where: { id } });
    if (!existing) {
      return next(new ErrorResponse("Table not found", statusCode.Not_Found));
    }

    await prisma.diningTable.delete({ where: { id } });
    return SuccessResponse(res, "Table deleted successfully");
  }
);
