import { Router } from "express";
import {
  createPermission,
  getAllPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controller/permission.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
// Apply protect middleware to all routes. 
// For permissions, you probably want only ADMIN to access them.
router.use(protect);
router.use(authorize("ADMIN"));

router.get("/", getAllPermissions);
router.get("/:id", getPermissionById);
router.post("/", createPermission);
router.patch("/:id", updatePermission);
router.delete("/:id", deletePermission);

export default router;
