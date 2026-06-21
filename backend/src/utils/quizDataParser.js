/** Normalize quizData — supports legacy array or { questions, practiceLab } object. */

function parseQuizData(quizData) {
  if (!quizData) {
    return { questions: [], practiceLab: null };
  }

  if (Array.isArray(quizData)) {
    return { questions: quizData, practiceLab: null };
  }

  if (typeof quizData === 'object') {
    return {
      questions: Array.isArray(quizData.questions) ? quizData.questions : [],
      practiceLab: quizData.practiceLab ?? null,
    };
  }

  return { questions: [], practiceLab: null };
}

function packQuizData(questions, practiceLab) {
  return {
    questions: questions || [],
    ...(practiceLab ? { practiceLab } : {}),
  };
}

module.exports = { parseQuizData, packQuizData };
