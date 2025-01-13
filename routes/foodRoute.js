import express from "express";
import {
  addFood,
  listFood,
  removeFood,
  updateFood,
} from "../controllers/foodController.js";
import multer from "multer";
import foodModel from "../models/foodModel.js"; // Importing the food model

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

// Fetch a single food item by ID (to pre-fill update form)
foodRouter.get("/:foodId", async (req, res) => {
  try {
    const food = await foodModel.findById(req.params.foodId); // Fetch food by ID
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    res.json({ success: true, data: food }); // Return the food details
  } catch (error) {
    console.error("Error fetching food details:", error); // Log error for debugging
    res.status(500).json({
      success: false,
      message: "Error fetching food details",
    });
  }
});

export default foodRouter;
