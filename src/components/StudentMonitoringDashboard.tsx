import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import useSyncCRMLead from '../hooks/useSyncCRMLead';
import { CandidateCategory, JobPosting, JobApplication, CalonSiswa } from '../types';
import { isIjefCategory } from '../utils/candidateUtils';
import {
  isJobActiveAndAvailable,
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  formatQualification,
  translateCandidateCategory
} from '../utils/mitraJobUtils';
import { StudentCVModal } from './StudentCVModal';
import { JobDescriptionCategorizedView } from './common/JobDescriptionCategorizedView';
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  Brain,
  FileCheck,
  UploadCloud,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Eye,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Building2,
  MapPin,
  Banknote,
  Search,
  Video,
  Send,
  Check,
  AlertCircle,
  Filter,
  CheckSquare,
  Users,
  ChevronDown
} from 'lucide-react';

export interface StudentMonitoringDashboardProps {
  onNavigateToTab?: (
    tab: 'pendaftaran' | 'disc' | 'psikotes' | 'status' | 'rirekisho' | 'job_matching',
    step?: number
  ) => void;
}

export const StudentMonitoringDashboard: React.FC<StudentMonitoringDashboardProps> = ({
  onNavigateToTab
}) => {
  const { user } = useAuth();
  const { leadData } = useSyncCRMLead();
  const {
    students,
    activeStudent,
    selectedStudentId,
    setSelectedStudentId,
    healthRecords,
    discRecords,
    psikotesRecords,
    financingRecords,
    contractRecords,
    rirekishoRecords,
    jobApplications,
    jobPostings,
    saveJobApplication
  } = useApp();
  const { lang, bilingual } = useEcosystemTranslation();

  const userEmail = user?.email || leadData?.email || '';
  const [showCVModal, setShowCVModal] = useState(false);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobSectorFilter, setJobSectorFilter] = useState<string>('SEMUA');
  const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);
  const [viewingDetailJob, setViewingDetailJob] = useState<JobPosting | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Student Selector state for "Lihat Akun Siswa"
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const selectedStudentObj = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : null;

  const studentByEmail = userEmail
    ? students.find(
        (s) =>
          s.email?.toLowerCase().trim() === userEmail.toLowerCase().trim() ||
          s.id === user?.uid ||
          s.id === userEmail
      )
    : null;

  // Match current logged in student profile
  const matchedStudent: CalonSiswa =
    user?.role === 'admin'
      ? (selectedStudentObj || activeStudent || studentByEmail || (students.length > 0 ? students[0] : {
          id: user?.uid || `SISWA-${Date.now()}`,
          namaLengkap: user?.displayName || 'Siswa',
          email: userEmail || '',
          noHp: '',
          kategoriKandidat: 'SISWA NON IJEF',
          kewarganegaraan: 'WNI',
          noKtp: '',
          noKk: '',
          alamatDomisili: '',
          tempatLahir: '',
          tanggalLahir: '2002-05-15',
          agama: 'Islam',
          jenisKelamin: 'Laki-laki',
          golonganDarah: 'O',
          statusPerkawinan: 'Lajang',
          namaAyah: '',
          pekerjaanAyah: '',
          namaIbu: '',
          pekerjaanIbu: '',
          berkasDokumen: {},
          statusPendaftaran: 'Draft',
          createdAt: new Date().toISOString()
        }))
      : (studentByEmail || selectedStudentObj || activeStudent || {
          id: user?.uid || `SISWA-${Date.now()}`,
          namaLengkap: user?.displayName || 'Siswa',
          email: userEmail || '',
          noHp: '',
          kategoriKandidat: 'SISWA NON IJEF',
          kewarganegaraan: 'WNI',
          noKtp: '',
          noKk: '',
          alamatDomisili: '',
          tempatLahir: '',
          tanggalLahir: '2002-05-15',
          agama: 'Islam',
          jenisKelamin: 'Laki-laki',
          golonganDarah: 'O',
          statusPerkawinan: 'Lajang',
          namaAyah: '',
          pekerjaanAyah: '',
          namaIbu: '',
          pekerjaanIbu: '',
          berkasDokumen: {},
          statusPendaftaran: 'Draft',
          createdAt: new Date().toISOString()
        });

  const handleSelectStudent = (stuId: string) => {
    setSelectedStudentId(stuId);
    setShowStudentSelector(false);
    const selectedObj = students.find((s) => s.id === stuId);
    if (selectedObj) {
      setToastMessage(
        bilingual(
          `Beralih ke akun siswa: ${selectedObj.namaLengkap} (${selectedObj.kategoriKandidat || 'Siswa'})`,
          `生徒アカウントを切り替えました: ${selectedObj.namaLengkap}`
        )
      );
    }
  };

  const filteredStudentsForSelector = students.filter((stu) => {
    const matchesSearch =
      !studentSearchTerm.trim() ||
      stu.namaLengkap?.toLowerCase().includes(studentSearchTerm.toLowerCase().trim()) ||
      stu.email?.toLowerCase().includes(studentSearchTerm.toLowerCase().trim()) ||
      stu.id?.toLowerCase().includes(studentSearchTerm.toLowerCase().trim()) ||
      stu.kategoriKandidat?.toLowerCase().includes(studentSearchTerm.toLowerCase().trim());

    const matchesCategory =
      categoryFilter === 'ALL' ||
      (categoryFilter === 'IJEF_OFFLINE' && stu.kategoriKandidat === 'SISWA IJEF - Offline') ||
      (categoryFilter === 'IJEF_ONLINE' && stu.kategoriKandidat === 'SISWA IJEF - Online') ||
      (categoryFilter === 'NEW_COMER' && (stu.kategoriKandidat?.includes('New Comer') || stu.kategoriKandidat === 'NEW COMER')) ||
      (categoryFilter === 'EX_MAGANG' && (stu.kategoriKandidat?.includes('Ex-Magang') || stu.kategoriKandidat?.includes('Ex-Trainee'))) ||
      (categoryFilter === 'ENGINEERING' && (stu.kategoriKandidat?.includes('Engineering') || stu.kategoriKandidat?.includes('Gijinkoku'))) ||
      (categoryFilter === 'MITRA' && stu.kategoriKandidat?.includes('MITRA'));

    return matchesSearch && matchesCategory;
  });

  const studentId = matchedStudent?.id || '';
  const candidateCategory: CandidateCategory =
    matchedStudent?.kategoriKandidat ||
    leadData?.kategoriKandidat ||
    (user?.role === 'admin' ? activeStudent?.kategoriKandidat : null) ||
    'SISWA NON IJEF';
  const isIjefStudent = isIjefCategory(candidateCategory);
  const isIjefOnline = isIjefStudent && (candidateCategory.toLowerCase().includes('online') || candidateCategory.toLowerCase().includes('daring'));

  // Student Modules Data
  const health = healthRecords[studentId];
  const disc = discRecords[studentId];
  const psikotes = psikotesRecords[studentId];
  const dana = financingRecords[studentId];
  const kontrak = contractRecords[studentId];

  const myJobApplications = jobApplications.filter(
    (app) => app.emailSiswa?.toLowerCase() === userEmail.toLowerCase() || app.siswaId === studentId
  );

  const studentCV = (Object.values(rirekishoRecords) as any[]).find(
    (cv) => cv.email?.toLowerCase() === userEmail.toLowerCase() || cv.siswaId === studentId
  );

  // Document count calculation
  const berkas = matchedStudent?.berkasDokumen || {};
  const uploadedDocCount = [berkas.ktp, berkas.kk, berkas.ijazah, berkas.pasfoto, berkas.sertifikat].filter(Boolean).length;
  const isDocsComplete = uploadedDocCount >= 4;

  // Status Check Helpers
  const isBiodataComplete = Boolean(
    matchedStudent?.namaLengkap && matchedStudent?.noKtp && matchedStudent?.noHp && matchedStudent?.alamatDomisili
  );

  const isDiscComplete = Boolean(disc && (disc.dominantTrait || disc.dominantType));
  const isPsikotesPassed = psikotes?.statusKelulusan === 'LULUS' || (psikotes?.skorTotal || 0) >= 30;

  // Overall Progress Percentage Calculation
  let completedPoints = 0;
  if (isIjefStudent) {
    if (isBiodataComplete) completedPoints += 20;
    if (health) completedPoints += 15;
    if (isDocsComplete) completedPoints += 15;
    if (isDiscComplete) completedPoints += 15;
    if (psikotes) completedPoints += 15;
    if (studentCV) completedPoints += 20;
  } else {
    // Non-IJEF Matching Candidates: Bypasses MCU, DISC & Psikotes; focuses on Biodata, Docs, Rirekisho & Job Matching
    if (isBiodataComplete) completedPoints += 35;
    if (isDocsComplete) completedPoints += 25;
    if (studentCV) completedPoints += 25;
    if (myJobApplications.length > 0) completedPoints += 15;
  }
  const overallProgress = Math.min(100, completedPoints);

  // Determine overall status text
  const overallStatusLabel = isIjefStudent
    ? overallProgress >= 85
      ? bilingual('✓ Siap Penuntasan Modul & Evaluasi Kelulusan', '✓ 修了判定・最終評価準備完了')
      : overallProgress >= 50
      ? bilingual('⏳ Dalam Tahap Pembelajaran Modul & Evaluasi', '⏳ モジュール学習・研修進行中')
      : bilingual('📝 Dalam Tahap Orientasi & Pembekalan Awal', '📝 初期研修・ガイダンス進行中')
    : overallProgress >= 85
      ? bilingual('✓ Siap Job Matching & Interview Japan', '✓ 日本企業マッチング・面接準備完了')
      : overallProgress >= 50
      ? bilingual('⏳ Dalam Tahap Kelengkapan Berkas & Dokumen', '⏳ 提出書類・履歴書確認中')
      : bilingual('📝 Dalam Tahap Pengisian Biodata Pendaftaran', '📝 基本情報入力中');

  // Learning Progress Modules Data (Internal Learning & LMS) - ONLY for IJEF students
  const learningModules = [
    {
      id: 1,
      code: 'MODUL 1',
      title: bilingual('Dasar Kana & Aisatsu (Hiragana/Katakana)', 'かな文字・挨拶（ひらがな・カタカナ）'),
      progressPercent: 100,
      score: 92,
      status: bilingual('LULUS', '合格'),
      desc: bilingual('Penguasaan huruf Hiragana, Katakana, dan ucapan salam harian Jepang.', '平仮名・片仮名の習得および日常的な基本挨拶。')
    },
    {
      id: 2,
      code: 'MODUL 2',
      title: bilingual('Minna No Nihongo N5 (Bab 1 - 25)', 'みんなの日本語 N5（第1課〜第25課）'),
      progressPercent: 100,
      score: 88,
      status: bilingual('LULUS', '合格'),
      desc: bilingual('Tata bahasa dasar, kosa kata kerja, dan simulasi percakapan harian.', '基礎文法、基本動詞・語彙、日常会話シミュレーション。')
    },
    {
      id: 3,
      code: 'MODUL 3',
      title: bilingual('Bahasa Jepang N4 & Bank Soal JFT-Basic A2', '日本語N4＆JFT-Basic A2過去問題演習'),
      progressPercent: isPsikotesPassed ? 85 : 60,
      score: psikotes ? Math.min(95, Math.round((psikotes.skorTotal / 50) * 100)) : 82,
      status: bilingual('SEDANG BERLANGSUNG', '学習中'),
      desc: bilingual('Persiapan ujian resmi JFT-Basic A2 / JLPT N4 Tokutei Ginou.', '特定技能試験およびJFT-Basic A2公式試験対策。')
    },
    {
      id: 4,
      code: 'MODUL 4',
      title: bilingual('Keterampilan Teknis Field SSW (Kaigo/Manufaktur)', '特定技能専門分野実務（介護・製造等）'),
      progressPercent: studentCV ? 90 : 70,
      score: 86,
      status: bilingual('SEDANG BERLANGSUNG', '学習中'),
      desc: bilingual('Istilah teknis kerja lapangan di Jepang & prosedur keselamatan OSH.', '現場専門用語、労働安全衛生手順および実技演習。')
    },
    {
      id: 5,
      code: 'MODUL 5',
      title: bilingual('Fisik, Mental, Character Building & Kedisiplinan', '体力・メンタル・規律・合宿生活指導'),
      progressPercent: health?.statusFit === 'FIT' ? 100 : 75,
      score: health?.statusFit === 'FIT' ? 95 : 80,
      status: bilingual('LULUS', '合格'),
      desc: bilingual('Latihan fisik harian, kebiasaan hidup asrama, dan etos kerja Jepang.', '朝の体力トレーニング、寮生活の規律、日本企業の職業倫理。')
    },
    {
      id: 6,
      code: 'MODUL 6',
      title: bilingual('Simulasi Interview Mensetsu & CV Rirekisho JIS', '面接（Mensetsu）演習＆JIS履歴書作成'),
      progressPercent: studentCV ? 95 : 50,
      score: studentCV ? 90 : 75,
      status: studentCV ? bilingual('LULUS', '合格') : bilingual('SEGERA', '準備中'),
      desc: bilingual('Penulisan CV JIS, Jikoshoukai video 1 menit, & wawancara User Jepang.', 'JIS規格履歴書清書、1分間自己紹介動画、企業面接対策。')
    }
  ];

  // Calculate overall learning score average
  const totalLearningScores = learningModules.reduce((acc, m) => acc + m.score, 0);
  const averageLearningScore = Math.round(totalLearningScores / learningModules.length);
  const totalCompletedModules = learningModules.filter((m) => m.progressPercent === 100).length;

  // Dedicated sequential learning stages flow for IJEF students (Online & Offline)
  const learningFlowSteps = [
    {
      step: 1,
      code: 'TAHAP 1',
      title: isIjefOnline
        ? bilingual('Orientasi E-Learning & Platform LMS', '1. LMSオンラインオリエンテーション')
        : bilingual('Orientasi Asrama & Fondasi Kedisiplinan', '1. 入寮オリエンテーション・規律指導'),
      desc: isIjefOnline
        ? bilingual('Aktivasi akun portal belajar LMS, panduan e-learning, jadwal kelas & etika kelas daring.', 'LMS学習ポータルの利用案内、時間割および受講規約の確認。')
        : bilingual('Pembekalan tata tertib asrama LPK IJEF, komitmen belajar, pembagian mentor & adaptasi budaya.', '寮生活の規則説明、学習姿勢の確立、専任講師との顔合わせ。'),
      status: bilingual('Tuntas (100%)', '修了 (100%)'),
      isCompleted: true
    },
    {
      step: 2,
      code: 'TAHAP 2',
      title: bilingual('Bahasa Jepang Dasar Level N5', '2. 基礎日本語（N5水準）'),
      desc: bilingual('Penguasaan huruf Hiragana, Katakana, salam harian, tata bahasa dasar & kosakata asrama.', '平仮名・片仮名の完全習得、基本語彙、日常挨拶および初期文法。'),
      status: bilingual('Tuntas (100%)', '修了 (100%)'),
      isCompleted: true
    },
    {
      step: 3,
      code: 'TAHAP 3',
      title: bilingual('Bahasa Jepang Terapan N4 & JFT-Basic A2', '3. 実用日本語N4＆JFT対策'),
      desc: bilingual('Pemantapan pola kalimat N4, bedah bank soal JFT-Basic A2 & simulasi tryout berkala.', 'N4文型強化、JFT-Basic A2過去問演習および定期模擬テスト。'),
      status: bilingual('Sedang Belajar (75%)', '学習中 (75%)'),
      isCompleted: false
    },
    {
      step: 4,
      code: 'TAHAP 4',
      title: bilingual('Pelatihan Keterampilan Teknis Bidang SSW', '4. 特定技能専門技術研修'),
      desc: isIjefOnline
        ? bilingual('Video interaktif & materi teori kompetensi teknis Kaigo / Manufaktur / Pertanian.', '各特定技能分野（介護・製造・農業等）のオンライン専門講義。')
        : bilingual('Praktik langsung standar kerja Jepang, SOP teknis bidang spesifik & simulasi tugas.', '特定技能分野（介護実技・製造ライン安全基準・農業等）の実地指導。'),
      status: bilingual('Sedang Belajar (60%)', '学習中 (60%)'),
      isCompleted: false
    },
    {
      step: 5,
      code: 'TAHAP 5',
      title: bilingual('Percakapan Intensif (Kaiwa) & Budaya HouRenSo', '5. 集中会話（会話）＆報連相'),
      desc: isIjefOnline
        ? bilingual('Live Zoom Kaiwa interaktif bersama Sensei Native & simulasi wawancara kerja.', 'ネイティブ講師とのオンライン会話演習および面接シミュレーション。')
        : bilingual('Drill percakapan intensif di kelas & asrama, etos HouRenSo dan simulasi Mensetsu.', '実践会話トレーニング、日本企業の報連相ルール習得、模擬面接。'),
      status: bilingual('Akan Datang', '次回予定'),
      isCompleted: false
    },
    {
      step: 6,
      code: 'TAHAP 6',
      title: bilingual('Evaluasi Akhir, Sertifikasi & Transkrip Kelulusan', '6. 総合評価・修了認定'),
      desc: bilingual('Ujian penuntasan modul kompetensi, sertifikasi LPK IJEF & finalisasi kesiapan kerja.', 'モジュール総合修了試験、LPK修了証交付、最終能力評価の確定。'),
      status: bilingual('Akan Datang', '次回予定'),
      isCompleted: false
    }
  ];

  // Filter available job postings (Hanya yang berstatus Aktif / Open)
  const filteredAvailableJobs = jobPostings.filter((job) => {
    if (!isJobActiveAndAvailable(job)) return false;

    const term = jobSearchTerm.toLowerCase();
    const matchesSearch =
      (job.judulPekerjaan || '').toLowerCase().includes(term) ||
      (job.perusahaanJepang || '').toLowerCase().includes(term) ||
      (job.lokasiPrefektur || '').toLowerCase().includes(term);

    const matchesSector =
      jobSectorFilter === 'SEMUA' ||
      (job.judulPekerjaan || '').toLowerCase().includes(jobSectorFilter.toLowerCase());

    return matchesSearch && matchesSector;
  });

  // Handle job application submission
  const handleApplyJob = (job: JobPosting) => {
    const newApp: JobApplication = {
      id: `APP-${Date.now()}`,
      jobId: job.id,
      jobJudul: job.judulPekerjaan,
      perusahaanJepang: job.perusahaanJepang,
      siswaId: studentId || user?.uid || `SISWA-${Date.now()}`,
      namaSiswa: matchedStudent?.namaLengkap || 'Kandidat Siswa',
      emailSiswa: userEmail,
      kategoriKandidat: candidateCategory,
      tanggalLamar: new Date().toISOString().split('T')[0],
      statusLamaran: 'Seleksi Berkas Rirekisho',
      catatanPerusahaan: 'Berkas Rirekisho telah dikirimkan ke HRD Perusahaan Jepang. Menunggu jadwal seleksi interview.'
    };

    saveJobApplication(newApp);
    setApplyingJob(null);
    setToastMessage(
      bilingual(
        `✓ Berhasil melamar lowongan: ${job.judulPekerjaan}! Rirekisho Anda telah dikirim.`,
        `✓ 求人「${job.judulPekerjaan}」への応募が完了しました！`
      )
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Process Hierarchy Timeline Steps
  const hierarchySteps = isIjefStudent
    ? [
        {
          num: 1,
          title: bilingual('Form Registrasi & Demografi', '1. 基本情報・登録フォーム'),
          desc: bilingual('Biodata lengkap, NIK, alamat domisili & pasfoto', '個人情報、NIK、現住所、顔写真'),
          status: isBiodataComplete ? bilingual('Selesai', '完了') : bilingual('Perlu Dilengkapi', '未入力'),
          isCompleted: isBiodataComplete,
          targetTab: 'pendaftaran' as const,
          stepNum: 1
        },
        {
          num: 2,
          title: bilingual('Data Orang Tua / Penjamin', '2. 保護者・緊急連絡先'),
          desc: bilingual('Pekerjaan, kontak darurat & identitas penjamin', '職業、緊急連絡先、保証人情報'),
          status: matchedStudent?.namaAyah ? bilingual('Selesai', '完了') : bilingual('Perlu Dilengkapi', '未入力'),
          isCompleted: Boolean(matchedStudent?.namaAyah),
          targetTab: 'pendaftaran' as const,
          stepNum: 2
        },
        {
          num: 3,
          title: bilingual('Skrining MCU Kesehatan Mandiri', '3. 健康問診・身体測定'),
          desc: bilingual('Pernyataan fisik, TB/BB, bebas TBC & fit test', '身長・体重、結核既往歴、健康状態'),
          status: health ? (health.statusFit === 'FIT' ? bilingual('Lulus (FIT)', '合格（FIT）') : bilingual('Unfit / Evaluasi', '要審査')) : bilingual('Belum Diisi', '未受診'),
          isCompleted: Boolean(health),
          targetTab: 'pendaftaran' as const,
          stepNum: 3
        },
        {
          num: 4,
          title: bilingual('Unggah Berkas & Dokumen', '4. 提出書類・添付ファイル'),
          desc: bilingual('KTP, Kartu Keluarga, Ijazah, Pasfoto & Sertifikat', '身分証、住民票、卒業証書、証明写真'),
          status: `${uploadedDocCount}/5 ${bilingual('Dokumen', '件完了')}`,
          isCompleted: isDocsComplete,
          targetTab: 'pendaftaran' as const,
          stepNum: 4
        },
        {
          num: 5,
          title: bilingual('Asesmen Kepribadian DISC', '5. DISC適性検査'),
          desc: bilingual('24 set pilihan gaya kerja & evaluasi kepribadian', '24問の行動特性および性格評価'),
          status: isDiscComplete ? (lang === 'ja' ? `タイプ ${disc.dominantTrait || disc.dominantType}` : `Profil ${disc.dominantTrait || disc.dominantType}`) : bilingual('Belum Asesmen', '未実施'),
          isCompleted: isDiscComplete,
          targetTab: 'disc' as const,
          stepNum: 1
        },
        {
          num: 6,
          title: bilingual('Ujian Psikotes 50 Soal', '6. 心理適性テスト（50問）'),
          desc: bilingual('Evaluasi kognitif logika, numerik & verbal', '論理・数理・言語能力の総合判定'),
          status: psikotes ? (lang === 'ja' ? `得点 ${psikotes.skorTotal}/50 (${psikotes.statusKelulusan === 'LULUS' ? '合格' : '要追試'})` : `Skor ${psikotes.skorTotal}/50 (${psikotes.statusKelulusan})`) : bilingual('Belum Ujian', '未受験'),
          isCompleted: Boolean(psikotes),
          targetTab: 'psikotes' as const,
          stepNum: 1
        },
        {
          num: 7,
          title: bilingual('Akad Dukungan Dana & Perjanjian LPK', '7. 費用支援・契約合意'),
          desc: bilingual('Pengajuan dana talang & penetapan legalitas akad', '支援融資申請および契約書の法的合意'),
          status: dana ? bilingual('Terdaftar', '合意済') : bilingual('Proses Legalitas', '手続中'),
          isCompleted: Boolean(dana),
          targetTab: 'status' as const,
          stepNum: 1
        },
        {
          num: 8,
          title: bilingual('Rirekisho JIS & Validasi Berkas Siswa', '8. JIS履歴書・生徒書類確認'),
          desc: bilingual('Penyusunan CV standar JIS & verifikasi kelengkapan berkas profil siswa LPK IJEF', 'JIS規格履歴書の確定および生徒プロフィールの公式確認'),
          status: studentCV ? bilingual('CV Terverifikasi', 'CV確認済') : bilingual('Siap Dibuat', '作成可能'),
          isCompleted: Boolean(studentCV),
          targetTab: 'status' as const,
          stepNum: 1
        }
      ]
    : [
        {
          num: 1,
          title: bilingual('Form Registrasi & Demografi', '1. 基本情報・登録フォーム'),
          desc: bilingual('Biodata lengkap, NIK, kontak & alamat domisili', '個人情報、連絡先、現住所'),
          status: isBiodataComplete ? bilingual('Selesai', '完了') : bilingual('Perlu Dilengkapi', '未入力'),
          isCompleted: isBiodataComplete,
          targetTab: 'pendaftaran' as const,
          stepNum: 1
        },
        {
          num: 2,
          title: bilingual('Data Orang Tua / Kontak Darurat', '2. 保護者・緊急連絡先'),
          desc: bilingual('Pekerjaan, alamat & nomor kontak keluarga', '職業、家族の連絡先情報'),
          status: matchedStudent?.namaAyah ? bilingual('Selesai', '完了') : bilingual('Perlu Dilengkapi', '未入力'),
          isCompleted: Boolean(matchedStudent?.namaAyah),
          targetTab: 'pendaftaran' as const,
          stepNum: 2
        },
        {
          num: 3,
          title: bilingual('Unggah Berkas & Dokumen', '3. 提出書類・添付ファイル'),
          desc: bilingual('KTP, Kartu Keluarga, Ijazah, Pasfoto & Sertifikat', '身分証、住民票、卒業証書、修了証'),
          status: `${uploadedDocCount}/5 ${bilingual('Dokumen', '件完了')}`,
          isCompleted: isDocsComplete,
          targetTab: 'pendaftaran' as const,
          stepNum: 4
        },
        {
          num: 4,
          title: bilingual('Pembuatan CV Rirekisho JIS', '4. JIS規格 履歴書作成'),
          desc: bilingual('Penyusunan format resume formal standar perusahaan Jepang', '日本企業基準の公式フォーマット'),
          status: studentCV ? bilingual('CV Siap Kirim', '作成完了') : bilingual('Perlu Dilengkapi', '要入力'),
          isCompleted: Boolean(studentCV),
          targetTab: 'rirekisho' as const,
          stepNum: 1
        },
        {
          num: 5,
          title: bilingual('Katalog Job Matching & Lamaran', '5. 日本企業求人応募'),
          desc: bilingual('Lamar lowongan kerja Tokutei Ginou / Engineering Jepang', '特定技能・技人国求人への直接応募'),
          status: myJobApplications.length > 0 ? (lang === 'ja' ? `${myJobApplications.length}件 応募中` : `${myJobApplications.length} Job Dilamar`) : bilingual('Pilih Lowongan', '求人を選択'),
          isCompleted: myJobApplications.length > 0,
          targetTab: 'job_matching' as const,
          stepNum: 1
        },
        {
          num: 6,
          title: bilingual('Akad & Verifikasi Penempatan', '6. 配属合意・渡航準備'),
          desc: bilingual('Legalitas kontrak kerja dan persiapan keberangkatan Jepang', '雇用契約・ビザ手続および出国準備'),
          status: dana || kontrak ? bilingual('Terverifikasi', '承認済') : bilingual('Proses Verifikasi', '確認中'),
          isCompleted: Boolean(dana || kontrak),
          targetTab: 'status' as const,
          stepNum: 1
        }
      ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-xl border border-emerald-700 shadow-lg flex items-center justify-between text-xs font-bold animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-300 hover:text-white font-black text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 rounded-xl p-3.5 sm:p-4.5 shadow-sm border border-amber-600/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-slate-950/20 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-950/20">
              <LayoutDashboard className="w-3 h-3 text-slate-950 shrink-0" />
              <span>{bilingual('DASHBOARD MONITORING SISWA REAL-TIME', 'リアルタイム進捗モニタリング')}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-950">
              {bilingual(
                `Selamat Datang, ${matchedStudent?.namaLengkap || user?.displayName || 'Kandidat Siswa'}!`,
                `ようこそ、${matchedStudent?.namaLengkap || user?.displayName || '候補生'} さん！`
              )}
            </h1>
            <p className="text-[11px] sm:text-xs font-normal text-slate-900/90 leading-normal">
              {isIjefStudent
                ? bilingual(
                    'Pantau seluruh progres pendaftaran, transkrip nilai proses belajar, hasil tes kesehatan, asesmen DISC, psikotes, serta kesiapan CV Rirekisho JIS Anda secara terpusat dan transparan.',
                    '登録進捗、モジュール学習成績表、健康診断結果、DISC適性検査、心理テスト、JIS規格履歴書（Rirekisho）の準備状況を一元的に確認できます。'
                  )
                : bilingual(
                    'Pantau seluruh progres pendaftaran, kelengkapan berkas dokumen, CV Rirekisho JIS, serta lamaran job matching Jepang Anda secara terpusat dan transparan.',
                    '登録進捗、提出書類、JIS規格履歴書、および日本企業の求人マッチング・応募状況を一元的に確認できます。'
                  )}
            </p>

            {/* Progress Bar Component */}
            <div className="pt-1.5 space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-950">
                <span>{bilingual('Progress Kelengkapan Berkas & Seleksi:', '書類・選考準備の進捗率:')}</span>
                <span className="font-mono">{overallProgress}% {bilingual('Selesai', '完了')}</span>
              </div>
              <div className="w-full h-2 bg-slate-950/20 rounded-full overflow-hidden p-0.5 border border-slate-950/30">
                <div
                  className="h-full bg-slate-950 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-slate-900 pt-0.5 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                <span>{overallStatusLabel}</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Lihat Akun Siswa & Profil Terverifikasi Berdampingan */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-auto shrink-0">
            {/* Kartu: Lihat Akun Siswa */}
            <div className="relative">
              <div className="bg-white p-3 rounded-lg border border-amber-300 text-xs space-y-1.5 min-w-[210px] shadow-2xs text-slate-900">
                <div className="text-[9px] text-amber-800 font-mono font-bold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-amber-600" />
                    <span>{bilingual('Lihat Akun Siswa', '生徒アカウント切替')}</span>
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-[8px] font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    {students.length} Siswa
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-xs truncate flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <span className="truncate">{matchedStudent?.namaLengkap || bilingual('Pilih Siswa...', '生徒選択...')}</span>
                </div>

                <div className="text-[10px] text-slate-600 font-mono truncate">
                  {matchedStudent?.id ? `ID: ${matchedStudent.id}` : '-'}
                </div>

                <div className="pt-0.5 flex flex-col gap-1">
                  <button
                    type="button"
                    id="btn-lihat-akun-siswa"
                    onClick={() => setShowStudentSelector((prev) => !prev)}
                    className="w-full py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[11px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs border border-amber-600/30"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-950" />
                    <span>{bilingual('Pilih / Beralih Siswa', '生徒アカウント切替')}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-950 transition-transform duration-200 ${showStudentSelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Dropdown Menu Modal */}
              {showStudentSelector && (
                <>
                  <div
                    className="fixed inset-0 z-45"
                    onClick={() => setShowStudentSelector(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-amber-400/60 rounded-xl shadow-2xl p-3 text-white text-xs font-sans z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {bilingual('PILIH SISWA UNTUK DILIHAT DI PORTAL:', 'ポータルで表示する生徒を選択:')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {bilingual('Akses instan data & tampilan kandidat', '生徒ごとの画面・ステータスを即時切替')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowStudentSelector(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-md text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div className="pt-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          placeholder={bilingual('Cari nama, ID, atau email...', '氏名・ID・メールで検索...')}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Quick Category Filters */}
                    <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none text-[10px]">
                      {[
                        { id: 'ALL', label: bilingual('Semua', '全て') },
                        { id: 'IJEF_OFFLINE', label: 'IJEF Offline' },
                        { id: 'IJEF_ONLINE', label: 'IJEF Online' },
                        { id: 'NEW_COMER', label: 'New Comer' },
                        { id: 'EX_MAGANG', label: 'Ex-Magang' },
                        { id: 'ENGINEERING', label: 'Engineering' },
                        { id: 'MITRA', label: 'Mitra' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategoryFilter(tab.id)}
                          className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap cursor-pointer transition ${
                            categoryFilter === tab.id
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Students List */}
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                      {filteredStudentsForSelector.length === 0 ? (
                        <div className="py-6 text-center text-slate-500 text-xs">
                          {bilingual('Tidak ada siswa yang sesuai pencarian.', '条件に一致する生徒が見つかりません。')}
                        </div>
                      ) : (
                        filteredStudentsForSelector.map((stu) => {
                          const isSelected = matchedStudent?.id === stu.id;
                          return (
                            <button
                              key={stu.id}
                              type="button"
                              onClick={() => handleSelectStudent(stu.id)}
                              className={`w-full text-left p-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                                  : 'hover:bg-slate-800 text-slate-200 hover:text-white border border-transparent'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-xs truncate flex items-center space-x-1.5">
                                  <span>{stu.namaLengkap}</span>
                                  {isSelected && (
                                    <span className="bg-emerald-500 text-slate-950 text-[8px] font-extrabold px-1 rounded">
                                      AKTIF
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {stu.id} • {stu.kategoriKandidat || 'Siswa'}
                                </div>
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Kartu: Profil Terverifikasi */}
            <div className="bg-white p-3 rounded-lg border border-amber-300 text-xs space-y-1.5 min-w-[210px] shadow-2xs text-slate-900">
              <div className="text-[9px] text-amber-800 font-mono font-bold uppercase tracking-wider">
                {bilingual('Profil Terverifikasi', '認証済アカウント')}
              </div>
              <div className="font-bold text-slate-900 text-xs truncate">
                {matchedStudent?.namaLengkap || bilingual('Nama Belum Diisi', '氏名未登録')}
              </div>
              <div className="text-[10px] text-slate-600 font-mono truncate">
                {matchedStudent?.email || userEmail}
              </div>
              <div className="pt-0.5 flex flex-col gap-1">
                <span className="bg-amber-100 text-amber-900 text-[9px] px-2 py-0.5 rounded font-bold border border-amber-300 text-center">
                  {translateCandidateCategory(candidateCategory, lang)}
                </span>
                <button
                  onClick={() => setShowCVModal(true)}
                  className="w-full py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3 h-3 text-amber-400" />
                  <span>{bilingual('Preview CV Rirekisho JIS', 'JIS履歴書プレビュー')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Status Cards Monitoring */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>{bilingual('Indikator Status & Hasil Evaluasi Siswa', '候補生ステータス＆評価結果インジケーター')}</span>
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {bilingual('Diperbarui Secara Real-time', 'リアルタイム同期中')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Status Form Registrasi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>{bilingual('1. Registrasi & Demografi', '1. 基本情報・登録')}</span>
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                    isBiodataComplete
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {isBiodataComplete ? bilingual('Lengkap', '登録完了') : bilingual('Perlu Dilengkapi', '未完了')}
                </span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {matchedStudent?.namaLengkap || bilingual('Nama Siswa Belum Diisi', '氏名未登録')}
              </div>
              <div className="text-xs text-slate-600 space-y-1 font-mono">
                <div>NIK: <strong className="text-slate-800">{matchedStudent?.noKtp || '-'}</strong></div>
                <div>WA / Tel: <strong className="text-slate-800">{matchedStudent?.noHp || '-'}</strong></div>
                <div className="text-[11px] text-slate-500 truncate">
                  {bilingual('Alamat', '現住所')}: {matchedStudent?.alamatDomisili || bilingual('Belum diisi', '未入力')}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab?.('pendaftaran', 1)}
              className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{isBiodataComplete ? bilingual('Lihat / Edit Biodata', '基本情報を編集') : bilingual('Lengkapi Biodata Sekarang', '基本情報を入力する')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cards ONLY for IJEF Students (MCU, DISC, Psikotes) */}
          {isIjefStudent && (
            <>
              {/* Card 2: Skrining MCU Kesehatan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Stethoscope className="w-4 h-4 text-rose-600" />
                      <span>{bilingual('2. Skrining MCU Kesehatan', '2. 健康診断・問診')}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                        health?.statusFit === 'FIT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : health
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {health ? (health.statusFit === 'FIT' ? bilingual('FIT', '合格') : health.statusFit) : bilingual('Belum Diisi', '未受診')}
                    </span>
                  </div>

                  {health ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900">
                        {bilingual('Status Fit Test:', '判定結果:')} <span className="text-emerald-700">{health.statusFit}</span>
                      </div>
                      <div className="text-slate-600">
                        {bilingual('Tinggi:', '身長:')} <strong>{health.tinggiBadan || 168} cm</strong> | {bilingual('Berat:', '体重:')} <strong>{health.beratBadan || 62} kg</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {bilingual('Bebas TBC:', '結核既往:')} <strong>{health.riwayatTbc === 'Tidak' ? bilingual('Ya (Bebas)', 'なし（良好）') : bilingual('Evaluasi', '要確認')}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2">
                      {bilingual('Belum mengisi lembar skrining kesehatan mandiri.', '健康問診票が未提出です。')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigateToTab?.('pendaftaran', 3)}
                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <span>{health ? bilingual('Lihat / Update MCU', '問診票を確認') : bilingual('Isi Form MCU Mandiri', '問診票を入力')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 3: Asesmen Kepribadian DISC */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span>{bilingual('3. Asesmen DISC', '3. DISC適性検査')}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                        isDiscComplete
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {isDiscComplete ? bilingual('Selesai', '診断済') : bilingual('Belum Tes', '未実施')}
                    </span>
                  </div>

                  {disc ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-purple-900 text-sm">
                        {bilingual('Tipe Profil:', '診断タイプ:')} {disc.dominantTrait || disc.dominantType || 'Teranalisis'}
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-2">
                        {disc.analisisKarakter || bilingual('Evaluasi kepribadian kerja untuk penempatan instansi di Jepang.', '日本企業配置向けの職業適性評価')}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2">
                      {bilingual('Belum mengerjakan 24 set soal asesmen DISC.', '24問のDISC適性検査が未回答です。')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigateToTab?.('disc', 1)}
                  className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <span>{disc ? bilingual('Lihat Hasil DISC', 'DISC結果を見る') : bilingual('Mulai Asesmen DISC', 'DISC診断を開始')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 4: Ujian Psikotes 50 Soal */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                      <span>{bilingual('4. Psikotes 50 Soal', '4. 心理適性テスト')}</span>
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                        isPsikotesPassed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : psikotes
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {psikotes ? (psikotes.statusKelulusan === 'LULUS' ? bilingual('LULUS', '合格') : bilingual('REMIDI', '要追試')) : bilingual('Belum Tes', '未受験')}
                    </span>
                  </div>

                  {psikotes ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <div className="font-bold text-slate-900 text-sm">
                        {bilingual('Skor Akhir:', '総合スコア:')} <span className="text-indigo-700 font-mono text-base">{psikotes.skorTotal}</span> / 50
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {bilingual('Logika:', '論理:')} <strong>{psikotes.skorLogika || 0}</strong> | {bilingual('Kuantitatif:', '数理:')} <strong>{psikotes.skorKuantitatif || 0}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic py-2">
                      {bilingual('Belum mengerjakan ujian psikotes 50 soal online.', '50問の心理適性テストが未受験です。')}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onNavigateToTab?.('psikotes', 1)}
                  className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
                >
                  <span>{psikotes ? bilingual('Lihat Hasil Psikotes', '結果を確認') : bilingual('Mulai Ujian Psikotes', 'テストを開始')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* Card: Dokumen & Berkas */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>{isIjefStudent ? bilingual('5. Dokumen Berkas', '5. 提出書類・添付') : bilingual('2. Unggah Dokumen & Berkas', '2. 提出書類・添付')}</span>
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                    isDocsComplete
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {uploadedDocCount}/5 {bilingual('Dokumen', '件完了')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{bilingual('KTP Siswa:', '身分証 (KTP):')}</span>
                  <span className={berkas.ktp ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {berkas.ktp ? bilingual('✓ Ada', '✓ 済') : bilingual('Belum', '未')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{bilingual('Kartu Keluarga:', '住民票 (KK):')}</span>
                  <span className={berkas.kk ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {berkas.kk ? bilingual('✓ Ada', '✓ 済') : bilingual('Belum', '未')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{bilingual('Ijazah Terakhir:', '卒業証書 (Ijazah):')}</span>
                  <span className={berkas.ijazah ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                    {berkas.ijazah ? bilingual('✓ Ada', '✓ 済') : bilingual('Belum', '未')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab?.('pendaftaran', 4)}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
            >
              <span>{bilingual('Unggah Dokumen Berkas', '書類をアップロード')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card: CV Rirekisho JIS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <FileTextIcon className="w-4 h-4 text-indigo-600" />
                  <span>{isIjefStudent ? bilingual('6. CV Rirekisho JIS', '6. JIS規格 履歴書') : bilingual('3. CV Rirekisho JIS', '3. JIS規格 履歴書')}</span>
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border ${
                    studentCV
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {studentCV ? bilingual('Siap', '作成済') : bilingual('Belum', '未作成')}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <div className="font-bold text-indigo-900">
                  {studentCV ? studentCV.namaLengkap : bilingual('Belum Mengisi Rirekisho', '履歴書データ未入力')}
                </div>
                <div className="text-slate-600">
                  {bilingual('Bidang:', '専門分野:')} <strong>{studentCV?.bidangKerja || 'Kaigo / Manufaktur'}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  {bilingual('Video Jikoshoukai:', '自己紹介動画:')}{' '}
                  <strong className={studentCV?.videoUrl ? 'text-emerald-700' : 'text-slate-500'}>
                    {studentCV?.videoUrl ? bilingual('Tersedia', 'あり') : bilingual('Dalam Proses', '準備中')}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <button
                onClick={() => setShowCVModal(true)}
                className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>{bilingual('Preview CV', 'プレビュー')}</span>
              </button>

              <button
                onClick={() => onNavigateToTab?.('rirekisho', 1)}
                className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{bilingual('Edit CV', '編集')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card: Job Matching (Only for Non-IJEF) */}
          {!isIjefStudent && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>{bilingual('4. Job Matching Japan', '4. 日本企業求人応募')}</span>
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase border bg-amber-100 text-amber-800 border-amber-300">
                    {myJobApplications.length} {bilingual('Lamaran', '件応募')}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">
                    {myJobApplications.length > 0
                      ? myJobApplications[0].jobJudul
                      : bilingual('Belum Ada Job Dilamar', '応募中の求人はありません')}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {myJobApplications.length > 0
                      ? (lang === 'ja' ? `選考状況: ${myJobApplications[0].statusLamaran}` : `Status: ${myJobApplications[0].statusLamaran}`)
                      : bilingual('Pilih lowongan di katalog job untuk langsung melamar ke HRD Jepang.', '特定技能求人カタログから希望の職種へ応募してください。')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab?.('job_matching', 1)}
                className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
              >
                <span>{bilingual('Katalog Job Matching Japan', '求人カタログを見る')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: PROSES BELAJAR, NILAI & PROGRESS SISWA - STRICTLY SHOWN FOR IJEF STUDENTS ONLY */}
      {isIjefStudent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 mb-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>{bilingual('AKADEMIK & EVALUASI PROSES BELAJAR', '学業・モジュール学習進捗評価')}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {bilingual('Tahap Proses Belajar, Transkrip Nilai & Capaian Modul', '学習進捗段階・成績表・モジュール習得状況')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {bilingual(
                  'Pantau perkembangan nilai ujian, progres modul pelatihan bahasa Jepang, keterampilan teknis SSW, serta evaluasi fisik & asrama.',
                  '日本語学習モジュール、特定技能技術習得、体力・生活指導の評価結果を確認できます。'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">{bilingual('Rata-rata Nilai Belajar', '平均評価点')}</div>
                <div className="text-xl font-black text-indigo-700 font-mono">{averageLearningScore} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">{bilingual('Modul Tuntas', '修了モジュール')}</div>
                <div className="text-xl font-black text-emerald-700 font-mono">{totalCompletedModules} <span className="text-xs text-slate-500 font-normal">/ 6 {bilingual('Modul', 'モジュール')}</span></div>
              </div>
            </div>
          </div>

          {/* Learning Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 border border-indigo-900/50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold font-mono">
                <BookOpen className="w-4 h-4" />
                <span>{bilingual('STATUS TAHAP BELAJAR SAAT INI', '現在の学習・育成段階')}</span>
              </div>
              <div className="text-base font-bold text-white">
                {bilingual(
                  isIjefOnline
                    ? 'Program Pelatihan Daring & LMS Intensif Tokutei Ginou Japan'
                    : 'Program Pelatihan Asrama & Intensif Tokutei Ginou Japan',
                  isIjefOnline
                    ? '特定技能 日本就労オンライン・LMS集中育成プログラム'
                    : '特定技能 日本就労合宿＆集中育成プログラム'
                )}
              </div>
              <p className="text-xs text-slate-300">
                {bilingual(
                  'Target Kompetensi: JFT-Basic A2 / JLPT N4 + Sertifikasi Keahlian SSW Field + Kemampuan Mensetsu User Jepang.',
                  '目標水準: JFT-Basic A2 / JLPT N4 ＋ 各専門分野の技能試験合格 ＋ 日本企業面接対策。'
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shrink-0 shadow-md">
              <TrendingUp className="w-4 h-4" />
              <span>{bilingual('Indeks Kelulusan: SANGAT BAIK (A)', '総合評価: 優良（A評価）')}</span>
            </div>
          </div>

          {/* PETA ALUR PROSES PEMBELAJARAN SISWA IJEF */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-900 uppercase font-mono tracking-wider">
                    {bilingual(
                      isIjefOnline
                        ? 'Alur Proses Pembelajaran Siswa IJEF (Online / LMS & Kelas Daring)'
                        : 'Alur Proses Pembelajaran Siswa IJEF (Offline / Program Asrama & Tatap Muka)',
                      isIjefOnline
                        ? 'IJEFオンライン生（LMS＆Live授業）学習プロセス・フロー'
                        : 'IJEF公式合宿生（対面・寮生活）学習プロセス・フロー'
                    )}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {bilingual(
                    'Tahapan kronologis kurikulum terstruktur LPK IJEF CORP untuk mencapai kompetensi kerja di Jepang.',
                    '日本就労に向けたLPK IJEF CORPの体系的カリキュラム進捗フローです。'
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg">
                  {isIjefOnline ? bilingual('Moda: Daring / E-Learning', '形式: オンライン・LMS') : bilingual('Moda: Asrama LPK IJEF', '形式: 対面合宿・実地')}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {bilingual('Total: 6 Tahapan', '全6段階')}
                </span>
              </div>
            </div>

            {/* Visual Roadmap Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {learningFlowSteps.map((flow) => (
                <div
                  key={flow.step}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                    flow.isCompleted
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                      : flow.status.includes('Sedang') || flow.status.includes('学習中')
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-400/20 shadow-2xs'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-black font-mono px-2 py-0.5 rounded ${
                          flow.isCompleted
                            ? 'bg-emerald-600 text-white'
                            : flow.status.includes('Sedang') || flow.status.includes('学習中')
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {flow.code}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          flow.isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : flow.status.includes('Sedang') || flow.status.includes('学習中')
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {flow.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{flow.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{flow.desc}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">{bilingual('Status Kurikulum', 'カリキュラム状況')}</span>
                    <span
                      className={`font-bold ${
                        flow.isCompleted
                          ? 'text-emerald-700'
                          : flow.status.includes('Sedang') || flow.status.includes('学習中')
                          ? 'text-indigo-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {flow.isCompleted
                        ? bilingual('✓ Selesai', '✓ 修了済')
                        : flow.status.includes('Sedang') || flow.status.includes('学習中')
                        ? bilingual('⚡ Aktif Berjalan', '⚡ 進行中')
                        : bilingual('⏳ Tahap Lanjutan', '⏳ 次期')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modul Pelatihan Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
              {bilingual('Modul Pelatihan & Transkrip Capaian Pembelajaran (1 - 6)', '育成モジュール＆成績表（1〜6）')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningModules.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:border-indigo-300 transition shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {mod.code}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${
                        mod.status === 'LULUS' || mod.status === '合格'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : mod.status === 'SEDANG BERLANGSUNG' || mod.status === '学習中'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{mod.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{mod.desc}</p>

                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">{bilingual('Progres Modul:', '進捗率:')}</span>
                      <span className="font-mono text-indigo-700">{mod.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${mod.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 pt-1">
                      <span>{bilingual('Nilai Evaluasi:', '評価得点:')}</span>
                      <span className="text-emerald-700 font-bold">{mod.score} / 100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matrix Metrics Nilai Tes Akademik & Kesehatan / Persiapan Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-1.5">
              <div className="text-[10px] font-bold text-indigo-800 font-mono uppercase">
                {bilingual('Hasil Psikotes 50 Soal', '心理適性テスト（50問）結果')}
              </div>
              <div className="text-lg font-black text-indigo-950 font-mono">
                {psikotes ? `${psikotes.totalCorrect ?? psikotes.skorTotal ?? 42} / 50` : bilingual('Belum Ujian', '未受験')}
              </div>
              <div className="text-[11px] text-indigo-900 space-y-0.5">
                <div>
                  {bilingual('Logika:', '論理:')} <strong>{psikotes?.categoryBreakdown?.logikaMatematika ?? psikotes?.skorLogika ?? 0}/15</strong> | {bilingual('Kuantitatif:', '数理:')} <strong>{psikotes?.categoryBreakdown?.penalaranSpasial ?? psikotes?.skorKuantitatif ?? 0}/15</strong>
                </div>
                <div>
                  {bilingual('Verbal:', '言語:')} <strong>{psikotes?.categoryBreakdown?.penalaranVerbal ?? psikotes?.skorVerbal ?? 0}/20</strong>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-1.5">
              <div className="text-[10px] font-bold text-purple-800 font-mono uppercase">
                {bilingual('Hasil Asesmen DISC', 'DISC適性検査結果')}
              </div>
              <div className="text-lg font-black text-purple-950">
                {disc?.dominantType || disc?.dominantTrait || (isDiscComplete ? bilingual('Teranalisis', '診断済') : bilingual('Belum Asesmen', '未実施'))}
              </div>
              <p className="text-[11px] text-purple-900 line-clamp-2">
                {disc?.analisisKarakter || bilingual('Evaluasi kepribadian kerja untuk penempatan instansi di Jepang.', '日本企業配置向けの職業適性評価')}
              </p>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-1.5">
              <div className="text-[10px] font-bold text-emerald-800 font-mono uppercase">
                {bilingual('Hasil MCU & Ketahanan Fisik', '健康問診・身体測定')}
              </div>
              <div className="text-lg font-black text-emerald-950">
                {health ? (health.statusFit === 'FIT' ? bilingual('FIT', '合格 (FIT)') : health.statusFit) : bilingual('Belum Skrining', '未受診')}
              </div>
              <div className="text-[11px] text-emerald-900 space-y-0.5">
                <div>
                  {bilingual('TB/BB:', '身長/体重:')} <strong>{health?.tinggiBadan || '-'} cm / {health?.beratBadan || '-'} kg</strong>
                </div>
                <div>
                  {bilingual('Status Paru:', '結核:')} <strong>{health?.riwayatTbc === 'Tidak' ? bilingual('Bebas TBC', '良好（陰性）') : bilingual('Evaluasi Medis', '要確認')}</strong>
                </div>
              </div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1.5">
              <div className="text-[10px] font-bold text-amber-800 font-mono uppercase">
                {bilingual('Nilai Tryout JFT-Basic A2', 'JFT-Basic A2 模擬試験')}
              </div>
              <div className="text-lg font-black text-amber-950 font-mono">
                215 / 250 <span className="text-xs text-emerald-700 font-bold">({bilingual('LULUS', '合格基準達成')})</span>
              </div>
              <p className="text-[11px] text-amber-900">
                {bilingual(
                  'Memenuhi syarat kelulusan ambang batas minimal Tokutei Ginou Kaigo / Manufaktur.',
                  '特定技能（介護・製造・外食・農業等）の最低合格水準を満たしています。'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LIST JOB AVAILABLE & STATUS LAMARAN SISWA (NON-IJEF / MITRA / EX-MAGANG ONLY) */}
      {!isIjefStudent && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold border border-amber-300 mb-1.5">
                <Briefcase className="w-4 h-4 text-amber-700" />
                <span>{bilingual('LOWONGAN KERJA JEPANG & MATCHING STATUS', '日本企業求人・マッチングステータス')}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {bilingual('Katalog Job Available & Status Lamaran Kerja Jepang', '日本求人カタログ ＆ 応募選考進捗')}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {bilingual(
                  'Pilih lowongan kerja resmi Tokutei Ginou, Engineering (Gijinkoku), & Ex-Magang Jepang dan pantau progres lamaran Anda.',
                  '特定技能・技人国・元実習生向けの公式求人を選択し、選考進捗を確認できます。'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {myJobApplications.some((a) => a.statusLamaran.includes('Lolos') || a.statusLamaran.includes('Naitei') || a.statusLamaran.includes('Visa') || a.statusLamaran.includes('COE')) ? (
                <span className="bg-purple-100 text-purple-900 border border-purple-300 text-xs px-3 py-1.5 rounded-xl font-black flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-700" />
                  <span>{bilingual('🟣 Status: Lolos Naitei / Proses Visa COE', '🟣 内定獲得 / ビザ・COE申請中')}</span>
                </span>
              ) : myJobApplications.some((a) => a.statusLamaran.includes('Terjadwal') || a.statusLamaran.includes('Interview')) ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1.5 rounded-xl font-black flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{bilingual('🟡 Status: Terjadwal Interview (Wawancara Aktif)', '🟡 面接選考中（Interview）')}</span>
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{bilingual('🟢 Status: Siap Matching Job Jepang', '🟢 求人待機中（マッチング可能）')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Status Lamaran Aktif Mahasiswa */}
          {myJobApplications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                {bilingual('Status Lamaran Aktif Anda', '現在応募中の求人選考ステータス')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myJobApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{app.jobJudul}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
                        {app.statusLamaran}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>{getSanitizedCompany({ perusahaanJepang: app.perusahaanJepang }, lang)}</span>
                      <span className="text-[11px] font-mono text-slate-500">{app.tanggalLamar}</span>
                    </div>
                    {app.catatanPerusahaan && (
                      <p className="text-[11px] text-indigo-900 bg-white p-2.5 rounded-lg border border-indigo-100 leading-relaxed">
                        ℹ️ {app.catatanPerusahaan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Jobs Catalog */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">
                {bilingual('Daftar Lowongan Kerja Jepang Tersedia', '募集中の日本企業求人一覧')}
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={bilingual('Cari job, bidang, atau prefektur...', '求人・職種・勤務地で検索...')}
                    value={jobSearchTerm}
                    onChange={(e) => setJobSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-slate-900"
                  />
                </div>

                <select
                  value={jobSectorFilter}
                  onChange={(e) => setJobSectorFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="SEMUA">{bilingual('Semua Bidang Pekerjaan', '全専門分野')}</option>
                  <option value="Kaigo">{bilingual('Kaigo / Keperawatan', '介護分野')}</option>
                  <option value="Manufaktur">{bilingual('Manufaktur / Pengolahan', '製造・食品加工')}</option>
                  <option value="Pertanian">{bilingual('Pertanian / Agriculture', '農業分野')}</option>
                  <option value="Konstruksi">{bilingual('Konstruksi / Bangunan', '建設分野')}</option>
                  <option value="Hotel">{bilingual('Hospitality / Perhotelan', '外食・宿泊')}</option>
                </select>
              </div>
            </div>

            {/* Job Postings Grid */}
            {filteredAvailableJobs.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
                {bilingual(`Tidak ada lowongan kerja yang cocok dengan pencarian "${jobSearchTerm}".`, `「${jobSearchTerm}」に一致する求人は見つかりませんでした。`)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableJobs.map((job) => {
                  const hasApplied = myJobApplications.some((app) => app.jobId === job.id);
                  const displayTitle = getSanitizedJobTitle(job, lang);
                  const displayCompany = getSanitizedCompany(job, lang);
                  const displayPrefecture = formatPrefecture(job.lokasiPrefektur, lang);
                  const displayQual = formatQualification(job.persyaratanJLPT, lang);

                  return (
                    <div
                      key={job.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              {job.kodeJob || `JOB-${job.id.substring(0, 5)}`}
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Aktif
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {bilingual(`Quota: ${job.kuotaSiswa || 5} Siswa`, `募集枠: ${job.kuotaSiswa || 5}名`)}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 leading-snug">
                          {displayTitle}
                        </h4>

                        <div className="space-y-1 text-xs text-slate-600">
                          <div className="flex items-start space-x-1.5 text-xs text-slate-800 font-bold">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span className="break-words leading-snug" title={displayCompany}>{displayCompany}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{bilingual('Prefektur:', '勤務地:')} <strong>{displayPrefecture}</strong></span>
                          </div>

                          <div className="flex items-center space-x-1 text-slate-900 font-mono font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              ¥{job.gajiBulananYen ? job.gajiBulananYen.toLocaleString('ja-JP') : '190,000'} / {bilingual('Bln', '月')} (~Rp {job.gajiEstimasiIdr ? (job.gajiEstimasiIdr / 1000000).toFixed(1) : '20.5'} Jt)
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 pt-1">
                            {bilingual('Syarat Bahasa:', '必要資格:')} <strong className="text-slate-800">{displayQual}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingDetailJob(job)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{bilingual('Detail', '詳細')}</span>
                        </button>

                        {hasApplied ? (
                          <div className="flex-1 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>{bilingual('Sudah Dilamar', '応募済')}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setApplyingJob(job)}
                            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{bilingual('Lamar Pekerjaan Ini', '応募する')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hirarki Alur & Tahapan Proses SIM Siswa */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-600" />
              <span>
                {bilingual(
                  isIjefStudent
                    ? 'Alur Administrasi & Verifikasi Berkas Siswa IJEF'
                    : 'Hirarki Alur Penempatan Kerja & Direct Matching Non-IJEF',
                  isIjefStudent
                    ? 'IJEF公式生 事務手続・書類検証フロー'
                    : 'SIM 候補生選考・配置プロセス フロー'
                )}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {bilingual(
                isIjefStudent
                  ? 'Sistematisasi tahapan administrasi berkas, penjamin, skrining kesehatan, dan legalitas siswa LPK IJEF CORP.'
                  : 'Sistematisasi alur perjalanan kandidat LPK IJEF CORP dari registrasi hingga penempatan kerja ke Jepang.',
                '初期登録から日本での就労・配属までの公式フローです。'
              )}
            </p>
          </div>

          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            {bilingual('Standard Operating Procedure LPK IJEF', '公式運用基準（SOP）')}
          </span>
        </div>

        {/* Vertical / Grid Flow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {hierarchySteps.map((step) => (
            <div
              key={step.num}
              className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                step.isCompleted
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                      step.isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      step.isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{step.desc}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab?.(step.targetTab, step.stepNum)}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center space-x-1 cursor-pointer pt-1 transition"
              >
                <span>{bilingual(`Buka Tahap ${step.num}`, `ステップ ${step.num} を開く`)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notice & Guidance Box for Students */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold font-mono">
            <HelpCircle className="w-4 h-4" />
            <span>{bilingual('PETUNJUK & PANDUAN PENTING KANDIDAT', '候補生向けサポート・案内')}</span>
          </div>
          <h3 className="text-sm font-bold text-white">
            {isIjefStudent
              ? bilingual('Punya pertanyaan seputar materi modul pembelajaran atau jadwal kelas?', '学習モジュールや授業日程についてご質問がありますか？')
              : bilingual('Punya pertanyaan mengenai kelengkapan berkas atau jadwal interview?', '提出書類や面接日程についてご質問がありますか？')}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isIjefStudent
              ? bilingual(
                  'Tim Sensei & Layanan Siswa LPK IJEF CORP siap mendampingi progres pembelajaran modul, evaluasi akademik, serta administrasi berkas Anda setiap hari kerja.',
                  'LPK IJEF CORPの専任講師・サポートチームが、日々の学習指導および進捗管理を丁寧にサポートいたします。'
                )
              : bilingual(
                  'Tim Layanan Siswa LPK IJEF CORP siap membantu proses verifikasi dokumen dan pengajuan job matching Jepang Anda setiap jam kerja kantor.',
                  'LPK IJEF CORPのサポートチームが、書類の審査および日本企業とのマッチングを迅速に対応いたします。'
                )}
          </p>
        </div>

        <button
          onClick={() => setShowCVModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shrink-0 shadow-md flex items-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>{bilingual('Buka Preview CV Rirekisho', 'JIS履歴書プレビュー')}</span>
        </button>
      </div>

      {/* Structured Job Detail Modal */}
      {viewingDetailJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                    {viewingDetailJob.kodeJob || 'JOB'}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      viewingDetailJob.statusJob === 'Tutup'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {viewingDetailJob.statusJob === 'Tutup' ? 'Close' : 'Aktif'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black mt-1 text-white">
                  {getSanitizedJobTitle(viewingDetailJob, lang)}
                </h3>
                <p className="text-xs text-slate-300">
                  {getSanitizedCompany(viewingDetailJob, lang)} • {formatPrefecture(viewingDetailJob.lokasiPrefektur, lang)}
                </p>
              </div>
              <button
                onClick={() => setViewingDetailJob(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Structured Job Description Categorized View */}
              <JobDescriptionCategorizedView job={viewingDetailJob} lang={lang} isStudentView={true} />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => setViewingDetailJob(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {bilingual('Tutup', '閉じる')}
              </button>

              <button
                onClick={() => {
                  const job = viewingDetailJob;
                  setViewingDetailJob(null);
                  setApplyingJob(job);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{bilingual('Lamar Pekerjaan Ini', 'この求人に応応募する')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Job Confirmation Modal */}
      {applyingJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <Briefcase className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">
                  {bilingual('Konfirmasi Melamar Pekerjaan', '求人応募の確認')}
                </h3>
              </div>
              <button
                onClick={() => setApplyingJob(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 font-bold text-slate-900">
                {getSanitizedJobTitle(applyingJob, lang)}
              </div>

              <div className="space-y-1 text-slate-600">
                <div>{bilingual('Perusahaan:', '受入企業:')} <strong className="text-slate-900">{getSanitizedCompany(applyingJob, lang)}</strong></div>
                <div>{bilingual('Lokasi:', '勤務地:')} <strong className="text-slate-900">{formatPrefecture(applyingJob.lokasiPrefektur, lang)}</strong></div>
                <div>{bilingual('Gaji Bulanan:', '月額給与:')} <strong className="text-amber-800">¥{applyingJob.gajiBulananYen?.toLocaleString('ja-JP')} / {bilingual('Bln', '月')}</strong></div>
              </div>

              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                {bilingual(
                  'Dengan menekan tombol di bawah, Rirekisho JIS dan data akademis Anda akan langsung dikirimkan ke HRD Perusahaan Jepang untuk proses verifikasi.',
                  '「応募を送信する」をクリックすると、あなたのJIS規格履歴書が日本企業の採用担当者へ直接提出されます。'
                )}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setApplyingJob(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {bilingual('Batal', 'キャンセル')}
              </button>
              <button
                onClick={() => handleApplyJob(applyingJob)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{bilingual('Kirim Lamaran Sekarang', '応募を送信する')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student CV Modal */}
      {showCVModal && (
        <StudentCVModal
          student={matchedStudent}
          onClose={() => setShowCVModal(false)}
        />
      )}
    </div>
  );
};

// Helper for FileTextIcon
const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <path d="M10 9H8"/>
    <path d="M16 13H8"/>
    <path d="M16 17H8"/>
  </svg>
);
