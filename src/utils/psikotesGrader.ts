import { PSIKOTES_QUESTIONS } from '../data/psikotesQuestions';

export interface PsikotesGradeResult {
  totalCorrect: number;
  totalQuestions: number;
  scorePercentage: number;
  statusKelulusan: 'LULUS' | 'TIDAK LULUS';
  categoryBreakdown: {
    analogiKata: number; // Max 15
    logikaMatematika: number; // Max 15
    penalaranVerbal: number; // Max 10
    penalaranSpasial: number; // Max 10
  };
}

export function gradePsikotes(userAnswers: Record<number, string>): PsikotesGradeResult {
  let totalCorrect = 0;
  let analogiKataCorrect = 0;
  let logikaMatematikaCorrect = 0;
  let penalaranVerbalCorrect = 0;
  let penalaranSpasialCorrect = 0;

  PSIKOTES_QUESTIONS.forEach((q) => {
    const userChoice = userAnswers[q.id];
    if (userChoice && userChoice === q.correctAnswer) {
      totalCorrect++;

      if (q.category === 'Analogi Kata') analogiKataCorrect++;
      else if (q.category === 'Logika Matematika') logikaMatematikaCorrect++;
      else if (q.category === 'Penalaran Verbal') penalaranVerbalCorrect++;
      else if (q.category === 'Penalaran Spasial & Abstrak') penalaranSpasialCorrect++;
    }
  });

  const totalQuestions = PSIKOTES_QUESTIONS.length; // 50
  const scorePercentage = Math.round((totalCorrect / totalQuestions) * 100);
  const statusKelulusan = totalCorrect >= 30 ? 'LULUS' : 'TIDAK LULUS';

  return {
    totalCorrect,
    totalQuestions,
    scorePercentage,
    statusKelulusan,
    categoryBreakdown: {
      analogiKata: analogiKataCorrect,
      logikaMatematika: logikaMatematikaCorrect,
      penalaranVerbal: penalaranVerbalCorrect,
      penalaranSpasial: penalaranSpasialCorrect
    }
  };
}
