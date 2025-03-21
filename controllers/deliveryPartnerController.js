import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import deliveryPartnerModel from "../models/DeliveryPartner.js";
import orderModel from "../models/orderModel.js"; // ✅ Import Order Model
import { transporter } from "./orderController.js"; // ✅ Correct ES Module import

// ✅ Register Delivery Partner
// ✅ Register Delivery Partner with 'pending' status
const registerDeliveryPartner = async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    // 🔍 Check if email or phone already exists
    const existingPartner = await deliveryPartnerModel.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingPartner) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    // 🆕 Create new delivery partner with 'pending' status
    const newPartner = new deliveryPartnerModel({
      name,
      email: email.toLowerCase(),
      password, // ✅ Password hashing is handled in the model schema
      phone,
      status: "pending",
    });

    await newPartner.save();

    res.status(201).json({
      message: "Registration successful. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// ✅ Delivery Partner Login
// ✅ Delivery Partner Login (Updated with Status Check)
const loginDeliveryPartner = async (req, res) => {
  const { email, password } = req.body;

  try {
    const partner = await deliveryPartnerModel.findOne({
      email: email.toLowerCase(),
    });

    if (!partner) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🔑 Compare hashed password
    const isMatch = await bcrypt.compare(password, partner.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 🔍 Check partner's approval status
    if (partner.status === "pending") {
      return res.status(403).json({
        message: "Account pending approval. Please wait for admin approval.",
      });
    }

    if (partner.status === "rejected") {
      return res.status(403).json({
        message:
          "Your account has been rejected. Contact support for more info.",
      });
    }

    // 🎟️ Generate JWT Token if approved
    const token = jwt.sign(
      { id: partner._id, role: "deliveryPartner" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      partnerId: partner._id,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// ✅ Assign Delivery Partner & Send Email
const assignDeliveryPartner = async (req, res) => {
  try {
    const { orderId, deliveryPartnerId } = req.body;

    if (!orderId || !deliveryPartnerId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId or deliveryPartnerId",
      });
    }

    // ✅ Check if the delivery partner exists
    const deliveryPartner = await deliveryPartnerModel.findById(
      deliveryPartnerId
    );
    if (!deliveryPartner) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery partner not found" });
    }

    // ✅ Update the order with the assigned delivery partner
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        deliveryPartner: deliveryPartnerId,
        status: "Out for Delivery",
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // ✅ Add the order to the delivery partner's `assignedOrders` array
    await deliveryPartnerModel.findByIdAndUpdate(
      deliveryPartnerId,
      { $push: { assignedOrders: orderId } },
      { new: true }
    );

    // ✅ Send Email Notification to Delivery Partner
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: deliveryPartner.email, // Assigned delivery partner's email
      subject: "🚚 New Delivery Assignment - Order #" + updatedOrder._id,
      text: `Dear ${deliveryPartner.name},
    
    You have been assigned a new delivery order.
    
    📦 Order ID: ${updatedOrder._id}
    🕒 Please check your dashboard for more details.
    
    Make sure to complete the delivery on time and provide excellent service.
    
    Thank you for your dedication!
    
    Best regards,  
    Plate2Door Team
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("❌ Email error:", error);
      } else {
        console.log("✅ Email sent:", info.response);
      }
    });

    res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully & email sent",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Get Orders Assigned to a Delivery Partner
// ✅ Enhanced Get Orders Assigned to a Delivery Partner
const getAssignedOrders = async (req, res) => {
  try {
    const partnerId = req.userId; // Use the userId from authMiddleware

    // ✅ Fetch the delivery partner and populate assigned orders
    const partner = await deliveryPartnerModel.findById(partnerId).populate({
      path: "assignedOrders",
      populate: [
        { path: "items.food", select: "name price" }, // Correct food item details
        { path: "userId", select: "name email phone address" }, // Correct user details
      ],
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    if (!partner.assignedOrders || partner.assignedOrders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No assigned orders found",
        assignedOrders: [],
      });
    }

    res.status(200).json({
      success: true,
      assignedOrders: partner.assignedOrders,
    });
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    res.status(500).json({
      message:
        "Something went wrong while fetching orders. Please try again later.",
    });
  }
};

// ✅ Get All Delivery Partners (List)
const getAllDeliveryPartners = async (req, res) => {
  try {
    // ✅ Fetch all delivery partners with assigned orders populated
    const partners = await deliveryPartnerModel
      .find()
      .populate("assignedOrders", "foodItems totalAmount status");

    if (partners.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No delivery partners found" });
    }

    res.status(200).json({ success: true, partners });
  } catch (error) {
    console.error("Error fetching delivery partners:", error);
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
// ✅ Get All Pending Delivery Partners
const getPendingDeliveryPartners = async (req, res) => {
  try {
    const pendingPartners = await deliveryPartnerModel.find({
      status: "pending",
    });

    res.status(200).json({ success: true, pendingPartners });
  } catch (error) {
    console.error("Error fetching pending partners:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};
// ✅ Approve or Reject Delivery Partner
const updateDeliveryPartnerStatus = async (req, res) => {
  const { partnerId, status } = req.body;

  // ✅ Validate status value
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const updatedPartner = await deliveryPartnerModel.findByIdAndUpdate(
      partnerId,
      { status },
      { new: true }
    );

    if (!updatedPartner) {
      return res.status(404).json({ message: "Delivery partner not found" });
    }

    res.status(200).json({
      success: true,
      message: `Partner status updated to '${status}'`,
      partner: updatedPartner,
    });
  } catch (error) {
    console.error("Error updating partner status:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};
// ✅ Update Order Status Controller (with isFinalDelivered logic)
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  // ✅ Valid statuses
  const validStatuses = ["Out for Delivery", "Delivered"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // ✅ Fetch the order first
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ If the order is already marked as finally delivered, prevent status change
    if (order.isFinalDelivered) {
      return res.status(400).json({
        message:
          "This order is already marked as Delivered and cannot be updated further.",
      });
    }

    // ✅ Update the order status
    order.status = status;

    // ✅ Lock the status if it's marked as Delivered
    if (status === "Delivered") {
      order.isFinalDelivered = true;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'`,
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ Update Availability Status
const updateAvailability = async (req, res) => {
  const { partnerId, isAvailable } = req.body;

  try {
    const partner = await deliveryPartnerModel.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    partner.isAvailable = isAvailable;
    await partner.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to '${
        isAvailable ? "Available" : "Not Available"
      }'`,
      partner,
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
export {
  registerDeliveryPartner,
  loginDeliveryPartner,
  getAssignedOrders,
  assignDeliveryPartner,
  getAllDeliveryPartners,
  getPendingDeliveryPartners, // ✅ Added for admin approval
  updateDeliveryPartnerStatus,
  updateOrderStatus, // ✅ Added for approval/rejection
  updateAvailability,
};
