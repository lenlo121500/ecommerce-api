import { Router } from "express";
import {
  loginRateLimiter,
  registerRateLimiter,
} from "../middlewares/rateLimiter";
import { login, logout, register } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", registerRateLimiter, register);
authRoutes.post("/login", loginRateLimiter, login);
authRoutes.post("/logout", logout);

export default authRoutes;
