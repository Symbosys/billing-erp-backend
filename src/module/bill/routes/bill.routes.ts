import { Router } from "express";
import {
  createBill,
  getAllBills,
  getBillById,
  deleteBill,
} from "../controller/bill.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

// Apply protection middleware to all bill routes
router.use(protect);

router.post("/", createBill);
router.get("/", getAllBills);
router.get("/:id", getBillById);
router.delete("/:id", authorize("ADMIN"), deleteBill);

export default router;
