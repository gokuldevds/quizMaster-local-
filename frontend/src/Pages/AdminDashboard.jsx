import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Users, ListChecks, BarChart3, TrendingUp, Plus, UserCircle, Trash2, Mail, Lock } from "lucide-react";
import ConfirmModal from "../Components/ConfirmModal";
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

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    avgScore: 0,
    totalResults: 0,
  });
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, targetId: null, action: null });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      navigate("/quizzes");
      return;
    }
    
    if (user && user.role === "admin") {
      fetchDashboardData();
    }
  }, [activeTab, user, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      if (activeTab === "dashboard") {
        const [statsRes, analyticsRes, quizzesRes] = await Promise.all([
          axiosInstance.get("/admin/stats"),
          axiosInstance.get("/admin/analytics"),
          axiosInstance.get("/admin/recent-quizzes"),
        ]);

        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
        setRecentQuizzes(quizzesRes.data);
      } else if (activeTab === "users") {
        const usersRes = await axiosInstance.get("/admin/users");
        setUsersList(usersRes.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setCreateAdminLoading(true);
    try {
      await axiosInstance.post(
        "/admin/create-admin",
        newAdmin
      );
      toast.success("Admin user created successfully!");
      setShowCreateAdmin(false);
      setNewAdmin({ name: "", email: "", password: "" });
      if (activeTab === "users") fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create admin user");
    } finally {
      setCreateAdminLoading(false);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmState({ isOpen: false, targetId: null, action: null });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.targetId) return;

    try {
      const token = localStorage.getItem('token');
      if (confirmState.action === 'deleteUser') {
        await axiosInstance.delete(`/admin/users/${confirmState.targetId}`);
        toast.success("User deleted successfully!");
        if (activeTab === 'users') fetchDashboardData();
      }
    } catch (err) {
      console.error('Error performing confirm action:', err);
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setConfirmState({ isOpen: false, targetId: null, action: null });
    }
  };

  const quizPerformanceData = analytics?.quizAnalytics
    ? {
        labels: analytics.quizAnalytics.map((q) => q.quizTitle),
        datasets: [
          {
            label: "Average Score",
            data: analytics.quizAnalytics.map((q) => q.avgScore),
            backgroundColor: "rgba(79, 70, 229, 0.6)",
            borderColor: "rgba(79, 70, 229, 1)",
            borderWidth: 2,
          },
        ],
      }
    : null;

  const dailyActivityData = analytics?.dailyActivity
    ? {
        labels: analytics.dailyActivity.map((d) => d._id),
        datasets: [
          {
            label: "Quiz Attempts",
            data: analytics.dailyActivity.map((d) => d.count),
            backgroundColor: "rgba(34, 197, 94, 0.6)",
            borderColor: "rgba(34, 197, 94, 1)",
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      }
    : null;

  const statsData = stats
    ? {
        labels: ["Quizzes", "Users", "Results"],
        datasets: [
          {
            data: [stats.totalQuizzes, stats.totalUsers, stats.totalResults],
            backgroundColor: [
              "rgba(79, 70, 229, 0.6)",
              "rgba(34, 197, 94, 0.6)",
              "rgba(249, 115, 22, 0.6)",
            ],
            borderColor: [
              "rgba(79, 70, 229, 1)",
              "rgba(34, 197, 94, 1)",
              "rgba(249, 115, 22, 1)",
            ],
            borderWidth: 2,
          },
        ],
      }
    : null;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access Denied</p>
          <button
            onClick={() => navigate("/quizzes")}
            className="text-indigo-600 hover:underline"
          >
            Go to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md flex flex-col justify-between transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div>
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="p-4 space-y-2">
            <button
              onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                activeTab === "dashboard"
                  ? "bg-indigo-100 text-indigo-600 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <BarChart3 size={18} /> Dashboard
            </button>
            <Link
              to="/admin/create-quiz"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <Plus size={18} /> Create Quiz
            </Link>
            <Link
              to="/admin/quizzes"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <ListChecks size={18} /> Manage Quizzes
            </Link>
            <button
              onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-2 rounded-lg ${
                activeTab === "users"
                  ? "bg-indigo-100 text-indigo-600 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Users size={18} /> Users
            </button>

          </nav>
        </div>
        <div className="p-4 border-t">
          <div className="mb-3 pb-3 border-b">
            <p className="text-sm font-semibold text-gray-800">{user?.name || "Admin"}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <p className="text-xs text-indigo-600 font-medium mt-1">👑 Admin</p>
          </div>

        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-white shadow-sm border border-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === "dashboard" ? "Dashboard" : "Users"}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        {activeTab === "dashboard" && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Total Quizzes</p>
                <h2 className="text-3xl font-bold text-gray-800">{stats.totalQuizzes}</h2>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Total Users</p>
                <h2 className="text-3xl font-bold text-gray-800">{stats.totalUsers}</h2>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Average Score</p>
                <h2 className="text-3xl font-bold text-gray-800">{stats.avgScore}%</h2>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500 text-sm mb-1">Total Attempts</p>
                <h2 className="text-3xl font-bold text-gray-800">{stats.totalResults}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {dailyActivityData && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
                  <Line
                    data={dailyActivityData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              )}

              {statsData && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Statistics Overview</h3>
                  <Doughnut
                    data={statsData}
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

            {quizPerformanceData && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold mb-4">Top Quiz Performance</h3>
                <Bar
                  data={quizPerformanceData}
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Recent Quizzes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="p-3">Quiz Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Participants</th>
                      <th className="p-3">Average Score</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuizzes.map((quiz, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 text-gray-700">
                        <td className="p-3 font-medium">{quiz.title}</td>
                        <td className="p-3">{quiz.category || "N/A"}</td>
                        <td className="p-3">{quiz.participants}</td>
                        <td className="p-3">{quiz.avgScore}</td>
                        <td className="p-3">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                            {quiz.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

            {activeTab === "users" && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-gray-800">Users</h1>
                  <button
                    onClick={() => setShowCreateAdmin(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Plus size={18} /> Create Admin
                  </button>
                </div>

                {/* Create Admin Modal */}
                {showCreateAdmin && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-full max-w-md mx-4">
                      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-400 text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                              <UserCircle size={24} />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold">Create Admin</h2>
                              <p className="text-sm opacity-90">Add a new administrator account</p>
                            </div>
                          </div>
                        </div>

                        <form onSubmit={handleCreateAdminSubmit} className="p-8">
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserCircle size={16} /></span>
                              <input
                                type="text"
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                required
                                className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></span>
                              <input
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                required
                                className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
                              <input
                                type={showAdminPassword ? 'text' : 'password'}
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                required
                                minLength={6}
                                className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              />
                              <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-600 hover:text-indigo-700">
                                {showAdminPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-3 mt-6">
                            <button type="submit" disabled={createAdminLoading} className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                              {createAdminLoading ? 'Creating...' : 'Create Admin'}
                            </button>
                            <button type="button" onClick={() => { setShowCreateAdmin(false); setNewAdmin({ name: '', email: '', password: '' }); }} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Rank</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Quizzes Taken
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-700">
                        Avg Score
                      </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">
                          Total Score
                        </th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">
                          Actions
                        </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usersList.map((listUser) => (
                      <tr key={listUser._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700">
                          {listUser.rank ? (
                            <span className="font-semibold text-indigo-600">#{listUser.rank}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">{listUser.name}</td>
                        <td className="px-6 py-4 text-gray-600">{listUser.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              listUser.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {listUser.role === "admin" ? "👑 Admin" : "👤 User"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{listUser.totalQuizzes}</td>
                        <td className="px-6 py-4 text-gray-700">{listUser.avgScore}%</td>
                        <td className="px-6 py-4 text-gray-700">{listUser.totalScore}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                targetId: listUser._id,
                                action: 'deleteUser',
                                message: `Delete ${listUser.name}? This will also delete all their quiz results.`
                              });
                            }}
                            disabled={listUser._id === user?.id}
                            className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                              listUser._id === user?.id
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            <Trash2 size={14} /> Remove User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.action === 'deleteUser' ? 'Delete user' : 'Confirm'}
        message={confirmState.message}
        onCancel={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        confirmText={confirmState.action === 'deleteUser' ? 'Delete' : 'Confirm'}
      />
    </div>
  );
};

export default AdminDashboard;
