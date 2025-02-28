import express from "express";
import { loginAdmin, registerAdmin } from "../controllers/adminController.js";
import adminAuthMiddleware from "../middleware/adminAuth.js"; // Import the middleware

const router = express.Router();

// Admin login and registration routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Example of a protected route (optional)
router.get("/admin-panel", adminAuthMiddleware, (req, res) => {
  res.json({ success: true, message: "You have access to this admin route!" });
});

export default router;
