import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierIdSchema = z.object({
  id: z.string().min(1, "Supplier ID is required"),
});
