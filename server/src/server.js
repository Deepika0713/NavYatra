
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const tripRoutes = require("./routes/tripRoutes");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://solid-carnival-vp6g5pp9qpjhxqvv-5173.app.github.dev",
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin header, such as health checks.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("CORS blocked origin:", origin);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Register CORS before routes and authentication.
app.use(cors(corsOptions));

// Parse request bodies and cookies
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/trips", tripRoutes);

// Tourist places API
const placesPath = path.join(__dirname, "../data/places.json");

app.get("/api/places", (req, res) => {
  try {
    const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));

    const { state, city, category } = req.query;

    const filteredPlaces = places.filter((place) => {
      return (
        (!state ||
          (place.state || "").toLowerCase() === state.toLowerCase()) &&
        (!city ||
          (place.city || "").toLowerCase() === city.toLowerCase()) &&
        (!category ||
          (place.category || "").toLowerCase() === category.toLowerCase())
      );
    });

    return res.json({
      count: filteredPlaces.length,
      places: filteredPlaces,
    });
  } catch (error) {
    console.error("Failed to load places:", error.message);

    return res.status(500).json({
      message: "Unable to load places.",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NavYatra API is running",
  });
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`NavYatra API listening on port ${PORT}`);
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error("Failed to start NavYatra:", error.message);
    process.exit(1);
  }
}

startServer();
