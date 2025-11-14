const express = require("express");
const mongoose = require("mongoose");
const Quiz = require("../models/quizModel");
const Question = require("../models/questionModel");
const Result = require("../models/resultModel");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Get featured quizzes (Public - no authentication required)
router.get("/featured", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    console.log("Fetching featured quizzes, limit:", limit);
    
    // Get featured quizzes
    const quizzes = await Quiz.find({ isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id title category difficulty description timeLimit createdAt isFeatured")
      .lean();

    console.log(`Found ${quizzes ? quizzes.length : 0} featured quizzes`);
    
    if (!quizzes || quizzes.length === 0) {
      return res.json([]);
    }

    // Get participant counts and average scores for each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        try {
          const results = await Result.find({ quiz: quiz._id });
          const participants = results.length > 0 
            ? new Set(results.map((r) => r.user.toString())).size 
            : 0;
          const avgScore =
            results.length > 0
              ? Math.round(
                  results.reduce((sum, r) => sum + r.score, 0) / results.length
                )
              : 0;

          return {
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category || "General",
            difficulty: quiz.difficulty || "easy",
            description: quiz.description || "",
            // Keep timeLimit as provided by admin (minutes). If not present, return null so frontend can apply per-question default.
            timeLimit: quiz.timeLimit ?? null,
            participants,
            avgScore: `${avgScore}%`,
            createdAt: quiz.createdAt,
            isFeatured: quiz.isFeatured || false,
          };
        } catch (err) {
          console.error(`Error processing quiz ${quiz._id}:`, err);
          // Return quiz without stats if there's an error
          return {
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category || "General",
            difficulty: quiz.difficulty || "easy",
            description: quiz.description || "",
            timeLimit: quiz.timeLimit ?? null,
            participants: 0,
            avgScore: "0%",
            createdAt: quiz.createdAt,
            isFeatured: quiz.isFeatured || false,
          };
        }
      })
    );

    res.json(quizzesWithStats);
  } catch (err) {
    console.error("Featured quizzes error:", err);
    res.status(500).json({ message: "Failed to fetch featured quizzes", error: err.message });
  }
});

// Get recent quizzes (Public - no authentication required)
router.get("/recent", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    console.log("Fetching recent quizzes, limit:", limit);
    
    // Get recent quizzes (excluding featured ones to avoid duplication)
    const quizzes = await Quiz.find({ isFeatured: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("_id title category difficulty description timeLimit createdAt")
      .lean();

    console.log(`Found ${quizzes ? quizzes.length : 0} quizzes`);
    
    if (!quizzes || quizzes.length === 0) {
      return res.json([]);
    }

    // Get participant counts and average scores for each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        try {
          const results = await Result.find({ quiz: quiz._id });
          const participants = results.length > 0 
            ? new Set(results.map((r) => r.user.toString())).size 
            : 0;
          const avgScore =
            results.length > 0
              ? Math.round(
                  results.reduce((sum, r) => sum + r.score, 0) / results.length
                )
              : 0;

          return {
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category || "General",
            difficulty: quiz.difficulty || "easy",
            description: quiz.description || "",
            timeLimit: quiz.timeLimit || 10,
            participants,
            avgScore: `${avgScore}%`,
            createdAt: quiz.createdAt,
          };
        } catch (err) {
          console.error(`Error processing quiz ${quiz._id}:`, err);
          // Return quiz without stats if there's an error
          return {
            _id: quiz._id,
            title: quiz.title,
            category: quiz.category || "General",
            difficulty: quiz.difficulty || "easy",
            description: quiz.description || "",
            timeLimit: quiz.timeLimit || 10,
            participants: 0,
            avgScore: "0%",
            createdAt: quiz.createdAt,
          };
        }
      })
    );

    res.json(quizzesWithStats);
  } catch (err) {
    console.error("Recent quizzes error:", err);
    res.status(500).json({ message: "Failed to fetch recent quizzes", error: err.message });
  }
});

// Create quiz (Admin only) - Atomic transaction
router.post("/", protect, adminOnly, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, description, category, difficulty, questions = [], timeLimit, isFeatured } = req.body;

    // 1) Create Question docs first
    let questionDocs = [];
    if (Array.isArray(questions) && questions.length > 0) {
      questionDocs = await Question.insertMany(
        questions.map((q) => ({
          questionText: q.questionText,
          options: Array.isArray(q.options) ? q.options.map((opt) => ({
            text: opt.text,
            isCorrect: !!opt.isCorrect,
          })) : [],
          quiz: null, // Will be set after quiz creation
        })),
        { session }
      );
    }

    // 2) Create the quiz with question IDs
    const quiz = await Quiz.create([{
      title,
      description,
      category,
      difficulty,
      timeLimit,
      isFeatured: isFeatured || false,
      createdBy: req.user._id,
      questions: questionDocs.map((doc) => doc._id),
    }], { session });

    // 3) Update questions with quiz reference
    if (questionDocs.length > 0) {
      await Question.updateMany(
        { _id: { $in: questionDocs.map(doc => doc._id) } },
        { quiz: quiz[0]._id },
        { session }
      );
    }

    await session.commitTransaction();

    const populated = await Quiz.findById(quiz[0]._id).populate("questions");
    res.json(populated);
  } catch (err) {
    await session.abortTransaction();
    console.error("Create quiz error:", err);
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// Replace questions for a quiz (Admin only)
router.put("/:id/questions", protect, adminOnly, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: "questions must be an array" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Delete existing questions
    await Question.deleteMany({ quiz: quizId });

    // Insert new questions
    const created = await Question.insertMany(
      questions.map((q) => ({
        questionText: q.questionText,
        options: Array.isArray(q.options)
          ? q.options.map((opt) => ({ text: opt.text, isCorrect: !!opt.isCorrect }))
          : [],
        quiz: quizId,
      }))
    );

    // Update quiz's question references
    quiz.questions = created.map((c) => c._id);
    await quiz.save();

    return res.json({ updated: created.length });
  } catch (err) {
    console.error("Replace quiz questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get all quizzes
router.get("/", protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate("questions");
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single quiz
router.get("/:id", protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update quiz (Admin only)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user created this quiz or is admin
    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this quiz" });
    }

    const { title, description, category, difficulty, timeLimit, isFeatured, questions } = req.body;

    // Update primitive fields
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (category !== undefined) quiz.category = category;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (isFeatured !== undefined) quiz.isFeatured = !!isFeatured;

    // If questions provided, replace them atomically
    if (Array.isArray(questions)) {
      await Question.deleteMany({ quiz: quiz._id });
      const created = await Question.insertMany(
        questions.map((q) => ({
          questionText: q.questionText,
          options: Array.isArray(q.options)
            ? q.options.map((opt) => ({ text: opt.text, isCorrect: !!opt.isCorrect }))
            : [],
          quiz: quiz._id,
        }))
      );
      quiz.questions = created.map((c) => c._id);
    }

    await quiz.save();
    const populated = await Quiz.findById(quiz._id).populate("questions");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete quiz (Admin only)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user created this quiz or is admin
    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this quiz" });
    }

    // Delete all questions associated with this quiz
    await Question.deleteMany({ quiz: quiz._id });
    
    // Delete the quiz
    await Quiz.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
