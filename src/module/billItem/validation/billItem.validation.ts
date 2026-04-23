import { z } from "zod";

export const createBillItemSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  price: z.number().positive("Price must be a positive number"),
});

export const updateBillItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
  price: z.number().positive("Price must be a positive number").optional(),
});

export const billItemIdSchema = z.object({
  id: z.string().min(1, "Bill Item ID is required"),
});
