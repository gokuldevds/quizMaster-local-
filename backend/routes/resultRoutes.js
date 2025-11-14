const express = require("express");
const mongoose = require("mongoose");
const Result = require("../models/resultModel");
const User = require("../models/userModel");
const { protect } = require("../middleware/authMiddleware");
const { updateUserQuizStats, calculateAndUpdateRanks } = require("../utils/rankCalculator");

const router = express.Router();

/**
 * @route   POST /results/submit
 * @desc    Save a user's quiz result and update statistics
 * @access  Private
 */
router.post("/submit", protect, async (req, res) => {
  try {
    console.log("🔐 Incoming token:", req.headers.authorization);
    console.log("👤 Authenticated user:", req.user?._id, req.user?.email);

    const { quiz, score, totalQuestions, correctAnswers } = req.body;

    if (!quiz || score == null)
      return res.status(400).json({ message: "Missing quiz or score data" });

    // ✅ Ensure user ID is always stored as ObjectId
    const result = await Result.create({
      user: new mongoose.Types.ObjectId(req.user._id),
      quiz,
      score,
      totalQuestions,
      correctAnswers,
    });

    // Update user's quiz statistics
    await updateUserQuizStats(req.user._id);

    // Recalculate all ranks (this ensures leaderboard stays accurate)
    // Note: In production, you might want to do this asynchronously or batch it
    await calculateAndUpdateRanks();

    res.status(201).json({
      message: "Result submitted successfully",
      result,
    });
  } catch (err) {
    console.error("❌ Error submitting result:", err.message);
    res.status(500).json({ message: "Failed to submit result" });
  }
});

/**
 * @route   GET /results/my-results
 * @desc    Get the logged-in user's recent quiz results
 * @access  Private
 */
router.get("/my-results", protect, async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id })
      .populate("quiz", "title")
      .sort({ submittedAt: -1 })
      .limit(5);

    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error fetching user results:", err.message);
    res.status(500).json({ message: "Failed to load results" });
  }
});

/**
 * @route   GET /results/leaderboard
 * @desc    Get top performers by total score with rankings - uses stored stats from database
 * @access  Public
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // Default to 100 to show more users
    
    // Get all users with their stored quiz statistics (excluding admins)
    // Sort by rank (ascending), then by totalScore, quizzesAttended, averageScore
    const users = await User.find({ role: { $ne: "admin" } })
      .select("name email quizStats")
      .sort({
        "quizStats.rank": 1, // Primary sort by rank
        "quizStats.totalScore": -1, // Secondary sort by total score
        "quizStats.quizzesAttended": -1, // Tertiary sort by quizzes attended
        "quizStats.averageScore": -1, // Quaternary sort by average score
      })
      .limit(limit)
      .lean();

    // Format leaderboard data
    const leaderboard = users.map((user) => {
      const stats = user.quizStats || {};
      return {
        name: user.name || "Unknown User",
        email: user.email || "N/A",
        totalScore: stats.totalScore || 0,
        quizzesCompleted: stats.quizzesAttended || 0,
        avgScore: stats.averageScore || 0,
        rank: stats.rank || null,
      };
    });

    // Filter out users with no quiz attempts (rank is null and totalScore is 0)
    const activeLeaderboard = leaderboard.filter(
      (user) => user.quizzesCompleted > 0 || user.totalScore > 0
    );

    res.status(200).json(activeLeaderboard);
  } catch (err) {
    console.error("❌ Leaderboard error:", err.message);
    res.status(500).json({ message: "Failed to fetch leaderboard", error: err.message });
  }
});

module.exports = router;
