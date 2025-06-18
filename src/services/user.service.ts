import User from "../models/user.model";
import { IUser } from "../types";
import APIError from "../utils/APIError";

export const getAllUsersService = async (
  query: any
): Promise<{
  users: IUser[];
  total: number;
}> => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: "i" } },
      { lastName: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.role) {
    filter.role = query.role;
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  const users = await User.find(filter)
    .select("-password")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  return { users, total };
};

export const getUserByIdService = async (id: string): Promise<IUser | null> => {
  const user = await User.findById(id).select("-password");
  if (!user) throw new APIError(400, "User not found");
  return user;
};

export const updateUserProfileService = async (
  id: string,
  updateData: Partial<IUser>
): Promise<IUser> => {
  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  }).select("-password");

  if (!updatedUser) throw new APIError(404, "User not found");

  return updatedUser;
};

export const deleteUserByIdService = async (
  id: string
): Promise<IUser | null> => {
  const deletedUser = await User.findByIdAndDelete(id).select("-password");
  return deletedUser;
};
