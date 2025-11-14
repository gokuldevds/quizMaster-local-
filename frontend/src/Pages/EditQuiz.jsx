import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Save, X, Plus } from "lucide-react";

const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "easy",
    timeLimit: "",
    timeUnit: "minutes",
    isFeatured: false,
    questions: [],
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/quizzes");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axiosInstance.get(`/quizzes/${id}`);

        const data = res.data;
        const mapped = {
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          difficulty: data.difficulty || "easy",
          // keep empty string if not set so frontend shows per-question default
          timeLimit: data.timeLimit ? String(data.timeLimit) : "",
          timeUnit: "minutes",
          isFeatured: data.isFeatured || false,
          questions: Array.isArray(data.questions)
            ? data.questions.map((q) => ({
                questionText: q.questionText || "",
                options: Array.isArray(q.options)
                  ? q.options.map((o) => ({ text: o.text || "", isCorrect: !!o.isCorrect }))
                  : [
                      { text: "", isCorrect: false },
                      { text: "", isCorrect: false },
                      { text: "", isCorrect: false },
                      { text: "", isCorrect: false },
                    ],
              }))
            : [],
        };
        setQuizData(mapped);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadQuiz();
  }, [id]);

  const handleQuizChange = (field, value) => {
    setQuizData({ ...quizData, [field]: value });
  };

  const handleQuestionChange = (index, value) => {
    const updated = [...quizData.questions];
    updated[index].questionText = value;
    setQuizData({ ...quizData, questions: updated });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...quizData.questions];
    updated[qIndex].options[oIndex].text = value;
    setQuizData({ ...quizData, questions: updated });
  };

  const handleCorrectAnswer = (qIndex, oIndex) => {
    const updated = [...quizData.questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === oIndex,
    }));
    setQuizData({ ...quizData, questions: updated });
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
    const updated = quizData.questions.filter((_, i) => i !== index);
    setQuizData({ ...quizData, questions: updated });
  };

  const [successMessage, setSuccessMessage] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      // Validate questions similar to create flow
      if (!quizData.title.trim()) {
        throw new Error("Quiz title is required");
      }
      if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error("At least one question is required");
      }
      for (let i = 0; i < quizData.questions.length; i++) {
        const q = quizData.questions[i];
        if (!q.questionText || !q.questionText.trim()) {
          throw new Error(`Question ${i + 1} text is required`);
        }
        if (!Array.isArray(q.options) || q.options.length === 0) {
          throw new Error(`Question ${i + 1} must have options`);
        }
        if (!q.options.some((opt) => opt.isCorrect)) {
          throw new Error(`Question ${i + 1} must have a correct answer`);
        }
        if (q.options.some((opt) => !opt.text || !opt.text.trim())) {
          throw new Error(`Question ${i + 1} has empty options`);
        }
      }
      const token = localStorage.getItem("token");
      // Prepare payload and convert timeLimit to minutes if provided
      let minutesValue = undefined;
      if (quizData.timeLimit !== undefined && quizData.timeLimit !== null && quizData.timeLimit !== "") {
        const raw = Number(quizData.timeLimit);
        if (isNaN(raw) || raw <= 0) throw new Error('Time limit must be a positive number');
        minutesValue = quizData.timeUnit === 'seconds' ? raw / 60 : raw;
      }

      // Save quiz and questions in a single request
      await axiosInstance.put(`/quizzes/${id}`, {
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        difficulty: quizData.difficulty,
        timeLimit: minutesValue,
        isFeatured: quizData.isFeatured,
        questions: quizData.questions.map((q) => ({
          questionText: q.questionText,
          options: Array.isArray(q.options)
            ? q.options.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect }))
            : [],
        })),
      });

      const message = "Quiz updated successfully";
      toast.success(message);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(""), 2000);

      navigate("/admin/quizzes");
    } catch (err) {
      const errMsg = err.message || err.response?.data?.message || "Failed to save quiz";
      console.error("Save quiz failed:", err);
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        {successMessage ? (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {successMessage}
          </div>
        ) : null}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Quiz</h1>
          <button
            className="flex items-center gap-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => navigate(-1)}
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => handleQuizChange("title", e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={quizData.category}
                onChange={(e) => handleQuizChange("category", e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={quizData.difficulty}
                onChange={(e) => handleQuizChange("difficulty", e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={quizData.timeLimit}
                  onChange={(e) => handleQuizChange("timeLimit", e.target.value)}
                  className="w-2/3 p-2 border rounded"
                  placeholder="Leave empty to default"
                />
                <select
                  value={quizData.timeUnit}
                  onChange={(e) => handleQuizChange("timeUnit", e.target.value)}
                  className="w-1/3 p-2 border rounded"
                >
                  <option value="minutes">Minutes</option>
                  <option value="seconds">Seconds</option>
                </select>
              </div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={quizData.description}
              onChange={(e) => handleQuizChange("description", e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          {/* Questions (view/edit basics) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {quizData.questions.map((q, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question {qIndex + 1}</label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                      className="w-full p-2 border rounded mb-3"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={opt.isCorrect}
                            onChange={() => handleCorrectAnswer(qIndex, oIndex)}
                          />
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                            className="flex-1 p-2 border rounded"
                            placeholder={`Option ${oIndex + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => removeQuestion(qIndex)}
                    title="Remove question"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            >
              <Save className="inline w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuiz;


