import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
} from "../validation/supplier.validation.js";

function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

export const createSupplier = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createSupplierSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    return SuccessResponse(
      res,
      "Supplier created successfully",
      { supplier },
      statusCode.Created
    );
  }
);

export const getAllSuppliers = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const suppliers = await prisma.supplier.findMany();

    return SuccessResponse(res, "Suppliers fetched successfully", {
      count: suppliers.length,
      suppliers,
    });
  }
);

export const getSupplierById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = supplierIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return next(new ErrorResponse("Supplier not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Supplier fetched successfully", { supplier });
  }
);

export const updateSupplier = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = supplierIdSchema.safeParse(req.params);
    const parsedBody = updateSupplierSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    const existingSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!existingSupplier) {
      return next(new ErrorResponse("Supplier not found", statusCode.Not_Found));
    }

    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Supplier updated successfully", { supplier: updatedSupplier });
  }
);

export const deleteSupplier = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = supplierIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return next(new ErrorResponse("Supplier not found", statusCode.Not_Found));
    }

    await prisma.supplier.delete({ where: { id } });

    return SuccessResponse(res, "Supplier deleted successfully");
  }
);
