import express from "express";
import {
  addCategory,
  listCategories,
  removeCategory,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";
import { upload } from "../config/cloudinary.js"; // ✅ Using Cloudinary config

const categoryRouter = express.Router();

// ✅ Routes
categoryRouter.get("/list", listCategories); // Get all categories
categoryRouter.get("/:categoryId", getCategoryById); // Get category by ID

categoryRouter.post("/add", upload.single("image"), addCategory); // Add category
categoryRouter.put(
  "/update/:categoryId",
  upload.single("image"),
  updateCategory
); // Update category
categoryRouter.delete("/remove", removeCategory); // Remove category

export default categoryRouter;
