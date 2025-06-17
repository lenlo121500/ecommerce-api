import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import APIError from "../utils/APIError";
import { IAnalyticsEvent } from "../types";
import {
  generateDailyAnalyticsService,
  getDashboardStatsService,
  getProductAnalyticsService,
  trackEventService,
  trackPageViewService,
  trackProductViewService,
  trackSessionService,
} from "../services/analytics.service";
import { log } from "console";

export const trackSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("trackSession controller hit...");
  try {
    const { sessionId, userId, ipAddress, userAgent } = req.body;

    if (!sessionId || !ipAddress || !userAgent) {
      throw new APIError(400, "Missing required fields");
    }

    await trackSessionService({
      sessionId,
      userId,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      message: "Session tracked successfully",
    });
  } catch (error) {
    logger.error(
      `Error in trackSession controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const trackPageView = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("trackPageView controller hit...");
  try {
    const { sessionId, path } = req.body;

    if (!sessionId || !path) {
      throw new APIError(400, "Missing required fields");
    }

    await trackPageViewService(sessionId, path);

    res.status(200).json({
      success: true,
      message: "Page view tracked successfully",
    });
  } catch (error) {
    logger.error(
      `Error in trackPageView controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const trackProductView = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("trackProductView controller hit...");
  try {
    const { productId, sessionId, userId, referrer } = req.body;

    if (!productId || !sessionId) {
      throw new APIError(400, "Missing required fields");
    }

    await trackProductViewService({
      productId,
      sessionId,
      userId,
      referrer,
    });

    res.status(200).json({
      success: true,
      message: "Product view tracked successfully",
    });
  } catch (error) {
    logger.error(
      `Error in trackProductView controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const trackEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("trackEvent controller hit...");
  try {
    const { sessionId, event } = req.body;

    if (!sessionId || !event) {
      throw new APIError(400, "sessionId and event are required");
    }

    if (!event.type || !event.timestamp) {
      throw new APIError(400, "Event must have type and timestamp");
    }

    await trackEventService(sessionId, event as IAnalyticsEvent);

    res.status(200).json({
      success: true,
      message: "Event tracked successfully",
    });
  } catch (error) {
    logger.error(`Error in trackEvent controller: ${(error as Error).message}`);
    next(error);
  }
};

export const generateDailyAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("generateDailyAnalytics controller hit...");
  try {
    const { date } = req.body;

    if (!date) {
      throw new APIError(400, "Date is required");
    }

    const analytics = await generateDailyAnalyticsService(new Date(date));

    res.status(200).json({
      success: true,
      message: "Daily analytics generated successfully",
      data: analytics,
    });
  } catch (error) {
    logger.error(
      `Error in generateDailyAnalytics controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getProductAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("getProductAnalytics controller hit...");
  try {
    const { productId } = req.params;
    const { days } = req.query;

    if (!productId) {
      throw new APIError(400, "Product id is required");
    }

    const daysNumber = days ? parseInt(days as string) : 30;

    if (isNaN(daysNumber) || daysNumber <= 0) {
      throw new APIError(400, "Days must be a positive number");
    }

    const analytics = await getProductAnalyticsService(productId, daysNumber);

    res.status(200).json({
      success: true,
      message: "Product analytics retrieved successfully",
      data: analytics,
    });
  } catch (error) {
    logger.error(
      `Error in getProductAnalytics controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("getDashboardStats controller hit...");
  try {
    const { days } = req.query;

    const daysNumber = days ? parseInt(days as string) : 30;

    if (isNaN(daysNumber) || daysNumber <= 0) {
      throw new APIError(400, "Days must be a positive number");
    }

    const stats = await getDashboardStatsService(daysNumber);

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error(
      `Error in getDashboardStats controller: ${(error as Error).message}`
    );
    next(error);
  }
};

// batch generate analytics for multiple days
export const batchGenerateAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info("batchGenerateAnalytics controller hit...");
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      throw new APIError(400, "startDate and endDate are required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new APIError(400, "startDate must be before endDate");
    }

    const results = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      try {
        const analytics = await generateDailyAnalyticsService(
          new Date(currentDate)
        );
        results.push({
          date: currentDate.toISOString().split("T")[0],
          success: true,
          data: analytics,
        });
      } catch (error) {
        results.push({
          date: currentDate.toISOString().split("T")[0],
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      message: "Analytics generated successfully",
      data: results,
    });
  } catch (error) {
    logger.error(
      `Error in batchGenerateAnalytics controller: ${(error as Error).message}`
    );
    next(error);
  }
};
