import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { SuccessResponse } from "../../../utils/response.utils.js";

// ─────────────────────────────────────────────
// GET /inventory/stats - Get aggregated inventory statistics
// ─────────────────────────────────────────────
export const getInventoryStats = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany();

  let assetValue = 0;
  let criticalStock = 0;

  products.forEach((p) => {
    assetValue += p.price * p.stock;
    if (p.stock < 10) {
      criticalStock += 1;
    }
  });

  // Mocked inbound flow and active nodes since we don't have those models
  const stats = [
    { label: "Asset Value", value: `$${(assetValue / 1000).toFixed(1)}k`, trend: "+8.2%" },
    { label: "Critical Stock", value: `${criticalStock} SKU`, trend: "-2.1%" },
    { label: "Inbound Flow", value: "156 Unit", trend: "+12.5%" },
    { label: "Active Nodes", value: "12 Depot", trend: "Stable" },
  ];

  return SuccessResponse(res, "Inventory stats retrieved", { stats });
});
