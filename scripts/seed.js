const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const connectDB = require('../config/db');
const Student = require('../models/Student');
const WeeklyMetric = require('../models/WeeklyMetric');
const Insight = require('../models/Insight');

dotenv.config();

// Ensure MONGO_URI is set before attempting to connect
if (!process.env.MONGO_URI) {
  console.warn('WARNING: MONGO_URI environment variable is not defined.');
  console.log('Using a fallback local database for seeding script...');
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/sageathon_db';
}

const NUM_STUDENTS = 20;
const SUBJECTS = ['OS', 'DBMS', 'Maths-IV', 'Networks', 'Java'];
const WEEKS = 4;

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    // Clear out old models data to avoid conflicts
    try {
      await mongoose.connection.collection('users').drop();
    } catch (e) {}
    try {
      await mongoose.connection.collection('academicrecords').drop();
    } catch (e) {}
    
    await Student.deleteMany();
    await WeeklyMetric.deleteMany();
    await Insight.deleteMany();
    console.log('Existing data cleared.');

    console.log(`Generating ${NUM_STUDENTS} students...`);
    const studentsToInsert = [];
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const isAtRisk = i >= 15; // 15 Good students, 5 At-Risk
      studentsToInsert.push({
        name: faker.person.fullName(),
        studentId: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        major: 'Computer Science',
        semester: 4,
        currentRiskLevel: isAtRisk ? 'High' : 'Low',
        currentRiskScore: isAtRisk ? faker.number.int({ min: 70, max: 100 }) : faker.number.int({ min: 0, max: 20 }),
      });
    }

    const insertedStudents = await Student.insertMany(studentsToInsert);
    console.log(`${insertedStudents.length} students inserted.`);

    console.log('Generating weekly metrics for each student...');
    const metricsToInsert = [];

    insertedStudents.forEach((student, index) => {
      const isAtRisk = index >= 15;
      
      // Track cumulative attendance per subject
      const attendanceTracker = {};
      SUBJECTS.forEach(sub => attendanceTracker[sub] = 0);
      
      // Determine 1 or 2 subjects for an At-Risk student to fail
      let failingSubjects = [];
      if (isAtRisk) {
        failingSubjects = faker.helpers.arrayElements(SUBJECTS, faker.number.int({ min: 1, max: 2 }));
      }

      for (let week = 1; week <= WEEKS; week++) {
        const conducted = week * 7;
        const weekSubjects = [];

        SUBJECTS.forEach(sub => {
          let attendedIncrease = 0;

          if (!isAtRisk) {
            // Good student logic
            attendedIncrease = faker.number.int({ min: 5, max: 7 });
          } else {
            // At-Risk student logic
            if (week <= 2) {
              attendedIncrease = faker.number.int({ min: 5, max: 7 }); // Attend normally weeks 1-2
            } else {
              // Bunk failing subjects in weeks 3-4
              if (failingSubjects.includes(sub)) {
                attendedIncrease = faker.number.int({ min: 0, max: 1 });
              } else {
                attendedIncrease = faker.number.int({ min: 4, max: 6 }); // Attend other subjects roughly okay
              }
            }
          }

          attendanceTracker[sub] += attendedIncrease;
          
          // Ensure attended is never > conducted
          attendanceTracker[sub] = Math.min(attendanceTracker[sub], conducted);

          weekSubjects.push({
            name: sub,
            conducted: conducted,
            attended: attendanceTracker[sub]
          });
        });

        // Determine assignment status
        let isSubmitted = true;
        let daysEarly = faker.number.int({ min: 1, max: 4 });
        
        if (isAtRisk && week >= 3) {
          isSubmitted = false;
          daysEarly = 0;
        }

        metricsToInsert.push({
          student: student._id,
          weekNumber: week,
          subjects: weekSubjects,
          recentAssignment: {
            subject: faker.helpers.arrayElement(SUBJECTS),
            isSubmitted: isSubmitted,
            daysEarly: daysEarly
          }
        });
      }
    });

    await WeeklyMetric.insertMany(metricsToInsert);
    console.log(`${metricsToInsert.length} weekly metrics inserted.`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
