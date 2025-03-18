import express from "express";
import {
  registerDeliveryPartner,
  loginDeliveryPartner,
  getAssignedOrders,
  assignDeliveryPartner,
  getAllDeliveryPartners,
  getPendingDeliveryPartners, // ✅ Added for admin approval
  updateDeliveryPartnerStatus,
  updateOrderStatus, // ✅ Added for approval/rejection
  updateAvailability,
} from "../controllers/deliveryPartnerController.js";
import authMiddleware from "../middleware/auth.js"; // ✅ Ensure this exists
import orderModel from "../models/orderModel.js"; // ✅ Import Order Model

const Deliveryrouter = express.Router();

// ✅ Register Delivery Partner
Deliveryrouter.post("/register", registerDeliveryPartner);

// ✅ Login Delivery Partner
Deliveryrouter.post("/login", loginDeliveryPartner);

// ✅ Assign Delivery Partner to an Order
Deliveryrouter.post("/assign-delivery", assignDeliveryPartner);

// ✅ Fetch Assigned Orders (Protected Route)
Deliveryrouter.get("/orders", authMiddleware, getAssignedOrders);

Deliveryrouter.put(
  "/orders/:orderId/status",
  authMiddleware,
  updateOrderStatus
); // ✅ New route added

// ✅ List All Delivery Partners (Admin View)
Deliveryrouter.get("/list", getAllDeliveryPartners);

// ✅ Get Pending Delivery Partners (Admin View)
Deliveryrouter.get("/pending", getPendingDeliveryPartners);

// ✅ Approve or Reject Delivery Partner (Admin Action)
Deliveryrouter.put("/status", updateDeliveryPartnerStatus);
// ✅ Update availability route

Deliveryrouter.put("/availability", updateAvailability);

export default Deliveryrouter;
