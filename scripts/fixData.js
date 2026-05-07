const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');

dotenv.config();

// 1. THE STRICT SUBJECT SET
const STRICT_SUBJECTS = ['OS', 'DBMS', 'Maths-IV', 'Networks', 'Java'];
const WEEKS_TO_GENERATE = 4;

const fixAndBackfillDatabase = async () => {
  try {
    await connectDB();
    console.log('🔍 Scanning database for existing students...');

    const students = await Student.find();
    console.log(`Found ${students.length} student profiles. (Profiles are safe and will not be deleted)`);

    // 2. CLEAR THE MESSY DATA
    // We only delete the WeeklyMetrics to get rid of the random subjects. 
    // Your actual Student accounts remain completely untouched.
    console.log('🧹 Clearing old weekly metrics to reset the subjects...');
    await WeeklyMetric.deleteMany({});

    let generatedCount = 0;
    const allMetricsToInsert = [];

    console.log('⚙️ Generating exactly 4 weeks of clean data for every student...');

    // 3. GENERATE CLEAN 4 WEEKS OF DATA FOR EVERY STUDENT
    for (const student of students) {
      const attendanceTracker = {};
      
      // Initialize the tracker using ONLY your strict subjects
      STRICT_SUBJECTS.forEach(sub => attendanceTracker[sub] = 0);

      const isAtRisk = student.currentRiskScore > 60;
      let failingSubjects = isAtRisk ? faker.helpers.arrayElements(STRICT_SUBJECTS, faker.number.int({ min: 1, max: 2 })) : [];

      for (let week = 1; week <= WEEKS_TO_GENERATE; week++) {
        const conducted = week * 7;
        const weekSubjects = [];

        STRICT_SUBJECTS.forEach(sub => {
          // Calculate attendance math
          let attendedIncrease = isAtRisk && week >= 3 && failingSubjects.includes(sub)
            ? faker.number.int({ min: 0, max: 1 }) // Failing student skips class
            : faker.number.int({ min: 5, max: 7 }); // Good student attends

          attendanceTracker[sub] += attendedIncrease;
          attendanceTracker[sub] = Math.min(attendanceTracker[sub], conducted);

          weekSubjects.push({
            name: sub,
            conducted: conducted,
            attended: attendanceTracker[sub],
          });
        });

        // Push the new metric object
        allMetricsToInsert.push({
          student: student._id,
          weekNumber: week,
          subjects: weekSubjects,
          recentAssignment: {
            subject: faker.helpers.arrayElement(STRICT_SUBJECTS), // Assignments only from strict subjects
            isSubmitted: !(isAtRisk && week >= 3),
            daysEarly: (isAtRisk && week >= 3) ? 0 : faker.number.int({ min: 1, max: 4 }),
          },
        });
      }
      generatedCount++;
    }

    // 4. SAVE THE PERFECT DATA TO THE DATABASE
    console.log(`💾 Saving clean data to MongoDB...`);
    await WeeklyMetric.insertMany(allMetricsToInsert);

    console.log(`✅ Success! ${generatedCount} students now have exactly 4 weeks of data with ONLY your strict subjects.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database:', error);
    process.exit(1);
  }
};

fixAndBackfillDatabase();