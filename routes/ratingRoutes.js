import express from "express";
import {
  submitReview,
  getReviewsForFood,
  getAverageRatingForFood,
  getAllFoodRatings,
} from "../controllers/ratingController.js";
// import authMiddleware from "../middlewares/authMiddleware.js"; // Ensure user is logged in
import authMiddleware from "../middleware/auth.js";

const Ratingrouter = express.Router();

Ratingrouter.post("/submit", authMiddleware, submitReview); // Protected route
Ratingrouter.get("/food/:foodId", getReviewsForFood);
Ratingrouter.get("/average/:foodId", getAverageRatingForFood);
Ratingrouter.get("/admin/food-ratings", getAllFoodRatings);

export default Ratingrouter;
