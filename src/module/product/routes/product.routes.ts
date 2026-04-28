import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controller/product.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
router.get("/", protect, getAllProducts);
router.get("/:id", protect, getProductById);
router.post("/", protect, createProduct);
router.patch("/:id", protect, updateProduct);
router.delete("/:id", protect, authorize("ADMIN"), deleteProduct);

export default router;
