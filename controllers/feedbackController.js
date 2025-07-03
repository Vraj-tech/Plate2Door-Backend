import feedbackModel from "../models/feedbackModel.js";
import userModel from "../models/userModel.js";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

// ✅ Dynamic load bad-words (CommonJS) in ESM environment
let Filter;
const loadFilter = async () => {
  if (!Filter) {
    const badWordsModule = await import("bad-words");
    Filter = badWordsModule.Filter || badWordsModule.default;
  }
};

// ✅ Secure: Extract user_id from token via `authMiddleware`
const submitFeedback = async (req, res) => {
  try {
    console.log("📥 Feedback Request Received:", req.body);

    // ✅ Ensure user is authenticated
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in." });
    }

    const { rating, selected_options, feedback_text } = req.body;
    const user_id = req.userId;

    // ✅ Validate user existence
    const userExists = await userModel.findById(user_id);
    if (!userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    // 🧼 Load filter and check for bad words
    await loadFilter();
    const filter = new Filter(); // ✅ Fixed: Direct constructor
    if (filter.isProfane(feedback_text)) {
      return res.status(400).json({
        success: false,
        message:
          "Your feedback contains inappropriate words. Please revise it.",
      });
    }

    // ✅ Create and save feedback
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

// ✅ Admin: View all feedback
const getAllFeedback = async (req, res) => {
  try {
    const feedbackList = await feedbackModel
      .find()
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(feedbackList);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching feedback", error });
  }
};

// ✅ Admin: Delete feedback by ID
const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

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
