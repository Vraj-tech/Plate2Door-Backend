import feedbackModel from "../models/feedbackModel.js";
import userModel from "../models/userModel.js";

// ✅ Secure: Extract user_id from token via `authMiddleware`
const submitFeedback = async (req, res) => {
  try {
    console.log("📥 Feedback Request Received:", req.body);

    // ✅ Ensure `req.userId` exists (Set by authMiddleware)
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in." });
    }

    const { rating, selected_options, feedback_text } = req.body;
    const user_id = req.userId; // ✅ Use `req.userId` (set by middleware)

    // Validate user existence
    const userExists = await userModel.findById(user_id);
    if (!userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    // Create feedback
    const newFeedback = new feedbackModel({
      user_id,
      rating,
      selected_options,
      feedback_text,
    });

    await newFeedback.save();
    res
      .status(201)
      .json({ success: true, message: "Feedback submitted successfully!" });
  } catch (error) {
    console.error("❌ Feedback Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error submitting feedback",
      error: error.message,
    });
  }
};

// ✅ Only Admin can view all feedback
const getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await feedbackModel
      .find()
      .populate("user_id", "name email") // Populate user details
      .sort({ createdAt: -1 });

    res.status(200).json(feedbackList);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching feedback", error });
  }
};
// ✅ Admin: Delete Feedback
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params; // Get feedback ID from request params

    // Find and delete feedback
    const deletedFeedback = await feedbackModel.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found" });
    }

    res.json({ success: true, message: "Feedback deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting feedback",
      error: error.message,
    });
  }
};

export { submitFeedback, getAllFeedback, deleteFeedback };
