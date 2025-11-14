const User = require("../models/userModel");
const Result = require("../models/resultModel");

/**
 * Calculate and update quiz statistics for a specific user
 * @param {String} userId - The user's ID
 */
const updateUserQuizStats = async (userId) => {
  try {
    const results = await Result.find({ user: userId });
    
    if (results.length === 0) {
      // No results, reset stats
      await User.findByIdAndUpdate(userId, {
        "quizStats.quizzesAttended": 0,
        "quizStats.totalScore": 0,
        "quizStats.averageScore": 0,
        "quizStats.lastUpdated": new Date(),
      });
      return;
    }

    const bestScores = {};
    results.forEach((result) => {
      const quizId = result.quiz.toString();
      if (!bestScores[quizId] || result.score > bestScores[quizId]) {
        bestScores[quizId] = result.score;
      }
    });

    // Calculate statistics
    const quizzesAttended = Object.keys(bestScores).length;
    const totalScore = Object.values(bestScores).reduce((sum, score) => sum + score, 0);
    const averageScore = quizzesAttended > 0 ? Math.round(totalScore / quizzesAttended) : 0;

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      "quizStats.quizzesAttended": quizzesAttended,
      "quizStats.totalScore": Math.round(totalScore),
      "quizStats.averageScore": averageScore,
      "quizStats.lastUpdated": new Date(),
    });

    return { quizzesAttended, totalScore: Math.round(totalScore), averageScore };
  } catch (error) {
    console.error("Error updating user quiz stats:", error);
    throw error;
  }
};

/**
 * Calculate and update ranks for all users based on:
 * 1. Total score (primary)
 * 2. Number of quizzes attended (secondary)
 * 3. Average score (tertiary)
 */
const calculateAndUpdateRanks = async () => {
  try {
    // First, update all user stats
    const users = await User.find({ role: { $ne: "admin" } }).select("_id");
    
    // Update stats for all users
    await Promise.all(users.map(user => updateUserQuizStats(user._id)));

    // Get all users with their updated stats
    const usersWithStats = await User.find({ role: { $ne: "admin" } })
      .select("_id quizStats")
      .lean();

    // Sort users by:
    // 1. Total score (descending)
    // 2. Quizzes attended (descending)
    // 3. Average score (descending)
    usersWithStats.sort((a, b) => {
      const statsA = a.quizStats || { totalScore: 0, quizzesAttended: 0, averageScore: 0 };
      const statsB = b.quizStats || { totalScore: 0, quizzesAttended: 0, averageScore: 0 };

      // Primary: Total score
      if (statsB.totalScore !== statsA.totalScore) {
        return statsB.totalScore - statsA.totalScore;
      }

      // Secondary: Quizzes attended
      if (statsB.quizzesAttended !== statsA.quizzesAttended) {
        return statsB.quizzesAttended - statsA.quizzesAttended;
      }

      // Tertiary: Average score
      return statsB.averageScore - statsA.averageScore;
    });

    // Assign ranks and update users
    const updatePromises = usersWithStats.map((user, index) => {
      const rank = index + 1;
      return User.findByIdAndUpdate(user._id, {
        "quizStats.rank": rank,
      });
    });

    await Promise.all(updatePromises);

    console.log(`✅ Updated ranks for ${usersWithStats.length} users`);
    return usersWithStats.length;
  } catch (error) {
    console.error("Error calculating ranks:", error);
    throw error;
  }
};

module.exports = {
  updateUserQuizStats,
  calculateAndUpdateRanks,
};

