import { Router } from "express";
import { getInventoryStats } from "../controller/inventory.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/stats", getInventoryStats);

export default router;
