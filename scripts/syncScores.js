const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');

// Import your live math engine
const { calculateRiskScore, getRiskLevel } = require('../utils/riskEngine');

dotenv.config();

const syncRiskScores = async () => {
  try {
    await connectDB();
    console.log('🔄 Syncing live metrics to Student profiles...');

    const students = await Student.find();
    let updatedCount = 0;

    for (const student of students) {
      // 1. Fetch the 4 weeks of data we just generated for this specific student
      const metrics = await WeeklyMetric.find({ student: student._id }).sort({ weekNumber: 1 });

      // 2. Run our new math engine to get the TRUE score!
      const newScore = calculateRiskScore(metrics);
      const newLevel = getRiskLevel(newScore);

      // 3. Overwrite the old Day 1 score in the database
      console.log(`Updating ${student.name}: Old Score ${student.currentRiskScore} ➡️ New Score ${newScore}`);
      
      student.currentRiskScore = newScore;
      student.currentRiskLevel = newLevel;
      await student.save();
      
      updatedCount++;
    }

    console.log(`✅ Success! ${updatedCount} student risk scores successfully synced with their 4-week data!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing scores:', error);
    process.exit(1);
  }
};

syncRiskScores();