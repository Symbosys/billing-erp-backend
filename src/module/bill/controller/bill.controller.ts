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

  const { 
    customerId, 
    items, 
    totalAmount, 
    paymentMethod,
    orderType = "DINE_IN",
    tableId,
    guestsCount = 1,
    billStatus = "PENDING",
    kotStatus = "PENDING",
    isBogo = false,
    isComplimentary = false,
    waiterName
  } = parsed.data;

  // Verify customer existence if provided
  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new ErrorResponse("Customer not found", statusCode.Not_Found);
    }
  }

  // Verify table existence if DINE_IN and tableId is provided
  if (orderType === "DINE_IN" && tableId) {
    const table = await prisma.diningTable.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new ErrorResponse("Dining table not found", statusCode.Not_Found);
    }
  }

  // Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify stock and update inventory
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

    // 2. If Dine-In and table is selected, mark it occupied (available = false)
    if (orderType === "DINE_IN" && tableId) {
      await tx.diningTable.update({
        where: { id: tableId },
        data: { available: false },
      });
    }

    // 3. Generate KOT Number
    const kotCount = await tx.bill.count();
    const kotNo = (kotCount + 1).toString();

    // 4. Create the Bill
    return await tx.bill.create({
      data: {
        customerId: customerId || null,
        totalAmount,
        paymentMethod,
        orderType,
        tableId: tableId || null,
        guestsCount,
        billStatus,
        kotStatus,
        kotNo,
        isBogo,
        isComplimentary,
        waiterName: waiterName || null,
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
        table: true,
        items: { include: { product: true } },
      },
    });
  });

  return SuccessResponse(res, "Bill generated successfully", { bill: result }, statusCode.Created);
});

// ─────────────────────────────────────────────
// GET /bill - List all bills
// ─────────────────────────────────────────────
export const getAllBills = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (req.query.billStatus) {
    where.billStatus = req.query.billStatus as string;
  }
  if (req.query.kotStatus) {
    where.kotStatus = req.query.kotStatus as string;
  }
  if (req.query.orderType) {
    where.orderType = req.query.orderType as string;
  }

  const [total, bills] = await Promise.all([
    prisma.bill.count({ where }),
    prisma.bill.findMany({
      where,
      skip,
      take: limit,
      include: {
        customer: { select: { name: true, phone: true } },
        table: { select: { id: true, tableName: true } },
        items: { include: { product: true } },
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
    include: { 
      customer: true, 
      table: true,
      items: { include: { product: true } } 
    },
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

  await prisma.$transaction(async (tx) => {
    // If Dine-In table is occupied, make it available again
    if (existingBill.orderType === "DINE_IN" && existingBill.tableId) {
      await tx.diningTable.update({
        where: { id: existingBill.tableId },
        data: { available: true },
      });
    }

    await tx.billItem.deleteMany({ where: { billId: id } });
    await tx.bill.delete({ where: { id } });
  });

  return SuccessResponse(res, "Bill deleted");
});

// ─────────────────────────────────────────────
// PUT /bill/:id/kot-status - Update Kitchen Order Ticket Status
// ─────────────────────────────────────────────
export const updateKOTStatus = asyncHandler(async (req: Request, res: Response) => {
  const parsedParams = billIdSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request);
  }

  const { status } = req.body;
  if (!status) {
    throw new ErrorResponse("KOT status is required", statusCode.Bad_Request);
  }

  const { id } = parsedParams.data;
  const existingBill = await prisma.bill.findUnique({ where: { id } });
  if (!existingBill) {
    throw new ErrorResponse("Bill not found", statusCode.Not_Found);
  }

  const updatedBill = await prisma.$transaction(async (tx) => {
    const updated = await tx.bill.update({
      where: { id },
      data: { kotStatus: status },
      include: { customer: true, table: true, items: { include: { product: true } } }
    });

    // If KOT is cancelled, set table back to available
    if ((status === "CANCELLED") && existingBill.orderType === "DINE_IN" && existingBill.tableId) {
      await tx.diningTable.update({
        where: { id: existingBill.tableId },
        data: { available: true },
      });
    }

    return updated;
  });

  return SuccessResponse(res, "KOT status updated successfully", { bill: updatedBill });
});

// ─────────────────────────────────────────────
// PUT /bill/:id/settle - Settle and complete POS Order Bill
// ─────────────────────────────────────────────
export const settleBill = asyncHandler(async (req: Request, res: Response) => {
  const parsedParams = billIdSchema.safeParse(req.params);
  if (!parsedParams.success) {
    throw new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request);
  }

  const { paymentMethod } = req.body;
  if (!paymentMethod) {
    throw new ErrorResponse("Payment method is required to settle the bill", statusCode.Bad_Request);
  }

  const { id } = parsedParams.data;
  const existingBill = await prisma.bill.findUnique({ where: { id } });
  if (!existingBill) {
    throw new ErrorResponse("Bill not found", statusCode.Not_Found);
  }

  const settledBill = await prisma.$transaction(async (tx) => {
    const updated = await tx.bill.update({
      where: { id },
      data: { 
        billStatus: "PAID", 
        paymentMethod,
        kotStatus: "SERVED"
      },
      include: { customer: true, table: true, items: { include: { product: true } } }
    });

    // Settle frees up the table
    if (existingBill.orderType === "DINE_IN" && existingBill.tableId) {
      await tx.diningTable.update({
        where: { id: existingBill.tableId },
        data: { available: true },
      });
    }

    return updated;
  });

  return SuccessResponse(res, "Bill settled successfully", { bill: settledBill });
});