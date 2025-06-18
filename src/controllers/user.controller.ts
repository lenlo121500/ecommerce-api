import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import {
  deleteUserByIdService,
  getAllUsersService,
  getUserByIdService,
  updateUserProfileService,
} from "../services/user.service";
import APIError from "../utils/APIError";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("getAllUsers controller hit...");
  try {
    const { users, total } = await getAllUsersService(req.query);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        total,
      },
    });
  } catch (error) {
    logger.error(
      `Error in getAllUsers controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("getUserById controller hit...");
  try {
    const user = await getUserByIdService(req.params.id);

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    logger.error(
      `Error in getUserById controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const updateUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  logger.info("updateUserProfile controller hit...");
  try {
    if (req.user.id !== req.params.id) {
      throw new APIError(403, "You can only update your own profile");
    }

    const allowedUpdates = [
      "firstName",
      "lastName",
      "email",
      "addresses",
      "password",
    ];
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedUpdates.includes(key))
    );

    if (Object.keys(updateData).length === 0) {
      throw new APIError(400, "No fields to update");
    }

    const updatedUser = await updateUserProfileService(
      req.params.id,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    logger.error(
      `Error in updateUserProfile controller: ${(error as Error).message}`
    );
    next(error);
  }
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info("deleteUserProfile controller hit...");
  try {
    await deleteUserByIdService(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error(
      `Error in deleteUserProfile controller: ${(error as Error).message}`
    );
    next(error);
  }
};
