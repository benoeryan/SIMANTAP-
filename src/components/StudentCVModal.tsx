import React, { useState, useEffect } from 'react';
import { CalonSiswa, HasilKesehatan, AsesmenDisc, AsesmenPsikotes, CVRirekisho } from '../types';
import { JapaneseCVSheet } from './JapaneseCVSheet';
import { CandidateDocumentUploadSection } from './cvportal/CandidateDocumentUploadSection';
import { useApp } from '../context/AppContext';
import { getStudentPhotoUrl, handleStudentImageError } from '../utils/studentPhotoHelper';
import { calculateAgeFromBirthDate } from '../utils/candidateUtils';
import {
  X,
  User,
  HeartPulse,
  Brain,
  Award,
  FileText,
  Printer,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Clock,
  Video,
  ChevronRight,
  Briefcase,
  ArrowLeft,
  ZoomIn,
  FolderOpen,
  Languages,
  Play,
  ShieldCheck,
  Globe,
  AlertCircle
} from 'lucide-react';

export interface StudentCVModalProps {
  student: CalonSiswa;
  healthRecord?: HasilKesehatan;
  discRecord?: AsesmenDisc;
  psikotesRecord?: AsesmenPsikotes;
  rirekishoRecord?: CVRirekisho;
  onClose: () => void;
  portalContext?: 'ADMIN_1' | 'ADMIN_2' | 'MITRA';
  initialMode?: 'JIKOSHOUKAI' | 'CV' | 'ASSESSMENT' | 'DOKUMEN';
}

// ----------------------------------------------------
// Translation & Localization Helper Dictionaries
// ----------------------------------------------------

const translateBidang = (val?: string, lang: 'id' | 'ja' = 'id') => {
  if (!val) return lang === 'ja' ? '介護分野（Kaigo）' : 'Keperawatan / Kaigo';
  const v = val.toUpperCase();
  if (v.includes('KAIGO') || v.includes('KEPERAWATAN') || v.includes('LANSIA') || v.includes('CAREWORKER')) {
    return lang === 'ja' ? '介護分野（Kaigo）' : 'Keperawatan / Kaigo';
  }
  if (v.includes('PETERNAKAN') || v.includes('TERNAK') || v.includes('LIVESTOCK')) {
    return lang === 'ja' ? '畜産農業分野（Peternakan）' : 'Peternakan';
  }
  if (v.includes('PERTANIAN') || v.includes('TANI') || v.includes('AGRICULTURE')) {
    return lang === 'ja' ? '農業分野（Pertanian）' : 'Pertanian';
  }
  if (v.includes('PENGOLAHAN') || v.includes('MAKANAN') || v.includes('FOOD')) {
    return lang === 'ja' ? '飲食料品製造業（食品製造）' : 'Pengolahan Makanan';
  }
  if (v.includes('RESTORAN') || v.includes('RESTO') || v.includes('F&B')) {
    return lang === 'ja' ? '外食業分野（Restoran）' : 'Restoran';
  }
  if (v.includes('KONSTRUKSI') || v.includes('BANGUNAN') || v.includes('CONSTRUCTION')) {
    return lang === 'ja' ? '建設分野（Konstruksi）' : 'Konstruksi';
  }
  if (v.includes('MANUFAKTUR') || v.includes('PABRIK') || v.includes('MESIN') || v.includes('MANUFACTURE')) {
    return lang === 'ja' ? '製造業・機械加工分野' : 'Manufaktur / Pabrik';
  }
  if (v.includes('PERIKANAN') || v.includes('IKAN') || v.includes('FISHERY')) {
    return lang === 'ja' ? '漁業・水産養殖業' : 'Perikanan';
  }
  if (v.includes('BUILDING') || v.includes('PEMBERSIHAN')) {
    return lang === 'ja' ? 'ビルクリーニング分野' : 'Pembersihan Gedung';
  }
  if (v.includes('WELDING') || v.includes('LAS')) {
    return lang === 'ja' ? '溶接・金属加工分野' : 'Pengelasan';
  }
  if (v.includes('OTOMOTIF') || v.includes('AUTOMOTIVE')) {
    return lang === 'ja' ? '自動車整備分野' : 'Otomotif';
  }
  return val;
};

const translateSSW = (val?: string | string[], lang: 'id' | 'ja' = 'id') => {
  const items = Array.isArray(val) ? val : (val ? val.split(',').map(s => s.trim()) : []);
  if (items.length === 0) {
    return lang === 'ja' ? '特定技能評価試験（介護分野）' : 'Keperawatan / Kaigo';
  }
  if (lang === 'id') return items.join(', ');
  return items
    .map((item) => {
      const v = item.toUpperCase();
      if (v.includes('KAIGO') || v.includes('KEPERAWATAN')) return '特定技能評価試験（介護分野）';
      if (v.includes('PETERNAKAN')) return '特定技能評価試験（畜産農業）';
      if (v.includes('PERTANIAN')) return '特定技能評価試験（農業分野）';
      if (v.includes('PENGOLAHAN') || v.includes('MAKANAN') || v.includes('FOOD')) return '特定技能評価試験（飲食料品製造業）';
      if (v.includes('KONSTRUKSI')) return '特定技能評価試験（建設分野）';
      if (v.includes('RESTORAN')) return '特定技能評価試験（外食業分野）';
      if (v.includes('MANUFAKTUR') || v.includes('PABRIK')) return '特定技能評価試験（製造分野）';
      return item;
    })
    .join('、');
};

const translateSSWShort = (val?: string | string[], lang: 'id' | 'ja' = 'id') => {
  const items = Array.isArray(val) ? val : (val ? val.split(',').map(s => s.trim()) : []);
  if (items.length === 0) {
    return lang === 'ja' ? '介護分野' : 'Kaigo';
  }
  if (lang === 'id') return items.join(', ');
  return items
    .map((item) => {
      const v = item.toUpperCase();
      if (v.includes('KAIGO') || v.includes('KEPERAWATAN')) return '介護分野';
      if (v.includes('PETERNAKAN')) return '畜産農業';
      if (v.includes('PERTANIAN')) return '農業分野';
      if (v.includes('PENGOLAHAN') || v.includes('MAKANAN') || v.includes('FOOD')) return '食品製造';
      if (v.includes('KONSTRUKSI')) return '建設分野';
      if (v.includes('RESTORAN')) return '外食業';
      if (v.includes('MANUFAKTUR') || v.includes('PABRIK')) return '機械製造';
      return item;
    })
    .join('、');
};

const translateDISC = (dominantType?: string, lang: 'id' | 'ja' = 'id') => {
  if (!dominantType) return lang === 'ja' ? '未受検' : 'Belum Asesmen';
  const t = dominantType.toUpperCase();
  if (t.includes('S') || t.includes('STEADINESS')) {
    return lang === 'ja' ? 'S型（安定・協調型 / Steadiness）' : 'Steadiness (S)';
  }
  if (t.includes('D') || t.includes('DOMINANCE')) {
    return lang === 'ja' ? 'D型（主導・決断型 / Dominance）' : 'Dominance (D)';
  }
  if (t.includes('I') || t.includes('INFLUENCE')) {
    return lang === 'ja' ? 'I型（社交・情熱型 / Influence）' : 'Influence (I)';
  }
  if (t.includes('C') || t.includes('COMPLIANCE')) {
    return lang === 'ja' ? 'C型（分析・規律型 / Compliance）' : 'Compliance (C)';
  }
  return dominantType;
};

const translateDISCShort = (dominantType?: string, lang: 'id' | 'ja' = 'id') => {
  if (!dominantType) return lang === 'ja' ? '未受検' : 'Belum Asesmen';
  const t = dominantType.toUpperCase();
  if (t.includes('S') || t.includes('STEADINESS')) {
    return lang === 'ja' ? 'S型 (安定型)' : 'Steadiness (S)';
  }
  if (t.includes('D') || t.includes('DOMINANCE')) {
    return lang === 'ja' ? 'D型 (主導型)' : 'Dominance (D)';
  }
  if (t.includes('I') || t.includes('INFLUENCE')) {
    return lang === 'ja' ? 'I型 (社交型)' : 'Influence (I)';
  }
  if (t.includes('C') || t.includes('COMPLIANCE')) {
    return lang === 'ja' ? 'C型 (規律型)' : 'Compliance (C)';
  }
  return dominantType;
};

const translateStatusProgres = (status?: string, lang: 'id' | 'ja' = 'id') => {
  if (!status) return lang === 'ja' ? '選考・書類審査中' : 'On Proses';
  if (lang === 'id') return status;
  const s = status.toUpperCase();
  if (s.includes('MATCHING') || s.includes('SIAP') || s.includes('READY')) {
    return 'マッチング準備完了（面接可能）';
  }
  if (s.includes('INTERVIEW') || s.includes('WAWANCARA')) {
    return '企業面接選考中';
  }
  if (s.includes('MATCHED') || s.includes('LOLOS') || s.includes('DITERIMA')) {
    return '採用内定・マッチング済';
  }
  if (s.includes('ON JOB') || s.includes('BERANGKAT') || s.includes('SELESAI')) {
    return '契約完了・日本出国済';
  }
  return '選考・書類審査中';
};

const translateDetailProgres = (detail?: string, lang: 'id' | 'ja' = 'id') => {
  if (!detail) {
    return lang === 'ja'
      ? '「LPK IJEF CORP社内研修および書類審査完了・面接受入可能」'
      : 'Sedang dalam peninjauan berkas & pembekalan internal LPK IJEF CORP.';
  }
  if (lang === 'id') return detail;
  if (detail.includes('Sedang dalam peninjauan') || detail.includes('internal LPK') || detail.includes('pembekalan')) {
    return '「LPK IJEF CORP社内研修および書類審査完了・面接受入可能」';
  }
  if (detail.includes('siap interview') || detail.includes('diverifikasi') || detail.includes('Siap')) {
    return '「候補者審査完了・オンライン企業面接推薦可能」';
  }
  if (detail.includes('jadwal interview') || detail.includes('interview')) {
    return '「受入企業様とのオンライン面接日程調整中」';
  }
  if (detail.includes('Lolos interview') || detail.includes('lolos')) {
    return '「企業面接合格・在留資格申請手続き中」';
  }
  return `「${detail}」`;
};

const translateAdvantage = (text?: string, lang: 'id' | 'ja' = 'id') => {
  if (lang === 'id') return text || 'Disiplin, jujur, cepat belajar, ramah, dan pantang menyerah.';
  if (!text) return '真面目で誠実、規律を守り、学習意欲が高く、粘り強く仕事に取り組みます。';
  const t = text.toLowerCase();
  if (t.includes('disiplin') && (t.includes('pekerja keras') || t.includes('kerja keras'))) {
    return '規律正しく、勤勉で時間を厳守し、何事にも誠実に取り組みます。';
  }
  if (t.includes('jujur') || t.includes('cepat belajar') || t.includes('ramah')) {
    return '真面目で誠実、学習意欲が高く、人当たりが良く粘り強い性格です。';
  }
  return '規律正しく、真面目で責任感があり、意欲的に業務に取り組みます。';
};

const translateReason = (text?: string, lang: 'id' | 'ja' = 'id') => {
  if (lang === 'id') {
    return (
      text ||
      'Mencari pengalaman kerja profesional internasional di Jepang, meningkatkan taraf ekonomi keluarga, dan mempelajari teknologi & disiplin kerja Jepang.'
    );
  }
  if (!text) {
    return '日本で高度な技術と職場規律を学び、将来のキャリアを高めるとともに、家族の生活を支えるためです。';
  }
  const t = text.toLowerCase();
  if (t.includes('teknologi') || t.includes('mempelajari')) {
    return '日本の高度な技術や専門知識を学び、自身のスキルを高めるためです。';
  }
  if (t.includes('ekonomi') || t.includes('keluarga') || t.includes('pengalaman')) {
    return '日本で国際的な実務経験を積み、職場規律を学ぶとともに、将来のキャリア向上と家族を支えるためです。';
  }
  return '日本の先進的な技術と職場規律を学び、自身の技能を高め家族を支えるためです。';
};

const translateReligion = (rel?: string, lang: 'id' | 'ja' = 'id') => {
  if (lang === 'id') return rel || 'Islam';
  const r = (rel || '').toLowerCase();
  if (r.includes('islam') || r.includes('muslim')) return 'イスラム教';
  if (r.includes('kristen') || r.includes('protestan')) return 'キリスト教';
  if (r.includes('katolik')) return 'カトリック';
  if (r.includes('hindu')) return 'ヒンドゥー教';
  if (r.includes('buddha')) return '仏教';
  return rel || 'イスラム教';
};

const translateMarital = (stat?: string, lang: 'id' | 'ja' = 'id') => {
  if (lang === 'id') return stat || 'Lajang';
  const s = (stat || '').toLowerCase();
  if (s.includes('menikah') || s.includes('kawin') || s.includes('married')) return '既婚';
  if (s.includes('cerai') || s.includes('divorce')) return '離婚';
  return '未婚';
};

const translatePlace = (place?: string, lang: 'id' | 'ja' = 'id') => {
  if (lang === 'id') return place || 'Indonesia';
  if (!place) return 'インドネシア';
  const p = place.toLowerCase();
  if (p.includes('jawa barat') || p.includes('west java')) return '西ジャワ州';
  if (p.includes('jawa tengah') || p.includes('central java')) return '中部ジャワ州';
  if (p.includes('jawa timur') || p.includes('east java')) return '東ジャワ州';
  if (p.includes('dki') || p.includes('jakarta')) return 'ジャカルタ';
  if (p.includes('bandung')) return 'バンドン';
  if (p.includes('semarang')) return 'スマラン';
  if (p.includes('surabaya')) return 'スラバヤ';
  if (p.includes('sumatera')) return 'スマトラ';
  if (p.includes('bali')) return 'バリ';
  if (p.includes('indonesia')) return 'インドネシア';
  return place;
};

const translateLevelBahasa = (level?: string, lang: 'id' | 'ja' = 'id') => {
  if (!level) return lang === 'ja' ? 'JLPT N4 / JFT-Basic A2相当' : 'JLPT N4 / JFT-Basic';
  if (lang === 'id') return level;
  const l = level.toUpperCase();
  if (l.includes('N3')) return '日本語能力試験 JLPT N3合格';
  if (l.includes('N4') || l.includes('JFT')) return 'JLPT N4 / JFT-Basic A2合格';
  if (l.includes('N5')) return '日本語能力試験 JLPT N5（基礎学習中）';
  return level;
};

const translateTSK = (tsk?: string, lang: 'id' | 'ja' = 'id') => {
  if (!tsk) return lang === 'ja' ? 'マッチング調整中' : 'On Process Job Matching';
  if (lang === 'id') return tsk;
  if (tsk.toLowerCase().includes('process') || tsk.toLowerCase().includes('matching')) {
    return 'マッチング調整中';
  }
  return tsk;
};

export const StudentCVModal: React.FC<StudentCVModalProps> = ({
  student,
  healthRecord,
  discRecord,
  psikotesRecord,
  rirekishoRecord,
  onClose,
  portalContext = 'ADMIN_1',
  initialMode = 'JIKOSHOUKAI'
}) => {
  const isMitraView = portalContext === 'MITRA';

  // Global app state fallback for fully synchronized data
  const {
    healthRecords = {},
    discRecords = {},
    psikotesRecords = {},
    rirekishoRecords = {},
    lang: appLang = 'id'
  } = useApp();

  // Resolve records reliably with AppContext fallback
  const resolvedHealth: HasilKesehatan | undefined =
    healthRecord ||
    healthRecords[student.id] ||
    Object.values(healthRecords).find((h: any) => h.siswaId === student.id || h.id === student.id);

  const resolvedDisc: AsesmenDisc | undefined =
    discRecord ||
    discRecords[student.id] ||
    Object.values(discRecords).find((d: any) => d.siswaId === student.id || d.id === student.id);

  const resolvedPsikotes: AsesmenPsikotes | undefined =
    psikotesRecord ||
    psikotesRecords[student.id] ||
    Object.values(psikotesRecords).find((p: any) => p.siswaId === student.id || p.id === student.id);

  const resolvedRirekisho: CVRirekisho | undefined =
    rirekishoRecord ||
    rirekishoRecords[student.id] ||
    Object.values(rirekishoRecords).find((r: any) => r.siswaId === student.id || r.id === student.id);

  // Language state: 'id' (Bahasa Indonesia) or 'ja' (日本語), synced with AppContext
  const [lang, setLang] = useState<'id' | 'ja'>(appLang);

  useEffect(() => {
    setLang(appLang);
  }, [appLang]);

  const [activeTab, setActiveTab] = useState<'jikoshoukai' | 'cv' | 'assessment' | 'dokumen'>(
    initialMode === 'CV' && !isMitraView
      ? 'cv'
      : initialMode === 'ASSESSMENT'
      ? 'assessment'
      : initialMode === 'DOKUMEN'
      ? 'dokumen'
      : 'jikoshoukai'
  );
  const [showPhotoZoom, setShowPhotoZoom] = useState<boolean>(false);

  const handlePrint = () => {
    setActiveTab('cv');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper variables for fallback & candidate details
  const namaLengkap = student.namaLengkap || resolvedRirekisho?.namaLengkap || 'Calon Siswa LPK';
  const namaKatakana =
    resolvedRirekisho?.namaKatakana ||
    resolvedRirekisho?.namaPanggilan ||
    student.namaLengkap.split(' ')[0];
  const rawTanggalLahir =
    student.tanggalLahir ||
    resolvedRirekisho?.tanggalLahir ||
    student.tempatTanggalLahir ||
    resolvedRirekisho?.tempatTanggalLahir;
  const computedUmur = rawTanggalLahir ? calculateAgeFromBirthDate(rawTanggalLahir, 0) : 0;
  const umur = computedUmur > 0 ? computedUmur : (resolvedRirekisho?.umur || student.umur || 22);
  const jenisKelaminRaw = student.jenisKelamin || resolvedRirekisho?.jenisKelamin || 'Laki-laki';
  const isMale =
    jenisKelaminRaw.toLowerCase().includes('laki') ||
    jenisKelaminRaw.toLowerCase() === 'l' ||
    jenisKelaminRaw.toLowerCase().includes('male');
  const jenisKelamin = lang === 'ja' ? (isMale ? '男性' : '女性') : isMale ? 'Laki-laki' : 'Perempuan';

  const bidangKerjaRaw = resolvedRirekisho?.bidangKerja || 'KAIGO';
  const bidangKerja = translateBidang(bidangKerjaRaw, lang);

  const kategoriKandidatRaw = student.kategoriKandidat || resolvedRirekisho?.kategoriKandidat || 'NEW COMER';
  const kategoriKandidat =
    lang === 'ja'
      ? kategoriKandidatRaw.toUpperCase().includes('EX')
        ? '日本滞在経験者（EX-JAPAN）'
        : '新規来日（NEW COMER）'
      : kategoriKandidatRaw;

  const levelBahasa = translateLevelBahasa(resolvedRirekisho?.levelBahasaJepang, lang);
  const sswSkills = translateSSW(resolvedRirekisho?.sertifikatSsw, lang);
  const sswSkillShort = translateSSWShort(resolvedRirekisho?.sertifikatSsw, lang);

  // ----------------------------------------------------
  // Synchronized MCU & Assessment Logic
  // ----------------------------------------------------
  const rawStatusFit =
    resolvedHealth?.statusFit ||
    (student as any).statusFit ||
    (student as any).mcuStatus ||
    resolvedRirekisho?.statusFit;

  const hasMcuRecord = !!resolvedHealth || !!rawStatusFit;

  let displayStatusFit = 'Belum MCU';
  let displayStatusFitJa = '未受診';
  let mcuBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-300';
  let mcuBadgeText = 'Belum MCU';
  let mcuBadgeTextJa = '未受診';

  if (hasMcuRecord && rawStatusFit) {
    const norm = String(rawStatusFit).toUpperCase();
    if (norm === 'FIT' || norm.includes('LAYAK')) {
      displayStatusFit = 'FIT (Layak Sehat)';
      displayStatusFitJa = '健康優良・合格（FIT）';
      mcuBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      mcuBadgeText = 'FIT';
      mcuBadgeTextJa = '合格 (FIT)';
    } else if (norm.includes('CATATAN') || norm.includes('NOTE')) {
      displayStatusFit = 'FIT (Dengan Catatan)';
      displayStatusFitJa = '条件付合格（要経過観察）';
      mcuBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
      mcuBadgeText = 'FIT (Catatan)';
      mcuBadgeTextJa = '条件付 (FIT)';
    } else if (norm.includes('UNFIT') || norm.includes('TIDAK')) {
      displayStatusFit = 'UNFIT (Tidak Layak)';
      displayStatusFitJa = '不合格（UNFIT）';
      mcuBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-300';
      mcuBadgeText = 'UNFIT';
      mcuBadgeTextJa = '不合格 (UNFIT)';
    } else if (norm.includes('PENDING') || norm.includes('PROSES')) {
      displayStatusFit = 'Proses MCU';
      displayStatusFitJa = '受診中・結果確認中';
      mcuBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
      mcuBadgeText = 'Proses';
      mcuBadgeTextJa = '審査中';
    } else {
      displayStatusFit = rawStatusFit;
      displayStatusFitJa = rawStatusFit;
      mcuBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      mcuBadgeText = rawStatusFit;
      mcuBadgeTextJa = rawStatusFit;
    }
  }

  const discType = translateDISC(resolvedDisc?.dominantType, lang);
  const discTypeShort = translateDISCShort(resolvedDisc?.dominantType, lang);

  const psikotesScore = resolvedPsikotes?.scorePercentage ?? 85;
  const statusProgresRaw = resolvedRirekisho?.statusCV || student.statusPendaftaran || 'On Proses';
  const statusProgres = translateStatusProgres(statusProgresRaw, lang);

  const detailProgresRaw =
    resolvedRirekisho?.detailProgres ||
    resolvedRirekisho?.keteranganProgres ||
    resolvedRirekisho?.catatanPerusahaan;
  const detailProgres = translateDetailProgres(detailProgresRaw, lang);

  const kodeJob = resolvedRirekisho?.kodeJob || '-';
  const namaTSK = translateTSK(resolvedRirekisho?.namaTSK, lang);

  const tempatLahir = translatePlace(student.tempatLahir || resolvedRirekisho?.tempatLahir, lang);
  const agama = translateReligion(student.agama || resolvedRirekisho?.agama, lang);
  const statusPernikahan = translateMarital(student.statusPerkawinan || resolvedRirekisho?.statusPernikahan, lang);

  // Video Jikoshoukai Link resolution
  const rawVideoUrl =
    resolvedRirekisho?.videoJikoshoukaiUrl ||
    resolvedRirekisho?.dokumenUpload?.videoJikoshoukai ||
    (student.berkasDokumen as any)?.videoJikoshoukai ||
    (student.berkasDokumen as any)?.videoPerkenalan ||
    '';
  const videoUrl = typeof rawVideoUrl === 'string' ? rawVideoUrl.trim() : '';

  // Video embed helper
  const getVideoEmbed = (url: string) => {
    if (!url) return null;
    const clean = url.trim();

    // YouTube formats
    const ytMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&autoplay=0`,
        rawUrl: clean
      };
    }

    // Google Drive formats
    const driveMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (driveMatch && driveMatch[1]) {
      return {
        type: 'drive',
        embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
        rawUrl: clean
      };
    }

    // Direct video file
    if (
      /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(clean) ||
      clean.includes('firebasestorage') ||
      clean.includes('cloudinary')
    ) {
      return {
        type: 'video',
        embedUrl: clean,
        rawUrl: clean
      };
    }

    return {
      type: 'link',
      embedUrl: clean,
      rawUrl: clean
    };
  };

  const videoInfo = getVideoEmbed(videoUrl);

  // Photo resolution
  const rawPhoto = getStudentPhotoUrl(student, resolvedRirekisho);
  const currentPhoto = typeof rawPhoto === 'string' ? rawPhoto.trim() : '';
  const hasPhoto = Boolean(currentPhoto && currentPhoto.length > 0);

  // Pipeline Step Counter logic (1..5)
  const getPipelineStep = () => {
    const s = String(statusProgresRaw).toUpperCase();
    if (s.includes('ON JOB') || s.includes('BERANGKAT') || s.includes('SELESAI')) return 5;
    if (s.includes('MATCHED') || s.includes('LOLOS') || s.includes('DITERIMA')) return 5;
    if (s.includes('MATCHING') || s.includes('INTERVIEW') || s.includes('WAWANCARA') || s.includes('READY')) return 4;
    if (s.includes('PELATIHAN') || s.includes('CV') || s.includes('JIS')) return 3;
    if (s.includes('MCU') || s.includes('MEDIS') || s.includes('ASESMEN')) return 2;
    return 3; // Default in training & matching prep
  };
  const currentStep = getPipelineStep();

  // Self PR & Advatages translation
  const mainAdvantage = translateAdvantage(
    resolvedRirekisho?.kelebihanAnda || resolvedRirekisho?.prKeunggulanDiri,
    lang
  );
  const reasonJapan = translateReason(resolvedRirekisho?.alasanInginKeJepang, lang);

  // ----------------------------------------------------
  // Dictionaries for ID & JA
  // ----------------------------------------------------
  const t = {
    id: {
      portalBadge: isMitraView
        ? 'Portal Mitra • Informasi Siswa'
        : portalContext === 'ADMIN_1'
        ? 'Admin Siswa • Data Siswa'
        : 'Admin Doc • CV Rirekisho Portal',
      tabJikoshoukai: 'Jikoshoukai & Profil',
      tabCV: 'CV Official (JIS Sheet)',
      tabAssessment: 'Hasil Asesmen & MCU',
      tabDocs: 'Dokumen & Lampiran',
      back: 'Kembali',
      printCV: 'Cetak CV (A4)',
      photoBadge: 'Pas Foto 2R (6×9 cm)',
      zoomPhoto: 'Klik untuk perbesar Pas Foto 2R (6x9)',
      katakanaLabel: 'Katakana / Panggilan:',
      birthInfo: 'Tempat, Tanggal Lahir',
      ageGender: 'Usia & Jenis Kelamin',
      religionStatus: 'Agama & Status',
      contactHp: 'Kontak / No. HP',
      readinessStatus: 'Kesiapan Interview',
      readyInterview: '✓ Siap Interview (Terverifikasi LPK)',
      yearsOld: 'Tahun',
      single: 'Lajang',
      married: 'Menikah',
      systemSummaryTitle: 'Rangkuman By Sistem (Kualifikasi & Rekomendasi)',
      systemSummaryDesc: `Kandidat atas nama ${namaLengkap} (${namaKatakana}), usia ${umur} tahun, bidang ${bidangKerja} (${kategoriKandidat}). Memiliki kualifikasi bahasa Jepang ${levelBahasa} dan sertifikasi ${sswSkills}. Dari hasil evaluasi LPK, status kesehatan MCU dinyatakan ${displayStatusFit}, profil kepribadian ${discType}, serta hasil psikotes ${psikotesScore}%. Siap untuk proses matching & interview user.`,
      hlJapanese: 'Level Bahasa',
      hlSsw: 'Keahlian SSW',
      hlMcu: 'Status MCU',
      hlDisc: 'Tipe DISC',
      hlPosture: 'Tinggi / Berat',
      pipelineTitle: 'Status Progres Rekrutmen & Job Matching',
      updated: 'Diperbarui',
      mainStatus: 'STATUS UTAMA:',
      jobCode: 'KODE JOB',
      pipelineNotes: 'Detail Progres & Catatan Perusahaan:',
      pipelineFlow: 'Tahapan Seleksi & Alur Rekrutmen:',
      steps: [
        { step: 1, title: '1. Berkas Pendaftaran', desc: 'Pendaftaran & LPK' },
        { step: 2, title: '2. MCU & Asesmen', desc: 'Medis, DISC, Psikotes' },
        { step: 3, title: '3. Pelatihan & CV JIS', desc: 'Nihongo & CV JIS' },
        { step: 4, title: '4. Job Matching', desc: 'Interview Zoom TSK' },
        { step: 5, title: '5. Status On Job', desc: 'Kontrak & Keberangkatan' },
      ],
      jikoshoukaiTitle: 'Jikoshoukai & Perkenalan Diri (Bahasa Jepang & Self PR)',
      videoTitle: 'Video Jikoshoukai Kandidat',
      watchVideo: 'Tonton Video',
      openVideoNewTab: 'Buka Video di Tab Baru',
      noVideoUploaded: 'Video Jikoshoukai sedang dalam proses perekaman & pembekalan internal LPK IJEF CORP.',
      onRecordingBadge: 'Status: On Recording',
      jikoshoukaiTextLabel: 'Teks Perkenalan Diri (Jikoshoukai)',
      selfPrLabel: 'Motivasi & Keunggulan Diri (Self PR)',
      mainAdvantage: 'Kelebihan Utama:',
      reasonJapan: 'Alasan Ingin Bekerja di Jepang:',
      defaultJikoshoukai: `Hajimemashite. Watashi wa ${namaLengkap} to moushimasu. ${student.tempatLahir || 'Indonesia'} kara kimashita. Toshi wa ${umur} sai desu. Watashi wa majime de, akarukute, isshoukenmei hatarakimasu. Douzo yoroshiku onegaishimasu.`,
      close: 'Tutup',
      footerInfo: 'Format Profil & CV Rirekisho JIS LPK IJEF CORP • Sistem Perlindungan Data Kandidat',
      candidateId: 'ID Kandidat:',
      statusLabel: 'Status:',
      mcuFacility: 'Fasilitas Kesehatan:',
      mcuDate: 'Tanggal MCU:',
      mcuNotes: 'Catatan Dokter:',
      discHeader: 'DISC Profile',
      psikotesHeader: 'Psikotes 50 Soal',
      scoreTotal: 'Skor Total:',
      correctCount: 'Jawaban Benar:',
      questionUnit: 'Soal',
      docStatusHeader: 'Status Lampiran Berkas Dokumen Persyaratan',
      uploaded: '✓ Terunggah',
      notUploaded: 'Belum Ada',
      openDoc: 'Buka Dokumen'
    },
    ja: {
      portalBadge: isMitraView
        ? 'パートナー企業ポータル • 候補者情報'
        : portalContext === 'ADMIN_1'
        ? '管理者1 • 生徒データ'
        : '管理者2 • JIS履歴書ポータル',
      tabJikoshoukai: '自己紹介・プロフィール',
      tabCV: 'JIS公式履歴書',
      tabAssessment: 'アセスメント・健康診断',
      tabDocs: '提出書類・資格証',
      back: '戻る',
      printCV: '履歴書印刷 (A4)',
      photoBadge: '証明写真 2R (6×9cm)',
      zoomPhoto: '写真を拡大表示 (2R 6×9cm)',
      katakanaLabel: 'フリガナ / 呼称:',
      birthInfo: '生年月日・出身地',
      ageGender: '年齢・性別',
      religionStatus: '宗教・配偶者',
      contactHp: '連絡先 / 電話番号',
      readinessStatus: '面接準備状況',
      readyInterview: '✓ 面接可能（LPK公式審査済）',
      yearsOld: '歳',
      single: '未婚',
      married: '既婚',
      systemSummaryTitle: '候補者適性・資格概要（システム自動集計）',
      systemSummaryDesc: `「${namaLengkap}（${namaKatakana}）」（${umur}歳）は、${bidangKerja}（${kategoriKandidat}）の特定技能・技能実習候補生です。日本語能力は【${levelBahasa}】、保有資格は【${sswSkills}】です。LPK社内アセスメントにおいて、健康診断結果は【${displayStatusFitJa}】、DISC性格適性は【${discType}】、適性心理テスト得点は【${psikotesScore}点（100点満点）】と判定されています。受入企業様へのオンライン面接推薦準備が完了しております。`,
      hlJapanese: '日本語能力',
      hlSsw: '特定技能分野',
      hlMcu: '健康診断',
      hlDisc: 'DISC性格適性',
      hlPosture: '身長 / 体重',
      pipelineTitle: '選考・マッチング進行状況',
      updated: '更新日時',
      mainStatus: '現在ステータス:',
      jobCode: '求人コード',
      pipelineNotes: '詳細進捗および受入企業メモ:',
      pipelineFlow: '採用選考プロセス:',
      steps: [
        { step: 1, title: '1. 応募書類審査', desc: '登録・書類確認' },
        { step: 2, title: '2. 健康診断・適性検査', desc: 'MCU・DISC・心理テスト' },
        { step: 3, title: '3. 日本語教育・JIS履歴書', desc: '日本語特訓・履歴書完成' },
        { step: 4, title: '4. 企業面接・マッチング', desc: 'オンライン面接・選考' },
        { step: 5, title: '5. 内定・ビザ申請・出国', desc: '契約締結・日本出国' },
      ],
      jikoshoukaiTitle: '自己紹介および自己PR（日本語・動画）',
      videoTitle: '候補者自己紹介動画 (Jikoshoukai Video)',
      watchVideo: '動画を再生する',
      openVideoNewTab: '別タブで動画を開く',
      noVideoUploaded: '自己紹介動画は現在LPKにて収録および最終確認中です。',
      onRecordingBadge: '状態: 収録準備中',
      jikoshoukaiTextLabel: '自己紹介文（日本語）',
      selfPrLabel: '志望動機・自己PR',
      mainAdvantage: '長所・アピールポイント:',
      reasonJapan: '日本で働きたい理由（志望動機）:',
      defaultJikoshoukai: `はじめまして。私の名前は ${namaLengkap} です。${tempatLahir} から来ました。年齢は ${umur} 歳です。私は真面目で、明るく、一生懸命働きます。どうぞよろしくお願いいたします。`,
      close: '閉じる',
      footerInfo: 'LPK IJEF CORP 公式候補者管理システム • JIS規格準拠 • 個人情報保護管理',
      candidateId: '候補者ID:',
      statusLabel: '状態:',
      mcuFacility: '検査医療機関:',
      mcuDate: '受診日:',
      mcuNotes: '医師所見・特記事項:',
      discHeader: 'DISC性格適性診断',
      psikotesHeader: '心理適性テスト (50問)',
      scoreTotal: '総合得点:',
      correctCount: '正解数:',
      questionUnit: '問',
      docStatusHeader: '各種提出書類・資格証の登録状況',
      uploaded: '✓ 登録済',
      notUploaded: '未登録',
      openDoc: '書類を開く'
    }
  }[lang];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden print:bg-white print:p-0 print:fixed print:inset-0 print:z-50 print:overflow-visible">
      <div className="bg-white text-slate-900 border border-slate-200 w-full h-full flex flex-col min-h-0 overflow-hidden print:max-h-none print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:rounded-none">
        
        {/* Modal Top Bar - Full Screen Mode */}
        <div className="bg-slate-50 px-4 sm:px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden shadow-xs">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                isMitraView
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                  : portalContext === 'ADMIN_1'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}
            >
              {t.portalBadge}
            </span>
            <span className="text-slate-500 text-xs font-mono hidden sm:inline">ID: {student.id}</span>
          </div>

          {/* Center: Language Switcher & Tab Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher Pill */}
            <div className="inline-flex items-center shrink-0 flex-nowrap whitespace-nowrap bg-white p-0.5 rounded-xl border border-slate-300 shadow-2xs select-none gap-0.5">
              <button
                type="button"
                onClick={() => setLang('id')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap leading-none ${
                  lang === 'id'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Tampilkan dalam Bahasa Indonesia"
              >
                <span className="shrink-0 leading-none">🇮🇩</span>
                <span className="text-[11px] shrink-0 whitespace-nowrap leading-none font-bold">Indonesia</span>
              </button>
              <button
                type="button"
                onClick={() => setLang('ja')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap leading-none ${
                  lang === 'ja'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="日本語で表示する"
              >
                <span className="shrink-0 leading-none">🇯🇵</span>
                <span className="text-[11px] shrink-0 whitespace-nowrap leading-none font-bold">日本語</span>
              </button>
            </div>

            {/* Tab Switcher (Hide CV Official tab for Mitra to protect student contact privacy) */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/80 space-x-1">
              <button
                onClick={() => setActiveTab('jikoshoukai')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'jikoshoukai'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>{t.tabJikoshoukai}</span>
              </button>

              {/* CV Official (JIS Sheet) is hidden in Mitra View */}
              {!isMitraView && (
                <button
                  onClick={() => setActiveTab('cv')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'cv'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.tabCV}</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'assessment'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t.tabAssessment}</span>
              </button>

              <button
                onClick={() => setActiveTab('dokumen')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'dokumen'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{t.tabDocs}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Print button is only available for Admin */}
            {!isMitraView && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition border border-amber-600 shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.printCV}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0 print:overflow-visible bg-slate-50 flex-1 min-h-0">
          
          {/* TAB 1: Jikoshoukai & Profile Singkat View */}
          {activeTab === 'jikoshoukai' && (
            <div className="space-y-6">
              
              {/* 1. Header Profile Card with 2R (6x9) Photo */}
              <div className="bg-white border border-purple-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Pas Photo 2R (6x9 Ratio = 2:3) */}
                  <div className="shrink-0 mx-auto sm:mx-0">
                    <div
                      onClick={() => hasPhoto && setShowPhotoZoom(true)}
                      className="w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-2xl bg-slate-100 border-2 border-purple-300 overflow-hidden shadow-md ring-4 ring-purple-50 flex items-center justify-center font-bold text-slate-400 cursor-pointer relative group transition duration-300 hover:shadow-xl hover:border-purple-400"
                      title={t.zoomPhoto}
                    >
                      {hasPhoto ? (
                        <>
                          <img
                            src={currentPhoto}
                            alt={namaLengkap}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleStudentImageError(e, namaLengkap, jenisKelamin)}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                            <span className="p-2 bg-slate-900/75 rounded-full shadow-md flex items-center space-x-1.5 text-xs font-bold">
                              <ZoomIn className="w-4 h-4 text-amber-300" />
                              <span>Zoom 2R</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 bg-amber-50/60 rounded-xl m-2 border border-dashed border-amber-300">
                          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-amber-800 leading-tight">
                              {lang === 'ja' ? '写真未登録' : 'Foto Belum Di-upload'}
                            </span>
                            <span className="block text-[10px] text-amber-600/90 mt-0.5">
                              {lang === 'ja' ? 'プロフィール写真を添付してください' : 'Lampirkan pas foto siswa'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 2R (6x9) Dimension Label Badge */}
                      <div className="absolute bottom-2 inset-x-2 flex justify-center pointer-events-none">
                        <span className="bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-white/20">
                          {t.photoBadge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Profile Details */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                          {namaLengkap}
                        </h2>
                        <p className="text-xs sm:text-sm text-purple-800 font-mono font-bold mt-0.5">
                          {t.katakanaLabel} <span className="text-slate-900 font-sans font-extrabold">{namaKatakana}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-purple-100 text-purple-900 border border-purple-300 font-black text-xs uppercase px-3 py-1.5 rounded-xl tracking-wider shadow-2xs">
                          {bidangKerja}
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs uppercase px-3 py-1.5 rounded-xl tracking-wider shadow-2xs">
                          {kategoriKandidat}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-xs">
                      {/* Box 1: Tempat, Tanggal Lahir */}
                      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">{t.birthInfo}</span>
                        <strong className="text-slate-900 text-xs sm:text-[13px] mt-1 block">
                          {tempatLahir}, {student.tanggalLahir || resolvedRirekisho?.tanggalLahir || '-'}
                        </strong>
                      </div>

                      {/* Box 2: Usia & Gender */}
                      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">{t.ageGender}</span>
                        <strong className="text-slate-900 text-xs sm:text-[13px] mt-1 block">
                          {umur} {t.yearsOld} • {jenisKelamin}
                        </strong>
                      </div>

                      {/* Box 3: Agama & Status */}
                      <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 font-semibold block uppercase">{t.religionStatus}</span>
                        <strong className="text-slate-900 text-xs sm:text-[13px] mt-1 block">
                          {agama} • {statusPernikahan}
                        </strong>
                      </div>

                      {/* Box 4: For Mitra -> Hidden Contact / Protected Readiness; For Admin -> Contact / HP */}
                      {isMitraView ? (
                        <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 shadow-2xs flex flex-col justify-between">
                          <span className="text-[10px] text-indigo-700 font-semibold block uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{t.readinessStatus}</span>
                          </span>
                          <strong className="text-indigo-950 text-xs sm:text-[12px] mt-1 block font-bold">
                            {t.readyInterview}
                          </strong>
                        </div>
                      ) : (
                        <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold block uppercase">{t.contactHp}</span>
                          <strong className="text-purple-800 font-mono text-xs sm:text-[13px] mt-1 block">
                            {student.noHp || resolvedRirekisho?.noHp || '-'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Rangkuman By Sistem (AI Brief Summary) */}
              <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 border-b border-purple-200 pb-2.5">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-amber-800 uppercase font-mono tracking-wider">
                    {t.systemSummaryTitle}
                  </h3>
                </div>

                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans bg-white p-3.5 rounded-xl border border-purple-100 shadow-2xs">
                  {t.systemSummaryDesc}
                </p>

                {/* Highlight Badges (5 Boxes) - Synchronized with MCU & localized */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-slate-500 text-[10px] block">{t.hlJapanese}</span>
                    <strong className="text-purple-900 truncate block">{levelBahasa}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-slate-500 text-[10px] block">{t.hlSsw}</span>
                    <strong className="text-emerald-700 truncate block">{sswSkillShort}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-slate-500 text-[10px] block">{t.hlMcu}</span>
                    <strong className={`truncate block px-1 py-0.5 rounded text-[10px] font-bold ${mcuBadgeClass}`}>
                      {lang === 'ja' ? mcuBadgeTextJa : mcuBadgeText}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-slate-500 text-[10px] block">{t.hlDisc}</span>
                    <strong className="text-purple-900 truncate block">{discTypeShort}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-slate-500 text-[10px] block">{t.hlPosture}</span>
                    <strong className="text-sky-800">
                      {resolvedRirekisho?.tinggiBadan || 165}cm / {resolvedRirekisho?.beratBadan || 55}kg
                    </strong>
                  </div>
                </div>
              </div>

              {/* 3. Status Progres Rekrutmen & Job Matching (Pipeline Progress Tracker) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      {t.pipelineTitle}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {t.updated}: {resolvedRirekisho?.updatedAt?.split('T')[0] || new Date().toISOString().split('T')[0]}
                    </span>
                  </span>
                </div>

                {/* Status Callout Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 font-mono">{t.mainStatus}</span>
                      <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-purple-100 text-purple-900 border border-purple-300">
                        {statusProgres}
                      </span>
                    </div>

                    {kodeJob !== '-' && (
                      <div className="bg-amber-50 border border-amber-300 px-3 py-1 rounded-lg text-xs font-mono text-amber-900 flex items-center space-x-1">
                        <Briefcase className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          {t.jobCode}: {kodeJob} ({namaTSK})
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">{t.pipelineNotes}</span>
                    <p className="text-xs text-slate-800 font-medium italic mt-0.5">
                      {detailProgres}
                    </p>
                  </div>
                </div>

                {/* Visual Pipeline Timeline (5 Steps) */}
                <div className="pt-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase mb-3">
                    {t.pipelineFlow}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {t.steps.map((item) => {
                      const isPassed = item.step < currentStep;
                      const isCurrent = item.step === currentStep;

                      return (
                        <div
                          key={item.step}
                          className={`p-3 rounded-xl border text-xs relative ${
                            isPassed
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium'
                              : isCurrent
                              ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-xs ring-1 ring-purple-300'
                              : 'bg-slate-100/70 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono font-bold text-[11px] mb-1">
                            <span>{item.title}</span>
                            {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            {isCurrent && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                          </div>
                          <span className="text-[10px] block opacity-80">{item.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 4. Self Introduction (Jikoshoukai) Text, Video & Self PR */}
              <div className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-purple-700" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      {t.jikoshoukaiTitle}
                    </h3>
                  </div>

                  {videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t.openVideoNewTab}</span>
                    </a>
                  )}
                </div>

                {/* Video Player Display (If Video Exists) */}
                {videoUrl && videoInfo ? (
                  <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 text-white space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="font-bold text-slate-200">{t.videoTitle}</span>
                        <span className="text-[10px] bg-rose-900/80 text-rose-200 border border-rose-700 px-2 py-0.5 rounded font-mono">
                          HD 1080p
                        </span>
                      </div>
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-rose-300 hover:text-white flex items-center space-x-1"
                      >
                        <span>{t.openVideoNewTab}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Responsive Video Player Container */}
                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center relative shadow-inner">
                      {videoInfo.embedUrl && (videoInfo.type === 'youtube' || videoInfo.type === 'drive') ? (
                        <iframe
                          src={videoInfo.embedUrl}
                          title="Video Jikoshoukai"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : videoInfo.embedUrl && videoInfo.type === 'video' ? (
                        <video
                          controls
                          className="w-full h-full object-contain"
                          src={videoInfo.embedUrl}
                          poster={hasPhoto ? currentPhoto : undefined}
                        >
                          {lang === 'ja'
                            ? 'お使いのブラウザは動画タグに対応していません。'
                            : 'Browser Anda tidak mendukung tag video.'}
                        </video>
                      ) : (
                        <div className="p-6 text-center space-y-3">
                          <Play className="w-12 h-12 text-rose-500 mx-auto" />
                          <p className="text-sm font-medium text-slate-300">
                            {lang === 'ja'
                              ? '自己紹介動画は外部クラウドリンクにて確認可能です：'
                              : 'Video Jikoshoukai tersedia pada tautan eksternal:'}
                          </p>
                          <a
                            href={videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                          >
                            <Video className="w-4 h-4" />
                            <span>{t.watchVideo}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5 text-xs text-slate-600">
                      <Video className="w-4 h-4 text-slate-400" />
                      <span>{t.noVideoUploaded}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {t.onRecordingBadge}
                    </span>
                  </div>
                )}

                {/* Text Jikoshoukai & Self PR Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Japanese Jikoshoukai */}
                  <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200/80 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-purple-900 block uppercase">
                      {t.jikoshoukaiTextLabel}
                    </span>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line text-[13px] font-sans italic bg-white p-3.5 rounded-lg border border-purple-200/60 shadow-2xs">
                      {resolvedRirekisho?.shidouDoki || t.defaultJikoshoukai}
                    </p>
                  </div>

                  {/* Motivasi & Keunggulan Diri */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-emerald-900 block uppercase">
                      {t.selfPrLabel}
                    </span>
                    <div className="space-y-2.5 text-slate-700">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">{t.mainAdvantage}</span>
                        <p className="text-slate-900 font-semibold bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs mt-0.5">
                          {mainAdvantage}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">{t.reasonJapan}</span>
                        <p className="text-slate-900 font-semibold bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs mt-0.5">
                          {reasonJapan}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Official Japanese CV Sheet (JIS White Sheet Standard) - Only in Admin View */}
          {!isMitraView && activeTab === 'cv' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {lang === 'ja'
                      ? '日本JIS規格公式履歴書（A4見開き・標準様式）'
                      : 'Format Official JIS Standard Japanese Rirekisho (2-Page White Sheet)'}
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition border border-amber-600 shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.printCV}</span>
                </button>
              </div>

              <div className="bg-slate-100/70 p-2 sm:p-6 rounded-2xl border border-slate-200 print:p-0 print:border-none print:bg-white">
                <JapaneseCVSheet
                  student={student}
                  rirekishoRecord={resolvedRirekisho}
                  healthRecord={resolvedHealth}
                  discRecord={resolvedDisc}
                  psikotesRecord={resolvedPsikotes}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Hasil Asesmen Internal (MCU, DISC, Psikotes, Lampiran) */}
          {activeTab === 'assessment' && (
            <div className="space-y-6 print:hidden">
              {/* Profile Header Banner with 2R (6x9) Photo */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div
                    onClick={() => hasPhoto && setShowPhotoZoom(true)}
                    className="w-20 sm:w-24 aspect-[2/3] rounded-xl bg-slate-100 border-2 border-emerald-400 overflow-hidden shrink-0 shadow-md flex items-center justify-center font-bold text-slate-400 relative cursor-pointer group"
                    title={t.zoomPhoto}
                  >
                    {hasPhoto ? (
                      <>
                        <img
                          src={currentPhoto}
                          alt={namaLengkap}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleStudentImageError(e, namaLengkap, jenisKelamin)}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                          <ZoomIn className="w-4 h-4 text-emerald-300" />
                        </div>
                      </>
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                    <span className="absolute bottom-1 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap">
                      2R (6×9)
                    </span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{namaLengkap}</h2>
                    {isMitraView ? (
                      <p className="text-xs text-slate-500 font-mono">
                        {t.candidateId} {student.id} • {t.statusLabel} {statusProgres}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 font-mono">
                        {student.email} • {student.noHp || '-'}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {kategoriKandidat}
                      </span>
                      <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                        {lang === 'ja' ? '選考区分:' : 'Status:'} {statusProgres}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Grid: MCU, DISC, Psikotes - Synchronized */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* MCU Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 uppercase font-mono flex items-center space-x-1.5">
                      <HeartPulse className="w-4 h-4" />
                      <span>{lang === 'ja' ? '健康診断 (MCU)' : 'Medical MCU'}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${mcuBadgeClass}`}>
                      {lang === 'ja' ? mcuBadgeTextJa : mcuBadgeText}
                    </span>
                  </div>

                  {hasMcuRecord ? (
                    <div className="text-xs space-y-1.5">
                      <div>
                        <span className="text-slate-500 text-[10px] block font-medium">{t.mcuFacility}</span>
                        <div className="font-semibold text-slate-900">
                          {resolvedHealth?.namaKlinik || (lang === 'ja' ? '提携クリニック（LPK提携医療機関）' : 'Klinik Rekanan LPK')}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block font-medium">{t.mcuDate}</span>
                        <div className="text-slate-700 font-mono">
                          {resolvedHealth?.tanggalMCU || (lang === 'ja' ? '受診確認済' : 'Terverifikasi')}
                        </div>
                      </div>
                      {(resolvedHealth?.catatanMedis || resolvedHealth?.catatanDokter) && (
                        <div className="pt-1.5 text-[11px] text-slate-600 italic border-t border-slate-100">
                          "{lang === 'ja' ? (resolvedHealth.catatanMedis || resolvedHealth.catatanDokter || '特記事項なし（業務支障なし）') : (resolvedHealth.catatanMedis || resolvedHealth.catatanDokter)}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      {lang === 'ja' ? '健康診断データはまだ登録されていません。' : 'Data MCU medis belum terbit.'}
                    </div>
                  )}
                </div>

                {/* DISC Personality Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-800 uppercase font-mono flex items-center space-x-1.5">
                      <Brain className="w-4 h-4" />
                      <span>{t.discHeader}</span>
                    </span>
                    {resolvedDisc && (
                      <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {lang === 'ja' ? 'タイプ:' : 'Tipe:'} {discTypeShort}
                      </span>
                    )}
                  </div>

                  {resolvedDisc ? (
                    <div className="text-xs space-y-2">
                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                        <div className="bg-slate-50 p-1 rounded border border-slate-200">
                          <span className="text-slate-500 block">D</span>
                          <strong className="text-purple-900">{resolvedDisc.scoreD}</strong>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200">
                          <span className="text-slate-500 block">I</span>
                          <strong className="text-purple-900">{resolvedDisc.scoreI}</strong>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200">
                          <span className="text-slate-500 block">S</span>
                          <strong className="text-purple-900">{resolvedDisc.scoreS}</strong>
                        </div>
                        <div className="bg-slate-50 p-1 rounded border border-slate-200">
                          <span className="text-slate-500 block">C</span>
                          <strong className="text-purple-900">{resolvedDisc.scoreC}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-tight">
                        {lang === 'ja'
                          ? (resolvedDisc.description
                              ? (resolvedDisc.dominantType?.includes('S')
                                  ? 'チームワークを重視し、忍耐強く、落ち着いて指示に従う安定した適性を示しています。'
                                  : resolvedDisc.dominantType?.includes('D')
                                  ? '主体性があり、決断力と目標達成意欲が高いリーダー適性を示しています。'
                                  : resolvedDisc.dominantType?.includes('I')
                                  ? '明るく協調性があり、職場での円滑なコミュニケーションを得意としています。'
                                  : '細部に注意を払い、ルールや規律を厳守する丁寧な適性を示しています。')
                              : '真面目で協調性があり、落ち着いて指示に従う安定した適性を示しています。')
                          : (resolvedDisc.description || 'Memiliki kepribadian yang tenang, tekun, dan dapat bekerja sama dengan baik dalam tim.')}
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      {lang === 'ja' ? 'DISC適性検査は未受験です。' : 'Asesmen DISC belum dikerjakan.'}
                    </div>
                  )}
                </div>

                {/* Psikotes 50 Soal Card */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-800 uppercase font-mono flex items-center space-x-1.5">
                      <Award className="w-4 h-4" />
                      <span>{t.psikotesHeader}</span>
                    </span>
                    {resolvedPsikotes && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          resolvedPsikotes.statusKelulusan === 'LULUS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {resolvedPsikotes.statusKelulusan === 'LULUS'
                          ? lang === 'ja'
                            ? '合格'
                            : 'LULUS'
                          : lang === 'ja'
                          ? '不合格'
                          : 'TIDAK LULUS'}
                      </span>
                    )}
                  </div>

                  {resolvedPsikotes ? (
                    <div className="text-xs space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-500 text-[11px]">{t.scoreTotal}</span>
                        <strong className="text-lg font-black text-indigo-800 font-mono">
                          {resolvedPsikotes.scorePercentage}%
                        </strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {t.correctCount}{' '}
                        <strong className="text-slate-900">{resolvedPsikotes.totalCorrect}</strong> / 50{' '}
                        {t.questionUnit}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      {lang === 'ja' ? '心理適性テストはまだ完了していません。' : 'Psikotes belum selesai.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Lampiran Berkas Dokumen */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider font-mono flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{t.docStatusHeader}</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {[
                    { key: 'pasFoto', label: lang === 'ja' ? '証明写真 (3×4)' : 'Pas Foto 3x4' },
                    { key: 'cv', label: lang === 'ja' ? '履歴書データ' : 'Curriculum Vitae' },
                    { key: 'ijazah', label: lang === 'ja' ? '卒業証明書' : 'Ijazah / SKL' },
                    { key: 'skck', label: lang === 'ja' ? '無犯罪証明書' : 'SKCK Aktif' },
                    { key: 'ktpSiswa', label: lang === 'ja' ? '本人身分証' : 'KTP Siswa' },
                    { key: 'ktpOrangTua', label: lang === 'ja' ? '保護者身分証' : 'KTP Orang Tua' },
                    { key: 'kartuKeluarga', label: lang === 'ja' ? '家族登録カード' : 'Kartu Keluarga' },
                    { key: 'paspor', label: lang === 'ja' ? 'パスポート' : 'Paspor RI' }
                  ].map((doc) => {
                    const bd = student.berkasDokumen as Record<string, string> | undefined;
                    const cvd = resolvedRirekisho?.dokumenUpload as Record<string, string> | undefined;
                    const url =
                      bd?.[doc.key] ||
                      cvd?.[doc.key] ||
                      (doc.key === 'pasFoto'
                        ? bd?.pasPhoto3x4 || cvd?.pasPhoto3x4 || resolvedRirekisho?.pasFotoUrl
                        : '') ||
                      (doc.key === 'cv' ? bd?.cvRirekishoDoc || cvd?.cvRirekishoDoc : '') ||
                      (doc.key === 'sertifikatJft'
                        ? bd?.sertifikatBahasaJepang || cvd?.sertifikatBahasaJepang
                        : '') ||
                      (doc.key === 'sertifikatSswKaigoSkill'
                        ? bd?.sertifikatSsw || cvd?.sertifikatSsw
                        : '');
                    return (
                      <div
                        key={doc.key}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-slate-500 block text-[10px] font-medium">{doc.label}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              url ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {url ? t.uploaded : t.notUploaded}
                          </span>
                        </div>

                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition"
                            title={t.openDoc}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Upload Dokumen & Berkas (9 Dokumen Standar & View File) */}
          {activeTab === 'dokumen' && (
            <div className="space-y-4">
              <CandidateDocumentUploadSection
                documents={{
                  ...(student.berkasDokumen || {}),
                  ...(resolvedRirekisho?.dokumenUpload || {}),
                  pasPhoto3x4:
                    resolvedRirekisho?.dokumenUpload?.pasPhoto3x4 ||
                    student.berkasDokumen?.pasPhoto3x4 ||
                    student.berkasDokumen?.pasFoto,
                  videoJikoshoukai:
                    videoUrl ||
                    resolvedRirekisho?.videoJikoshoukaiUrl ||
                    resolvedRirekisho?.dokumenUpload?.videoJikoshoukai ||
                    (student.berkasDokumen as any)?.videoJikoshoukai
                }}
                onChange={() => {}}
                candidateName={namaLengkap}
                readOnly={true}
                lang={lang}
              />
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0 print:hidden">
          <span className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{t.footerInfo}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>

        {/* Photo Zoom Lightbox Modal (2R 6x9 Inspection) */}
        {showPhotoZoom && hasPhoto && (
          <div
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPhotoZoom(false)}
          >
            <div
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {lang === 'ja' ? '候補者顔写真 (2R 6×9cm)' : 'Pas Foto Kandidat 2R (6×9 cm)'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {namaLengkap} ({namaKatakana})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoZoom(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex justify-center bg-slate-100 rounded-2xl overflow-hidden p-3 border border-slate-200">
                <img
                  src={currentPhoto}
                  alt={namaLengkap}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleStudentImageError(e, namaLengkap, jenisKelamin)}
                  className="w-56 sm:w-64 aspect-[2/3] object-cover object-top rounded-xl shadow-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 font-medium">{t.photoBadge}</span>
                <a
                  href={currentPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-purple-700 hover:text-purple-900 font-bold"
                >
                  <span>{lang === 'ja' ? '元画像を開く' : 'Buka Foto Asli'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
