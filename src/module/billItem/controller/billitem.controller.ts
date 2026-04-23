import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createBillItemSchema,
  updateBillItemSchema,
  billItemIdSchema,
} from "../validation/billItem.validation.js";

/**
 * Helper: Extract first error message from Zod
 */
const firstZodError = (error: any): string => error.issues?.[0]?.message ?? "Validation error";

/**
 * Helper: Recalculate and update the total amount of a bill
 */
async function syncBillTotal(tx: any, billId: string) {
  const items = await tx.billItem.findMany({ where: { billId } });
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  await tx.bill.update({
    where: { id: billId },
    data: { totalAmount },
  });
}

// ─────────────────────────────────────────────
// POST /billItem - Add item to existing bill
// ─────────────────────────────────────────────
export const createBillItem = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createBillItemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request);
  }

  const { billId, productId, quantity, price } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Checks
    const bill = await tx.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new ErrorResponse("Bill not found", statusCode.Not_Found);

    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new ErrorResponse("Product not found", statusCode.Not_Found);
    if (product.stock < quantity) throw new ErrorResponse("Insufficient stock", statusCode.Bad_Request);

    // 2. Create Item
    const item = await tx.billItem.create({
      data: { billId, productId, quantity, price },
    });

    // 3. Update Product Stock
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    // 4. Update Bill Total
    await syncBillTotal(tx, billId);

    return item;
  });

  return SuccessResponse(res, "Item added to bill", { item: result }, statusCode.Created);
});

// ─────────────────────────────────────────────
// GET /billItem - List all items
// ─────────────────────────────────────────────
export const getAllBillItems = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.billItem.findMany({
    include: { product: true, bill: true },
  });
  return SuccessResponse(res, "Items retrieved", { items });
});

// ─────────────────────────────────────────────
// PATCH /billItem/:id - Update quantity/price
// ─────────────────────────────────────────────
export const updateBillItem = asyncHandler(async (req: Request, res: Response) => {
  const parsedId = billItemIdSchema.safeParse(req.params);
  const parsedBody = updateBillItemSchema.safeParse(req.body);
  if (!parsedId.success || !parsedBody.success) {
    throw new ErrorResponse("Invalid input", statusCode.Bad_Request);
  }

  const { id } = parsedId.data;
  const { quantity, price } = parsedBody.data;

  const updatedItem = await prisma.$transaction(async (tx) => {
    const oldItem = await tx.billItem.findUnique({ where: { id } });
    if (!oldItem) throw new ErrorResponse("Item not found", statusCode.Not_Found);

    // If quantity is changing, adjust stock
    if (quantity !== undefined && quantity !== oldItem.quantity) {
      const stockDiff = quantity - oldItem.quantity; // Positive means we need more items
      
      const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
      if (!product) throw new ErrorResponse("Product not found", statusCode.Not_Found);
      if (product.stock < stockDiff) throw new ErrorResponse("Insufficient stock for update", statusCode.Bad_Request);

      await tx.product.update({
        where: { id: oldItem.productId },
        data: { stock: { decrement: stockDiff } },
      });
    }

    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;

    const item = await tx.billItem.update({
      where: { id },
      data: updateData,
    });

    await syncBillTotal(tx, item.billId);
    return item;
  });

  return SuccessResponse(res, "Item updated", { item: updatedItem });
});

// ─────────────────────────────────────────────
// DELETE /billItem/:id - Remove item and restore stock
// ─────────────────────────────────────────────
export const deleteBillItem = asyncHandler(async (req: Request, res: Response) => {
  const parsedId = billItemIdSchema.safeParse(req.params);
  if (!parsedId.success) throw new ErrorResponse("Invalid ID", statusCode.Bad_Request);

  const { id } = parsedId.data;

  await prisma.$transaction(async (tx) => {
    const item = await tx.billItem.findUnique({ where: { id } });
    if (!item) throw new ErrorResponse("Item not found", statusCode.Not_Found);

    // 1. Restore Stock
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });

    // 2. Delete Item
    await tx.billItem.delete({ where: { id } });

    // 3. Update Bill Total
    await syncBillTotal(tx, item.billId);
  });

  return SuccessResponse(res, "Item removed from bill");
});
