import { AppLanguage } from '../i18n/ecosystem-i18n';

/**
 * Translations for Marketing Campaigns, Channels, Sources, Sectors, and Pipeline Stages
 */

// 1. Campaign Name Translation Dictionary
const CAMPAIGN_NAME_MAP: Record<string, { id: string; ja: string }> = {
  'Instagram Ads: Pendaftaran Kelas Kaigo & Pengolahan Makanan Batch 18': {
    id: 'Instagram Ads: Pendaftaran Kelas Kaigo & Pengolahan Makanan Batch 18',
    ja: 'Instagram広告：介護・食品加工第18期生募集'
  },
  'TikTok Live Edukasi & Konsultasi Kerja Jepang Setiap Malam Minggu': {
    id: 'TikTok Live Edukasi & Konsultasi Kerja Jepang Setiap Malam Minggu',
    ja: 'TikTok Live：毎週土曜夜 日本就労相談＆教育ライブ配信'
  },
  'Sosialisasi Tatap Muka SMK Negeri & Swasta Mitra Kab. Bandung': {
    id: 'Sosialisasi Tatap Muka SMK Negeri & Swasta Mitra Kab. Bandung',
    ja: '対面説明会：バンドン県内提携公立・私立高校訪問'
  },
  'Job Fair Karir Tokutei Ginou & Magang Jepang Bandung Raya': {
    id: 'Job Fair Karir Tokutei Ginou & Magang Jepang Bandung Raya',
    ja: '合同就職説明会：バンドン広域 特定技能＆技能実習フェア'
  },
  'Webinar Nasional: Kupas Tuntas Peluang Kerja Gaji 20-30 Juta di Jepang': {
    id: 'Webinar Nasional: Kupas Tuntas Peluang Kerja Gaji 20-30 Juta di Jepang',
    ja: '全国ウェビナー：月給20〜30万円 日本就職のチャンス徹底解説'
  }
};

// 2. Target Audience Translation Dictionary
const TARGET_AUDIENCE_MAP: Record<string, { id: string; ja: string }> = {
  'Usia 18-28 Thn se-Jawa Barat & Jawa Tengah': {
    id: 'Usia 18-28 Thn se-Jawa Barat & Jawa Tengah',
    ja: '西ジャワ・中部ジャワ州 18〜28歳'
  },
  'Followers TikTok Official LPK IJEF & FYP Organik': {
    id: 'Followers TikTok Official LPK IJEF & FYP Organik',
    ja: '公式TikTokフォロワー＆おすすめ(FYP)ユーザー'
  },
  'Siswa Kelas XII & Fresh Graduate SMK Mitra': {
    id: 'Siswa Kelas XII & Fresh Graduate SMK Mitra',
    ja: '提携高校3年生＆新卒者'
  },
  'Pencari Kerja Usia Produktif': {
    id: 'Pencari Kerja Usia Produktif',
    ja: '生産年齢の求職者・既卒者'
  },
  'Peserta Seluruh Indonesia via Zoom & YouTube': {
    id: 'Peserta Seluruh Indonesia via Zoom & YouTube',
    ja: 'Zoom＆YouTube配信 全国参加者'
  },
  'Calon Siswa Potensial': {
    id: 'Calon Siswa Potensial',
    ja: '潜在的な見込み生徒'
  },
  'Alumni SMK Kesehatan, Jabar & Jateng': {
    id: 'Alumni SMK Kesehatan, Jabar & Jateng',
    ja: '看護・医療系高校卒業生（西ジャワ・中部ジャワ）'
  }
};

// 3. Campaign Notes Translation Dictionary
const CAMPAIGN_NOTES_MAP: Record<string, { id: string; ja: string }> = {
  'Konversi tertinggi dari target alumni SMK Keperawatan & Boga.': {
    id: 'Konversi tertinggi dari target alumni SMK Keperawatan & Boga.',
    ja: '看護・調理系専門高校の卒業生からの成約率が最も高い。'
  },
  'Live interaktif tanya jawab gaji & simulasi dana talangan.': {
    id: 'Live interaktif tanya jawab gaji & simulasi dana talangan.',
    ja: '給与や立替金シミュレーションに関する双方向Q&A。'
  },
  'MOU Penyaluran Lulusan Langsung ke Pelatihan Bahasa Jepang LPK IJEF.': {
    id: 'MOU Penyaluran Lulusan Langsung ke Pelatihan Bahasa Jepang LPK IJEF.',
    ja: '卒業生をLPK日本語研修へ直接受け入れるMOUを締結。'
  },
  'Booth utama LPK IJEF dengan presentasi video alumni di Jepang.': {
    id: 'Booth utama LPK IJEF dengan presentasi video alumni di Jepang.',
    ja: '日本で働く卒業生の動画プレゼンを実施するメインブース。'
  },
  'Pemateri Sensei native & Alumni LPK IJEF yang sedang bekerja di Osaka.': {
    id: 'Pemateri Sensei native & Alumni LPK IJEF yang sedang bekerja di Osaka.',
    ja: '日本人講師および大阪で勤務中の卒業生による講演。'
  }
};

// 4. Locations
const LOCATION_MAP: Record<string, { id: string; ja: string }> = {
  'Auditorium SMK Negeri 1 Katapang & SMK 2 Soreang': {
    id: 'Auditorium SMK Negeri 1 Katapang & SMK 2 Soreang',
    ja: 'SMKN 1 カタパン＆SMK 2 ソレアン講堂'
  },
  'Graha Tirta Siliwangi Bandung': {
    id: 'Graha Tirta Siliwangi Bandung',
    ja: 'グラハ・ティルタ・シリワンギ バンドン'
  }
};

export function translateCampaignName(name: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!name) return '';
  if (CAMPAIGN_NAME_MAP[name]) {
    return CAMPAIGN_NAME_MAP[name][lang] || name;
  }
  return name;
}

export function translateTargetAudience(target: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!target) return '';
  if (TARGET_AUDIENCE_MAP[target]) {
    return TARGET_AUDIENCE_MAP[target][lang] || target;
  }
  return target;
}

export function translateCampaignNotes(notes: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!notes) return '';
  if (CAMPAIGN_NOTES_MAP[notes]) {
    return CAMPAIGN_NOTES_MAP[notes][lang] || notes;
  }
  return notes;
}

export function translateCampaignLocation(loc: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!loc) return '';
  if (LOCATION_MAP[loc]) {
    return LOCATION_MAP[loc][lang] || loc;
  }
  return loc;
}

export function translateCampaignChannel(channel: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!channel) return '';
  if (lang === 'ja') {
    switch (channel) {
      case 'Instagram Ads': return 'Instagram広告';
      case 'TikTok Ads': return 'TikTok広告';
      case 'Sosialisasi SMK / SMA':
      case 'Event SMK/Kampus': return '高校・専門校訪問説明会';
      case 'Audiensi & Roadshow Kampus':
      case 'Audiensi Kampus / Universitas': return '大学・高専訪問＆ロードショー';
      case 'Meeting & Kemitraan Lembaga / BLK':
      case 'Meeting Lembaga / BLK': return '公的訓練機関・労働局・提携面談';
      case 'Meeting Appointment B2B / Kemitraan':
      case 'Meeting Appointment': return '提携・B2Bミーティング面談';
      case 'Webinar Online': return 'オンライン説明会 (Webinar)';
      case 'Brosur & Spanduk': return 'チラシ・横断幕';
      case 'Job Fair': return '合同就職説明会 (Job Fair)';
      default: return channel;
    }
  }
  return channel;
}

export function translateCampaignStatus(status: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!status) return '';
  if (lang === 'ja') {
    switch (status) {
      case 'BERJALAN': return '実施中';
      case 'TERJADWAL': return '予定';
      case 'SELESAI': return '完了';
      case 'MOU_SEPAKAT': return 'MOU合意・締結';
      case 'SOSIALISASI_SUKSES': return '説明会成功完了';
      case 'PERLU_FOLLOW_UP': return '要フォローアップ';
      case 'DITUNDA': return '延期 / 日程調整中';
      default: return status;
    }
  }
  switch (status) {
    case 'MOU_SEPAKAT': return 'MOU Disepakati';
    case 'SOSIALISASI_SUKSES': return 'Sosialisasi Sukses';
    case 'PERLU_FOLLOW_UP': return 'Perlu Follow-Up';
    case 'DITUNDA': return 'Ditunda / Reschedule';
    default: return status;
  }
}

export function translateInstitutionType(type: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!type) return '';
  if (lang === 'ja') {
    switch (type) {
      case 'SMK/SMA': return '高校・専門高校 (SMK/SMA)';
      case 'Kampus/Universitas': return '大学・短期大学・高専 (Kampus)';
      case 'Lembaga/BLK/Disnaker': return '公的職業訓練校・労働局 (BLK/Disnaker)';
      case 'Yayasan/Komunitas': return '教育財団・コミュニティ';
      case 'Perusahaan Mitra': return '提携企業・法人';
      default: return type;
    }
  }
  return type;
}

export function translatePipelineStage(stage: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!stage) return '';
  if (lang === 'ja') {
    switch (stage) {
      case 'LEAD_BARU': return '新規リード (受付)';
      case 'KONTAK_AWAL': return '初回コンタクト (WA)';
      case 'KONSULTASI_LPK': return 'カウンセリング・相談';
      case 'FOLLOW_UP': return '集中フォローアップ';
      case 'DEAL_TERDAFTAR': return '成約 (登録・連携完了)';
      case 'LOST_BATAL': return '辞退 / 保留';
      default: return stage;
    }
  }
  switch (stage) {
    case 'LEAD_BARU': return 'Lead Baru';
    case 'KONTAK_AWAL': return 'Kontak Awal';
    case 'KONSULTASI_LPK': return 'Konseling / Edukasi';
    case 'FOLLOW_UP': return 'Follow Up Intensif';
    case 'DEAL_TERDAFTAR': return 'Closing (Terdaftar)';
    case 'LOST_BATAL': return 'Batal / Tertunda';
    default: return stage;
  }
}

export function translateLeadSource(source: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!source) return '';
  if (lang === 'ja') {
    switch (source) {
      case 'Instagram Ads': return 'Instagram広告';
      case 'TikTok Official IJEF':
      case 'TikTok Ads':
      case 'TikTok / Reels': return 'TikTok公式 / 広告';
      case 'Referral Alumni / Teman':
      case 'Referral Alumni / Siswa': return '卒業生・知人紹介';
      case 'Sosialisasi SMK / SMA':
      case 'Event SMK / Kampus':
      case 'Event SMK/Kampus': return '高校・専門校訪問説明会';
      case 'Audiensi & Roadshow Kampus': return '大学・高専訪問＆ロードショー';
      case 'Meeting & Kemitraan Lembaga / BLK': return '公的訓練機関・労働局・提携面談';
      case 'Meeting Appointment B2B / Kemitraan': return '提携・B2Bミーティング面談';
      case 'Website / Google Search':
      case 'Website Resmi IJEF':
      case 'Website IJEF Corp': return 'Webサイト / Google検索';
      case 'Job Fair Bandung':
      case 'Job Fair Kampus/SMK':
      case 'Job Fair': return '就職説明会 (Job Fair)';
      case 'WhatsApp CS Inbound':
      case 'WhatsApp Blast / Organik': return '公式WhatsApp問い合わせ';
      case 'Mitra LPK Daerah': return '提携地方送り出し機関 (LPK)';
      case 'Walk-in / Datang Langsung':
      case 'Walk-in Kantor LPK': return 'オフィス直接来校';
      case 'Brosur & Spanduk':
      case 'Brosur / Event Offline': return 'チラシ・現地配布物';
      case 'Webinar Online': return 'オンライン説明会 (Webinar)';
      case 'Lainnya': return 'その他';
      default: return source;
    }
  }
  return source;
}

export function translateJobSector(sector: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!sector) return '';
  if (lang === 'ja') {
    if (sector.includes('Irodori') || sector.includes('irodory') || sector.includes('Irodory')) {
      return '日本語学習（いろどり・生活会話 A1/A2）';
    }
    if (sector.includes('Minna no Nihongo')) {
      return '日本語学習（みんなの日本語・初級 N5/N4）';
    }
    if (sector.includes('Kelas Bahasa') || sector.includes('Kelas Reguler') || sector.includes('Belum Menentukan')) {
      return '日本語総合準備クラス（分野未定・研修中）';
    }
    if (sector.includes('Persiapan Tokutei Ginou') || sector.includes('Penentuan Bidang')) {
      return '特定技能総合準備（分野選定中）';
    }
    if (sector.includes('Program Bahasa Jepang Intensif') || sector.includes('Asrama Offline')) {
      return '集中日本語・生活研修（寮生コース）';
    }
    if (sector.includes('Program Bahasa Jepang Online') || sector.includes('Online')) {
      return 'オンライン日本語研修コース';
    }
    if (sector.includes('Kaigo') || sector.includes('Caregiver') || sector.includes('Perawat')) {
      return '介護 (高齢者介護・福祉)';
    }
    if (sector.includes('Pengolahan Makanan') || sector.includes('Food Processing') || sector.includes('Boga')) {
      return '飲食料品製造・食品加工';
    }
    if (sector.includes('Pertanian') || sector.includes('Nogyo') || sector.includes('Greenhouse') || sector.includes('Agriculture')) {
      return '農業 (栽培・施設園芸)';
    }
    if (sector.includes('Konstruksi') || sector.includes('Alat Berat') || sector.includes('Bangunan')) {
      return '建設・土木・重機';
    }
    if (sector.includes('Engineering') || sector.includes('IT') || sector.includes('Gijinkoku')) {
      return 'エンジニア・技術職 (技人国)';
    }
    if (sector.includes('Manufaktur') || sector.includes('Pabrik') || sector.includes('Permesinan') || sector.includes('Machining')) {
      return '製造業・工場・機械加工';
    }
    if (sector.includes('Pengelasan') || sector.includes('Welding')) {
      return '溶接・製缶';
    }
    if (sector.includes('Restoran') || sector.includes('Food Service')) {
      return '外食業・飲食サービス';
    }
    if (sector.includes('Perhotelan') || sector.includes('Hospitality')) {
      return '宿泊業・ホテル・旅館';
    }
    if (sector.includes('Pembersihan Gedung') || sector.includes('Building Cleaning')) {
      return 'ビルクリーニング';
    }
    if (sector.includes('Peternakan') || sector.includes('Livestock')) {
      return '畜産業';
    }
    if (sector.includes('Lainnya')) {
      return 'その他';
    }
    return sector;
  }
  return sector;
}

export function translateMarketingRole(role: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!role) return '';
  if (lang === 'ja') {
    if (role.includes('Manager') || role.includes('Head')) return 'マーケティング責任者 / 部長';
    if (role.includes('Digital Marketer')) return 'デジタルマーケター';
    if (role.includes('Field Acquisition')) return 'フィールド開拓・推進';
    if (role.includes('Telemarketer')) return 'テレマーケター / 相談員';
    if (role.includes('Counselor')) return '就労カウンセラー';
    return role;
  }
  return role;
}

export function translateFollowUpMethod(method: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!method) return '';
  if (lang === 'ja') {
    switch (method.toUpperCase()) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'TELEPON': return '電話相談';
      case 'TATAP_MUKA_LPK':
      case 'TATAP MUKA / VISIT': return '対面・来校面談';
      case 'ZOOM':
      case 'ZOOM KONSULTASI': return 'Zoom面談';
      case 'EMAIL': return 'Eメール';
      default: return method;
    }
  }
  switch (method.toUpperCase()) {
    case 'WHATSAPP': return 'WhatsApp';
    case 'TELEPON': return 'Telepon';
    case 'TATAP_MUKA_LPK':
    case 'TATAP MUKA / VISIT': return 'Tatap Muka / Visit';
    case 'ZOOM':
    case 'ZOOM KONSULTASI': return 'Zoom Konsultasi';
    case 'EMAIL': return 'Email';
    default: return method;
  }
}

export function formatMarketingDate(dateStr: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!dateStr) return '';
  if (lang === 'ja') {
    // Expected formats: YYYY-MM-DD or YYYY-MM-DD HH:mm
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      const timePart = dateStr.includes(' ') ? ' ' + dateStr.split(' ')[1] : '';
      return `${year}年${month}月${day}日${timePart}`;
    }
  }
  return dateStr;
}

export function formatMarketingDateRange(start: string, end: string, lang: AppLanguage = 'id'): string {
  const fStart = formatMarketingDate(start, lang);
  const fEnd = formatMarketingDate(end, lang);
  return lang === 'ja' ? `${fStart} 〜 ${fEnd}` : `${start} s/d ${end}`;
}

export function translateCandidateCategory(category: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!category) return '';
  if (lang === 'ja') {
    switch (category) {
      case 'SISWA IJEF - Offline': return 'IJEF生 - 通学・入寮 (Offline)';
      case 'SISWA IJEF - Online': return 'IJEF生 - オンライン (Online)';
      case 'MATCHING JOB - Engineering / Gijinkoku': return '求人マッチング - 技術・人文・国際業務 (技人国)';
      case 'MATCHING JOB - Ex-Magang / Ex-Trainee': return '求人マッチング - 元実習生 (技能実習修了者)';
      case 'SISWA NON IJEF (New Comer)': return '一般応募生 (New Comer)';
      case 'SISWA MITRA / NON IJEF': return '提携校・外部生徒 (Mitra)';
      default: return category;
    }
  }
  return category;
}

export function translateReligion(religion: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!religion) return '';
  if (lang === 'ja') {
    switch (religion) {
      case 'Islam': return 'イスラム教';
      case 'Kristen': return 'キリスト教';
      case 'Katolik': return 'カトリック';
      case 'Hindu': return 'ヒンドゥー教';
      case 'Buddha': return '仏教';
      case 'Konghucu': return '儒教';
      default: return religion;
    }
  }
  return religion;
}

export function translateGender(gender: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!gender) return '';
  if (lang === 'ja') {
    switch (gender) {
      case 'Laki-laki': return '男性';
      case 'Perempuan': return '女性';
      default: return gender;
    }
  }
  return gender;
}

export function translateJapaneseLevel(level: string | undefined | null, lang: AppLanguage = 'id'): string {
  if (!level) return '';
  if (lang === 'ja') {
    if (level.includes('Belum Pernah') || level.includes('Pemula')) return '未学習 (入門・N5準備)';
    if (level.includes('Belajar Mandiri')) return '独学経験あり (文字・基礎)';
    if (level.includes('JLPT N1')) return 'JLPT N1 取得';
    if (level.includes('JLPT N2')) return 'JLPT N2 取得';
    if (level.includes('JLPT N3')) return 'JLPT N3 取得';
    if (level.includes('JLPT N4')) return 'JLPT N4 取得';
    if (level.includes('JLPT N5') || level.includes('JFT')) return 'JLPT N5 / JFT-Basic 取得';
    if (level.includes('Ex-Japan') || level.includes('Ex-Kenshusei')) return '実習生修了生 (元技能実習)';
    return level;
  }
  return level;
}

