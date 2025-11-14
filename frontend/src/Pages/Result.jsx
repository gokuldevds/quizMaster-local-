import React from "react";
import { useLocation } from "react-router-dom";
import Footer from "../Components/Footer";

const Result = () => {
  const location = useLocation();
  const { quizTitle, totalScore, correct, incorrect, total, answers, timeTaken, autoSubmitted } = location.state || {};

  if (!location.state) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center">
        <p>No quiz results available. Please take a quiz first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-1">Quiz Results</h2>
        <p className="text-gray-500 mb-2">{quizTitle}</p>
        {autoSubmitted && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            ⏱️ Quiz was automatically submitted when time ran out.
          </div>
        )}
        {timeTaken && (
          <p className="text-sm text-gray-500 mb-8">
            Time taken: {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
          </p>
        )}

        {/* Score Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <h3 className="text-gray-500 text-sm mb-1">Total Score</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {totalScore}
              <span className="text-gray-400 text-lg font-medium">/100</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <h3 className="text-gray-500 text-sm mb-1">Correct Answers</h3>
            <p className="text-3xl font-bold text-green-600">
              {correct}
              <span className="text-gray-400 text-lg font-medium">/{total}</span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <h3 className="text-gray-500 text-sm mb-1">Incorrect Answers</h3>
            <p className="text-3xl font-bold text-red-600">
              {incorrect}
              <span className="text-gray-400 text-lg font-medium">/{total}</span>
            </p>
          </div>
        </div>



        {/* Detailed Breakdown */}
        <section>
          <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                <tr>
                  <th className="px-6 py-3">Question</th>
                  <th className="px-6 py-3">Your Answer</th>
                  <th className="px-6 py-3">Correct Answer</th>
                  <th className="px-6 py-3">Result</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-t ${item.isCorrect ? "bg-white" : "bg-red-50"}`}
                  >
                    <td className="px-6 py-4 text-gray-800">{item.question}</td>
                    <td className="px-6 py-4">{item.answer}</td>
                    <td className="px-6 py-4 text-gray-700">{item.correctAnswer || "-"}</td>
                    <td className="px-6 py-4">
                      {item.isCorrect ? (
                        <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                          Correct
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full">
                          Incorrect
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Result;
