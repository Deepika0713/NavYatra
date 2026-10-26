
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const fs = require("fs");
const path = require("path");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

const placesPath = path.join(__dirname, "../data/places.json");

app.get("/api/places", (req, res) => {
  try {
    const places = JSON.parse(fs.readFileSync(placesPath, "utf8"));
    const { state, city, category } = req.query;

    const filteredPlaces = places.filter((place) => {
      return (
        (!state || place.state.toLowerCase() === state.toLowerCase()) &&
        (!city || place.city.toLowerCase() === city.toLowerCase()) &&
        (!category || place.category.toLowerCase() === category.toLowerCase())
      );
    });

    res.json({
      count: filteredPlaces.length,
      places: filteredPlaces,
    });
  } catch (error) {
    console.error("Failed to load places:", error.message);
    res.status(500).json({ message: "Unable to load places." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NavYatra API is running",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`NavYatra API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start NavYatra:", error.message);
    process.exit(1);
  }
}

startServer();
