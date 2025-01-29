import express from "express";
import multer from "multer";
import {
  addCategory,
  listCategories,
  removeCategory,
  getCategoryById,
} from "../controllers/categoryController.js";

// Image Storage Engine (Saving image to uploads folder & renaming it)
const storage = multer.diskStorage({
  destination: "uploads/categories", // Ensure the 'uploads/categories' folder exists and is writable
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Include a timestamp for unique filenames
  },
});

const upload = multer({ storage });

const categoryRouter = express.Router();

// API Endpoints
categoryRouter.get("/list", listCategories); // Get all categories
categoryRouter.post("/add", upload.single("image"), addCategory); // Add a new category
categoryRouter.delete("/remove", removeCategory); // Remove a category (changed to DELETE method)
categoryRouter.get("/:categoryId", getCategoryById); // Get category by ID

export default categoryRouter;
