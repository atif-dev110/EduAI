/**
 * ENGINE 1: HEURISTIC PENALTY SYSTEM
 */
const calculateRiskScore = (metrics) => {
  let score = 0;
  
  let totalConducted = 0;
  let totalAttended = 0;

  // 1. ATTENDANCE: Loop through ALL weeks for cumulative average
  for (const metric of metrics) {
    if (metric.subjects && Array.isArray(metric.subjects)) {
      for (const subject of metric.subjects) {
        totalConducted += subject.conducted || 0;
        totalAttended += subject.attended || 0;
      }
    }
  }

  // 2. ASSIGNMENTS: Only penalize based on the MOST RECENT week
 if (metrics && metrics.length > 0) {
    const currentWeek = metrics[metrics.length - 1]; 

    if (currentWeek.recentAssignment) {
      if (currentWeek.recentAssignment.isSubmitted === false) {
        score += 35; // BUFFED: Immediate missing assignment penalty
      } else if (currentWeek.recentAssignment.daysEarly === 0) {
        score += 15; // BUFFED: Immediate procrastination penalty
      }
    }
  }

  // 3. Apply cumulative attendance penalty
 if (totalConducted > 0) {
    const attendancePercentage = (totalAttended / totalConducted) * 100;
    if (attendancePercentage < 50) {
      score += 45; // BUFFED: Massive penalty for < 50% attendance
    } else if (attendancePercentage < 75) {
      score += 25; // BUFFED: Standard penalty for < 75% attendance
    }
  }
  // Cap score at 100 (and ensure it's not negative)
  return Math.max(0, Math.min(100, score));
};

// ... (Keep your getRiskLevel and predictNextScore functions exactly the same) ...

const getRiskLevel = (score) => {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

/**
 * ENGINE 2: LINEAR REGRESSION PREDICTOR
 */
function predictNextScore(scores) {
  // If we don't have enough data yet, return the last score as a fallback
  if (!scores || scores.length < 2) {
    return { predictedScore: scores[0] || 0, slope: 0 };
  }

  const n = scores.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  // X represents the "Week" (1, 2, 3), Y represents the "Score" (90, 85, 80)
  for (let i = 0; i < n; i++) {
    const x = i + 1; 
    const y = scores[i];
    
    sumX += x;
    sumY += y;
    sumXY += (x * y);
    sumXX += (x * x);
  }

  // Calculate the Slope (m) and Y-Intercept (b)
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - (sumX * sumX));
  const b = (sumY - (m * sumX)) / n;

  // Predict the score for the NEXT week (n + 1)
  const nextWeek = n + 1;
  let rawPrediction = (m * nextWeek) + b;

  // Clean the data: Cap the prediction between 0 and 100, and round it
  const finalPrediction = Math.max(0, Math.min(100, Math.round(rawPrediction)));

  return {
    predictedScore: finalPrediction,
    slope: m.toFixed(2), 
    intercept: b.toFixed(2)
  };
}

// THE FIX: Exporting all three functions properly
module.exports = {
  calculateRiskScore,
  getRiskLevel,
  predictNextScore 
};