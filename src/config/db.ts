import mongoose from "mongoose";
import logger from "../utils/logger";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(`MongoDB connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const gracefulShutdown = (signal: string) => {
  return async () => {
    try {
      logger.info(`🛑 ${signal} received. Closing MongoDB connection...`);
      await mongoose.connection.close();
      logger.info("MongoDB connection closed. Exiting process.");
      process.exit(0);
    } catch (err) {
      logger.error("Error closing MongoDB connection:", err);
      process.exit(1);
    }
  };
};

process.on("SIGINT", gracefulShutdown("SIGINT"));
process.on("SIGTERM", gracefulShutdown("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  process.exit(1);
});

export default connectDB;
