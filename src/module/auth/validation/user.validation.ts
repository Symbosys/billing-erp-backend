import { z } from "zod";

// ─────────────────────────────────────────────
// Reusable email field (Zod v4 compatible)
// z.email() is the standalone email validator in Zod v4
// We use z.preprocess to normalize (trim + lowercase) before validating
// ─────────────────────────────────────────────
const emailField = (requiredMsg = "Email is required") =>
  z.preprocess(
    (val) =>
      typeof val === "string" ? val.trim().toLowerCase() : val,
    z
      .string({ message: requiredMsg })
      .min(1, requiredMsg)
      .email("Please provide a valid email address")
  );

// ─────────────────────────────────────────────
// Register Schema
// ─────────────────────────────────────────────
export const registerSchema = z.object({
  email: emailField("Email is required"),

  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),

  role: z
    .enum(["STAFF", "ADMIN"])
    .optional(),
});

// ─────────────────────────────────────────────
// Login Schema
// ─────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailField("Email is required"),

  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

// ─────────────────────────────────────────────
// Update Password Schema
// ─────────────────────────────────────────────
export const updatePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Current password is required" })
      .min(1, "Current password is required"),

    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password must not exceed 100 characters"),

    confirmPassword: z
      .string({ message: "Confirm password is required" })
      .min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─────────────────────────────────────────────
// Update Email Schema
// ─────────────────────────────────────────────
export const updateEmailSchema = z.object({
  email: emailField("New email is required"),

  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

// ─────────────────────────────────────────────
// Update Role Schema
// ─────────────────────────────────────────────
export const updateRoleSchema = z.object({
  role: z.enum(["STAFF", "ADMIN"], {
    error: "Role must be either STAFF or ADMIN",
  }),
});

// ─────────────────────────────────────────────
// ID Param Schema
// Zod v4 removed .cuid() — using regex instead
// CUID pattern: starts with 'c', followed by 24 alphanumeric chars
// ─────────────────────────────────────────────
export const idParamSchema = z.object({
  id: z
    .string({ message: "ID is required" })
    .min(1, "ID is required")
    .regex(/^c[a-z0-9]{24}$/, "Invalid ID format"),
});