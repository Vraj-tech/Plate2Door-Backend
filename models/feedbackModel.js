import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // ✅ Matches your user model
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    selected_options: { type: [String], default: [] }, // ✅ Array for predefined choices
    feedback_text: { type: String, trim: true },
  },
  { timestamps: true } // ✅ Keeps track of createdAt & updatedAt automatically
);

// ✅ Ensure the model is not recompiled multiple times
const feedbackModel =
  mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);
export default feedbackModel;
