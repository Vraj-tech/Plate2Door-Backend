import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., "SAVE50"
    discountPercentage: { type: Number, required: true }, // e.g., 10 for 10% off
    minOrderAmount: { type: Number, required: true }, // Minimum order amount for coupon
    expiryDate: { type: Date, required: true }, // Expiry date
    usageLimit: { type: Number, required: true, default: 1 }, // Max times a coupon can be used
  },
  { timestamps: true }
);

const couponModel = mongoose.model("Coupon", couponSchema);
export default couponModel;
