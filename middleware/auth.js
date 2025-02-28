import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // Try fetching token from both headers
  const token = req.headers.authorization?.split(" ")[1] || req.headers.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Ensure consistency in storing userId
    req.userId = decoded.id;
    req.body.userId = decoded.id;

    next();
  } catch (error) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
  }
};

export default authMiddleware;

// req.body.userId = decoded.id;
