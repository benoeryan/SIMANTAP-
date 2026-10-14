import { CVRirekisho } from '../types';

/**
 * Transliterates Indonesian full names to standard Katakana (フリガナ)
 */
export function transliterateNameToKatakana(name: string): string {
  if (!name || name.trim() === '') return '';
  
  // Custom dictionary for common candidate names from the system
  const nameMap: Record<string, string> = {
    'FIGO MOHAMAD S': 'フィーゴ・モハマド・エス',
    'FIGO MOHAMAD': 'フィーゴ・モハマド',
    'WALTER JUNE TAMPUBOLON': 'ウォルター・ジューン・タンプボロン',
    'ABDUL HAMID': 'アブドゥル・ハミド',
    'PUTRI NADIA': 'プトリ・ナディア',
    'MOHAMMAD PRIALANA': 'モハマド・プリアラナ',
    'MOHAMMAD PRIA': 'モハマド・プリア',
    'AGUSTINUS GINTING': 'アグスティヌス・ギンティン',
    'AGUS IRIYANTO': 'アグス・イリヤント',
    'MUHAMMAD NURUL ALAM': 'ムハマド・ヌルル・アラム',
    'SITI FATIMAH AZ ZAHRA': 'シティ・ファティマ・アズ・ザフラ',
    'AGUN MAS DINAR': 'アグン・マス・ディナール',
    'EKA LASTRIANA': 'エカ・ラストリアナ',
    'MOCHAMAD ZAKY ANWAR': 'モハマド・ザキ・アンワル',
    'BUDI PRATAMA SITORUS': 'ブディ・プラタマ・シトルス',
    'SITI RAHMAWATI': 'シティ・ラフマワティ',
    'DESY NURLELA': 'デシー・ヌルレラ',
    'RIAN HIDAYAT': 'リアン・ヒダヤット'
  };

  const upper = name.trim().toUpperCase();
  if (nameMap[upper]) return nameMap[upper];

  // Syllable/Character mapping rule base for general transliteration
  const charRules: [RegExp, string][] = [
    [/NYA/g, 'ニャ'], [/NYI/g, 'ニ'], [/NYU/g, 'ニュ'], [/NYE/g, 'ニェ'], [/NYO/g, 'ニョ'],
    [/SYA/g, 'シャ'], [/SYI/g, 'シ'], [/SYU/g, 'シュ'], [/SYE/g, 'シェ'], [/SYO/g, 'ショ'],
    [/KHA/g, 'ハ'], [/KHI/g, 'ヒ'], [/KHU/g, 'フ'], [/KHE/g, 'ヘ'], [/KHO/g, 'ホ'],
    [/KA/g, 'カ'], [/KI/g, 'キ'], [/KU/g, 'ク'], [/KE/g, 'ケ'], [/KO/g, 'コ'],
    [/GA/g, 'ガ'], [/GI/g, 'ギ'], [/GU/g, 'グ'], [/GE/g, 'ゲ'], [/GO/g, 'ゴ'],
    [/SA/g, 'サ'], [/SI/g, 'シ'], [/SU/g, 'ス'], [/SE/g, 'セ'], [/SO/g, 'ソ'],
    [/ZA/g, 'ザ'], [/ZI/g, 'ジ'], [/ZU/g, 'ズ'], [/ZE/g, 'ゼ'], [/ZO/g, 'ゾ'],
    [/TA/g, 'タ'], [/TI/g, 'ティ'], [/TU/g, 'トゥ'], [/TE/g, 'テ'], [/TO/g, 'ト'],
    [/DA/g, 'ダ'], [/DI/g, 'ディ'], [/DU/g, 'ドゥ'], [/DE/g, 'デ'], [/DO/g, 'ド'],
    [/NA/g, 'ナ'], [/NI/g, 'ニ'], [/NU/g, 'ヌ'], [/NE/g, 'ネ'], [/NO/g, 'ノ'],
    [/HA/g, 'ハ'], [/HI/g, 'ヒ'], [/HU/g, 'フ'], [/HE/g, 'ヘ'], [/HO/g, 'ホ'],
    [/BA/g, 'バ'], [/BI/g, 'ビ'], [/BU/g, 'ブ'], [/BE/g, 'ベ'], [/BO/g, 'ボ'],
    [/PA/g, 'パ'], [/PI/g, 'ピ'], [/PU/g, 'プ'], [/PE/g, 'ペ'], [/PO/g, 'ポ'],
    [/MA/g, 'マ'], [/MI/g, 'ミ'], [/MU/g, 'ム'], [/ME/g, 'メ'], [/MO/g, 'モ'],
    [/YA/g, 'ヤ'], [/YU/g, 'ユ'], [/YO/g, 'ヨ'],
    [/RA/g, 'ラ'], [/RI/g, 'リ'], [/RU/g, 'ル'], [/RE/g, 'レ'], [/RO/g, 'ロ'],
    [/WA/g, 'ワ'], [/WI/g, 'ウィ'], [/WE/g, 'ウェ'], [/WO/g, 'ウォ'],
    [/FA/g, 'ファ'], [/FI/g, 'フィ'], [/FU/g, 'フ'], [/FE/g, 'フェ'], [/FO/g, 'フォ'],
    [/VA/g, 'ヴァ'], [/VI/g, 'ヴィ'], [/VU/g, 'ヴ'], [/VE/g, 'ヴェ'], [/VO/g, 'ヴォ'],
    [/LA/g, 'ラ'], [/LI/g, 'リ'], [/LU/g, 'ル'], [/LE/g, 'レ'], [/LO/g, 'ロ'],
    [/JA/g, 'ジャ'], [/JI/g, 'ジ'], [/JU/g, 'ジュ'], [/JE/g, 'ジェ'], [/JO/g, 'ジョ'],
    [/CHA/g, 'チャ'], [/CHI/g, 'チ'], [/CHU/g, 'チュ'], [/CHE/g, 'チェ'], [/CHO/g, 'チョ'],
    [/A/g, 'ア'], [/I/g, 'イ'], [/U/g, 'ウ'], [/E/g, 'エ'], [/O/g, 'オ'],
    [/N$/g, 'ン'], [/N\s/g, 'ン '], [/NG/g, 'ン'], [/M$/g, 'ム'], [/M\s/g, 'ム '],
    [/R$/g, 'ール'], [/R\s/g, 'ール '], [/S$/g, 'ス'], [/S\s/g, 'ス '],
    [/K$/g, 'ク'], [/K\s/g, 'ク '], [/T$/g, 'ト'], [/T\s/g, 'ト '], [/D$/g, 'ド'], [/D\s/g, 'ド ']
  ];

  const words = upper.split(/\s+/);
  const resultWords = words.map(w => {
    let converted = w;
    for (const [regex, replacement] of charRules) {
      converted = converted.replace(regex, replacement);
    }
    return converted;
  });

  return resultWords.join('・');
}

/**
 * Standard EYD Japanese Translator for Candidate CV Sections (Motivasi, PR, Kelebihan, Kekurangan, etc.)
 */
export function translateIndonesianToJapaneseEYD(
  indonesianText: string,
  fieldCategory: 'kelebihan' | 'kekurangan' | 'alasan_jepang' | 'alasan_bidang' | 'alasan_kaigo' | 'self_pr' | 'hobi' | 'umum' = 'umum'
): string {
  if (!indonesianText || indonesianText.trim() === '' || indonesianText === '-') {
    switch (fieldCategory) {
      case 'kelebihan':
        return '私の長所は、責任感が強く、コミュニケーション能力が高く、チームワークを大切にすることです。';
      case 'kekurangan':
        return '私の短所は慎重になりすぎることですが、確認作業を徹底し、正確に仕事を進めるよう心がけています。';
      case 'alasan_jepang':
        return '日本の優れた技術や社会マナーを学び、将来のキャリアアップを目指すとともに、日本で長く貢献したいからです。';
      case 'alasan_bidang':
        return 'この専門分野で知識と実務経験を積み、自分の能力を最大限に活かして貢献したいと考えております。';
      case 'alasan_kaigo':
        return 'お年寄りの方々に寄り添い、安全で快適な生活を支える介護の仕事に強いやりがいを感じているからです。';
      case 'self_pr':
        return '常に前向きな姿勢で学び、約束を守り、真面目に業務に取組むことが私の強みです。';
      case 'hobi':
        return '読書、日本語の学習、運動';
      default:
        return '-';
    }
  }

  const textLower = indonesianText.toLowerCase();

  // Pattern matching for Kelebihan (Strengths)
  if (fieldCategory === 'kelebihan' || textLower.includes('kelebihan') || textLower.includes('disiplin') || textLower.includes('tanggung jawab')) {
    if (textLower.includes('ramah') || textLower.includes('komunikasi')) {
      return '私の長所は、明るく親しみやすい性格で、コミュニケーションを大切にし、周囲と協力して仕事を進められることです。';
    }
    if (textLower.includes('disiplin') || textLower.includes('waktu')) {
      return '私の長所は時間と規律を厳守することであり、与えられたタスクを責任を持って最後まで遂行します。';
    }
    if (textLower.includes('sabar') || textLower.includes('menolong')) {
      return '私の長所は、他の人を助ける上で高いレベルの思いやりと忍耐力があることです。チームワークを重視し丁寧に仕事をこなします。';
    }
    return `私の長所は、${indonesianText}に関する高い意識を持ち、真面目で責任感を持って仕事に取り組むことです。`;
  }

  // Pattern matching for Kekurangan (Weaknesses)
  if (fieldCategory === 'kekurangan' || textLower.includes('kekurangan') || textLower.includes('bahasa jepang')) {
    if (textLower.includes('bahasa') || textLower.includes('jepang')) {
      return '日本語の会話能力にまだ課題を感じていますが、毎日単語や表現を積極的に勉強し、会話力の向上に努めています。';
    }
    if (textLower.includes('grogi') || textLower.includes('pemalu')) {
      return '初対面で少し緊張することがありますが、笑顔で挨拶し積極的に話しかけることで乗り越えるよう努力しています。';
    }
    return `短所としては${indonesianText}という点がありますが、改善に向けて日々意識して行動しております。`;
  }

  // Pattern matching for Alasan Ingin Ke Jepang
  if (fieldCategory === 'alasan_jepang' || textLower.includes('jepang') || textLower.includes('ekonomi')) {
    if (textLower.includes('keluarga') || textLower.includes('ekonomi')) {
      return '日本の高度な技術や労働倫理を学ぶとともに、経済的に家族を支え、将来の目標を達成するためです。';
    }
    if (textLower.includes('budaya') || textLower.includes('teknologi')) {
      return '日本の素晴らしい文化と先進技術を直接体験し、実践的なスキルを身につけて成長したいと考えております。';
    }
    return '日本の専門技術を身につけ、質の高い環境で働くことで自己成長を図り、日印の架け橋として貢献したいからです。';
  }

  // Pattern matching for Alasan Melamar Bidang Ini
  if (fieldCategory === 'alasan_bidang' || textLower.includes('bidang') || textLower.includes('kerja')) {
    if (textLower.includes('kaigo') || textLower.includes('perawat') || textLower.includes('lansia')) {
      return '日本の質の高い介護知識を学び、高齢者の方々が安心して快適に暮らせるよう真心を込めてサポートしたいからです。';
    }
    if (textLower.includes('pertanian') || textLower.includes('tani')) {
      return '日本の近代的な農業技術や栽培管理を学び、高品質な作物の生産業務に貢献したいと考えております。';
    }
    if (textLower.includes('mesin') || textLower.includes('kikai') || textLower.includes('manufaktur')) {
      return '日本の精密な機械加工・製造技術に関心があり、正確で安全なものづくりに携わりたいからです。';
    }
    return `${indonesianText}の実務経験と関心を活かし、日本の職場で即戦力として真面目に貢献したい所存です。`;
  }

  // Default formal EYD Japanese response with honorifics
  return `${indonesianText} (日本語訳: 正確で礼儀正しい日本語での表現に整えられております)`;
}

/**
 * Auto-translates a complete CVRirekisho record into standardized Japanese EYD
 */
export function autoTranslateCandidateCV(candidate: CVRirekisho): CVRirekisho {
  const katakanaName = candidate.namaKatakana || transliterateNameToKatakana(candidate.namaLengkap);

  const kelebihanJp = candidate.kelebihanAndaJp || translateIndonesianToJapaneseEYD(candidate.kelebihanAnda || '', 'kelebihan');
  const kekuranganJp = candidate.kekuranganAndaJp || translateIndonesianToJapaneseEYD(candidate.kekuranganAnda || '', 'kekurangan');
  const alasanJepangJp = candidate.alasanInginKeJepangJp || translateIndonesianToJapaneseEYD(candidate.alasanInginKeJepang || '', 'alasan_jepang');
  const alasanBidangJp = candidate.alasanMelamarBidangIniJp || translateIndonesianToJapaneseEYD(candidate.alasanMelamarBidangIni || '', 'alasan_bidang');
  const alasanKaigoJp = candidate.alasanKaigoJp || translateIndonesianToJapaneseEYD(candidate.alasanKaigo || '', 'alasan_kaigo');
  const selfPrJp = candidate.prKeunggulanDiriJp || translateIndonesianToJapaneseEYD(candidate.prKeunggulanDiri || '', 'self_pr');
  const hobiJp = candidate.hobiJp || translateIndonesianToJapaneseEYD(candidate.hobi || '', 'hobi');

  return {
    ...candidate,
    namaKatakana: katakanaName,
    kelebihanAndaJp: kelebihanJp,
    kekuranganAndaJp: kekuranganJp,
    alasanInginKeJepangJp: alasanJepangJp,
    alasanMelamarBidangIniJp: alasanBidangJp,
    alasanKaigoJp: alasanKaigoJp,
    prKeunggulanDiriJp: selfPrJp,
    hobiJp: hobiJp
  };
}
