import express from "express";
import {
  listCoupons,
  addCoupon,
  removeCoupon,
  getCouponById,
  getAvailableCoupons,
  applyCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

// Admin routes
router.post("/add", addCoupon); // Add coupon
router.post("/remove", removeCoupon); // Remove coupon

// User routes
router.get("/list", listCoupons); // Get all coupons
router.get("/available", getAvailableCoupons); // Get available coupons for cart total
router.get("/:couponId", getCouponById); // Get a coupon by ID
router.post("/apply", applyCoupon); // Apply a coupon

export default router;
