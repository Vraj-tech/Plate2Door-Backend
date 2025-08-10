import categoryModel from "../models/categoryModel.js";
import foodModel from "../models/foodModel.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ List all categories
const listCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({});
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching category list" });
  }
};

// ✅ Add category (Cloudinary upload)
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const imageUrl = req.file?.path || "";

    if (!name || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Category name and image are required",
      });
    }

    const category = new categoryModel({
      name,
      image: imageUrl,
    });

    await category.save();
    res.json({
      success: true,
      message: "Category added successfully!",
      data: category,
    });
  } catch (error) {
    console.error("Add category error:", error);
    res.json({ success: false, message: "Failed to add the category" });
  }
};

// ✅ Remove category (delete image + related foods)
const removeCategory = async (req, res) => {
  try {
    const category = await categoryModel.findById(req.body.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // ✅ Delete category image from Cloudinary
    if (category.image) {
      const parts = category.image.split("/");
      const uploadIndex = parts.indexOf("upload");
      const pathParts = parts.slice(uploadIndex + 1);
      if (pathParts[0].startsWith("v")) pathParts.shift();
      const fileName = pathParts.pop().split(".")[0];
      const publicId = [...pathParts, fileName].join("/");

      console.log("Deleting category image:", publicId);
      await cloudinary.uploader.destroy(publicId);
    }

    // ✅ Delete all food items linked to this category
    await foodModel.deleteMany({ category: category.name });

    // ✅ Delete category itself
    await categoryModel.findByIdAndDelete(req.body.id);

    res.json({
      success: true,
      message: "Category and associated foods removed successfully!",
    });
  } catch (error) {
    console.error("Error removing category:", error);
    res.json({ success: false, message: "Error removing category" });
  }
};

// ✅ Get category by ID

const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    console.error("Error fetching category details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category details",
    });
  }
};

// ✅ Update category (with optional new image)
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // If new image uploaded → delete old from Cloudinary
    if (req.file?.path) {
      if (category.image) {
        const parts = category.image.split("/");
        const uploadIndex = parts.indexOf("upload");
        const pathParts = parts.slice(uploadIndex + 1);
        if (pathParts[0].startsWith("v")) pathParts.shift();
        const fileName = pathParts.pop().split(".")[0];
        const publicId = [...pathParts, fileName].join("/");

        console.log("Deleting old category image:", publicId);
        await cloudinary.uploader.destroy(publicId);
      }
      category.image = req.file.path;
    }

    if (name) category.name = name;

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully!",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating category" });
  }
};

export {
  listCategories,
  addCategory,
  removeCategory,
  getCategoryById,
  updateCategory,
};
