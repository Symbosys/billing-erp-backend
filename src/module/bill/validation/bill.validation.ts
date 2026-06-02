import { z } from "zod";

export const createBillSchema = z.object({
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    price: z.number().positive("Price must be a positive number"),
  })).min(1, "At least one item is required"),
  totalAmount: z.number().nonnegative("Total amount cannot be negative"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "OTHER"] as const),
  orderType: z.enum(["DINE_IN", "DELIVERY", "PICK_UP"] as const).optional().default("DINE_IN"),
  tableId: z.string().optional().nullable(),
  guestsCount: z.coerce.number().int().positive().optional().default(1),
  billStatus: z.enum(["PENDING", "PAID", "CANCELLED"] as const).optional().default("PENDING"),
  kotStatus: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"] as const).optional().default("PENDING"),
  isBogo: z.boolean().optional().default(false),
  isComplimentary: z.boolean().optional().default(false),
  waiterName: z.string().optional().nullable(),
});

export const billIdSchema = z.object({
  id: z.string().min(1, "Bill ID is required"),
});

