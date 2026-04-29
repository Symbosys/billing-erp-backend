import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} from "../validation/product.validation.js";

// ─────────────────────────────────────────────
// Helper: get first Zod error message
// ─────────────────────────────────────────────
function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

// ─────────────────────────────────────────────
// POST /product
// Create a new product
// ─────────────────────────────────────────────
export const createProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const product = await prisma.product.create({
      data: parsed.data as any,
    });

    return SuccessResponse(
      res,
      "Product created successfully",
      { product },
      statusCode.Created
    );
  }
);

// ─────────────────────────────────────────────
// GET /product
// Get all products
// ─────────────────────────────────────────────
export const getAllProducts = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return SuccessResponse(res, "Products fetched successfully", {
      count: products.length,
      products,
    });
  }
);

// ─────────────────────────────────────────────
// GET /product/:id
// Get a single product by ID
// ─────────────────────────────────────────────
export const getProductById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = productIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return next(new ErrorResponse("Product not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Product fetched successfully", { product });
  }
);

// ─────────────────────────────────────────────
// PATCH /product/:id
// Update a product
// ─────────────────────────────────────────────
export const updateProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = productIdSchema.safeParse(req.params);
    const parsedBody = updateProductSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    // Check if product exists
    const productExists = await prisma.product.findUnique({ where: { id } });
    if (!productExists) {
      return next(new ErrorResponse("Product not found", statusCode.Not_Found));
    }

    // Filter out undefined values to satisfy exactOptionalPropertyTypes: true
    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Product updated successfully", { product });
  }
);

// ─────────────────────────────────────────────
// DELETE /product/:id
// Delete a product permanently
// ─────────────────────────────────────────────
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = productIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return next(new ErrorResponse("Product not found", statusCode.Not_Found));
    }

    await prisma.product.delete({ where: { id } });

    return SuccessResponse(res, "Product deleted successfully");
  }
);
