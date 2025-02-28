import userModel from "../models/userModel.js";

// Add item to cart
const addToCart = async (req, res) => {
  try {
    let { userId, itemId, quantity = 1 } = req.body; // ✅ Accept quantity, default to 1
    let userData = await userModel.findOne({ _id: userId });

    let cartData = userData.cartData || {}; // Ensure cartData exists

    if (!cartData[itemId]) {
      cartData[itemId] = quantity; // ✅ Set custom quantity if item is not in the cart
    } else {
      cartData[itemId] += quantity; // ✅ Increment quantity if item already in cart
    }

    await userModel.findByIdAndUpdate(userId, { cartData }); // Update the cart in the database

    res.json({ success: true, message: "Added To Cart", cartData }); // Send success response with updated cart
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error adding to cart" }); // Error handling
  }
};

// Remove food from user cart
const removeFromCart = async (req, res) => {
  try {
    let { userId, itemId } = req.body; // Get userId and itemId from request
    let userData = await userModel.findById(userId);
    let cartData = userData.cartData || {}; // Ensure cartData exists

    if (cartData[itemId] > 0) {
      cartData[itemId] -= 1; // Decrease item quantity by 1
    }

    await userModel.findByIdAndUpdate(userId, { cartData }); // Update the cart in the database

    res.json({ success: true, message: "Removed From Cart", cartData }); // Send success response with updated cart
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error removing from cart" }); // Error handling
  }
};

// Get user cart
const getCart = async (req, res) => {
  try {
    let { userId } = req.body; // Get userId from request
    let userData = await userModel.findById(userId);
    let cartData = userData.cartData || {}; // Ensure cartData exists

    res.json({ success: true, cartData }); // Send current cart data to the client
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error fetching cart data" }); // Error handling
  }
};
// 🟢 Clear Cart (NEW)
const clearCart = async (req, res) => {
  try {
    let { userId } = req.body;
    await userModel.findByIdAndUpdate(userId, { cartData: {} }); // Reset cart data to empty

    res.json({ success: true, message: "Cart cleared successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error clearing cart" });
  }
};
export { addToCart, removeFromCart, getCart, clearCart };
