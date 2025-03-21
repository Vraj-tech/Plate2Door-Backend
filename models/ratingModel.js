import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: "food", required: true },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  }, // Ensures user ordered this food
  rating: { type: Number, required: true, min: 1, max: 5 }, // ⭐ 1-5 stars
  reviewText: { type: String, default: "" }, // Optional text review
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
