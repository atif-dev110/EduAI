const calculateRiskScore = (metrics) => {
  let score = 0;
  
  let totalConducted = 0;
  let totalAttended = 0;

  for (const metric of metrics) {
    // Attendance Penalty calculation variables
    if (metric.subjects && Array.isArray(metric.subjects)) {
      for (const subject of metric.subjects) {
        totalConducted += subject.conducted || 0;
        totalAttended += subject.attended || 0;
      }
    }

    // Assignment Penalty
    if (metric.recentAssignment && metric.recentAssignment.isSubmitted === false) {
      score += 15;
    }

    // Procrastination Penalty
    if (metric.recentAssignment && metric.recentAssignment.isSubmitted === true && metric.recentAssignment.daysEarly === 0) {
      score += 5;
    }
  }

  if (totalConducted > 0) {
    const attendancePercentage = (totalAttended / totalConducted) * 100;
    if (attendancePercentage < 60) {
      score += 25;
    } else if (attendancePercentage < 75) {
      score += 15;
    }
  }

  // Cap score at 100 (and ensure it's not negative)
  if (score > 100) {
    score = 100;
  } else if (score < 0) {
    score = 0;
  }
  
  return score;
};

const getRiskLevel = (score) => {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

module.exports = {
  calculateRiskScore,
  getRiskLevel
};
