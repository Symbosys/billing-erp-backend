import { z } from "zod";

// ─────────────────────────────────────────────
// Product Create Schema
// ─────────────────────────────────────────────
export const createProductSchema = z.object({
  name: z
    .string({ message: "Product name is required" })
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must not exceed 100 characters")
    .trim(),
  
  price: z.coerce
    .number({ message: "Price is required" })
    .positive("Price must be a positive number"),

  stock: z.coerce
    .number({ message: "Stock is required" })
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),

  category: z
    .string({ message: "Category is required" })
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .trim(),
});

// ─────────────────────────────────────────────
// Product Update Schema
// ─────────────────────────────────────────────
export const updateProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must not exceed 100 characters")
    .trim()
    .optional(),
  
  price: z.coerce
    .number()
    .positive("Price must be a positive number")
    .optional(),

  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative")
    .optional(),

  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .trim()
    .optional(),
});

// ─────────────────────────────────────────────
// ID Param Schema
// ─────────────────────────────────────────────
export const productIdSchema = z.object({
  id: z
    .string({ message: "Product ID is required" })
    .min(1, "Product ID is required")
    .regex(/^c[a-z0-9]{24}$/, "Invalid Product ID format"), // CUID regex
});
