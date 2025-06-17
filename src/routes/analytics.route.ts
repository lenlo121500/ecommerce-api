import { Router } from "express";
import {
  batchGenerateAnalytics,
  generateDailyAnalytics,
  getDashboardStats,
  getProductAnalytics,
  trackEvent,
  trackPageView,
  trackProductView,
  trackSession,
} from "../controllers/analytics.controller";
import { authorize, protect } from "../middlewares/auth.middleware";

const analyticsRoutes = Router();

analyticsRoutes.use(protect);

// tracking routes
analyticsRoutes.post("/track/session", authorize("admin"), trackSession);
analyticsRoutes.post("/track/page-view", authorize("admin"), trackPageView);
analyticsRoutes.post(
  "/track/product-view",
  authorize("admin"),
  trackProductView
);
analyticsRoutes.post("/track/event", authorize("admin"), trackEvent);

// analytics generation routes
analyticsRoutes.post(
  "/generate/daily",
  authorize("admin"),
  generateDailyAnalytics
);
analyticsRoutes.post(
  "/generate/batch",
  authorize("admin"),
  batchGenerateAnalytics
);

// analytics retrival routes
analyticsRoutes.get("/dashboard", authorize("admin"), getDashboardStats);
analyticsRoutes.get(
  "/product/:productId",
  authorize("admin"),
  getProductAnalytics
);

export default analyticsRoutes;
