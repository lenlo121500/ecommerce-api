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
