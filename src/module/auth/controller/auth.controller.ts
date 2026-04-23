import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { generateToken } from "../../../utils/jwt.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  registerSchema,
  loginSchema,
  updatePasswordSchema,
  updateEmailSchema,
  updateRoleSchema,
  idParamSchema,
} from "../validation/user.validation.js";

// ─────────────────────────────────────────────
// Helper: parse Zod error → first message
// ─────────────────────────────────────────────
function firstZodError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Validation error";
}

// ─────────────────────────────────────────────
// POST /auth/register
// Create a new account (open or admin-only)
// ─────────────────────────────────────────────
export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { email, password, role } = parsed.data;

    // Duplicate email check
    const existing = await prisma.login.findUnique({ where: { email } });
    if (existing) {
      return next(new ErrorResponse("Email is already registered", statusCode.Conflict));
    }

    // Hash password with cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.login.create({
      data: {
        email,
        password: hashedPassword,
        ...(role && { role }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken({ id: user.id, role: user.role });

    return SuccessResponse(
      res,
      "Account created successfully",
      { user, token },
      statusCode.Created
    );
  }
);

// ─────────────────────────────────────────────
// POST /auth/login
// Login with email & password
// ─────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { email, password } = parsed.data;

    // Fetch user — deliberately vague on failure to prevent user enumeration
    const user = await prisma.login.findUnique({ where: { email } });
    if (!user) {
      return next(new ErrorResponse("Invalid email or password", statusCode.Unauthorized));
    }

    // Compare plain-text password against hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse("Invalid email or password", statusCode.Unauthorized));
    }

    const token = generateToken({ id: user.id, role: user.role });

    return SuccessResponse(res, "Login successful", {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  }
);

// ─────────────────────────────────────────────
// GET /auth/me
// Get the currently authenticated user's profile
// Requires: protect middleware
// ─────────────────────────────────────────────
export const getMe = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("Not authorized", statusCode.Unauthorized));
    }

    const user = await prisma.login.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Profile fetched successfully", { user });
  }
);

// ─────────────────────────────────────────────
// GET /auth/users
// Get all registered users
// Requires: protect + authorize("ADMIN")
// ─────────────────────────────────────────────
export const getAllUsers = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await prisma.login.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return SuccessResponse(res, "Users fetched successfully", {
      count: users.length,
      users,
    });
  }
);

// ─────────────────────────────────────────────
// GET /auth/users/:id
// Get a single user by ID
// Requires: protect + authorize("ADMIN")
// ─────────────────────────────────────────────
export const getUserById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const user = await prisma.login.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "User fetched successfully", { user });
  }
);

// ─────────────────────────────────────────────
// PATCH /auth/me/password
// Change own password — requires current password
// Requires: protect middleware
// ─────────────────────────────────────────────
export const updatePassword = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("Not authorized", statusCode.Unauthorized));
    }

    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch full record to get hashed password
    const user = await prisma.login.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ErrorResponse("Current password is incorrect", statusCode.Bad_Request));
    }

    // Block reuse of the same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return next(
        new ErrorResponse(
          "New password must be different from the current password",
          statusCode.Bad_Request
        )
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.login.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return SuccessResponse(res, "Password updated successfully");
  }
);

// ─────────────────────────────────────────────
// PATCH /auth/me/email
// Change own email — requires password confirmation
// Requires: protect middleware
// ─────────────────────────────────────────────
export const updateEmail = asyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const userId: string | undefined = req.user?.id;

    if (!userId) {
      return next(new ErrorResponse("Not authorized", statusCode.Unauthorized));
    }

    const parsed = updateEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { email: newEmail, password } = parsed.data;

    // Fetch current user
    const user = await prisma.login.findUnique({ where: { id: userId } });
    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    // Require password confirmation to change email
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorResponse("Password is incorrect", statusCode.Bad_Request));
    }

    // Block no-op
    if (user.email === newEmail) {
      return next(
        new ErrorResponse(
          "New email must be different from the current email",
          statusCode.Bad_Request
        )
      );
    }

    // Check new email isn't already taken by another account
    const emailTaken = await prisma.login.findUnique({ where: { email: newEmail } });
    if (emailTaken) {
      return next(new ErrorResponse("Email is already in use by another account", statusCode.Conflict));
    }

    const updated = await prisma.login.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return SuccessResponse(res, "Email updated successfully", { user: updated });
  }
);

// ─────────────────────────────────────────────
// PATCH /auth/users/:id/role
// Update another user's role
// Requires: protect + authorize("ADMIN")
// ─────────────────────────────────────────────
export const updateRole = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    const { role } = parsed.data;

    const user = await prisma.login.findUnique({ where: { id } });
    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    // Block no-op role assignment
    if (user.role === role) {
      return next(
        new ErrorResponse(`User already has the role "${role}"`, statusCode.Bad_Request)
      );
    }

    const updated = await prisma.login.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return SuccessResponse(res, "User role updated successfully", { user: updated });
  }
);

// ─────────────────────────────────────────────
// DELETE /auth/users/:id
// Delete a user account permanently
// Requires: protect + authorize("ADMIN")
// ─────────────────────────────────────────────
export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const user = await prisma.login.findUnique({ where: { id } });
    if (!user) {
      return next(new ErrorResponse("User not found", statusCode.Not_Found));
    }

    await prisma.login.delete({ where: { id } });

    return SuccessResponse(res, "User deleted successfully");
  }
);
