import { Request, Response, NextFunction } from "express";
import { validateRegister, validateLogin } from "../utils/validation";
import logger from "../utils/logger";
import APIError from "../utils/APIError";
import { loginService, registerService } from "../services/auth.service";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info("register controller hit...");
    const { error } = validateRegister(req.body);
    if (error) {
      throw new APIError(400, error.details[0].message);
    }

    const { user, token } = await registerService(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Error in register controller: ${(error as Error).message}`);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("login controller hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      throw new APIError(400, error.details[0].message);
    }

    const { email, password } = req.body;
    const { user, token } = await loginService(email, password);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    logger.error(`Error in login controller: ${(error as Error).message}`);
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("logout controller hit...");
  try {
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error(`Error in logout controller: ${(error as Error).message}`);
    next(error);
  }
};
