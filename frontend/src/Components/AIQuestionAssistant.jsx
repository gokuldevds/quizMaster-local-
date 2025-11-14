import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const AIQuestionAssistant = ({ onSelectQuestion }) => {
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keyword.trim().length > 2) {
      searchSuggestions(keyword.trim());
    } else {
      setSuggestions([]);
      setError(null);
    }
  }, [keyword]);

  const searchSuggestions = async (searchTerm) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Please login to search questions");
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Call backend generative endpoint (POST /ai/generate-quiz)
      const response = await axiosInstance.post('/ai/generate-quiz', {
        topic: searchTerm,
        difficulty: 'medium',
        questionCount: 5,
      });

      const results = response.data?.results || [];
      // Map backend schema to assistant suggestion shape
      const mapped = results.map((r) => ({
        topic: r.category || searchTerm,
        question: r.question || r.question_text || '',
        options: [r.correct_answer, ...(r.incorrect_answers || [])],
        quizTitle: r.quizTitle || null,
      }));

      setSuggestions(mapped);
    } catch (err) {
      console.error("Error searching questions:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setError("Please login to search questions");
      } else {
        setError(err.response?.data?.message || "Failed to search questions");
      }
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (question) => {
    onSelectQuestion(question);
    setKeyword("");
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition"
      >
        <Sparkles className="w-5 h-5" />
        AI Question Assistant
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Search Questions</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Type keywords (e.g., JavaScript, React, hoisting...)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            disabled={loading}
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 text-center py-4 bg-red-50 rounded-md">
              {error}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-indigo-50 cursor-pointer transition"
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      {suggestion.topic}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    {suggestion.question}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {suggestion.options.length} options
                    </p>
                    {suggestion.quizTitle && (
                      <p className="text-xs text-gray-400 italic">
                        from: {suggestion.quizTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : keyword.trim().length > 2 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No suggestions found for "{keyword}"
            </p>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Type at least 3 characters to search...
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Search for questions from your quiz database
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionAssistant;



