import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://saraiyavraj02:2PpSUUL2B6MU6M6r@fooddeliveryapp.5nebs.mongodb.net/?retryWrites=true&w=majority&appName=Fooddeliveryapp"
    )
    .then(() => console.log("DB Connected"));
};

// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.
