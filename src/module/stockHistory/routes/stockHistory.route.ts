import { Router } from "express";
import {
  createStockHistory,
  getAllStockHistories,
  getStockHistoryById,
  updateStockHistory,
  deleteStockHistory,
} from "../controller/stockHistory.controller.js";

const router = Router();

router.post("/", createStockHistory);
router.get("/", getAllStockHistories);
router.get("/:id", getStockHistoryById);
router.patch("/:id", updateStockHistory);
router.delete("/:id", deleteStockHistory);

export default router;
