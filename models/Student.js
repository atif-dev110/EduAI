const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
    },
    major: {
      type: String,
      default: 'Computer Science',
    },
    semester: {
      type: Number,
      default: 4,
    },
    currentRiskScore: {
      type: Number,
      default: 0,
    },
    currentRiskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Student', studentSchema);
