import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "../Components/Footer";
import axiosInstance from "../api/axiosInstance";

const Home = () => {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	// Redirect admin users to admin dashboard
	useEffect(() => {
		if (!loading && user && user.role === 'admin') {
			navigate('/admin');
		}
	}, [user, loading, navigate]);
	const [featuredQuizzes, setFeaturedQuizzes] = useState([]);
	const [recentQuizzes, setRecentQuizzes] = useState([]);
	const [fetchLoading, setFetchLoading] = useState(true);
	const [featuredLoading, setFeaturedLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchFeatured = async () => {
			try {
				setFeaturedLoading(true);
				// Public endpoint for featured quizzes - no authentication required
				const res = await axiosInstance.get("/quizzes/featured?limit=3");
				if (res.data && Array.isArray(res.data)) {
					setFeaturedQuizzes(res.data);
				} else {
					setFeaturedQuizzes([]);
				}
			} catch (err) {
				console.error("Error fetching featured quizzes:", err);
				setFeaturedQuizzes([]);
				// Show user-friendly error for featured quizzes
				if (err.response?.status === 404) {
					console.warn("Featured quizzes endpoint not found");
				} else if (err.response?.status >= 500) {
					console.warn("Server error fetching featured quizzes");
				}
			} finally {
				setFeaturedLoading(false);
			}
		};

		const fetchRecent = async () => {
			try {
				setFetchLoading(true);
				setError("");
				// Public endpoint for recent quizzes - no authentication required
				const res = await axiosInstance.get("/quizzes/recent?limit=6");
				if (res.data && Array.isArray(res.data)) {
					setRecentQuizzes(res.data);
				} else {
					setRecentQuizzes([]);
				}
			} catch (err) {
				console.error("Error fetching recent quizzes:", err);
				console.error("Error details:", err.response?.data || err.message);
				console.error("Error status:", err.response?.status);
				// If it's a 404 or 500 error, show the error message
				if (err.response?.status === 404) {
					setError("Endpoint not found. Please check if the backend server is running.");
				} else if (err.response?.status >= 500) {
					setError("Server error. Please try again later.");
				} else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
					setError("Couldn't connect to server. Please ensure the backend is running.");
				} else {
					// For other errors, just show empty state
					setError("");
					setRecentQuizzes([]);
				}
			} finally {
				setFetchLoading(false);
			}
		};

		fetchFeatured();
		fetchRecent();
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex flex-col">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-r from-indigo-700 to-indigo-600 text-white py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 text-center shadow-md rounded-b-2xl sm:rounded-b-3xl mb-6 sm:mb-8">
				<div className="absolute top-2 sm:top-4 right-4 sm:right-8 hidden md:block animate-bounce text-4xl sm:text-6xl">
					<span>✨</span>
				</div>
				<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 drop-shadow-lg leading-tight">
					Welcome to{" "}
					<span className="text-blue-100">QuizMaster</span>
				</h1>
				<p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 opacity-90 font-light">
					Test your knowledge, improve your skills, and compete with others!
				</p>
				<Link
					to="/quizzes"
					className="inline-block bg-white text-indigo-700 px-6 sm:px-8 py-2.5 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-lg hover:bg-indigo-50 transition duration-200"
				>
					Explore Quizzes
				</Link>
				<div className="absolute bottom-2 sm:bottom-4 left-4 sm:left-8 hidden md:block animate-pulse text-4xl sm:text-6xl">
					<span>🚀</span>
				</div>
			</section>

			{/* Featured Quizzes Section */}
			{featuredQuizzes.length > 0 && (
				<section className="py-8 sm:py-12 px-4 sm:px-6 max-w-6xl mx-auto w-full">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
						<div className="flex items-center gap-2 sm:gap-3">
							<span className="text-2xl sm:text-3xl">⭐</span>
							<h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Featured Quizzes</h2>
						</div>
						<Link to="/quizzes" className="text-indigo-600 hover:underline font-medium text-sm sm:text-base">View all</Link>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						{featuredQuizzes.map((q) => (
							<div 
								key={q._id} 
								className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
							>
								<div className="p-4 sm:p-6">
									<div className="flex items-start justify-between mb-3 gap-2">
										<span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold whitespace-nowrap">
											⭐ Featured
										</span>
										<span className={`px-2 py-1 rounded text-xs font-medium capitalize flex-shrink-0 ${
											(q.difficulty || "easy") === "easy"
												? "bg-green-100 text-green-700"
												: (q.difficulty || "") === "medium"
												? "bg-yellow-100 text-yellow-700"
												: "bg-red-100 text-red-700"
										}`}>
											{q.difficulty || "easy"}
										</span>
									</div>
									<h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2">{q.title}</h3>
									<p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{q.description || "Test your knowledge with this featured quiz!"}</p>
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs text-gray-600 mb-4">
										{q.category && (
											<span className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-indigo-700 font-medium">
												{q.category}
											</span>
										)}
										<span>
											⏱ {
												(() => {
													if (q.timeLimit !== null && q.timeLimit !== undefined) {
														const totalSeconds = Number(q.timeLimit) * 60;
														if (isNaN(totalSeconds) || totalSeconds <= 0) return "0s";
														const mins = Math.floor(totalSeconds / 60);
														const secs = totalSeconds % 60;
														if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
														if (mins > 0) return `${mins} min`;
														return `${secs}s`;
													} else {
														return "1 min";
													}
												})()
										}
										</span>
										<span>👥 {q.participants ?? 0}</span>
									</div>
									<button
										className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 font-semibold text-sm sm:text-base shadow-md transition-all duration-200"
										onClick={() => (user ? navigate(`/quiz/${q._id}`) : navigate("/login"))}
									>
										Take Featured Quiz
									</button>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

		

			{/* How it Works Section */}
			<section className="bg-white py-12 sm:py-16 px-4 sm:px-6 border-t border-gray-200 rounded-2xl sm:rounded-3xl shadow-md mx-2 sm:mx-4 mb-8 sm:mb-12">
				<h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mb-8 sm:mb-10 text-center tracking-tight">
					How It Works
				</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto text-center">
					<div className="bg-indigo-50 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow">
						<div className="text-4xl sm:text-5xl mb-4 text-indigo-700">📝</div>
						<h3 className="font-bold mb-2 text-gray-800 text-base sm:text-lg">
							Choose a Quiz
						</h3>
						<p className="text-gray-600 text-sm sm:text-base">
							Pick a quiz from our collection of topics.
						</p>
					</div>
					<div className="bg-blue-50 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow">
						<div className="text-4xl sm:text-5xl mb-4 text-indigo-700">⏱️</div>
						<h3 className="font-bold mb-2 text-gray-800 text-base sm:text-lg">
							Take the Quiz
						</h3>
						<p className="text-gray-600 text-sm sm:text-base">
							Answer questions within the timer and test your skills.
						</p>
					</div>
					<div className="bg-pink-50 rounded-lg sm:rounded-xl p-6 sm:p-8 shadow">
						<div className="text-4xl sm:text-5xl mb-4 text-indigo-700">🏆</div>
						<h3 className="font-bold mb-2 text-gray-800 text-base sm:text-lg">
							See Results
						</h3>
						<p className="text-gray-600 text-sm sm:text-base">
							Get instant results and check your ranking on the leaderboard.
						</p>
					</div>
				</div>
			</section>

			{/* Call-to-Action */}
			<section className="py-12 sm:py-16 px-4 sm:px-6 text-center bg-gradient-to-r from-indigo-700 to-indigo-600 text-white rounded-2xl sm:rounded-3xl mx-2 sm:mx-4 mb-8 sm:mb-12 shadow-lg">
				<h2 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6">
					Ready to Challenge Yourself?
				</h2>
				<Link
					to="/quizzes"
					className="inline-block bg-white text-indigo-700 px-6 sm:px-8 py-2.5 sm:py-4 rounded-full font-bold text-sm sm:text-lg shadow-lg hover:bg-indigo-50 transition duration-200"
				>
					Start Now
				</Link>
			</section>
			<Footer />
		</div>
	);
};

export default Home;
