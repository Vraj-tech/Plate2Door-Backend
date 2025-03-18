import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }],

    // ✅ OTP for Forgot Password (Replaces Reset Token)
    resetOTP: { type: String, default: null }, // Stores the OTP
    resetOTPExpires: { type: Date, default: null }, // Expiration time for OTP
  },
  { minimize: false, timestamps: true } // ✅ Keeps track of createdAt & updatedAt
);

// ✅ Ensure the model is not recompiled multiple times
const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
