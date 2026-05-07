const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Student = require('../models/Student');

dotenv.config();

const backfillEmails = async () => {
  try {
    await connectDB();
    console.log('🔄 Scanning database to add email fields...');

    const students = await Student.find();
    let updatedCount = 0;

    for (const student of students) {
      // Only add an email if they don't already have one
      if (!student.email) {
        // Creates an email like: "johnsmith@university.edu"
        const cleanName = student.name.replace(/\s+/g, '').toLowerCase();
        student.email = `${cleanName}@university.edu`;
        
        await student.save();
        updatedCount++;
      }
    }

    console.log(`✅ Success! Added generated emails to ${updatedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  }
};

backfillEmails();