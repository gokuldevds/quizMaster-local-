const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const User = require("../models/userModel");
const Quiz = require("../models/quizModel");
const Result = require("../models/resultModel");
const { calculateAndUpdateRanks } = require("../utils/rankCalculator");

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Create a new admin user (admin-only)
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    res.json({
      message: "Admin user created successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: "Failed to create admin user", error: err.message });
  }
});

// Get admin dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const totalQuizzes = await Quiz.countDocuments();
    const totalUsers = await User.countDocuments();
    
    // Calculate average score across all results
    const results = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          totalResults: { $sum: 1 },
        },
      },
    ]);

    const avgScore = results.length > 0 ? Math.round(results[0].avgScore || 0) : 0;
    const totalResults = results.length > 0 ? results[0].totalResults : 0;

    res.json({
      totalQuizzes,
      totalUsers,
      avgScore,
      totalResults,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// Get all users list
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // Get user statistics from stored quizStats
    const usersWithStats = users.map((user) => {
      const stats = user.quizStats || {};
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        totalQuizzes: stats.quizzesAttended || 0,
        avgScore: stats.averageScore || 0,
        totalScore: stats.totalScore || 0,
        rank: stats.rank || null,
      };
    });

    res.json(usersWithStats);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// Recalculate all user ranks (admin endpoint)
router.post("/recalculate-ranks", async (req, res) => {
  try {
    const count = await calculateAndUpdateRanks();
    res.json({
      message: "Ranks recalculated successfully",
      usersUpdated: count,
    });
  } catch (err) {
    console.error("Recalculate ranks error:", err);
    res.status(500).json({ message: "Failed to recalculate ranks", error: err.message });
  }
});

// Get analytics data
router.get("/analytics", async (req, res) => {
  try {
    // Quiz performance analytics
    const quizAnalytics = await Result.aggregate([
      {
        $lookup: {
          from: "quizzes",
          localField: "quiz",
          foreignField: "_id",
          as: "quizData",
        },
      },
      {
        $unwind: "$quizData",
      },
      {
        $group: {
          _id: "$quiz",
          quizTitle: { $first: "$quizData.title" },
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          minScore: { $min: "$score" },
        },
      },
      {
        $project: {
          _id: 1,
          quizTitle: 1,
          totalAttempts: 1,
          avgScore: { $round: ["$avgScore", 2] },
          maxScore: 1,
          minScore: 1,
        },
      },
      { $sort: { totalAttempts: -1 } },
      { $limit: 10 },
    ]);

    // User activity over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await Result.aggregate([
      {
        $match: {
          submittedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      quizAnalytics,
      dailyActivity,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Failed to fetch analytics", error: err.message });
  }
});

// Get recent quizzes
router.get("/recent-quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("createdBy", "name");

    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const results = await Result.find({ quiz: quiz._id });
        const participants = new Set(results.map((r) => r.user.toString())).size;
        const avgScore =
          results.length > 0
            ? Math.round(
                results.reduce((sum, r) => sum + r.score, 0) / results.length
              )
            : 0;

        return {
          _id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          participants,
          avgScore: `${avgScore}%`,
          status: "Active",
          createdAt: quiz.createdAt,
        };
      })
    );

    res.json(quizzesWithStats);
  } catch (err) {
    console.error("Recent quizzes error:", err);
    res.status(500).json({ message: "Failed to fetch recent quizzes", error: err.message });
  }
});

// Update user role (admin can change user roles)
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Update role error:", err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
});

// Delete user (admin can remove users)
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user._id.toString(); // Current admin user making the request

    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all results associated with this user
    await Result.deleteMany({ user: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Recalculate ranks after deletion
    await calculateAndUpdateRanks();

    res.json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
});

module.exports = router;
