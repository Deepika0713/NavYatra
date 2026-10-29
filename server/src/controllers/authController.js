
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const COOKIE_NAME = "navyatra_token";
const TOKEN_EXPIRY = "7d";

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from server/.env");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

function sendAuthResponse(res, user, statusCode = 200) {
  const token = createToken(user._id.toString());

  res.cookie(COOKIE_NAME, token, getCookieOptions());

  return res.status(statusCode).json({
    message: "Authentication successful",
    user: publicUser(user),
  });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        message: "Name must contain between 2 and 60 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must contain 8 to 72 characters.",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create your account right now.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail })
      .select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
};

exports.logout = (req, res) => {
  const options = getCookieOptions();

  delete options.maxAge;

  res.clearCookie(COOKIE_NAME, options);

  return res.json({ message: "Logged out successfully." });
};

exports.me = async (req, res) => {
  return res.json({
    user: publicUser(req.user),
  });
};
