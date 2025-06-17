import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCart,
} from "../controllers/cart.controller";
import { protect } from "../middlewares/auth.middleware";

const cartRoutes = Router();

// @route   GET /api/cart
// @desc    Get current user's cart
// @access  Private
cartRoutes.get("/", protect, getCart);

// @route   POST /api/cart
// @desc    Add product to cart
// @access  Private
cartRoutes.post("/", protect, addToCart);

// @route   PUT /api/cart/:productId
// @desc    Update quantity of a specific product in the cart
// @access  Private
cartRoutes.put("/:productId", protect, updateCartItem);

// @route   DELETE /api/cart/:productId
// @desc    Remove specific product from cart
// @access  Private
cartRoutes.delete("/:productId", protect, removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear all items from the cart
// @access  Private
cartRoutes.delete("/", protect, clearCart);

// @route   GET /api/cart/validate
// @desc    Validate cart (e.g., stock availability, prices)
// @access  Private
cartRoutes.get("/validate", protect, validateCart);

export default cartRoutes;
