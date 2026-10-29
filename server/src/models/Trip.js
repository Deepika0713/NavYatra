
const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    // Owner of this trip
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "My India Adventure",
    },

    status: {
      type: String,
      enum: ["draft", "saved", "completed"],
      default: "draft",
      index: true,
    },

    travelDate: {
      type: String,
      default: "",
    },

    startTime: {
      type: String,
      default: "09:00",
    },

    travelMode: {
      type: String,
      default: "cab",
    },

    budget: {
      type: Number,
      min: 0,
      default: 5000,
    },

    needGuide: {
      type: Boolean,
      default: false,
    },

    origin: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Store selected destination objects for now.
    // This preserves the data currently used by your frontend.
    places: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

tripSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Trip", tripSchema);
