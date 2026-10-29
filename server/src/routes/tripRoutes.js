
const express = require("express");
const requireAuth = require("../middleware/requireAuth");

const {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  clearTripHistory,
} = require("../controllers/tripController");

const router = express.Router();

// Every trip endpoint requires authentication.
router.use(requireAuth);

router.get("/", getTrips);
router.post("/", createTrip);

// Put this before /:id to avoid treating "history" as a trip ID.
router.delete("/history", clearTripHistory);

router.patch("/:id", updateTrip);
router.delete("/:id", deleteTrip);

module.exports = router;
