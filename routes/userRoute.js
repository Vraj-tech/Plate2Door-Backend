import express from "express";
import {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  getBookmarkStats,
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js"; // ✅ Import Middleware

const userRouter = express.Router();

// 🔹 Authentication Routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// 🔹 Password Reset Routes
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:token", resetPassword);

// 🔹 Favorite Routes
userRouter.post("/favorites/add", addToFavorites);
userRouter.post("/favorites/remove", removeFromFavorites);
userRouter.get("/favorites/:userId", getUserFavorites);
userRouter.get("/bookmarks/stats", getBookmarkStats);

// 🔹 ✅ Corrected: Get User Profile
userRouter.get("/profile", authMiddleware, getUserProfile);

// 🔹 ✅ Corrected: Update User Profile
userRouter.put("/profile", authMiddleware, updateUserProfile);

export default userRouter;
