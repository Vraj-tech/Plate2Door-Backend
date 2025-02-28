import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Config variables
const currency = "inr";
const frontend_URL = "http://localhost:5173";

// Placing User Order for Frontend using Stripe
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address, discountAmount, couponCode } =
      req.body;

    // Ensure the total amount is accurate (already includes delivery charge)
    const discountedTotal = amount;

    const newOrder = new orderModel({
      userId,
      items,
      amount: discountedTotal, // Save discounted total
      address,
      discountAmount,
      couponCode,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Calculate discounted price per item
    const totalOriginalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discountRatio =
      totalOriginalPrice > 0 ? discountedTotal / totalOriginalPrice : 1;

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * discountRatio * 100), // Apply discount proportionally
      },
      quantity: item.quantity,
    }));

    // ✅ No need to add delivery charge separately since `amount` already includes it

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      success_url: `${frontend_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_URL}/verify?success=false&orderId=${newOrder._id}`,
      line_items: line_items, // ✅ Now only shows actual food items
      mode: "payment",
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Placing User Order for Frontend using COD
const placeOrderCod = async (req, res) => {
  try {
    const { userId, items, amount, address, discountAmount, couponCode } =
      req.body;

    const newOrder = new orderModel({
      userId,
      items,
      amount, // ✅ COD also saves discounted total
      address,
      payment: true,
      discountAmount,
      couponCode,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing Orders for Admin Panel
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// User Orders for Frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Updating Order Status
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// Verifying Order Payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: "Not Verified" });
  }
};

export {
  placeOrder,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  placeOrderCod,
};
