import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import logger from "../utils/logger";
import APIError from "../utils/APIError";
import {
  cancelOrderService,
  createOrderService,
  getOrderHistoryService,
  getUsersOrdersService,
  updateOrderStatusService,
} from "../services/order.service";
import { trackEventService } from "../services/analytics.service";
import { parse } from "path";

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("createOrder controller hit...");
  try {
    const orderData = { ...req.body, user: req.user.id };
    const order = await createOrderService(orderData);

    // track purchase analytics
    await trackEventService(req.user.sessionId, {
      type: "purchase",
      timestamp: new Date(),
      data: {
        orderId: order._id,
        amount: order.totalAmount,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    logger.error(
      `Error in createOrder controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("getOrders controller hit...");
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orders = await getUsersOrdersService(req.user.id, page, limit);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    logger.error(`Error in getOrders controller: ${(error as Error).message}`);
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("updateOrderStaus controller hit...");
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await updateOrderStatusService(id, status, req.user.id);

    if (!order) {
      throw new APIError(404, "Order not found");
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    logger.error(
      `Error in updateOrderStaus controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const cancelOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("cancelOrder controller hit...");
  try {
    const { id } = req.params;
    const order = await cancelOrderService(id, req.user.id);

    if (!order) {
      throw new APIError(404, "Order not found");
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    logger.error(
      `Error in cancelOrder controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getOrderHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("getOrderHistory controller hit...");
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const orders = await getOrderHistoryService(
      req.user.id,
      page,
      limit,
      status
    );

    res.status(200).json({
      success: true,
      message: "Order history fetched successfully",
      data: orders,
    });
  } catch (error) {
    logger.error(
      `Error in getOrderHistory controller: ${(error as Error).message}`
    );
    next(error);
  }
};
