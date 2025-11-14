import { useState, useMemo } from "react";

function Quiz({ questions, onStoreAnswer, onEndQuiz }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const shuffledOptions = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const options = [...questions[currentQuestion].incorrect_answers];
    const randomIndex = Math.floor(Math.random() * (options.length + 1));
    options.splice(randomIndex, 0, questions[currentQuestion].correct_answer);
    return options;
  }, [currentQuestion, questions]);

  const submitAnswer = () => {
    onStoreAnswer({
      question: questions[currentQuestion],
      userAnswer: selectedOption,
    });
    setSelectedOption(null);

    if (currentQuestion === questions.length - 1) {
      setCurrentQuestion(0);
      onEndQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <p className="text-gray-500">Loading questions...</p>
      </div>
    );
  }

  return (
    <section className="quiz">
      <div className="header">
        <h2>Quiz</h2>
        <p>
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </div>

      <progress
        max="100"
        value={((currentQuestion + 1) / questions.length) * 100}
      />

      <div className="question">
        <h3>{questions[currentQuestion].question}</h3>
      </div>

      <div className="answers">
        {shuffledOptions.map((answer) => (
          <button
            key={answer}
            className={`answer ${selectedOption === answer ? "active" : ""}`}
            onClick={() => setSelectedOption(answer)}
          >
            {answer}
          </button>
        ))}
      </div>

      {selectedOption && (
        <button onClick={submitAnswer} className="mt-4">
          Next Question →
        </button>
      )}
    </section>
  );
}

export default Quiz;

