import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createBillSchema,
  billIdSchema,
} from "../validation/bill.validation.js";

/**
 * Helper: Extract first error message from Zod
 */
const firstZodError = (error: any): string => error.issues?.[0]?.message ?? "Validation error";

// ─────────────────────────────────────────────
// POST /bill - Create a new bill (Atomic)
// ─────────────────────────────────────────────
export const createBill = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = createBillSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request);
  }

  const { customerId, items, totalAmount, paymentMethod } = parsed.data;

  // Verify customer existence
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new ErrorResponse("Customer not found", statusCode.Not_Found);
  }

  // Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stock: true },
      });

      if (!product) {
        throw new ErrorResponse(`Product not found: ${item.productId}`, statusCode.Not_Found);
      }

      if (product.stock < item.quantity) {
        throw new ErrorResponse(`Insufficient stock for "${product.name}"`, statusCode.Bad_Request);
      }

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return await tx.bill.create({
      data: {
        customerId,
        totalAmount,
        paymentMethod,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });
  });

  return SuccessResponse(res, "Bill generated", { bill: result }, statusCode.Created);
});

// ─────────────────────────────────────────────
// GET /bill - List all bills
// ─────────────────────────────────────────────
export const getAllBills = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [total, bills] = await Promise.all([
    prisma.bill.count(),
    prisma.bill.findMany({
      skip,
      take: limit,
      include: {
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return SuccessResponse(res, "Bills retrieved", {
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    bills,
  });
});

// ─────────────────────────────────────────────
// GET /bill/:id - Retrieve detailed bill
// ─────────────────────────────────────────────
export const getBillById = asyncHandler(async (req: Request, res: Response) => {
  const parsedParams = billIdSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request);
  }

  const bill = await prisma.bill.findUnique({
    where: { id: parsedParams.data.id },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (!bill) {
    throw new ErrorResponse("Bill not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Bill details retrieved", { bill });
});

// ─────────────────────────────────────────────
// DELETE /bill/:id - Safe Bill Deletion
// ─────────────────────────────────────────────
export const deleteBill = asyncHandler(async (req: Request, res: Response) => {
  const parsedParams = billIdSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request);
  }

  const { id } = parsedParams.data;

  const existingBill = await prisma.bill.findUnique({ where: { id } });
  if (!existingBill) {
    throw new ErrorResponse("Bill not found", statusCode.Not_Found);
  }

  await prisma.$transaction([
    prisma.billItem.deleteMany({ where: { billId: id } }),
    prisma.bill.delete({ where: { id } }),
  ]);

  return SuccessResponse(res, "Bill deleted");
});