import { Router } from "express";
import { getAnalyticsStats } from "../controller/analytics.controller.js";
import { protect } from "../../../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getAnalyticsStats);

export default router;
