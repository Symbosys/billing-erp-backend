import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createPermissionSchema,
  updatePermissionSchema,
  permissionIdSchema,
} from "../validation/permission.validation.js";

// ─────────────────────────────────────────────
// Helper: get first Zod error message
// ─────────────────────────────────────────────
function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

// ─────────────────────────────────────────────
// POST /permission
// Create a new permission
// ─────────────────────────────────────────────
export const createPermission = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createPermissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const { name, description } = parsed.data;

    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return next(new ErrorResponse("Permission name already exists", statusCode.Conflict));
    }

    const permission = await prisma.permission.create({
      data: { 
        name,
        ...(description !== undefined && { description })
      },
    });

    return SuccessResponse(
      res,
      "Permission created successfully",
      { permission },
      statusCode.Created
    );
  }
);

// ─────────────────────────────────────────────
// GET /permission
// Get all permissions
// ─────────────────────────────────────────────
export const getAllPermissions = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const permissions = await prisma.permission.findMany();

    return SuccessResponse(res, "Permissions fetched successfully", {
      count: permissions.length,
      permissions,
    });
  }
);

// ─────────────────────────────────────────────
// GET /permission/:id
// Get a single permission by ID
// ─────────────────────────────────────────────
export const getPermissionById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = permissionIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: { logins: true },
    });

    if (!permission) {
      return next(new ErrorResponse("Permission not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Permission fetched successfully", { permission });
  }
);

// ─────────────────────────────────────────────
// PATCH /permission/:id
// Update a permission
// ─────────────────────────────────────────────
export const updatePermission = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = permissionIdSchema.safeParse(req.params);
    const parsedBody = updatePermissionSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    const existingPermission = await prisma.permission.findUnique({ where: { id } });
    if (!existingPermission) {
      return next(new ErrorResponse("Permission not found", statusCode.Not_Found));
    }

    // If updating name, check for uniqueness
    if (parsedBody.data.name && parsedBody.data.name !== existingPermission.name) {
      const nameConflict = await prisma.permission.findUnique({ where: { name: parsedBody.data.name } });
      if (nameConflict) {
        return next(new ErrorResponse("Permission name already exists", statusCode.Conflict));
      }
    }

    // Filter out undefined values
    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Permission updated successfully", { permission: updatedPermission });
  }
);

// ─────────────────────────────────────────────
// DELETE /permission/:id
// Delete a permission permanently
// ─────────────────────────────────────────────
export const deletePermission = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = permissionIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) {
      return next(new ErrorResponse("Permission not found", statusCode.Not_Found));
    }

    await prisma.permission.delete({ where: { id } });

    return SuccessResponse(res, "Permission deleted successfully");
  }
);
