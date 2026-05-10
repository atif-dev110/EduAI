const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize the Express App (THIS was missing!)
const app = express();

// CRITICAL Middleware
app.use(cors()); // Lets your React frontend talk to this API
app.use(express.json()); // Lets Express read JSON data in POST requests

// Connect to MongoDB Atlas
connectDB();

// Mount the Routes
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/insights', require('./routes/insightRoutes'));
app.use('/api/predictions', require('./routes/predictionRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic health check route
app.get('/', (req, res) => {
  res.send('EdTech MVP API is running...');
});

// The Port setting
const PORT = process.env.PORT || 5000;
//send email
//require('./utils/emailCron');

// --- HACKATHON DEMO OVERRIDE ROUTE ---
app.patch('/api/force-risk/:id', async (req, res) => {
  try {
    const Student = require('./models/Student');
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id, 
      { currentRiskLevel: 'High', currentRiskScore: 88 },
      { new: true }
    );
    res.status(200).json({ message: "Student forced to HIGH risk!", student: updatedStudent });
  } catch (error) {
    res.status(500).json({ error: "Failed to override" });
  }
});
// THE ENGINE STARTER
app.listen(PORT, () => {
  console.log(`🚀 Server is officially running on port ${PORT}`);
});