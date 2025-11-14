const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    timeLimit: { type: Number, default: 10 }, // Time limit in minutes
    isFeatured: { type: Boolean, default: false }, // Featured quiz flag
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin or teacher who created the quiz
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
