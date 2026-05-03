const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      unique: true,
      required: true,
    },
    aiActionPlan: {
      weakestSubject: { type: String },
      actionSteps: [{ type: String }],
    },
    // BUG FIXED: Added this field so Mongoose actually saves your timestamps
    lastUpdatedByAI: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Insight', insightSchema);