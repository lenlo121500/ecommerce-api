import Order from "../models/order.model";
import { CreateOrderData, IOrder, IOrderItem, PaginatedOrders } from "../types";
import User from "../models/user.model";
import Product from "../models/product.model";
import APIError from "../utils/APIError";

export const createOrderService = async (
  orderData: CreateOrderData
): Promise<IOrder> => {
  // validate user exists
  const user = await User.findById(orderData.user);
  if (!user) {
    throw new APIError(404, "User not found");
  }

  // validate products and calculate total
  let totalAmount = 0;
  const validatedItems: IOrderItem[] = [];

  for (const item of orderData.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      throw new APIError(404, "Product not found or inactive");
    }

    if (product.stock < item.quantity) {
      throw new APIError(
        400,
        `Only ${product.stock} units of ${product.name} available`
      );
    }

    const itemTotal = product.price * item.quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      product: item.product,
      quantity: item.quantity,
      price: product.price,
    });
  }

  // create order
  const order = new Order({
    user: orderData.user,
    items: validatedItems,
    totalAmount,
    status: "pending",
    shippingAddress: orderData.shippingAddress,
    paymentMethod: orderData.paymentMethod,
    notes: orderData.notes,
    orderDate: new Date(),
  });

  const savedOrder = await order.save();

  // update product stock
  for (const item of validatedItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }

  // populaate product details or response
  await savedOrder.populate("items.product", "name price image");

  return savedOrder;
};

export const getUsersOrdersService = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedOrders> => {
  const skip = (page - 1) * limit;

  const [orders, totalOrders] = await Promise.all([
    Order.find({ user: userId })
      .populate("items.product", "name price image")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),

    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders,
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
  };
};

export const getOrderByIdService = async (
  orderId: string,
  userId: string
): Promise<IOrder | null> => {
  return Order.findOne({ _id: orderId, user: userId })
    .populate("items.product", "name price image description")
    .populate("user", "firstName lastName email");
};

export const updateOrderStatusService = async (
  orderId: string,
  status: string,
  userId: string
): Promise<IOrder | null> => {
  const validStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw new APIError(400, "Invalid order status");
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, user: userId },
    {
      status,
      updatedAt: new Date(),
    },
    { new: true }
  ).populate("items.product", "name price image");

  if (!order) {
    throw new APIError(404, "Order not found");
  }

  return order;
};

export const cancelOrderService = async (
  orderId: string,
  userId: string
): Promise<IOrder | null> => {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw new APIError(404, "Order not found");
  }

  if (order.status === "shipped" || order.status === "delivered") {
    throw new APIError(400, "Cannot cancel shipped or delivered order");
  }

  if (order.status === "cancelled") {
    throw new APIError(400, "Order is already cancelled");
  }

  // restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  // update order status
  order.status = "cancelled";
  order.updatedAt = new Date();

  const updatedOrder = await order.save();
  await updatedOrder.populate("items.product", "name price image");

  return updatedOrder;
};

export const getOrderHistoryService = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<PaginatedOrders> => {
  const skip = (page - 1) * limit;
  const query: any = { user: userId };

  if (status) {
    query.status = status;
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate("items.product", "name price image")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    totalOrders,
    currentPage: page,
    totalPages: Math.ceil(totalOrders / limit),
  };
};

export const getOrderStatsService = async (
  userId: string
): Promise<{
  totalOrders: number;
  totalSpent: number;
  ordersByStatus: Record<string, number>;
}> => {
  const orders = await Order.find({ user: userId });

  const stats = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    ordersByStatus: orders.reduce(
      (acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  return stats;
};
