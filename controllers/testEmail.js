import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Explicitly specify the .env file path
dotenv.config({ path: "E:/Online/food-del/backend/.env" });

console.log("✅ Checking .env File...");
console.log("✅ SMTP_USER:", process.env.SMTP_USER || "❌ Not Found");
console.log(
  "✅ SMTP_PASS:",
  process.env.SMTP_PASS ? "✔ Loaded" : "❌ Not Loaded"
);
console.log("✅ SMTP_HOST:", process.env.SMTP_HOST || "❌ Not Found");
console.log("✅ SMTP_PORT:", process.env.SMTP_PORT || "❌ Not Found");

// Ensure SMTP credentials exist
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ Missing SMTP credentials. Check your .env file.");
  process.exit(1);
}

// Ensure port is correctly converted to a number
const smtpPort = Number(process.env.SMTP_PORT) || 587;

// Create the transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Should be smtp.gmail.com
  port: smtpPort, // Use 587 for TLS
  secure: false, // Must be `false` for port 587 (true for 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Fixes some TLS issues
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SMTP Connection Successful!");
    sendTestEmail(); // Send a test email after verifying
  }
});

// Function to send a test email
function sendTestEmail() {
  const mailOptions = {
    from: `"Plate2Door" <${process.env.SMTP_USER}>`,
    to: "aryanrajput7081@gmail.com", // Replace with your actual email for testing
    subject: "Test Email from Plate2Door",
    text: "Hello! This is a test email from your backend setup.",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Email Sending Error:", error);
    } else {
      console.log("✅ Test Email Sent Successfully!", info.response);
    }
  });
}
