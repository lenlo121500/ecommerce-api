import { Router } from "express";
import { authorize, protect } from "../middlewares/auth.middleware";
import {
  deleteUserById,
  getAllUsers,
  getUserById,
  updateUserProfile,
} from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/", protect, authorize("admin"), getAllUsers);
userRoutes.get("/:id", protect, authorize("admin"), getUserById);
userRoutes.put("/:id", protect, updateUserProfile);
userRoutes.delete("/:id", protect, deleteUserById);

export default userRoutes;
