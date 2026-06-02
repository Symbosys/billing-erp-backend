import { z } from "zod";

export const createTableSchema = z.object({
  tableName: z.string().min(1, "Table name is required").trim(),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
  available: z.boolean().optional().default(true),
  status: z.enum(["Active", "Inactive"] as const).optional().default("Active"),
});

export const updateTableSchema = z.object({
  tableName: z.string().min(1, "Table name is required").trim().optional(),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer").optional(),
  available: z.boolean().optional(),
  status: z.enum(["Active", "Inactive"] as const).optional(),
});

export const tableIdSchema = z.object({
  id: z.string().min(1, "Table ID is required"),
});
