import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db";
import logger from "./utils/logger";
import authRoutes from "./routes/auth.route";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import globalErrorHandler from "./middlewares/errorHandler";
import productRoutes from "./routes/product.route";
import cartRoutes from "./routes/cart.route";
import orderRoutes from "./routes/order.route";
import analyticsRoutes from "./routes/analytics.route";
import userRoutes from "./routes/user.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());
app.use(helmet());

app.use(globalRateLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/users", userRoutes);

// health check routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.get("/api/health/db", async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({
      success: true,
      message: "Database connection is healthy",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection is unhealthy",
    });
  }
});

app.use(globalErrorHandler);

app.listen(PORT, async () => {
  try {
    await connectDB();
    logger.info(`Server running on port ${PORT}`);
  } catch (error) {
    logger.error(`Error connecting to the server: ${(error as Error).message}`);
    process.exit(1);
  }
});
