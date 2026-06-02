import { Router } from "express";
import {
  createTable,
  getAllTables,
  getTableById,
  updateTable,
  deleteTable,
} from "../controller/diningTable.controller.js";
import { protect, authorize } from "../../../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, getAllTables);
router.get("/:id", protect, getTableById);
router.post("/", protect, createTable);
router.patch("/:id", protect, updateTable);
router.delete("/:id", protect, authorize("ADMIN"), deleteTable);

export default router;
