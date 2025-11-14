import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Trophy, Target, TrendingUp } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import Footer from "../Components/Footer";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    totalScore: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchUserResults();
    }
  }, [user, authLoading, navigate]);

  const fetchUserResults = async () => {
    try {
      const response = await axiosInstance.get("/results/my-results");

      const results = response.data;
      setQuizResults(results);

      if (results.length > 0) {
        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = Math.round(totalScore / results.length);

        setStats({
          totalQuizzes: results.length,
          averageScore,
          totalScore,
        });
      }
    } catch (error) {
      console.error("Error fetching user results:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for score over time
  // Prepare chart data for score over time
  const scoreOverTimeData = quizResults.length > 0
    ? {
        labels: quizResults
          .slice()
          .reverse()
          .map((r, index) => `Attempt ${index + 1}`),
        datasets: [
          {
            label: "Score (%)",
            data: quizResults
              .slice()
              .reverse()
              .map((r) => r.score || 0),
            backgroundColor: "rgba(79, 70, 229, 0.6)",
            borderColor: "rgba(79, 70, 229, 1)",
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      }
    : null;

  const performanceData = quizResults.length > 0
    ? {
        labels: ["Excellent (90-100)", "Good (70-89)", "Fair (50-69)", "Needs Improvement (<50)"],
        datasets: [
          {
            data: [
              quizResults.filter((r) => r.score >= 90).length,
              quizResults.filter((r) => r.score >= 70 && r.score < 90).length,
              quizResults.filter((r) => r.score >= 50 && r.score < 70).length,
              quizResults.filter((r) => r.score < 50).length,
            ],
            backgroundColor: [
              "rgba(34, 197, 94, 0.6)",
              "rgba(79, 70, 229, 0.6)",
              "rgba(249, 115, 22, 0.6)",
              "rgba(239, 68, 68, 0.6)",
            ],
            borderColor: [
              "rgba(34, 197, 94, 1)",
              "rgba(79, 70, 229, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  const quizScoresData = quizResults.length > 0
    ? {
        labels: quizResults
          .slice()
          .reverse()
          .map((r) => r.quiz?.title || "Quiz " + (quizResults.length - quizResults.indexOf(r))),
        datasets: [
          {
            label: "Score (%)",
            data: quizResults
              .slice()
              .reverse()
              .map((r) => r.score || 0),
            backgroundColor: quizResults
              .slice()
              .reverse()
              .map((r) => {
                const score = r.score || 0;
                if (score >= 90) return "rgba(34, 197, 94, 0.6)";
                if (score >= 70) return "rgba(79, 70, 229, 0.6)";
                if (score >= 50) return "rgba(249, 115, 22, 0.6)";
                return "rgba(239, 68, 68, 0.6)";
              }),
            borderColor: quizResults
              .slice()
              .reverse()
              .map((r) => {
                const score = r.score || 0;
                if (score >= 90) return "rgba(34, 197, 94, 1)";
                if (score >= 70) return "rgba(79, 70, 229, 1)";
                if (score >= 50) return "rgba(249, 115, 22, 1)";
                return "rgba(239, 68, 68, 1)";
              }),
            borderWidth: 2,
          },
        ],
      }
    : null;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-lg">
              {user.name ? user.name[0].toUpperCase() : <User className="w-12 h-12" />}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-1">{user.name}</h1>
              <p className="text-gray-600 text-lg">{user.email}</p>
              {user.role && (
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Quizzes</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalQuizzes}</p>
              </div>
              <Target className="w-12 h-12 text-indigo-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Score</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalScore}</p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts */}
        {quizResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {scoreOverTimeData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Score Over Time
                  </h2>
                  <Line
                    data={scoreOverTimeData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                  />
                </div>
              )}

              {performanceData && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Performance Distribution
                  </h2>
                  <Doughnut
                    data={performanceData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "bottom" },
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {quizScoresData && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Quiz Scores</h2>
                <Bar
                  data={quizScoresData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                      },
                    },
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No Quiz Attempts Yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start taking quizzes to see your performance here!
            </p>
            <button
              onClick={() => navigate("/quizzes")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Browse Quizzes
            </button>
          </div>
        )}

        {/* Past Quiz Attempts List */}
        {quizResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Past Quiz Attempts</h2>
            <div className="space-y-4">
              {quizResults
                .slice()
                .reverse()
                .map((result, index) => (
                  <div
                    key={result._id || index}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {result.quiz?.title || "Quiz"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {result.submittedAt
                            ? new Date(result.submittedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            result.score >= 90
                              ? "text-green-600"
                              : result.score >= 70
                              ? "text-indigo-600"
                              : result.score >= 50
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.score || 0}%
                        </div>
                        <p className="text-sm text-gray-500">
                          {result.correctAnswers || 0}/{result.totalQuestions || 0} correct
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
