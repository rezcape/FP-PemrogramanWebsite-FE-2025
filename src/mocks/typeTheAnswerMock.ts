// Mock data untuk testing game tanpa backend
export const mockTypeTheAnswerGame = {
  id: "mock-game-123",
  name: "Matematika Quiz",
  description: "Test your math skills!",
  thumbnail_image: null,
  background_image: null,
  is_published: true,
  time_limit_seconds: 180,
  score_per_question: 10,
  questions: [
    {
      question_text: "Berapa hasil dari 5 + 3?",
      correct_answer: "8",
      question_index: 1,
    },
    {
      question_text: "Berapa hasil dari 10 - 4?",
      correct_answer: "6",
      question_index: 2,
    },
    {
      question_text: "Berapa hasil dari 2 x 6?",
      correct_answer: "12",
      question_index: 3,
    },
    {
      question_text: "Berapa hasil dari 15 ÷ 3?",
      correct_answer: "5",
      question_index: 4,
    },
    {
      question_text: "Berapa hasil dari 7 + 8?",
      correct_answer: "15",
      question_index: 5,
    },
  ],
};

// Function to check answers (mock backend logic)
export const mockCheckAnswers = (
  userAnswers: { question_index: number; user_answer: string }[],
) => {
  let correctCount = 0;

  userAnswers.forEach((userAns) => {
    const question = mockTypeTheAnswerGame.questions.find(
      (q) => q.question_index === userAns.question_index,
    );

    if (
      question &&
      userAns.user_answer.toLowerCase().trim() ===
        question.correct_answer.toLowerCase().trim()
    ) {
      correctCount++;
    }
  });

  const totalQuestions = mockTypeTheAnswerGame.questions.length;
  const score = correctCount * mockTypeTheAnswerGame.score_per_question;
  const maxScore = totalQuestions * mockTypeTheAnswerGame.score_per_question;
  const percentage = (correctCount / totalQuestions) * 100;

  return {
    correct_answers: correctCount,
    total_questions: totalQuestions,
    max_score: maxScore,
    score: score,
    percentage: Math.round(percentage),
  };
};
