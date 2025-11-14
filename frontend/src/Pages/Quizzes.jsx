import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Search, SlidersHorizontal } from "lucide-react";
import Footer from "../Components/Footer";

const Quizzes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Fetch quizzes from API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Please log in to view quizzes");
          setLoading(false);
          return;
        }

        const response = await axiosInstance.get("/quizzes");

        // Map API response to component format
        const formattedQuizzes = response.data.map((quiz) => {
          const questionsCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
          // If backend provides timeLimit (in minutes), use that. Otherwise default to 1 minute (60s).
          const totalTimeSeconds = quiz.timeLimit ? Number(quiz.timeLimit) * 60 : 60;

          // Format display: if >= 60s show Xm Ys or Xm when exact minutes, else show Xs
          const formatTime = (seconds) => {
            if (!seconds && seconds !== 0) return null;
            if (seconds < 60) return `${seconds}s`;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            if (secs === 0) return `${mins} min`;
            return `${mins}m ${secs}s`;
          };

          return {
            id: quiz._id,
            title: quiz.title,
            questions: questionsCount,
            difficulty: quiz.difficulty || "Easy",
            category: quiz.category || "",
            description: quiz.description || "",
            // keep original minute value if provided
            timeLimitMinutes: quiz.timeLimit ?? null,
            totalTimeSeconds,
            timeDisplay: formatTime(totalTimeSeconds),
            _id: quiz._id, // Keep original _id for API calls
            createdAt: quiz.createdAt || null,
          };
        });

        setQuizzes(formattedQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
        setError(err.response?.data?.message || "Failed to load quizzes");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchQuizzes();
    }
  }, [authLoading]);

  // If navigated with a hash, filter to only that quiz
  const quizIdFromHash = location.hash ? location.hash.replace('#', '') : null;
  const filteredByHash = quizIdFromHash
    ? quizzes.filter(q => String(q.id) === quizIdFromHash || String(q._id) === quizIdFromHash)
    : quizzes;

  // Derived list: search, difficulty, sort
  const visibleQuizzes = useMemo(() => {
    let list = [...filteredByHash];

    // search by title/category/description
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(q =>
        q.title?.toLowerCase().includes(term) ||
        q.category?.toLowerCase().includes(term) ||
        q.description?.toLowerCase().includes(term)
      );
    }

    // filter by difficulty
    if (difficulty !== "all") {
      list = list.filter(q => (q.difficulty || "").toLowerCase() === difficulty);
    }

    // sort
    if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "questions-desc") {
      list.sort((a, b) => (b.questions || 0) - (a.questions || 0));
    } else if (sortBy === "questions-asc") {
      list.sort((a, b) => (a.questions || 0) - (b.questions || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [filteredByHash, search, difficulty, sortBy]);

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-9 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="h-9 w-56 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="h-6 w-2/3 bg-gray-200 animate-pulse rounded mb-3" />
                <div className="h-4 w-1/3 bg-gray-200 animate-pulse rounded mb-1" />
                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-4" />
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-semibold text-indigo-700">Available Quizzes</h1>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quizzes..."
                className="pl-10 pr-4 py-2 w-full sm:w-72 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex gap-3">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Filter by difficulty"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Sort by"
              >
                <option value="recent">Most Recent</option>
                <option value="questions-desc">Questions: High to Low</option>
                <option value="questions-asc">Questions: Low to High</option>
                <option value="title">Title A→Z</option>
              </select>
            </div>
          </div>
        </div>

        {Array.isArray(visibleQuizzes) && visibleQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleQuizzes.map((quiz) => (
              <div
                key={quiz.id || quiz._id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-6 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-lg font-bold text-gray-800 line-clamp-2 flex-1">{quiz.title}</h2>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium capitalize whitespace-nowrap ${
                      (quiz.difficulty || "easy").toLowerCase() === "easy"
                        ? "bg-green-100 text-green-700"
                        : (quiz.difficulty || "").toLowerCase() === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {quiz.difficulty || "easy"}
                  </span>
                </div>
                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                  {quiz.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs">
                      {quiz.category}
                    </span>
                  )}
                  <span>{quiz.questions} questions</span>
                  {quiz.timeDisplay ? <span>{quiz.timeDisplay}</span> : null}
                </div>
                <button
                  className="mt-auto bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition w-full"
                  onClick={() => navigate(`/quiz/${quiz.id || quiz._id}`)}
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <SlidersHorizontal className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">No quizzes match your filters</p>
            <p className="text-gray-500 text-sm mb-4">Try clearing the search or changing filters.</p>
            <button
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition"
              onClick={() => { setSearch(""); setDifficulty("all"); setSortBy("recent"); }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Quizzes;
