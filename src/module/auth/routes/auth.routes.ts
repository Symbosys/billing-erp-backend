import { Router } from "express";
import {
  register,
  login,
  getMe,
  getAllUsers,
  getUserById,
  updatePassword,
  updateEmail,
  updateRole,
  deleteUser,
} from "../controller/auth.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";
import { authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Public Routes  (no token required)
// ─────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);

// ─────────────────────────────────────────────
// Authenticated Routes  (valid JWT required)
// ─────────────────────────────────────────────
router.get("/me", protect, getMe);
router.patch("/me/password", protect, updatePassword);
router.patch("/me/email", protect, updateEmail);

// ─────────────────────────────────────────────
// Admin-only Routes
// ─────────────────────────────────────────────
router.get("/users", protect, authorize("ADMIN"), getAllUsers);
router.get("/users/:id", protect, authorize("ADMIN"), getUserById);
router.patch("/users/:id/role", protect, authorize("ADMIN"), updateRole);
router.delete("/users/:id", protect, authorize("ADMIN"), deleteUser);

export default router;
