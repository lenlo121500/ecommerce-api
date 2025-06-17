import {
  UserSession,
  ProductView,
  SalesAnalytics,
} from "../models/analytics.model";
import Order from "../models/order.model";
import Product from "../models/product.model";
import User from "../models/user.model";
import { IAnalyticsEvent, ISalesAnalytics } from "../types";

export const trackSessionService = async (sessionData: {
  sessionId: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
}): Promise<void> => {
  const existingSession = await UserSession.findOne({
    sessionId: sessionData.sessionId,
  });

  if (!existingSession) {
    await UserSession.create({
      sessionId: sessionData.sessionId,
      user: sessionData.userId,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      startTime: new Date(),
      pageViews: [],
      events: [],
    });
  }
};

export const trackPageViewService = async (
  sessionId: string,
  path: string
): Promise<void> => {
  await UserSession.findOneAndUpdate(
    { sessionId },
    { $push: { pageViews: { path, timestamp: new Date() } } }
  );
};

export const trackProductView = async (data: {
  productId: string;
  sessionId: string;
  userId?: string;
  referrer?: string;
}): Promise<void> => {
  await ProductView.create({
    product: data.productId,
    user: data.userId,
    sessionId: data.sessionId,
    timestamp: new Date(),
    referrer: data.referrer,
  });

  await trackEventService(data.sessionId, {
    type: "product_view",
    timestamp: new Date(),
    data: {
      productId: data.productId,
    },
  });
};

export const trackEventService = async (sessionId: string, event: IAnalyticsEvent) => {
  await UserSession.findOneAndUpdate(
    { sessionId },
    { $push: { events: event } }
  );
};

export const generateDailyAnalyticsService = async (
  date: Date
): Promise<ISalesAnalytics> => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  // Get order for the day
  const orders = await Order.find({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    paymentStatus: "completed",
  }).populate("items.product");

  // calculate totals
  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;

  // get unique users who made purchases
  const userIds = [...new Set(orders.map((order) => order.user.toString()))];
  const totalUsers = userIds.length;

  //calculate product stats
  const productStats = new Map();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productId = item.product.toString();
      if (productStats.has(productId)) {
        const stat = productStats.get(productId);
        stat.quantity += item.quantity;
        stat.sales += item.price * item.quantity;
      } else {
        productStats.set(productId, {
          product: productId,
          quantity: item.quantity,
          sales: item.price * item.quantity,
        });
      }
    });
  });

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  // calculate category breakdown
  const categoryStats = new Map();
  const products = await Product.find({
    _id: {
      $in: Array.from(productStats.keys()),
    },
  }).lean();

  products.forEach((product) => {
    const stat = productStats.get(product._id.toString());
    if (categoryStats.has(product.category)) {
      const categoryStat = categoryStats.get(product.category);
      categoryStat.sales += stat.sales;
      categoryStat.orders += 1;
    } else {
      categoryStats.set(product.category, {
        category: product.category,
        sales: stat.sales,
        orders: 1,
      });
    }
  });

  const categoryBreakdown = Array.from(categoryStats.values());

  // save or update analytics
  const analytics = await SalesAnalytics.findOneAndUpdate(
    { date: startOfDay },
    {
      totalSales,
      totalOrders,
      totalUsers,
      topProducts,
      categoryBreakdown,
    },
    { upsert: true, new: true }
  );

  return analytics;
};

export const getProductAnalyticsService = async (
  productId: string,
  days: number = 30
): Promise<any> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const views = await ProductView.aggregate([
    {
      $match: {
        product: productId,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
        },
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user" },
      },
    },
    {
      $project: {
        date: "$_id",
        views: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
      },
    },
    { $sort: { date: 1 } },
  ]);

  const orders = await Order.aggregate([
    {
      $match: {
        "items.product": productId,
        createdAt: { $gte: startDate },
        paymentStatus: "completed",
      },
    },
    { $unwind: "$items" },
    {
      $match: { "items.product": productId },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        sales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        orders: { $sum: 1 },
      },
    },
    {
      $project: {
        date: "$_id",
        sales: 1,
        quantity: 1,
        orders: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return { views, orders };
};

export const getDashboardStats = async (days: number = 30): Promise<any> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [salesData, userData, productData] = await Promise.all([
    // sales analytics
    SalesAnalytics.find({
      date: { $gte: startDate },
    }).sort({ date: 1 }),

    // user analytics
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // top products by views
    ProductView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$product",
          views: { $sum: 1 },
          uniqueUsers: { $addToSet: "$user" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name: "$product.name",
          views: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return {
    sales: salesData,
    users: userData,
    topProducts: productData,
  };
};
