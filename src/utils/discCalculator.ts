import { DISC_QUESTIONS } from '../data/discQuestions';

export interface DiscResult {
  scoreD: number;
  scoreI: number;
  scoreS: number;
  scoreC: number;
  dominantType: 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance';
  secondaryType: 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance' | 'None';
  description: string;
  recommendedRoles: string[];
}

export function calculateDiscResult(userAnswers: Record<number, { most: string; least: string }>): DiscResult {
  let countD = 0;
  let countI = 0;
  let countS = 0;
  let countC = 0;

  DISC_QUESTIONS.forEach((qSet) => {
    const userAns = userAnswers[qSet.setNumber];
    if (userAns) {
      if (userAns.most) {
        const choice = qSet.choices.find((c) => c.id === userAns.most);
        if (choice) {
          if (choice.mostTrait === 'D') countD++;
          if (choice.mostTrait === 'I') countI++;
          if (choice.mostTrait === 'S') countS++;
          if (choice.mostTrait === 'C') countC++;
        }
      }
    }
  });

  const scores = [
    { type: 'Dominance' as const, val: countD },
    { type: 'Influence' as const, val: countI },
    { type: 'Steadiness' as const, val: countS },
    { type: 'Compliance' as const, val: countC }
  ];

  scores.sort((a, b) => b.val - a.val);

  const dominantType = scores[0].type;
  const secondaryType = scores[1].val > 0 ? scores[1].type : 'None';

  let description = '';
  let recommendedRoles: string[] = [];

  switch (dominantType) {
    case 'Dominance':
      description = 'Tipe Dominance (D) berfokus pada hasil, pencapaian target tinggi, tegas dalam mengambil keputusan, berani mengambil risiko, serta memiliki jiwa kepemimpinan yang berorientasi pada tantangan.';
      recommendedRoles = ['Leader / Supervisor Tim', 'Technical Specialist', 'Project Manager Pelatihan', 'Manufaktur & Alat Berat'];
      break;
    case 'Influence':
      description = 'Tipe Influence (I) berfokus pada hubungan antarmanusia, komunikatif, persuasif, antusias, mudah beradaptasi, dan sangat efektif dalam membangun jejaring sosial dan komunikasi antar budaya.';
      recommendedRoles = ['Public Relations / Humas', 'Job Matching Officer', 'Customer Service Pelatihan', 'Pemandu / Translator'];
      break;
    case 'Steadiness':
      description = 'Tipe Steadiness (S) berfokus pada kerja sama, kesabaran, loyalitas tinggi, konsisten dalam menjalankan prosedur kerja, serta menjadi penyeimbang keharmonisan dalam tim.';
      recommendedRoles = ['Administrasi LPK', 'Operator Produksi Presisi', 'Quality Control', 'Pelayanan & Caregiver'];
      break;
    case 'Compliance':
      description = 'Tipe Compliance (C) berfokus pada kualitas, ketelitian, kepatuhan pada standar operasional (SOP), analisa logis, dan memastikan setiap instruksi diselesaikan dengan tingkat akurasi presisi tinggi.';
      recommendedRoles = ['Auditor Mutu LPK', 'Drafter & Teknisi Presisi', 'Finance & Accounting', 'Teknisi Pabrikasi'];
      break;
  }

  return {
    scoreD: countD,
    scoreI: countI,
    scoreS: countS,
    scoreC: countC,
    dominantType,
    secondaryType,
    description,
    recommendedRoles
  };
}
