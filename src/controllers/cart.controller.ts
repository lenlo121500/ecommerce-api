import { Response, NextFunction } from "express";
import logger from "../utils/logger";
import APIError from "../utils/APIError";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  addToCartService,
  clearCartService,
  getCartService,
  removeFromCartService,
  updateCartService,
  validateCartService,
} from "../services/cart.service";
import { trackEventService } from "../services/analytics.service";

export const getCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("getCart controller hit...");
  try {
    const cart = await getCartService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart || { items: [], totalAmount: 0, totalItems: 0 },
    });
  } catch (error) {
    logger.error(`Error in getCart controller: ${(error as Error).message}`);
    next(error);
  }
};

export const addToCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("addToCart controller hit...");
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      throw new APIError(400, "Product id is required");
    }

    const cart = await addToCartService(req.user.id, productId, quantity);

    // Track Analytics
    await trackEventService(req.user.sessionId, {
      type: "add_to_cart",
      timestamp: new Date(),
      data: {
        productId,
        quantity,
        userId: req.user.id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(`Error in addToCart controller: ${(error as Error).message}`);
    next(error);
  }
};

export const updateCartItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("updateCartItem controller hit...");
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      throw new APIError(
        400,
        "Invalid quantity - quantity must be non-negative"
      );
    }

    const cart = await updateCartService(req.user.id, productId, quantity);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(
      `Error in updateCartItem controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const removeFromCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("removeFromCart controller hit...");
  try {
    const { productId } = req.params;
    const cart = await removeFromCartService(req.user.id, productId);

    res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(
      `Error in removeFromCart controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const clearCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("clearCart controller hit...");
  try {
    await clearCartService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    logger.error(`Error in clearCart controller: ${(error as Error).message}`);
    next(error);
  }
};

export const validateCart = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("validateCart controller hit...");
  try {
    const validation = await validateCartService(req.user.id);

    res.status(200).json({
      success: true,
      message: "Cart validated successfully",
      data: validation,
    });
  } catch (error) {
    logger.error(
      `Error in validateCart controller: ${(error as Error).message}`
    );
    next(error);
  }
};
