const express = require("express");
const Question = require("../models/questionModel");
const Quiz = require("../models/quizModel");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Search questions by keyword (for AI assistant)
// IMPORTANT: This route must come BEFORE /:quizId to avoid conflicts
router.get("/search", protect, async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword || keyword.trim().length < 3) {
      console.log("Keyword too short, returning empty array");
      return res.json([]);
    }

    const questions = await Question.find({
      $or: [
        { questionText: { $regex: keyword.trim(), $options: 'i' } },
        { 'options.text': { $regex: keyword.trim(), $options: 'i' } }
      ]
    }).populate('quiz', 'category title').limit(10); // Limit to 10 results

    // Format response to match frontend expectations
    const formattedQuestions = questions.map(q => {
      try {
        return {
          question: q.questionText,
          options: Array.isArray(q.options) ? q.options.map(opt => opt.text) : [],
          correctAnswer: Array.isArray(q.options) ? (q.options.find(opt => opt.isCorrect)?.text || '') : '',
          topic: q.quiz?.category || 'General',
          quizTitle: q.quiz?.title || 'Unknown Quiz'
        };
      } catch (mapErr) {
        console.error("Error mapping question:", q._id, mapErr);
        return null;
      }
    }).filter(q => q !== null);

    res.json(formattedQuestions);
  } catch (err) {
    console.error("Search questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Add question to a quiz
router.post("/:quizId", protect, adminOnly, async (req, res) => {
  try {
    const { questionText, options } = req.body;
    const question = await Question.create({ questionText, options, quiz: req.params.quizId });
    await Quiz.findByIdAndUpdate(req.params.quizId, { $push: { questions: question._id } });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Replace all questions for a quiz (bulk)
router.put("/:quizId/bulk-replace", protect, adminOnly, async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) {
      return res.status(400).json({ message: "questions must be an array" });
    }

    const quizId = req.params.quizId;

    // Delete existing questions for this quiz
    await Question.deleteMany({ quiz: quizId });

    // Insert new questions
    const created = await Question.insertMany(
      questions.map((q) => ({
        questionText: q.questionText,
        options: Array.isArray(q.options) ? q.options.map((opt) => ({
          text: opt.text,
          isCorrect: !!opt.isCorrect,
        })) : [],
        quiz: quizId,
      }))
    );

    // Update quiz document with new question IDs
    await Quiz.findByIdAndUpdate(quizId, { questions: created.map((c) => c._id) });

    res.json({ replaced: created.length });
  } catch (err) {
    console.error("Bulk replace questions error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get questions by quiz
router.get("/:quizId", protect, async (req, res) => {
  const questions = await Question.find({ quiz: req.params.quizId });
  res.json(questions);
});

module.exports = router;
