import couponModel from "../models/couponModel.js";

// Get all coupons
const listCoupons = async (req, res) => {
  try {
    const coupons = await couponModel.find({});
    res.json({ success: true, data: coupons });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching coupon list" });
  }
};

// Admin: Add a new coupon
const addCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, minOrderAmount, expiryDate, usageLimit } =
      req.body;

    if (!code || !discountPercentage || !minOrderAmount || !expiryDate) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    const existingCoupon = await couponModel.findOne({ code });
    if (existingCoupon) {
      return res.json({ success: false, message: "Coupon already exists!" });
    }

    const newCoupon = new couponModel({
      code,
      discountPercentage,
      minOrderAmount,
      expiryDate,
      usageLimit,
    });
    await newCoupon.save();

    res.json({ success: true, message: "Coupon added successfully!" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to add coupon" });
  }
};

// Remove a coupon
const removeCoupon = async (req, res) => {
  try {
    const coupon = await couponModel.findById(req.body.id);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    await couponModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Coupon removed successfully!" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error removing coupon" });
  }
};

// Get a single coupon by ID
const getCouponById = async (req, res) => {
  try {
    const { couponId } = req.params;
    const coupon = await couponModel.findById(couponId);

    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching coupon details" });
  }
};

// Get available coupons based on cart total
const getAvailableCoupons = async (req, res) => {
  try {
    const { totalAmount } = req.query; // User's cart total amount
    const coupons = await couponModel.find({});

    const availableCoupons = coupons.filter(
      (coupon) => totalAmount >= coupon.minOrderAmount
    );

    if (availableCoupons.length > 0) {
      return res.json({ success: true, data: availableCoupons });
    }

    return res.json({ success: false, message: "No available coupons" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching available coupons" });
  }
};

// Apply a coupon
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const coupon = await couponModel.findOne({ code });
    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon code!" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.json({ success: false, message: "Coupon expired!" });
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minOrderAmount}`,
      });
    }

    const discountAmount = (orderAmount * coupon.discountPercentage) / 100;
    const newTotal = orderAmount - discountAmount;

    res.json({
      success: true,
      discountAmount,
      newTotal,
      message: "Coupon applied successfully!",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error applying coupon" });
  }
};

export {
  listCoupons,
  addCoupon,
  removeCoupon,
  getCouponById,
  getAvailableCoupons,
  applyCoupon,
};
//new1 wow
