import { z } from "zod";

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier ID is required"),
  total: z.number().positive("Total must be positive"),
});

export const updatePurchaseSchema = createPurchaseSchema.partial();

export const purchaseIdSchema = z.object({
  id: z.string().min(1, "Purchase ID is required"),
});
