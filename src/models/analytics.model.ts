import mongoose, { Schema } from "mongoose";
import { IUserSession, IProductView, ISalesAnalytics } from "../types";

// user session schema
const pageViewSchema = new Schema({
  path: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  duration: {
    type: Number,
    required: false,
  },
});

const analyticsEventSchema = new Schema({
  type: {
    type: String,
    enum: ["page_view", "product_view", "add_to_cart", "purchase", "search"],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  data: { type: Schema.Types.Mixed },
});

const userSessionSchema = new Schema<IUserSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: { type: Date },
    pageViews: [pageViewSchema],
    events: [analyticsEventSchema],
  },
  { timestamps: true }
);

userSessionSchema.index({ user: 1, startTime: -1 });

// Product View Schema
const productViewSchema = new Schema<IProductView>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    referrer: { type: String },
    duration: { type: Number },
  },
  { timestamps: true }
);

productViewSchema.index({ product: 1, timestamp: -1 });
productViewSchema.index({ sessionId: 1 });

// Sales Analytics Schema
const productStatSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    default: 0,
  },
});

const categoryStatSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  orders: {
    type: Number,
    default: 0,
  },
});

const salesAnalyticsSchema = new Schema<ISalesAnalytics>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalUsers: {
      type: Number,
      default: 0,
    },
    topProducts: [productStatSchema],
    categoryBreakdown: [categoryStatSchema],
  },
  { timestamps: true }
);

salesAnalyticsSchema.index({ date: -1 });

export const UserSession = mongoose.model<IUserSession>(
  "UserSession",
  userSessionSchema
);
export const ProductView = mongoose.model<IProductView>(
  "ProductView",
  productViewSchema
);
export const SalesAnalytics = mongoose.model<ISalesAnalytics>(
  "SalesAnalytics",
  salesAnalyticsSchema
);
