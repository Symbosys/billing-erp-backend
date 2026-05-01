import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  description: z.string().optional(),
});

export const updatePermissionSchema = z.object({
  name: z.string().min(1, "Permission name must not be empty").optional(),
  description: z.string().optional(),
});

export const permissionIdSchema = z.object({
  id: z.string().min(1, "Permission ID is required"),
});
