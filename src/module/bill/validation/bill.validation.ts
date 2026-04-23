import { z } from "zod";

export const createBillSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  items: z.array(z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
    price: z.number().positive("Price must be a positive number"),
  })).min(1, "At least one item is required"),
  totalAmount: z.number().nonnegative("Total amount cannot be negative"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "OTHER"] as const),
});

export const billIdSchema = z.object({
  id: z.string().min(1, "Bill ID is required"),
});
