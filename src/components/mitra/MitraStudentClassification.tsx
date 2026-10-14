import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { CalonSiswa, CVRirekisho, JobPosting, JobApplication, HasilKesehatan } from '../../types';
import { StudentCVModal } from '../StudentCVModal';
import { MitraApplyJobModal } from './MitraApplyJobModal';
import { StudentPhotoBadge } from '../StudentPhotoBadge';
import { CandidateDashboardStatistics, isCandidateSiapMatching } from '../cvportal/CandidateDashboardStatistics';
import { getStudentPhotoUrl, handleStudentImageError } from '../../utils/studentPhotoHelper';
import {
  isJobActiveAndAvailable,
  isCandidateReadyForMatching,
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  translateCandidateCategory,
  translateProgressStatus,
  translateSector,
  normalizeCandidateSector
} from '../../utils/mitraJobUtils';
import {
  Users,
  Search,
  CheckCircle2,
  FileText,
  Send,
  Eye,
  Briefcase,
  ShieldCheck,
  UserCheck,
  HeartPulse,
  ArrowRight,
  UserPlus,
  RefreshCw,
  ZoomIn,
  Maximize2,
  ExternalLink,
  X,
  User,
  Video,
  Play,
  Languages
} from 'lucide-react';

export const MitraStudentClassification: React.FC = () => {
  const { user } = useAuth();
  const {
    students,
    rirekishoRecords,
    jobPostings,
    jobApplications,
    healthRecords,
    discRecords,
    psikotesRecords,
    saveStudentRegistration,
    saveRirekishoRecord,
    saveMitraSubmission,
    lang: appLang = 'id',
    setLang: setAppLang
  } = useApp();

  const [lang, setLang] = useState<'id' | 'ja'>(appLang);

  useEffect(() => {
    setLang(appLang);
  }, [appLang]);

  const handleToggleLang = (newLang: 'id' | 'ja') => {
    setLang(newLang);
    if (setAppLang) setAppLang(newLang);
  };

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Mandiri Indonesia';
  const mitraId = user?.mitraId || 'MTR-2026-088';

  // State filters
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [filterReadiness, setFilterReadiness] = useState<'ALL' | 'READY_MATCH' | 'INTERVIEW_STAGE' | 'NAITEI'>('ALL');
  const [selectedSpecificStatus, setSelectedSpecificStatus] = useState<string>('Semua');
  const [selectedGender, setSelectedGender] = useState<string>('Semua');
  const [viewLayout, setViewLayout] = useState<'CARD' | 'TABLE'>('CARD');

  // Modals
  const [selectedStudentForCV, setSelectedStudentForCV] = useState<CalonSiswa | null>(null);
  const [selectedCVRecord, setSelectedCVRecord] = useState<CVRirekisho | undefined>(undefined);
  const [selectedJobToApply, setSelectedJobToApply] = useState<{ job: JobPosting; studentId: string } | null>(null);
  const [studentToPickJobFor, setStudentToPickJobFor] = useState<{ id: string; name: string; sector: string } | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [previewPhotoZoom, setPreviewPhotoZoom] = useState<{ url: string; name: string } | null>(null);
  const [previewVideoModal, setPreviewVideoModal] = useState<{ url: string; name: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Student Modal Form State
  const [newStudentForm, setNewStudentForm] = useState({
    namaLengkap: '',
    email: '',
    noHp: '',
    kategoriKandidat: 'SISWA MITRA / NON IJEF',
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    bidangKerja: 'KAIGO',
    levelBahasa: 'N4',
    domisili: 'Bandung, Jawa Barat',
    pendidikanTerakhir: 'SMK / Sederajat',
    pengalaman: 'Pelatihan bahasa Jepang & keahlian bidang 6 bulan.',
    sertifikatSSW: true,
    pasporReady: true
  });

  // Translations dictionary for Mitra Classification
  const t = {
    id: {
      badge: 'Klasifikasi Sektor Kerja Terpadu • Mitra SIM-SB',
      headerTitle: 'Database Siswa Berdasarkan Klasifikasi Bidang Kerja',
      headerDesc:
        'Katalog seluruh siswa binaan yang dikelompokkan secara terstruktur berdasarkan spesialisasi bidang kerja Tokutei Ginou, level sertifikasi bahasa, dan kesiapan berkas untuk matching ke perusahaan Jepang.',
      addStudentBtn: 'Tambah Siswa Binaan Baru',
      allSectors: 'Semua Sektor',
      sectorKaigo: 'Kaigo',
      sectorPM: 'Pengolahan Makanan',
      sectorPertanian: 'Pertanian',
      sectorManufaktur: 'Manufaktur',
      sectorEngineering: 'Engineer',
      sectorKonstruksi: 'Konstruksi',
      sectorLainnya: 'Lainnya & Cleaning',
      waitingJob: 'Menunggu Job',
      interview: 'Interview',
      naitei: 'Lolos Naitei',
      allPipeline: 'Semua Status Pipeline',
      activePoolBadge: 'Database Siswa Siap Matching (Terverifikasi LPK)',
      totalCountLabel: 'Total',
      studentsUnit: 'Siswa',
      searchPlaceholder: 'Cari nama siswa, bidang kerja, domisili...',
      allLangOption: '🇯🇵 Semua Level Bahasa',
      filterReadyMatch: '✨ Siap Matching / Menunggu Job',
      filterInterview: '🎙️ Terjadwal Interview',
      filterNaitei: '🎉 Lolos Naitei / Proses Visa COE',
      viewCard: 'Tampilan Kartu',
      viewTable: 'Tampilan Tabel',
      showingText: 'Menampilkan',
      resetFilter: 'Reset Filter',
      emptyTitle: 'Tidak ada siswa yang sesuai filter',
      emptyDesc: 'Silakan reset filter atau tambahkan siswa binaan baru ke dalam sistem mitra.',
      langLevel: 'Level Bahasa:',
      studentCategory: 'Kategori Siswa:',
      appliedCount: 'Lamaran',
      mcuFit: 'MCU Fit',
      mcuNote: 'MCU Catatan',
      mcuProcess: 'MCU Proses',
      mcuUnfit: 'MCU Unfit',
      mcuNone: 'Belum MCU',
      profileBtn: 'Lihat Profil & Jikoshoukai',
      applyJobBtn: 'Daftarkan ke Job',
      videoJikoshoukai: 'Video Jikoshoukai',
      videoReady: 'Video Ready',
      noVideo: 'Dalam Pembekalan Video',
      videoModalTitle: 'Video Jikoshoukai Kandidat',
      openVideoExternal: 'Buka di Tab Baru',
      closeVideo: 'Tutup Video',
      tblName: 'Nama Siswa (Foto 4×6)',
      tblSector: 'Bidang Kerja',
      tblLang: 'Level Bahasa',
      tblDomAge: 'Domisili / Usia',
      tblProgress: 'Status Progress',
      tblActiveApps: 'Lamaran Aktif',
      tblAction: 'Aksi',
      tblViewProfile: 'Profil',
      tblApplyJob: 'Daftar Job',
      toastCreated: 'Berhasil mendaftarkan siswa baru ke dalam database!',
      yearsOld: 'thn',
      photoSize: '4×6',
      zoomPhotoTitle: 'Klik untuk melihat Pas Foto 4×6'
    },
    ja: {
      badge: '特定技能分野別候補者統合データベース • パートナー管理',
      headerTitle: '分野別 候補者分類・管理データベース',
      headerDesc:
        '特定技能・技能実習の各専門分野、日本語レベル、自己紹介および各種審査完了状況に基づき体系的に分類された候補生カタログです。',
      addStudentBtn: '新規候補生を登録する',
      allSectors: '全専門分野',
      sectorKaigo: '介護分野',
      sectorPM: '食品製造',
      sectorPertanian: '農業分野',
      sectorManufaktur: '機械製造',
      sectorEngineering: 'エンジニア',
      sectorKonstruksi: '建設分野',
      sectorLainnya: 'その他・清掃',
      waitingJob: '求人待機中',
      interview: '面接選考中',
      naitei: '内定獲得済',
      allPipeline: '全パイプライン',
      activePoolBadge: '企業マッチング可能 候補生データベース（LPK審査完了）',
      totalCountLabel: '総数',
      studentsUnit: '名',
      searchPlaceholder: '候補者名、専門分野、出身地で検索...',
      allLangOption: '🇯🇵 全日本語レベル',
      filterReadyMatch: '✨ マッチング可能 / 求人待機中',
      filterInterview: '🎙️ 企業面接調整・選考中',
      filterNaitei: '🎉 内定・ビザ申請手続中',
      viewCard: 'カード表示',
      viewTable: 'テーブル表示',
      showingText: '表示中',
      resetFilter: '条件をリセット',
      emptyTitle: '該当する候補生が見つかりません',
      emptyDesc: '検索条件をリセットするか、新規候補生を登録してください。',
      langLevel: '日本語レベル:',
      studentCategory: '区分:',
      appliedCount: '応募',
      mcuFit: '健康診断 合格',
      mcuNote: '健康診断 条件付',
      mcuProcess: '健康診断 審査中',
      mcuUnfit: '健康診断 不合格',
      mcuNone: '未受診',
      profileBtn: '自己紹介・プロフィール',
      applyJobBtn: '求人へ推薦・応募',
      videoJikoshoukai: '自己紹介動画',
      videoReady: '動画あり',
      noVideo: '動画準備中',
      videoModalTitle: '候補者 自己紹介動画',
      openVideoExternal: '別タブで開く',
      closeVideo: '動画を閉じる',
      tblName: '候補者氏名（証明写真 4×6）',
      tblSector: '専門分野',
      tblLang: '日本語レベル',
      tblDomAge: '出身地 / 年齢',
      tblProgress: '選考進捗',
      tblActiveApps: '応募求人数',
      tblAction: '操作',
      tblViewProfile: '詳細',
      tblApplyJob: '求人推薦',
      toastCreated: '新規候補生をデータベースに正常登録しました！',
      yearsOld: '歳',
      photoSize: '4×6',
      zoomPhotoTitle: 'クリックで証明写真（4×6cm）を拡大'
    }
  }[lang];

  // Helper video URL parser
  const getVideoEmbed = (url?: string) => {
    if (!url) return null;
    const clean = url.trim();

    if (clean.includes('youtube.com/watch') || clean.includes('youtu.be/')) {
      let vidId = '';
      if (clean.includes('youtu.be/')) {
        vidId = clean.split('youtu.be/')[1]?.split('?')[0];
      } else {
        const urlObj = new URL(clean);
        vidId = urlObj.searchParams.get('v') || '';
      }
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${vidId}?autoplay=1`,
        rawUrl: clean
      };
    }

    if (clean.includes('drive.google.com/file/d/')) {
      const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return {
          type: 'drive',
          embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
          rawUrl: clean
        };
      }
    }

    if (clean.match(/\.(mp4|webm|ogg)$/i) || clean.startsWith('blob:') || clean.startsWith('data:video')) {
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

  // Normalize candidate's sector using unified normalizer
  const normalizeSector = (sectorRaw?: string): string => {
    return normalizeCandidateSector(sectorRaw);
  };

  // Translate sector for display using shared utility
  const displaySector = (sector: string) => {
    return translateSector(sector, lang);
  };

  // Compile candidate pool from all registered rirekisho records and students
  const candidatePool = useMemo(() => {
    const list: Array<{
      id: string;
      rawStudent: CalonSiswa;
      rawCV?: CVRirekisho;
      namaLengkap: string;
      bidangKerja: string;
      normalizedSector: string;
      levelBahasa: string;
      umur: number;
      jenisKelamin: string;
      domisili: string;
      statusProgres: string;
      kategoriKandidat: string;
      avatarUrl?: string;
      videoUrl?: string;
      hasVideo: boolean;
      mcuStatusFit: string;
      mcuBadgeClass: string;
      mcuBadgeLabel: string;
      appliedJobsCount: number;
      latestJobApplication?: JobApplication;
    }> = [];

    const rirekishoList = Object.values(rirekishoRecords) as CVRirekisho[];
    const registeredEmails = new Set<string>();
    const registeredIds = new Set<string>();

    rirekishoList.forEach((cv) => {
      const candidateId = cv.siswaId || cv.id;
      if (!candidateId || registeredIds.has(candidateId)) return;
      registeredIds.add(candidateId);

      const email = (cv.email || '').toLowerCase().trim();
      if (email) registeredEmails.add(email);

      const normalized = normalizeCandidateSector(cv.bidangKerja);
      const rawDocVideo = Array.isArray(cv.dokumenUpload?.videoJikoshoukai)
        ? cv.dokumenUpload?.videoJikoshoukai[0]
        : (cv.dokumenUpload?.videoJikoshoukai as string | undefined);

      const resolvedVideoUrl = cv.videoJikoshoukaiUrl || rawDocVideo || '';

      const studentObj: CalonSiswa = {
        id: candidateId,
        namaLengkap: cv.namaLengkap,
        email: cv.email,
        noHp: cv.noHp,
        kategoriKandidat: cv.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
        kewarganegaraan: 'WNI',
        noKtp: '3201000000000000',
        noKk: '3201000000000000',
        alamatDomisili: cv.alamatLengkap || 'Indonesia',
        tempatLahir: cv.tempatLahir || 'Bandung',
        tanggalLahir: cv.tanggalLahir || '2002-01-01',
        agama: 'Islam',
        jenisKelamin: cv.jenisKelamin || 'Laki-laki',
        golonganDarah: 'O',
        statusPerkawinan: cv.statusPernikahan || 'Lajang',
        namaAyah: 'Wali Siswa',
        pekerjaanAyah: 'Wiraswasta',
        ktpNpwpAyah: '-',
        namaIbu: 'Ibu Siswa',
        pekerjaanIbu: 'Ibu Rumah Tangga',
        ktpNpwpIbu: '-',
        berkasDokumen: {
          pasFoto: cv.pasFotoUrl,
          videoJikoshoukai: resolvedVideoUrl
        },
        statusPendaftaran: 'Terverifikasi',
        createdAt: cv.updatedAt || new Date().toISOString()
      };

      const candidateApps = jobApplications.filter(
        (a) => a.siswaId === studentObj.id || (email && a.emailSiswa.toLowerCase() === email)
      );

      // Resolve synchronized MCU status accurately without default FIT
      const resolvedHealth: HasilKesehatan | undefined =
        healthRecords[studentObj.id] ||
        Object.values(healthRecords).find((h: any) => h.siswaId === studentObj.id || h.id === studentObj.id);

      const rawFit = resolvedHealth?.statusFit || (studentObj as any).statusFit || cv.statusFit;
      let mcuBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-300';
      let mcuBadgeLabel = t.mcuNone;

      if (rawFit) {
        const norm = String(rawFit).toUpperCase();
        if (norm === 'FIT' || norm.includes('LAYAK')) {
          mcuBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
          mcuBadgeLabel = t.mcuFit;
        } else if (norm.includes('CATATAN') || norm.includes('NOTE')) {
          mcuBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
          mcuBadgeLabel = t.mcuNote;
        } else if (norm.includes('UNFIT') || norm.includes('TIDAK')) {
          mcuBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-300';
          mcuBadgeLabel = t.mcuUnfit;
        } else if (norm.includes('PENDING') || norm.includes('PROSES')) {
          mcuBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
          mcuBadgeLabel = t.mcuProcess;
        } else {
          mcuBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-300';
          mcuBadgeLabel = t.mcuNone;
        }
      }

      // Video Jikoshoukai detection
      const videoUrl =
        resolvedVideoUrl ||
        (studentObj.berkasDokumen as any)?.videoJikoshoukai ||
        '';

      list.push({
        id: studentObj.id,
        rawStudent: studentObj,
        rawCV: cv,
        namaLengkap: cv.namaLengkap,
        bidangKerja: cv.bidangKerja || 'Kaigo',
        normalizedSector: normalized,
        levelBahasa: cv.levelBahasaJepang || 'N4',
        umur: cv.umur || 22,
        jenisKelamin: cv.jenisKelamin || 'Laki-laki',
        domisili: cv.alamatLengkap || cv.domisili || 'Jawa Barat',
        statusProgres: cv.statusProgres || 'Siap Matching',
        kategoriKandidat: cv.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
        avatarUrl: getStudentPhotoUrl(studentObj, cv),
        videoUrl: videoUrl,
        hasVideo: !!videoUrl,
        mcuStatusFit: rawFit,
        mcuBadgeClass,
        mcuBadgeLabel,
        appliedJobsCount: candidateApps.length,
        latestJobApplication: candidateApps[0]
      });
    });

    // Also include matching-ready standard SIM-SB students if not yet processed
    students.forEach((st) => {
      if (!isCandidateReadyForMatching(st)) return;

      if (!st.id || registeredIds.has(st.id)) return;
      const email = (st.email || '').toLowerCase().trim();
      if (email && registeredEmails.has(email)) return;

      registeredIds.add(st.id);
      if (email) registeredEmails.add(email);

      const candidateApps = jobApplications.filter(
        (a) => a.siswaId === st.id || (email && a.emailSiswa.toLowerCase() === email)
      );

      const resolvedHealth: HasilKesehatan | undefined =
        healthRecords[st.id] ||
        Object.values(healthRecords).find((h: any) => h.siswaId === st.id || h.id === st.id);

      const rawFit = resolvedHealth?.statusFit || (st as any).statusFit;
      let mcuBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-300';
      let mcuBadgeLabel = t.mcuNone;

      if (rawFit) {
        const norm = String(rawFit).toUpperCase();
        if (norm === 'FIT' || norm.includes('LAYAK')) {
          mcuBadgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300';
          mcuBadgeLabel = t.mcuFit;
        } else if (norm.includes('CATATAN') || norm.includes('NOTE')) {
          mcuBadgeClass = 'bg-amber-100 text-amber-800 border border-amber-300';
          mcuBadgeLabel = t.mcuNote;
        } else if (norm.includes('UNFIT') || norm.includes('TIDAK')) {
          mcuBadgeClass = 'bg-rose-100 text-rose-800 border border-rose-300';
          mcuBadgeLabel = t.mcuUnfit;
        } else if (norm.includes('PENDING') || norm.includes('PROSES')) {
          mcuBadgeClass = 'bg-blue-100 text-blue-800 border border-blue-300';
          mcuBadgeLabel = t.mcuProcess;
        } else {
          mcuBadgeClass = 'bg-slate-100 text-slate-600 border border-slate-300';
          mcuBadgeLabel = t.mcuNone;
        }
      }

      const videoUrl =
        (st.berkasDokumen as any)?.videoJikoshoukai ||
        (st.berkasDokumen as any)?.videoUrl ||
        '';

      list.push({
        id: st.id,
        rawStudent: st,
        namaLengkap: st.namaLengkap,
        bidangKerja: (st.bidangKerja || (st as any).pilihanSektor || (st as any).programMinat || 'KAIGO'),
        normalizedSector: normalizeCandidateSector(st.bidangKerja || (st as any).pilihanSektor || (st as any).programMinat || 'KAIGO'),
        levelBahasa: 'N4',
        umur: 21,
        jenisKelamin: st.jenisKelamin || 'Laki-laki',
        domisili: st.alamatDomisili || 'Bandung',
        statusProgres: 'Siap Matching',
        kategoriKandidat: st.kategoriKandidat,
        avatarUrl: getStudentPhotoUrl(st, rirekishoRecords[st.id]),
        videoUrl: videoUrl,
        hasVideo: !!videoUrl,
        mcuStatusFit: rawFit,
        mcuBadgeClass,
        mcuBadgeLabel,
        appliedJobsCount: candidateApps.length,
        latestJobApplication: candidateApps[0]
      });
    });

    return list;
  }, [rirekishoRecords, students, jobApplications, healthRecords, t]);

  // Sector breakdown stats calculated for all candidates and readiness stages
  const sectorStats = useMemo(() => {
    const stats: Record<string, { total: number; waitingJob: number; interview: number; naitei: number }> = {
      ALL: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      KAIGO: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      PM: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      PERTANIAN: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      KIKAI_KAKOU: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      ENGINEERING: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      KONSTRUKSI: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      BUILDING_CLEANING: { total: 0, waitingJob: 0, interview: 0, naitei: 0 },
      LAINNYA: { total: 0, waitingJob: 0, interview: 0, naitei: 0 }
    };

    candidatePool.forEach((c) => {
      const p = (c.statusProgres || '').toLowerCase();
      const isNaitei = p.includes('naitei') || p.includes('lolos') || p.includes('visa') || p.includes('coe');
      const isInterview = !isNaitei && (p.includes('interview') || p.includes('wawancara') || p.includes('proses'));
      const isWaitingJob = !isNaitei && !isInterview;

      const increment = (key: string) => {
        if (!stats[key]) {
          stats[key] = { total: 0, waitingJob: 0, interview: 0, naitei: 0 };
        }
        stats[key].total++;
        if (isWaitingJob) stats[key].waitingJob++;
        if (isInterview) stats[key].interview++;
        if (isNaitei) stats[key].naitei++;
      };

      increment('ALL');
      const norm = c.normalizedSector || 'LAINNYA';
      increment(norm);
    });

    return stats;
  }, [candidatePool]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidatePool.filter((c) => {
      // Keyword search (name, domisili, sector, language)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = c.namaLengkap.toLowerCase().includes(term);
        const matchDom = c.domisili.toLowerCase().includes(term);
        const matchSector = c.bidangKerja.toLowerCase().includes(term);
        const matchId = c.id.toLowerCase().includes(term);
        if (!matchName && !matchDom && !matchSector && !matchId) return false;
      }

      // Sector classification
      if (selectedSector !== 'ALL') {
        if (selectedSector === 'KAIGO' && c.normalizedSector !== 'KAIGO') return false;
        if (selectedSector === 'PM' && c.normalizedSector !== 'PM') return false;
        if (selectedSector === 'PERTANIAN' && c.normalizedSector !== 'PERTANIAN') return false;
        if ((selectedSector === 'KIKAI_KAKOU' || selectedSector === 'KIKAI KAKOU') && c.normalizedSector !== 'KIKAI_KAKOU') return false;
        if (selectedSector === 'ENGINEERING' && c.normalizedSector !== 'ENGINEERING') return false;
        if (selectedSector === 'KONSTRUKSI' && c.normalizedSector !== 'KONSTRUKSI') return false;
        if (selectedSector === 'BUILDING_CLEANING' && c.normalizedSector !== 'BUILDING_CLEANING') return false;
        if (selectedSector === 'LAINNYA' && c.normalizedSector !== 'LAINNYA' && c.normalizedSector !== 'BUILDING_CLEANING') return false;
      }

      // Language filter
      if (selectedLanguage !== 'ALL') {
        if (c.levelBahasa !== selectedLanguage) return false;
      }

      // Specific status filter from dashboard statistics (Khusus Mitra: Siap Matching Job, Penjadwalan Interview, Status On Job)
      if (selectedSpecificStatus !== 'Semua') {
        const rawStatus = (c.statusProgres || (c as any).statusCV || '').toString().trim();
        const s = rawStatus.toLowerCase();
        if (selectedSpecificStatus === 'Pending Nunggu Job') {
          if (!isCandidateSiapMatching(c)) return false;
        } else if (selectedSpecificStatus === 'Penjadwalan Interview') {
          if (!s.includes('penjadwalan interview') && !s.includes('terjadwal interview') && !s.includes('jadwal interview') && !s.includes('interviewing')) return false;
        } else if (selectedSpecificStatus === 'Status On Job (Selesai)') {
          if (!s.includes('on job') && !s.includes('selesai') && !s.includes('naitei') && !s.includes('lolos') && !s.includes('visa') && !s.includes('coe')) return false;
        } else if (selectedSpecificStatus === 'Nihongo check') {
          if (!s.includes('nihongo check') || s.includes('belum') || s.includes('tidak')) return false;
        } else if (selectedSpecificStatus === 'Belum Lolos Nihongo check') {
          if (!s.includes('belum lolos nihongo') && !s.includes('tidak lolos nihongo')) return false;
        } else if (selectedSpecificStatus === 'On Proses') {
          if (!s.includes('on proses') && s !== 'proses' && !s.includes('sedang proses')) return false;
        } else if (selectedSpecificStatus === 'Tidak Lolos Interview') {
          if (!s.includes('tidak lolos interview') && !s.includes('gagal interview') && s !== 'ditolak') return false;
        } else if (selectedSpecificStatus === 'Cancel') {
          if (!s.includes('cancel') && !s.includes('batal') && !s.includes('mengundurkan diri')) return false;
        } else if (selectedSpecificStatus === 'Belum Ada') {
          if (s && s !== 'belum ada' && s !== 'belum ada status' && s !== '-') return false;
        }
      } else if (filterReadiness !== 'ALL') {
        // Pipeline stage filter:
        const p = (c.statusProgres || '').toLowerCase();
        const isNaitei = p.includes('naitei') || p.includes('lolos') || p.includes('visa') || p.includes('coe');
        const isInterview = !isNaitei && (p.includes('interview') || p.includes('wawancara') || p.includes('proses'));
        const isWaitingJob = !isNaitei && !isInterview;

        if (filterReadiness === 'READY_MATCH' && !isWaitingJob) return false;
        if (filterReadiness === 'INTERVIEW_STAGE' && !isInterview) return false;
        if (filterReadiness === 'NAITEI' && !isNaitei) return false;
      }

      // Gender filter (Pria vs Wanita)
      if (selectedGender !== 'Semua') {
        const g = (c.jenisKelamin || (c as any).gender || '').toString().toLowerCase().trim();
        const isMale = g === 'laki-laki' || g.includes('laki') || g.includes('pria') || g === 'l' || g.includes('男');
        const isFemale = g === 'perempuan' || g.includes('perempuan') || g.includes('wanita') || g === 'p' || g.includes('女');
        if (selectedGender === 'Laki-laki' && !isMale) return false;
        if (selectedGender === 'Perempuan' && !isFemale) return false;
      }

      return true;
    });
  }, [candidatePool, searchTerm, selectedSector, selectedLanguage, filterReadiness, selectedSpecificStatus, selectedGender]);

  // Open full CV view modal with Mitra context (hides official JIS sheet & contact)
  const handleOpenCV = (candidate: (typeof candidatePool)[0]) => {
    setSelectedStudentForCV(candidate.rawStudent);
    setSelectedCVRecord(candidate.rawCV);
  };

  // Open Job Picker for a specific student
  const handlePickJobForStudent = (candidate: (typeof candidatePool)[0]) => {
    setStudentToPickJobFor({
      id: candidate.id,
      name: candidate.namaLengkap,
      sector: candidate.normalizedSector
    });
  };

  // Handle Create New Student
  const handleCreateNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.namaLengkap || !newStudentForm.email || !newStudentForm.noHp) {
      alert(lang === 'ja' ? '氏名、メールアドレス、電話番号を入力してください。' : 'Mohon lengkapi Nama Lengkap, Email, dan No WhatsApp siswa.');
      return;
    }

    const chosenCategory = newStudentForm.kategoriKandidat || 'SISWA MITRA / NON IJEF';
    const newId = `SISWA-MTR-${Date.now()}`;
    const newCVId = `CV-MTR-${Date.now()}`;

    const studentObj: CalonSiswa = {
      id: newId,
      namaLengkap: newStudentForm.namaLengkap,
      email: newStudentForm.email.toLowerCase().trim(),
      noHp: newStudentForm.noHp,
      kategoriKandidat: chosenCategory as any,
      kewarganegaraan: 'WNI',
      noKtp: `3201${Date.now().toString().slice(-12)}`,
      noKk: `3201${Date.now().toString().slice(-12)}`,
      alamatDomisili: newStudentForm.domisili,
      tempatLahir: newStudentForm.domisili,
      tanggalLahir: '2003-05-20',
      agama: 'Islam',
      jenisKelamin: newStudentForm.jenisKelamin,
      golonganDarah: 'O',
      statusPerkawinan: 'Lajang',
      namaAyah: 'Wali Siswa Binaan',
      pekerjaanAyah: 'Wiraswasta',
      ktpNpwpAyah: '-',
      namaIbu: 'Ibu Siswa Binaan',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      ktpNpwpIbu: '-',
      berkasDokumen: {
        pasFoto: ''
      },
      statusPendaftaran: 'Terdaftar',
      createdAt: new Date().toISOString()
    };

    const cvObj: CVRirekisho = {
      id: newCVId,
      siswaId: newId,
      namaLengkap: newStudentForm.namaLengkap,
      email: newStudentForm.email.toLowerCase().trim(),
      noHp: newStudentForm.noHp,
      kategoriKandidat: chosenCategory as any,
      pasFotoUrl: '',
      bidangKerja: newStudentForm.bidangKerja,
      alamatLengkap: newStudentForm.domisili,
      jenisKelamin: newStudentForm.jenisKelamin,
      statusPernikahan: 'Lajang',
      levelBahasaJepang: newStudentForm.levelBahasa as any,
      statusCV: 'Siap Matching',
      statusProgres: 'Pending Nunggu Job',
      namaTSK: `Mitra: ${mitraName}`,
      detailProgres: `Kandidat terdaftar oleh Mitra ${mitraName}`,
      tanggalSubmit: new Date().toLocaleDateString('id-ID'),
      isBaru: true,
      dokumenUpload: {
        pasPhoto3x4: ''
      },
      updatedAt: new Date().toISOString(),
      riwayatPendidikan: [
        {
          jenjang: 'SMK / Sederajat',
          namaSekolah: `Binaan ${mitraName}`,
          jurusan: newStudentForm.bidangKerja,
          tahunMasuk: '2019',
          tahunLulus: '2022'
        }
      ],
      riwayatPekerjaan: []
    };

    // Save to AppContext state and Firestore
    saveStudentRegistration(studentObj);
    saveRirekishoRecord(cvObj);

    // Register into Admin 2 Mitra Approval Queue
    saveMitraSubmission({
      mitraId: mitraId,
      mitraName: mitraName,
      submissionType: 'REGISTRASI_SISWA',
      status: 'PENDING',
      targetId: newId,
      targetTitle: `${newStudentForm.namaLengkap} (${newStudentForm.bidangKerja} • ${chosenCategory})`,
      description: `Registrasi siswa baru bidang ${newStudentForm.bidangKerja} (Level ${newStudentForm.levelBahasa}) oleh ${mitraName}.`,
      payload: {
        student: studentObj,
        rirekisho: cvObj,
        sector: newStudentForm.bidangKerja,
        languageLevel: newStudentForm.levelBahasa,
        email: newStudentForm.email
      }
    });

    // Save student login mapping in localStorage for instant auto-login & sync
    try {
      const existingAccountsRaw = localStorage.getItem('ijef_mitra_registered_students');
      const accountsList = existingAccountsRaw ? JSON.parse(existingAccountsRaw) : [];
      accountsList.push({
        id: newId,
        namaLengkap: newStudentForm.namaLengkap,
        email: newStudentForm.email.toLowerCase().trim(),
        kategoriKandidat: chosenCategory,
        mitraName: mitraName,
        registeredAt: new Date().toISOString()
      });
      localStorage.setItem('ijef_mitra_registered_students', JSON.stringify(accountsList));
    } catch (err) {}

    setShowAddStudentModal(false);
    setNotification(
      lang === 'ja'
        ? `候補生 [${newStudentForm.namaLengkap}] （${chosenCategory}）を正常登録しました！生徒はメールアドレスで直接ログインして登録情報を入力できます。`
        : `Berhasil mendaftarkan siswa baru [${newStudentForm.namaLengkap}] (${chosenCategory})! Akun otomatis dibuat & siswa dapat langsung login dengan email [${newStudentForm.email}] untuk melengkapi berkas & Rirekisho JIS.`
    );
    setTimeout(() => setNotification(null), 7000);
  };

  const videoModalInfo = previewVideoModal ? getVideoEmbed(previewVideoModal.url) : null;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slide-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span className="text-xs sm:text-sm font-semibold">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-100 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-700/50 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              <UserCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.headerTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.headerDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="inline-flex items-center shrink-0 flex-nowrap whitespace-nowrap bg-white/10 p-1 rounded-2xl border border-white/20 backdrop-blur-xs select-none gap-0.5">
              <button
                type="button"
                onClick={() => handleToggleLang('id')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap leading-none ${
                  lang === 'id'
                    ? 'bg-white text-slate-900 shadow-md font-black'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="shrink-0 leading-none">🇮🇩</span>
                <span className="shrink-0 whitespace-nowrap leading-none font-bold">ID</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLang('ja')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap leading-none ${
                  lang === 'ja'
                    ? 'bg-red-600 text-white shadow-md font-black'
                    : 'text-slate-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="shrink-0 leading-none">🇯🇵</span>
                <span className="shrink-0 whitespace-nowrap leading-none font-bold">JA</span>
              </button>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-2xl text-xs font-black shadow-lg hover:shadow-xl transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addStudentBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* DASHBOARD STATISTIK KANDIDAT MITRA (KHUSUS 4 STATUS UTAMA: TOTAL, SIAP MATCHING, INTERVIEW, STATUS ON JOB) */}
      <CandidateDashboardStatistics
        isMitraView={true}
        candidates={candidatePool}
        selectedStatus={selectedSpecificStatus}
        onSelectStatus={(statusKey) => {
          setSelectedSpecificStatus(statusKey);
          if (statusKey === 'Semua') {
            setSelectedGender('Semua');
          }
        }}
        selectedGender={selectedGender}
        onSelectGender={(genderKey) => {
          setSelectedGender(genderKey);
          // Di Portal Mitra, klasifikasi gender khusus untuk kandidat yang Siap Matching Job
          setSelectedSpecificStatus('Pending Nunggu Job');
        }}
        onRefresh={() => setNotification('Data statistik kandidat mitra telah diperbarui!')}
      />

      {/* Sector Classification Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <button
          onClick={() => setSelectedSector('ALL')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'ALL'
              ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="text-[11px] font-bold opacity-80">{t.allSectors}</div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.ALL.total : filterReadiness === 'READY_MATCH' ? sectorStats.ALL.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.ALL.interview : sectorStats.ALL.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'ALL' ? 'text-indigo-200' : 'text-emerald-600'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.ALL.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.ALL.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.ALL.interview} ${t.interview}` : `${sectorStats.ALL.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('KAIGO')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'KAIGO'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-200 hover:bg-rose-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>🏥</span> <span>{t.sectorKaigo}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.KAIGO.total : filterReadiness === 'READY_MATCH' ? sectorStats.KAIGO.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.KAIGO.interview : sectorStats.KAIGO.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'KAIGO' ? 'text-rose-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.KAIGO.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.KAIGO.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.KAIGO.interview} ${t.interview}` : `${sectorStats.KAIGO.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('PM')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'PM'
              ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-200 hover:bg-amber-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>🍱</span> <span>{t.sectorPM}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.PM.total : filterReadiness === 'READY_MATCH' ? sectorStats.PM.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.PM.interview : sectorStats.PM.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'PM' ? 'text-amber-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.PM.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.PM.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.PM.interview} ${t.interview}` : `${sectorStats.PM.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('PERTANIAN')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'PERTANIAN'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>🌾</span> <span>{t.sectorPertanian}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.PERTANIAN.total : filterReadiness === 'READY_MATCH' ? sectorStats.PERTANIAN.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.PERTANIAN.interview : sectorStats.PERTANIAN.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'PERTANIAN' ? 'text-emerald-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.PERTANIAN.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.PERTANIAN.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.PERTANIAN.interview} ${t.interview}` : `${sectorStats.PERTANIAN.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('KIKAI_KAKOU')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'KIKAI_KAKOU' || selectedSector === 'KIKAI KAKOU'
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-blue-200 hover:bg-blue-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>⚙️</span> <span>{t.sectorManufaktur}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.KIKAI_KAKOU.total : filterReadiness === 'READY_MATCH' ? sectorStats.KIKAI_KAKOU.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.KIKAI_KAKOU.interview : sectorStats.KIKAI_KAKOU.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${(selectedSector === 'KIKAI_KAKOU' || selectedSector === 'KIKAI KAKOU') ? 'text-blue-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.KIKAI_KAKOU.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.KIKAI_KAKOU.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.KIKAI_KAKOU.interview} ${t.interview}` : `${sectorStats.KIKAI_KAKOU.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('ENGINEERING')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'ENGINEERING'
              ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-purple-200 hover:bg-purple-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>💻</span> <span>{t.sectorEngineering}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.ENGINEERING.total : filterReadiness === 'READY_MATCH' ? sectorStats.ENGINEERING.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.ENGINEERING.interview : sectorStats.ENGINEERING.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'ENGINEERING' ? 'text-purple-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.ENGINEERING.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.ENGINEERING.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.ENGINEERING.interview} ${t.interview}` : `${sectorStats.ENGINEERING.naitei} ${t.naitei}`}
          </div>
        </button>

        <button
          onClick={() => setSelectedSector('KONSTRUKSI')}
          className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedSector === 'KONSTRUKSI'
              ? 'bg-orange-600 text-white border-orange-700 shadow-md ring-2 ring-orange-400/40'
              : 'bg-white text-slate-800 border-slate-200 hover:border-orange-200 hover:bg-orange-50/40'
          }`}
        >
          <div className="text-[11px] font-bold flex items-center gap-1 truncate">
            <span>🏗️</span> <span>{t.sectorKonstruksi}</span>
          </div>
          <div className="text-2xl font-black mt-2">
            {filterReadiness === 'ALL' ? sectorStats.KONSTRUKSI.total : filterReadiness === 'READY_MATCH' ? sectorStats.KONSTRUKSI.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? sectorStats.KONSTRUKSI.interview : sectorStats.KONSTRUKSI.naitei}
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${selectedSector === 'KONSTRUKSI' ? 'text-orange-200' : 'text-slate-500'}`}>
            {filterReadiness === 'ALL' ? `${sectorStats.KONSTRUKSI.waitingJob} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${sectorStats.KONSTRUKSI.waitingJob} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${sectorStats.KONSTRUKSI.interview} ${t.interview}` : `${sectorStats.KONSTRUKSI.naitei} ${t.naitei}`}
          </div>
        </button>

        {/* Lainnya & Cleaning */}
        {(() => {
          const otherTotal = (sectorStats.BUILDING_CLEANING?.total || 0) + (sectorStats.LAINNYA?.total || 0);
          const otherWaiting = (sectorStats.BUILDING_CLEANING?.waitingJob || 0) + (sectorStats.LAINNYA?.waitingJob || 0);
          const otherInterview = (sectorStats.BUILDING_CLEANING?.interview || 0) + (sectorStats.LAINNYA?.interview || 0);
          const otherNaitei = (sectorStats.BUILDING_CLEANING?.naitei || 0) + (sectorStats.LAINNYA?.naitei || 0);
          const isSelected = selectedSector === 'LAINNYA' || selectedSector === 'BUILDING_CLEANING';

          return (
            <button
              onClick={() => setSelectedSector(isSelected ? 'ALL' : 'LAINNYA')}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-700 text-white border-slate-800 shadow-md ring-2 ring-slate-400/40'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-[11px] font-bold flex items-center gap-1 truncate">
                <span>📋</span> <span>{t.sectorLainnya || 'Lainnya'}</span>
              </div>
              <div className="text-2xl font-black mt-2">
                {filterReadiness === 'ALL' ? otherTotal : filterReadiness === 'READY_MATCH' ? otherWaiting : filterReadiness === 'INTERVIEW_STAGE' ? otherInterview : otherNaitei}
              </div>
              <div className={`text-[10px] mt-1 font-semibold ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                {filterReadiness === 'ALL' ? `${otherWaiting} ${t.waitingJob}` : filterReadiness === 'READY_MATCH' ? `${otherWaiting} ${t.waitingJob}` : filterReadiness === 'INTERVIEW_STAGE' ? `${otherInterview} ${t.interview}` : `${otherNaitei} ${t.naitei}`}
              </div>
            </button>
          );
        })()}
      </div>

      {/* Search & Secondary Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.activePoolBadge}</span>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {t.totalCountLabel} {filterReadiness === 'READY_MATCH' ? t.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? t.interview : t.naitei}: <strong className="text-indigo-700 font-bold">{filteredCandidates.length}</strong> {t.studentsUnit}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Level Bahasa Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">{t.allLangOption}</option>
              <option value="N4">JLPT N4 / JFT-Basic A2</option>
              <option value="N3">JLPT N3</option>
              <option value="N2">JLPT N2</option>
              <option value="N5">JLPT N5</option>
            </select>
          </div>

          {/* Jenis Kelamin (Gender) Filter */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="Semua">👥 {lang === 'ja' ? '全ての性別' : 'Semua Gender'}</option>
              <option value="Laki-laki">♂ {lang === 'ja' ? '男性 (Pria)' : 'Pria (Laki-laki)'}</option>
              <option value="Perempuan">♀ {lang === 'ja' ? '女性 (Wanita)' : 'Wanita (Perempuan)'}</option>
            </select>
          </div>

          {/* Status Pipeline Filter */}
          <div>
            <select
              value={filterReadiness}
              onChange={(e) => setFilterReadiness(e.target.value as 'ALL' | 'READY_MATCH' | 'INTERVIEW_STAGE' | 'NAITEI')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
            >
              <option value="ALL">🌐 {t.allPipeline || 'Semua Status Pipeline'}</option>
              <option value="READY_MATCH">{t.filterReadyMatch}</option>
              <option value="INTERVIEW_STAGE">{t.filterInterview}</option>
              <option value="NAITEI">{t.filterNaitei}</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => setViewLayout('CARD')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewLayout === 'CARD'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.viewCard}
            </button>
            <button
              onClick={() => setViewLayout('TABLE')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewLayout === 'TABLE'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.viewTable}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span>
            {t.showingText} <strong className="text-indigo-700">{filteredCandidates.length}</strong> {t.studentsUnit}
            {selectedSpecificStatus !== 'Semua' ? (
              <span className="ml-1 text-slate-500 font-medium">
                — Status: <strong className="text-amber-700 font-bold">{selectedSpecificStatus === 'Pending Nunggu Job' ? 'Siap Matching Job' : selectedSpecificStatus === 'Status On Job (Selesai)' ? 'Status On Job' : selectedSpecificStatus}</strong>
              </span>
            ) : (
              ` (${filterReadiness === 'ALL' ? (t.allPipeline || 'Semua Pipeline') : filterReadiness === 'READY_MATCH' ? t.waitingJob : filterReadiness === 'INTERVIEW_STAGE' ? t.interview : t.naitei})`
            )}
            {selectedGender !== 'Semua' && (
              <span className="ml-1 text-slate-500 font-medium">
                | Gender: <strong className={selectedGender === 'Laki-laki' ? 'text-blue-700 font-bold' : 'text-rose-700 font-bold'}>{selectedGender === 'Laki-laki' ? '♂ Pria (Siap Matching)' : '♀ Wanita (Siap Matching)'}</strong>
              </span>
            )}
          </span>

          {(searchTerm || selectedSector !== 'ALL' || selectedLanguage !== 'ALL' || selectedGender !== 'Semua' || selectedSpecificStatus !== 'Semua' || filterReadiness !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('ALL');
                setSelectedLanguage('ALL');
                setSelectedGender('Semua');
                setSelectedSpecificStatus('Semua');
                setFilterReadiness('ALL');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t.resetFilter}</span>
            </button>
          )}
        </div>
      </div>

      {/* Candidate List (Card View) */}
      {viewLayout === 'CARD' ? (
        filteredCandidates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">{t.emptyTitle}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCandidates.map((candidate, idx) => {
              const photoSrc = candidate.avatarUrl || getStudentPhotoUrl(candidate.rawStudent, candidate.rawCV);
              return (
                <div
                  key={candidate.id ? `${candidate.id}-${idx}` : `cand-card-${idx}`}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group relative"
                >
                  {/* Top Candidate Badges Header */}
                  <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-200 bg-slate-50/70">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        candidate.normalizedSector === 'KAIGO'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : candidate.normalizedSector === 'PM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : candidate.normalizedSector === 'PERTANIAN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : candidate.normalizedSector === 'ENGINEERING'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {displaySector(candidate.normalizedSector)}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        candidate.statusProgres.includes('Lolos') || candidate.statusProgres.includes('Naitei') || candidate.statusProgres.includes('Visa')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : candidate.statusProgres.includes('Interview')
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {candidate.statusProgres.includes('Lolos') || candidate.statusProgres.includes('Naitei')
                        ? '🎉 ' + (lang === 'ja' ? '内定獲得' : 'Lolos Naitei')
                        : candidate.statusProgres.includes('Interview')
                        ? '🎙️ ' + (lang === 'ja' ? '面接選考中' : 'Terjadwal Interview')
                        : '✨ ' + (lang === 'ja' ? '面接準備完了' : 'Siap Matching')}
                    </span>
                  </div>

                  {/* Card Body: 2 Columns (LEFT: Pas foto full kebawah, RIGHT: Shifted Details & Menus) */}
                  <div className="flex flex-1 min-h-[220px]">
                    {/* Left Column: Pas foto full kebawah */}
                    <div
                      className="w-28 sm:w-32 md:w-36 shrink-0 relative bg-slate-100 border-r border-slate-200 overflow-hidden group/photo cursor-pointer flex items-center justify-center self-stretch"
                      onClick={() => {
                        if (photoSrc) {
                          setPreviewPhotoZoom({ url: photoSrc, name: candidate.namaLengkap });
                        }
                      }}
                      title="Klik untuk memperbesar pas foto 4×6"
                    >
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt={candidate.namaLengkap}
                          referrerPolicy="no-referrer"
                          onError={(e) => handleStudentImageError(e, candidate.namaLengkap, candidate.jenisKelamin)}
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/photo:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-100 text-slate-400 select-none">
                          <div className="w-12 h-12 rounded-full bg-slate-200/80 flex items-center justify-center mb-2 text-slate-400">
                            <User className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                            {lang === 'ja' ? '写真未登録' : 'Foto Kosong'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">
                            {lang === 'ja' ? '4×6 写真なし' : 'Belum Ada Pas Foto'}
                          </span>
                        </div>
                      )}

                      {/* Hover zoom overlay */}
                      {photoSrc && (
                        <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
                          <div className="bg-black/60 rounded-full p-2 text-white shadow-md">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      )}

                      <span className="absolute bottom-1.5 left-1.5 bg-black/65 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs pointer-events-none">
                        {t.photoSize || '4×6'}
                      </span>
                    </div>

                    {/* Right Column: All remaining menus/info shifted to the right */}
                    <div className="p-3 sm:p-3.5 flex-1 min-w-0 flex flex-col justify-between space-y-2">
                      {/* Candidate Name & Demographics */}
                      <div className="space-y-1">
                        <h3
                          className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-700 transition"
                          title={candidate.namaLengkap}
                        >
                          {candidate.namaLengkap}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                          <span>{lang === 'ja' ? (candidate.jenisKelamin === 'Perempuan' ? '女性' : '男性') : candidate.jenisKelamin}</span>
                          <span>•</span>
                          <span>{candidate.umur} {t.yearsOld}</span>
                          <span>•</span>
                          <span className="truncate" title={candidate.domisili}>{candidate.domisili}</span>
                        </div>

                        {/* Protected ID Badge (Phone and Email are hidden to protect privacy) */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[130px]"
                            title={candidate.id}
                          >
                            ID: {candidate.id}
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{lang === 'ja' ? '公式審査済' : 'Terverifikasi'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Qualification Badges */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">{t.langLevel}</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {candidate.levelBahasa}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">{t.studentCategory}</span>
                          <span
                            className="font-semibold text-slate-700 text-[11px] truncate max-w-[130px]"
                            title={translateCandidateCategory(candidate.kategoriKandidat, lang)}
                          >
                            {translateCandidateCategory(candidate.kategoriKandidat, lang)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px]">
                          {/* Synchronized MCU Health Status */}
                          <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 ${candidate.mcuBadgeClass}`}>
                            <HeartPulse className="w-3 h-3" />
                            <span>{candidate.mcuBadgeLabel}</span>
                          </span>

                          {/* Video Jikoshoukai Quick Indicator */}
                          {candidate.hasVideo ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (candidate.videoUrl) {
                                  setPreviewVideoModal({ url: candidate.videoUrl, name: candidate.namaLengkap });
                                }
                              }}
                              className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                              title="Tonton Video Jikoshoukai"
                            >
                              <Video className="w-3 h-3 text-rose-600 animate-pulse" />
                              <span>{t.videoReady}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-medium">
                              {t.noVideo}
                            </span>
                          )}

                          <span className="text-slate-700 font-bold whitespace-nowrap">
                            {candidate.appliedJobsCount} {t.appliedCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Spanning full width across bottom of card so they never get cut off */}
                  <div className="p-2.5 sm:p-3 bg-slate-50/70 border-t border-slate-200 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCV(candidate)}
                      className="flex-1 min-w-0 py-2 px-2.5 sm:px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                      title={t.profileBtn}
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t.profileBtn}</span>
                    </button>

                    <button
                      onClick={() => handlePickJobForStudent(candidate)}
                      className="flex-1 min-w-0 py-2 px-2.5 sm:px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title={t.applyJobBtn}
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.applyJobBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t.tblName}</th>
                  <th className="py-3 px-4">{t.tblSector}</th>
                  <th className="py-3 px-4">{t.tblLang}</th>
                  <th className="py-3 px-4">{t.tblDomAge}</th>
                  <th className="py-3 px-4">{t.tblProgress}</th>
                  <th className="py-3 px-4">{t.tblActiveApps}</th>
                  <th className="py-3 px-4 text-right">{t.tblAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((candidate, idx) => (
                  <tr key={candidate.id ? `${candidate.id}-${idx}` : `cand-row-${idx}`} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const photoSrc = candidate.avatarUrl || getStudentPhotoUrl(candidate.rawStudent, candidate.rawCV);
                          return (
                            <StudentPhotoBadge
                              photoUrl={photoSrc}
                              student={candidate.rawStudent}
                              rirekisho={candidate.rawCV}
                              namaLengkap={candidate.namaLengkap}
                              size="xs"
                              ratioLabel={t.photoSize || '4×6'}
                              theme="indigo"
                              onZoomClick={photoSrc ? () => setPreviewPhotoZoom({ url: photoSrc, name: candidate.namaLengkap }) : undefined}
                              lang={lang}
                            />
                          );
                        })()}
                        <div>
                          <div>{candidate.namaLengkap}</div>
                          {/* Protected candidate ID (no email/phone) */}
                          <div className="text-[10px] font-mono text-slate-400 font-normal flex items-center gap-1.5 mt-0.5">
                            <span>ID: {candidate.id}</span>
                            {candidate.hasVideo && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (candidate.videoUrl) {
                                    setPreviewVideoModal({ url: candidate.videoUrl, name: candidate.namaLengkap });
                                  }
                                }}
                                className="text-rose-600 font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                              >
                                <Video className="w-3 h-3" />
                                <span>{t.videoReady}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {displaySector(candidate.normalizedSector)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {candidate.levelBahasa}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {candidate.domisili} • {candidate.umur} {t.yearsOld}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            candidate.statusProgres.includes('Lolos') || candidate.statusProgres.includes('Naitei') || candidate.statusProgres.includes('Visa')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : candidate.statusProgres.includes('Interview')
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {candidate.statusProgres.includes('Lolos') || candidate.statusProgres.includes('Naitei')
                            ? '🎉 ' + (lang === 'ja' ? '内定獲得' : 'Lolos Naitei')
                            : candidate.statusProgres.includes('Interview')
                            ? '🎙️ ' + (lang === 'ja' ? '面接選考中' : 'Terjadwal Interview')
                            : '✨ ' + (lang === 'ja' ? '面接準備完了' : 'Siap Matching')}
                        </span>
                        <div>
                          <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold ${candidate.mcuBadgeClass}`}>
                            {candidate.mcuBadgeLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {candidate.appliedJobsCount} {t.appliedCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCV(candidate)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {t.tblViewProfile}
                        </button>
                        <button
                          onClick={() => handlePickJobForStudent(candidate)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          {t.tblApplyJob}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Full CV / Jikoshoukai Viewer (PortalContext=MITRA strictly prevents contact leak & hides JIS Sheet) */}
      {selectedStudentForCV && (
        <StudentCVModal
          student={selectedStudentForCV}
          rirekishoRecord={selectedCVRecord}
          healthRecord={healthRecords[selectedStudentForCV.id]}
          discRecord={discRecords[selectedStudentForCV.id]}
          psikotesRecord={psikotesRecords[selectedStudentForCV.id]}
          onClose={() => {
            setSelectedStudentForCV(null);
            setSelectedCVRecord(undefined);
          }}
          portalContext="MITRA"
        />
      )}

      {/* Modal 2: Quick Job Picker for a Selected Student */}
      {studentToPickJobFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  {lang === 'ja' ? '求人選択' : 'Pilih Lowongan Kerja'}
                </span>
                <h2 className="text-base font-black text-white mt-1">
                  {lang === 'ja' ? `推薦候補者: ${studentToPickJobFor.name}` : `Daftarkan: ${studentToPickJobFor.name}`}
                </h2>
                <p className="text-xs text-slate-300">
                  {lang === 'ja' ? '主専門分野:' : 'Bidang Utama:'} <strong>{displaySector(studentToPickJobFor.sector)}</strong>
                </p>
              </div>
              <button
                onClick={() => setStudentToPickJobFor(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-600 font-medium">
                {lang === 'ja'
                  ? '以下の募集中求人から推薦先を選択してください：'
                  : 'Pilih salah satu lowongan aktif di bawah ini untuk langsung mendaftarkan kandidat ini:'}
              </p>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {jobPostings.filter(isJobActiveAndAvailable).map((job) => {
                  const cleanTitle = getSanitizedJobTitle(job, lang);
                  const cleanCompany = getSanitizedCompany(job, lang);
                  return (
                    <div
                      key={job.id}
                      className="p-3.5 hover:bg-indigo-50/50 transition flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {lang === 'ja' ? '募集中' : (job.statusJob || 'Aktif')}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{cleanTitle}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">{cleanCompany}</span>
                          <span>•</span>
                          <span>📍 {formatPrefecture(job.lokasiPrefektur, lang)}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">¥{job.gajiBulananYen?.toLocaleString('ja-JP')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const studentId = studentToPickJobFor.id;
                          setStudentToPickJobFor(null);
                          setSelectedJobToApply({ job, studentId });
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition cursor-pointer flex items-center gap-1"
                      >
                        <span>{lang === 'ja' ? 'この求人へ推薦' : 'Pilih Job Ini'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setStudentToPickJobFor(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? '閉じる' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Apply Job Confirmation */}
      {selectedJobToApply && (
        <MitraApplyJobModal
          job={selectedJobToApply.job}
          preSelectedStudentId={selectedJobToApply.studentId}
          onClose={() => setSelectedJobToApply(null)}
          onSuccess={(name) => {
            setNotification(
              lang === 'ja'
                ? `[${name}] を求人 [${getSanitizedJobTitle(selectedJobToApply.job, 'ja')}] へ正常に応募推薦しました！`
                : `Sukses mendaftarkan [${name}] ke lowongan [${getSanitizedJobTitle(selectedJobToApply.job)}]!`
            );
            setTimeout(() => setNotification(null), 6000);
          }}
        />
      )}

      {/* Modal 4: Add New Candidate Form */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  {lang === 'ja' ? 'パートナー候補生登録' : 'Registrasi Siswa Mitra'}
                </span>
                <h2 className="text-base font-black text-white mt-1">
                  {lang === 'ja' ? '新規候補生の登録' : 'Tambah Siswa Binaan Baru'}
                </h2>
                <p className="text-xs text-slate-300">
                  {lang === 'ja' ? '所属パートナー機関:' : 'Lembaga Mitra:'} <strong>{mitraName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewStudent} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '候補生フルネーム *' : 'Nama Lengkap Siswa *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.namaLengkap}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, namaLengkap: e.target.value })}
                    placeholder={lang === 'ja' ? '例: Muhammad Danang Suryono' : 'Contoh: Muhammad Danang Suryono'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '候補生カテゴリー *' : 'Kategori Kandidat *'}
                  </label>
                  <select
                    value={newStudentForm.kategoriKandidat}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, kategoriKandidat: e.target.value })}
                    className="w-full px-3 py-2 bg-indigo-50/70 border border-indigo-300 rounded-xl text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携校・一般候補生 (Siswa Mitra SIM-SB)' : 'SISWA MITRA / NON IJEF (Siswa Mitra SIM-SB)'}</option>
                    <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '新規・一般応募者 (Matching Job Standar)' : 'SISWA NON IJEF (New Comer)'}</option>
                    <option value="EX-MAGANG/EX-TRAINEER">{lang === 'ja' ? '元技能実習生・帰国者 (Tokutei Ginou Jepang)' : 'EX-MAGANG/EX-TRAINEER (Tokutei Ginou)'}</option>
                    <option value="MATCHING JOB - Engineering / Gijinkoku">{lang === 'ja' ? '技術・人文知識・国際業務 (技人国)' : 'MATCHING JOB - Engineering / Gijinkoku'}</option>
                    <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF生・対面研修生 (Asrama Pelatihan)' : 'SISWA IJEF - Offline'}</option>
                    <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEF生・オンライン生 (Kelas Daring)' : 'SISWA IJEF - Online'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'メールアドレス *' : 'Email Siswa (Akun Login) *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newStudentForm.email}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                    placeholder="danang.suryono@gmail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {lang === 'ja' ? '候補生がログインして書類を登録するメールアドレス' : 'Email ini akan digunakan siswa untuk login & melengkapi berkas'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '電話番号 / WhatsApp *' : 'No WhatsApp / HP *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStudentForm.noHp}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, noHp: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {lang === 'ja' ? '面接日程や通知を受け取る連絡先' : 'Nomor aktif untuk notifikasi matching & interview'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '専門分野' : 'Klasifikasi Bidang Kerja'}
                  </label>
                  <select
                    value={newStudentForm.bidangKerja}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, bidangKerja: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="KAIGO">{lang === 'ja' ? '介護分野（Kaigo）' : 'KAIGO (Caregiver / 介護)'}</option>
                    <option value="PM">{lang === 'ja' ? '飲食料品製造業（食品製造）' : 'Pengolahan Makanan (食品製造)'}</option>
                    <option value="PERTANIAN">{lang === 'ja' ? '農業分野（農業・畜産）' : 'Pertanian & Hortikultura (農業)'}</option>
                    <option value="KIKAI KAKOU">{lang === 'ja' ? '機械加工・製造分野' : 'Pemesinan & Manufaktur (機械製造)'}</option>
                    <option value="ENGINEERING">{lang === 'ja' ? '技術・エンジニア（技人国）' : 'Engineering / Gijinkoku (技術)'}</option>
                    <option value="KONSTRUKSI">{lang === 'ja' ? '建設分野' : 'Konstruksi & Tekkin (建設)'}</option>
                    <option value="PENGELASAN">{lang === 'ja' ? '溶接分野' : 'Pengelasan (溶接)'}</option>
                    <option value="RESTORAN">{lang === 'ja' ? '外食業分野' : 'Restoran & Pelayanan Makanan (外食)'}</option>
                    <option value="AKOMODASI">{lang === 'ja' ? '宿泊分野' : 'Perhotelan & Akomodasi (宿泊)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '日本語レベル' : 'Level Bahasa Jepang'}
                  </label>
                  <select
                    value={newStudentForm.levelBahasa}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, levelBahasa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="N4">{lang === 'ja' ? 'JLPT N4 / JFT-Basic A2（特定技能基準）' : 'JLPT N4 / JFT-Basic A2'}</option>
                    <option value="N3">{lang === 'ja' ? 'JLPT N3（中級レベル）' : 'JLPT N3'}</option>
                    <option value="N2">{lang === 'ja' ? 'JLPT N2（上級レベル）' : 'JLPT N2'}</option>
                    <option value="N5">{lang === 'ja' ? 'JLPT N5（初級学習中）' : 'JLPT N5'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '性別' : 'Jenis Kelamin'}
                  </label>
                  <select
                    value={newStudentForm.jenisKelamin}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, jenisKelamin: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    <option value="Laki-laki">{lang === 'ja' ? '男性' : 'Laki-laki'}</option>
                    <option value="Perempuan">{lang === 'ja' ? '女性' : 'Perempuan'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '居住地 / 出身地' : 'Domisili Siswa'}
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.domisili}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, domisili: e.target.value })}
                    placeholder="Bandung, Jawa Barat"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 text-xs text-indigo-900 space-y-1.5 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                  <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>{lang === 'ja' ? 'アカウント自動発行＆データ直接連携' : 'Akun Calon Siswa Otomatis Dibuat & Terintegrasi'}</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  {lang === 'ja'
                    ? '登録と同時に生徒アカウントが発行されます。候補生は登録されたメールアドレスでポータルにログインし、JIS規格履歴書や提出書類を直接編集・更新できます。'
                    : 'Data yang diisi oleh admin mitra langsung terhubung ke akun siswa. Siswa dapat login menggunakan email yang didaftarkan untuk melengkapi biodata, mengunggah dokumen (KTP/Ijazah), dan menyempurnakan Rirekisho Standar JIS.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'ja' ? '候補生を保存' : 'Simpan Siswa ke Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Dedicated Video Jikoshoukai Lightbox Player */}
      {previewVideoModal && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewVideoModal(null)}
        >
          <div
            className="bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl border border-slate-700 text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                <div>
                  <h4 className="font-black text-white text-sm sm:text-base">
                    {t.videoModalTitle}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {previewVideoModal.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideoModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Responsive Video Player */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner relative">
              {videoModalInfo?.embedUrl && (videoModalInfo?.type === 'youtube' || videoModalInfo?.type === 'drive') ? (
                <iframe
                  src={videoModalInfo.embedUrl}
                  title="Video Jikoshoukai"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : videoModalInfo?.embedUrl && videoModalInfo?.type === 'video' ? (
                <video
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  src={videoModalInfo.embedUrl}
                >
                  {lang === 'ja' ? 'お使いのブラウザは動画タグに対応していません。' : 'Browser Anda tidak mendukung tag video.'}
                </video>
              ) : (
                <div className="p-6 text-center space-y-3">
                  <Play className="w-12 h-12 text-rose-500 mx-auto" />
                  <p className="text-sm font-medium text-slate-300">
                    {lang === 'ja' ? '自己紹介動画リンク：' : 'Video Jikoshoukai tersedia pada tautan cloud:'}
                  </p>
                  <a
                    href={previewVideoModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t.openVideoExternal}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <a
                href={previewVideoModal.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-rose-400 hover:text-rose-300 font-bold"
              >
                <span>{t.openVideoExternal}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewVideoModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition"
              >
                {t.closeVideo}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Lightbox Modal for 4x6 Preview in Mitra Portal */}
      {previewPhotoZoom && previewPhotoZoom.url && previewPhotoZoom.url.trim().length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoZoom(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {lang === 'ja' ? '候補生証明写真（4×6cm）' : 'Pas Foto Kandidat (Ukuran 4×6 cm)'}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[280px]">{previewPhotoZoom.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotoZoom(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center bg-slate-100 rounded-2xl overflow-hidden p-3 border border-slate-200">
              <img
                src={previewPhotoZoom.url.trim()}
                alt={previewPhotoZoom.name}
                referrerPolicy="no-referrer"
                onError={(e) => handleStudentImageError(e, previewPhotoZoom.name)}
                className="w-52 sm:w-60 aspect-[2/3] object-cover object-top rounded-xl shadow-lg border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">
                {lang === 'ja' ? '証明写真 4×6規格（2:3比率）' : 'Standar Pas Foto 4×6 (Rasio 2:3)'}
              </span>
              <a
                href={previewPhotoZoom.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 font-bold"
              >
                <span>{lang === 'ja' ? '元画像を開く' : 'Buka Foto Asli'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
