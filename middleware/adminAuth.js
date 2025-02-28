import jwt from "jsonwebtoken";

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. Please log in again.",
      });
    }

    const token = authHeader.split(" ")[1]; // Extract Bearer token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.admin = { id: decoded.id }; // Attach the decoded admin info to request object
    next(); // Proceed to the next middleware/controller
  } catch (error) {
    let message = "Invalid or Expired Token";
    if (error.name === "TokenExpiredError")
      message = "Session expired. Please log in again.";
    if (error.name === "JsonWebTokenError")
      message = "Invalid token. Authentication failed.";

    return res.status(403).json({ success: false, message });
  }
};

export default adminAuthMiddleware;
