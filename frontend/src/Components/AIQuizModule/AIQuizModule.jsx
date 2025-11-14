import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import StartScreen from "./components/Start";
import Quiz from "./components/Quiz";
import Loader from "./components/Loader";
import ResultScreen from "./components/Result";

import "./styles.css";

function AIQuizModule() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(null);
  const [status, setStatus] = useState("start"); // start | loading | ready | finished
  const [userAnswers, setUserAnswers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Redirect admins to admin dashboard
  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const restartQuiz = () => {
    setQuestions(null);
    setStatus("start");
    setUserAnswers([]);
    setErrorMessage("");
  };

  const storeAnswer = (answer) => {
    setUserAnswers((prev) => [...prev, answer]);
  };

  const startQuiz = async ({ topic, difficulty, questionCount }) => {
    setStatus("loading");

    const API_KEY = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
    if (!API_KEY) {
      setErrorMessage("API key not configured. Please check your .env file.");
      setStatus("start");
      return;
    }
    const genAI = new GoogleGenerativeAI(API_KEY);

    const schema = {
      description: "List of quiz questions",
      type: SchemaType.OBJECT,
      properties: {
        response_code: { type: SchemaType.NUMBER, nullable: false },
        results: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              type: { type: SchemaType.STRING, nullable: false },
              difficulty: { type: SchemaType.STRING, nullable: false },
              category: { type: SchemaType.STRING, nullable: false },
              question: { type: SchemaType.STRING, nullable: false },
              correct_answer: { type: SchemaType.STRING, nullable: false },
              incorrect_answers: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                nullable: false,
              },
            },
            required: [
              "type",
              "difficulty",
              "category",
              "question",
              "correct_answer",
              "incorrect_answers",
            ],
          },
          nullable: false,
        },
      },
      required: ["response_code", "results"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    try {
      const prompt = `
        Create ${questionCount} quiz questions about ${topic}
        Difficulty: ${difficulty}
        Type: Multiple Choice
      `;
      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
      });

      setQuestions(JSON.parse(result.response.text()));
      setStatus("ready");
    } catch (error) {
      console.error("Error generating quiz:", error);
      setErrorMessage(
        "There was an error generating the quiz. Please try again."
      );
      setStatus("start");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">
            AI Quiz Practice
          </h1>
          <p className="text-gray-600 text-lg">
            Generate custom quizzes on any topic using AI
          </p>
        </div>

        {/* Main Content */}
        <main className="ai-quiz-module">
          {status === "start" && (
            <StartScreen
              errorMessage={errorMessage}
              onStartQuiz={startQuiz}
            />
          )}
          {status === "loading" && <Loader />}
          {status === "ready" && questions && (
            <Quiz
              questions={questions.results}
              onStoreAnswer={storeAnswer}
              onEndQuiz={() => setStatus("finished")}
            />
          )}
          {status === "finished" && (
            <ResultScreen
              userAnswers={userAnswers}
              onRestartQuiz={restartQuiz}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default AIQuizModule;

