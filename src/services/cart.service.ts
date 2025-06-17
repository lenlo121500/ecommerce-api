import Cart from "../models/cart.model";
import Product from "../models/product.model";
import { ICart, ICartItem } from "../types";
import APIError from "../utils/APIError";

export const getCartService = async (userId: string): Promise<ICart> => {
  const cart = await Cart.findOne({ user: userId, isActive: true }).populate(
    "items.product",
    "name price images stock isActive"
  );

  if (!cart) throw new APIError(404, "Cart not found");

  return cart;
};

export const addToCartService = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<ICart> => {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new APIError(404, "Product not found or inactive");
  }

  if (product.stock < quantity) {
    throw new APIError(400, "Insufficient stock");
  }

  let cart = await Cart.findOne({ user: userId, isActive: true });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    if (newQuantity > product.stock) {
      throw new APIError(400, "Total quantity exceeds available stock");
    }
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      addedAt: new Date(),
    });
  }

  return await cart.save();
};

export const updateCartService = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<ICart> => {
  const cart = await Cart.findOne({ user: userId, isActive: true });

  if (!cart) {
    throw new APIError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new APIError(404, "Item not found in cart");
  }

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await Product.findById(productId);
    if (!product || quantity > product.stock) {
      throw new APIError(400, "Invalid quantity or insufficient stock");
    }
    cart.items[itemIndex].quantity = quantity;
  }

  return await cart.save();
};

export const removeFromCartService = async (
  userId: string,
  productId: string
): Promise<ICart> => {
  const cart = await Cart.findOne({ user: userId, isActive: true });

  if (!cart) {
    throw new APIError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  return await cart.save();
};

export const clearCartService = async (userId: string): Promise<void> => {
  await Cart.findOneAndUpdate(
    { user: userId, isActive: true },
    { items: [], totalAmount: 0, totalItems: 0 }
  );
};

export const validateCartService = async (
  userId: string
): Promise<{ valid: boolean; issues: string[] }> => {
  const cart = await Cart.findOne({ user: userId, isActive: true }).populate(
    "items.product"
  );

  if (!cart) {
    return { valid: true, issues: [] };
  }

  const issues: string[] = [];
  const validItems: ICartItem[] = [];

  for (const item of cart.items) {
    const product = item.product as any;

    if (!product || !product.isActive) {
      issues.push(
        `Product ${product?.name || "Unknown"} is no longer available`
      );
      continue;
    }

    if (product.stock < item.quantity) {
      issues.push(`Only ${product.stock} units of ${product.name} available`);
      item.quantity = product.stock;
    }

    if (product.price !== item.price) {
      issues.push(
        `Price of ${product.name} has changed from ${item.price} to ${product.price}`
      );
      item.price = product.price;
    }

    validItems.push(item);
  }

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return { valid: issues.length === 0, issues };
};
