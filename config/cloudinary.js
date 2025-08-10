// backend/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  secure: true, // Automatically uses CLOUDINARY_URL from .env
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "plate2door",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
  },
});

console.log("Cloudinary URL available?", !!process.env.CLOUDINARY_URL);

const upload = multer({ storage });

export { cloudinary, upload };
