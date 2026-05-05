/*const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');
const Insight = require('../models/Insight');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/:id/generate', async (req, res) => {
  try {
    const studentId = req.params.id;

    // STEP 1: Fetch the student (Bulletproofed to check BOTH MongoDB _id and custom studentId)
    let student;
    try {
      student = await Student.findById(studentId); // Tries MongoDB _id first
    } catch (err) {
      student = await Student.findOne({ studentId: studentId }); // Fallback to custom ID
    }
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    const metrics = await WeeklyMetric.find({ student: student._id }).sort({ weekNumber: 1 });

    // STEP 2: THE EMPTY DATA PROTECTOR (Prevents 500 Errors on new students!)
    if (!metrics || metrics.length === 0) {
      console.log("Student has no metrics yet. Returning safe fallback.");
      return res.status(200).json({
        aiActionPlan: {
          weakestSubject: "General Studies",
          actionSteps: [
            "Complete your first week of assignments.",
            "Attend all upcoming lectures.",
            "Review the syllabus and organize your schedule."
          ]
        }
      });
    }

    // STEP 3: Format the Prompt Data
    const promptData = {
      name: student.name,
      riskLevel: student.currentRiskLevel,
      weeklyPerformance: metrics.map(m => ({
        week: m.weekNumber,
        subjects: m.subjects.map(s => `${s.name}: ${s.attended}/${s.conducted} attended`),
        recentAssignment: m.recentAssignment
      }))
    };

    // STEP 4: The System Prompt
    const prompt = `
      You are a supportive, friendly, and empowering AI mentor helping an engineering student in India succeed. 
      The student is feeling overwhelmed, but they are capable. 
      
      Analyze their 4-week cumulative attendance and assignment data:
      ${JSON.stringify(promptData)}
      
      Your task is to provide a "Self-Growth Plan" for the student to help themselves.
      
      Output your evaluation STRICTLY as a raw JSON object matching this exact schema:
      {
        "weakestSubject": "String (the exact name of the subject they are struggling with)",
        "actionSteps": [
          "String (Micro-step: Something they can do today in 5 minutes)", 
          "String (Medium-step: A study habit they can build this week)", 
          "String (Long-term: How to prepare for the upcoming exams)"
        ]
      }
      
      CRITICAL: Maintain a tone that is encouraging, non-judgmental, and practical. 
      Do not use markdown formatting. Output ONLY the raw JSON braces.
    `;

    // STEP 5: Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text();

    // STEP 6: The Hackathon Savior Regex
    aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // STEP 7: Parse and Save
    const parsedPlan = JSON.parse(aiResponseText);

    const savedInsight = await Insight.findOneAndUpdate(
      { student: student._id },
      { aiActionPlan: parsedPlan, lastUpdatedByAI: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json(savedInsight);

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI insight', details: error.message });
  }
});

module.exports = router;
*/



//HAAARRRRDDDCCOOODDDEEE BYPAAAASSSSSSSSEEEEEE FOR THE HACKATHON MVP DEMO!


// The hardcode method is back as a backup in case the AI generation breaks during the demo. Just swap the comments if needed!

const express = require('express');
const router = express.Router();
// const { GoogleGenerativeAI } = require('@google/generative-ai'); // Commented out since we are bypassing
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');
const Insight = require('../models/Insight');

router.post('/:id/generate', async (req, res) => {
  try {
    const studentId = req.params.id;

    // STEP 1: Fetch the student 
    let student;
    try {
      student = await Student.findById(studentId); 
    } catch (err) {
      student = await Student.findOne({ studentId: studentId }); 
    }
    
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    const metrics = await WeeklyMetric.find({ student: student._id }).sort({ weekNumber: 1 });

    // STEP 2: THE EMPTY DATA PROTECTOR
    if (!metrics || metrics.length === 0) {
      console.log("Student has no metrics yet. Returning safe fallback.");
      return res.status(200).json({
        aiActionPlan: {
          weakestSubject: "General Studies",
          actionSteps: [
            "Complete your first week of assignments.",
            "Attend all upcoming lectures.",
            "Review the syllabus and organize your schedule."
          ]
        }
      });
    }

    // STEP 3: HACKATHON MVP BYPASS
    // We are skipping Gemini to avoid quota limits during the live pitch!
    const parsedPlan = {
      weakestSubject: "Data Structures",
      actionSteps: [
        "Review Binary Trees today for 15 minutes.",
        "Complete 2 LeetCode easy problems this week.",
        "Attend the TA office hours on Friday before the midterm."
      ]
    };

    // Save it to the database so it persists
    const savedInsight = await Insight.findOneAndUpdate(
      { student: student._id },
      { aiActionPlan: parsedPlan, lastUpdatedByAI: new Date() },
      { upsert: true, returnDocument: 'after' }
    );

    // Send the success response to the React frontend
    return res.status(200).json(savedInsight);

  } catch (error) {
    console.error('Insight Route Error:', error);
    res.status(500).json({ error: 'Failed to generate insight', details: error.message });
  }
});

module.exports = router;