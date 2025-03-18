import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listOrders,
  placeOrder,
  updateStatus,
  userOrders,
  verifyOrder,
  placeOrderCod,
  getPartnerOrders,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/status", updateStatus);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);
orderRouter.post("/partner-orders", authMiddleware, getPartnerOrders); // ✅ Add new route

export default orderRouter;
