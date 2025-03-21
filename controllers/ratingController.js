// import Review from "../models/Review.js";
// import Order from "../models/Order.js";
import Review from "../models/ratingModel.js";
import Order from "../models/orderModel.js"; // ✅ Import Order Model

export const submitReview = async (req, res) => {
  try {
    const { foodId, rating, reviewText } = req.body;
    const userId = req.userId; // ✅ Get userId from authMiddleware

    // console.log("Checking order for user:", userId);
    // console.log("Checking order for food:", foodId);

    // ✅ Step 1: Check if the user has ordered this food
    const order = await Order.findOne({
      userId, // Match userId directly
      "items._id": foodId, // Ensure the food was in the order
    });

    console.log("Order found:", order);

    if (!order) {
      return res
        .status(400)
        .json({ message: "You can only review ordered food." });
    }

    // ✅ Step 2: Check if the user already reviewed this food
    const existingReview = await Review.findOne({
      userId,
      foodId,
      orderId: order._id,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this food in this order.",
      });
    }

    // ✅ Step 3: Save the new review
    const newReview = new Review({
      userId,
      foodId,
      orderId: order._id,
      rating,
      reviewText,
    });

    await newReview.save();
    res.status(201).json({ message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Review submission error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getReviewsForFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const reviews = await Review.find({ foodId })
      .populate("userId", "name") // Fetch user's name
      .sort({ createdAt: -1 }); // Show latest reviews first

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAverageRatingForFood = async (req, res) => {
  try {
    const { foodId } = req.params;

    const reviews = await Review.find({ foodId });

    if (reviews.length === 0) {
      return res.status(200).json({ averageRating: 0, totalReviews: 0 });
    }

    const totalRatings = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating = totalRatings / reviews.length;

    res.status(200).json({
      averageRating: averageRating.toFixed(1), // Round to 1 decimal place
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error calculating average rating:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAllFoodRatings = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("foodId", "name") // Get food name
      .populate("userId", "name") // Get user name
      .sort({ createdAt: -1 }); // Show latest reviews first

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching all food ratings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
