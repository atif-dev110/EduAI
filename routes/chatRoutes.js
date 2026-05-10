const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');
const Insight = require('../models/Insight');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function buildStudentContext(student, metrics, insight) {
  const profile = [
    `Name: ${student.name}`,
    `Student ID: ${student.studentId}`,
    `Major: ${student.major || 'N/A'}`,
    `Semester: ${student.semester || 'N/A'}`,
    `Current risk level: ${student.currentRiskLevel || 'Unknown'}`,
    `Current risk score: ${student.currentRiskScore ?? 'Unknown'}`,
  ].join('\n');

  const metricsText = metrics.length
    ? metrics.map(metric => {
        const subjects = metric.subjects.map(s => `${s.name} (${s.attended}/${s.conducted} attended)`).join(', ');
        const assignment = metric.recentAssignment
          ? `${metric.recentAssignment.subject || 'Unknown subject'} - ${metric.recentAssignment.isSubmitted ? 'Submitted' : 'Not submitted'}${typeof metric.recentAssignment.daysEarly === 'number' ? `, ${metric.recentAssignment.daysEarly} day(s) early` : ''}`
          : 'No recent assignment data';
        return `Week ${metric.weekNumber}: Subjects: ${subjects}. Recent assignment: ${assignment}.`;
      }).join('\n')
    : 'No weekly metric records available.';

  const actionPlanText = insight && insight.aiActionPlan
    ? `Previous AI action plan: weakestSubject=${insight.aiActionPlan.weakestSubject}; actionSteps=${insight.aiActionPlan.actionSteps.join(' | ')}.`
    : 'No previous AI action plan available.';

  return [profile, '', 'Weekly metrics:', metricsText, '', actionPlanText].join('\n');
}

router.post('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const userMessage = (req.body.message || '').trim();

    if (!userMessage) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    let student;
    try {
      student = await Student.findById(studentId);
    } catch (err) {
      // ignore
    }
    if (!student) {
      student = await Student.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const metrics = await WeeklyMetric.find({ student: student._id }).sort({ weekNumber: 1 });
    const insight = await Insight.findOne({ student: student._id });

    if (!metrics || metrics.length === 0) {
      return res.status(200).json({
        reply: "I don't have enough weekly performance data for this student yet. Please ask about their profile, attendance, or add weekly metrics first.",
        followUps: [
          'What is the student’s current risk level?',
          'What does the student’s weekly attendance look like?',
          'How can the student improve their study routine?'
        ]
      });
    }

    const studentContext = buildStudentContext(student, metrics, insight);
    const prompt = `You are EduAI Assistant, a grounded academic mentor.
Use ONLY the provided student data below. Do not invent any details.
If the question is outside this student’s academic performance, attendance, assignment status, risk level, or existing AI recommendations, respond with: "I can only answer questions about this student's academic progress, attendance, assignments, and risk level."

=== STUDENT DATA ===
${studentContext}

=== USER QUESTION ===
${userMessage}

=== RESPONSE GUIDELINES ===
- Answer clearly and directly using only the data above.
- Mention specific attendance or assignment details only if they appear in the data.
- If the student is at risk, say what the risk level means and how to improve.
- Keep your answer short, supportive, and factual.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (!text) {
      text = "I'm sorry, I couldn't generate a grounded answer from the student data. Please try asking about their attendance, assignments, or risk level.";
    }

    const followUps = [
      'How can I improve the student’s attendance?',
      'Which subject should the student focus on next?',
      'What should the student do before the next exam?'
    ];

    return res.status(200).json({ reply: text, followUps });
  } catch (error) {
    console.error('Chat route error:', error);
    return res.status(500).json({ error: 'Failed to generate chat response.' });
  }
});

module.exports = router;
