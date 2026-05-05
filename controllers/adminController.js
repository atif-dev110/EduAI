// controllers/adminController.js
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');

const getAllStudentsForAdmin = async (req, res) => {
  try {
    const students = await Student.find({});
    const allMetrics = await WeeklyMetric.find({});

    const tableData = students.map(student => {
      // 1. Find this specific student's metrics
      const studentMetrics = allMetrics.filter(m => m.student.toString() === student._id.toString());
      
      // 2. Calculate real attendance
      let attended = 0;
      let conducted = 0;
      studentMetrics.forEach(record => {
        if(record.subjects) {
          record.subjects.forEach(sub => {
            attended += (sub.attended || 0);
            conducted += (sub.conducted || 0);
          });
        }
      });

      // 3. The Math Engine (Syncing with your frontend UI)
      const attendancePercent = conducted > 0 ? Math.round((attended / conducted) * 100) : 85; 
      
      // If RiskScore in DB is 20, Performance is 80
      const dbRiskScore = student.currentRiskScore || 25;
      const performancePercent = Math.max(0, 100 - dbRiskScore); 

      let riskLevel = "High";
      if (performancePercent >= 80) riskLevel = "Low";
      else if (performancePercent >= 60) riskLevel = "Medium";

      // 4. Send exactly what the React table expects
      return {
        id: student._id.toString(),
        name: student.name || "Unknown Student",
        class: "Computer Science", // Or dynamically map from student.studentProfile.major if you have it
        performance: performancePercent,
        attendance: attendancePercent,
        risk: riskLevel
      };
    });

    res.status(200).json(tableData);

  } catch (error) {
    console.error("Admin Dashboard Fetch Error:", error);
    res.status(500).json({ message: "Failed to load class roster" });
  }
};

module.exports = { getAllStudentsForAdmin };