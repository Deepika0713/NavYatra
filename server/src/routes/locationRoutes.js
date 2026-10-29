
const express = require("express");
const { geocodeAddress } = require("../services/geocodingService");

const router = express.Router();

// POST /api/location/geocode
router.post("/geocode", async (req, res) => {
  try {
    const { address } = req.body;

    if (typeof address !== "string" || !address.trim()) {
      return res.status(400).json({
        message: "Please provide a starting address.",
      });
    }

    const location = await geocodeAddress(address);

    return res.json({ location });
  } catch (error) {
    return res.status(502).json({
      message: error.message || "Unable to find this location.",
    });
  }
});

module.exports = router;
