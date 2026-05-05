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
app.use('/api/admin', require('./routes/adminRoutes'));
// Basic health check route
app.get('/', (req, res) => {
  res.send('EdTech MVP API is running...');
});

// The Port setting
const PORT = process.env.PORT || 5000;

// THE ENGINE STARTER
app.listen(PORT, () => {
  console.log(`🚀 Server is officially running on port ${PORT}`);
});