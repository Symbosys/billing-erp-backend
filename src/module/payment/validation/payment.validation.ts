import { z } from "zod";

export const createPaymentSchema = z.object({
  billId: z.string().min(1, "Bill ID is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const paymentIdSchema = z.object({
  id: z.string().min(1, "Payment ID is required"),
});
