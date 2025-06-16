import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { IUser } from "../types";
import APIError from "../utils/APIError";
import mongoose from "mongoose";

export const generateToken = (user: IUser): string => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || "1d"),
  });
};

export const registerService = async (
  userData: Partial<IUser>
): Promise<{ user: IUser; token: string }> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.create([userData], { session });

    const token = generateToken(user[0]);

    await session.commitTransaction();
    session.endSession();

    return { user: user[0], token };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const loginService = async (
  email: string,
  password: string
): Promise<{ user: IUser; token: string }> => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new APIError(401, "Invalid email or password");
  }

  const token = generateToken(user);
  return { user, token };
};
