import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import foodModel from "../models/foodModel.js"; // Import food model for category food removal

// Get all categories
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching category list" });
  }
};

// Add a new food category
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const image_filename = req.file
      ? `/uploads/categories/${req.file.filename}`
      : null;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const category = new categoryModel({
      name,
      image: image_filename,
    });

    await category.save();
    res.json({ success: true, message: "Category added successfully!" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to add the category" });
  }
};

const removeCategory = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.id);
    if (category) {
      // Delete image file from the server if it exists
      if (category.image) {
        try {
          const imagePath = `.${category.image}`; // Remove extra "uploads/categories/"
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image file: ${imagePath}`);
          } else {
            console.warn(`Image file not found: ${imagePath}`);
          }
        } catch (err) {
          console.error("Error deleting image file", err);
        }
      }

      // Delete all food items associated with this category
      await foodModel.deleteMany({ category: category.name });

      // Delete category entry from the database
      await categoryModel.findByIdAndDelete(req.body.id);

      res.json({
        success: true,
        message: "Category and associated foods removed successfully!",
      });
    } else {
      res.status(404).json({ success: false, message: "Category not found" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error removing category" });
  }
};

// Get a single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching category details" });
  }
};

export { listCategories, addCategory, removeCategory, getCategoryById };
