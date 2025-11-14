import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Clock, AlertCircle } from "lucide-react";
import Footer from "../Components/Footer";

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime] = useState(Date.now());
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to take quizzes");
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get(`/quizzes/${id}`);

        const data = response.data;
        const totalTimeSeconds = data.timeLimit ? Number(data.timeLimit) * 60 : 60;

        const transformed = {
          _id: data._id,
          title: data.title,
          totalTimeSeconds,
          questions: Array.isArray(data.questions)
            ? data.questions.map((q) => {
                const correctOption = Array.isArray(q.options)
                  ? q.options.find((o) => o.isCorrect)
                  : null;
                return {
                  questionText: q.questionText,
                  correct_answer: correctOption ? correctOption.text : "",
                  incorrect_answers: Array.isArray(q.options)
                    ? q.options.filter((o) => !o.isCorrect).map((o) => o.text)
                    : [],
                };
              })
            : [],
        };

        setQuiz(transformed);
        setCurrentQuestion(0);
        setAnswers([]);
      } catch (err) {
        console.error("Error loading quiz:", err);
        setError(err.response?.data?.message || "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && id) {
      fetchQuiz();
    }
  }, [authLoading, id]);

  useEffect(() => {
    if (!quiz) return;

    const totalTime = quiz.totalTimeSeconds;
    setTimeRemaining(totalTime);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  const shuffledOptions = useMemo(() => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return [];
    const q = quiz.questions[currentQuestion];
    const options = [...q.incorrect_answers];
    const randomIndex = Math.floor(Math.random() * (options.length + 1));
    options.splice(randomIndex, 0, q.correct_answer);
    return options;
  }, [currentQuestion, quiz]);

  if (loading) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Loading quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Unable to load quiz</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={() => navigate("/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">No questions available</h2>
        <p className="text-gray-600 mb-4">This quiz doesn't contain any questions yet. Please contact the admin or try another quiz.</p>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={() => navigate('/quizzes')}>Back to quizzes</button>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const currentQ = quiz.questions[currentQuestion];

  // Format time display
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get time color
  const getTimeColor = () => {
    if (timeRemaining === null || timeRemaining === undefined) return "text-gray-600";
    const percentage = quiz.totalTimeSeconds > 0 ? (timeRemaining / quiz.totalTimeSeconds) * 100 : 0;
    if (percentage <= 10) return "text-red-600";
    if (percentage <= 25) return "text-orange-600";
    return "text-indigo-600";
  };

  const submitAnswer = () => {
    if (!selectedOption) return;

    // Store the answer
    setAnswers([...answers, { question: currentQ, userAnswer: selectedOption }]);

    if (currentQuestion === totalQuestions - 1) {
      // Last question - submit quiz
      handleSubmitQuiz([...answers, { question: currentQ, userAnswer: selectedOption }]);
    } else {
      // Move to next question
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleSubmitQuiz = async (allAnswers) => {
    if (submitting) return;
    setSubmitting(true);

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    const correct = allAnswers.reduce((acc, ans) => {
      return acc + (ans.userAnswer === ans.question.correct_answer ? 1 : 0);
    }, 0);

    const totalScore = Math.round((correct / totalQuestions) * 100);
    const results = allAnswers.map((ans) => ({
      question: ans.question.questionText,
      answer: ans.userAnswer || "Not answered",
      isCorrect: ans.userAnswer === ans.question.correct_answer,
      correctAnswer: ans.question.correct_answer,
    }));

    try {
      await axiosInstance.post(
        "/results/submit",
        {
          quiz: quiz._id,
          score: totalScore,
          totalQuestions,
          correctAnswers: correct,
          timeTaken: timeTaken,
        }
      );

      navigate("/result", {
        state: {
          quizTitle: quiz.title,
          totalScore,
          correct,
          incorrect: totalQuestions - correct,
          total: totalQuestions,
          answers: results,
          timeTaken,
          autoSubmitted: false,
        },
      });
    } catch (err) {
      console.error("Error submitting result:", err);
      toast.error("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  };

  if (isTimeUp) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Time's Up!</h2>
        <p className="text-gray-600 mb-4">Your quiz has been automatically submitted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 line-clamp-2">{quiz.title}</h2>
            <div className={`flex items-center gap-1 sm:gap-2 font-bold text-base sm:text-lg whitespace-nowrap ${getTimeColor()}`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
            <div
              className="h-2 sm:h-2.5 bg-indigo-600 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
            Question {currentQuestion + 1} of {totalQuestions}
          </p>
        </div>

        {/* Question Section */}
        <section className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 leading-relaxed">{currentQ.questionText}</h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {shuffledOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedOption(option)}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all font-medium text-sm sm:text-base ${
                  selectedOption === option
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:border-indigo-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Submit/Next Button */}
          {selectedOption && (
            <button
              onClick={submitAnswer}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? "Submitting..." : currentQuestion === totalQuestions - 1 ? "Submit Quiz" : "Next"}
            </button>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Quiz;
