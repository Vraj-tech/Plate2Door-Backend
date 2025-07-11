import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Config variables
const currency = "inr";
const frontend_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ✅ Nodemailer Transporter Setup for Order Emails
export const transporter = nodemailer.createTransport({
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
const sendOrderEmail = async ({
  to,
  orderId,
  paymentMethod,
  userName,
  items = [],
  address = {},
  amount,
}) => {
  const subject = "✅ Plate2Door - Your Order is Confirmed!";

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
            item.name
          }</td>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd;">${
            item.quantity
          }</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">₹${
            item.price * item.quantity
          }</td>
        </tr>`
    )
    .join("");

  const addressHtml = `
    ${address.firstName || ""} ${address.lastName || ""}<br/>
    ${address.street || ""}, ${address.city || ""}<br/>
    ${address.state || ""} - ${address.zipcode || ""}<br/>
    Phone: ${address.phone || ""}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: #4CAF50; text-align: center;">Thank You for Your Order${
          userName ? `, ${userName}` : ""
        }!</h2>
        <p style="font-size: 16px; color: #333;">Your order <strong>#${orderId}</strong> has been successfully placed using <strong>${paymentMethod}</strong>.</p>

        <h3 style="margin-top: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">🧾 Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #333;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <p style="margin-top: 12px; font-size: 16px;"><strong>Total Paid:</strong> ₹${amount}</p>

        <h3 style="margin-top: 30px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">📍 Delivery Address</h3>
        <p style="line-height: 1.6; font-size: 15px; color: #555;">${addressHtml}</p>

        <a href="${frontend_URL}/myorders" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Track Your Order
        </a>

        <p style="margin-top: 30px; font-size: 15px; color: #333;">🍽️ Thanks for choosing <strong>Plate2Door</strong>. We hope you enjoy your meal!</p>

        <hr style="margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Plate2Door. All rights reserved.</p>
      </div>
    </body>
    </html>
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
      userName: user.name,
      items,
      address,
      amount, // Pass user name if available
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
      userName: user.name,
      items,
      address,
      amount, // Pass user name if available
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
// ✅ Fetch Order Statistics
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const pendingOrders = await orderModel.countDocuments({
      status: "Food Processing",
    });
    const outForDelivery = await orderModel.countDocuments({
      status: "Out for Delivery",
    });
    const deliveredOrders = await orderModel.countDocuments({
      status: "Delivered",
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        outForDelivery,
        deliveredOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.json({ success: false, message: "Error fetching order statistics" });
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
  getOrderStats,
};
//okok
