import { Router } from "express";
import { authorize, protect } from "../middlewares/auth.middleware";
import {
  cancelOrder,
  createOrder,
  getOrderHistory,
  getOrders,
  updateOrderStatus,
} from "../controllers/order.controller";

const orderRoutes = Router();

orderRoutes.post("/", protect, createOrder);
orderRoutes.get("/", protect, getOrders);
orderRoutes.put("/:id/status", protect, authorize("admin"), updateOrderStatus);
orderRoutes.put("/:id/cancel", protect, cancelOrder);
orderRoutes.get("/history", protect, getOrderHistory);

export default orderRoutes;
