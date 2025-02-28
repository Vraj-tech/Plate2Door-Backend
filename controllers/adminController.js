import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import adminModel from "../models/adminModel.js";

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin does not exist" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(admin._id);

    res.json({
      success: true,
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error, please try again" });
  }
};

// Admin Registration
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    // Check if admin already exists
    const exists = await adminModel.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }

    // Validate email and password
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid email" });
    }
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin
    const newAdmin = new adminModel({ name, email, password: hashedPassword });
    await newAdmin.save();

    // Generate token
    const token = createToken(newAdmin._id);

    res.status(201).json({
      success: true,
      token,
      admin: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error, please try again" });
  }
};

export { loginAdmin, registerAdmin };
