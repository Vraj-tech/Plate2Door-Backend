import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";

// Load .env
dotenv.config();

// Create token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" }); // Token valid for 7 days
};
// ✅ Function to send emails using Nodemailer
const sendEmail = async ({ to, subject, html }) => {
  try {
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

    const mailOptions = {
      from: `"Plate2Door" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Email sending failed: ${error}`);
  }
};

// ---------------------- AUTH FUNCTIONALITY ----------------------

// Login user with login notification email
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    // Send Login Notification Email
    sendEmail({
      to: email,
      subject: "New Login Alert - Plate2Door",
      html: `
        <h3>New Login Detected</h3>
        <p>Your account was just logged into. If this wasn't you, please reset your password immediately.</p>
      `,
    });

    res.status(200).json({
      success: true,
      token,
      userId: user._id,
      message: "Login Successful",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Register user with welcome email
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const salt = await bcrypt.genSalt(7);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();
    const token = createToken(user._id);

    // Send Welcome Email
    sendEmail({
      to: email,
      subject: "Welcome to Plate2Door!",
      html: `
        <h3>Welcome, ${name}!</h3>
        <p>Thank you for signing up with Plate2Door. Start exploring delicious food now!</p>
      `,
    });

    res.json({ success: true, token, message: "Registration successful!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// ---------------------- FORGOT PASSWORD FUNCTIONALITY ----------------------
// ✅ Send OTP for Password Reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    // Store OTP in user document
    user.resetOTP = hashedOTP;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    console.log(`✅ OTP Sent: ${otp}`);

    // Send OTP via email
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

    const mailOptions = {
      from: `"Plate2Door" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password Reset OTP - Plate2Door",
      html: `
        <h3>Your OTP for Password Reset</h3>
        <p>Use the following OTP to reset your password: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent successfully!");

    res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};
// ✅ Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (
      !user.resetOTP ||
      !user.resetOTPExpires ||
      user.resetOTPExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired. Request a new one." });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    if (hashedOTP !== user.resetOTP) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Try again." });
    }

    // OTP Verified - Allow password reset
    res.status(200).json({
      success: true,
      message: "OTP verified. Proceed to reset password.",
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};
// ---------------------- FAVORITES FUNCTIONALITY ----------------------

// Add a food item to favorites
const addToFavorites = async (req, res) => {
  try {
    const { userId, foodId } = req.body;
    const user = await userModel.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.favorites.includes(foodId)) {
      user.favorites.push(foodId);
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Added to favorites" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Already in favorites" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Remove a food item from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { userId, foodId } = req.body;
    const user = await userModel.findById(userId);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.favorites = user.favorites.filter((id) => id.toString() !== foodId);
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get user's bookmarked food items
const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing userId" });
    }

    const user = await userModel.findById(userId).populate({
      path: "favorites",
      model: "food",
      select: "name price image",
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

    const updatedFavorites = user.favorites.map((item) => ({
      ...item._doc,
      image: item.image?.startsWith("http")
        ? item.image // Already a full URL (Cloudinary)
        : `${BASE_URL}/uploads/${item.image}`, // Local image
    }));

    res.status(200).json({ success: true, favorites: updatedFavorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get most bookmarked foods for admin
const getBookmarkStats = async (req, res) => {
  try {
    const users = await userModel.find({}, "favorites");
    const foodCounts = {};

    users.forEach((user) => {
      user.favorites.forEach((foodId) => {
        foodCounts[foodId] = (foodCounts[foodId] || 0) + 1;
      });
    });

    const bookmarkedFoods = await foodModel.find({
      _id: { $in: Object.keys(foodCounts) },
    });

    const result = bookmarkedFoods.map((food) => ({
      id: food._id,
      name: food.name,
      bookmarks: foodCounts[food._id] || 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// ✅ Reset Password using OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (
      !user.resetOTP ||
      !user.resetOTPExpires ||
      user.resetOTPExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired. Request a new one." });
    }

    const hashedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    if (hashedOTP !== user.resetOTP) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP. Try again." });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// ✅ Get User Profile (Name, Email)
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select("name email");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update User Profile (Name, Email)
const updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.userId,
      { name, email },
      { new: true, select: "name email" }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  loginUser,
  registerUser,
  forgotPassword,
  verifyOTP,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  getBookmarkStats,
  resetPassword,
  getUserProfile,
  updateUserProfile,
};
