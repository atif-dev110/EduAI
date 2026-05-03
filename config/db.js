const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This connects to the MONGO_URI in your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure if it can't connect
    process.exit(1); 
  }
};

module.exports = connectDB;