import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  updateFood,
  searchFood,
  getFoodById, // Import the getFoodById function
  suggestFood, // ✅ ADD this line
} from "../controllers/foodController.js";
import multer from "multer";
import foodModel from "../models/foodModel.js"; // Import the food model

const foodRouter = express.Router();

// Image Storage Engine (Saving image to uploads folder & renaming it)
const storage = multer.diskStorage({
  destination: "uploads", // Ensure the 'uploads' folder exists and is writable
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Include a timestamp for unique filenames
  },
});

const upload = multer({ storage });

// API Endpoints
foodRouter.get("/list", listFood); // Get all food items
foodRouter.post("/add", upload.single("image"), addFood); // Add a new food item
foodRouter.post("/remove", removeFood); // Remove a food item
foodRouter.put("/update/:foodId", upload.single("image"), updateFood); // Update a food item

// Search food items by name or category
foodRouter.get("/search", searchFood); // New search route
// 🔍 Autocomplete suggestion endpoint
foodRouter.get("/suggestions", suggestFood);

foodRouter.get("/:foodId", getFoodById); // Get food by ID (to pre-fill the update form)

export default foodRouter;
