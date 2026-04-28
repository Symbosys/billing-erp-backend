import { Router } from "express";
import { getDashboardStats } from "../controller/dashboard.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getDashboardStats);

export default router;
