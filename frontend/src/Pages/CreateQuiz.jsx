import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Plus, Save, X } from "lucide-react";
import AIQuestionAssistant from "../Components/AIQuestionAssistant";

const CreateQuiz = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/quizzes");
    }
  }, [user, authLoading, navigate]);

  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "easy",
  isFeatured: false,
  timeLimit: "", // numeric value (minutes or seconds depending on timeUnit). Leave empty to use 10s per question default
  timeUnit: "minutes", // 'minutes' or 'seconds'
    questions: [
      {
        questionText: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ],
  });

  const handleQuizChange = (field, value) => {
    setQuizData({ ...quizData, [field]: value });
  };

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index].questionText = value;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].options[oIndex].text = value;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const handleCorrectAnswer = (qIndex, oIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].options.forEach((opt) => (opt.isCorrect = false));
    updatedQuestions[qIndex].options[oIndex].isCorrect = true;
    setQuizData({ ...quizData, questions: updatedQuestions });
  };

  const addQuestion = () => {
    setQuizData({
      ...quizData,
      questions: [
        ...quizData.questions,
        {
          questionText: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (quizData.questions.length > 1) {
      const updatedQuestions = quizData.questions.filter((_, i) => i !== index);
      setQuizData({ ...quizData, questions: updatedQuestions });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate quiz data
      if (!quizData.title.trim()) {
        throw new Error("Quiz title is required");
      }

      if (quizData.questions.length === 0) {
        throw new Error("At least one question is required");
      }

      // Validate each question
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        if (!q.questionText.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (!q.options.some((opt) => opt.isCorrect)) {
          throw new Error(`Question ${i + 1} must have a correct answer`);
        }
        if (q.options.some((opt) => !opt.text.trim())) {
          throw new Error(`Question ${i + 1} has empty options`);
        }
      }

      // First, create the quiz
      const quizPayload = {
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        isFeatured: quizData.isFeatured,
      };

      // If admin provided a timeLimit, include it as minutes in the payload (backend stores minutes)
      if (quizData.timeLimit !== undefined && quizData.timeLimit !== null && quizData.timeLimit !== "") {
        const raw = Number(quizData.timeLimit);
        if (isNaN(raw) || raw <= 0) throw new Error('Time limit must be a positive number');
        // Convert to minutes if admin entered seconds
        const minutesValue = quizData.timeUnit === "seconds" ? raw / 60 : raw;
        quizPayload.timeLimit = minutesValue;
      }

      const quizResponse = await axiosInstance.post(
        "/quizzes",
        quizPayload
      );

      const quizId = quizResponse.data._id;

      // Then, create all questions for this quiz
      const questionPromises = quizData.questions.map((question) =>
        axiosInstance.post(
          `/questions/${quizId}`,
          {
            questionText: question.questionText,
            options: question.options,
          }
        )
      );

      await Promise.all(questionPromises);

      toast.success("Quiz created successfully!");
      navigate("/admin");
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError(err.response?.data?.message || err.message || "Failed to create quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Create New Quiz</h1>
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Admin Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quiz Details */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={quizData.title}
                  onChange={(e) => handleQuizChange("title", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={quizData.category}
                  onChange={(e) => handleQuizChange("category", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., JavaScript, React"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={quizData.difficulty}
                  onChange={(e) => handleQuizChange("difficulty", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Limit
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={quizData.timeLimit}
                    onChange={(e) => handleQuizChange("timeLimit", e.target.value)}
                    className="w-2/3 p-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty to default"
                  />
                  <select
                    value={quizData.timeUnit}
                    onChange={(e) => handleQuizChange("timeUnit", e.target.value)}
                    className="w-1/3 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="seconds">Seconds</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Optional. If left empty, total quiz time will default to 10 seconds per question ({quizData.questions.length * 10} seconds for {quizData.questions.length} questions).
                  If you set a value, pick whether the number is in minutes or seconds.
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={quizData.isFeatured}
                  onChange={(e) => handleQuizChange("isFeatured", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm font-medium text-gray-700">
                  ⭐ Mark as Featured Quiz
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={quizData.description}
                onChange={(e) => handleQuizChange("description", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows="3"
                placeholder="Brief description of the quiz"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Questions</h2>
              
              <div className="flex items-center gap-3">
                <AIQuestionAssistant
                  onSelectQuestion={(question) => {
                    // Check for duplicate questions
                    const isDuplicate = quizData.questions.some(q => q.questionText.toLowerCase() === question.question.toLowerCase());
                    if (isDuplicate) {
                      toast.error("This question already exists in the quiz");
                      return;
                    }

                    const newQuestions = [...quizData.questions];
                    newQuestions.push({
                      questionText: question.question,
                      options: question.options.map((opt, idx) => ({
                        text: opt,
                        isCorrect: opt === question.correctAnswer,
                      })),
                    });
                    setQuizData({ ...quizData, questions: newQuestions });
                  }}
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  <Plus size={16} /> Add Question
                </button>
              </div>
              
            </div>
<p className="text-xs text-gray-500 m-1">
                  Select the correct answer from the options.
                </p>
            {quizData.questions.map((question, qIndex) => (
              <div key={qIndex} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Question {qIndex + 1}</h3>
                  {quizData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enter question text"
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mb-3"
                  required
                />
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={option.isCorrect}
                        onChange={() => handleCorrectAnswer(qIndex, oIndex)}
                        required
                      />
                      <input
                        type="text"
                        placeholder={`Option ${oIndex + 1}`}
                        value={option.text}
                        onChange={(e) =>
                          handleOptionChange(qIndex, oIndex, e.target.value)
                        }
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        required
                      />
                      {option.isCorrect && (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Save size={16} /> {loading ? "Creating..." : "Create Quiz"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuiz;
