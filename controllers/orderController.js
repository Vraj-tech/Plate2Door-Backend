import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Config variables
const currency = "inr";
const frontend_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ✅ Nodemailer Transporter Setup for Order Emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Refined Function to Send Professional Order Confirmation Email
const sendOrderEmail = async ({ to, orderId, paymentMethod, userName }) => {
  const subject = "✅ Plate2Door - Your Order is Confirmed!";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="text-align: center; color: #4CAF50;">Thank You for Your Order${
        userName ? `, ${userName}` : ""
      }!</h2>
      <p>Your order <strong>#${orderId}</strong> has been <strong>successfully placed</strong> using <strong>${paymentMethod}</strong>.</p>
      
      <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; border: 1px solid #ddd; margin: 15px 0;">
        <p style="margin: 0;"><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p style="margin: 0;"><strong>Order ID:</strong> ${orderId}</p>
      </div>
      
      <p>You can track your order status by clicking the button below:</p>
      <a href="${frontend_URL}/myorders" 
         style="display: inline-block; padding: 12px 24px; margin-top: 10px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 4px;">
         Track Your Order
      </a>

      <p style="margin-top: 20px;">🍽️ Thank you for choosing <strong>Plate2Door</strong>! We hope you enjoy your meal.</p>
      <p style="font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Plate2Door. All rights reserved.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Plate2Door" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Order confirmation email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send order email: ${error}`);
  }
};

// ✅ Placing User Order with Stripe
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, discountAmount, couponCode } =
      req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      discountAmount,
      couponCode,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Send confirmation email
    const user = await userModel.findById(userId);
    // await sendOrderEmail({
    //   to: user.email,
    //   orderId: newOrder._id,
    //   paymentMethod: "Stripe",
    // });
    // Stripe Order Email
    await sendOrderEmail({
      to: user.email,
      orderId: newOrder._id,
      paymentMethod: "Stripe",
      userName: user.name, // Pass user name if available
    });

    // Calculate discounted price per item
    const totalOriginalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountRatio =
      totalOriginalPrice > 0 ? amount / totalOriginalPrice : 1;

    const line_items = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * discountRatio * 100),
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error placing order" });
  }
};

// ✅ Placing User Order with COD
const placeOrderCod = async (req, res) => {
  try {
    const { userId, items, amount, address, discountAmount, couponCode } =
      req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: true,
      discountAmount,
      couponCode,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Send confirmation email
    const user = await userModel.findById(userId);
    // COD Order Email
    await sendOrderEmail({
      to: user.email,
      orderId: newOrder._id,
      paymentMethod: "Cash on Delivery",
      userName: user.name, // Pass user name if available
    });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error placing COD order" });
  }
};

// ✅ Listing All Orders for Admin Panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching orders" });
  }
};

// ✅ Fetch User's Orders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.body.userId })
      .populate("deliveryPartner", "name phone"); // Include delivery partner's name & phone

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching user orders" });
  }
};

// ✅ Update Order Status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error updating status" });
  }
};

// ✅ Verify Order Payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Payment Verified" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Payment Failed, Order Deleted" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error verifying payment" });
  }
};

// ✅ Fetch Orders Assigned to a Delivery Partner
const getPartnerOrders = async (req, res) => {
  try {
    const { partnerId } = req.body;
    const orders = await orderModel.find({ deliveryPartner: partnerId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching partner orders:", error);
    res.json({ success: false, message: "Error fetching partner orders" });
  }
};

export {
  placeOrder,
  placeOrderCod,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  getPartnerOrders,
};
//okok
