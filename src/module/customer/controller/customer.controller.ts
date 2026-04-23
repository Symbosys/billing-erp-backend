import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
} from "../validation/customer.validation.js";

// ─────────────────────────────────────────────
// Helper: get first Zod error message
// ─────────────────────────────────────────────
function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

// ─────────────────────────────────────────────
// POST /customer
// Create a new customer
// ─────────────────────────────────────────────
export const createCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const customer = await prisma.customer.create({
      data: parsed.data,
    });

    return SuccessResponse(
      res,
      "Customer created successfully",
      { customer },
      statusCode.Created
    );
  }
);

// ─────────────────────────────────────────────
// GET /customer
// Get all customers
// ─────────────────────────────────────────────
export const getAllCustomers = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return SuccessResponse(res, "Customers fetched successfully", {
      count: customers.length,
      customers,
    });
  }
);

// ─────────────────────────────────────────────
// GET /customer/:id
// Get a single customer by ID
// ─────────────────────────────────────────────
export const getCustomerById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = customerIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return next(new ErrorResponse("Customer not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Customer fetched successfully", { customer });
  }
);

// ─────────────────────────────────────────────
// PATCH /customer/:id
// Update a customer
// ─────────────────────────────────────────────
export const updateCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = customerIdSchema.safeParse(req.params);
    const parsedBody = updateCustomerSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return next(new ErrorResponse("Customer not found", statusCode.Not_Found));
    }

    // Filter out undefined values to satisfy exactOptionalPropertyTypes: true
    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Customer updated successfully", { customer: updatedCustomer });
  }
);

// ─────────────────────────────────────────────
// DELETE /customer/:id
// Delete a customer permanently
// ─────────────────────────────────────────────
export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = customerIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return next(new ErrorResponse("Customer not found", statusCode.Not_Found));
    }

    await prisma.customer.delete({ where: { id } });

    return SuccessResponse(res, "Customer deleted successfully");
  }
);
