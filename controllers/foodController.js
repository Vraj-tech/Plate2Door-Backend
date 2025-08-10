import foodModel from "../models/foodModel.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ REMOVE fs – not needed with Cloudinary anymore
// import fs from "fs";

// ✅ List all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching food list" });
  }
};

// ✅ Add new food item (Cloudinary auto uploads image, and gives you URL)
const addFood = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const imageUrl = req.file?.path || "";

    console.log("req.body =>", req.body);
    console.log("req.file =>", req.file);
    // Simple validation
    if (!name || !description || !price || !category || !imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const food = new foodModel({
      name,
      description,
      price,
      category,
      image: imageUrl,
    });

    await food.save();
    console.log("Food added:", food);

    res.status(201).json({
      success: true,
      message: "Food Added Successfully ✅",
      data: food,
    });
  } catch (error) {
    console.error("Add food error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add the product" });
  }
};

// ✅ Remove food (no fs.unlinkSync – let Cloudinary manage images for now)
// ✅ Remove food (and its Cloudinary image)
// ✅ Remove food (and Cloudinary image with folder path)
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    const imageUrl = food.image;
    const parts = imageUrl.split("/");

    // Find the index of "upload"
    const uploadIndex = parts.indexOf("upload");

    // Take everything after "upload" and skip the version part (starts with "v")
    const pathParts = parts.slice(uploadIndex + 1);
    if (pathParts[0].startsWith("v")) {
      pathParts.shift();
    }

    // Remove file extension from last part
    const fileName = pathParts.pop().split(".")[0];

    // Build publicId: folder(s)/fileName
    const publicId = [...pathParts, fileName].join("/");

    console.log("Deleting Cloudinary image:", publicId);

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from DB
    await foodModel.findByIdAndDelete(req.body.id);

    res.json({ success: true, message: "Food and image removed" });
  } catch (error) {
    console.error("Error removing food:", error);
    res.status(500).json({ success: false, message: "Error removing food" });
  }
};

// ✅ Update food
const updateFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { name, description, price, category } = req.body;

    const food = await foodModel.findById(foodId);
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    // ✅ If a new image is uploaded, delete the old one from Cloudinary
    if (req.file?.path) {
      // Extract publicId from old URL
      const imageUrl = food.image;
      const parts = imageUrl.split("/");
      const uploadIndex = parts.indexOf("upload");
      const pathParts = parts.slice(uploadIndex + 1);
      if (pathParts[0].startsWith("v")) pathParts.shift();
      const fileName = pathParts.pop().split(".")[0];
      const publicId = [...pathParts, fileName].join("/");

      console.log("Deleting old image:", publicId);
      await cloudinary.uploader.destroy(publicId);

      // ✅ Set new Cloudinary image
      food.image = req.file.path;
    }

    // ✅ Update other fields
    if (name) food.name = name;
    if (description) food.description = description;
    if (price) food.price = price;
    if (category) food.category = category;

    await food.save();

    res.json({
      success: true,
      message: "Food updated successfully!",
      data: food,
    });
  } catch (error) {
    console.error("Update food error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating food",
    });
  }
};

// ✅ Get food by ID
const getFoodById = async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = await foodModel.findById(foodId);
    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }
    res.json({ success: true, data: food });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching food details" });
  }
};

// ✅ Search
const searchFood = async (req, res) => {
  try {
    const query = req.query.query || "";
    if (!query) {
      return res.json({ success: false, message: "Query is required" });
    }

    const foods = await foodModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    });

    if (foods.length === 0) {
      return res.json({ success: false, message: "No food items found" });
    }

    res.json({ success: true, data: foods });
  } catch (error) {
    console.error("❌ Error searching food:", error);
    res.status(500).json({ success: false, message: "Error searching food" });
  }
};

// ✅ Suggestions (autocomplete)
const suggestFood = async (req, res) => {
  try {
    const query = req.query.query || "";

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const suggestions = await foodModel
      .find({ name: { $regex: query, $options: "i" } })
      .select("name")
      .limit(5);

    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error("❌ Error fetching suggestions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  listFood,
  addFood,
  removeFood,
  updateFood,
  getFoodById,
  searchFood,
  suggestFood,
};
