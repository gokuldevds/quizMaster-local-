import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./Components/Navbar";
import PrivateRoute from "./Components/PrivateRoute";
import AdminRoute from "./Components/AdminRoute";
import Home from "./Pages/Home";
import Quiz from "./Pages/Quiz";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import LeaderBoard from "./Pages/Leaderboard";
import Quizzes from "./Pages/Quizzes";
import Profile from "./Pages/Profile";
import AdminDashboard from "./Pages/AdminDashboard";
import CreateQuiz from "./Pages/CreateQuiz";
import ManageQuizzes from "./Pages/ManageQuizzes";
import EditQuiz from "./Pages/EditQuiz";
import ForgotPassword from "./Pages/ForgotPassword";
import Result from "./Pages/Result";
import AIQuizModule from "./Components/AIQuizModule/AIQuizModule";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/leaderboard" element={<LeaderBoard />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/quizzes"
              element={
                <PrivateRoute>
                  <Quizzes />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-quiz"
              element={
                <PrivateRoute>
                  <AIQuizModule />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/result"
              element={
                <PrivateRoute>
                  <Result />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/ai-quiz"
              element={
                <PrivateRoute>
                  <AIQuizModule />
                </PrivateRoute>
              }
            />
            
            {/* Admin Routes - Admin Only */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/create-quiz"
              element={
                <AdminRoute>
                  <CreateQuiz />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/quizzes"
              element={
                <AdminRoute>
                  <ManageQuizzes />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/edit-quiz/:id"
              element={
                <AdminRoute>
                  <EditQuiz />
                </AdminRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
