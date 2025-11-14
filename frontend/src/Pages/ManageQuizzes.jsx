import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import ConfirmModal from "../Components/ConfirmModal";

const ManageQuizzes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ isOpen: false, targetId: null, message: '' });

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/quizzes");
      return;
    }
    
    if (user && user.role === "admin") {
      fetchQuizzes();
    }
  }, [user, authLoading, navigate]);

  const fetchQuizzes = async () => {
    try {
      const response = await axiosInstance.get("/quizzes");
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (quizId) => {
    setConfirmState({ isOpen: true, targetId: quizId, message: 'This action cannot be undone.' });
  };

  const performDelete = async (quizId) => {
    try {
      await axiosInstance.delete(`/quizzes/${quizId}`);
      toast.success("Quiz deleted successfully!");
      fetchQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    } finally {
      setConfirmState({ isOpen: false, targetId: null, message: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="text-gray-600 hover:text-gray-800 p-1"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Quizzes</h1>
          </div>
          <button
            onClick={() => navigate("/admin/create-quiz")}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Create New
          </button>
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Title</th>
                <th className="px-6 py-4 text-left font-semibold">Category</th>
                <th className="px-6 py-4 text-left font-semibold">Difficulty</th>
                <th className="px-6 py-4 text-left font-semibold">Questions</th>
                <th className="px-6 py-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{quiz.title}</td>
                  <td className="px-6 py-4 text-gray-600">{quiz.category || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quiz.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : quiz.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {quiz.difficulty || "easy"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {quiz.questions?.length || 0} questions
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/edit-quiz/${quiz._id}`)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit Quiz"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {quizzes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No quizzes found. Create your first quiz!
            </div>
          )}
        </div>

        {/* Mobile/Tablet View - Cards */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 line-clamp-2 flex-1">{quiz.title}</h3>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => navigate(`/admin/edit-quiz/${quiz._id}`)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title="Edit Quiz"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz._id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-800">{quiz.category || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Difficulty:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      quiz.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : quiz.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {quiz.difficulty || "easy"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium text-gray-800">{quiz.questions?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No quizzes found. Create your first quiz!
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Delete Quiz"
        message={confirmState.message || 'Are you sure you want to delete this quiz?'}
        onCancel={() => setConfirmState({ isOpen: false, targetId: null, message: '' })}
        onConfirm={() => performDelete(confirmState.targetId)}
        confirmText="Delete"
        blur={true}
      />
    </div>
  );
};

export default ManageQuizzes;

