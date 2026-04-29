import { z } from "zod";

export const createStockHistorySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  change: z.number(),
  type: z.enum(["IN", "OUT"]),
});

export const updateStockHistorySchema = createStockHistorySchema.partial();

export const stockHistoryIdSchema = z.object({
  id: z.string().min(1, "StockHistory ID is required"),
});
