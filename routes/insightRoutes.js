const express = require('express');
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

    // STEP 1: Fetch the student and their metrics from MongoDB
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    const metrics = await WeeklyMetric.find({ student: studentId }).sort({ weekNumber: 1 });

    // STEP 2: Format the Prompt Data
    // We strip out heavy MongoDB _id objects to save AI token costs and improve accuracy
    const promptData = {
      name: student.name,
      riskLevel: student.currentRiskLevel,
      weeklyPerformance: metrics.map(m => ({
        week: m.weekNumber,
        subjects: m.subjects.map(s => `${s.name}: ${s.attended}/${s.conducted} attended`),
        recentAssignment: m.recentAssignment
      }))
    };

    // STEP 3: The System Prompt (Strict JSON Enforcement)
    // UPDATED PROMPT: The "Supportive Coach" Persona
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
    // STEP 4: Call Gemini 2.5 Flash (Fastest for Hackathons)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let aiResponseText = result.response.text();

    // STEP 5: The Hackathon Savior Regex
    // If Gemini disobeys and wraps the JSON in markdown, this strips it out so our server doesn't crash.
    aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // STEP 6: Parse the clean string into a real JavaScript Object
    const parsedPlan = JSON.parse(aiResponseText);

    // STEP 7: Save to Database (Upsert)
    // If an insight exists, update it. If not, create it.
    const savedInsight = await Insight.findOneAndUpdate(
      { student: studentId },
      { aiActionPlan: parsedPlan, lastUpdatedByAI: new Date() },
      { upsert: true, new: true }
    );

    // Send the victory payload to the frontend
    res.status(200).json(savedInsight);

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI insight', details: error.message });
  }
});

module.exports = router;