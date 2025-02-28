import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }],

    // ✅ Reset Token for Forgot Password
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { minimize: false, timestamps: true } // ✅ Added timestamps for createdAt & updatedAt
);

// ✅ Ensure the model is not recompiled multiple times
const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
