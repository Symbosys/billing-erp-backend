import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../config/prisma.js";
import { asyncHandler } from "../../../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.utils.js";
import { statusCode } from "../../../types/types.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
} from "../validation/payment.validation.js";

function firstZodError(error: any): string {
  return error.issues?.[0]?.message ?? "Validation error";
}

export const createPayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ErrorResponse(firstZodError(parsed.error), statusCode.Bad_Request));
    }

    const payment = await prisma.payment.create({
      data: parsed.data,
    });

    return SuccessResponse(
      res,
      "Payment created successfully",
      { payment },
      statusCode.Created
    );
  }
);

export const getAllPayments = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });

    return SuccessResponse(res, "Payments fetched successfully", {
      count: payments.length,
      payments,
    });
  }
);

export const getPaymentById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = paymentIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return next(new ErrorResponse("Payment not found", statusCode.Not_Found));
    }

    return SuccessResponse(res, "Payment fetched successfully", { payment });
  }
);

export const updatePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = paymentIdSchema.safeParse(req.params);
    const parsedBody = updatePaymentSchema.safeParse(req.body);

    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }
    if (!parsedBody.success) {
      return next(new ErrorResponse(firstZodError(parsedBody.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;
    
    const existingPayment = await prisma.payment.findUnique({ where: { id } });
    if (!existingPayment) {
      return next(new ErrorResponse("Payment not found", statusCode.Not_Found));
    }

    const updateData = Object.fromEntries(
      Object.entries(parsedBody.data).filter(([_, value]) => value !== undefined)
    );

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    });

    return SuccessResponse(res, "Payment updated successfully", { payment: updatedPayment });
  }
);

export const deletePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedParams = paymentIdSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return next(new ErrorResponse(firstZodError(parsedParams.error), statusCode.Bad_Request));
    }

    const { id } = parsedParams.data;

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return next(new ErrorResponse("Payment not found", statusCode.Not_Found));
    }

    await prisma.payment.delete({ where: { id } });

    return SuccessResponse(res, "Payment deleted successfully");
  }
);
