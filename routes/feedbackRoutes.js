import express from "express";
import {
  submitFeedback,
  getAllFeedback,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import authMiddleware from "../middleware/auth.js"; // ✅ Protect routes using token authentication

const feedbackRouter = express.Router();

// 🔹 Submit Feedback (User) - Requires authentication (Extracts `userId` from token)
feedbackRouter.post("/submit", authMiddleware, submitFeedback);

// 🔹 Get All Feedback (Admin Only) - Requires authentication (Admins only)
feedbackRouter.get("/all", authMiddleware, getAllFeedback);

// 🔹 Delete Feedback (Admin Only)
feedbackRouter.delete("/delete/:id", authMiddleware, deleteFeedback);

export default feedbackRouter;
