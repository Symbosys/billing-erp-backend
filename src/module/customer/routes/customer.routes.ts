import { Router } from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controller/customer.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
router.get("/", protect, getAllCustomers);
router.get("/:id", protect, getCustomerById);
router.post("/", protect, createCustomer);
router.patch("/:id", protect, updateCustomer);
router.delete("/:id", protect, authorize("ADMIN"), deleteCustomer);

export default router;
