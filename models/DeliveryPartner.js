import mongoose from "mongoose";
import bcrypt from "bcrypt";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    isAvailable: { type: Boolean, default: false }, // ✅ New field for availability
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    }, // ✅ Status field

    role: { type: String, default: "deliveryPartner" }, // ✅ Role for future access control
    assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }], // ✅ Fixed ref to "Order" (uppercase, ensure consistency)
  },
  { timestamps: true } // ✅ Keeps track of createdAt & updatedAt
);

// ✅ Hash password before saving
deliveryPartnerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✅ Ensure the model is not recompiled multiple times
const deliveryPartnerModel =
  mongoose.models.DeliveryPartner ||
  mongoose.model("DeliveryPartner", deliveryPartnerSchema);

export default deliveryPartnerModel;
