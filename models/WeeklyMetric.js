const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    conducted: { type: Number, required: true },
    attended: { type: Number, required: true },
  },
  { _id: false }
);

const weeklyMetricSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true,
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    subjects: [subjectSchema],
    recentAssignment: {
      subject: { type: String },
      isSubmitted: { type: Boolean },
      daysEarly: { type: Number, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

weeklyMetricSchema.index({ student: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyMetric', weeklyMetricSchema);
