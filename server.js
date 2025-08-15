import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import foodRouter from "./routes/foodRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import couponRouter from "./routes/couponRoute.js";
import adminRouter from "./routes/adminRoute.js"; // Import admin routes
import feedbackRouter from "./routes/feedbackRoutes.js"; // ✅ Import feedback routes
import deliveryPartnerRoutes from "./routes/deliveryPartnerRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import geocodeRoutes from "./routes/geocode.js";

import "dotenv/config";

// app config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables Cross-Origin Resource Sharing

// Database connection
connectDB();

// app.use("/uploads", express.static("uploads"));

// // Static file serving
// app.use("/images", express.static("uploads")); // Ensure images from 'uploads' folder are accessible

// API endpoints
app.use("/api/admin", adminRouter); // Add admin routes
app.use("/api/user", userRouter); // Handles user-related routes
app.use("/api/food", foodRouter); // Handles food-related routes
app.use("/api/cart", cartRouter); // Handles cart-related routes
app.use("/api/order", orderRouter); // Handles order-related routes
app.use("/api/categories", categoryRouter); // Handles category-related routes
app.use("/api/coupons", couponRouter); // Handles coupon routes
app.use("/api/feedback", feedbackRouter); // ✅ Add feedback routes
app.use("/api/delivery", deliveryPartnerRoutes);
app.use("/api/reviews", ratingRoutes);
app.use("/api/geocode", geocodeRoutes);

// Root route for API status
app.get("/", (req, res) => {
  res.json({ success: true, message: "API is working!" });
});

// Error handling middleware (Optional)
app.use((err, req, res, next) => {
  console.error("Error:", err.message); // Log error details
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

/// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "https://plate2door-frontend.onrender.com", // later restrict this to your frontend domain
    methods: ["GET", "POST"],
  },
});

// Store latest location for each order
const lastLocations = {};

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // Join specific order room
  socket.on("joinRoom", (orderId) => {
    console.log(`Socket ${socket.id} joining room: ${orderId}`);
    socket.join(orderId);

    // If we have the last known location, send it instantly
    if (lastLocations[orderId]) {
      socket.emit("locationUpdate", lastLocations[orderId]);
    }

    // Debug: show all sockets in the room
    const roomSockets = io.sockets.adapter.rooms.get(orderId);
    console.log(
      `📦 Current sockets in room ${orderId}:`,
      roomSockets ? [...roomSockets] : []
    );
  });

  // Receive location updates from the delivery partner
  socket.on("locationUpdate", ({ orderId, lat, lng }) => {
    console.log(`📍 Order ${orderId} location update: ${lat}, ${lng}`);

    // Save the latest location in memory
    lastLocations[orderId] = { lat, lng };

    // Broadcast to everyone in the room
    io.to(orderId).emit("locationUpdate", { lat, lng });
  });

  // Handle socket disconnections
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`🚀 Server + Socket.IO running at http://localhost:${port}`);
});
