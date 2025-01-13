import foodModel from "../models/foodModel.js";
import fs from "fs";

// Get all food items
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching food list" });
  }
};

// Add a new food item
const addFood = async (req, res) => {
  try {
    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_filename,
    });

    await food.save();
    res.json({ success: true, message: "Food Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to add the product" });
  }
};

// Remove a food item
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (food) {
      fs.unlinkSync(`uploads/${food.image}`); // Delete old image
      await foodModel.findByIdAndDelete(req.body.id); // Delete food entry
      res.json({ success: true, message: "Food Removed" });
    } else {
      res.status(404).json({ success: false, message: "Food not found" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing food" });
  }
};

// Update a food item
const updateFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { name, description, price, category } = req.body;

    // Find the food item by ID
    const food = await foodModel.findById(foodId);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    // Handle image update if a new image is provided
    let updatedImage = food.image; // Keep the old image if no new image is provided
    if (req.file) {
      fs.unlinkSync(`uploads/${food.image}`); // Delete old image
      updatedImage = req.file.filename; // Update with new image
    }

    // Update fields if provided, otherwise keep the existing values
    food.name = name || food.name;
    food.description = description || food.description;
    food.price = price || food.price;
    food.category = category || food.category;
    food.image = updatedImage;

    await food.save(); // Save the updated food item
    res.json({ success: true, message: "Food updated successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating food",
    });
  }
};

// Get a single food item by ID
const getFoodById = async (req, res) => {
  try {
    const { foodId } = req.params;

    // Find the food item by ID
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

export { listFood, addFood, removeFood, updateFood, getFoodById };
