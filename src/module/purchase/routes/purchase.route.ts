import { Router } from "express";
import {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controller/purchase.controller.js";

const router = Router();

router.post("/", createPurchase);
router.get("/", getAllPurchases);
router.get("/:id", getPurchaseById);
router.patch("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;
