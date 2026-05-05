const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');
const { calculateRiskScore, getRiskLevel } = require('../utils/riskEngine');

// Route 1: Faculty Triage View (GET /)
// Purpose: Serve a list of all students to the professor's dashboard, prioritized by risk.
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ currentRiskScore: -1 });
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error while fetching students' });
  }
});

// Route 2: Student Dashboard View (GET /:id/metrics)
// Route 2: Student Dashboard View (GET /:id/metrics)
// Purpose: Serve a single student's profile alongside their cumulative weekly time-series data.
router.get('/:id/metrics', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // First, fetch the single Student (Bulletproofed for BOTH MongoDB _id and custom studentId)
    let studentProfile;
    try {
      studentProfile = await Student.findById(studentId); // Tries MongoDB _id first
    } catch (err) {
      studentProfile = await Student.findOne({ studentId: studentId }); // Fallback to custom ID
    }
    
    if (!studentProfile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Second, fetch all WeeklyMetric documents
    const weeklyRecords = await WeeklyMetric.find({ student: studentProfile._id }).sort({ weekNumber: 1 });

    // --- THE DYNAMIC RISK CORRECTOR ---
    // Grab the score safely
    const score = studentProfile.currentRiskScore || 75;

    // Calculate the word dynamically based on the actual score
    let calculatedRiskLevel = "High";
    if (score >= 80) calculatedRiskLevel = "Low";
    else if (score >= 60) calculatedRiskLevel = "Medium";

    // Respond with the strictly formatted contract
    res.status(200).json({
      studentProfile,
      currentRiskLevel: calculatedRiskLevel, // Sending the corrected word!
      currentRiskScore: score,
      weeklyRecords
    });
  } catch (error) {
    console.error(`Error fetching metrics for student ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error while fetching student metrics' });
  }
});

// Route 3: POST /:id/metrics
// Purpose: Add a new metric for a student, calculate their new risk score, and update their profile.
router.post('/:id/metrics', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Find the Student by the custom studentId string. Return 404 if not found.
    const student = await Student.findOne({ studentId: studentId });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Attach the studentId to req.body and save the new WeeklyMetric to the database.
    // Safely extract ONLY the fields we expect from the frontend
    const { weekNumber, subjects, recentAssignment } = req.body;

    // Build the object manually so no malicious fields can sneak in
    const newMetricData = { 
      student: student._id,
      weekNumber,
      subjects,
      recentAssignment 
    };
    const newMetric = new WeeklyMetric(newMetricData);
    await newMetric.save();

    // Fetch ALL WeeklyMetric documents associated with this student (including the new one).
    const allMetrics = await WeeklyMetric.find({ student: student._id });

    // Pass the array of metrics into calculateRiskScore().
    const newRiskScore = calculateRiskScore(allMetrics);

    // Pass the resulting score into getRiskLevel().
    const newRiskLevel = getRiskLevel(newRiskScore);

    // Update the Student document with the new currentRiskScore and currentRiskLevel, then .save().
    student.currentRiskScore = newRiskScore;
    student.currentRiskLevel = newRiskLevel;
    await student.save();

    // Return a 201 status with a JSON payload containing the updated student and the new metric.
    res.status(201).json({
      student,
      newMetric
    });
  } catch (error) {
    console.error(`Error saving metric and updating risk for student ${req.params.id}:`, error);
    res.status(500).json({ error: 'Server error while saving metric and updating risk' });
  }
});

module.exports = router;

