import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import couponRouter from "./routes/couponRoute.js";
import adminRouter from "./routes/adminRoute.js"; // Import admin routes

import "dotenv/config";

// app config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables Cross-Origin Resource Sharing

// Database connection
connectDB();

app.use("/uploads", express.static("uploads"));

// // Static file serving
app.use("/images", express.static("uploads")); // Ensure images from 'uploads' folder are accessible

// API endpoints
app.use("/api/admin", adminRouter); // Add admin routes
app.use("/api/user", userRouter); // Handles user-related routes
app.use("/api/food", foodRouter); // Handles food-related routes
app.use("/api/cart", cartRouter); // Handles cart-related routes
app.use("/api/order", orderRouter); // Handles order-related routes
app.use("/api/categories", categoryRouter); // Handles category-related routes
app.use("/api/coupons", couponRouter);

// Root route for API status
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});

// Error handling middleware (Optional)
app.use((err, req, res, next) => {
  console.error("Error:", err.message); // Log error details
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start the server
app.listen(port, () =>
  console.log(`🚀 Server started on http://localhost:${port}`)
);

//new day2 coupan
