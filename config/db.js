import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB Connected");
  } catch (err) {
    console.error("DB Connection Error:", err.message);
    process.exit(1);
  }
};

// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.
