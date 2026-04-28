import type { Request, Response } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { SuccessResponse } from "../../../utils/response.utils.js";

// ─────────────────────────────────────────────
// GET /dashboard - Get aggregated statistics
// ─────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  // Parallel fetch for dashboard metrics
  const [totalRevenueResult, customerCount, recentTransactions] = await Promise.all([
    prisma.bill.aggregate({
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.customer.count(),
    prisma.bill.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } }
      }
    }),
  ]);

  const netRevenue = totalRevenueResult._sum.totalAmount || 0;

  // Mocking change percentages and system load since we don't have historical data or system metrics
  const stats = [
    { title: "Net Revenue", value: `$${netRevenue.toLocaleString()}`, change: "+14.2%", isPositive: true, detail: "vs. last month" },
    { title: "Total Customers", value: customerCount.toLocaleString(), change: "+8.1%", isPositive: true, detail: "registered" },
    { title: "System Load", value: "84.2%", change: "-2.4%", isPositive: false, detail: "resource usage" },
    { title: "Daily Target", value: "92%", change: "+5.5%", isPositive: true, detail: "completion rate" },
  ];

  const formattedTransactions = recentTransactions.map(tx => ({
    id: tx.id,
    customer: tx.customer?.name || "Unknown",
    amount: `$${tx.totalAmount.toLocaleString()}`,
    date: new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: "Completed",
    type: tx.paymentMethod
  }));

  return SuccessResponse(res, "Dashboard stats retrieved", {
    stats,
    recentTransactions: formattedTransactions
  });
});
