
const mongoose = require("mongoose");
const Trip = require("../models/Trip");

// Get only the logged-in user's trips.

exports.getTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status) {
      if (!["draft", "saved", "completed"].includes(status)) {
        return res.status(400).json({
          message: "Invalid trip status.",
        });
      }

      filter.status = status;
    }

    const trips = await Trip.find(filter).sort({ updatedAt: -1 });

    return res.json({ trips });
  } catch (error) {
    console.error("Get trips error:", error.message);
    return res.status(500).json({
      message: "Unable to load your trips.",
    });
  }
};


// Create a new draft or saved trip.
exports.createTrip = async (req, res) => {
  try {
    const {
      title,
      status,
      travelDate,
      startTime,
      travelMode,
      budget,
      needGuide,
      origin,
      places,
    } = req.body;

    if (status && !["draft", "saved", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Invalid trip status.",
      });
    }

    if (places !== undefined && !Array.isArray(places)) {
      return res.status(400).json({
        message: "Places must be an array.",
      });
    }

    const trip = await Trip.create({
      user: req.user._id,
      title,
      status: status || "draft",
      travelDate,
      startTime,
      travelMode,
      budget,
      needGuide,
      origin,
      places,
      generatedAt: new Date(),
      completedAt: status === "completed" ? new Date() : null,
    });

    return res.status(201).json({
      message: "Trip saved successfully.",
      trip,
    });
  } catch (error) {
    console.error("Create trip error:", error.message);
    return res.status(500).json({
      message: "Unable to save your trip.",
    });
  }
};

// Update only a trip belonging to the logged-in user.
exports.updateTrip = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid trip ID.",
      });
    }

    const allowedFields = [
      "title",
      "status",
      "travelDate",
      "startTime",
      "travelMode",
      "budget",
      "needGuide",
      "origin",
      "places",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (
      updates.status &&
      !["draft", "saved", "completed"].includes(updates.status)
    ) {
      return res.status(400).json({
        message: "Invalid trip status.",
      });
    }

    if (
      updates.places !== undefined &&
      !Array.isArray(updates.places)
    ) {
      return res.status(400).json({
        message: "Places must be an array.",
      });
    }

    if (updates.status === "completed") {
      updates.completedAt = new Date();
    } else if (updates.status === "draft" || updates.status === "saved") {
      updates.completedAt = null;
    }

    const trip = await Trip.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found.",
      });
    }

    return res.json({
      message: "Trip updated successfully.",
      trip,
    });
  } catch (error) {
    console.error("Update trip error:", error.message);
    return res.status(500).json({
      message: "Unable to update your trip.",
    });
  }
};

// Delete one trip belonging to the logged-in user.
exports.deleteTrip = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid trip ID.",
      });
    }

    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found.",
      });
    }

    return res.json({
      message: "Trip deleted successfully.",
    });
  } catch (error) {
    console.error("Delete trip error:", error.message);
    return res.status(500).json({
      message: "Unable to delete your trip.",
    });
  }
};

// Clear the logged-in user's trip history.
exports.clearTripHistory = async (req, res) => {
  try {
    const result = await Trip.deleteMany({
      user: req.user._id,
    });

    return res.json({
      message: "Your trip history has been cleared.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear trip history error:", error.message);
    return res.status(500).json({
      message: "Unable to clear your trip history.",
    });
  }
};
