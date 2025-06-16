import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import APIError from "../utils/APIError";

const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error =
    err instanceof APIError
      ? err
      : new APIError(500, "Internal Server Error", err.stack);

  logger.error(error);

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

export default globalErrorHandler;
