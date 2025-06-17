import { Document, Types } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin" | "seller";
  addresses: IAddress[];
  comparePassword(password: string): Promise<boolean>;
}

export interface IAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  seller: Types.ObjectId | string;
  ratings: {
    average: number;
    count: number;
  };
  isActive: boolean;
}

export interface IOrder extends Document {
  user: Types.ObjectId | string;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shippingAddress: IAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed";
  notes?: string;
  updatedAt: Date;
}

export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface CreateOrderData {
  user: string;
  items: IOrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  notes?: string;
}

export interface PaginatedOrders {
  orders: IOrder[];
  totalPages: number;
  currentPage: number;
  totalOrders: number;
}

export interface ICart extends Document {
  user: Types.ObjectId | string;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
  isActive: boolean;
  expiresAt: Date;
}

export interface ICartItem {
  product: Types.ObjectId | string;
  quantity: number;
  price: number;
  addedAt: Date;
}

export interface IAnalyticsEvent {
  type: "page_view" | "product_view" | "add_to_cart" | "purchase" | "search";
  timestamp: Date;
  data: any;
}

export interface IPageView {
  path: string;
  timestamp: Date;
  duration?: number;
}

export interface IUserSession extends Document {
  sessionId: string;
  user?: Types.ObjectId | string;
  ipAddress: string;
  userAgent: string;
  startTime: Date;
  endTime?: Date;
  pageViews: IPageView[];
  events: IAnalyticsEvent[];
}

export interface IProductView extends Document {
  product: Types.ObjectId | string;
  user?: Types.ObjectId | string;
  sessionId: string;
  timestamp: Date;
  referrer?: string;
  duration?: number;
}

export interface ISalesAnalytics extends Document {
  date: Date;
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  topProducts: IProductStat[];
  categoryBreakdown: ICategoryStat[];
}
export interface IProductStat {
  product: string;
  sales: number;
  quantity: number;
}

export interface ICategoryStat {
  category: string;
  sales: number;
  orders: number;
}
