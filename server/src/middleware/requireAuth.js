
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.navyatra_token;

    if (!token) {
      return res.status(401).json({
        message: "Please log in to continue.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from server/.env");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "Your account could not be found. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Unable to verify your session.",
    });
  }
};
