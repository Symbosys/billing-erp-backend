import { z } from "zod";

// ─────────────────────────────────────────────
// Customer Create Schema
// ─────────────────────────────────────────────
export const createCustomerSchema = z.object({
  name: z
    .string({ message: "Customer name is required" })
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must not exceed 100 characters")
    .trim(),
  
  phone: z
    .string({ message: "Phone number is required" })
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^\+?[0-9]+$/, "Invalid phone number format"),

  // Using coerce to handle string inputs from forms/params
  price: z.coerce
    .number({ message: "Price is required" })
    .nonnegative("Price must be a non-negative number"),
});

// ─────────────────────────────────────────────
// Customer Update Schema
// ─────────────────────────────────────────────
export const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must not exceed 100 characters")
    .trim()
    .optional(),
  
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^\+?[0-9]+$/, "Invalid phone number format")
    .optional(),

  price: z.coerce
    .number()
    .nonnegative("Price must be a non-negative number")
    .optional(),
});

// ─────────────────────────────────────────────
// ID Param Schema
// ─────────────────────────────────────────────
export const customerIdSchema = z.object({
  id: z
    .string({ message: "Customer ID is required" })
    .min(1, "Customer ID is required")
    .regex(/^c[a-z0-9]{24}$/, "Invalid Customer ID format"), // CUID regex
});
