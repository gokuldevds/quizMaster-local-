function ResultScreen({ userAnswers, onRestartQuiz }) {
  const correctAnswersCount = userAnswers.filter(
    (answer) => answer.userAnswer === answer.question.correct_answer
  ).length;

  const percentage = Math.round((correctAnswersCount / userAnswers.length) * 100);

  return (
    <section className="result-screen bg-white rounded-2xl shadow-lg p-8 md:p-12">
      <div className="text-center mb-10">
        {correctAnswersCount === userAnswers.length ? (
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-600 mb-3">
              Perfect Score!
            </h1>
          </div>
        ) : (
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 mb-3">
              Quiz Completed!
            </h1>
          </div>
        )}
        
        <div className="inline-block bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl px-8 py-4 mb-4">
          <p className="text-5xl font-extrabold text-indigo-700 mb-1">{percentage}%</p>
          <p className="text-gray-600 text-lg">
            <span className="font-semibold text-indigo-600">{correctAnswersCount}</span> out of{" "}
            <span className="font-semibold text-indigo-600">{userAnswers.length}</span> questions correct
          </p>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {userAnswers.map((answer, index) => {
          const isCorrect = answer.userAnswer === answer.question.correct_answer;
          return (
            <div
              key={index}
              className={`border-2 rounded-xl p-5 transition-all ${
                isCorrect 
                  ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100" 
                  : "border-red-300 bg-gradient-to-br from-red-50 to-red-100"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl flex-shrink-0">{isCorrect ? "✅" : "❌"}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg mb-2">
                    {answer.question.question}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-gray-700">
                      <span className="font-semibold">Your answer: </span>
                      <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                        {answer.userAnswer}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Correct answer: </span>
                        <span className="text-green-700">
                          {answer.question.correct_answer}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={onRestartQuiz}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          Create a New Quiz
        </button>
      </div>
    </section>
  );
}

export default ResultScreen;

