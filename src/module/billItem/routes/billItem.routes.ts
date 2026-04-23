import { Router } from "express";
import {
  createBillItem,
  getAllBillItems,
  updateBillItem,
  deleteBillItem,
} from "../controller/billitem.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", createBillItem);
router.get("/", getAllBillItems);
router.patch("/:id", updateBillItem);
router.delete("/:id", authorize("ADMIN"), deleteBillItem);

export default router;
