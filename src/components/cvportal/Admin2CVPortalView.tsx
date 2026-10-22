import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { JobPosting, JobApplication, CVRirekisho, CalonSiswa, AplikasiDukunganDana, AdminUser, CandidateCategory } from '../../types';
import { StudentCVModal } from '../StudentCVModal';
import { JapaneseCVSheet } from '../JapaneseCVSheet';
import { CandidateEditModal } from './CandidateEditModal';
import { JobSpreadsheetUploadModal } from './JobSpreadsheetUploadModal';
import { GoogleDriveImportModal } from './GoogleDriveImportModal';
import { DukunganDanaForm } from '../DukunganDanaForm';
import { BiayaKeberangkatanView } from './BiayaKeberangkatanView';
import { SuratPerjanjianForm } from '../SuratPerjanjianForm';
import { PetunjukPenggunaanView } from './PetunjukPenggunaanView';
import { Admin2AccountRoleManagement } from './Admin2AccountRoleManagement';
import { Admin2MitraApprovalView } from './Admin2MitraApprovalView';
import { Admin2RegisteredMitraView } from './Admin2RegisteredMitraView';
import { CandidateDashboardStatistics, isCandidateSiapMatching, calculateCandidateStatistics } from './CandidateDashboardStatistics';
import { DuplicateDataCheckerModal } from '../common/DuplicateDataCheckerModal';
import { FirebaseSyncControlBar } from '../common/FirebaseSyncControlBar';
import { INITIAL_JOBS } from '../../data/seedData';
import { autoTranslateCandidateCV } from '../../utils/japaneseTranslator';
import { saveRirekishoToFirestore } from '../../lib/firebase';
import { supabase, mapSupabaseSiswaToDomain, fetchSiswaFromSupabase, saveSiswaToSupabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/financingCalculator';
import { getStudentPhotoUrl, handleStudentImageError } from '../../utils/studentPhotoHelper';
import { StudentPhotoBadge } from '../StudentPhotoBadge';
import { JobDescriptionCategorizedView } from '../common/JobDescriptionCategorizedView';
import { detectDuplicates, cvToUnified } from '../../utils/duplicateDetector';
import {
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  formatQualification,
  translateCandidateCategory,
  translateFacilityText,
  translateFeeText,
  translateNotesText,
  translateSector,
  normalizeCandidateSector,
  translateProgressStatus,
  formatSalary,
  formatGender
} from '../../utils/mitraJobUtils';
import {
  Building2,
  Users,
  Briefcase,
  Plus,
  Search,
  FileText,
  Calendar,
  Video,
  CheckCircle2,
  Lock,
  Globe2,
  Edit2,
  Edit3,
  Copy,
  Trash2,
  Eye,
  Maximize2,
  Award,
  Sparkles,
  ChevronRight,
  ChevronDown,
  User,
  Filter,
  RotateCcw,
  Languages,
  X,
  Menu,
  FileCheck2,
  Printer,
  MapPin,
  Clock,
  CloudUpload,
  BarChart3,
  BookOpen,
  Activity,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Layers,
  Settings,
  ShieldCheck,
  Handshake,
  UserCheck,
  Key,
  ToggleLeft,
  ToggleRight,
  Save,
  Server,
  Bell,
  Banknote,
  Check,
  Sliders,
  ShieldAlert,
  Coins,
  Receipt,
  Calculator,
  GraduationCap,
  Mail,
  Phone,
  Table,
  LayoutGrid,
  Database,
  FileSpreadsheet,
  HardDrive,
  HeartHandshake,
  Utensils,
  Sprout,
  Wrench,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  ZoomIn,
  Crown,
  Shield,
  KeyRound,
  LogIn,
  ArrowUpDown,
  Stethoscope,
  Brain
} from 'lucide-react';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_JA = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export const Admin2CVPortalView: React.FC = () => {
  const {
    jobPostings,
    saveJobPosting,
    deleteJobPosting,
    batchSaveJobPostings,
    jobApplications,
    saveJobApplication,
    rirekishoRecords,
    saveRirekishoRecord,
    students,
    healthRecords,
    discRecords,
    psikotesRecords,
    masterSettings,
    updateMasterSettings,
    financingRecords,
    saveFinancingRecord,
    contractRecords,
    saveContractRecord,
    saveStudentRegistration,
    deleteStudent,
    deleteRirekishoRecord,
    mitraSubmissions,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent,
    refreshFirebaseDomain,
    syncFirebaseDomain,
    firebaseSyncStatus,
    setStudents,
    setRirekishoRecords
  } = useApp();

  // Centralized Shared Localization Engine (Single Source of Truth)
  const {
    lang,
    isJapanese,
    setLang,
    toggleLang,
    t: ecosystemDict,
    scoped: tDoc,
    bilingual
  } = useEcosystemTranslation('adminDoc');

  const [activeTab, setActiveTab] = useState<'monitoring' | 'kandidat' | 'jobs' | 'applications' | 'accounts' | 'settings' | 'dana' | 'kontrak' | 'petunjuk' | 'mitra-approval' | 'mitra-terdaftar'>('monitoring');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setSidebarOpen((prev) => !prev);
    window.addEventListener('toggle-admin2-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin2-sidebar', handleToggle);
  }, []);
  const [editModalTab, setEditModalTab] = useState<'data' | 'progres' | 'sertifikat' | 'terjemahan' | 'pembiayaan'>('data');

  // Persistent Filter States ("Lock Filter" across edits and reloads)
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('ijef_admin2_search') || '');
  const [submitDateFilter, setSubmitDateFilter] = useState(() => localStorage.getItem('ijef_admin2_submit_date') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(() => localStorage.getItem('ijef_admin2_category') || 'Semua');
  const [fieldFilter, setFieldFilter] = useState(() => localStorage.getItem('ijef_admin2_field') || 'Semua');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('ijef_admin2_status') || 'Pending Nunggu Job');
  const [genderFilter, setGenderFilter] = useState<string>(() => localStorage.getItem('ijef_admin2_gender') || 'Semua');
  const [candidateViewMode, setCandidateViewMode] = useState<'table' | 'cards'>(() => (localStorage.getItem('ijef_admin2_viewmode') as 'table' | 'cards') || 'cards');
  const [submitDateSortOrder, setSubmitDateSortOrder] = useState<'DESC' | 'ASC'>(() => (localStorage.getItem('ijef_admin2_date_sort') as 'DESC' | 'ASC') || 'DESC');
  const [sortOption, setSortOption] = useState<string>(() => localStorage.getItem('ijef_admin2_sort_option') || 'default');
  const [mcuAssessmentFilter, setMcuAssessmentFilter] = useState<string>(() => {
    const saved = localStorage.getItem('ijef_admin2_mcu_assessment_filter');
    if (saved) return saved;
    const oldSaved = localStorage.getItem('ijef_admin2_mcu_assessment_only');
    if (oldSaved === 'false') return 'ALL';
    return 'COMPLETE';
  });
  const [documentFilter, setDocumentFilter] = useState<string>(() => {
    return localStorage.getItem('ijef_admin2_document_filter') || 'ALL';
  });
  const [isFilterLocked, setIsFilterLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('ijef_admin2_lock_filter');
    return saved !== null ? saved === 'true' : true;
  });

  // Sync filters to localStorage for Lock Filter capability
  useEffect(() => {
    try {
      localStorage.setItem('ijef_admin2_search', searchTerm);
      localStorage.setItem('ijef_admin2_submit_date', submitDateFilter);
      localStorage.setItem('ijef_admin2_category', categoryFilter);
      localStorage.setItem('ijef_admin2_field', fieldFilter);
      localStorage.setItem('ijef_admin2_status', statusFilter);
      localStorage.setItem('ijef_admin2_gender', genderFilter);
      localStorage.setItem('ijef_admin2_viewmode', candidateViewMode);
      localStorage.setItem('ijef_admin2_date_sort', submitDateSortOrder);
      localStorage.setItem('ijef_admin2_sort_option', sortOption);
      localStorage.setItem('ijef_admin2_mcu_assessment_filter', mcuAssessmentFilter);
      localStorage.setItem('ijef_admin2_document_filter', documentFilter);
      localStorage.setItem('ijef_admin2_lock_filter', String(isFilterLocked));
    } catch {
      // ignore
    }
  }, [searchTerm, submitDateFilter, categoryFilter, fieldFilter, statusFilter, genderFilter, candidateViewMode, submitDateSortOrder, sortOption, mcuAssessmentFilter, documentFilter, isFilterLocked]);

  const [selectedCardIds, setSelectedCardIds] = useState<Record<string, boolean>>({});
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [showStatusMetricsInKandidat, setShowStatusMetricsInKandidat] = useState<boolean>(false);

  // Student Account Management State (Admin 2)
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('Semua');
  const [showAddStudentModalInAdmin2, setShowAddStudentModalInAdmin2] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<CalonSiswa | null>(null);
  const [viewingStudentInAdmin2, setViewingStudentInAdmin2] = useState<CalonSiswa | null>(null);
  const [showResetStudentPassModalInAdmin2, setShowResetStudentPassModalInAdmin2] = useState<CalonSiswa | null>(null);
  const [studentNewPass, setStudentNewPass] = useState('siswa2026!');

  // Form fields for Add/Edit Student in Admin 2
  const [stuNama, setStuNama] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuNoHp, setStuNoHp] = useState('');
  const [stuNoKtp, setStuNoKtp] = useState('');
  const [stuKategori, setStuKategori] = useState('SSW Japan');
  const [stuStatusPendaftaran, setStuStatusPendaftaran] = useState<'Draft' | 'Terdaftar' | 'Terverifikasi' | 'Diterima' | 'Ditolak'>('Terdaftar');

  // Admin Settings & Role Management State
  const adminAccounts = masterSettings.adminUsers || [];
  const AVAILABLE_ADMIN_PERMISSIONS = [
    'Akses Penuh Super Admin (Semua Portal)',
    'Kelola Job Matching & Katalog Lowongan',
    'Edit & Terjemahkan CV JIS (Rirekisho)',
    'Jadwalkan & Kelola Interview Kumiai',
    'Verifikasi Berkas & Kelulusan Siswa',
    'Penilaian MCU, DISC & Psikotes',
    'Pembiayaan & Otorisasi Dana Talang',
    'Penerbitan Kontrak & Surat Perjanjian',
    'Kelola Akun Mitra LPK & Verifikasi',
    'Monitoring Sesi & Manajemen Role Admin'
  ];

  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('Semua');
  const [editingAdminAccount, setEditingAdminAccount] = useState<AdminUser | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin Matching',
    department: 'Divisi Penempatan Jepang (TSK/SSW)',
    portalAccess: 'ADMIN_2_CV_PORTAL' as 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL' | 'STUDENT_PORTAL',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF' | 'Aktif' | 'Nonaktif',
    isSuperAdmin: false,
    permissions: [] as string[],
    newPassword: ''
  });

  const [systemConfig, setSystemConfig] = useState({
    autoSyncFirebase: true,
    realtimeNotification: true,
    autoTranslateJIS: true,
    maintenanceMode: false,
    systemName: 'Portal Back-Office CV-Portal & Matching Job Japan',
    defaultPrefectureFilter: 'Semua',
    maxInterviewLimitPerDay: 15,
    emailAlerts: true
  });

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin Matching',
    department: 'Divisi Penempatan Jepang (TSK/SSW)',
    portalAccess: 'ADMIN_2_CV_PORTAL' as 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL' | 'STUDENT_PORTAL',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF' | 'Aktif' | 'Nonaktif',
    isSuperAdmin: false,
    permissions: ['Kelola Job Matching & Katalog Lowongan', 'Edit & Terjemahkan CV JIS (Rirekisho)'] as string[],
    initialPassword: ''
  });

  // Dashboard Monitoring Filter States
  const [monitoringSelectedStatus, setMonitoringSelectedStatus] = useState<string>('Semua');
  const [monitoringSearchTerm, setMonitoringSearchTerm] = useState<string>('');
  const [monitoringCategoryFilter, setMonitoringCategoryFilter] = useState<string>('Semua');
  const [monitoringSectorFilter, setMonitoringSectorFilter] = useState<string>('Semua');
  const [monitoringGenderFilter, setMonitoringGenderFilter] = useState<string>('Semua');

  const [selectedCVForJis, setSelectedCVForJis] = useState<CVRirekisho | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CVRirekisho | null>(null);
  const [cvModalStudent, setCvModalStudent] = useState<CalonSiswa | null>(null);
  const [previewPhotoZoom, setPreviewPhotoZoom] = useState<{ url: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [showDeleteAllConfirmModal, setShowDeleteAllConfirmModal] = useState<boolean>(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);

  // Dynamic candidate duplicate count
  const detectedCandidateDuplicateCount = React.useMemo(() => {
    const unified = (Object.values(rirekishoRecords) as CVRirekisho[]).map((cv) => cvToUnified(cv));
    const dupGroups = detectDuplicates(unified);
    return dupGroups.length;
  }, [rirekishoRecords]);

  const handleBatchImportJobs = (importedJobs: JobPosting[], replaceAll: boolean) => {
    batchSaveJobPostings(importedJobs, replaceAll);
    setToastMessage(
      replaceAll
        ? `Berhasil menggantikan database dengan ${importedJobs.length} data lowongan dari Spreadsheet.`
        : `Berhasil mengimpor & menambah ${importedJobs.length} data lowongan dari Spreadsheet.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Master Financing Settings Sync State (Admin 2)
  const [baseCostSetting, setBaseCostSetting] = useState<number>(masterSettings.baseProgramCost || 25000000);
  const [adminFeeSetting, setAdminFeeSetting] = useState<number>(masterSettings.adminFeePercent || 2.5);
  const [dt100DpSetting, setDt100DpSetting] = useState<number>(masterSettings.dt100DpPercent || 0);
  const [dt50DpSetting, setDt50DpSetting] = useState<number>(masterSettings.dt50DpPercent || 50);
  const [dp30DpSetting, setDp30DpSetting] = useState<number>(masterSettings.dp30DpPercent || 30);
  const [tenorsSetting, setTenorsSetting] = useState<number[]>(masterSettings.tenorOptions || [3, 6, 12, 18, 24, 36]);

  React.useEffect(() => {
    if (masterSettings) {
      setBaseCostSetting(masterSettings.baseProgramCost || 25000000);
      setAdminFeeSetting(masterSettings.adminFeePercent || 2.5);
      setDt100DpSetting(masterSettings.dt100DpPercent || 0);
      setDt50DpSetting(masterSettings.dt50DpPercent || 50);
      setDp30DpSetting(masterSettings.dp30DpPercent || 30);
      setTenorsSetting(masterSettings.tenorOptions || [3, 6, 12, 18, 24, 36]);
    }
  }, [
    masterSettings?.baseProgramCost,
    masterSettings?.adminFeePercent,
    masterSettings?.dt100DpPercent,
    masterSettings?.dt50DpPercent,
    masterSettings?.dp30DpPercent,
    masterSettings?.tenorOptions?.length
  ]);

  const handleSaveFinancingSettingsInAdmin2 = () => {
    updateMasterSettings({
      baseProgramCost: baseCostSetting,
      adminFeePercent: adminFeeSetting,
      dt100DpPercent: dt100DpSetting,
      dt50DpPercent: dt50DpSetting,
      dp30DpPercent: dp30DpSetting,
      tenorOptions: tenorsSetting
    });
    setToastMessage('Parameter Pembiayaan & Dana Talang berhasil disimpan & disinkronkan ke seluruh sistem!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Student Account Management Handlers (Admin 2)
  const handleOpenAddStudentInAdmin2 = () => {
    setEditingStudent(null);
    setStuNama('');
    setStuEmail('');
    setStuNoHp('');
    setStuNoKtp('');
    setStuKategori('SSW Japan');
    setStuStatusPendaftaran('Terdaftar');
    setShowAddStudentModalInAdmin2(true);
  };

  const handleOpenEditStudentInAdmin2 = (stu: CalonSiswa) => {
    setEditingStudent(stu);
    setStuNama(stu.namaLengkap || '');
    setStuEmail(stu.email || '');
    setStuNoHp(stu.noHp || '');
    setStuNoKtp(stu.noKtp || '');
    setStuKategori(stu.kategoriKandidat || 'SISWA NON IJEF (New Comer)');
    setStuStatusPendaftaran((stu.statusPendaftaran as any) || 'Terdaftar');
    setShowAddStudentModalInAdmin2(true);
  };

  const handleDeleteCandidate = (cv: CVRirekisho) => {
    const candidateName = cv.namaLengkap || 'Kandidat';
    if (window.confirm(lang === 'ja' ? `本当に候補者「${candidateName}」を削除しますか？` : `Apakah Anda yakin ingin menghapus data kandidat "${candidateName}"?`)) {
      const sId = cv.siswaId || cv.id;
      deleteStudent(sId);
      deleteRirekishoRecord(sId);
      setToastMessage(lang === 'ja' ? `候補者「${candidateName}」を削除しました。` : `Berhasil menghapus data kandidat "${candidateName}"!`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSaveStudentSubmitInAdmin2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuNama.trim()) {
      alert('Mohon isi nama lengkap siswa.');
      return;
    }

    const updatedStu: CalonSiswa = editingStudent
      ? {
          ...editingStudent,
          namaLengkap: stuNama,
          email: stuEmail,
          noHp: stuNoHp,
          noKtp: stuNoKtp,
          kategoriKandidat: (stuKategori as CandidateCategory) || 'SISWA NON IJEF (New Comer)',
          statusPendaftaran: stuStatusPendaftaran
        }
      : {
          id: `stu-${Date.now()}`,
          namaLengkap: stuNama,
          email: stuEmail || `siswa.${Date.now()}@ijef.or.id`,
          noHp: stuNoHp || '081234567890',
          kategoriKandidat: (stuKategori as CandidateCategory) || 'SISWA NON IJEF (New Comer)',
          kewarganegaraan: 'Indonesia',
          noKtp: stuNoKtp || '3271000000000000',
          noKk: '3271000000000000',
          alamatDomisili: 'Jl. Merdeka Central No. 12',
          tempatLahir: 'Jakarta',
          tanggalLahir: '2000-01-01',
          agama: 'Islam',
          jenisKelamin: 'Laki-laki',
          golonganDarah: 'O',
          statusPerkawinan: 'Lajang',
          namaAyah: '-',
          pekerjaanAyah: '-',
          ktpNpwpAyah: '-',
          namaIbu: '-',
          pekerjaanIbu: '-',
          ktpNpwpIbu: '-',
          berkasDokumen: {
            pasFoto: '',
            ktpSiswa: '',
            kartuKeluarga: '',
            ijazah: '',
            sertifikatJft: ''
          },
          statusPendaftaran: stuStatusPendaftaran,
          createdAt: new Date().toISOString().split('T')[0]
        };

    saveStudentRegistration(updatedStu);
    setShowAddStudentModalInAdmin2(false);
    setEditingStudent(null);
    setToastMessage(`Akun Siswa "${updatedStu.namaLengkap}" berhasil disimpan & disinkronkan ke Admin Siswa & Admin Doc!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDeleteStudentAccountInAdmin2 = (stuId: string, stuNama: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun siswa "${stuNama}"? Seluruh data pendaftaran dan hasil asesmen akan dihapus.`
      )
    ) {
      deleteStudent(stuId);
      setToastMessage(`Akun siswa "${stuNama}" berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleResetStudentPasswordSubmitInAdmin2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetStudentPassModalInAdmin2) return;
    setToastMessage(
      `Kata sandi akun siswa "${showResetStudentPassModalInAdmin2.namaLengkap}" (${showResetStudentPassModalInAdmin2.email}) telah berhasil diset ulang!`
    );
    setTimeout(() => setToastMessage(null), 3500);
    setShowResetStudentPassModalInAdmin2(null);
    setStudentNewPass('siswa2026!');
  };

  const filteredStudentsInAdmin2 = students.filter((stu) => {
    const matchesSearch =
      (stu.namaLengkap || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (stu.email || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (stu.noHp || '').includes(studentSearchTerm) ||
      (stu.noKtp || '').includes(studentSearchTerm);

    if (studentStatusFilter === 'Semua') return matchesSearch;
    return matchesSearch && stu.statusPendaftaran === studentStatusFilter;
  });

  // Modal State for New/Edit Job
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState<JobPosting>({
    id: `JOB-${Date.now()}`,
    kodeJob: '',
    judulPekerjaan: '',
    perusahaanJepang: '',
    kumiaiRujukan: '',
    lokasiPrefektur: 'Tokyo',
    kategoriTarget: 'SISWA NON IJEF (New Comer)',
    jenisKelamin: '男女 (Laki-laki & Perempuan)',
    gajiBulananYen: 210000,
    gajiString: '210.000円/bulan',
    gajiEstimasiIdr: 22000000,
    persyaratanJLPT: 'Sertifikat JLPT N4 / JFT-Basic A2 + SSW',
    kualifikasi: '',
    biayaProses: 'Sesuai Ketentuan',
    keteranganTambahan: '',
    tskSumberJob: 'Laporan Mandiri',
    deskripsiPekerjaan: '',
    fasilitasAsrama: 'Asrama fully furnished, subsidi listrik & air, asuransi kesehatan.',
    kuotaSiswa: 5,
    statusJob: 'Aktif',
    urgensiJob: 'STANDART',
    statusAktif: true
  });

  // Filter & Detail View States for Job Postings Catalog
  const [jobSearchTerm, setJobSearchTerm] = useState<string>('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('Semua');
  const [jobUrgensiFilter, setJobUrgensiFilter] = useState<string>('Semua');
  const [jobDomisiliFilter, setJobDomisiliFilter] = useState<string>('Semua');
  const [jobTSKFilter, setJobTSKFilter] = useState<string>('Semua');
  const [jobSectorFilter, setJobSectorFilter] = useState<string>('Semua');
  const [jobCategoryFilter, setJobCategoryFilter] = useState<string>('Semua');
  const [jobGenderFilter, setJobGenderFilter] = useState<string>('Semua');
  const [jobViewMode, setJobViewMode] = useState<'grid' | 'table'>('table');
  const [selectedDetailJob, setSelectedDetailJob] = useState<JobPosting | null>(null);
  const [detailModalLang, setDetailModalLang] = useState<'id' | 'ja' | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Modal State for Updating Application Schedule & Status
  const [editAppModal, setEditAppModal] = useState<JobApplication | null>(null);

  // Filter States for Interview Section
  const [appStatusFilter, setAppStatusFilter] = useState<string>('Semua');
  const [appSearchTerm, setAppSearchTerm] = useState<string>('');

  // Admin Settings Handlers
  const handleToggleAccountStatus = (id: string) => {
    const updated = adminAccounts.map((acc) => {
      if (acc.id === id) {
        const isAktif = acc.status === 'AKTIF' || acc.status === 'Aktif';
        return {
          ...acc,
          status: (isAktif ? 'NONAKTIF' : 'AKTIF') as any
        };
      }
      return acc;
    });
    updateMasterSettings({ adminUsers: updated });
    setToastMessage('Status otorisasi akun admin berhasil diperbarui!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAdminAccount = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun admin ini?')) {
      const updated = adminAccounts.filter((acc) => acc.id !== id);
      updateMasterSettings({ adminUsers: updated });
      setToastMessage('Akun admin berhasil dihapus!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleOpenEditAdmin = (acc: AdminUser) => {
    const isSuper = acc.isSuperAdmin || acc.role === 'SuperAdmin' || acc.role === 'Super Admin' || acc.portalAccess === 'ALL_PORTALS';
    setEditingAdminAccount(acc);
    setEditAdminForm({
      name: acc.name || '',
      email: acc.email || '',
      phone: acc.phone || '',
      role: acc.role || 'Admin Matching',
      department: acc.department || 'Divisi Penempatan Jepang (TSK/SSW)',
      portalAccess: (acc.portalAccess as any) || (isSuper ? 'ALL_PORTALS' : 'ADMIN_2_CV_PORTAL'),
      status: (acc.status || 'AKTIF') as any,
      isSuperAdmin: Boolean(isSuper),
      permissions: acc.permissions && acc.permissions.length > 0 ? acc.permissions : isSuper ? [...AVAILABLE_ADMIN_PERMISSIONS] : ['Kelola Job Matching & Katalog Lowongan', 'Edit & Terjemahkan CV JIS (Rirekisho)'],
      newPassword: ''
    });
  };

  const handleSaveEditAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminAccount) return;
    if (!editAdminForm.name || !editAdminForm.email) {
      alert('Mohon isi nama dan email admin!');
      return;
    }

    const isSuper = editAdminForm.isSuperAdmin || editAdminForm.role === 'SuperAdmin' || editAdminForm.role === 'Super Admin' || editAdminForm.portalAccess === 'ALL_PORTALS';

    const updated = adminAccounts.map((acc) => {
      if (acc.id === editingAdminAccount.id) {
        return {
          ...acc,
          name: editAdminForm.name,
          email: editAdminForm.email,
          phone: editAdminForm.phone,
          role: isSuper ? 'SuperAdmin' : editAdminForm.role,
          department: editAdminForm.department,
          portalAccess: isSuper ? ('ALL_PORTALS' as const) : editAdminForm.portalAccess,
          isSuperAdmin: isSuper,
          status: editAdminForm.status,
          permissions: isSuper ? [...AVAILABLE_ADMIN_PERMISSIONS] : editAdminForm.permissions
        };
      }
      return acc;
    });

    updateMasterSettings({ adminUsers: updated });
    setEditingAdminAccount(null);
    setToastMessage(`Akun admin "${editAdminForm.name}" & otorisasi role berhasil diperbarui!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAppointSuperAdmin = (acc: AdminUser) => {
    const isAlreadySuper = acc.isSuperAdmin || acc.role === 'SuperAdmin' || acc.portalAccess === 'ALL_PORTALS';
    const newSuperState = !isAlreadySuper;
    const updated = adminAccounts.map((a) => {
      if (a.id === acc.id) {
        return {
          ...a,
          isSuperAdmin: newSuperState,
          role: newSuperState ? 'SuperAdmin' : 'Admin Matching',
          portalAccess: (newSuperState ? 'ALL_PORTALS' : 'ADMIN_2_CV_PORTAL') as any,
          permissions: newSuperState ? [...AVAILABLE_ADMIN_PERMISSIONS] : ['Kelola Job Matching & Katalog Lowongan', 'Edit & Terjemahkan CV JIS (Rirekisho)']
        };
      }
      return a;
    });
    updateMasterSettings({ adminUsers: updated });
    setToastMessage(
      newSuperState
        ? `👑 "${acc.name}" kini resmi menjadi SUPER ADMIN dengan hak akses universal ke SEMUA PORTAL!`
        : `Hak Super Admin pada "${acc.name}" berhasil dicabut.`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleEditPermission = (perm: string) => {
    setEditAdminForm((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm]
      };
    });
  };

  const handleToggleNewPermission = (perm: string) => {
    setNewAccountForm((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm]
      };
    });
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.name || !newAccountForm.email) {
      alert('Mohon isi nama dan email admin!');
      return;
    }

    const isSuper = newAccountForm.isSuperAdmin || newAccountForm.role === 'Super Admin' || newAccountForm.role === 'SuperAdmin' || newAccountForm.portalAccess === 'ALL_PORTALS';

    const newAcc: AdminUser = {
      id: `ADM-${String(adminAccounts.length + 1).padStart(2, '0')}`,
      name: newAccountForm.name,
      email: newAccountForm.email,
      phone: newAccountForm.phone,
      role: isSuper ? 'SuperAdmin' : newAccountForm.role,
      department: newAccountForm.department,
      portalAccess: isSuper ? 'ALL_PORTALS' : newAccountForm.portalAccess,
      isSuperAdmin: isSuper,
      status: 'AKTIF' as const,
      lastLogin: 'Baru saja',
      permissions: isSuper
        ? [...AVAILABLE_ADMIN_PERMISSIONS]
        : newAccountForm.permissions.length > 0
        ? newAccountForm.permissions
        : ['Kelola Job Matching & Katalog Lowongan', 'Edit & Terjemahkan CV JIS (Rirekisho)']
    };

    updateMasterSettings({ adminUsers: [newAcc, ...adminAccounts] });
    setShowAddAccountModal(false);
    setNewAccountForm({
      name: '',
      email: '',
      phone: '',
      role: 'Admin Matching',
      department: 'Divisi Penempatan Jepang (TSK/SSW)',
      portalAccess: 'ADMIN_2_CV_PORTAL',
      status: 'AKTIF',
      isSuperAdmin: false,
      permissions: ['Kelola Job Matching & Katalog Lowongan', 'Edit & Terjemahkan CV JIS (Rirekisho)'],
      initialPassword: ''
    });
    setToastMessage(
      isSuper
        ? `👑 Akun SUPER ADMIN "${newAcc.name}" berhasil dibuat dengan akses ke semua portal!`
        : `Akun admin "${newAcc.name}" berhasil ditambahkan!`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveSystemConfig = () => {
    setToastMessage('Konfigurasi sistem & aplikasi admin berhasil disimpan!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getCandidateName = (cv: any): string => {
    if (!cv) return 'Kandidat';
    const nameProp = cv.namaLengkap;
    if (typeof nameProp === 'string') return nameProp;
    if (typeof nameProp === 'object' && nameProp !== null) {
      return nameProp.namaLengkap || nameProp.name || nameProp.toString() || 'Kandidat';
    }
    return String(nameProp || cv.nama || 'Kandidat');
  };

  const rirekishoList = React.useMemo(() => {
    const raw = Object.values(rirekishoRecords) as CVRirekisho[];
    const uniqueMap = new Map<string, CVRirekisho>();
    raw.forEach((cv) => {
      const key = cv.id || cv.siswaId;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, cv);
      }
    });
    return Array.from(uniqueMap.values());
  }, [rirekishoRecords]);

  // Date parsing utility for tanggalSubmit
  const parseSubmitDate = React.useCallback((dateStr?: string | null): number => {
    if (!dateStr || dateStr.trim() === '' || dateStr === '-') return 0;
    try {
      const s = dateStr.trim();

      // Case 1: Standard ISO or YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parsed = Date.parse(s);
        if (!isNaN(parsed)) return parsed;
      }

      // Case 2: DD/MM/YYYY or D/M/YYYY with optional time e.g. "6/10/2026 18.18" or "24/07/2026 08:14"
      const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2})[.:](\d{1,2})(?:[.:](\d{1,2}))?)?/);
      if (slashMatch) {
        const day = parseInt(slashMatch[1], 10);
        const month = parseInt(slashMatch[2], 10) - 1;
        const year = parseInt(slashMatch[3], 10);
        const hour = slashMatch[4] ? parseInt(slashMatch[4], 10) : 0;
        const minute = slashMatch[5] ? parseInt(slashMatch[5], 10) : 0;
        const second = slashMatch[6] ? parseInt(slashMatch[6], 10) : 0;
        return new Date(year, month, day, hour, minute, second).getTime();
      }

      // Case 3: DD-MM-YYYY with optional time
      const dashMatch = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2})[.:](\d{1,2}))?/);
      if (dashMatch) {
        const day = parseInt(dashMatch[1], 10);
        const month = parseInt(dashMatch[2], 10) - 1;
        const year = parseInt(dashMatch[3], 10);
        const hour = dashMatch[4] ? parseInt(dashMatch[4], 10) : 0;
        const minute = dashMatch[5] ? parseInt(dashMatch[5], 10) : 0;
        return new Date(year, month, day, hour, minute, 0).getTime();
      }

      const fallback = Date.parse(s);
      return isNaN(fallback) ? 0 : fallback;
    } catch {
      return 0;
    }
  }, []);

  // Check candidate MCU and Assessment completeness
  const checkCandidateMcuAndAssessment = React.useCallback(
    (cv: CVRirekisho) => {
      const candidateId = cv.id;
      const sId = cv.siswaId || cv.id;
      const matchingStu = students.find(
        (s) =>
          (cv.siswaId && s.id === cv.siswaId) ||
          (cv.id && s.id === cv.id) ||
          (cv.email && s.email && s.email.toLowerCase() === cv.email.toLowerCase())
      );
      const stuId = matchingStu?.id;

      const sHealth =
        (sId && healthRecords[sId]) ||
        (candidateId && healthRecords[candidateId]) ||
        (stuId && healthRecords[stuId]);
      const sDisc =
        (sId && discRecords[sId]) ||
        (candidateId && discRecords[candidateId]) ||
        (stuId && discRecords[stuId]);
      const sPsikotes =
        (sId && psikotesRecords[sId]) ||
        (candidateId && psikotesRecords[candidateId]) ||
        (stuId && psikotesRecords[stuId]);

      // MCU status: from healthRecords or from CV's own medical/physical fields
      const hasHealthRecord = Boolean(
        sHealth &&
          (sHealth.statusFit === 'FIT' ||
            sHealth.statusFit === 'NOTE' ||
            sHealth.statusFit === 'UNFIT' ||
            sHealth.tinggiBadan ||
            sHealth.beratBadan ||
            sHealth.catatanDokter ||
            sHealth.tekananDarah)
      );
      const hasCvMedical = Boolean(
        (cv.tinggiBadan && cv.beratBadan) ||
          (cv.butaWarna !== undefined && cv.butaWarna !== '') ||
          cv.penyakitBerat !== undefined
      );
      const hasMcu = hasHealthRecord || hasCvMedical;

      // Assessment status: DISC or Psikotes
      const hasDisc = Boolean(
        sDisc &&
          (sDisc.dominantType ||
            (sDisc.scoreD !== undefined && sDisc.scoreD > 0) ||
            (sDisc.userAnswers && Object.keys(sDisc.userAnswers).length > 0))
      );
      const hasPsikotes = Boolean(
        sPsikotes &&
          (sPsikotes.statusKelulusan ||
            sPsikotes.scorePercentage !== undefined ||
            (sPsikotes.totalCorrect !== undefined && sPsikotes.totalCorrect > 0))
      );
      const hasAssessment = hasDisc || hasPsikotes;

      let mcuLabel = 'BELUM MCU';
      let mcuColor = 'bg-slate-100 text-slate-600 border-slate-200';
      if (sHealth?.statusFit === 'FIT') {
        mcuLabel = 'MCU: FIT';
        mcuColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      } else if (sHealth?.statusFit === 'NOTE') {
        mcuLabel = 'MCU: CATATAN';
        mcuColor = 'bg-amber-50 text-amber-700 border-amber-300';
      } else if (sHealth?.statusFit === 'UNFIT') {
        mcuLabel = 'MCU: UNFIT';
        mcuColor = 'bg-rose-50 text-rose-700 border-rose-300';
      } else if (hasMcu) {
        mcuLabel = 'MCU: TERDATA';
        mcuColor = 'bg-teal-50 text-teal-700 border-teal-300';
      }

      const discBadge = sDisc?.dominantType ? `DISC: ${sDisc.dominantType}` : (hasDisc ? 'DISC: OK' : null);
      const psikoBadge = sPsikotes?.statusKelulusan ? `Psiko: ${sPsikotes.statusKelulusan}` : (sPsikotes?.scorePercentage !== undefined ? `Psiko: ${sPsikotes.scorePercentage}%` : (hasPsikotes ? 'Psiko: OK' : null));

      let assessmentLabel = 'BELUM ASESMEN';
      let assessmentColor = 'bg-slate-100 text-slate-600 border-slate-200';
      if (hasDisc && hasPsikotes) {
        assessmentLabel = discBadge && psikoBadge ? `${discBadge} • ${psikoBadge}` : 'DISC + PSIKOTES';
        assessmentColor = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      } else if (hasDisc) {
        assessmentLabel = discBadge || 'DISC: OK';
        assessmentColor = 'bg-blue-50 text-blue-700 border-blue-300';
      } else if (hasPsikotes) {
        assessmentLabel = psikoBadge || 'PSIKOTES: OK';
        assessmentColor = 'bg-purple-50 text-purple-700 border-purple-300';
      }

      return {
        hasMcu,
        hasDisc,
        hasPsikotes,
        hasAssessment,
        isComplete: hasMcu && hasAssessment,
        mcuFitStatus: sHealth?.statusFit || (hasMcu ? 'FIT' : 'BELUM'),
        mcuLabel,
        mcuColor,
        discBadge,
        psikoBadge,
        assessmentLabel,
        assessmentColor
      };
    },
    [healthRecords, discRecords, psikotesRecords, students]
  );

  // Counts for MCU & Assessment Filter Dropdown
  const mcuFilterCounts = React.useMemo(() => {
    let complete = 0;
    let strict = 0;
    let mcuFit = 0;
    let mcuNote = 0;
    let mcuUnfit = 0;
    let mcuHas = 0;
    let assessHas = 0;
    let discHas = 0;
    let psikoHas = 0;
    let incomplete = 0;
    let noMcu = 0;
    let noAssess = 0;

    rirekishoList.forEach((cv) => {
      const s = checkCandidateMcuAndAssessment(cv);
      if (s.isComplete) complete++;
      if (s.hasMcu && s.hasDisc && s.hasPsikotes) strict++;
      if (s.mcuFitStatus === 'FIT') mcuFit++;
      if (s.mcuFitStatus === 'NOTE') mcuNote++;
      if (s.mcuFitStatus === 'UNFIT') mcuUnfit++;
      if (s.hasMcu) mcuHas++;
      if (s.hasAssessment) assessHas++;
      if (s.hasDisc) discHas++;
      if (s.hasPsikotes) psikoHas++;
      if (!s.isComplete) incomplete++;
      if (!s.hasMcu) noMcu++;
      if (!s.hasAssessment) noAssess++;
    });

    return {
      all: rirekishoList.length,
      complete,
      strict,
      mcuFit,
      mcuNote,
      mcuUnfit,
      mcuHas,
      assessHas,
      discHas,
      psikoHas,
      incomplete,
      noMcu,
      noAssess
    };
  }, [rirekishoList, checkCandidateMcuAndAssessment]);

  // Counts for Document & Readiness Filter Dropdown
  const docFilterCounts = React.useMemo(() => {
    let hasPhoto = 0;
    let hasPassport = 0;
    let hasVideo = 0;
    let noColorBlind = 0;
    let noSmoking = 0;
    let noTattoo = 0;
    let readyInterview = 0;

    rirekishoList.forEach((cv) => {
      const matchingStu = students.find(
        (s) =>
          (cv.siswaId && s.id === cv.siswaId) ||
          (cv.id && s.id === cv.id) ||
          (cv.email && s.email && s.email.toLowerCase() === cv.email.toLowerCase())
      );
      const photo = Boolean(cv.pasFotoUrl || cv.fotoUrl || (matchingStu && (matchingStu.pasFotoUrl || matchingStu.fotoProfilUrl)));
      const passport = Boolean(cv.memilikiPaspor === 'YA' || cv.memilikiPaspor === true || (cv.noPaspor && cv.noPaspor !== '-'));
      const video = Boolean(cv.videoJikoshoukaiUrl || cv.videoUrl || (matchingStu && (matchingStu.videoJikoshoukaiUrl || matchingStu.videoUrl)));
      const colorBlind = cv.butaWarna === 'TIDAK' || cv.butaWarna === false;
      const smoking = cv.merokok === 'TIDAK' || cv.merokok === false;
      const tattoo = cv.memilikiTato === 'TIDAK' || cv.tato === 'TIDAK' || cv.memilikiTato === false || cv.tato === false;
      const testStatus = checkCandidateMcuAndAssessment(cv);

      if (photo) hasPhoto++;
      if (passport) hasPassport++;
      if (video) hasVideo++;
      if (colorBlind) noColorBlind++;
      if (smoking) noSmoking++;
      if (tattoo) noTattoo++;
      if (photo && passport && (testStatus.mcuFitStatus === 'FIT' || testStatus.hasMcu)) readyInterview++;
    });

    return {
      all: rirekishoList.length,
      hasPhoto,
      hasPassport,
      hasVideo,
      noColorBlind,
      noSmoking,
      noTattoo,
      readyInterview
    };
  }, [rirekishoList, students, checkCandidateMcuAndAssessment]);

  // Counts and available months for Tanggal Submit Filter Dropdown
  const submitDateCounts = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    let today = 0;
    let last7Days = 0;
    let last30Days = 0;
    let countThisMonth = 0;
    let countLastMonth = 0;
    let countThisYear = 0;
    let older = 0;
    let hasDate = 0;
    let noDate = 0;

    const monthMap = new Map<string, { year: number; month: number; count: number }>();

    rirekishoList.forEach((cv) => {
      const ts = parseSubmitDate(cv.tanggalSubmit);
      if (ts > 0) {
        hasDate++;
        const d = new Date(ts);
        const y = d.getFullYear();
        const m = d.getMonth();

        if (ts >= startOfToday && ts <= endOfToday) today++;
        if (ts >= sevenDaysAgo) last7Days++;
        if (ts >= thirtyDaysAgo) last30Days++;
        if (y === thisYear && m === thisMonth) countThisMonth++;
        if (y === lastMonthYear && m === lastMonth) countLastMonth++;
        if (y === thisYear) countThisYear++;
        if (y < thisYear) older++;

        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        const existing = monthMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          monthMap.set(key, { year: y, month: m, count: 1 });
        }
      } else {
        noDate++;
      }
    });

    const monthList = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const label = lang === 'ja'
          ? `${data.year}年 ${MONTH_NAMES_JA[data.month]}`
          : `${MONTH_NAMES_ID[data.month]} ${data.year}`;
        return { key, label, count: data.count };
      });

    return {
      all: rirekishoList.length,
      today,
      last7Days,
      last30Days,
      thisMonth: countThisMonth,
      lastMonth: countLastMonth,
      thisYear: countThisYear,
      older,
      hasDate,
      noDate,
      monthList
    };
  }, [rirekishoList, parseSubmitDate, lang]);

  const getSubmitDateLabel = React.useCallback((val: string) => {
    if (!val || val === 'ALL') return lang === 'ja' ? '全提出日' : 'Semua Tanggal';
    if (val === 'TODAY') return lang === 'ja' ? '本日' : 'Hari Ini';
    if (val === 'LAST_7_DAYS') return lang === 'ja' ? '過去7日間' : '7 Hari Terakhir';
    if (val === 'LAST_30_DAYS') return lang === 'ja' ? '過去30日間' : '30 Hari Terakhir';
    if (val === 'THIS_MONTH') return lang === 'ja' ? '今月' : 'Bulan Ini';
    if (val === 'LAST_MONTH') return lang === 'ja' ? '先月' : 'Bulan Lalu';
    if (val === 'THIS_YEAR') return lang === 'ja' ? '今年' : 'Tahun Ini';
    if (val === 'OLDER') return lang === 'ja' ? '過去データ' : 'Arsip Lama';
    if (val === 'HAS_DATE') return lang === 'ja' ? '提出日あり' : 'Ada Tanggal';
    if (val === 'NO_DATE') return lang === 'ja' ? '未設定' : 'Tanpa Tanggal';
    if (val && typeof val === 'string' && val.startsWith('MONTH:')) {
      const ym = val.replace('MONTH:', '');
      const parts = ym.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return lang === 'ja' ? `${y}年 ${MONTH_NAMES_JA[m]}` : `${MONTH_NAMES_ID[m]} ${y}`;
      }
      return ym;
    }
    return val;
  }, [lang]);

  const getSortOptionLabel = React.useCallback((val: string) => {
    switch (val) {
      case 'NAME_ASC':
        return lang === 'ja' ? '氏名 (A-Z)' : 'nama (A-Z)';
      case 'NAME_DESC':
        return lang === 'ja' ? '氏名 (Z-A)' : 'nama (Z-A)';
      case 'DATE_NEWEST':
        return lang === 'ja' ? '日付: 最新順' : 'tanggal terbaru';
      case 'DATE_OLDEST_WITH_EMPTY':
        return lang === 'ja'
          ? '日付: 最も古い順 (日付なし含む)'
          : 'tanggal paling lama (masukkan data yang tidak ada tanggal)';
      case 'LAST_7_DAYS':
        return lang === 'ja' ? '過去7日間' : '7 hari terakhir';
      case 'LAST_30_DAYS':
        return lang === 'ja' ? '過去30日間' : '30 hari terakhir';
      case 'THIS_MONTH':
        return lang === 'ja' ? '今月' : 'bulan ini';
      case 'LAST_MONTH':
        return lang === 'ja' ? '先月' : 'bulan lalu';
      default:
        return lang === 'ja' ? 'デフォルト' : 'default';
    }
  }, [lang]);

  // Filtered and Sorted Rirekisho list matching Filter bar & locked filters
  const filteredCVs = React.useMemo(() => {
    const list = rirekishoList.filter((cv) => {
      // Search text
      const matchSearch =
        !searchTerm ||
        cv.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cv.namaPanggilan && cv.namaPanggilan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cv.kodeJob && cv.kodeJob.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cv.kodeReferensi && cv.kodeReferensi.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cv.email && cv.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // Submit Date Matching
      let matchDate = true;
      if (submitDateFilter && submitDateFilter !== 'ALL') {
        const ts = parseSubmitDate(cv.tanggalSubmit);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();
        const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonth = lastMonthDate.getMonth();

        if (submitDateFilter === 'TODAY') {
          matchDate = ts >= startOfToday && ts <= endOfToday;
        } else if (submitDateFilter === 'LAST_7_DAYS') {
          matchDate = ts >= sevenDaysAgo;
        } else if (submitDateFilter === 'LAST_30_DAYS') {
          matchDate = ts >= thirtyDaysAgo;
        } else if (submitDateFilter === 'THIS_MONTH') {
          if (ts > 0) {
            const d = new Date(ts);
            matchDate = d.getFullYear() === thisYear && d.getMonth() === thisMonth;
          } else {
            matchDate = false;
          }
        } else if (submitDateFilter === 'LAST_MONTH') {
          if (ts > 0) {
            const d = new Date(ts);
            matchDate = d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
          } else {
            matchDate = false;
          }
        } else if (submitDateFilter === 'THIS_YEAR') {
          if (ts > 0) {
            const d = new Date(ts);
            matchDate = d.getFullYear() === thisYear;
          } else {
            matchDate = false;
          }
        } else if (submitDateFilter === 'OLDER') {
          if (ts > 0) {
            const d = new Date(ts);
            matchDate = d.getFullYear() < thisYear;
          } else {
            matchDate = false;
          }
        } else if (submitDateFilter === 'HAS_DATE') {
          matchDate = ts > 0;
        } else if (submitDateFilter === 'NO_DATE') {
          matchDate = ts === 0;
        } else if (submitDateFilter && typeof submitDateFilter === 'string' && submitDateFilter.startsWith('MONTH:')) {
          if (ts > 0) {
            const targetKey = submitDateFilter.replace('MONTH:', '');
            const d = new Date(ts);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            matchDate = key === targetKey;
          } else {
            matchDate = false;
          }
        } else {
          matchDate = Boolean(cv.tanggalSubmit && cv.tanggalSubmit.includes(submitDateFilter));
        }
      }

      // Sort Option Period Filtering (7 hari terakhir, 30 hari terakhir, bulan ini, bulan lalu)
      let matchSortPeriod = true;
      if (sortOption === 'LAST_7_DAYS') {
        const ts = parseSubmitDate(cv.tanggalSubmit);
        const now = new Date();
        const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        matchSortPeriod = ts >= sevenDaysAgo;
      } else if (sortOption === 'LAST_30_DAYS') {
        const ts = parseSubmitDate(cv.tanggalSubmit);
        const now = new Date();
        const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        matchSortPeriod = ts >= thirtyDaysAgo;
      } else if (sortOption === 'THIS_MONTH') {
        const ts = parseSubmitDate(cv.tanggalSubmit);
        if (ts > 0) {
          const now = new Date();
          const d = new Date(ts);
          matchSortPeriod = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        } else {
          matchSortPeriod = false;
        }
      } else if (sortOption === 'LAST_MONTH') {
        const ts = parseSubmitDate(cv.tanggalSubmit);
        if (ts > 0) {
          const now = new Date();
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const d = new Date(ts);
          matchSortPeriod = d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
        } else {
          matchSortPeriod = false;
        }
      }

      // Category
      let matchCategory = true;
      if (categoryFilter !== 'Semua') {
        const matchingStu = students.find(
          (s) =>
            (cv.siswaId && s.id === cv.siswaId) ||
            (cv.id && s.id === cv.id) ||
            (cv.email && s.email && s.email.toLowerCase() === cv.email.toLowerCase())
        );
        const catVal = (cv.kategoriKandidat || cv.programDiminati || matchingStu?.kategoriKandidat || '').toString().trim().toUpperCase();
        const filterUp = categoryFilter.toUpperCase();
        if (filterUp.includes('IJEF - OFFLINE') || filterUp.includes('SISWA IJEF - OFFLINE')) {
          matchCategory = catVal.includes('IJEF - OFFLINE') || catVal === 'SISWA IJEF - OFFLINE' || catVal === 'IJEF OFFLINE';
        } else if (filterUp.includes('IJEF - ONLINE') || filterUp.includes('SISWA IJEF - ONLINE')) {
          matchCategory = catVal.includes('IJEF - ONLINE') || catVal === 'SISWA IJEF - ONLINE' || catVal === 'IJEF ONLINE';
        } else if (filterUp.includes('MITRA')) {
          matchCategory = catVal.includes('MITRA') || catVal.includes('SISWA MITRA');
        } else if (filterUp.includes('NEW COMER') || filterUp.includes('NON IJEF')) {
          matchCategory = catVal.includes('NON IJEF') || catVal.includes('NEW COMER') || catVal.includes('NON-IJEF');
        } else if (filterUp.includes('EX-MAGANG') || filterUp.includes('EX MAGANG') || filterUp.includes('TRAINEE')) {
          matchCategory = catVal.includes('EX-MAGANG') || catVal.includes('EX MAGANG') || catVal.includes('TRAINEE');
        } else if (filterUp.includes('ENGINEER') || filterUp.includes('GIJINKOKU')) {
          matchCategory = catVal.includes('ENGINEER') || catVal.includes('GIJINKOKU');
        } else {
          matchCategory = catVal === filterUp || catVal.includes(filterUp);
        }
      }

      // Field (Bidang) using unified sector normalization
      let matchField = true;
      if (fieldFilter !== 'Semua') {
        const norm = normalizeCandidateSector(cv.bidangKerja);
        if (fieldFilter === 'KAIGO') {
          matchField = norm === 'KAIGO';
        } else if (fieldFilter === 'PM' || fieldFilter === 'Pengolahan Makanan') {
          matchField = norm === 'PM';
        } else if (fieldFilter === 'PERTANIAN' || fieldFilter === 'Pertanian' || fieldFilter === 'PETERNAKAN') {
          matchField = norm === 'PERTANIAN';
        } else if (fieldFilter === 'KIKAI_KAKOU' || fieldFilter === 'KIKAI KAKOU' || fieldFilter === 'Manufaktur') {
          matchField = norm === 'KIKAI_KAKOU';
        } else if (fieldFilter === 'ENGINEERING' || fieldFilter === 'Engineer') {
          matchField = norm === 'ENGINEERING';
        } else if (fieldFilter === 'KONSTRUKSI' || fieldFilter === 'Konstruksi') {
          matchField = norm === 'KONSTRUKSI';
        } else if (fieldFilter === 'BUILDING_CLEANING' || fieldFilter === 'Building Cleaning') {
          matchField = norm === 'BUILDING_CLEANING';
        } else if (fieldFilter === 'Lainnya') {
          matchField = norm === 'ENGINEERING' || norm === 'KIKAI_KAKOU' || norm === 'KONSTRUKSI' || norm === 'BUILDING_CLEANING' || norm === 'LAINNYA';
        } else {
          matchField = norm === normalizeCandidateSector(fieldFilter) || (cv.bidangKerja || '').toUpperCase().includes(fieldFilter.toUpperCase());
        }
      }

      // Status Progres
      let matchStatus = true;
      const stLower = (cv.statusProgres || '').toLowerCase().trim();
      if (statusFilter === 'Semua') {
        matchStatus = true;
      } else if (statusFilter === 'Nihongo check') {
        matchStatus = stLower.includes('nihongo check') && !stLower.includes('belum') && !stLower.includes('tidak');
      } else if (statusFilter === 'Belum Lolos Nihongo check') {
        matchStatus = stLower.includes('belum lolos nihongo') || stLower.includes('tidak lolos nihongo');
      } else if (statusFilter === 'Pending Nunggu Job' || statusFilter === 'Siap Matching') {
        matchStatus = isCandidateSiapMatching(cv);
      } else if (statusFilter === 'Penjadwalan Interview' || statusFilter === 'Terjadwal Interview') {
        matchStatus =
          stLower.includes('penjadwalan interview') ||
          stLower.includes('terjadwal interview') ||
          stLower.includes('jadwal interview');
      } else if (statusFilter === 'On Proses') {
        matchStatus = stLower.includes('on proses') || stLower === 'proses' || stLower.includes('sedang proses');
      } else if (statusFilter === 'Tidak Lolos Interview') {
        matchStatus =
          stLower.includes('tidak lolos interview') ||
          stLower.includes('gagal interview') ||
          stLower === 'ditolak';
      } else if (statusFilter === 'Lolos Interview (Naitei)') {
        matchStatus = (stLower.includes('lolos interview') && !stLower.includes('tidak')) || stLower.includes('naitei') || stLower.includes('lolos naitei');
      } else if (statusFilter === 'Proses Visas/COE' || statusFilter === 'Proses Visa / COE') {
        matchStatus = stLower.includes('proses visa') || stLower.includes('proses visas') || stLower.includes('coe') || stLower.includes('visa');
      } else if (statusFilter === 'Status On Job (Selesai)') {
        matchStatus = stLower.includes('on job') || stLower.includes('selesai') || stLower.includes('status on job');
      } else if (statusFilter === 'Naitei & Visa') {
        matchStatus =
          stLower.includes('on job') ||
          stLower.includes('selesai') ||
          stLower.includes('naitei') ||
          stLower.includes('lolos interview') ||
          stLower.includes('visa') ||
          stLower.includes('coe');
      } else if (statusFilter === 'Cancel') {
        matchStatus = stLower.includes('cancel') || stLower.includes('batal') || stLower.includes('mengundurkan diri');
      } else if (statusFilter === 'Belum Ada' || statusFilter === 'Belum Ada Status') {
        matchStatus = !stLower || stLower === 'belum ada' || stLower === 'belum ada status' || stLower === '-';
      } else if (statusFilter === 'SEMUA_SIAP_MATCHING') {
        matchStatus =
          isCandidateSiapMatching(cv) ||
          stLower.includes('interview') ||
          stLower.includes('naitei') ||
          stLower.includes('visa') ||
          stLower.includes('coe');
      } else {
        matchStatus = cv.statusProgres === statusFilter;
      }

      // Gender Filter (Pria vs Wanita)
      let matchGender = true;
      if (genderFilter !== 'Semua') {
        const g = (cv.jenisKelamin || '').toString().toLowerCase().trim();
        const isMale = g === 'laki-laki' || g.includes('laki') || g.includes('pria') || g === 'l' || g.includes('男');
        const isFemale = g === 'perempuan' || g.includes('perempuan') || g.includes('wanita') || g === 'p' || g.includes('女');
        if (genderFilter === 'Laki-laki') {
          matchGender = isMale;
        } else if (genderFilter === 'Perempuan') {
          matchGender = isFemale;
        }
      }

      // MCU & Assessment Completeness Filter
      let matchMcuAssessment = true;
      if (mcuAssessmentFilter !== 'ALL') {
        const testStatus = checkCandidateMcuAndAssessment(cv);
        if (mcuAssessmentFilter === 'COMPLETE') {
          matchMcuAssessment = testStatus.isComplete;
        } else if (mcuAssessmentFilter === 'STRICT') {
          matchMcuAssessment = testStatus.hasMcu && testStatus.hasDisc && testStatus.hasPsikotes;
        } else if (mcuAssessmentFilter === 'MCU_FIT') {
          matchMcuAssessment = testStatus.mcuFitStatus === 'FIT';
        } else if (mcuAssessmentFilter === 'MCU_NOTE') {
          matchMcuAssessment = testStatus.mcuFitStatus === 'NOTE';
        } else if (mcuAssessmentFilter === 'MCU_UNFIT') {
          matchMcuAssessment = testStatus.mcuFitStatus === 'UNFIT';
        } else if (mcuAssessmentFilter === 'MCU_HAS') {
          matchMcuAssessment = testStatus.hasMcu;
        } else if (mcuAssessmentFilter === 'ASSESSMENT_HAS') {
          matchMcuAssessment = testStatus.hasAssessment;
        } else if (mcuAssessmentFilter === 'DISC_ONLY') {
          matchMcuAssessment = testStatus.hasDisc;
        } else if (mcuAssessmentFilter === 'PSIKOTES_ONLY') {
          matchMcuAssessment = testStatus.hasPsikotes;
        } else if (mcuAssessmentFilter === 'INCOMPLETE') {
          matchMcuAssessment = !testStatus.isComplete;
        } else if (mcuAssessmentFilter === 'NO_MCU') {
          matchMcuAssessment = !testStatus.hasMcu;
        } else if (mcuAssessmentFilter === 'NO_ASSESSMENT') {
          matchMcuAssessment = !testStatus.hasAssessment;
        }
      }

      // Document & Readiness Filter
      let matchDocument = true;
      if (documentFilter !== 'ALL') {
        const matchingStu = students.find(
          (s) =>
            (cv.siswaId && s.id === cv.siswaId) ||
            (cv.id && s.id === cv.id) ||
            (cv.email && s.email && s.email.toLowerCase() === cv.email.toLowerCase())
        );
        const photo = Boolean(cv.pasFotoUrl || cv.fotoUrl || (matchingStu && (matchingStu.pasFotoUrl || matchingStu.fotoProfilUrl)));
        const passport = Boolean(cv.memilikiPaspor === 'YA' || cv.memilikiPaspor === true || (cv.noPaspor && cv.noPaspor !== '-'));
        const video = Boolean(cv.videoJikoshoukaiUrl || cv.videoUrl || (matchingStu && (matchingStu.videoJikoshoukaiUrl || matchingStu.videoUrl)));
        const isNotColorBlind = cv.butaWarna === 'TIDAK' || cv.butaWarna === false;
        const isNonSmoker = cv.merokok === 'TIDAK' || cv.merokok === false;
        const isNoTattoo = cv.memilikiTato === 'TIDAK' || cv.tato === 'TIDAK' || cv.memilikiTato === false || cv.tato === false;

        if (documentFilter === 'HAS_PHOTO') {
          matchDocument = photo;
        } else if (documentFilter === 'HAS_PASSPORT') {
          matchDocument = passport;
        } else if (documentFilter === 'HAS_VIDEO') {
          matchDocument = video;
        } else if (documentFilter === 'NO_COLOR_BLIND') {
          matchDocument = isNotColorBlind;
        } else if (documentFilter === 'NO_SMOKING') {
          matchDocument = isNonSmoker;
        } else if (documentFilter === 'NO_TATTOO') {
          matchDocument = isNoTattoo;
        } else if (documentFilter === 'READY_INTERVIEW') {
          const testStatus = checkCandidateMcuAndAssessment(cv);
          matchDocument = photo && passport && (testStatus.mcuFitStatus === 'FIT' || testStatus.hasMcu);
        }
      }

      return matchSearch && matchDate && matchSortPeriod && matchCategory && matchField && matchStatus && matchGender && matchMcuAssessment && matchDocument;
    });

    // Sort by sortOption: default, nama (A-Z), nama (Z-A), tanggal terbaru, tanggal paling lama (masukkan data yang tidak ada tanggal), 7 hari terakhir, 30 hari terakhir, bulan ini, bulan lalu
    return list.sort((a, b) => {
      if (sortOption === 'NAME_ASC') {
        return (a.namaLengkap || '').localeCompare(b.namaLengkap || '', 'id', { sensitivity: 'base' });
      }
      if (sortOption === 'NAME_DESC') {
        return (b.namaLengkap || '').localeCompare(a.namaLengkap || '', 'id', { sensitivity: 'base' });
      }
      if (sortOption === 'DATE_OLDEST_WITH_EMPTY') {
        // Tanggal paling lama (masukkan data yang tidak ada tanggal)
        const timeA = parseSubmitDate(a.tanggalSubmit);
        const timeB = parseSubmitDate(b.tanggalSubmit);
        // Time 0 (tanpa tanggal) ikut diurutkan di awal / paling lama
        return timeA - timeB;
      }
      if (
        sortOption === 'DATE_NEWEST' ||
        sortOption === 'default' ||
        sortOption === 'LAST_7_DAYS' ||
        sortOption === 'LAST_30_DAYS' ||
        sortOption === 'THIS_MONTH' ||
        sortOption === 'LAST_MONTH'
      ) {
        // Tanggal terbaru di atas (data tanpa tanggal diletakkan di akhir)
        const timeA = parseSubmitDate(a.tanggalSubmit);
        const timeB = parseSubmitDate(b.tanggalSubmit);
        if (timeA === 0 && timeB === 0) return 0;
        if (timeA === 0) return 1;
        if (timeB === 0) return -1;
        return timeB - timeA;
      }

      const timeA = parseSubmitDate(a.tanggalSubmit);
      const timeB = parseSubmitDate(b.tanggalSubmit);
      if (timeA === 0 && timeB === 0) return 0;
      if (timeA === 0) return 1;
      if (timeB === 0) return -1;
      return timeB - timeA;
    });
  }, [
    rirekishoList,
    searchTerm,
    submitDateFilter,
    categoryFilter,
    fieldFilter,
    statusFilter,
    genderFilter,
    mcuAssessmentFilter,
    documentFilter,
    submitDateSortOrder,
    sortOption,
    checkCandidateMcuAndAssessment,
    parseSubmitDate,
    students
  ]);

  // Calculate candidate count per progress status for Dashboard Monitoring
  const statusCounts = React.useMemo(() => {
    const stats = calculateCandidateStatistics(rirekishoList);
    return {
      'Semua': stats.total,
      'Nihongo check': stats.nihongoCheck,
      'Belum Lolos Nihongo check': stats.belumLolosNihongo,
      'Pending Nunggu Job': stats.pendingNungguJob,
      'Penjadwalan Interview': stats.penjadwalanInterview,
      'On Proses': stats.onProses,
      'Tidak Lolos Interview': stats.tidakLolosInterview,
      'Status On Job (Selesai)': stats.statusOnJob,
      'Cancel': stats.cancel,
      'Lolos Interview (Naitei)': stats.lolosInterview,
      'Proses Visas/COE': stats.prosesVisa,
      'Belum Ada': stats.belumAda
    };
  }, [rirekishoList]);

  // Candidate Metrics & Breakdown Stats for Data Kandidat Dashboard
  const candidateDashboardStats = React.useMemo(() => {
    const total = rirekishoList.length;

    let kaigoCount = 0;
    let pmCount = 0;
    let pertanianCount = 0;
    let peternakanCount = 0;
    let kikaiKakouCount = 0;
    let engineeringCount = 0;
    let konstruksiCount = 0;
    let cleaningCount = 0;
    let otherFieldCount = 0;

    let newComerCount = 0;
    let exMagangCount = 0;
    let siswaIjefCount = 0;
    let engCatCount = 0;

    let onProsesCount = 0;
    let pendingJobCount = 0;
    let naiteiCount = 0;
    let coeVisaCount = 0;
    let cancelCount = 0;
    let belumAdaCount = 0;

    rirekishoList.forEach((cv) => {
      // Unified Sector Classification using normalizeCandidateSector
      const normSector = normalizeCandidateSector(cv.bidangKerja);
      if (normSector === 'KAIGO') kaigoCount++;
      else if (normSector === 'PM') pmCount++;
      else if (normSector === 'PERTANIAN') pertanianCount++;
      else if (normSector === 'KIKAI_KAKOU') kikaiKakouCount++;
      else if (normSector === 'ENGINEERING') engineeringCount++;
      else if (normSector === 'KONSTRUKSI') konstruksiCount++;
      else if (normSector === 'BUILDING_CLEANING') cleaningCount++;
      else otherFieldCount++;

      // Category
      const cat = (cv.kategoriKandidat || '').toUpperCase();
      if (cat.includes('EX') || cat.includes('MAGANG') || cat.includes('TRAINEE')) exMagangCount++;
      else if (cat.includes('SISWA IJEF')) siswaIjefCount++;
      else if (cat.includes('ENGINEER') || cat.includes('GIJINKOKU')) engCatCount++;
      else newComerCount++;

      // Status
      const st = (cv.statusProgres as string) || 'Belum Ada';
      if (isCandidateSiapMatching(cv)) pendingJobCount++;
      else if (st === 'On Proses') onProsesCount++;
      else if (st === 'Lolos Interview (Naitei)') naiteiCount++;
      else if (st.includes('Visa') || st.includes('COE')) coeVisaCount++;
      else if (st === 'Cancel') cancelCount++;
      else belumAdaCount++;
    });

    const matchingReadyCount = pendingJobCount;
    const terjadwalInterviewCount = rirekishoList.filter((cv) => cv.statusProgres === 'Terjadwal Interview' || cv.statusProgres === 'Penjadwalan Interview').length;
    const lolosNaiteiVisaCount = naiteiCount + coeVisaCount;
    const totalSiapMatchingTigaStatus = matchingReadyCount + terjadwalInterviewCount + lolosNaiteiVisaCount;

    return {
      total,
      fields: {
        kaigo: kaigoCount,
        pm: pmCount,
        pertanian: pertanianCount,
        peternakan: peternakanCount,
        kikaiKakou: kikaiKakouCount,
        engineering: engineeringCount,
        konstruksi: konstruksiCount,
        cleaning: cleaningCount,
        other: otherFieldCount
      },
      categories: {
        newComer: newComerCount,
        exMagang: exMagangCount,
        siswaIjef: siswaIjefCount,
        engineering: engCatCount
      },
      status: {
        onProses: onProsesCount,
        pendingJob: pendingJobCount,
        naitei: naiteiCount,
        coeVisa: coeVisaCount,
        cancel: cancelCount,
        belumAda: belumAdaCount,
        siapMatching: matchingReadyCount,
        terjadwalInterview: terjadwalInterviewCount,
        naiteiVisa: lolosNaiteiVisaCount,
        totalMatching: totalSiapMatchingTigaStatus
      }
    };
  }, [rirekishoList]);

  // Job Postings Metrics & Breakdown Stats for Job Catalog Dashboard
  const jobDashboardStats = React.useMemo(() => {
    const total = jobPostings.length;
    const totalKuota = jobPostings.reduce((sum, j) => sum + (Number(j.kuotaSiswa) || 1), 0);

    let kaigoCount = 0;
    let kaigoKuota = 0;
    let pmCount = 0;
    let pmKuota = 0;
    let pertanianCount = 0;
    let pertanianKuota = 0;
    let restoranCount = 0;
    let restoranKuota = 0;
    let engineeringCount = 0;
    let engineeringKuota = 0;
    let otherCount = 0;
    let otherKuota = 0;

    let aktifCount = 0;
    let aktifKuota = 0;
    let tutupCount = 0;
    let tutupKuota = 0;

    let domestikJepangCount = 0;
    let domestikJepangKuota = 0;
    let lokalIndoCount = 0;
    let lokalIndoKuota = 0;

    let urgentCount = 0;
    let urgentKuota = 0;
    let standartCount = 0;
    let standartKuota = 0;
    let slowCount = 0;
    let slowKuota = 0;

    let newComerCount = 0;
    let exMagangCount = 0;
    let gijinkokuCount = 0;
    let semuaCatCount = 0;

    let priaCount = 0;
    let wanitaCount = 0;
    let bebasGenderCount = 0;

    const tskMap: Record<string, number> = {};

    jobPostings.forEach((j) => {
      const kuota = Number(j.kuotaSiswa) || 1;
      const title = (j.judulPekerjaan || '').toUpperCase();
      const status = j.statusJob;
      const domisili = j.kategoriDomisili || (status === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
      const urgensi = (j.urgensiJob || 'STANDART').toUpperCase();
      const cat = (j.kategoriTarget || '').toUpperCase();
      const gender = (j.jenisKelamin || '').toUpperCase();
      const tsk = j.tskSumberJob?.trim() || 'Internal IJEF';

      // Urgensi breakdown (URGENT, STANDART, SLOW)
      if (urgensi === 'URGENT') {
        urgentCount++;
        urgentKuota += kuota;
      } else if (urgensi === 'SLOW') {
        slowCount++;
        slowKuota += kuota;
      } else {
        standartCount++;
        standartKuota += kuota;
      }

      // Sektor breakdown
      if (title.includes('KAIGO') || title.includes('CAREGIVER') || title.includes('CARE GIVER') || title.includes('介護')) {
        kaigoCount++;
        kaigoKuota += kuota;
      } else if (title.includes('PENGOLAHAN MAKANAN') || title.includes('MAKANAN') || title.includes('PM') || title.includes('飲食') || title.includes('BENTO') || title.includes('ROTI') || title.includes('FOOD')) {
        pmCount++;
        pmKuota += kuota;
      } else if (title.includes('PERTANIAN') || title.includes('PETERNAKAN') || title.includes('SAPI') || title.includes('AYAM') || title.includes('TANI') || title.includes('農業') || title.includes('畜産') || title.includes('PERKEBUNAN')) {
        pertanianCount++;
        pertanianKuota += kuota;
      } else if (title.includes('RESTORAN') || title.includes('HOTEL') || title.includes('PERHOTELAN') || title.includes('PELAYANAN') || title.includes('外食')) {
        restoranCount++;
        restoranKuota += kuota;
      } else if (title.includes('SEIBI') || title.includes('KIKAI') || title.includes('OTOMOTIF') || title.includes('PENGELASAN') || title.includes('MANUFAKTUR') || title.includes('KONSTRUKSI') || title.includes('TOBI') || title.includes('DOBOKU') || title.includes('ENGINEER') || title.includes('GIJINKOKU') || title.includes('MESIN') || title.includes('PABRIK') || title.includes('TEKNIK')) {
        engineeringCount++;
        engineeringKuota += kuota;
      } else {
        otherCount++;
        otherKuota += kuota;
      }

      // Status breakdown: Hanya Aktif dan Close / Tutup
      const rawStatusStr = (status || '').toString().trim().toLowerCase();
      const isClosedStatus =
        rawStatusStr === 'tutup' ||
        rawStatusStr === 'closed' ||
        rawStatusStr === 'close' ||
        rawStatusStr === 'クローズ' ||
        rawStatusStr.includes('tutup') ||
        rawStatusStr.includes('closed') ||
        rawStatusStr.includes('close') ||
        rawStatusStr.includes('クローズ') ||
        j.statusAktif === false;

      if (isClosedStatus) {
        tutupCount++;
        tutupKuota += kuota;
      } else {
        aktifCount++;
        aktifKuota += kuota;
      }

      // Kategori Domisili Job Siswa breakdown (Domestik Jepang vs Lokal Indonesia)
      if (domisili === 'Domestik (Jepang)') {
        domestikJepangCount++;
        domestikJepangKuota += kuota;
      } else {
        lokalIndoCount++;
        lokalIndoKuota += kuota;
      }

      // Kategori Target breakdown
      if (cat.includes('EX-MAGANG') || cat.includes('EX MAGANG') || cat.includes('TRAINEE')) {
        exMagangCount++;
      } else if (cat.includes('ENGINEERING') || cat.includes('GIJINKOKU')) {
        gijinkokuCount++;
      } else if (cat.includes('NEW COMER') || cat.includes('NON IJEF') || cat.includes('NON-IJEF')) {
        newComerCount++;
      } else {
        semuaCatCount++;
      }

      // Gender breakdown
      if (gender.includes('男 (LAKI-LAKI)') || gender === 'PRIA' || gender === 'LAKI-LAKI' || (gender.includes('LAKI') && !gender.includes('PEREMPUAN'))) {
        priaCount++;
      } else if (gender.includes('女 (PEREMPUAN)') || gender === 'WANITA' || gender === 'PEREMPUAN' || (gender.includes('PEREMPUAN') && !gender.includes('LAKI'))) {
        wanitaCount++;
      } else {
        bebasGenderCount++;
      }

      // TSK counts
      if (tsk && !/^rp\s*/i.test(tsk) && !/^\d{1,3}(\.\d{3}){2,}/.test(tsk)) {
        tskMap[tsk] = (tskMap[tsk] || 0) + 1;
      }
    });

    const topTSKs = Object.entries(tskMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      totalKuota,
      fields: {
        kaigo: { count: kaigoCount, kuota: kaigoKuota },
        pm: { count: pmCount, kuota: pmKuota },
        pertanian: { count: pertanianCount, kuota: pertanianKuota },
        restoran: { count: restoranCount, kuota: restoranKuota },
        engineering: { count: engineeringCount, kuota: engineeringKuota },
        other: { count: otherCount, kuota: otherKuota }
      },
      status: {
        aktif: { count: aktifCount, kuota: aktifKuota },
        tutup: { count: tutupCount, kuota: tutupKuota },
        totalAktif: { count: aktifCount, kuota: aktifKuota }
      },
      domisili: {
        domestik: { count: domestikJepangCount, kuota: domestikJepangKuota },
        lokal: { count: lokalIndoCount, kuota: lokalIndoKuota }
      },
      urgensi: {
        urgent: { count: urgentCount, kuota: urgentKuota },
        standart: { count: standartCount, kuota: standartKuota },
        slow: { count: slowCount, kuota: slowKuota }
      },
      categories: {
        newComer: newComerCount,
        exMagang: exMagangCount,
        engineering: gijinkokuCount,
        semua: semuaCatCount
      },
      gender: {
        pria: priaCount,
        wanita: wanitaCount,
        bebas: bebasGenderCount
      },
      topTSKs
    };
  }, [jobPostings]);

  const handleResetJobFilters = () => {
    setJobSearchTerm('');
    setJobStatusFilter('Semua');
    setJobUrgensiFilter('Semua');
    setJobDomisiliFilter('Semua');
    setJobTSKFilter('Semua');
    setJobSectorFilter('Semua');
    setJobCategoryFilter('Semua');
    setJobGenderFilter('Semua');
  };

  // Dynamic Breakdown stats for Bidang Kerja (Work Field)
  const bidangKerjaStats = React.useMemo(() => {
    const countsMap: Record<string, number> = {};
    const total = rirekishoList.length;

    rirekishoList.forEach((cv) => {
      const norm = normalizeCandidateSector(cv.bidangKerja);
      countsMap[norm] = (countsMap[norm] || 0) + 1;
    });

    const list = Object.entries(countsMap)
      .map(([name, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return { name, count, pct };
      })
      .sort((a, b) => b.count - a.count);

    return { list, total };
  }, [rirekishoList]);

  // Dynamic Breakdown stats for Category (Kategori)
  const kategoriStats = React.useMemo(() => {
    let newComerCount = 0;
    let exMagangCount = 0;
    let engineeringCount = 0;
    const total = rirekishoList.length;

    rirekishoList.forEach((cv) => {
      const cat = (cv.kategoriKandidat || '').toUpperCase();
      if (cat.includes('EX') || cat.includes('MAGANG') || cat.includes('TRAINEE')) {
        exMagangCount++;
      } else if (cat.includes('ENGINEER') || cat.includes('GIJINKOKU') || cat.includes('SKILLED')) {
        engineeringCount++;
      } else {
        newComerCount++;
      }
    });

    return [
      {
        id: 'NEW COMER',
        badge: 'NEW COMER',
        count: newComerCount,
        pct: total > 0 ? Math.round((newComerCount / total) * 100) : 0,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
        barClass: 'bg-emerald-500'
      },
      {
        id: 'EX MAGANG/EX-TRAINEER',
        badge: 'EX-MAGANG/EX-TRAINEER',
        count: exMagangCount,
        pct: total > 0 ? Math.round((exMagangCount / total) * 100) : 0,
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
        barClass: 'bg-purple-500'
      },
      {
        id: 'ENGINEERING/GIJINKOKU',
        badge: 'ENGINEERING/GIJINKOKU',
        count: engineeringCount,
        pct: total > 0 ? Math.round((engineeringCount / total) * 100) : 0,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        barClass: 'bg-amber-500'
      }
    ];
  }, [rirekishoList]);

  // Filtered list specifically for Dashboard Monitoring view
  const filteredMonitoringCVs = React.useMemo(() => {
    return rirekishoList.filter((cv) => {
      const matchSearch =
        !monitoringSearchTerm ||
        getCandidateName(cv).toLowerCase().includes(monitoringSearchTerm.toLowerCase()) ||
        (cv.namaPanggilan && cv.namaPanggilan.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.namaTSK && cv.namaTSK.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.namaPerusahaanJp && cv.namaPerusahaanJp.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.keteranganProgres && cv.keteranganProgres.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.detailProgres && cv.detailProgres.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.kodeJob && cv.kodeJob.toLowerCase().includes(monitoringSearchTerm.toLowerCase())) ||
        (cv.kodeReferensi && cv.kodeReferensi.toLowerCase().includes(monitoringSearchTerm.toLowerCase()));

      let matchStatus = true;
      const mStLower = (cv.statusProgres || '').toLowerCase().trim();
      if (monitoringSelectedStatus === 'Semua') {
        matchStatus = true;
      } else if (monitoringSelectedStatus === 'Nihongo check') {
        matchStatus = mStLower.includes('nihongo check') && !mStLower.includes('belum') && !mStLower.includes('tidak');
      } else if (monitoringSelectedStatus === 'Belum Lolos Nihongo check') {
        matchStatus = mStLower.includes('belum lolos nihongo') || mStLower.includes('tidak lolos nihongo');
      } else if (monitoringSelectedStatus === 'Pending Nunggu Job') {
        matchStatus = isCandidateSiapMatching(cv);
      } else if (monitoringSelectedStatus === 'Penjadwalan Interview' || monitoringSelectedStatus === 'Terjadwal Interview') {
        matchStatus =
          mStLower.includes('penjadwalan interview') ||
          mStLower.includes('terjadwal interview') ||
          mStLower.includes('jadwal interview');
      } else if (monitoringSelectedStatus === 'On Proses') {
        matchStatus = mStLower.includes('on proses') || mStLower === 'proses' || mStLower.includes('sedang proses');
      } else if (monitoringSelectedStatus === 'Tidak Lolos Interview') {
        matchStatus =
          mStLower.includes('tidak lolos interview') ||
          mStLower.includes('gagal interview') ||
          mStLower === 'ditolak';
      } else if (monitoringSelectedStatus === 'Lolos Interview (Naitei)') {
        matchStatus = (mStLower.includes('lolos interview') && !mStLower.includes('tidak')) || mStLower.includes('naitei') || mStLower.includes('lolos naitei');
      } else if (monitoringSelectedStatus === 'Proses Visas/COE' || monitoringSelectedStatus === 'Proses Visa / COE') {
        matchStatus = mStLower.includes('proses visa') || mStLower.includes('proses visas') || mStLower.includes('coe') || mStLower.includes('visa');
      } else if (monitoringSelectedStatus === 'Status On Job (Selesai)') {
        matchStatus = mStLower.includes('on job') || mStLower.includes('selesai') || mStLower.includes('status on job');
      } else if (monitoringSelectedStatus === 'Cancel') {
        matchStatus = mStLower.includes('cancel') || mStLower.includes('batal') || mStLower.includes('mengundurkan diri');
      } else if (monitoringSelectedStatus === 'Belum Ada' || monitoringSelectedStatus === 'Belum Ada Status') {
        matchStatus = !mStLower || mStLower === 'belum ada' || mStLower === 'belum ada status' || mStLower === '-';
      } else {
        matchStatus = cv.statusProgres === monitoringSelectedStatus;
      }

      let matchCat = true;
      if (monitoringCategoryFilter !== 'Semua') {
        const catVal = (cv.kategoriKandidat || '').toString().trim().toUpperCase();
        const filterUp = monitoringCategoryFilter.toUpperCase();
        if (filterUp.includes('NEW COMER') || filterUp.includes('NON IJEF')) {
          matchCat = catVal.includes('NON IJEF') || catVal.includes('NEW COMER') || catVal.includes('MITRA');
        } else if (filterUp.includes('EX-MAGANG') || filterUp.includes('EX MAGANG') || filterUp.includes('TRAINEE')) {
          matchCat = catVal.includes('EX-MAGANG') || catVal.includes('EX MAGANG') || catVal.includes('TRAINEE');
        } else if (filterUp.includes('ENGINEER') || filterUp.includes('GIJINKOKU')) {
          matchCat = catVal.includes('ENGINEER') || catVal.includes('GIJINKOKU');
        } else if (filterUp.includes('MITRA')) {
          matchCat = catVal.includes('MITRA');
        } else if (filterUp.includes('IJEF - OFFLINE')) {
          matchCat = catVal.includes('IJEF - OFFLINE') || catVal === 'SISWA IJEF - OFFLINE';
        } else if (filterUp.includes('IJEF - ONLINE')) {
          matchCat = catVal.includes('IJEF - ONLINE') || catVal === 'SISWA IJEF - ONLINE';
        } else {
          matchCat = catVal === filterUp || catVal.includes(filterUp);
        }
      }

      let matchSector = true;
      if (monitoringSectorFilter !== 'Semua') {
        const norm = normalizeCandidateSector(cv.bidangKerja);
        matchSector = norm === monitoringSectorFilter;
      }

      let matchGender = true;
      if (monitoringGenderFilter !== 'Semua') {
        const g = (cv.jenisKelamin || '').toString().toLowerCase().trim();
        const isMale = g === 'laki-laki' || g.includes('laki') || g.includes('pria') || g === 'l' || g.includes('男');
        const isFemale = g === 'perempuan' || g.includes('perempuan') || g.includes('wanita') || g === 'p' || g.includes('女');
        if (monitoringGenderFilter === 'Laki-laki') {
          matchGender = isMale;
        } else if (monitoringGenderFilter === 'Perempuan') {
          matchGender = isFemale;
        }
      }

      return matchSearch && matchStatus && matchCat && matchSector && matchGender;
    });
  }, [rirekishoList, monitoringSearchTerm, monitoringSelectedStatus, monitoringCategoryFilter, monitoringSectorFilter, monitoringGenderFilter]);

  const handleNavigateToCandidateProgress = (candidate: CVRirekisho) => {
    setEditingCandidate(candidate);
    setEditModalTab('progres');
  };

  const renderStatusBadge = (status?: string) => {
    const st = status || 'Belum Ada';
    let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
    let label = translateProgressStatus(st, lang);

    if (st === 'Nihongo check') {
      colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    } else if (st === 'Belum Lolos Nihongo check') {
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    } else if (st === 'Pending Nunggu Job') {
      colorClasses = 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
    } else if (st === 'Penjadwalan Interview' || st === 'Terjadwal Interview') {
      colorClasses = 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
    } else if (st === 'On Proses') {
      colorClasses = 'bg-sky-100 text-sky-800 border-sky-300 font-bold';
    } else if (st === 'Tidak Lolos Interview') {
      colorClasses = 'bg-red-100 text-red-800 border-red-300 font-bold';
    } else if (st === 'Status On Job (Selesai)') {
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    } else if (st === 'Cancel') {
      colorClasses = 'bg-slate-200 text-slate-700 border-slate-400 font-bold';
    } else if (st === 'Lolos Interview (Naitei)') {
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    } else if (st === 'Proses Visas/COE' || st === 'Proses Visa / COE') {
      colorClasses = 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] border whitespace-nowrap shadow-xs ${colorClasses}`}>
        {label}
      </span>
    );
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Auto refresh data siswa dari Supabase DB saat komponen Admin 2 dimuat
  React.useEffect(() => {
    async function loadInitialSupabaseStudents() {
      try {
        const res = await fetchSiswaFromSupabase();
        if (res.success && res.students && res.students.length > 0) {
          console.log(`[Supabase Admin Dashboard] Memuat ${res.students.length} data siswa dari tabel siswa`);
          setStudents(res.students);
          if (res.cvMap && Object.keys(res.cvMap).length > 0) {
            setRirekishoRecords(res.cvMap);
          }
        }
      } catch (err) {
        console.warn('Initial Supabase fetch warning:', err);
      }
    }
    loadInitialSupabaseStudents();
    refreshFirebaseDomain('all').catch((err) => {
      console.warn('Initial domain refresh warning:', err);
    });
  }, []);

  const handleSyncFirebase = async () => {
    setIsSyncing(true);
    try {
      const spRes = await fetchSiswaFromSupabase();
      if (spRes.success && spRes.students && spRes.students.length > 0) {
        setStudents(spRes.students);
        if (spRes.cvMap && Object.keys(spRes.cvMap).length > 0) {
          setRirekishoRecords(spRes.cvMap);
        }
      }
      const res = await refreshFirebaseDomain('all');
      setIsSyncing(false);
      const totalCount = spRes.count || res?.count || rirekishoList.length;
      setToastMessage(
        lang === 'ja'
          ? `Supabaseデータベースと正常に同期しました（${totalCount}件の最新生徒データを更新）`
          : `Berhasil menyinkronkan & memuat ${totalCount} data siswa terbaru dari Supabase Database!`
      );
    } catch (err: any) {
      console.error('Error syncing to Supabase:', err);
      setIsSyncing(false);
      setToastMessage(
        lang === 'ja'
          ? `同期エラー: ${err?.message || '不明なエラー'}`
          : `Gagal sinkronisasi: ${err?.message || 'Terjadi kesalahan'}`
      );
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSubmitDateFilter('ALL');
    setCategoryFilter('Semua');
    setFieldFilter('Semua');
    setStatusFilter('Semua');
    setGenderFilter('Semua');
    setMcuAssessmentFilter('ALL');
    setDocumentFilter('ALL');
    setSubmitDateSortOrder('DESC');
    setSortOption('default');
    try {
      localStorage.removeItem('ijef_admin2_search');
      localStorage.removeItem('ijef_admin2_submit_date');
      localStorage.removeItem('ijef_admin2_category');
      localStorage.removeItem('ijef_admin2_field');
      localStorage.removeItem('ijef_admin2_status');
      localStorage.removeItem('ijef_admin2_gender');
      localStorage.removeItem('ijef_admin2_date_sort');
      localStorage.removeItem('ijef_admin2_sort_option');
      localStorage.removeItem('ijef_admin2_mcu_assessment_filter');
      localStorage.removeItem('ijef_admin2_document_filter');
      localStorage.removeItem('ijef_admin2_mcu_assessment_only');
    } catch {
      // ignore
    }
  };

  const handleTranslateAllCandidates = () => {
    rirekishoList.forEach((cv) => {
      const translated = autoTranslateCandidateCV(cv);
      saveRirekishoRecord(translated);
    });
    setToastMessage(`Auto translate ke EYD Bahasa Jepang untuk ${rirekishoList.length} kandidat berhasil!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveCandidateFromModal = (updatedCandidate: CVRirekisho) => {
    saveRirekishoRecord(updatedCandidate);
    setEditingCandidate(null);
    setToastMessage(`Data kandidat ${updatedCandidate.namaLengkap} berhasil diperbarui!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    saveJobPosting(jobForm);
    setShowJobModal(false);
  };

  const handleSaveAppUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editAppModal) {
      let formattedJadwal = editAppModal.jadwalInterview || '';

      if (editAppModal.tanggalInterview) {
        const parts = editAppModal.tanggalInterview.split('-');
        if (parts.length === 3) {
          const yyyy = parseInt(parts[0]);
          const mm = parseInt(parts[1]);
          const dd = parseInt(parts[2]);
          const dateObj = new Date(yyyy, mm - 1, dd);
          const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
          ];
          const dayName = dayNames[dateObj.getDay()] || 'Hari';
          const monthName = monthNames[dateObj.getMonth()] || 'Bulan';
          const timeStr = editAppModal.waktuInterview ? `Jam ${editAppModal.waktuInterview} WIB` : '';
          const modeStr =
            editAppModal.metodeInterview === 'OFFLINE'
              ? `Offline @ ${editAppModal.lokasiInterview || 'Kantor LPK IJEF'}`
              : `Online via ${editAppModal.lokasiInterview?.includes('meet') ? 'Google Meet' : 'Zoom'}`;

          formattedJadwal = `${dayName}, ${dd} ${monthName} ${yyyy} - ${timeStr} (${modeStr})`;
        }
      }

      const finalApp: JobApplication = {
        ...editAppModal,
        jadwalInterview: formattedJadwal,
        linkInterviewZoom:
          editAppModal.metodeInterview === 'ONLINE'
            ? editAppModal.lokasiInterview || editAppModal.linkInterviewZoom
            : editAppModal.linkInterviewZoom
      };

      saveJobApplication(finalApp);

      // Sync candidate's statusProgres in rirekishoRecords
      const cvRecord = (Object.values(rirekishoRecords) as CVRirekisho[]).find(
        (c) =>
          c.siswaId === finalApp.siswaId ||
          c.id === finalApp.siswaId ||
          (c.email && finalApp.emailSiswa && c.email.toLowerCase() === finalApp.emailSiswa.toLowerCase())
      );
      if (cvRecord) {
        let newProgress = cvRecord.statusProgres;
        if (finalApp.statusLamaran.includes('Lolos')) {
          newProgress = 'Lolos Interview (Naitei)';
        } else if (finalApp.statusLamaran.includes('Terjadwal')) {
          newProgress = 'Terjadwal Interview';
        } else if (finalApp.statusLamaran.includes('Visa') || finalApp.statusLamaran.includes('COE')) {
          newProgress = 'Proses Visa / COE';
        } else if (finalApp.statusLamaran.includes('Ditolak')) {
          newProgress = 'Cancel';
        }

        saveRirekishoRecord({
          ...cvRecord,
          statusProgres: newProgress,
          detailProgres: `Update Interview (${finalApp.metodeInterview || 'ONLINE'}): ${finalApp.statusLamaran} | ${formattedJadwal}`
        });
      }

      setEditAppModal(null);
      setToastMessage(`Jadwal interview & status seleksi ${finalApp.namaSiswa} berhasil diperbarui!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleNewInterview = () => {
    const firstCand = rirekishoList[0];
    const firstJob = jobPostings[0];
    const todayStr = new Date().toISOString().split('T')[0];

    setEditAppModal({
      id: `APP-${Date.now()}`,
      jobId: firstJob?.id || 'JOB-JPN-101',
      jobJudul: firstJob?.judulPekerjaan || 'Tokutei Ginou Kaigo Caregiver',
      perusahaanJepang: firstJob?.perusahaanJepang || 'Kousei Welfare Medical Association Co., Ltd.',
      siswaId: firstCand?.siswaId || 'SISWA-2026-004',
      namaSiswa: firstCand?.namaLengkap || 'Rian Hidayat',
      emailSiswa: firstCand?.email || 'rian.hidayat@gmail.com',
      kategoriKandidat: firstCand?.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
      tanggalLamar: todayStr,
      statusLamaran: 'Terjadwal Interview',
      metodeInterview: 'ONLINE',
      tanggalInterview: todayStr,
      waktuInterview: '09:00',
      lokasiInterview: 'https://zoom.us/j/9876543210',
      jadwalInterview: 'Terjadwal Interview Online via Zoom',
      catatanPerusahaan: 'Mohon persiapkan berpakaian kemeja putih / jas rapi.'
    });
  };

  const filteredApplications = React.useMemo(() => {
    // Collect existing student emails/IDs in jobApplications
    const existingStudentKeys = new Set(
      jobApplications.map((a) => (a.siswaId || a.emailSiswa || '').toLowerCase())
    );

    // Synthesize entries for any candidates in rirekishoList with interview status not yet in jobApplications
    const syntheticApps: JobApplication[] = [];
    rirekishoList.forEach((cv) => {
      const key = (cv.siswaId || cv.email || '').toLowerCase();
      if (!existingStudentKeys.has(key) && cv.statusProgres) {
        const isInterview = cv.statusProgres === 'Terjadwal Interview';
        const isLolos = cv.statusProgres === 'Lolos Interview (Naitei)';
        const isVisa = cv.statusProgres.includes('Visa') || cv.statusProgres.includes('COE');

        if (isInterview || isLolos || isVisa) {
          syntheticApps.push({
            id: `APP-SYNTH-${cv.siswaId || cv.id}`,
            jobId: cv.kodeJob ? `JOB-${cv.kodeJob}` : 'JOB-JPN-104',
            jobJudul: cv.bidangKerja ? `Tokutei Ginou ${cv.bidangKerja}` : 'Tokutei Ginou Pertanian',
            perusahaanJepang: cv.namaPerusahaanJp || 'Japan Partner Enterprise Co., Ltd.',
            siswaId: cv.siswaId || cv.id,
            namaSiswa: cv.namaLengkap,
            emailSiswa: cv.email || 'kandidat@gmail.com',
            kategoriKandidat: cv.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
            tanggalLamar: new Date().toISOString().split('T')[0],
            statusLamaran: isLolos
              ? 'Lolos Interview (Naitei)'
              : isVisa
              ? 'Proses Visa / COE'
              : 'Terjadwal Interview',
            metodeInterview: 'ONLINE',
            tanggalInterview: new Date().toISOString().split('T')[0],
            waktuInterview: '09:00',
            lokasiInterview: cv.lokasiPerusahaanJp || 'https://zoom.us/j/9876543210',
            jadwalInterview: cv.detailProgres || 'Terjadwal Interview Online via Zoom',
            linkInterviewZoom: 'https://zoom.us/j/9876543210',
            catatanPerusahaan: cv.namaTSK || 'Jadwal interview dari Admin LPK IJEF CORP.'
          });
        }
      }
    });

    const allApps = [...jobApplications, ...syntheticApps];

    return allApps.filter((app) => {
      const matchSearch =
        !appSearchTerm ||
        app.namaSiswa.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
        app.emailSiswa.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
        app.jobJudul.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
        app.perusahaanJepang.toLowerCase().includes(appSearchTerm.toLowerCase());

      let matchStatus = true;
      if (appStatusFilter === 'Lolos Interview (Naitei)') {
        matchStatus = app.statusLamaran.includes('Lolos') || app.statusLamaran.includes('Naitei');
      } else if (appStatusFilter === 'Terjadwal Interview') {
        matchStatus = app.statusLamaran.includes('Terjadwal');
      } else if (appStatusFilter === 'Seleksi Berkas Rirekisho') {
        matchStatus = app.statusLamaran.includes('Berkas') || app.statusLamaran.includes('Rirekisho');
      } else if (appStatusFilter === 'Proses Visa / COE') {
        matchStatus = app.statusLamaran.includes('Visa') || app.statusLamaran.includes('COE');
      } else if (appStatusFilter !== 'Semua') {
        matchStatus = app.statusLamaran === appStatusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [jobApplications, rirekishoList, appSearchTerm, appStatusFilter]);

  const navItems = [
    {
      id: 'monitoring',
      label: lang === 'ja' ? '📊 進捗モニタリングダッシュボード' : 'Dashboard Monitoring Progres',
      badge: null,
      icon: BarChart3,
      color: 'amber',
      desc: lang === 'ja' ? '統計メトリクスと候補者サマリー' : 'Metrik statistik & ringkasan kandidat'
    },
    {
      id: 'kandidat',
      label: lang === 'ja' ? '👥 JIS標準履歴書候補者データ' : 'Data Kandidat CV Rirekisho',
      badge: rirekishoList.length,
      icon: Users,
      color: 'sky',
      desc: lang === 'ja' ? 'データベース＆履歴書自動翻訳' : 'Database & auto-translate CV Jepang'
    },
    {
      id: 'jobs',
      label: lang === 'ja' ? '💼 求人案件カタログ' : 'Katalog Job Postings',
      badge: jobPostings.length,
      icon: Briefcase,
      color: 'emerald',
      desc: lang === 'ja' ? '監理団体・特定技能・介護求人' : 'Lowongan kerja Kumiai & Kaigo'
    },
    {
      id: 'applications',
      label: lang === 'ja' ? '📅 面接＆選考管理' : 'Interview & Selection',
      badge: jobApplications.length,
      icon: Calendar,
      color: 'pink',
      desc: lang === 'ja' ? 'Zoom面接スケジュール管理' : 'Jadwal wawancara Zoom Kumiai'
    },
    {
      id: 'dana',
      label: lang === 'ja' ? '💰 渡航費用・融資' : 'Pembiayaan Keberangkatan',
      badge: null,
      icon: Banknote,
      color: 'amber',
      desc: lang === 'ja' ? '渡航前ローン＆自己資金管理' : 'Dana Talang 100% & Dana Mandiri Keberangkatan'
    },
    {
      id: 'kontrak',
      label: lang === 'ja' ? '📜 契約書・保証書' : 'Surat Perjanjian LPK',
      badge: null,
      icon: FileText,
      color: 'emerald',
      desc: lang === 'ja' ? '保証書＆雇用契約文書' : 'Dokumen garansi & kontrak kerja'
    },
    {
      id: 'mitra-terdaftar',
      label: lang === 'ja' ? '🏛️ 提携先・登録済みLPK一覧' : 'Daftar Mitra Terdaftar',
      badge: (masterSettings.adminUsers || []).filter(
        (m) => m && (m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL' || (m.id && typeof m.id === 'string' && m.id.startsWith('MTR')) || (m.mitraType && m.mitraType.length > 0))
      ).length || null,
      icon: Handshake,
      color: 'amber',
      desc: lang === 'ja' ? '登録済みLPK・受入機関一覧＆メール事前登録' : 'Kelola daftar lembaga mitra terdaftar & otorisasi email portal mitra'
    },
    {
      id: 'mitra-approval',
      label: lang === 'ja' ? '🤝 提携LPK申請承認管理' : 'Approval Pengajuan Mitra',
      badge: (mitraSubmissions || []).filter((s) => s.status === 'PENDING').length || null,
      icon: UserCheck,
      color: 'amber',
      desc: lang === 'ja' ? '生徒登録・独自求人・応募の審査承認' : 'Sistem verifikasi & persetujuan registrasi siswa, job mitra & lamaran'
    },
    {
      id: 'accounts',
      label: lang === 'ja' ? '🛡️ アカウント＆ロール権限管理' : 'Manajemen Akun & Super Admin',
      badge: adminAccounts.length + students.length,
      icon: ShieldAlert,
      color: 'purple',
      desc: lang === 'ja' ? '全アカウント管理＆スーパー管理者設定' : 'Wewenang kelola semua akun, tunjuk Super Admin & role'
    },
    {
      id: 'settings',
      label: lang === 'ja' ? '⚙️ 管理設定＆生徒アカウント' : 'Setting Admin & Akun Siswa',
      badge: null,
      icon: Settings,
      color: 'purple',
      desc: lang === 'ja' ? 'ポータルロール＆同期設定' : 'Manajemen peranan & akun portal'
    },
    {
      id: 'petunjuk',
      label: lang === 'ja' ? '📖 利用ガイド＆権限階層' : 'Petunjuk Penggunaan & Hirarki',
      badge: null,
      icon: BookOpen,
      color: 'indigo',
      desc: lang === 'ja' ? 'マニュアルガイド＆プロセスフロー' : 'Panduan manual, hirarki peranan & alur proses'
    },
  ];

  const currentNavItem = navItems.find((n) => n.id === activeTab) || navItems[0];
  const CurrentNavIcon = currentNavItem.icon;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-purple-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Backdrop Overlay for Admin 2 Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Left Collapsible Slide-Over Sidebar for Admin 2 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] sm:w-80 bg-slate-900 border-r border-purple-900/40 text-slate-100 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-purple-900/50 flex items-center justify-between bg-purple-950/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md border border-purple-400/40 shrink-0">
              A2
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">ADMIN 2 • CV-PORTAL</h2>
              <p className="text-[10px] text-purple-300 font-mono">Job Matching Japan</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/60 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Tutup Menu Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Info Banner */}
        <div className="p-3 mx-3 mt-3 bg-purple-950/60 rounded-xl border border-purple-800/60 text-xs space-y-1">
          <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Modul Navigasi Admin Doc</span>
          </div>
          <div className="text-[11px] text-purple-200">
            Pilih menu di bawah ini. Sidebar akan tertutup secara otomatis setelah dipilih.
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-purple-900">
          <div className="px-2 py-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">
            Menu Utama Back-Office
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false); // AUTO TERTUTUP KEMBALI
                }}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition min-h-[48px] group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60 border border-purple-400/50 font-bold'
                    : 'text-slate-300 hover:bg-purple-950/50 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-950/80 text-purple-300 group-hover:text-amber-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-snug truncate flex items-center space-x-1.5">
                      <span>{item.label}</span>
                      {item.badge !== null && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                            isActive
                              ? 'bg-white text-purple-900'
                              : 'bg-purple-900/80 text-purple-200 border border-purple-700/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-purple-100' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3.5 border-t border-purple-900/50 bg-purple-950/90 text-center text-[10px] text-purple-300/80 font-mono">
          <span>LPK IJEF CORP • Admin Doc CV-Portal v2.6</span>
        </div>
      </aside>

      {/* Admin Doc Header Banner - Compact & Refined */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 border border-purple-400/30 rounded-xl p-2.5 sm:p-3 shadow-sm text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
          <div className="space-y-0.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-white/15 text-white px-2 py-0.5 rounded-full text-[9px] font-bold border border-white/20 backdrop-blur-xs">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>{tDoc.portalBadge}</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight leading-snug">
              {tDoc.portalTitle}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-purple-200/90 font-normal leading-relaxed">
              {tDoc.portalSubtitle}
            </p>
          </div>

          {/* Action Tools, Sidebar Menu Trigger & Active Module Indicator */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 3-Line Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1.5 rounded-lg shadow-xs border border-amber-300 transition flex items-center space-x-1.5 cursor-pointer group shrink-0 active:scale-95 text-xs"
              title={lang === 'ja' ? 'サイドバーメニューを開く' : 'Buka Menu Navigasi Sidebar (3 Garis)'}
            >
              <Menu className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-[7px] font-black uppercase tracking-wider text-slate-800">
                  {lang === 'ja' ? 'ナビゲーション' : 'Menu Navigasi'}
                </div>
                <div className="text-[11px] font-black text-slate-950 flex items-center space-x-0.5">
                  <span>{lang === 'ja' ? 'メニューを開く' : 'Buka Sidebar'}</span>
                  <ChevronRight className="w-2.5 h-2.5 text-slate-900 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>

            {/* Active Module Indicator Badge */}
            <div className="bg-purple-950/80 border border-purple-400/40 py-1 px-2.5 rounded-lg flex items-center space-x-1.5 text-xs shrink-0 shadow-inner">
              <CurrentNavIcon className="w-3 h-3 text-amber-300 shrink-0" />
              <div>
                <span className="text-[7px] font-bold text-purple-300 uppercase block tracking-wider leading-none">
                  {lang === 'ja' ? '選択中:' : 'Modul Aktif:'}
                </span>
                <span className="font-bold text-white text-[11px]">
                  {currentNavItem.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Firebase Real-Time Synchronization & Auto-Update Control Bar */}
      <FirebaseSyncControlBar domain="all" variant="card" showCounters={true} />

      {/* TAB 1: DATA KANDIDAT CV RIREKISHO */}
      {activeTab === 'kandidat' && (
        <div className="space-y-5 w-full max-w-full overflow-hidden">
          {/* Top Title & Main Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
            <div>
              <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold mb-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>{lang === 'ja' ? 'JIS標準日本履歴書インベントリ' : 'INVENTARIS CV STANDAR JIS JAPAN'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '履歴書・候補者データ管理' : 'Data Kandidat Rirekisho'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'ja'
                  ? `登録候補者数 ${rirekishoList.length} 名 • 表示中 ${filteredCVs.length} 名`
                  : `Total ${rirekishoList.length} kandidat terdaftar • ${filteredCVs.length} kandidat ditampilkan`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowDriveModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'Google Drive同期' : 'Tarik Data Google Drive IJEF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDuplicateModal(true)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5 cursor-pointer ${
                  detectedCandidateDuplicateCount > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 border border-amber-400/40 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
                title={lang === 'ja' ? '候補者・履歴書データの重複チェック (NIK/メール/電話番号/氏名)' : 'Cek duplikasi data kandidat (NIK, Email, No. HP, Nama)'}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '重複データ確認' : 'Cek Duplicate Data'}</span>
                {detectedCandidateDuplicateCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-black font-mono">
                    {detectedCandidateDuplicateCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSyncFirebase}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (lang === 'ja' ? '同期中...' : 'Menyingkronkan...') : (lang === 'ja' ? 'Firebase同期' : 'Sinkronkan Firebase')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setToastMessage(lang === 'ja' ? '全候補者の証明書抽出が完了しました！' : 'Ekstraksi sertifikat seluruh kandidat selesai!');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '証明書抽出' : 'Ekstraksi Sertifikat'}</span>
              </button>

              <button
                type="button"
                onClick={handleTranslateAllCandidates}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '全件自動翻訳' : 'Translate Semua'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetFilter}
                className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'リセット' : 'Reset Semua'}</span>
              </button>
            </div>
          </div>

          {/* MITRA PENDING APPROVAL ALERT BANNER */}
          {(mitraSubmissions || []).some(s => s.status === 'PENDING') && (
            <div className="p-4 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 border border-amber-300/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      {lang === 'ja' ? '提携LPKからの申請承認待ち' : 'Pengajuan Mitra Menunggu Approval Admin Doc'}
                    </span>
                    <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                      {(mitraSubmissions || []).filter(s => s.status === 'PENDING').length} Baru
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">
                    {lang === 'ja'
                      ? '提携校・パートナーから登録申請、独自求人、選考応募が届いています。'
                      : 'Terdapat pengajuan registrasi siswa baru, lowongan job mitra, dan lamaran job yang membutuhkan verifikasi & persetujuan.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('mitra-approval')}
                className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center space-x-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>{lang === 'ja' ? '承認ダッシュボードを開く' : 'Buka Dashboard Approval'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DASHBOARD STATISTIK SPESIFIK & PERSENTASE DARI TOTAL SISWA (OPSIONAL DI TAB KANDIDAT) */}
          {showStatusMetricsInKandidat && (
            <CandidateDashboardStatistics
              candidates={rirekishoList}
              selectedStatus={statusFilter}
              onSelectStatus={(statusKey) => setStatusFilter(statusKey)}
              selectedGender={genderFilter}
              onSelectGender={(genderKey) => setGenderFilter(genderKey)}
              selectedCategory={categoryFilter}
              onSelectCategory={(catKey) => setCategoryFilter(catKey)}
              onRefresh={handleSyncFirebase}
              isRefreshing={isSyncing}
            />
          )}

          {/* DASHBOARD JUMLAH KANDIDAT & KLASIFIKASI SEKTOR (LIGHT THEME) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-xs">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {lang === 'ja' ? '統計ダッシュボード ＆ 候補者分類' : 'Dashboard Statistik & Klasifikasi Kandidat'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ja' ? '統計カードをクリックして候補者をすばやくフィルタリングできます' : 'Klik pada kartu statistik untuk memfilter data kandidat secara interaktif'}
                </p>
              </div>

              {/* Active Filter Badges Indicator */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Toggle Status Progres & Gender */}
                <button
                  type="button"
                  onClick={() => setShowStatusMetricsInKandidat(!showStatusMetricsInKandidat)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border shadow-xs ${
                    showStatusMetricsInKandidat
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  }`}
                  title={showStatusMetricsInKandidat ? 'Sembunyikan panel metrik 8 status progres' : 'Buka panel metrik 8 status progres dan gender'}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    {showStatusMetricsInKandidat
                      ? (lang === 'ja' ? '進捗ステータスを隠す' : 'Sembunyikan Status Progres')
                      : (lang === 'ja' ? '📊 進捗ステータスを表示' : '📊 Tampilkan Status Progres')}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatusMetricsInKandidat ? 'rotate-180' : ''}`} />
                </button>
                {genderFilter !== 'Semua' && (
                  <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                    <span>{genderFilter === 'Laki-laki' ? '♂ Filter: Pria' : '♀ Filter: Wanita'}</span>
                    <button
                      type="button"
                      onClick={() => setGenderFilter('Semua')}
                      className="text-blue-500 hover:text-blue-900 ml-1 cursor-pointer font-black"
                      title="Hapus filter gender"
                    >
                      ×
                    </button>
                  </span>
                )}
                {submitDateFilter !== 'ALL' && submitDateFilter !== '' && (
                  <span className="inline-flex items-center space-x-1.5 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                    <span>📅 {getSubmitDateLabel(submitDateFilter)}</span>
                    <button
                      type="button"
                      onClick={() => setSubmitDateFilter('ALL')}
                      className="text-purple-500 hover:text-purple-900 ml-1 cursor-pointer font-black"
                      title="Hapus filter tanggal submit"
                    >
                      ×
                    </button>
                  </span>
                )}
                {sortOption !== 'default' && (
                  <span className="inline-flex items-center space-x-1.5 bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs">
                    <span>⇅ {getSortOptionLabel(sortOption)}</span>
                    <button
                      type="button"
                      onClick={() => setSortOption('default')}
                      className="text-purple-500 hover:text-purple-900 ml-1 cursor-pointer font-black"
                      title="Kembalikan sortir ke default"
                    >
                      ×
                    </button>
                  </span>
                )}
                {(fieldFilter !== 'Semua' || categoryFilter !== 'Semua' || statusFilter !== 'Semua' || genderFilter !== 'Semua' || searchTerm || mcuAssessmentFilter !== 'ALL' || documentFilter !== 'ALL' || (submitDateFilter !== 'ALL' && submitDateFilter !== '') || sortOption !== 'default') && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'ja' ? 'フィルタ解除' : 'Hapus Filter Aktif'}</span>
                  </button>
                )}
                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                  {lang === 'ja'
                    ? `${rirekishoList.length}名中 ${filteredCVs.length}名の候補者`
                    : `${filteredCVs.length} dari ${rirekishoList.length} Kandidat`}
                </span>
              </div>
            </div>

            {/* Metric KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
              {/* Total Kandidat */}
              <div
                onClick={() => {
                  setFieldFilter('Semua');
                  setCategoryFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  fieldFilter === 'Semua' && categoryFilter === 'Semua' && statusFilter === 'Semua'
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-indigo-50/40 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    {lang === 'ja' ? '総候補者数' : 'Total Kandidat'}
                  </span>
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {candidateDashboardStats.total}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {lang === 'ja' ? 'JIS有効データ 100%' : '100% Data JIS Aktif'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full w-full rounded-full" />
                </div>
              </div>

              {/* Kaigo (Caregiver) */}
              <div
                onClick={() => setFieldFilter(fieldFilter === 'KAIGO' ? 'Semua' : 'KAIGO')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  fieldFilter === 'KAIGO'
                    ? 'bg-sky-50/90 border-sky-300 ring-2 ring-sky-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-sky-50/40 hover:border-sky-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    {lang === 'ja' ? '介護 (Caregiver)' : 'Kaigo (Caregiver)'}
                  </span>
                  <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {candidateDashboardStats.fields.kaigo}
                  </div>
                  <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                    {Math.round((candidateDashboardStats.fields.kaigo / (candidateDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（全体比）' : '% dari total'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((candidateDashboardStats.fields.kaigo / (candidateDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Pengolahan Makanan (PM) */}
              <div
                onClick={() => setFieldFilter(fieldFilter === 'PM' ? 'Semua' : 'PM')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  fieldFilter === 'PM' || fieldFilter === 'Pengolahan Makanan'
                    ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-amber-50/40 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    {lang === 'ja' ? '食品製造 (PM)' : 'Pengolahan Makanan'}
                  </span>
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {candidateDashboardStats.fields.pm}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                    {Math.round((candidateDashboardStats.fields.pm / (candidateDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（全体比）' : '% dari total'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((candidateDashboardStats.fields.pm / (candidateDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Pertanian & Peternakan */}
              <div
                onClick={() => setFieldFilter(fieldFilter === 'PERTANIAN' ? 'Semua' : 'PERTANIAN')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  fieldFilter === 'PERTANIAN'
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {lang === 'ja' ? '農業・畜産' : 'Pertanian / Ternak'}
                  </span>
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {candidateDashboardStats.fields.pertanian + candidateDashboardStats.fields.peternakan}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    {Math.round(((candidateDashboardStats.fields.pertanian + candidateDashboardStats.fields.peternakan) / (candidateDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（全体比）' : '% dari total'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((candidateDashboardStats.fields.pertanian + candidateDashboardStats.fields.peternakan) / (candidateDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Engineering & Lainnya */}
              <div
                onClick={() => setFieldFilter(fieldFilter === 'Lainnya' ? 'Semua' : 'Lainnya')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1 ${
                  fieldFilter === 'Lainnya' || fieldFilter === 'KIKAI KAKOU' || fieldFilter === 'Manufaktur'
                    ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-purple-50/40 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                    {lang === 'ja' ? '技術・エンジニア・他' : 'Engineering & Lainnya'}
                  </span>
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {candidateDashboardStats.fields.engineering + candidateDashboardStats.fields.kikaiKakou + candidateDashboardStats.fields.konstruksi + candidateDashboardStats.fields.cleaning + candidateDashboardStats.fields.other}
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                    {Math.round(((candidateDashboardStats.fields.engineering + candidateDashboardStats.fields.kikaiKakou + candidateDashboardStats.fields.konstruksi + candidateDashboardStats.fields.cleaning + candidateDashboardStats.fields.other) / (candidateDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（全体比）' : '% dari total'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((candidateDashboardStats.fields.engineering + candidateDashboardStats.fields.kikaiKakou + candidateDashboardStats.fields.konstruksi + candidateDashboardStats.fields.cleaning + candidateDashboardStats.fields.other) / (candidateDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Breakdown Strips: Kategori & Status Progres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 pt-4 border-t border-slate-100">
              {/* Kategori Breakdown Pills */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                  {lang === 'ja' ? '候補者区分分布:' : 'Distribusi Kategori Kandidat:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === 'NEW COMER' ? 'Semua' : 'NEW COMER')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      categoryFilter === 'NEW COMER'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '新規渡航者 (New Comer)' : 'New Comer'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      categoryFilter === 'NEW COMER' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {candidateDashboardStats.categories.newComer}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === 'EX MAGANG/EX-TRAINEER' ? 'Semua' : 'EX MAGANG/EX-TRAINEER')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      categoryFilter === 'EX MAGANG/EX-TRAINEER'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '元技能実習生 (Ex-Trainee)' : 'Ex-Magang / Trainee'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      categoryFilter === 'EX MAGANG/EX-TRAINEER' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {candidateDashboardStats.categories.exMagang}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === 'SISWA IJEF - Offline' ? 'Semua' : 'SISWA IJEF - Offline')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      categoryFilter.includes('SISWA IJEF')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? 'IJEF校生' : 'Siswa IJEF'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      categoryFilter.includes('SISWA IJEF') ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {candidateDashboardStats.categories.siswaIjef}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === 'MATCHING JOB - Engineering / Gijinkoku' ? 'Semua' : 'MATCHING JOB - Engineering / Gijinkoku')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      categoryFilter.includes('Engineering')
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '技人国 (Engineering)' : 'Engineering'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      categoryFilter.includes('Engineering') ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {candidateDashboardStats.categories.engineering}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Progres Breakdown Pills */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                  {lang === 'ja' ? 'マッチングステータス絞り込み:' : 'Filter Kategori Siap Matching:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('Pending Nunggu Job')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      statusFilter === 'Pending Nunggu Job' || statusFilter === 'Siap Matching'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '🟢 マッチング待機・求人待ち' : '🟢 Siap Matching / Menunggu Job'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      statusFilter === 'Pending Nunggu Job' || statusFilter === 'Siap Matching' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {candidateDashboardStats.status.siapMatching}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'Terjadwal Interview' ? 'Semua' : 'Terjadwal Interview')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      statusFilter === 'Terjadwal Interview' || statusFilter === 'Penjadwalan Interview'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '🟡 面接日程確定済' : '🟡 Terjadwal Interview'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      statusFilter === 'Terjadwal Interview' || statusFilter === 'Penjadwalan Interview' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {candidateDashboardStats.status.terjadwalInterview}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'Lolos Interview (Naitei)' ? 'Semua' : 'Lolos Interview (Naitei)')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      statusFilter === 'Lolos Interview (Naitei)' || statusFilter === 'Proses Visas/COE'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-purple-900 border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '🟣 内定合格 / 在留・VISA申請中' : '🟣 Lolos Naitei / Proses Visa COE'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      statusFilter === 'Lolos Interview (Naitei)' || statusFilter === 'Proses Visas/COE' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-900'
                    }`}>
                      {candidateDashboardStats.status.naiteiVisa}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('SEMUA_SIAP_MATCHING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      statusFilter === 'SEMUA_SIAP_MATCHING'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '✨ 全マッチング候補者' : '✨ Semua Siap Match'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      statusFilter === 'SEMUA_SIAP_MATCHING' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-900'
                    }`}>
                      {candidateDashboardStats.status.totalMatching}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('Semua')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                      statusFilter === 'Semua'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang === 'ja' ? '全ステータス' : 'Semua Status'}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      statusFilter === 'Semua' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rirekishoList.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Prominent Header & View Mode Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {lang === 'ja' ? '候補者・生徒一覧リスト' : 'Daftar Kandidat & Siswa Job Matching'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ja'
                    ? `総数 ${rirekishoList.length} 名中 ${filteredCVs.length} 名を表示中`
                    : `Menampilkan ${filteredCVs.length} dari total ${rirekishoList.length} kandidat`}
                </p>
              </div>
            </div>

            {/* Prominent View Mode Switcher */}
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-xl p-1 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => setCandidateViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  candidateViewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'テーブル形式' : 'Mode Tabel'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCandidateViewMode('cards')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  candidateViewMode === 'cards'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'カード形式' : 'Mode Kartu'}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar Box + View Mode Toggle */}
          <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {/* Cari Search Input */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '候補者検索' : 'Cari Kandidat'}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={lang === 'ja' ? '氏名 / 求人コード / Email...' : 'Nama / Kode Job / Email...'}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Tanggal Submit (Drop Down List dengan Pilihan Lengkap) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '提出日' : 'Tanggal Submit'}</label>
                <select
                  value={submitDateFilter}
                  onChange={(e) => setSubmitDateFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-semibold cursor-pointer"
                >
                  <option value="ALL">{lang === 'ja' ? `全提出日 (${submitDateCounts.all})` : `Semua Tanggal Submit (${submitDateCounts.all})`}</option>
                  <option value="TODAY">{lang === 'ja' ? `本日 (${submitDateCounts.today})` : `Hari Ini (${submitDateCounts.today})`}</option>
                  <option value="LAST_7_DAYS">{lang === 'ja' ? `過去7日間 (${submitDateCounts.last7Days})` : `7 Hari Terakhir (${submitDateCounts.last7Days})`}</option>
                  <option value="LAST_30_DAYS">{lang === 'ja' ? `過去30日間 (${submitDateCounts.last30Days})` : `30 Hari Terakhir (${submitDateCounts.last30Days})`}</option>
                  <option value="THIS_MONTH">{lang === 'ja' ? `今月 (${submitDateCounts.thisMonth})` : `Bulan Ini (${submitDateCounts.thisMonth})`}</option>
                  <option value="LAST_MONTH">{lang === 'ja' ? `先月 (${submitDateCounts.lastMonth})` : `Bulan Lalu (${submitDateCounts.lastMonth})`}</option>
                  <option value="THIS_YEAR">{lang === 'ja' ? `今年 (${submitDateCounts.thisYear})` : `Tahun Ini (${submitDateCounts.thisYear})`}</option>
                  <option value="OLDER">{lang === 'ja' ? `過去データ (${submitDateCounts.older})` : `Arsip Lama (${submitDateCounts.older})`}</option>
                  <option value="HAS_DATE">{lang === 'ja' ? `提出日あり (${submitDateCounts.hasDate})` : `Sudah Ada Tanggal (${submitDateCounts.hasDate})`}</option>
                  <option value="NO_DATE">{lang === 'ja' ? `未設定・ドラフト (${submitDateCounts.noDate})` : `Belum Ada Tanggal (${submitDateCounts.noDate})`}</option>
                  {submitDateCounts.monthList.map((m) => (
                    <option key={m.key} value={`MONTH:${m.key}`}>
                      📅 {m.label} ({m.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? 'カテゴリ' : 'Kategori'}</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium"
                >
                  <option value="Semua">{lang === 'ja' ? '全カテゴリ' : 'Semua Kategori'}</option>
                  <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携校生 (SISWA MITRA / NON IJEF)' : 'SISWA MITRA / NON IJEF'}</option>
                  <option value="NEW COMER">{lang === 'ja' ? '新規渡航者 (NEW COMER)' : 'NEW COMER'}</option>
                  <option value="EX MAGANG/EX-TRAINEER">{lang === 'ja' ? '実習経験者 (EX-TRAINEE)' : 'EX MAGANG/EX-TRAINEER'}</option>
                  <option value="SISWA IJEF - Offline">{lang === 'ja' ? 'IJEF対面生 (Offline)' : 'SISWA IJEF - Offline'}</option>
                  <option value="SISWA IJEF - Online">{lang === 'ja' ? 'IJEFオンライン生 (Online)' : 'SISWA IJEF - Online'}</option>
                  <option value="MATCHING JOB - Engineering / Gijinkoku">{lang === 'ja' ? '技人国 / エンジニア (Gijinkoku)' : 'Engineering / Gijinkoku'}</option>
                </select>
              </div>

              {/* Bidang */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '分野・職種' : 'Bidang / Sektor'}</label>
                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium"
                >
                  <option value="Semua">{lang === 'ja' ? '全分野' : 'Semua Bidang'}</option>
                  <option value="KAIGO">{lang === 'ja' ? '介護 (Caregiver)' : 'KAIGO (Caregiver)'}</option>
                  <option value="PM">{lang === 'ja' ? '食品製造 (PM)' : 'PM (Pengolahan Makanan)'}</option>
                  <option value="PERTANIAN">{lang === 'ja' ? '農業・畜産' : 'Pertanian & Peternakan'}</option>
                  <option value="KIKAI_KAKOU">{lang === 'ja' ? '機械加工・製造' : 'Manufaktur (Kikai Kakou)'}</option>
                  <option value="ENGINEERING">{lang === 'ja' ? '技術・エンジニア (技人国)' : 'Engineering (Gijinkoku)'}</option>
                  <option value="KONSTRUKSI">{lang === 'ja' ? '建設業 (Construction)' : 'Konstruksi & Bangunan'}</option>
                  <option value="BUILDING_CLEANING">{lang === 'ja' ? 'ビルクリーニング' : 'Building Cleaning'}</option>
                  <option value="Lainnya">{lang === 'ja' ? 'その他業種' : 'Sektor Lainnya'}</option>
                </select>
              </div>

              {/* Status Progres */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '進捗ステータス' : 'Status Progres'}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium"
                >
                  <option value="Pending Nunggu Job">{lang === 'ja' ? '🟢 マッチング待機・求人待ち' : '🟢 Siap Matching / Menunggu Job'}</option>
                  <option value="Terjadwal Interview">{lang === 'ja' ? '🟡 面接日程確定済' : '🟡 Terjadwal Interview'}</option>
                  <option value="Lolos Interview (Naitei)">{lang === 'ja' ? '🟣 内定合格 / 在留・VISA申請中' : '🟣 Lolos Naitei / Proses Visa COE'}</option>
                  <option value="SEMUA_SIAP_MATCHING">{lang === 'ja' ? '✨ 全マッチング候補者' : '✨ Semua Siap Matching (3 Kategori)'}</option>
                  <option value="Semua">{lang === 'ja' ? '全ステータス' : 'Semua Status (Termasuk Proses)'}</option>
                  <option value="On Proses">{lang === 'ja' ? '進行中 (On Proses)' : 'On Proses'}</option>
                  <option value="Cancel">{lang === 'ja' ? 'キャンセル' : 'Cancel'}</option>
                </select>
              </div>

              {/* Jenis Kelamin (Gender) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '性別' : 'Jenis Kelamin'}</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none text-xs font-medium"
                >
                  <option value="Semua">{lang === 'ja' ? '全ての性別' : 'Semua Gender'}</option>
                  <option value="Laki-laki">{lang === 'ja' ? '♂ 男性 (Pria)' : '♂ Pria (Laki-laki)'}</option>
                  <option value="Perempuan">{lang === 'ja' ? '♀ 女性 (Wanita)' : '♀ Wanita (Perempuan)'}</option>
                </select>
              </div>
            </div>

            {/* Bottom Bar: Filters, Sort, Completeness, Results Count, and Table/Card View Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-t border-slate-200 pt-2 text-xs">
              <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="h-7 inline-flex items-center space-x-1 px-2 text-purple-700 hover:text-purple-900 font-bold cursor-pointer rounded-md hover:bg-purple-50 transition border border-transparent hover:border-purple-200 text-xs shrink-0"
                  title="Kembalikan semua filter ke pengaturan awal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'ja' ? 'リセット' : 'Reset'}</span>
                </button>

                {/* Dropdown Menu Sortir (9 Opsi Pilihan Sesuai Permintaan) */}
                <div
                  className={`h-7 inline-flex items-center space-x-1 px-2 rounded-md border text-xs font-semibold transition shrink-0 ${
                    sortOption !== 'default'
                      ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                  title={lang === 'ja' ? '並び替え' : 'Urutkan data kandidat'}
                >
                  <ArrowUpDown className={`w-3 h-3 shrink-0 ${sortOption !== 'default' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">
                    {lang === 'ja' ? '並替:' : 'Sortir:'}
                  </span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    aria-label="Menu Sortir"
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer pr-0.5 focus:ring-0"
                  >
                    <option value="default">{lang === 'ja' ? 'デフォルト' : 'default'}</option>
                    <option value="NAME_ASC">{lang === 'ja' ? '氏名 (A-Z)' : 'nama (A-Z)'}</option>
                    <option value="NAME_DESC">{lang === 'ja' ? '氏名 (Z-A)' : 'nama (Z-A)'}</option>
                    <option value="DATE_NEWEST">{lang === 'ja' ? '最新順' : 'tanggal terbaru'}</option>
                    <option value="DATE_OLDEST_WITH_EMPTY">{lang === 'ja' ? '古い順 (空含む)' : 'tanggal paling lama'}</option>
                    <option value="LAST_7_DAYS">{lang === 'ja' ? `過去7日 (${submitDateCounts.last7Days})` : `7 hari terakhir (${submitDateCounts.last7Days})`}</option>
                    <option value="LAST_30_DAYS">{lang === 'ja' ? `過去30日 (${submitDateCounts.last30Days})` : `30 hari terakhir (${submitDateCounts.last30Days})`}</option>
                    <option value="THIS_MONTH">{lang === 'ja' ? `今月 (${submitDateCounts.thisMonth})` : `bulan ini (${submitDateCounts.thisMonth})`}</option>
                    <option value="LAST_MONTH">{lang === 'ja' ? `先月 (${submitDateCounts.lastMonth})` : `bulan lalu (${submitDateCounts.lastMonth})`}</option>
                  </select>
                </div>

                {/* Dropdown Menu 1: Filter Status MCU & Asesmen (13 Opsi Pilihan) */}
                <div
                  className={`h-7 inline-flex items-center space-x-1 px-2 rounded-md border text-xs font-semibold transition shrink-0 ${
                    mcuAssessmentFilter !== 'ALL'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                  title={
                    lang === 'ja'
                      ? '健康診断および適性検査の進捗ステータス別フィルタ'
                      : 'Pilih filter status pemeriksaan medis (MCU) dan asesmen (DISC/Psikotes)'
                  }
                >
                  <Stethoscope className={`w-3 h-3 shrink-0 ${mcuAssessmentFilter !== 'ALL' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">
                    {lang === 'ja' ? 'MCU:' : 'MCU:'}
                  </span>
                  <select
                    value={mcuAssessmentFilter}
                    onChange={(e) => setMcuAssessmentFilter(e.target.value)}
                    aria-label="Filter MCU dan Asesmen"
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer pr-0.5 focus:ring-0 max-w-[130px] sm:max-w-[160px] truncate"
                  >
                    <option value="ALL">
                      {lang === 'ja' ? `全て (${mcuFilterCounts.all})` : `Semua (${mcuFilterCounts.all})`}
                    </option>
                    <option value="COMPLETE">
                      {lang === 'ja' ? `⭐ 健診・適性完了 (${mcuFilterCounts.complete})` : `⭐ Lengkap MCU & Asesmen (${mcuFilterCounts.complete})`}
                    </option>
                    <option value="STRICT">
                      {lang === 'ja' ? `💎 完全受検済 (${mcuFilterCounts.strict})` : `💎 Lengkap Penuh (MCU+DISC+Psiko) (${mcuFilterCounts.strict})`}
                    </option>
                    <option value="MCU_FIT">
                      {lang === 'ja' ? `🏥 FIT 合格 (${mcuFilterCounts.mcuFit})` : `🏥 MCU: Status FIT (${mcuFilterCounts.mcuFit})`}
                    </option>
                    <option value="MCU_HAS">
                      {lang === 'ja' ? `🩺 健診データ有 (${mcuFilterCounts.mcuHas})` : `🩺 Sudah Ada Data MCU (${mcuFilterCounts.mcuHas})`}
                    </option>
                    <option value="MCU_NOTE">
                      {lang === 'ja' ? `⚠️ 要注意・備考 (${mcuFilterCounts.mcuNote})` : `⚠️ MCU: Catatan Dokter (${mcuFilterCounts.mcuNote})`}
                    </option>
                    <option value="MCU_UNFIT">
                      {lang === 'ja' ? `❌ 不適合 (${mcuFilterCounts.mcuUnfit})` : `❌ MCU: Unfit (${mcuFilterCounts.mcuUnfit})`}
                    </option>
                    <option value="ASSESSMENT_HAS">
                      {lang === 'ja' ? `🧠 適性受検済 (${mcuFilterCounts.assessHas})` : `🧠 Sudah Ikut Asesmen (${mcuFilterCounts.assessHas})`}
                    </option>
                    <option value="DISC_ONLY">
                      {lang === 'ja' ? `📊 DISC受検済 (${mcuFilterCounts.discHas})` : `📊 Sudah Ujian DISC (${mcuFilterCounts.discHas})`}
                    </option>
                    <option value="PSIKOTES_ONLY">
                      {lang === 'ja' ? `📝 心理適性済 (${mcuFilterCounts.psikoHas})` : `📝 Sudah Ujian Psikotes (${mcuFilterCounts.psikoHas})`}
                    </option>
                    <option value="INCOMPLETE">
                      {lang === 'ja' ? `⚠️ 未完了 (${mcuFilterCounts.incomplete})` : `⚠️ Belum Lengkap (${mcuFilterCounts.incomplete})`}
                    </option>
                    <option value="NO_MCU">
                      {lang === 'ja' ? `⏳ 健診未受検 (${mcuFilterCounts.noMcu})` : `⏳ Belum Ada MCU (${mcuFilterCounts.noMcu})`}
                    </option>
                    <option value="NO_ASSESSMENT">
                      {lang === 'ja' ? `⏳ 適性未受検 (${mcuFilterCounts.noAssess})` : `⏳ Belum Ada Asesmen (${mcuFilterCounts.noAssess})`}
                    </option>
                  </select>
                </div>

                {/* Dropdown Menu 2: Filter Dokumen & Kesiapan (8 Opsi Pilihan) */}
                <div
                  className={`h-7 inline-flex items-center space-x-1 px-2 rounded-md border text-xs font-semibold transition shrink-0 ${
                    documentFilter !== 'ALL'
                      ? 'bg-purple-50 text-purple-900 border-purple-300 ring-1 ring-purple-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                  title={
                    lang === 'ja'
                      ? '提出書類および適格要件別フィルタ'
                      : 'Pilih filter kesiapan dokumen, foto, paspor, dan kualifikasi fisik kandidat'
                  }
                >
                  <FileCheck2 className={`w-3 h-3 shrink-0 ${documentFilter !== 'ALL' ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">
                    {lang === 'ja' ? '書類:' : 'Dokumen:'}
                  </span>
                  <select
                    value={documentFilter}
                    onChange={(e) => setDocumentFilter(e.target.value)}
                    aria-label="Filter Dokumen dan Kesiapan"
                    className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer pr-0.5 focus:ring-0 max-w-[130px] sm:max-w-[150px] truncate"
                  >
                    <option value="ALL">
                      {lang === 'ja' ? `全て (${docFilterCounts.all})` : `Semua (${docFilterCounts.all})`}
                    </option>
                    <option value="HAS_PHOTO">
                      {lang === 'ja' ? `📸 証明写真 (${docFilterCounts.hasPhoto})` : `📸 Pas Foto Resmi (${docFilterCounts.hasPhoto})`}
                    </option>
                    <option value="HAS_PASSPORT">
                      {lang === 'ja' ? `🛂 パスポート (${docFilterCounts.hasPassport})` : `🛂 Paspor (${docFilterCounts.hasPassport})`}
                    </option>
                    <option value="HAS_VIDEO">
                      {lang === 'ja' ? `🎥 動画 (${docFilterCounts.hasVideo})` : `🎥 Video Jikoshoukai (${docFilterCounts.hasVideo})`}
                    </option>
                    <option value="NO_COLOR_BLIND">
                      {lang === 'ja' ? `👁️ 正常色覚 (${docFilterCounts.noColorBlind})` : `👁️ Bebas Buta Warna (${docFilterCounts.noColorBlind})`}
                    </option>
                    <option value="NO_SMOKING">
                      {lang === 'ja' ? `🚭 非喫煙 (${docFilterCounts.noSmoking})` : `🚭 Bebas Merokok (${docFilterCounts.noSmoking})`}
                    </option>
                    <option value="NO_TATTOO">
                      {lang === 'ja' ? `✨ タトゥー無 (${docFilterCounts.noTattoo})` : `✨ Bebas Tato (${docFilterCounts.noTattoo})`}
                    </option>
                    <option value="READY_INTERVIEW">
                      {lang === 'ja' ? `⚡ 面接即応 (${docFilterCounts.readyInterview})` : `⚡ Siap Interview (${docFilterCounts.readyInterview})`}
                    </option>
                  </select>
                </div>

                {/* Lock Filter across reloads */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !isFilterLocked;
                    setIsFilterLocked(next);
                    setToastMessage(
                      next
                        ? (lang === 'ja' ? '🔒 フィルタ設定を固定保存しました' : '🔒 Pengaturan filter terkunci dan tersimpan!')
                        : (lang === 'ja' ? '🔓 フィルタ固定を解除しました' : '🔓 Kunci filter dinonaktifkan')
                    );
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className={`h-7 inline-flex items-center space-x-1 px-2 rounded-md border text-xs font-bold transition cursor-pointer shrink-0 ${
                    isFilterLocked
                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                      : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                  }`}
                  title={
                    lang === 'ja'
                      ? 'ページ遷移やデータ編集後もフィルタ条件を維持します'
                      : 'Kunci filter agar tidak reset saat mengedit kandidat atau memuat ulang'
                  }
                >
                  <Shield className={`w-3 h-3 ${isFilterLocked ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>
                    {isFilterLocked
                      ? (lang === 'ja' ? '🔒 固定中' : '🔒 Filter Terkunci')
                      : (lang === 'ja' ? '🔓 Kunci' : '🔓 Kunci')}
                  </span>
                </button>

                <span className="text-slate-500 font-medium text-xs whitespace-nowrap shrink-0 ml-1">
                  {lang === 'ja'
                    ? `${filteredCVs.length}/${rirekishoList.length}名`
                    : `${filteredCVs.length} dari ${rirekishoList.length} kandidat`}
                </span>
              </div>

              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs self-start lg:self-auto shrink-0 h-7">
                <button
                  type="button"
                  onClick={() => setCandidateViewMode('table')}
                  className={`h-full flex items-center space-x-1 px-2 rounded-md text-xs font-bold transition cursor-pointer ${
                    candidateViewMode === 'table'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={lang === 'ja' ? 'テーブル形式で表示' : 'Tampilkan dalam format Tabel Data'}
                >
                  <Table className="w-3 h-3" />
                  <span>{lang === 'ja' ? 'テーブル' : 'Tabel'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCandidateViewMode('cards')}
                  className={`h-full flex items-center space-x-1 px-2 rounded-md text-xs font-bold transition cursor-pointer ${
                    candidateViewMode === 'cards'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={lang === 'ja' ? 'カード形式で表示' : 'Tampilkan dalam format Kartu Profil'}
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>{lang === 'ja' ? 'カード' : 'Kartu'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Matching Filter Notification Bar */}
          {statusFilter === 'Pending Nunggu Job' && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'ja'
                    ? <>適用中フィルタ: <strong>🟢 マッチング待機・求人待ち</strong> ({filteredCVs.length} 名の候補者を表示)</>
                    : <>Filter Aktif: <strong>🟢 Siap Matching / Menunggu Job</strong> ({filteredCVs.length} Kandidat Ditampilkan)</>}
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300">
                {lang === 'ja' ? '日本の求人マッチング待機中の生徒のみを表示しています' : 'Hanya menampilkan siswa yang siap matching lowongan kerja Jepang'}
              </span>
            </div>
          )}

          {statusFilter === 'Terjadwal Interview' && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {lang === 'ja'
                    ? <>適用中フィルタ: <strong>🟡 面接日程確定済</strong> ({filteredCVs.length} 名の候補者を表示)</>
                    : <>Filter Aktif: <strong>🟡 Terjadwal Interview</strong> ({filteredCVs.length} Kandidat Ditampilkan)</>}
                </span>
              </div>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300">
                {lang === 'ja' ? '面接・選考進行中の候補者' : 'Kandidat dalam proses wawancara / mensetsu Zoom'}
              </span>
            </div>
          )}

          {statusFilter === 'Lolos Interview (Naitei)' && (
            <div className="bg-purple-50 border border-purple-300 text-purple-950 px-4 py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  {lang === 'ja'
                    ? <>適用中フィルタ: <strong>🟣 内定合格 / 在留・VISA申請中</strong> ({filteredCVs.length} 名の候補者を表示)</>
                    : <>Filter Aktif: <strong>🟣 Lolos Naitei / Proses Visa COE</strong> ({filteredCVs.length} Kandidat Ditampilkan)</>}
                </span>
              </div>
              <span className="text-[11px] font-medium text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-lg border border-purple-300">
                {lang === 'ja' ? '内定獲得済・在留資格(COE)/ビザ申請手続中の候補者' : 'Kandidat telah lolos naitei dan dalam pengurusan berkas visa & COE'}
              </span>
            </div>
          )}

          {statusFilter === 'SEMUA_SIAP_MATCHING' && (
            <div className="bg-indigo-50 border border-indigo-300 text-indigo-950 px-4 py-2.5 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {lang === 'ja'
                    ? <>適用中フィルタ: <strong>✨ 全マッチング候補者</strong> (待機中・面接中・内定済 3区分 — {filteredCVs.length} 名)</>
                    : <>Filter Aktif: <strong>✨ Semua Kandidat Siap Matching</strong> (3 Kategori: Siap Matching, Interview, Naitei/Visa — {filteredCVs.length} Kandidat)</>}
                </span>
              </div>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-lg border border-indigo-300">
                {lang === 'ja' ? '日本求人マッチング対象者のみを抽出' : 'Menyaring hanya kandidat siap match job Jepang'}
              </span>
            </div>
          )}

          {/* VIEW MODE 1: TAMPILAN KARTU (CARD GRID VIEW) */}
          {candidateViewMode === 'cards' && (
            <div className="w-full">
              {filteredCVs.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800">
                    {lang === 'ja' ? '該当する候補者が見つかりません' : 'Tidak ada kandidat ditemukan'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    {lang === 'ja'
                      ? '指定されたフィルタ条件や検索キーワードに一致するデータがありません。条件を変更してお試しください。'
                      : 'Tidak ada data kandidat yang cocok dengan kriteria filter saat ini. Silakan ubah filter atau kata kunci pencarian Anda.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? 'フィルタを初期化' : 'Reset Semua Filter'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCVs.map((cv, idx) => {
                      const isMitra = (cv.kategoriKandidat || '').toUpperCase().includes('MITRA');
                      const isExMagang = (cv.kategoriKandidat || '').includes('EX-MAGANG') || (cv.kategoriKandidat || '').includes('Ex-Magang') || (cv.kategoriKandidat || '').toUpperCase().includes('TRAINEE');
                      const isEngineering = (cv.kategoriKandidat || '').toUpperCase().includes('ENGINEER') || (cv.kategoriKandidat || '').toUpperCase().includes('GIJINKOKU');
                      const isSiswaIjef = (cv.kategoriKandidat || '').toUpperCase().includes('SISWA IJEF');
                      const isNaitei = cv.statusProgres === 'Lolos Interview (Naitei)';
                      const isOnProses = cv.statusProgres === 'On Proses';
                      const isPending = cv.statusProgres === 'Pending Nunggu Job';
                      const isCancel = cv.statusProgres === 'Cancel';
                      const isVisa = cv.statusProgres === 'Proses Visas/COE';

                      const matchingStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                      const testStatus = checkCandidateMcuAndAssessment(cv);

                      // Card layout strictly matching IMG-20260908-WA0068.jpg
                      const photoSrc = getStudentPhotoUrl(matchingStudent, cv);
                      const nickname = cv.namaPanggilan || (cv.namaLengkap ? cv.namaLengkap.split(' ')[0] : '');
                      const cleanPhone = cv.noHp && cv.noHp !== '-' ? cv.noHp : '';
                      const bidangKerjaVal = cv.bidangKerja || 'KAIGO';
                      const jobCodeVal = cv.kodeJob || 'DEF';
                      const progressDetailText = cv.detailProgres || cv.catatanProgres || cv.namaTSK || (lang === 'ja' ? '求人案件選考中' : 'Menunggu job yg sesuai kriteria usia');

                      const kategoriBadgeText = isMitra
                        ? (lang === 'ja' ? '提携校生' : 'SISWA MITRA')
                        : isExMagang
                        ? (lang === 'ja' ? '元実習生' : 'EX-MAGANG')
                        : isEngineering
                        ? (lang === 'ja' ? '技人国' : 'GIJINKOKU')
                        : isSiswaIjef
                        ? (lang === 'ja' ? 'IJEF生' : 'SISWA IJEF')
                        : (lang === 'ja' ? '新規渡航' : 'NEW COMER');

                      const statusBadgeText = isCancel
                        ? (lang === 'ja' ? '辞退 / CANCEL' : 'CANCEL')
                        : isPending
                        ? (lang === 'ja' ? '求人待ち' : 'PENDING JOB')
                        : isOnProses
                        ? (lang === 'ja' ? '選考進行中' : 'ON PROSES')
                        : isNaitei
                        ? (lang === 'ja' ? '内定獲得' : 'NAITEI')
                        : isVisa
                        ? (lang === 'ja' ? 'COE・ビザ手続中' : 'PROSES COE')
                        : (cv.statusProgres?.toUpperCase() || (lang === 'ja' ? '求人待ち' : 'PENDING JOB'));

                      const statusBadgeStyle = isCancel
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : isPending
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : isOnProses
                        ? 'bg-sky-50 text-sky-800 border-sky-300'
                        : isNaitei
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : isVisa
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300';

                      return (
                        <div
                          key={cv.id ? `${cv.id}-${cv.siswaId || idx}` : `cv-card-${idx}`}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group relative shadow-2xs"
                        >
                          {/* Card Header (Matches sketch: [ ] NEW COMER ... PENDING JOB) */}
                          <div className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-200 bg-slate-50/70">
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                              />
                              <span className="font-extrabold text-xs tracking-wider text-slate-900 uppercase">
                                {kategoriBadgeText}
                              </span>
                            </label>
                            <div className="flex items-center space-x-1.5">
                              {cv.tanggalSubmit && cv.tanggalSubmit !== '-' && (
                                <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs" title="Tanggal Submit CV">
                                  <Calendar className="w-2.5 h-2.5 text-purple-600" />
                                  <span>{cv.tanggalSubmit}</span>
                                </span>
                              )}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border tracking-wider uppercase whitespace-nowrap ${statusBadgeStyle}`}
                              >
                                {statusBadgeText}
                              </span>
                            </div>
                          </div>

                          {/* Card Body: 2 Columns (LEFT: Pas foto full kebawah, RIGHT: Information & Actions) */}
                          <div className="flex flex-1 min-h-[260px]">
                            {/* Left Column: Pas foto full kebawah */}
                            <div
                              className="w-32 sm:w-36 md:w-40 shrink-0 relative bg-slate-100 border-r border-slate-200 overflow-hidden group/photo cursor-pointer flex items-center justify-center self-stretch"
                              onClick={() => {
                                if (photoSrc) {
                                  setPreviewPhotoZoom({
                                    url: photoSrc,
                                    name: `${cv.namaLengkap} (${nickname})`
                                  });
                                }
                              }}
                              title={photoSrc ? (lang === 'ja' ? 'クリックで写真を拡大' : 'Klik untuk memperbesar pas foto 4×6') : (lang === 'ja' ? '写真未登録 (空)' : 'Pas foto belum ada (kosong)')}
                            >
                              {photoSrc ? (
                                <img
                                  src={photoSrc}
                                  alt={cv.namaLengkap}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => handleStudentImageError(e, cv.namaLengkap, cv.jenisKelamin)}
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
                                4×6
                              </span>
                            </div>

                            {/* Right Column: Candidate Info & Actions */}
                            <div className="p-3 sm:p-3.5 flex-1 min-w-0 flex flex-col justify-between space-y-2">
                              {/* Top: Name, Nickname, Category Pill & Job Code */}
                              <div className="space-y-1">
                                <h4
                                  className="font-extrabold text-slate-900 uppercase text-xs sm:text-sm tracking-tight truncate leading-tight group-hover:text-purple-700 transition"
                                  title={cv.namaLengkap}
                                >
                                  {cv.namaLengkap}
                                </h4>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                  ({nickname})
                                </p>

                                {/* Pill [ KAIGO ], Gender and JOB : DEF */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="px-2 py-0.5 rounded-md border border-slate-800 text-[10px] sm:text-[11px] font-black tracking-wider text-slate-900 bg-white uppercase">
                                    {translateSector(bidangKerjaVal, lang)}
                                  </span>
                                  {cv.jenisKelamin && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                      (cv.jenisKelamin.toLowerCase().includes('laki') || cv.jenisKelamin.toLowerCase().includes('pria'))
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}>
                                      {(cv.jenisKelamin.toLowerCase().includes('laki') || cv.jenisKelamin.toLowerCase().includes('pria')) ? '♂ Pria' : '♀ Wanita'}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-slate-700 tracking-wide">
                                    JOB : <span className="font-extrabold text-slate-950">{jobCodeVal}</span>
                                  </span>
                                </div>

                                {/* MCU & Assessment Status Badges */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center space-x-1 ${testStatus.mcuColor}`}
                                    title={lang === 'ja' ? '健康診断ステータス' : 'Status Medical Check-Up'}
                                  >
                                    <Stethoscope className="w-2.5 h-2.5 shrink-0" />
                                    <span>{testStatus.mcuLabel}</span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center space-x-1 ${testStatus.assessmentColor}`}
                                    title={lang === 'ja' ? '適性検査 (DISC / 適性検査)' : 'Status Asesmen (DISC / Psikotes)'}
                                  >
                                    <Brain className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate max-w-[150px]">{testStatus.assessmentLabel}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Middle: DETAIL PROGRESS */}
                              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-0.5">
                                <span className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                  {lang === 'ja' ? '進捗詳細 :' : 'DETAIL PROGRESS :'}
                                </span>
                                <p
                                  className="text-xs text-slate-800 font-medium leading-relaxed line-clamp-3"
                                  title={progressDetailText}
                                >
                                  {progressDetailText}
                                </p>
                              </div>

                              {/* Contact: Phone / WhatsApp */}
                              <div className="flex items-center space-x-1.5 text-xs font-bold font-mono text-slate-900">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {cleanPhone ? (
                                  <a
                                    href={`https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-emerald-700 hover:underline tracking-wide transition text-slate-900"
                                    title="Hubungi WhatsApp"
                                  >
                                    {cleanPhone}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-normal">-</span>
                                )}
                              </div>

                              {/* Bottom Actions: 4 buttons strictly matching sketch (CV JS, Jikoshoukai, EDIT DATA, DANA TALANG) */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCVForJis(cv)}
                                  className="px-2 py-1.5 rounded-lg font-black text-[11px] bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                                  title={lang === 'ja' ? 'JIS規格日本履歴書プレビューを表示' : 'Lihat Pratinjau CV Jepang (JIS Standard)'}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>{lang === 'ja' ? 'JIS履歴書' : 'CV JS'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const foundStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                                    if (foundStudent) {
                                      setCvModalStudent(foundStudent);
                                    } else {
                                      const fallbackStudent: CalonSiswa = {
                                        id: cv.siswaId || cv.id,
                                        namaLengkap: cv.namaLengkap,
                                        email: cv.email,
                                        noHp: cv.noHp || '-',
                                        kategoriKandidat: cv.kategoriKandidat,
                                        kewarganegaraan: 'WNI',
                                        noKtp: '-',
                                        noKk: '-',
                                        alamatDomisili: cv.alamatLengkap || '-',
                                        tempatLahir: cv.tempatLahir || '-',
                                        tanggalLahir: cv.tanggalLahir || '-',
                                        agama: (cv.agama as any) || 'Islam',
                                        jenisKelamin: cv.jenisKelamin || 'Perempuan',
                                        golonganDarah: (cv.golonganDarah as any) || 'O',
                                        statusPerkawinan: cv.statusPernikahan || 'Lajang',
                                        namaAyah: '-',
                                        pekerjaanAyah: '-',
                                        ktpNpwpAyah: '-',
                                        namaIbu: '-',
                                        pekerjaanIbu: '-',
                                        ktpNpwpIbu: '-',
                                        statusPendaftaran: 'Terverifikasi',
                                        berkasDokumen: { pasFoto: cv.pasFotoUrl },
                                        createdAt: cv.updatedAt || new Date().toISOString()
                                      };
                                      setCvModalStudent(fallbackStudent);
                                    }
                                  }}
                                  className="px-2 py-1.5 rounded-lg font-black text-[11px] bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                                  title={lang === 'ja' ? '自己紹介・簡易レジュメを表示' : 'Lihat Resume Singkat & Jikoshoukai Siswa'}
                                >
                                  <User className="w-3 h-3" />
                                  <span>{lang === 'ja' ? '自己紹介' : 'Jikoshoukai'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCandidate(cv);
                                    setEditModalTab('data');
                                  }}
                                  className="px-2 py-1.5 rounded-lg font-black text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                                  title={lang === 'ja' ? '候補者データ・進捗ステータスを編集' : 'Edit Data Candidate & Status Progres'}
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>{lang === 'ja' ? '編集' : 'EDIT DATA'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCandidate(cv);
                                    setEditModalTab('pembiayaan');
                                  }}
                                  className="px-2 py-1.5 rounded-lg font-black text-[11px] bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 transition flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                                  title={lang === 'ja' ? 'つなぎ資金・費用支援データの管理と同期' : 'Kelola & Sinkronkan Dana Talang Candidate'}
                                >
                                  <Coins className="w-3 h-3 text-amber-600" />
                                  <span>{lang === 'ja' ? '融資管理' : 'DANA TALANG'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: TAMPILAN TABEL (TABLE VIEW) */}
          {candidateViewMode === 'table' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full max-w-full">
              <div className="overflow-x-auto w-full custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs text-slate-700 min-w-[880px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-8">
                        <input type="checkbox" className="rounded border-slate-300 bg-white" />
                      </th>
                      <th className="p-3 w-16">{lang === 'ja' ? '写真' : 'Foto 4×6'}</th>
                      <th className="p-3">{lang === 'ja' ? '氏名（フルネーム）' : 'Nama Lengkap'}</th>
                      <th className="p-3">{lang === 'ja' ? '職種・分野' : 'Bidang'}</th>
                      <th className="p-3">{lang === 'ja' ? '区分' : 'Kategori'}</th>
                      <th className="p-3">{lang === 'ja' ? '求人コード' : 'Kode Job'}</th>
                      <th className="p-3">{lang === 'ja' ? '状況' : 'Status'}</th>
                      <th className="p-3">{lang === 'ja' ? '詳細進捗・受入企業' : 'Detail Progres'}</th>
                      <th className="p-3">{lang === 'ja' ? '電話番号' : 'No HP'}</th>
                      <th
                        className="p-3 cursor-pointer hover:bg-slate-200 transition select-none"
                        onClick={() => setSubmitDateSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
                        title={lang === 'ja' ? '提出日の並び順を変更' : 'Urutkan berdasarkan Tanggal Submit'}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{lang === 'ja' ? '提出日' : 'Tgl Submit'}</span>
                          <ArrowUpDown className="w-3 h-3 text-purple-600" />
                        </div>
                      </th>
                      <th className="p-3">{lang === 'ja' ? '健康診断・適性' : 'MCU & Asesmen'}</th>
                      <th className="p-3 text-center">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCVs.map((cv, idx) => {
                      const isMitra = (cv.kategoriKandidat || '').toUpperCase().includes('MITRA');
                      const isExMagang = (cv.kategoriKandidat || '').includes('EX-MAGANG') || (cv.kategoriKandidat || '').includes('Ex-Magang') || (cv.kategoriKandidat || '').toUpperCase().includes('TRAINEE');
                      const isEngineering = (cv.kategoriKandidat || '').toUpperCase().includes('ENGINEER') || (cv.kategoriKandidat || '').toUpperCase().includes('GIJINKOKU');
                      const isSiswaIjef = (cv.kategoriKandidat || '').toUpperCase().includes('SISWA IJEF');
                      const testStatus = checkCandidateMcuAndAssessment(cv);

                      return (
                        <tr key={cv.id ? `${cv.id}-${cv.siswaId || idx}` : `cv-row-${idx}`} className="hover:bg-purple-50/50 transition odd:bg-white even:bg-slate-50/80">
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <input type="checkbox" className="rounded border-slate-300 bg-white" />
                          </td>

                          {/* Foto 4x6 */}
                          <td className="p-3">
                            {(() => {
                              const matchingStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                              const photoSrc = getStudentPhotoUrl(matchingStudent, cv);
                              return (
                                <StudentPhotoBadge
                                  photoUrl={photoSrc}
                                  student={matchingStudent}
                                  rirekisho={cv}
                                  namaLengkap={cv.namaLengkap}
                                  size="xs"
                                  ratioLabel="4×6"
                                  theme="purple"
                                  onZoomClick={photoSrc ? () => setPreviewPhotoZoom({
                                    url: photoSrc,
                                    name: `${cv.namaLengkap} ${cv.namaPanggilan ? `(${cv.namaPanggilan})` : ''}`
                                  }) : undefined}
                                  lang={lang}
                                />
                              );
                            })()}
                          </td>

                          {/* Nama Lengkap + Panggilan + Gender */}
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900 uppercase tracking-tight text-xs">
                              {cv.namaLengkap}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {cv.namaPanggilan && (
                                <span className="text-[11px] text-slate-600 font-semibold">
                                  ({cv.namaPanggilan})
                                </span>
                              )}
                              {cv.jenisKelamin && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                                  (cv.jenisKelamin.toLowerCase().includes('laki') || cv.jenisKelamin.toLowerCase().includes('pria'))
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {(cv.jenisKelamin.toLowerCase().includes('laki') || cv.jenisKelamin.toLowerCase().includes('pria')) ? '♂ Pria' : '♀ Wanita'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Bidang Badge */}
                          <td className="p-3">
                            <span className="bg-sky-100 text-sky-800 border border-sky-300 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-wider inline-block">
                              {translateSector(cv.bidangKerja || 'KAIGO', lang)}
                            </span>
                          </td>

                          {/* Kategori Badge */}
                          <td className="p-3">
                            {isMitra ? (
                              <span className="bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-tight inline-block">
                                {lang === 'ja' ? '提携校生' : 'SISWA MITRA'}
                              </span>
                            ) : isExMagang ? (
                              <span className="bg-purple-100 text-purple-800 border border-purple-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-tight inline-block">
                                {lang === 'ja' ? '元実習生' : 'EX MAGANG'}
                              </span>
                            ) : isEngineering ? (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-tight inline-block">
                                {lang === 'ja' ? '技人国' : 'GIJINKOKU'}
                              </span>
                            ) : isSiswaIjef ? (
                              <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-tight inline-block">
                                {lang === 'ja' ? 'IJEF生' : 'SISWA IJEF'}
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md tracking-tight inline-block">
                                {lang === 'ja' ? '新規渡航' : 'NEW COMER'}
                              </span>
                            )}
                          </td>

                          {/* Kode Job */}
                          <td className="p-3 font-bold text-slate-800">
                            {cv.kodeJob || '-'}
                          </td>

                          {/* Status Badge */}
                          <td className="p-3">
                            {cv.statusProgres === 'Cancel' && (
                              <span className="bg-rose-100 text-rose-800 border border-rose-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? '辞退 / キャンセル' : 'Cancel'}
                              </span>
                            )}
                            {cv.statusProgres === 'Pending Nunggu Job' && (
                              <span className="bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? '求人待ち / 待機中' : 'Pending Nunggu Job'}
                              </span>
                            )}
                            {cv.statusProgres === 'On Proses' && (
                              <span className="bg-sky-100 text-sky-800 border border-sky-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? '進行中 (選考中)' : 'On Proses'}
                              </span>
                            )}
                            {(!cv.statusProgres || cv.statusProgres === 'Belum Ada') && (
                              <span className="bg-slate-100 text-slate-700 border border-slate-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? '未設定' : 'Belum Ada'}
                              </span>
                            )}
                            {cv.statusProgres === 'Lolos Interview (Naitei)' && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? '内定獲得 (Naitei)' : 'Naitei'}
                              </span>
                            )}
                            {cv.statusProgres === 'Proses Visas/COE' && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-300 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold inline-block whitespace-nowrap">
                                {lang === 'ja' ? 'COE・ビザ手続中' : 'Proses COE'}
                              </span>
                            )}
                          </td>

                          {/* Detail Progres */}
                          <td className="p-3 text-slate-700 font-semibold max-w-[180px] truncate" title={cv.namaTSK || cv.detailProgres || '-'}>
                            {cv.namaTSK || cv.detailProgres || '-'}
                          </td>

                          {/* No HP */}
                          <td className="p-3 font-mono text-slate-800 font-semibold text-[11px]">
                            {cv.noHp || '-'}
                          </td>

                          {/* Tgl Submit + BARU Badge */}
                          <td className="p-3 text-slate-800 font-semibold whitespace-nowrap text-[11px]">
                            {cv.tanggalSubmit && cv.tanggalSubmit !== '-' ? (
                              <span>
                                {cv.tanggalSubmit}
                                {cv.isBaru && (
                                  <span className="bg-rose-600 text-white text-[9px] px-1 rounded font-black ml-1 inline-block">
                                    {lang === 'ja' ? '新規' : 'BARU'}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>

                          {/* MCU & Asesmen Badges */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold border inline-flex items-center space-x-1 ${testStatus.mcuColor}`}
                                title={lang === 'ja' ? '健康診断ステータス' : 'Status Medical Check-Up'}
                              >
                                <Stethoscope className="w-2.5 h-2.5 shrink-0" />
                                <span>{testStatus.mcuLabel}</span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold border inline-flex items-center space-x-1 ${testStatus.assessmentColor}`}
                                title={lang === 'ja' ? '適性検査 (DISC / 適性検査)' : 'Status Asesmen (DISC / Psikotes)'}
                              >
                                <Brain className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[130px]">{testStatus.assessmentLabel}</span>
                              </span>
                            </div>
                          </td>

                          {/* Action Buttons (CV, Jikoshoukai, Edit) */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1.5">
                              {/* CV Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedCVForJis(cv)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white border border-sky-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title={lang === 'ja' ? 'JIS規格日本履歴書プレビューを表示' : 'Lihat Pratinjau CV Jepang (JIS Standard)'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{lang === 'ja' ? 'JIS履歴書' : 'CV'}</span>
                              </button>

                              {/* Jikoshoukai Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const foundStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                                  if (foundStudent) {
                                    setCvModalStudent(foundStudent);
                                  } else {
                                    const fallbackStudent: CalonSiswa = {
                                      id: cv.siswaId || cv.id,
                                      namaLengkap: cv.namaLengkap,
                                      email: cv.email,
                                      noHp: cv.noHp || '-',
                                      kategoriKandidat: cv.kategoriKandidat,
                                      kewarganegaraan: 'WNI',
                                      noKtp: '-',
                                      noKk: '-',
                                      alamatDomisili: cv.alamatLengkap || '-',
                                      tempatLahir: cv.tempatLahir || '-',
                                      tanggalLahir: cv.tanggalLahir || '-',
                                      agama: (cv.agama as any) || 'Islam',
                                      jenisKelamin: cv.jenisKelamin || 'Perempuan',
                                      golonganDarah: (cv.golonganDarah as any) || 'O',
                                      statusPerkawinan: cv.statusPernikahan || 'Lajang',
                                      namaAyah: '-',
                                      pekerjaanAyah: '-',
                                      ktpNpwpAyah: '-',
                                      namaIbu: '-',
                                      pekerjaanIbu: '-',
                                      ktpNpwpIbu: '-',
                                      statusPendaftaran: 'Terverifikasi',
                                      berkasDokumen: { pasFoto: cv.pasFotoUrl },
                                      createdAt: cv.updatedAt || new Date().toISOString()
                                    };
                                    setCvModalStudent(fallbackStudent);
                                  }
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title={lang === 'ja' ? '自己紹介・簡易レジュメを表示' : 'Lihat Resume Singkat & Jikoshoukai Siswa'}
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>{lang === 'ja' ? '自己紹介' : 'Jikoshoukai'}</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCandidate(cv);
                                  setEditModalTab('data');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title={lang === 'ja' ? '候補者データ・進捗ステータスを編集' : 'Edit Data Candidate & Status Progres'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                              </button>

                              {/* Dana Talang Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCandidate(cv);
                                  setEditModalTab('pembiayaan');
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title={lang === 'ja' ? 'つなぎ資金・費用支援データの管理と同期' : 'Kelola & Sinkronkan Dana Talang Candidate'}
                              >
                                <Coins className="w-3.5 h-3.5 text-amber-600" />
                                <span>{lang === 'ja' ? '融資管理' : 'Dana Talang'}</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCandidate(cv)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-300 transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                title={lang === 'ja' ? '候補者データを削除' : 'Hapus Data Kandidat'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ja' ? '削除' : 'Hapus'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB MONITORING: DASHBOARD MONITORING STATUS PROGRES */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6 w-full max-w-full overflow-hidden font-sans">
          {/* Title & Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'ja' ? 'リアルタイム進捗モニタリング' : 'REAL-TIME MONITORING SYSTEM'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>{lang === 'ja' ? '進捗ステータス・モニタリングダッシュボード' : 'Dashboard Monitoring Status Progres'}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
                {lang === 'ja'
                  ? '各候補者の最新進捗ステータスを一括監視できます。ステータスカードをクリックして絞り込み、候補者をクリックして進捗編集フォームへ直接移動できます。'
                  : 'Pantau seluruh kandidat berdasarkan status progres terkini. Klik kartu status untuk menyaring kandidat, atau klik data kandidat untuk langsung menuju form edit progres detail.'}
              </p>
            </div>

            <div className="flex items-center space-x-3 self-start md:self-auto">
              <button
                type="button"
                onClick={handleSyncFirebase}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
              >
                <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? (lang === 'ja' ? '同期中...' : 'Menyingkronkan...')
                    : (lang === 'ja' ? 'Firebaseと同期' : 'Sinkronkan Ke Firebase')}
                </span>
              </button>
            </div>
          </div>

          {/* DASHBOARD STATISTIK DENGAN PERSENTASE DARI TOTAL SISWA (SESUAI GAMBAR) */}
          <CandidateDashboardStatistics
            candidates={rirekishoList}
            selectedStatus={monitoringSelectedStatus}
            onSelectStatus={(statusKey) => setMonitoringSelectedStatus(statusKey)}
            selectedGender={monitoringGenderFilter}
            onSelectGender={(genderKey) => setMonitoringGenderFilter(genderKey)}
            selectedCategory={categoryFilter}
            onSelectCategory={(catKey) => setCategoryFilter(catKey)}
            onRefresh={handleSyncFirebase}
            isRefreshing={isSyncing}
          />

          {/* Ringkasan Pembiayaan & Dana Talang Widget */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-5 rounded-2xl border border-emerald-800/50 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    {lang === 'ja' ? '生徒・管理書類 融資統合センター' : 'Pusat Integrasi Dana Talang Admin Siswa & Admin Doc'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    {lang === 'ja' ? '候補者費用支援・つなぎ資金ステータス概要' : 'Ringkasan Status Pembiayaan & Dana Talang Candidate'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('settings');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'パラメータ設定' : 'Pengaturan Parameter'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] text-slate-300 font-bold block uppercase">
                  {lang === 'ja' ? '総申請数' : 'Total Permohonan'}
                </span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">
                  {Object.keys(financingRecords).length} {lang === 'ja' ? '名' : 'Candidates'}
                </span>
              </div>

              <div className="bg-white/5 border border-amber-500/30 rounded-xl p-3 bg-amber-950/20">
                <span className="text-[10px] text-amber-300 font-bold block uppercase">
                  {lang === 'ja' ? '1. 生徒・申請者' : '1. Siswa/Pemohon'}
                </span>
                <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
                  {(Object.values(financingRecords) as AplikasiDukunganDana[]).filter(f => f.statusPersetujuan === 'PENGAJUAN').length} {lang === 'ja' ? '管理者確認待ち' : 'Pending Admin'}
                </span>
              </div>

              <div className="bg-white/5 border border-blue-500/30 rounded-xl p-3 bg-blue-950/20">
                <span className="text-[10px] text-blue-300 font-bold block uppercase">
                  {lang === 'ja' ? '2. 管理者検証' : '2. Verifikasi Admin'}
                </span>
                <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">
                  {(Object.values(financingRecords) as AplikasiDukunganDana[]).filter(f => f.statusPersetujuan === 'VERIFIKASI_ADMIN').length} {lang === 'ja' ? 'マネージャー確認待ち' : 'Pending Manager'}
                </span>
              </div>

              <div className="bg-white/5 border border-purple-500/30 rounded-xl p-3 bg-purple-950/20">
                <span className="text-[10px] text-purple-300 font-bold block uppercase">
                  {lang === 'ja' ? '3. 統括マネージャー' : '3. User Manager'}
                </span>
                <span className="text-base font-black text-purple-400 font-mono mt-0.5 block">
                  {(Object.values(financingRecords) as AplikasiDukunganDana[]).filter(f => f.statusPersetujuan === 'APPROVAL_MANAGER').length} {lang === 'ja' ? 'GM承認待ち' : 'Pending GM'}
                </span>
              </div>

              <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-3 bg-emerald-950/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase">
                  {lang === 'ja' ? '4. GM承認済 (最終)' : '4. GM Disetujui (Final)'}
                </span>
                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                  {(Object.values(financingRecords) as AplikasiDukunganDana[]).filter(f => f.statusPersetujuan === 'DISETUJUI').length} {lang === 'ja' ? '承認完了' : 'Approved'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Pipeline Bar with Detailed Text Descriptions & Interactive Legend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    {lang === 'ja' ? '候補者選考パイプライン進捗分布' : 'Distribusi Progres Pipeline Kandidat'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ja' ? '全候補者の選考段階およびステータスの可視化' : 'Visualisasi tahapan seleksi & status seluruh kandidat'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                  {lang === 'ja' ? `合計: ${rirekishoList.length} 名` : `Total: ${rirekishoList.length} Kandidat`}
                </span>
              </div>
            </div>

            {/* Stacked Multi-Segment Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-6 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200/80 p-0.5 gap-0.5">
                {[
                  { key: 'Nihongo check', label: lang === 'ja' ? '日本語チェック' : 'Nihongo Check', bg: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-950' },
                  { key: 'Belum Lolos Nihongo check', label: lang === 'ja' ? '日本語チェック未合格' : 'Belum Lolos Nihongo', bg: 'bg-rose-500', dot: 'bg-rose-500', text: 'text-rose-950' },
                  { key: 'Pending Nunggu Job', label: lang === 'ja' ? '求人待ち / 待機中' : 'Pending Nunggu Job', bg: 'bg-orange-500', dot: 'bg-orange-500', text: 'text-orange-950' },
                  { key: 'Penjadwalan Interview', label: lang === 'ja' ? '面接日程調整中' : 'Penjadwalan Interview', bg: 'bg-purple-600', dot: 'bg-purple-600', text: 'text-purple-950' },
                  { key: 'On Proses', label: lang === 'ja' ? '選考進行中' : 'On Proses', bg: 'bg-sky-500', dot: 'bg-sky-500', text: 'text-sky-950' },
                  { key: 'Tidak Lolos Interview', label: lang === 'ja' ? '面接不合格' : 'Tidak Lolos Interview', bg: 'bg-red-500', dot: 'bg-red-500', text: 'text-red-950' },
                  { key: 'Lolos Interview (Naitei)', label: lang === 'ja' ? '内定獲得 (合格)' : 'Lolos Interview (Naitei)', bg: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-950' },
                  { key: 'Proses Visas/COE', label: lang === 'ja' ? 'ビザ/COE申請中' : 'Proses Visas/COE', bg: 'bg-cyan-500', dot: 'bg-cyan-500', text: 'text-cyan-950' },
                  { key: 'Status On Job (Selesai)', label: lang === 'ja' ? '就業中 (完了)' : 'Status On Job (Selesai)', bg: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-950' },
                  { key: 'Cancel', label: lang === 'ja' ? '辞退 / キャンセル' : 'Cancel', bg: 'bg-slate-400', dot: 'bg-slate-400', text: 'text-slate-900' },
                  { key: 'Belum Ada', label: lang === 'ja' ? 'ステータス未設定' : 'Belum Ada Status', bg: 'bg-slate-300', dot: 'bg-slate-300', text: 'text-slate-800' }
                ].map((item) => {
                  const cnt = statusCounts[item.key] || 0;
                  if (cnt === 0 || rirekishoList.length === 0) return null;
                  const pctVal = (cnt / rirekishoList.length) * 100;
                  const pctStr = pctVal.toFixed(1);
                  const isSelected = monitoringSelectedStatus === item.key;
                  return (
                    <div
                      key={item.key}
                      onClick={() => setMonitoringSelectedStatus(isSelected ? 'Semua' : item.key)}
                      style={{ width: `${pctVal}%` }}
                      className={`${item.bg} h-full transition-all duration-300 relative group cursor-pointer flex items-center justify-center font-black text-[10px] text-white overflow-hidden rounded-xs ${
                        isSelected ? 'ring-2 ring-purple-600 scale-y-110 z-10 shadow-md' : 'hover:opacity-90'
                      }`}
                      title={`${item.label}: ${cnt} ${lang === 'ja' ? '名' : 'Kandidat'} (${pctStr}%)`}
                    >
                      {pctVal >= 5 && (
                        <span className="truncate px-1 drop-shadow-xs font-mono">
                          {cnt} ({Math.round(pctVal)}%)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Text Legend Grid with Labels, Numbers & Percentages */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2.5">
                <span className="flex items-center space-x-1">
                  <span>{lang === 'ja' ? 'ステータス詳細 & 内訳人数:' : 'Keterangan Status & Rincian Jumlah:'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {lang === 'ja' ? '（ステータス枠をクリックして絞り込み）' : '(Klik kotak status untuk menyaring tabel)'}
                  </span>
                </span>
                {monitoringSelectedStatus !== 'Semua' && (
                  <button
                    type="button"
                    onClick={() => setMonitoringSelectedStatus('Semua')}
                    className="text-purple-700 hover:text-purple-900 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg transition"
                  >
                    ✕ {lang === 'ja' ? 'フィルタ解除' : 'Reset Filter'} ({translateProgressStatus(monitoringSelectedStatus, lang)})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {[
                  { key: 'Nihongo check', label: lang === 'ja' ? '日本語チェック' : 'Nihongo Check', dotBg: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { key: 'Belum Lolos Nihongo check', label: lang === 'ja' ? '日本語チェック未合格' : 'Belum Lolos Nihongo', dotBg: 'bg-rose-500', badgeClass: 'bg-rose-100 text-rose-900 border-rose-300' },
                  { key: 'Pending Nunggu Job', label: lang === 'ja' ? '求人待ち / 待機中' : 'Pending Nunggu Job', dotBg: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-900 border-orange-300' },
                  { key: 'Penjadwalan Interview', label: lang === 'ja' ? '面接日程調整中' : 'Penjadwalan Interview', dotBg: 'bg-purple-600', badgeClass: 'bg-purple-100 text-purple-900 border-purple-300' },
                  { key: 'On Proses', label: lang === 'ja' ? '選考進行中' : 'On Proses', dotBg: 'bg-sky-500', badgeClass: 'bg-sky-100 text-sky-900 border-sky-300' },
                  { key: 'Tidak Lolos Interview', label: lang === 'ja' ? '面接不合格' : 'Tidak Lolos Interview', dotBg: 'bg-red-500', badgeClass: 'bg-red-100 text-red-900 border-red-300' },
                  { key: 'Lolos Interview (Naitei)', label: lang === 'ja' ? '内定獲得 (合格)' : 'Lolos Interview (Naitei)', dotBg: 'bg-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                  { key: 'Proses Visas/COE', label: lang === 'ja' ? 'ビザ/COE申請中' : 'Proses Visas/COE', dotBg: 'bg-cyan-500', badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
                  { key: 'Status On Job (Selesai)', label: lang === 'ja' ? '就業中 (完了)' : 'Status On Job (Selesai)', dotBg: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                  { key: 'Cancel', label: lang === 'ja' ? '辞退 / キャンセル' : 'Cancel', dotBg: 'bg-slate-400', badgeClass: 'bg-slate-200 text-slate-800 border-slate-300' },
                  { key: 'Belum Ada', label: lang === 'ja' ? 'ステータス未設定' : 'Belum Ada Status', dotBg: 'bg-slate-300', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' }
                ].map((item) => {
                  const cnt = statusCounts[item.key] || 0;
                  const pct = rirekishoList.length > 0 ? ((cnt / rirekishoList.length) * 100).toFixed(1) : '0';
                  const isSelected = monitoringSelectedStatus === item.key;

                  return (
                    <div
                      key={item.key}
                      onClick={() => setMonitoringSelectedStatus(isSelected ? 'Semua' : item.key)}
                      className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/40 shadow-xs'
                          : cnt > 0
                          ? 'bg-slate-50/90 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          : 'bg-slate-50/40 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${item.dotBg} border border-black/10 shadow-2xs`} />
                        <span className="font-bold text-slate-900 text-[11px] leading-tight truncate" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className={`px-1.5 py-0.2 rounded-md font-extrabold text-[11px] border ${item.badgeClass}`}>
                          {cnt} <span className="font-semibold text-[9px] opacity-80">{lang === 'ja' ? '名' : 'Orang'}</span>
                        </span>
                        <span className="font-mono text-[10px] font-extrabold text-slate-500">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TWO BREAKDOWN PANELS: Berdasarkan Bidang Kerja & Berdasarkan Kategori */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch font-sans">
            {/* Panel 1: Berdasarkan Bidang Kerja */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>{lang === 'ja' ? '職種・業種別' : 'Berdasarkan Bidang Kerja'}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {bidangKerjaStats.list.length} {lang === 'ja' ? '業種' : 'Sektor'}
                  </span>
                </div>

                {/* Sector Rows List */}
                <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1 text-xs">
                  {bidangKerjaStats.list.map((item) => {
                    const isSelected = monitoringSectorFilter === item.name;
                    return (
                      <div
                        key={item.name}
                        onClick={() => {
                          setMonitoringSectorFilter((prev) => (prev === item.name ? 'Semua' : item.name));
                        }}
                        className={`p-2.5 rounded-xl transition cursor-pointer group ${
                          isSelected ? 'bg-sky-50 border border-sky-300 shadow-2xs' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800 text-[11px] sm:text-xs mb-1.5">
                          <span className="uppercase tracking-wider group-hover:text-sky-700 transition">
                            {translateSector(item.name, lang)}
                          </span>
                          <span className="text-slate-500 font-semibold text-[11px]">
                            {item.count} {lang === 'ja' ? '名' : 'Kandidat'} <span className="text-slate-400">({item.pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                          <div
                            style={{ width: `${Math.max(item.pct, 2)}%` }}
                            className={`h-full transition-all duration-500 rounded-full ${
                              isSelected ? 'bg-sky-600' : 'bg-blue-600 group-hover:bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset Sector Filter link if filtered */}
              {monitoringSectorFilter !== 'Semua' && (
                <button
                  type="button"
                  onClick={() => setMonitoringSectorFilter('Semua')}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 p-2 rounded-xl transition text-center cursor-pointer"
                >
                  ✕ {lang === 'ja' ? '業種フィルタ解除: ' : 'Batalkan Filter Bidang: '}{translateSector(monitoringSectorFilter, lang)}
                </button>
              )}
            </div>

            {/* Panel 2: Berdasarkan Kategori */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{lang === 'ja' ? '候補者区分・カテゴリー別' : 'Berdasarkan Kategori'}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {lang === 'ja' ? '主要カテゴリー' : '3 Kategori Utama'}
                  </span>
                </div>

                {/* Category Rows */}
                <div className="mt-4 space-y-4 text-xs">
                  {kategoriStats.map((item) => {
                    const isSelected = monitoringCategoryFilter === item.badge || monitoringCategoryFilter === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setMonitoringCategoryFilter((prev) => (prev === item.id || prev === item.badge ? 'Semua' : item.id));
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-2xs'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${item.badgeClass}`}>
                            {translateCandidateCategory(item.badge, lang)}
                          </span>
                          <span className="font-black text-slate-900 text-sm sm:text-base font-mono">
                            {item.count} {lang === 'ja' ? '名' : ''}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            style={{ width: `${Math.max(item.pct, 3)}%` }}
                            className={`h-full transition-all duration-500 rounded-full ${item.barClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Button: Lihat Detail Semua Kandidat → */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMonitoringSelectedStatus('Semua');
                    setMonitoringSearchTerm('');
                    setMonitoringCategoryFilter('Semua');
                    setMonitoringSectorFilter('Semua');
                    const tableElem = document.getElementById('monitoring-table-section');
                    if (tableElem) {
                      tableElem.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full py-3 px-4 bg-slate-50 hover:bg-purple-50 text-purple-700 hover:text-purple-900 border border-slate-200 hover:border-purple-300 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
                >
                  <span>{lang === 'ja' ? '全候補者の詳細一覧を表示' : 'Lihat Detail Semua Kandidat'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={monitoringSearchTerm}
                  onChange={(e) => setMonitoringSearchTerm(e.target.value)}
                  placeholder={lang === 'ja' ? '候補者氏名、TSK、受入企業、進捗メモを検索...' : 'Cari nama kandidat, TSK, perusahaan, atau keterangan progres...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
                {monitoringSearchTerm && (
                  <button
                    onClick={() => setMonitoringSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={monitoringSelectedStatus}
                    onChange={(e) => setMonitoringSelectedStatus(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? `全ステータス (${rirekishoList.length})` : `Semua Status (${rirekishoList.length})`}</option>
                    <option value="Nihongo check">{lang === 'ja' ? '日本語チェック' : 'Nihongo check'} ({statusCounts['Nihongo check']})</option>
                    <option value="Belum Lolos Nihongo check">{lang === 'ja' ? '日本語チェック未合格' : 'Belum Lolos Nihongo check'} ({statusCounts['Belum Lolos Nihongo check']})</option>
                    <option value="Pending Nunggu Job">{lang === 'ja' ? '求人待ち / 待機中' : 'Pending Nunggu Job'} ({statusCounts['Pending Nunggu Job']})</option>
                    <option value="Penjadwalan Interview">{lang === 'ja' ? '面接日程調整中' : 'Penjadwalan Interview'} ({statusCounts['Penjadwalan Interview']})</option>
                    <option value="On Proses">{lang === 'ja' ? '選考進行中' : 'On Proses'} ({statusCounts['On Proses']})</option>
                    <option value="Tidak Lolos Interview">{lang === 'ja' ? '面接不合格' : 'Tidak Lolos Interview'} ({statusCounts['Tidak Lolos Interview']})</option>
                    <option value="Lolos Interview (Naitei)">{lang === 'ja' ? '内定獲得 (合格)' : 'Lolos Interview (Naitei)'} ({statusCounts['Lolos Interview (Naitei)'] || 0})</option>
                    <option value="Proses Visas/COE">{lang === 'ja' ? 'ビザ/COE申請中' : 'Proses Visas/COE'} ({statusCounts['Proses Visas/COE'] || 0})</option>
                    <option value="Status On Job (Selesai)">{lang === 'ja' ? '就業中 (完了)' : 'Status On Job (Selesai)'} ({statusCounts['Status On Job (Selesai)']})</option>
                    <option value="Cancel">{lang === 'ja' ? '辞退 / キャンセル' : 'Cancel'} ({statusCounts['Cancel']})</option>
                    <option value="Belum Ada">{lang === 'ja' ? 'ステータス未設定' : 'Belum Ada Status'} ({statusCounts['Belum Ada']})</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={monitoringSectorFilter}
                    onChange={(e) => setMonitoringSectorFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? '全業種・職種' : 'Semua Bidang Kerja'}</option>
                    {bidangKerjaStats.list.map((b) => (
                      <option key={b.name} value={b.name}>
                        {translateSector(b.name, lang)} ({b.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={monitoringCategoryFilter}
                    onChange={(e) => setMonitoringCategoryFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? '全カテゴリー' : 'Semua Kategori'}</option>
                    <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携校生 / 非IJEF生' : 'SISWA MITRA / NON IJEF'}</option>
                    <option value="NEW COMER">{lang === 'ja' ? '新規渡航（New Comer）' : 'NEW COMER / SISWA NON IJEF'}</option>
                    <option value="EX MAGANG/EX-TRAINEER">{lang === 'ja' ? '元技能実習生（Ex-Magang）' : 'EX MAGANG / EX-TRAINEER'}</option>
                    <option value="ENGINEERING/GIJINKOKU">{lang === 'ja' ? '技術・人文知識・国際業務（技人国）' : 'ENGINEERING / GIJINKOKU'}</option>
                  </select>
                </div>

                {/* Jenis Kelamin (Gender) */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={monitoringGenderFilter}
                    onChange={(e) => setMonitoringGenderFilter(e.target.value)}
                    className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? '全ての性別' : 'Semua Gender'}</option>
                    <option value="Laki-laki">{lang === 'ja' ? '♂ 男性 (Pria)' : '♂ Pria (Laki-laki)'}</option>
                    <option value="Perempuan">{lang === 'ja' ? '♀ 女性 (Wanita)' : '♀ Wanita (Perempuan)'}</option>
                  </select>
                </div>

                {(monitoringSelectedStatus !== 'Semua' || monitoringSearchTerm || monitoringCategoryFilter !== 'Semua' || monitoringSectorFilter !== 'Semua' || monitoringGenderFilter !== 'Semua') && (
                  <button
                    onClick={() => {
                      setMonitoringSelectedStatus('Semua');
                      setMonitoringSearchTerm('');
                      setMonitoringCategoryFilter('Semua');
                      setMonitoringSectorFilter('Semua');
                      setMonitoringGenderFilter('Semua');
                    }}
                    className="text-purple-700 hover:text-purple-900 font-bold flex items-center space-x-1 border border-purple-200 bg-purple-50 px-3 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? 'フィルタ解除' : 'Reset Filter'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
              <span>
                {lang === 'ja' ? (
                  <>全{rirekishoList.length}名中 <strong className="text-slate-800">{filteredMonitoringCVs.length}</strong> 名の候補者を表示</>
                ) : (
                  <>Menampilkan <strong className="text-slate-800">{filteredMonitoringCVs.length}</strong> dari {rirekishoList.length} kandidat</>
                )}
              </span>
              <div className="flex items-center gap-2">
                {monitoringGenderFilter !== 'Semua' && (
                  <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center space-x-1">
                    <span>{monitoringGenderFilter === 'Laki-laki' ? '♂ Pria' : '♀ Wanita'}</span>
                    <button
                      type="button"
                      onClick={() => setMonitoringGenderFilter('Semua')}
                      className="ml-1 text-blue-600 hover:text-blue-900 font-black cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {monitoringSelectedStatus !== 'Semua' && (
                  <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                    {lang === 'ja' ? 'ステータス: ' : 'Filter Status: '}{translateProgressStatus(monitoringSelectedStatus, lang)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Prominent Header & View Mode Switcher Bar for Monitoring Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {lang === 'ja' ? '候補者・生徒モニタリング一覧' : 'Daftar Monitoring Kandidat & Siswa'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ja'
                    ? `総数 ${rirekishoList.length} 名中 ${filteredMonitoringCVs.length} 名を表示中`
                    : `Menampilkan ${filteredMonitoringCVs.length} dari total ${rirekishoList.length} kandidat`}
                </p>
              </div>
            </div>

            {/* Prominent View Mode Switcher */}
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-xl p-1 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => setCandidateViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  candidateViewMode === 'table'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'テーブル形式' : 'Mode Tabel'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCandidateViewMode('cards')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  candidateViewMode === 'cards'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'カード形式' : 'Mode Kartu'}</span>
              </button>
            </div>
          </div>

          {/* Monitoring Data Display: Cards or Table */}
          <div id="monitoring-table-section" className="w-full">
            {candidateViewMode === 'cards' ? (
              <div>
                {filteredMonitoringCVs.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-800">
                      {lang === 'ja' ? '該当する候補者が見つかりません' : 'Tidak ada kandidat ditemukan'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                      {lang === 'ja'
                        ? '指定されたフィルタ条件や検索キーワードに一致するデータがありません。'
                        : 'Tidak ada data kandidat yang cocok dengan kriteria filter saat ini.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredMonitoringCVs.map((cv, idx) => {
                      const matchingStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                      const photoSrc = getStudentPhotoUrl(matchingStudent, cv);
                      return (
                        <div
                          key={cv.id ? `mon-card-${cv.id}-${idx}` : `mon-card-${idx}`}
                          onClick={() => handleNavigateToCandidateProgress(cv)}
                          className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                        >
                          <div>
                            {/* Card Header: Photo, Name, ID */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center space-x-3">
                                <StudentPhotoBadge
                                  photoUrl={photoSrc}
                                  student={matchingStudent}
                                  rirekisho={cv}
                                  namaLengkap={cv.namaLengkap}
                                  size="md"
                                  ratioLabel="4×6"
                                  theme="purple"
                                  lang={lang}
                                />
                                <div>
                                  <h4 className="font-extrabold text-slate-900 group-hover:text-purple-700 transition text-sm">
                                    {getCandidateName(cv).toUpperCase()}
                                  </h4>
                                  <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5 font-mono">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">
                                      {cv.kodeReferensi || cv.kodeJob || cv.siswaId || 'NO-REF'}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]">
                                      {translateSector(cv.bidangKerja || 'General Worker', lang)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                {renderStatusBadge(cv.statusProgres)}
                              </div>
                            </div>

                            {/* Details Info */}
                            <div className="space-y-2 py-2.5 border-t border-slate-100 text-xs">
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wider">
                                  {lang === 'ja' ? '進捗メモ' : 'Keterangan Progres'}
                                </span>
                                <p className="text-slate-800 font-medium line-clamp-2">
                                  {cv.keteranganProgres || cv.detailProgres || (
                                    <span className="text-slate-400 italic">
                                      {lang === 'ja' ? '進捗メモ未記入...' : 'Belum ada keterangan progres...'}
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 p-2 rounded-xl">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                    {lang === 'ja' ? '受入企業' : 'Perusahaan JP'}
                                  </span>
                                  <span className="font-semibold text-slate-900 truncate block mt-0.5">
                                    {cv.namaPerusahaanJp || '-'}
                                  </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                    {lang === 'ja' ? '登録支援機関' : 'Nama TSK'}
                                  </span>
                                  <span className="font-semibold text-slate-900 truncate block mt-0.5">
                                    {cv.namaTSK || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {cv.jadwalKeberangkatan ? `Target: ${cv.jadwalKeberangkatan}` : (lang === 'ja' ? '渡航予定未定' : 'Target: -')}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleNavigateToCandidateProgress(cv)}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition flex items-center space-x-1 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{lang === 'ja' ? '進捗編集' : 'Edit Progres'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedCVForJis(cv)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold p-1.5 rounded-xl transition cursor-pointer"
                                title="Lihat CV Jepang"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="p-3.5 pl-4">{lang === 'ja' ? '候補者情報' : 'Kandidat'}</th>
                        <th className="p-3.5">{lang === 'ja' ? '進捗ステータス' : 'Status Progres'}</th>
                        <th className="p-3.5">{lang === 'ja' ? '進捗詳細・メモ' : 'Keterangan Progres'}</th>
                        <th className="p-3.5">{lang === 'ja' ? '受入企業・勤務地' : 'Perusahaan & Lokasi JP'}</th>
                        <th className="p-3.5">{lang === 'ja' ? '登録支援機関 (TSK)' : 'Nama TSK'}</th>
                        <th className="p-3.5">{lang === 'ja' ? '渡航予定 / 目標日' : 'Target / Keberangkatan'}</th>
                        <th className="p-3.5 text-center pr-4">{lang === 'ja' ? 'アクション' : 'Direct Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMonitoringCVs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Search className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-sm text-slate-600">
                                {lang === 'ja' ? '該当する候補者データが見つかりません' : 'Tidak ada data kandidat ditemukan'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {lang === 'ja' ? '検索キーワードを変更するか、フィルタをリセットしてください。' : 'Coba ubah kata kunci pencarian atau reset filter status.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredMonitoringCVs.map((cv, idx) => (
                          <tr
                            key={cv.id ? `mon-cv-${cv.id}-${idx}` : `mon-cv-${idx}`}
                            className="hover:bg-purple-50/40 transition cursor-pointer group"
                            onClick={() => handleNavigateToCandidateProgress(cv)}
                          >
                            {/* Kandidat Info */}
                            <td className="p-3.5 pl-4">
                              <div className="flex items-center space-x-3">
                                {(() => {
                                  const matchingStudent = students.find((s) => s.id === cv.siswaId || s.id === cv.id);
                                  const photoSrc = getStudentPhotoUrl(matchingStudent, cv);
                                  return (
                                    <StudentPhotoBadge
                                      photoUrl={photoSrc}
                                      student={matchingStudent}
                                      rirekisho={cv}
                                      namaLengkap={cv.namaLengkap}
                                      size="xs"
                                      ratioLabel="4×6"
                                      theme="purple"
                                      lang={lang}
                                    />
                                  );
                                })()}
                                <div>
                                  <div className="font-extrabold text-slate-900 group-hover:text-purple-700 transition flex items-center space-x-1.5">
                                    <span>{getCandidateName(cv).toUpperCase()}</span>
                                    {cv.isBaru && (
                                      <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                        {lang === 'ja' ? '新規' : 'BARU'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono font-bold">
                                      {cv.kodeReferensi || cv.kodeJob || cv.siswaId || 'NO-REF'}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate max-w-[140px]">
                                      {translateSector(cv.bidangKerja || 'General Worker', lang)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Status Progres Badge */}
                            <td className="p-3.5">
                              {renderStatusBadge(cv.statusProgres)}
                            </td>

                            {/* Keterangan Progres */}
                            <td className="p-3.5 max-w-[220px]">
                              <div className="text-slate-800 font-medium text-[11px] line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80 group-hover:border-purple-200">
                                {cv.keteranganProgres || cv.detailProgres || (
                                  <span className="text-slate-400 italic">
                                    {lang === 'ja' ? '進捗メモ未記入...' : 'Belum ada keterangan progres...'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Perusahaan & Lokasi */}
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-900">
                                {cv.namaPerusahaanJp || <span className="text-slate-400 font-normal italic">{lang === 'ja' ? '- 未設定 -' : '- Belum ada -'}</span>}
                              </div>
                              {cv.lokasiPerusahaanJp && (
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span>{cv.lokasiPerusahaanJp}</span>
                                </div>
                              )}
                            </td>

                            {/* Nama TSK */}
                            <td className="p-3.5 font-medium text-slate-800">
                              {cv.namaTSK || <span className="text-slate-400 font-normal italic">-</span>}
                            </td>

                            {/* Target Keberangkatan & COE */}
                            <td className="p-3.5">
                              <div className="text-slate-800 font-semibold">
                                {cv.jadwalKeberangkatan || <span className="text-slate-400 font-normal italic">-</span>}
                              </div>
                              {cv.coeTerbit && (
                                <div className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 inline-block font-bold mt-1">
                                  COE: {cv.coeTerbit}
                                </div>
                              )}
                            </td>

                            {/* Direct Action Button */}
                            <td className="p-3.5 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToCandidateProgress(cv)}
                                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-xs shadow-purple-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                                  title={lang === 'ja' ? '進捗データを編集' : 'Klik untuk langsung mengedit progres data kandidat ini'}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>{lang === 'ja' ? '進捗編集' : 'Edit Progres'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedCVForJis(cv)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold p-1.5 rounded-xl transition cursor-pointer"
                                  title={lang === 'ja' ? 'JIS履歴書を表示' : 'Lihat CV Jepang (JIS)'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JOB POSTINGS MANAGEMENT (GOOGLE SHEET INTEGRATION) */}
      {activeTab === 'jobs' && (
        <div className="space-y-5">
          {/* DASHBOARD STATISTIK & KLASIFIKASI LOWONGAN KERJA (LIGHT THEME) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm text-slate-800">
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shadow-xs">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {lang === 'ja' ? '求人統計・分類ダッシュボード' : 'Dashboard Statistik & Klasifikasi Lowongan Kerja'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'ja'
                    ? '職種分野、募集状況、対象区分、提携TSK機関に基づく日本求人データベースの包括的分類。'
                    : 'Klasifikasi menyeluruh database lowongan Jepang berdasarkan sektor kerja, status ketersediaan, kategori, dan mitra TSK.'}
                </p>
              </div>

              {/* Active Filter Badges & Counter */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(jobSearchTerm || jobStatusFilter !== 'Semua' || jobDomisiliFilter !== 'Semua' || jobTSKFilter !== 'Semua' || jobSectorFilter !== 'Semua' || jobCategoryFilter !== 'Semua' || jobGenderFilter !== 'Semua') && (
                  <button
                    type="button"
                    onClick={handleResetJobFilters}
                    className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? '適用中フィルタ解除' : 'Hapus Filter Aktif'}</span>
                  </button>
                )}
                <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                  {lang === 'ja'
                    ? <>求人総数: <strong>{jobDashboardStats.total}</strong> 件 • 採用枠: <strong>{jobDashboardStats.totalKuota}</strong> 名</>
                    : <>Total Database: <strong>{jobDashboardStats.total}</strong> Lowongan • <strong>{jobDashboardStats.totalKuota}</strong> Kuota Siswa</>}
                </span>
              </div>
            </div>

            {/* Quick Sync & Refresh for Jobs */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <FirebaseSyncControlBar domain="jobs" variant="compact" />
            </div>

            {/* 5 Primary Sector Metric KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
              {/* Total Lowongan Database */}
              <div
                onClick={() => handleResetJobFilters()}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  jobSectorFilter === 'Semua' && jobCategoryFilter === 'Semua' && jobStatusFilter === 'Semua' && jobDomisiliFilter === 'Semua' && jobTSKFilter === 'Semua' && jobGenderFilter === 'Semua'
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-indigo-50/40 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                    {lang === 'ja' ? '全求人案件' : 'Semua Lowongan'}
                  </span>
                  <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {jobDashboardStats.total}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {jobDashboardStats.totalKuota} {lang === 'ja' ? '名（採用総枠）' : 'Total Kuota Siswa'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full w-full rounded-full" />
                </div>
              </div>

              {/* Kaigo (Caregiver) */}
              <div
                onClick={() => setJobSectorFilter(jobSectorFilter === 'KAIGO' ? 'Semua' : 'KAIGO')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  jobSectorFilter === 'KAIGO'
                    ? 'bg-sky-50/90 border-sky-300 ring-2 ring-sky-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-sky-50/40 hover:border-sky-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                    {lang === 'ja' ? '介護 (Caregiver)' : 'Kaigo (Caregiver)'}
                  </span>
                  <div className="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {jobDashboardStats.fields.kaigo.count}
                  </div>
                  <div className="text-[11px] text-sky-700 font-medium mt-0.5">
                    {jobDashboardStats.fields.kaigo.kuota} {lang === 'ja' ? '名枠' : 'Kuota'} • {Math.round((jobDashboardStats.fields.kaigo.count / (jobDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（構成比）' : '% posisi'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((jobDashboardStats.fields.kaigo.count / (jobDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Pengolahan Makanan (PM) */}
              <div
                onClick={() => setJobSectorFilter(jobSectorFilter === 'PM' ? 'Semua' : 'PM')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  jobSectorFilter === 'PM'
                    ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-amber-50/40 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                    {lang === 'ja' ? '食品製造 (PM)' : 'Pengolahan Makanan'}
                  </span>
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Utensils className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {jobDashboardStats.fields.pm.count}
                  </div>
                  <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                    {jobDashboardStats.fields.pm.kuota} {lang === 'ja' ? '名枠' : 'Kuota'} • {Math.round((jobDashboardStats.fields.pm.count / (jobDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（構成比）' : '% posisi'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((jobDashboardStats.fields.pm.count / (jobDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Pertanian & Peternakan */}
              <div
                onClick={() => setJobSectorFilter(jobSectorFilter === 'PERTANIAN' ? 'Semua' : 'PERTANIAN')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  jobSectorFilter === 'PERTANIAN'
                    ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-emerald-50/40 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {lang === 'ja' ? '農業・畜産' : 'Pertanian / Ternak'}
                  </span>
                  <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {jobDashboardStats.fields.pertanian.count}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    {jobDashboardStats.fields.pertanian.kuota} {lang === 'ja' ? '名枠' : 'Kuota'} • {Math.round((jobDashboardStats.fields.pertanian.count / (jobDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（構成比）' : '% posisi'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((jobDashboardStats.fields.pertanian.count / (jobDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Teknik & Manufaktur */}
              <div
                onClick={() => setJobSectorFilter(jobSectorFilter === 'ENGINEERING' ? 'Semua' : 'ENGINEERING')}
                className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between col-span-2 sm:col-span-1 ${
                  jobSectorFilter === 'ENGINEERING' || jobSectorFilter === 'Lainnya' || jobSectorFilter === 'RESTORAN'
                    ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400/30 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-purple-50/40 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                    {lang === 'ja' ? '技術・製造' : 'Teknik / Manufaktur'}
                  </span>
                  <div className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {jobDashboardStats.fields.engineering.count + jobDashboardStats.fields.restoran.count + jobDashboardStats.fields.other.count}
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                    {jobDashboardStats.fields.engineering.kuota + jobDashboardStats.fields.restoran.kuota + jobDashboardStats.fields.other.kuota} {lang === 'ja' ? '名枠' : 'Kuota'} • {Math.round(((jobDashboardStats.fields.engineering.count + jobDashboardStats.fields.restoran.count + jobDashboardStats.fields.other.count) / (jobDashboardStats.total || 1)) * 100)}{lang === 'ja' ? '%（構成比）' : '% posisi'}
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((jobDashboardStats.fields.engineering.count + jobDashboardStats.fields.restoran.count + jobDashboardStats.fields.other.count) / (jobDashboardStats.total || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary Classification Strips: Status Job, Urgensi Job (Open), Domisili Job Siswa, Target Kategori, TSK Rekanan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4 pt-4 border-t border-slate-100">
              {/* Strip 1: Status Lowongan */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    {lang === 'ja' ? '求人募集状況:' : 'Status Ketersediaan Job:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setJobStatusFilter(jobStatusFilter === 'Aktif' ? 'Semua' : 'Aktif')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobStatusFilter === 'Aktif'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '募集中 (Aktif)' : 'Aktif'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobStatusFilter === 'Aktif' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {jobDashboardStats.status.aktif.count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobStatusFilter(jobStatusFilter === 'Tutup' ? 'Semua' : 'Tutup')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobStatusFilter === 'Tutup'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '締切済 (Close)' : 'Close'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobStatusFilter === 'Tutup' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {jobDashboardStats.status.tutup.count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Strip 2: Tingkat Urgensi Job (Saat Open) */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    {lang === 'ja' ? '募集緊急度 (Open):' : 'Tingkat Urgensi (Open):'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setJobUrgensiFilter(jobUrgensiFilter === 'URGENT' ? 'Semua' : 'URGENT')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobUrgensiFilter === 'URGENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '🔥 至急' : '🔥 Urgent'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobUrgensiFilter === 'URGENT' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {jobDashboardStats.urgensi.urgent.count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobUrgensiFilter(jobUrgensiFilter === 'STANDART' ? 'Semua' : 'STANDART')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobUrgensiFilter === 'STANDART'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '⚡ 通常' : '⚡ Standart'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobUrgensiFilter === 'STANDART' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {jobDashboardStats.urgensi.standart.count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobUrgensiFilter(jobUrgensiFilter === 'SLOW' ? 'Semua' : 'SLOW')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobUrgensiFilter === 'SLOW'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '⏳ 余裕あり' : '⏳ Slow'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobUrgensiFilter === 'SLOW' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {jobDashboardStats.urgensi.slow.count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Strip 3: Kategori Domisili Job Siswa */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    {lang === 'ja' ? '生徒居住地域区分:' : 'Kategori Domisili Siswa:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setJobDomisiliFilter(jobDomisiliFilter === 'Domestik (Jepang)' ? 'Semua' : 'Domestik (Jepang)')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobDomisiliFilter === 'Domestik (Jepang)'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '日本国内 (Domestik)' : 'Domestik (Jepang)'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobDomisiliFilter === 'Domestik (Jepang)' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {jobDashboardStats.domisili.domestik.count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobDomisiliFilter(jobDomisiliFilter === 'Lokal (Indonesia)' ? 'Semua' : 'Lokal (Indonesia)')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobDomisiliFilter === 'Lokal (Indonesia)'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? 'インドネシア国内 (Lokal)' : 'Lokal (Indonesia)'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobDomisiliFilter === 'Lokal (Indonesia)' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {jobDashboardStats.domisili.lokal.count}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Strip 4: Target Kategori Kandidat */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    {lang === 'ja' ? '対象候補者区分:' : 'Target Kategori Kandidat:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setJobCategoryFilter(jobCategoryFilter === 'NEW COMER' ? 'Semua' : 'NEW COMER')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobCategoryFilter === 'NEW COMER'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '新規渡航者' : 'New Comer'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobCategoryFilter === 'NEW COMER' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {jobDashboardStats.categories.newComer}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobCategoryFilter(jobCategoryFilter === 'EX MAGANG' ? 'Semua' : 'EX MAGANG')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobCategoryFilter === 'EX MAGANG'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '実習経験者' : 'Ex-Magang'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobCategoryFilter === 'EX MAGANG' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {jobDashboardStats.categories.exMagang}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobCategoryFilter(jobCategoryFilter === 'ENGINEERING' ? 'Semua' : 'ENGINEERING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                        jobCategoryFilter === 'ENGINEERING'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <span>{lang === 'ja' ? '技人国 / 技術' : 'Engineering'}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        jobCategoryFilter === 'ENGINEERING' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {jobDashboardStats.categories.engineering}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Strip 5: Top TSK & Partner Rekanan */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    {lang === 'ja' ? '主要提携TSK機関:' : 'TSK & Partner Utama:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {jobDashboardStats.topTSKs.map((tsk) => (
                      <button
                        key={`top-tsk-${tsk.name}`}
                        type="button"
                        onClick={() => setJobTSKFilter(jobTSKFilter === tsk.name ? 'Semua' : tsk.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer border ${
                          jobTSKFilter === tsk.name
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate max-w-[90px]">{tsk.name}</span>
                        <span className={`px-1 rounded text-[10px] font-black ${
                          jobTSKFilter === tsk.name ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tsk.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Bar & Search / Filter Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Database className="w-5 h-5 text-purple-600" />
                  <span>{lang === 'ja' ? '求人カタログ（スプレッドシート連携）' : 'Katalog Job Posting (Sinkronisasi Google Spreadsheet)'}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ja'
                    ? '求人コード、応募資格、費用、提携登録支援機関（TSK）、条件要件を一元管理する求人データベースです。'
                    : 'Sistem katalog job terintegrasi lengkap dengan kode job, kualifikasi, biaya proses, TSK partner, dan kriteria kandidat.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setJobViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      jobViewMode === 'table' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? 'スプレッドシート表' : 'Tabel Spreadsheet'}</span>
                  </button>
                  <button
                    onClick={() => setJobViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                      jobViewMode === 'grid' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? 'カード表示' : 'Tampilan Kartu'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSpreadsheetModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 cursor-pointer shrink-0 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'ja' ? 'Excel/Sheet 読込' : 'Upload Spreadsheet'}</span>
                </button>

                <button
                  onClick={() => {
                    setJobForm({
                      id: `JOB-${Date.now()}`,
                      kodeJob: '',
                      judulPekerjaan: '',
                      perusahaanJepang: '',
                      kumiaiRujukan: '',
                      lokasiPrefektur: 'Tokyo',
                      kategoriTarget: 'SISWA NON IJEF (New Comer)',
                      kategoriDomisili: 'Lokal (Indonesia)',
                      jenisKelamin: '男女 (Laki-laki & Perempuan)',
                      gajiBulananYen: 210000,
                      gajiString: '210.000円/bulan',
                      gajiEstimasiIdr: 22000000,
                      persyaratanJLPT: 'JLPT N4 / JFT-Basic A2 + SSW',
                      kualifikasi: '',
                      biayaProses: 'Sesuai Ketentuan',
                      keteranganTambahan: '',
                      tskSumberJob: 'Laporan Mandiri',
                      deskripsiPekerjaan: '',
                      fasilitasAsrama: 'Asrama fully furnished, subsidi listrik.',
                      kuotaSiswa: 5,
                      statusJob: 'Aktif',
                      statusAktif: true
                    });
                    setShowJobModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-purple-600/30 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ja' ? '新規求人手動登録' : 'Tambah Job Manual'}</span>
                </button>

                <button
                  onClick={() => setShowResetConfirmModal(true)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shrink-0 transition"
                  title={lang === 'ja' ? '求人カタログを初期状態に復元' : 'Reset Katalog Job ke Seed Default'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '初期データ復元' : 'Reset Job Default'}</span>
                </button>

                <button
                  onClick={() => setShowDeleteAllConfirmModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/30 cursor-pointer shrink-0 transition"
                  title={lang === 'ja' ? '全求人データを削除' : 'Hapus / Kosongkan Semua Job'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '全求人削除' : 'Hapus Semua Job'}</span>
                </button>
              </div>
            </div>

            {/* Filter Inputs Bar */}
            <div className="flex flex-col md:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '求人名、コード、勤務地、資格要件で検索...' : 'Cari Judul Job, Kode (IND012, 010 IJEF...), Daerah, atau Kualifikasi...'}
                  value={jobSearchTerm}
                  onChange={(e) => setJobSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {jobSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setJobSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                    title={lang === 'ja' ? '検索解除' : 'Hapus Kata Kunci'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sektor / Bidang Dropdown */}
              <div className="w-full md:w-40">
                <select
                  value={jobSectorFilter}
                  onChange={(e) => setJobSectorFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全分野' : 'Semua Sektor'}</option>
                  <option value="KAIGO">{lang === 'ja' ? '介護 (Caregiver)' : 'Kaigo (Caregiver)'}</option>
                  <option value="PM">{lang === 'ja' ? '食品製造' : 'Pengolahan Makanan'}</option>
                  <option value="PERTANIAN">{lang === 'ja' ? '農業・畜産' : 'Pertanian & Ternak'}</option>
                  <option value="ENGINEERING">{lang === 'ja' ? '技術・製造' : 'Teknik & Manufaktur'}</option>
                  <option value="RESTORAN">{lang === 'ja' ? '飲食・宿泊' : 'Restoran & Hotel'}</option>
                  <option value="Lainnya">{lang === 'ja' ? 'その他' : 'Sektor Lainnya'}</option>
                </select>
              </div>

              {/* Status Dropdown */}
              <div className="w-full md:w-44">
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全ステータス' : 'Semua Status'}</option>
                  <option value="Aktif">{lang === 'ja' ? `募集中 (${jobDashboardStats.status.aktif.count})` : `Aktif (${jobDashboardStats.status.aktif.count})`}</option>
                  <option value="Tutup">{lang === 'ja' ? `締切済 (${jobDashboardStats.status.tutup.count})` : `Close (${jobDashboardStats.status.tutup.count})`}</option>
                </select>
              </div>

              {/* Status Urgensi Dropdown */}
              <div className="w-full md:w-36">
                <select
                  value={jobUrgensiFilter}
                  onChange={(e) => setJobUrgensiFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全緊急度' : 'Semua Urgensi'}</option>
                  <option value="URGENT">{lang === 'ja' ? '🔥 至急 (URGENT)' : '🔥 URGENT'}</option>
                  <option value="STANDART">{lang === 'ja' ? '⚡ 通常 (STANDARD)' : '⚡ STANDART'}</option>
                  <option value="SLOW">{lang === 'ja' ? '⏳ 余裕あり (SLOW)' : '⏳ SLOW'}</option>
                </select>
              </div>

              {/* Kategori Domisili Job Dropdown */}
              <div className="w-full md:w-44">
                <select
                  value={jobDomisiliFilter}
                  onChange={(e) => setJobDomisiliFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全居住地区分' : 'Semua Domisili Siswa'}</option>
                  <option value="Domestik (Jepang)">{lang === 'ja' ? '国内・日本滞在中' : 'Domestik (Jepang)'}</option>
                  <option value="Lokal (Indonesia)">{lang === 'ja' ? '海外・インドネシア国内' : 'Lokal (Indonesia)'}</option>
                </select>
              </div>

              {/* Target Kategori Dropdown */}
              <div className="w-full md:w-40">
                <select
                  value={jobCategoryFilter}
                  onChange={(e) => setJobCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全対象区分' : 'Semua Target'}</option>
                  <option value="SISWA MITRA / NON IJEF">{lang === 'ja' ? '提携校生 (Siswa Mitra)' : 'Siswa Mitra (Non-IJEF)'}</option>
                  <option value="NEW COMER">{lang === 'ja' ? '新規渡航者 (New Comer)' : 'New Comer (Non-IJEF)'}</option>
                  <option value="EX MAGANG">{lang === 'ja' ? '実習経験者 (Ex-Trainee)' : 'Ex-Magang / Trainee'}</option>
                  <option value="ENGINEERING">{lang === 'ja' ? '技人国 / 技術者' : 'Engineering / Gijinkoku'}</option>
                </select>
              </div>

              {/* TSK / Partner Dropdown */}
              <div className="w-full md:w-40">
                <select
                  value={jobTSKFilter}
                  onChange={(e) => setJobTSKFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Semua">{lang === 'ja' ? '全TSK / 機関' : 'Semua TSK / Partner'}</option>
                  {Array.from(new Set(jobPostings.map((j) => j.tskSumberJob).filter(Boolean))).map((tsk, idx) => (
                    <option key={`tsk-opt-${tsk}-${idx}`} value={tsk}>
                      TSK: {tsk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tombol Reset Filter */}
              <button
                type="button"
                onClick={handleResetJobFilters}
                disabled={!jobSearchTerm && jobStatusFilter === 'Semua' && jobUrgensiFilter === 'Semua' && jobDomisiliFilter === 'Semua' && jobTSKFilter === 'Semua' && jobSectorFilter === 'Semua' && jobCategoryFilter === 'Semua' && jobGenderFilter === 'Semua'}
                className={`w-full md:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 border ${
                  jobSearchTerm || jobStatusFilter !== 'Semua' || jobUrgensiFilter !== 'Semua' || jobDomisiliFilter !== 'Semua' || jobTSKFilter !== 'Semua' || jobSectorFilter !== 'Semua' || jobCategoryFilter !== 'Semua' || jobGenderFilter !== 'Semua'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-2xs'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={lang === 'ja' ? '求人カタログのフィルタを初期化' : 'Reset Semua Filter Katalog Job'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? '初期化' : 'Reset Filter'}</span>
              </button>
            </div>
          </div>

          {/* JOB DATA LIST (FILTERED) */}
          {(() => {
            const filtered = jobPostings.filter((j) => {
              const term = jobSearchTerm.toLowerCase().trim();
              const matchSearch =
                !term ||
                (j.judulPekerjaan || '').toLowerCase().includes(term) ||
                (j.kodeJob || '').toLowerCase().includes(term) ||
                (j.lokasiPrefektur || '').toLowerCase().includes(term) ||
                (j.kualifikasi || '').toLowerCase().includes(term) ||
                (j.persyaratanJLPT || '').toLowerCase().includes(term) ||
                (j.tskSumberJob || '').toLowerCase().includes(term) ||
                (j.perusahaanJepang || '').toLowerCase().includes(term) ||
                (j.keteranganTambahan || '').toLowerCase().includes(term);

              const rawJobStatus = (j.statusJob || (j.statusAktif === false ? 'Tutup' : 'Aktif')).toString().trim().toLowerCase();
              const isClosed =
                rawJobStatus === 'tutup' ||
                rawJobStatus === 'closed' ||
                rawJobStatus === 'close' ||
                rawJobStatus === 'クローズ' ||
                rawJobStatus.includes('tutup') ||
                rawJobStatus.includes('closed') ||
                rawJobStatus.includes('close') ||
                rawJobStatus.includes('クローズ') ||
                j.statusAktif === false;

              let matchStatus = true;
              if (jobStatusFilter === 'Semua') {
                matchStatus = true;
              } else if (jobStatusFilter === 'Aktif' || jobStatusFilter === 'Semua Aktif') {
                matchStatus = !isClosed;
              } else if (jobStatusFilter === 'Tutup' || jobStatusFilter === 'Close') {
                matchStatus = isClosed;
              }

              const currentUrgensi = (j.urgensiJob || 'STANDART').toUpperCase();
              const matchUrgensi = jobUrgensiFilter === 'Semua' || currentUrgensi === jobUrgensiFilter;

              const currentDomisili = j.kategoriDomisili || (j.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
              const matchDomisili = jobDomisiliFilter === 'Semua' || currentDomisili === jobDomisiliFilter;

              const matchTSK = jobTSKFilter === 'Semua' || j.tskSumberJob === jobTSKFilter;

              let matchSector = true;
              if (jobSectorFilter !== 'Semua') {
                const title = (j.judulPekerjaan || '').toUpperCase();
                if (jobSectorFilter === 'KAIGO') {
                  matchSector = title.includes('KAIGO') || title.includes('CAREGIVER') || title.includes('CARE GIVER') || title.includes('介護');
                } else if (jobSectorFilter === 'PM') {
                  matchSector = title.includes('PENGOLAHAN MAKANAN') || title.includes('MAKANAN') || title.includes('PM') || title.includes('飲食') || title.includes('BENTO') || title.includes('ROTI') || title.includes('FOOD');
                } else if (jobSectorFilter === 'PERTANIAN') {
                  matchSector = title.includes('PERTANIAN') || title.includes('PETERNAKAN') || title.includes('SAPI') || title.includes('AYAM') || title.includes('TANI') || title.includes('農業') || title.includes('畜産') || title.includes('PERKEBUNAN');
                } else if (jobSectorFilter === 'RESTORAN') {
                  matchSector = title.includes('RESTORAN') || title.includes('HOTEL') || title.includes('PERHOTELAN') || title.includes('PELAYANAN') || title.includes('外食');
                } else if (jobSectorFilter === 'ENGINEERING') {
                  matchSector = title.includes('SEIBI') || title.includes('KIKAI') || title.includes('OTOMOTIF') || title.includes('PENGELASAN') || title.includes('MANUFAKTUR') || title.includes('KONSTRUKSI') || title.includes('TOBI') || title.includes('DOBOKU') || title.includes('ENGINEER') || title.includes('GIJINKOKU') || title.includes('MESIN') || title.includes('PABRIK') || title.includes('TEKNIK');
                } else if (jobSectorFilter === 'Lainnya') {
                  const isKnown =
                    title.includes('KAIGO') || title.includes('CAREGIVER') || title.includes('CARE GIVER') || title.includes('介護') ||
                    title.includes('PENGOLAHAN MAKANAN') || title.includes('MAKANAN') || title.includes('PM') || title.includes('飲食') || title.includes('BENTO') ||
                    title.includes('PERTANIAN') || title.includes('PETERNAKAN') || title.includes('SAPI') || title.includes('AYAM') || title.includes('TANI') || title.includes('農業') || title.includes('畜産') ||
                    title.includes('RESTORAN') || title.includes('HOTEL') || title.includes('外食') ||
                    title.includes('SEIBI') || title.includes('KIKAI') || title.includes('OTOMOTIF') || title.includes('PENGELASAN') || title.includes('MANUFAKTUR') || title.includes('KONSTRUKSI') || title.includes('TOBI') || title.includes('DOBOKU') || title.includes('ENGINEER') || title.includes('MESIN');
                  matchSector = !isKnown;
                }
              }

              let matchCategory = true;
              if (jobCategoryFilter !== 'Semua') {
                const cat = (j.kategoriTarget || '').toUpperCase();
                if (jobCategoryFilter === 'NEW COMER') {
                  matchCategory = cat.includes('NEW COMER') || cat.includes('NON IJEF') || cat.includes('NON-IJEF');
                } else if (jobCategoryFilter === 'EX MAGANG') {
                  matchCategory = cat.includes('EX-MAGANG') || cat.includes('EX MAGANG') || cat.includes('TRAINEE');
                } else if (jobCategoryFilter === 'ENGINEERING') {
                  matchCategory = cat.includes('ENGINEERING') || cat.includes('GIJINKOKU');
                } else {
                  matchCategory = cat.includes(jobCategoryFilter.toUpperCase());
                }
              }

              let matchGender = true;
              if (jobGenderFilter !== 'Semua') {
                const gen = (j.jenisKelamin || '').toUpperCase();
                if (jobGenderFilter === 'PRIA') {
                  matchGender = gen.includes('男') || gen.includes('LAKI') || gen === 'PRIA';
                } else if (jobGenderFilter === 'WANITA') {
                  matchGender = gen.includes('女') || gen.includes('PEREMPUAN') || gen === 'WANITA';
                } else if (jobGenderFilter === 'BEBAS') {
                  matchGender = gen.includes('男女') || gen.includes('BEBAS') || !gen;
                }
              }

              return matchSearch && matchStatus && matchUrgensi && matchDomisili && matchTSK && matchSector && matchCategory && matchGender;
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                  <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">
                    {lang === 'ja' ? '条件に一致する求人案件が見つかりませんでした。' : 'Tidak ada lowongan job yang cocok dengan filter Anda.'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lang === 'ja' ? '検索キーワードを変更するか、下部のフィルタ初期化ボタンを押してください。' : 'Coba ubah kata kunci pencarian atau tekan tombol reset filter di bawah.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetJobFilters}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? '求人カタログフィルタ初期化' : 'Reset Semua Filter Katalog'}</span>
                  </button>
                </div>
              );
            }

            if (jobViewMode === 'table') {
              return (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="p-3">{lang === 'ja' ? '状態' : 'Status'}</th>
                          <th className="p-3">{lang === 'ja' ? '緊急度' : 'Urgensi'}</th>
                          <th className="p-3">{lang === 'ja' ? '居住地区分' : 'Domisili Siswa'}</th>
                          <th className="p-3">{lang === 'ja' ? '求人コード' : 'Kode Job'}</th>
                          <th className="p-3">{lang === 'ja' ? '求人件名（職種）' : 'Judul Pekerjaan (List Job)'}</th>
                          <th className="p-3">{lang === 'ja' ? '勤務地' : 'Daerah'}</th>
                          <th className="p-3">{lang === 'ja' ? '性別要件' : 'Gender'}</th>
                          <th className="p-3">{lang === 'ja' ? '給与' : 'Gaji'}</th>
                          <th className="p-3 text-center">{lang === 'ja' ? '採用枠' : 'Kuota'}</th>
                          <th className="p-3 max-w-xs">{lang === 'ja' ? '応募要件' : 'Kualifikasi'}</th>
                          <th className="p-3">{lang === 'ja' ? '費用' : 'Biaya Proses'}</th>
                          <th className="p-3">{lang === 'ja' ? 'TSK / パートナー' : 'TSK / Sumber'}</th>
                          <th className="p-3">{lang === 'ja' ? '備考' : 'Keterangan'}</th>
                          <th className="p-3 text-center">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filtered.map((job, idx) => {
                          const isClosed = job.statusJob === 'Tutup';
                          const urgensi = (job.urgensiJob || 'STANDART').toUpperCase();
                          const domisili = job.kategoriDomisili || (job.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
                          const isDomestik = domisili === 'Domestik (Jepang)';

                          const rawKode = job.kodeJob || job.id || '';
                          const cleanKodeJob =
                            rawKode && !/^rp\s*/i.test(rawKode) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawKode)
                              ? rawKode
                              : `JOB-${job.id || '001'}`;

                          const rawTsk = job.tskSumberJob || '';
                          const cleanTsk =
                            rawTsk && !/^rp\s*/i.test(rawTsk) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawTsk)
                              ? rawTsk
                              : (lang === 'ja' ? 'IJEF推薦・社内' : 'Internal IJEF');

                          return (
                            <tr
                              key={job.id ? `${job.id}-${idx}` : `job-row-${idx}`}
                              onClick={() => setSelectedDetailJob(job)}
                              className="hover:bg-purple-50/60 transition cursor-pointer group"
                              title={lang === 'ja' ? 'クリックして求人詳細を表示' : 'Klik untuk melihat detail lengkap job'}
                            >
                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isClosed
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isClosed ? (lang === 'ja' ? '締切済' : 'Tutup') : (lang === 'ja' ? '募集中' : 'Aktif')}
                                </span>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                                    urgensi === 'URGENT'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                                      : urgensi === 'SLOW'
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}
                                >
                                  {urgensi === 'URGENT' ? (lang === 'ja' ? '🔥 至急' : '🔥 URGENT') : urgensi === 'SLOW' ? (lang === 'ja' ? '⏳ 余裕あり' : '⏳ SLOW') : (lang === 'ja' ? '⚡ 通常' : '⚡ STANDART')}
                                </span>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isDomestik
                                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {isDomestik ? (lang === 'ja' ? '🇯🇵 日本国内' : 'Domestik (Jepang)') : (lang === 'ja' ? '🇮🇩 インドネシア' : 'Lokal (Indonesia)')}
                                </span>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 group-hover:bg-purple-100 transition">
                                  {cleanKodeJob}
                                </span>
                              </td>

                              <td className="p-3 max-w-xs">
                                <div className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-purple-700 transition">
                                  {getSanitizedJobTitle(job, lang)}
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold">
                                  {translateCandidateCategory(job.kategoriTarget, lang)}
                                </div>
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {formatPrefecture(job.lokasiPrefektur, lang)}
                                </span>
                              </td>

                              <td className="p-3 whitespace-nowrap font-medium text-slate-700">
                                {formatGender(job.jenisKelamin, lang)}
                              </td>

                              <td className="p-3 whitespace-nowrap font-bold text-amber-700">
                                {formatSalary(job, lang)}
                              </td>

                              <td className="p-3 whitespace-nowrap text-center font-extrabold text-emerald-700">
                                {job.kuotaSiswa || 1} {lang === 'ja' ? '名' : 'Org'}
                              </td>

                              <td className="p-3 max-w-xs">
                                <div className="line-clamp-2 text-[11px] text-slate-700 bg-amber-50/60 p-1.5 rounded-lg border border-amber-200/60">
                                  <span className="font-semibold text-amber-900">{lang === 'ja' ? '要件: ' : 'Kualifikasi: '}</span>
                                  {formatQualification(job.kualifikasi || job.persyaratanJLPT, lang)}
                                </div>
                              </td>

                              <td className="p-3 whitespace-nowrap font-semibold text-indigo-700">
                                {translateFeeText(job.biayaProses, lang)}
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {cleanTsk}
                                </span>
                              </td>

                              <td className="p-3 max-w-xs">
                                <div className="line-clamp-1 text-[11px] text-slate-600">
                                  {translateNotesText(job.keteranganTambahan, lang) || '-'}
                                </div>
                              </td>

                              <td className="p-3 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setSelectedDetailJob(job)}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                                    title={lang === 'ja' ? '求人詳細を表示' : 'Detail Lengkap'}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline text-[10px]">{lang === 'ja' ? '閲覧' : 'Detail'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setJobForm(job);
                                      setShowJobModal(true);
                                    }}
                                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                                    title={lang === 'ja' ? '求人を編集' : 'Edit Job'}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline text-[10px]">{lang === 'ja' ? '編集' : 'Edit'}</span>
                                  </button>
                                  <button
                                    onClick={() => setJobToDelete(job)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                                    title={lang === 'ja' ? '求人を削除' : 'Hapus Job Posting'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline text-[10px]">{lang === 'ja' ? '削除' : 'Hapus'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // Grid Cards View
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((job, idx) => {
                  const isClosed = job.statusJob === 'Tutup';
                  const urgensi = (job.urgensiJob || 'STANDART').toUpperCase();
                  const domisili = job.kategoriDomisili || (job.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
                  const isDomestik = domisili === 'Domestik (Jepang)';

                  const rawKode = job.kodeJob || job.id || '';
                  const cleanKodeJob =
                    rawKode && !/^rp\s*/i.test(rawKode) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawKode)
                      ? rawKode
                      : `JOB-${job.id || '001'}`;

                  const rawTsk = job.tskSumberJob || '';
                  const cleanTsk =
                    rawTsk && !/^rp\s*/i.test(rawTsk) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawTsk)
                      ? rawTsk
                      : (lang === 'ja' ? 'IJEF推薦・社内' : 'Internal IJEF');

                  return (
                    <div
                      key={job.id ? `${job.id}-${idx}` : `job-card-${idx}`}
                      onClick={() => setSelectedDetailJob(job)}
                      className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-5 space-y-3.5 shadow-sm hover:shadow-md transition relative cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 group-hover:bg-purple-100 transition">
                            {cleanKodeJob}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isClosed
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isClosed ? (lang === 'ja' ? '締切済' : 'Tutup') : (lang === 'ja' ? '募集中' : 'Aktif')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              urgensi === 'URGENT'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : urgensi === 'SLOW'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {urgensi === 'URGENT' ? (lang === 'ja' ? '🔥 至急' : '🔥 URGENT') : urgensi === 'SLOW' ? (lang === 'ja' ? '⏳ 余裕あり' : '⏳ SLOW') : (lang === 'ja' ? '⚡ 通常' : '⚡ STANDART')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isDomestik
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {isDomestik ? (lang === 'ja' ? '🇯🇵 日本国内' : 'Domestik (Jepang)') : (lang === 'ja' ? '🇮🇩 インドネシア' : 'Lokal (Indonesia)')}
                          </span>
                        </div>

                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {formatPrefecture(job.lokasiPrefektur, lang)}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-purple-700 transition">
                          {getSanitizedJobTitle(job, lang)}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold">{translateCandidateCategory(job.kategoriTarget, lang)}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{lang === 'ja' ? '支援機関 / 提携元: ' : 'TSK / Partner: '}{cleanTsk}</p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ja' ? '給与:' : 'Gaji:'}</span>
                          <strong className="text-amber-700 font-bold">{formatSalary(job, lang)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ja' ? '性別・採用枠:' : 'Gender & Kuota:'}</span>
                          <span className="font-bold text-slate-800">{formatGender(job.jenisKelamin, lang)} • {job.kuotaSiswa || 1} {lang === 'ja' ? '名' : 'Org'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">{lang === 'ja' ? '費用負担:' : 'Biaya Proses:'}</span>
                          <span className="font-semibold text-indigo-700">{translateFeeText(job.biayaProses, lang)}</span>
                        </div>
                      </div>

                      {(job.kualifikasi || job.persyaratanJLPT) && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-200/60 line-clamp-2">
                          <span className="font-semibold text-amber-900">{lang === 'ja' ? '応募要件: ' : 'Kualifikasi: '}</span>
                          {formatQualification(job.kualifikasi || job.persyaratanJLPT, lang)}
                        </div>
                      )}

                      {job.keteranganTambahan && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 line-clamp-2">
                          <span className="font-semibold text-slate-700">{lang === 'ja' ? '備考: ' : 'Keterangan: '}</span>
                          {translateNotesText(job.keteranganTambahan, lang)}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedDetailJob(job)}
                          className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ja' ? '求人詳細' : 'Lihat Detail'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setJobForm(job);
                            setShowJobModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ja' ? '編集' : 'Edit'}</span>
                        </button>

                        <button
                          onClick={() => setJobToDelete(job)}
                          className="text-rose-600 hover:text-rose-800 font-bold flex items-center space-x-1 cursor-pointer"
                          title={lang === 'ja' ? '求人を削除' : 'Hapus Job Posting'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ja' ? '削除' : 'Hapus'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: SELECTION INTERVIEW MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {/* Interview Metrics Summary Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2.5 bg-purple-100 border border-purple-200 text-purple-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'ja' ? '選考総数' : 'Total Seleksi'}</p>
                <p className="text-xl font-black text-slate-900">{jobApplications.length} <span className="text-xs font-normal text-slate-500">{lang === 'ja' ? '名' : 'Kandidat'}</span></p>
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{lang === 'ja' ? '内定合格 (Naitei)' : 'Lolos (Naitei)'}</p>
                <p className="text-xl font-black text-emerald-800">
                  {jobApplications.filter((a) => (a.statusLamaran || '').includes('Lolos') || (a.statusLamaran || '').includes('Naitei')).length} <span className="text-xs font-normal text-slate-500">{lang === 'ja' ? '名' : 'Orang'}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-purple-200 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2.5 bg-purple-100 border border-purple-200 text-purple-700 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">{lang === 'ja' ? '面接日程確定' : 'Terjadwal Interview'}</p>
                <p className="text-xl font-black text-purple-900">
                  {jobApplications.filter((a) => (a.statusLamaran || '').includes('Terjadwal')).length} <span className="text-xs font-normal text-slate-500">{lang === 'ja' ? '名' : 'Orang'}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-indigo-200 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2.5 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">{lang === 'ja' ? '在留・VISA申請中' : 'Proses Visa / COE'}</p>
                <p className="text-xl font-black text-indigo-900">
                  {jobApplications.filter((a) => (a.statusLamaran || '').includes('Visa') || (a.statusLamaran || '').includes('COE')).length} <span className="text-xs font-normal text-slate-500">{lang === 'ja' ? '名' : 'Orang'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Main Interview Table Box */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Action Bar Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'ja' ? '選考管理＆面接日程モニタリング（対面・オンライン）' : 'Monitoring Seleksi & Jadwal Interview Candidate (Online & Offline)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ja' ? '面接日時、Zoom/会議リンク、選考合否ステータスを一元管理します。' : 'Kelola tanggal, waktu, lokasi/link meeting, serta status kelulusan kandidat.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNewInterview}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center space-x-1.5 cursor-pointer self-start md:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ja' ? '+ 新規面接日程を設定' : '+ Jadwalkan Interview Baru'}</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {[
                  { label: lang === 'ja' ? '全ステータス' : 'Semua Status', val: 'Semua' },
                  { label: lang === 'ja' ? '内定合格 (Naitei)' : 'Lolos Interview (Naitei)', val: 'Lolos Interview (Naitei)' },
                  { label: lang === 'ja' ? '面接確定済' : 'Terjadwal Interview', val: 'Terjadwal Interview' },
                  { label: lang === 'ja' ? '書類選考中' : 'Seleksi Berkas', val: 'Seleksi Berkas Rirekisho' },
                  { label: lang === 'ja' ? '在留/VISA手続中' : 'Proses Visa / COE', val: 'Proses Visa / COE' }
                ].map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setAppStatusFilter(f.val)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                      appStatusFilter === f.val
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  placeholder={lang === 'ja' ? '候補者・ポジションで検索...' : 'Cari kandidat / posisi...'}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{lang === 'ja' ? '候補者＆連絡先' : 'Kandidat & Kontak'}</th>
                    <th className="p-3.5">{lang === 'ja' ? '求人職種＆受入企業' : 'Posisi & Perusahaan'}</th>
                    <th className="p-3.5">{lang === 'ja' ? '面接方法＆場所' : 'Metode & Lokasi'}</th>
                    <th className="p-3.5">{lang === 'ja' ? '日程＆時刻' : 'Jadwal & Waktu'}</th>
                    <th className="p-3.5">{lang === 'ja' ? '選考状況' : 'Status Seleksi'}</th>
                    <th className="p-3.5 text-right">{lang === 'ja' ? '操作' : 'Aksi Admin'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 italic">
                        {lang === 'ja' ? '条件に一致する面接選考データはありません。' : 'Tidak ada data interview yang sesuai dengan filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app, idx) => {
                      const statusLamStr = app.statusLamaran || '';
                      const isLolos = statusLamStr.includes('Lolos') || statusLamStr.includes('Naitei');
                      const isTerjadwal = statusLamStr.includes('Terjadwal');
                      const isVisa = statusLamStr.includes('Visa') || statusLamStr.includes('COE');
                      const isOffline = app.metodeInterview === 'OFFLINE';

                      // Find matching candidate CV if available
                      const matchingCV = rirekishoList.find(
                        (c) => c.siswaId === app.siswaId || c.id === app.siswaId || c.email === app.emailSiswa
                      );

                      return (
                        <tr key={app.id ? `${app.id}-${idx}` : `app-row-${idx}`} className="hover:bg-purple-50/50 transition odd:bg-white even:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <User className="w-3.5 h-3.5 text-purple-600" />
                              <span>{app.namaSiswa}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {app.emailSiswa}
                            </div>
                            <span className="inline-block mt-1 bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9px] font-semibold">
                              {translateCandidateCategory(app.kategoriKandidat, lang)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{getSanitizedJobTitle({ judulPekerjaan: app.jobJudul } as any, lang)}</div>
                            <div className="text-[11px] text-purple-700 flex items-center space-x-1 mt-0.5 font-medium">
                              <Building2 className="w-3 h-3 text-purple-600" />
                              <span>{getSanitizedCompany({ perusahaanJepang: app.perusahaanJepang } as any, lang)}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isOffline ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  <Building2 className="w-3 h-3" />
                                  <span>{lang === 'ja' ? '対面面接 (Offline)' : 'OFFLINE (Tatap Muka)'}</span>
                                </span>
                                {app.lokasiInterview && (
                                  <div className="text-[11px] text-slate-600 font-medium line-clamp-2 max-w-xs flex items-start space-x-1">
                                    <MapPin className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                                    <span>{app.lokasiInterview}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                  <Video className="w-3 h-3" />
                                  <span>{lang === 'ja' ? 'オンライン面接 (Zoom/Meet)' : 'ONLINE (Zoom/Meet)'}</span>
                                </span>
                                {(app.linkInterviewZoom || app.lokasiInterview) && (
                                  <a
                                    href={app.lokasiInterview || app.linkInterviewZoom}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-sky-700 hover:underline font-mono block line-clamp-1 max-w-xs"
                                  >
                                    {app.lokasiInterview || app.linkInterviewZoom}
                                  </a>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            {app.jadwalInterview ? (
                              <div className="space-y-0.5">
                                <div className="text-purple-800 font-bold text-xs flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                  <span>{app.jadwalInterview}</span>
                                </div>
                                {app.tanggalInterview && app.waktuInterview && (
                                  <div className="text-[10px] text-slate-500">
                                    {lang === 'ja' ? `日程: ${app.tanggalInterview} • 時間: ${app.waktuInterview} (WIB)` : `Tanggal: ${app.tanggalInterview} • Jam: ${app.waktuInterview} WIB`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">{lang === 'ja' ? '未設定' : 'Belum Diatur'}</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {isLolos ? (
                              <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-black tracking-wide shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'ja' ? '内定合格 (Naitei)' : 'Lolos Interview (Naitei)'}</span>
                              </span>
                            ) : isTerjadwal ? (
                              <span className="inline-flex items-center space-x-1 bg-purple-50 text-purple-800 border border-purple-300 px-3 py-1 rounded-full text-[10px] font-bold">
                                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                <span>{lang === 'ja' ? '面接確定済' : 'Terjadwal Interview'}</span>
                              </span>
                            ) : isVisa ? (
                              <span className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-800 border border-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold">
                                <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>{lang === 'ja' ? 'VISA / COE申請手続中' : 'Proses Visa / COE'}</span>
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-full text-[10px] font-semibold">
                                {translateProgressStatus(app.statusLamaran, lang)}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right space-x-2">
                            {matchingCV && (
                              <button
                                type="button"
                                onClick={() => setSelectedCVForJis(matchingCV)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center space-x-1 border border-slate-200"
                                title={lang === 'ja' ? '候補者の履歴書を表示' : 'Lihat CV Bahasa Jepang Siswa'}
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'ja' ? '履歴書' : 'CV'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditAppModal(app)}
                              className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-sm inline-flex items-center space-x-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>{lang === 'ja' ? '日程設定' : 'Set Jadwal'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ADMIN SETTINGS & SYSTEM MONITORING */}
      {activeTab === 'settings' && (
        <div className="space-y-6 w-full max-w-full font-sans">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '管理者システム認可・統括コントロールセンター' : 'PUSAT OTORISASI & KONTROL SISTEM ADMIN'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>{lang === 'ja' ? '管理者設定＆システム構成' : 'Setting Admin & Pengaturan Aplikasi'}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
                {lang === 'ja'
                  ? '管理者アカウントの認可、権限ロールとアクセス権の管理、Firebase自動同期および履歴書翻訳の設定を行います。'
                  : 'Kelola otorisasi akun administrator, atur peran (role) dan hak akses, serta konfigurasi otomatisasi sinkronisasi Firebase & penerjemahan CV.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddAccountModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-purple-600/20 transition flex items-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ja' ? '新規管理者アカウント追加' : 'Tambah Akun Admin Baru'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveSystemConfig}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ja' ? 'システム構成を保存' : 'Simpan Konfigurasi'}</span>
              </button>
            </div>
          </div>

          {/* SINKRONISASI PARAMETER PEMBIAYAAN & DANA TALANG (ADMIN 2) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-amber-600" />
                  <span>
                    {lang === 'ja'
                      ? '教育費用パラメータ＆渡航つなぎ融資（学生管理・書類管理ポータル同期）'
                      : 'Parameter Pembiayaan & Program Dana Talang (Tersinkronisasi Admin Siswa & Admin Doc)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ja'
                    ? '基本研修費、頭金（DP）スキーム、事務手数料率、および各ポータルで共通適用される分割返済期間（テナー）を設定します。'
                    : 'Atur biaya standar pelatihan, skema DP, persentase biaya administrasi, serta tenor angsuran yang berlaku secara global di seluruh portal admin & portal siswa.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveFinancingSettingsInAdmin2}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ja' ? '費用パラメータを保存' : 'Simpan Parameter Pembiayaan'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Base Cost Input */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800">
                  {lang === 'ja' ? 'LPK標準研修プログラム費 (Base Program Cost)' : 'Biaya Standar Pelatihan LPK (Base Program Cost)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={baseCostSetting}
                    onChange={(e) => setBaseCostSetting(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {lang === 'ja' ? '金額表記: ' : 'Terbaca: '}
                  <strong className="text-amber-800">{formatRupiah(baseCostSetting)}</strong>
                </span>
              </div>

              {/* Admin Fee Input */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800">
                  {lang === 'ja' ? 'つなぎ融資事務管理手数料率 (%)' : 'Biaya Administrasi Dana Talang (%)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={adminFeeSetting}
                    onChange={(e) => setAdminFeeSetting(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 font-bold text-slate-400">%</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {lang === 'ja' ? 'つなぎ融資借入限度額に対して適用' : 'Dikenakan pada plafond pinjaman Dana Talang'}
                </span>
              </div>

              {/* DP Percentage Settings */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800">
                  {lang === 'ja' ? '頭金（DP）スキーム設定 (%)' : 'Skema DP (%)'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ja' ? '全額融資 100%' : 'DT 100%'}</span>
                    <input
                      type="number"
                      value={dt100DpSetting}
                      onChange={(e) => setDt100DpSetting(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ja' ? '融資 50%' : 'DT 50%'}</span>
                    <input
                      type="number"
                      value={dt50DpSetting}
                      onChange={(e) => setDt50DpSetting(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block">{lang === 'ja' ? '頭金 30%' : 'DP 30%'}</span>
                    <input
                      type="number"
                      value={dp30DpSetting}
                      onChange={(e) => setDp30DpSetting(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tenor Options Pills */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
              <label className="block font-bold text-slate-800">
                {lang === 'ja' ? '利用可能な分割返済期間（クリックで有効/無効切り替え）' : 'Opsi Tenor Angsuran Tersedia (Klik untuk Aktifkan/Sembunyikan)'}
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 6, 12, 18, 24, 36].map((m) => {
                  const isActive = tenorsSetting.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        if (isActive) {
                          setTenorsSetting(prev => prev.filter(t => t !== m));
                        } else {
                          setTenorsSetting(prev => [...prev, m].sort((a, b) => a - b));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition text-xs flex items-center space-x-1 cursor-pointer ${
                        isActive
                          ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-600' : 'bg-slate-300'}`} />
                      <span>{m} {lang === 'ja' ? 'ヶ月' : 'Bulan'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid Layout: Account Monitoring & Roles (Left/Main), System Controls (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Monitoring & Role Management Table (2 cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                    <span>{lang === 'ja' ? '管理者アカウント監視＆ロール認可' : 'Monitoring Akun Admin & Otorisasi Role'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'ja'
                      ? '管理者認可、ポータルアクセス権、およびスーパー管理者の特別権限を管理します'
                      : 'Kelola otorisasi admin, hak akses portal, dan wewenang khusus Super Admin'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('accounts')}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                    title={lang === 'ja' ? 'ロール＆権限管理の完全なモジュールを開く' : 'Buka Halaman Lengkap Manajemen Role & Hak Akses'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span className="hidden sm:inline">{lang === 'ja' ? 'ロール完全モジュール' : 'Modul Lengkap Role'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAccountModal(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md shadow-purple-600/20 transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ja' ? '管理者追加' : 'Tambah Admin'}</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search for Admin Users */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '管理者名、メール、部署を検索...' : 'Cari nama admin, email, atau divisi...'}
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                  <select
                    value={adminRoleFilter}
                    onChange={(e) => setAdminRoleFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? 'すべてのロール' : 'Semua Role'}</option>
                    <option value="SuperAdmin">👑 {lang === 'ja' ? 'スーパー管理者' : 'Super Admin'}</option>
                    <option value="Admin Matching">{lang === 'ja' ? 'マッチング担当' : 'Admin Matching'}</option>
                    <option value="Evaluator & Verifikator">{lang === 'ja' ? '書類審査・評価担当' : 'Evaluator & Verifikator'}</option>
                    <option value="HR Legal">{lang === 'ja' ? '人事・法務' : 'HR Legal'}</option>
                    <option value="Dokter">{lang === 'ja' ? '医師・医療班' : 'Dokter / Tim Medis'}</option>
                    <option value="Finance">{lang === 'ja' ? '財務・融資担当' : 'Finance / Dana Talang'}</option>
                    <option value="Viewer / Foreign Partner">{lang === 'ja' ? '閲覧・監理団体パートナー' : 'Viewer / Partner'}</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                      <th className="p-3 pl-4">{lang === 'ja' ? '管理者情報' : 'Administrator'}</th>
                      <th className="p-3">{lang === 'ja' ? 'ロール＆所属部署' : 'Role & Departemen'}</th>
                      <th className="p-3">{lang === 'ja' ? 'ポータルアクセス権' : 'Hak Akses Portal'}</th>
                      <th className="p-3">{lang === 'ja' ? '認可ステータス' : 'Status Otorisasi'}</th>
                      <th className="p-3 text-center pr-4">{lang === 'ja' ? '操作' : 'Aksi Kelola'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {adminAccounts
                      .filter((acc) => {
                        const q = adminSearchTerm.toLowerCase();
                        const matchesSearch =
                          !q ||
                          (acc.name && acc.name.toLowerCase().includes(q)) ||
                          (acc.email && acc.email.toLowerCase().includes(q)) ||
                          (acc.department && acc.department.toLowerCase().includes(q)) ||
                          (acc.role && acc.role.toLowerCase().includes(q));

                        const isSuper = acc.isSuperAdmin || acc.role === 'SuperAdmin' || acc.role === 'Super Admin' || acc.portalAccess === 'ALL_PORTALS';
                        const matchesRole =
                          adminRoleFilter === 'Semua' ||
                          (adminRoleFilter === 'SuperAdmin' && isSuper) ||
                          acc.role === adminRoleFilter;

                        return matchesSearch && matchesRole;
                      })
                      .map((acc) => {
                        const isSuper = acc.isSuperAdmin || acc.role === 'SuperAdmin' || acc.role === 'Super Admin' || acc.portalAccess === 'ALL_PORTALS';
                        const isAktif = acc.status === 'AKTIF' || acc.status === 'Aktif';
                        const isAllPortals = acc.portalAccess === 'ALL_PORTALS' || isSuper;

                        return (
                          <tr
                            key={acc.id}
                            className={`transition ${isSuper ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-purple-50/40'}`}
                          >
                            <td className="p-3 pl-4">
                              <div className="font-bold text-slate-900 flex items-center space-x-2.5">
                                <div
                                  className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                                    isSuper
                                      ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 border border-amber-300 shadow-sm'
                                      : 'bg-purple-100 border border-purple-300 text-purple-800'
                                  }`}
                                >
                                  {isSuper ? <Crown className="w-4 h-4 text-slate-950" /> : acc.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                    <span>{acc.name}</span>
                                    {isSuper && (
                                      <span className="bg-amber-500/20 text-amber-900 border border-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded-full flex items-center space-x-0.5">
                                        <Crown className="w-2.5 h-2.5 text-amber-700" />
                                        <span>SUPER ADMIN</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">{acc.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-purple-900 flex items-center space-x-1">
                                <span>{acc.role}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">{acc.department || (lang === 'ja' ? 'IJEF本部統括部門' : 'Divisi LPK Central')}</div>
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border inline-flex items-center space-x-1 ${
                                  isAllPortals
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : acc.portalAccess === 'ADMIN_1_IJEF'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : acc.portalAccess === 'MITRA_PORTAL'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                                    : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}
                              >
                                <span>
                                  {isAllPortals
                                    ? (lang === 'ja' ? '👑 全ポータル（無制限）' : '👑 SEMUA PORTAL (Universal)')
                                    : acc.portalAccess === 'ADMIN_1_IJEF'
                                    ? (lang === 'ja' ? '🏛️ 学生管理 (SIM-SB)' : '🏛️ Admin Siswa (SIM-SB)')
                                    : acc.portalAccess === 'MITRA_PORTAL'
                                    ? (lang === 'ja' ? '🤝 送出機関連携ポータル' : '🤝 Portal Mitra LPK')
                                    : (lang === 'ja' ? '⚡ 書類・求人管理 (CV)' : '⚡ Admin Doc (CV-Portal)')}
                                </span>
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isSuper
                                  ? (lang === 'ja' ? '全認可バイパス権限' : 'Bypass Otorisasi Penuh')
                                  : (lang === 'ja' ? `${(acc.permissions || []).length || 2} 件の権限` : `${(acc.permissions || []).length || 2} Hak Akses`)}
                              </div>
                            </td>

                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => handleToggleAccountStatus(acc.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center space-x-1 cursor-pointer transition ${
                                  isAktif
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{isAktif ? (lang === 'ja' ? '有効' : 'AKTIF') : (lang === 'ja' ? '無効' : 'NONAKTIF')}</span>
                              </button>
                            </td>

                            <td className="p-3 pr-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAdmin(acc)}
                                  className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                                  title={lang === 'ja' ? 'アカウント＆ロール認可を編集' : 'Edit Akun Admin & Otorisasi Role'}
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAppointSuperAdmin(acc)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    isSuper
                                      ? 'text-amber-700 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200'
                                      : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={
                                    isSuper
                                      ? (lang === 'ja' ? 'スーパー管理者権限を解除' : 'Copot Status Super Admin')
                                      : (lang === 'ja' ? 'スーパー管理者に任命（全ポータルアクセス）' : 'Jadikan Super Admin (Akses Universal)')
                                  }
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdminAccount(acc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title={lang === 'ja' ? '管理者アカウントを削除' : 'Hapus Akun Admin'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Role Matrix Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'ja' ? '管理者ロール別アクセス権限概要' : 'Ringkasan Hak Akses & Wewenang Per Role Admin'}</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-300 col-span-1 sm:col-span-2">
                    <strong className="text-amber-900 font-black flex items-center space-x-1">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === 'ja' ? '👑 スーパー管理者 (全ポータル無制限アクセス):' : '👑 Super Admin (Akses Universal Semua Portal):'}</span>
                    </strong>
                    <span className="text-slate-700 mt-0.5 block">
                      {lang === 'ja'
                        ? '全ポータル（学生管理、書類管理、マーケティング、パートナー機関連携、学生専用ポータル）への自由移動、アカウント編集、ロール認可、Cloud Firestore同期、ルーティング制限のバイパス権限を持ちます。'
                        : 'Dapat mengakses & berpindah ke seluruh portal (Admin Siswa, Admin Doc, Portal Marketing, Mitra LPK, Siswa), mengedit semua akun, otorisasi role, sync Cloud Firestore, dan bypass seluruh batasan routing.'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block font-bold">{lang === 'ja' ? 'マッチング担当 (Admin Matching):' : 'Admin Matching:'}</strong>
                    {lang === 'ja' ? '求人管理、面接日程調整、候補者データ編集、日本語履歴書翻訳。' : 'Kelola Job Postings, atur jadwal interview, edit data kandidat & terjemahan CV.'}
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block font-bold">{lang === 'ja' ? '書類審査・評価担当 (Evaluator & Verifikator):' : 'Evaluator & Verifikator:'}</strong>
                    {lang === 'ja' ? '学生書類の審査、日本語力チェック、資格証明書の確認。' : 'Review kelengkapan berkas siswa, verifikasi Nihongo check & ekstraksi sertifikat.'}
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block font-bold">{lang === 'ja' ? '人事法務・契約担当 (HR Legal & Kontrak):' : 'HR Legal & Kontrak:'}</strong>
                    {lang === 'ja' ? '契約書発行、就労保証条項の確認、保証人の法的確認。' : 'Penerbitan surat perjanjian, klausul jaminan kerja, dan legalitas penjamin.'}
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-purple-900 block font-bold">{lang === 'ja' ? '閲覧・監理団体パートナー (Viewer / Partner Kumiai):' : 'Viewer / Partner Kumiai:'}</strong>
                    {lang === 'ja' ? '認証済みの候補者データの閲覧のみ可能（閲覧専用）。' : 'Hanya dapat melihat data kandidat yang telah diverifikasi (Read-Only).'}
                  </div>
                </div>
              </div>
            </div>

            {/* System Settings & Toggles (1 col) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ja' ? 'システム設定＆自動同期' : 'Pengaturan Sistem & Auto-Sync'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ja' ? 'ポータルおよびバックオフィスアプリの自動化設定' : 'Konfigurasi otomatisasi portal & aplikasi admin'}
                </p>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4">
                {/* Auto Sync Firebase */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-900 block">Firebase Cloud Auto-Sync</span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'ja' ? '進行状況の変更をCloud Firestoreに自動同期' : 'Otomatis sinkronkan perubahan progres ke Cloud Firestore'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemConfig(prev => ({ ...prev, autoSyncFirebase: !prev.autoSyncFirebase }))}
                    className={`text-2xl cursor-pointer transition ${systemConfig.autoSyncFirebase ? 'text-emerald-600' : 'text-slate-300'}`}
                  >
                    {systemConfig.autoSyncFirebase ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                {/* Realtime Notification */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-900 block">
                      {lang === 'ja' ? 'メール＆面接通知' : 'Notifikasi Email & Interview'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'ja' ? '面接日程確定時に自動アラートを送信' : 'Kirim peringatan otomatis saat jadwal interview ditetapkan'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemConfig(prev => ({ ...prev, realtimeNotification: !prev.realtimeNotification }))}
                    className={`text-2xl cursor-pointer transition ${systemConfig.realtimeNotification ? 'text-emerald-600' : 'text-slate-300'}`}
                  >
                    {systemConfig.realtimeNotification ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                {/* Format Auto-Translate JIS */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-900 block">
                      {lang === 'ja' ? 'JIS規格自動翻訳 (和暦・カタカナ標準)' : 'Standar Terjemahan JIS (EYD)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'ja' ? 'カタカナ表記標準および和暦（令和）を使用' : 'Gunakan standar Katakana & kalender Jepang (Reiwa)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemConfig(prev => ({ ...prev, autoTranslateJIS: !prev.autoTranslateJIS }))}
                    className={`text-2xl cursor-pointer transition ${systemConfig.autoTranslateJIS ? 'text-emerald-600' : 'text-slate-300'}`}
                  >
                    {systemConfig.autoTranslateJIS ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>

                {/* Mode Maintenance */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-amber-900 block">
                      {lang === 'ja' ? 'システムメンテナンスモード' : 'Mode Pemeliharaan Sistem'}
                    </span>
                    <span className="text-[10px] text-amber-700">
                      {lang === 'ja' ? '一括更新時に一般ユーザーのアクセスを一時ロック' : 'Kunci akses non-admin saat pembaruan data massal'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSystemConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                    className={`text-2xl cursor-pointer transition ${systemConfig.maintenanceMode ? 'text-amber-600' : 'text-slate-300'}`}
                  >
                    {systemConfig.maintenanceMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                </div>
              </div>

              {/* Server Status & Cloud Status */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs border border-slate-800">
                <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <Server className="w-4 h-4" />
                    <span>{lang === 'ja' ? 'クラウドサーバー正常稼働中' : 'Cloud Server Operational'}</span>
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                    ONLINE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
                  <div>Supabase DB: Connected ({rirekishoList.length} {lang === 'ja' ? '名の生徒データ同期済' : 'data siswa sinkron'})</div>
                  <div>Translate Engine: GenAI JP-EYD v2.4 Active</div>
                  <div>System Latency: 42ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* SINKRONISASI PENGATURAN DAFTAR AKUN SISWA (ADMIN 2) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  <span>
                    {lang === 'ja'
                      ? '学生アカウント・ポータルアクセス権限設定 (学生管理・書類管理同期)'
                      : 'Pengaturan Daftar Akun Siswa & Akses Portal (Tersinkron Admin Siswa & Admin Doc)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ja'
                    ? '学生/候補者のログインアカウント管理、登録ステータス検証、パスワードリセット、および新規受講生の追加を行います。'
                    : 'Kelola akun login siswa/kandidat, verifikasi status pendaftaran, reset kata sandi, dan tambah peserta baru secara terpusat.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddStudentInAdmin2}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'ja' ? '新規学生アカウント追加' : 'Tambah Akun Siswa Baru'}</span>
              </button>
            </div>

            {/* Filter & Action Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-1 items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '氏名、NIK、メール、電話番号で検索...' : 'Cari nama, NIK, email, atau no. HP siswa...'}
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                  <select
                    value={studentStatusFilter}
                    onChange={(e) => setStudentStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer"
                  >
                    <option value="Semua">{lang === 'ja' ? 'すべてのステータス' : 'Semua Status'}</option>
                    <option value="Draft">{lang === 'ja' ? '下書き (Draft)' : 'Draft'}</option>
                    <option value="Terdaftar">{lang === 'ja' ? '登録済み' : 'Terdaftar'}</option>
                    <option value="Terverifikasi">{lang === 'ja' ? '書類検証済み' : 'Terverifikasi'}</option>
                    <option value="Diterima">{lang === 'ja' ? '合格・採用' : 'Diterima (LULUS)'}</option>
                    <option value="Ditolak">{lang === 'ja' ? '不採用・却下' : 'Ditolak'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Student Accounts Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4">{lang === 'ja' ? '学生 / 候補者' : 'Siswa / Peserta'}</th>
                    <th className="p-3">{lang === 'ja' ? '連絡先 / ログイン' : 'Kontak Login'}</th>
                    <th className="p-3">{lang === 'ja' ? '希望プログラム' : 'Program Minat'}</th>
                    <th className="p-3">{lang === 'ja' ? '登録ステータス' : 'Status Registrasi'}</th>
                    <th className="p-3">{lang === 'ja' ? '登録日' : 'Tgl Daftar'}</th>
                    <th className="p-3 text-center pr-4">{lang === 'ja' ? '管理操作' : 'Aksi Management'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredStudentsInAdmin2.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {lang === 'ja' ? '検索条件に一致する学生アカウントが見つかりません。' : 'Tidak ada data akun siswa yang cocok dengan kriteria pencarian.'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudentsInAdmin2.map((stu, idx) => {
                      const isAccepted = stu.statusPendaftaran === 'Diterima';
                      const isVerified = stu.statusPendaftaran === 'Terverifikasi';
                      const isRejected = stu.statusPendaftaran === 'Ditolak';

                      return (
                        <tr key={stu.id ? `${stu.id}-${idx}` : `stu-adm2-${idx}`} className="hover:bg-slate-50 transition">
                          <td className="p-3 pl-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-300 shrink-0">
                                {stu.namaLengkap ? stu.namaLengkap.substring(0, 2).toUpperCase() : 'SW'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                                  <span>{stu.namaLengkap}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  NIK: {stu.noKtp || '-'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-800 text-xs flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{stu.email}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{stu.noHp || '-'}</span>
                            </div>
                          </td>

                          <td className="p-3 font-semibold text-slate-800 text-xs">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-bold">
                              {translateCandidateCategory(stu.kategoriKandidat || 'SSW Japan', lang)}
                            </span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center w-fit space-x-1 ${
                                isAccepted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isVerified
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAccepted
                                    ? 'bg-emerald-500'
                                    : isVerified
                                    ? 'bg-blue-500'
                                    : isRejected
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span>
                                {isAccepted
                                  ? (lang === 'ja' ? '合格' : 'Diterima')
                                  : isVerified
                                  ? (lang === 'ja' ? '認証済' : 'Terverifikasi')
                                  : isRejected
                                  ? (lang === 'ja' ? '却下' : 'Ditolak')
                                  : (lang === 'ja' ? (stu.statusPendaftaran === 'Draft' ? '下書き' : '登録済') : stu.statusPendaftaran)}
                              </span>
                            </span>
                          </td>

                          <td className="p-3 text-[10px] font-mono text-slate-500">
                            {stu.createdAt || (lang === 'ja' ? '新規' : 'Baru')}
                          </td>

                          <td className="p-3 pr-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setViewingStudentInAdmin2(stu)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title={lang === 'ja' ? '学生詳細プロファイルを見る' : 'Lihat Detail Profil Siswa'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudentInAdmin2(stu)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                title={lang === 'ja' ? '学生アカウントを編集' : 'Edit Profil / Akun Siswa'}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowResetStudentPassModalInAdmin2(stu);
                                  setStudentNewPass('siswa2026!');
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title={lang === 'ja' ? 'パスワードをリセット' : 'Reset Kata Sandi Siswa'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudentAccountInAdmin2(stu.id, stu.namaLengkap)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={lang === 'ja' ? '学生アカウントを削除' : 'Hapus Akun Siswa'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend & Sync Notice */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'ja' ? (
                    <>
                      すべての学生アカウントおよび変更履歴はリアルタイムで Firestore コレクション <code className="font-mono font-bold text-emerald-950">calon_siswa</code> に自動同期され、学生管理・書類管理・学生ポータル間で完全連動しています。
                    </>
                  ) : (
                    <>
                      Seluruh akun siswa dan perubahan data langsung tersinkron secara real-time ke Firestore Collection <code className="font-mono font-bold text-emerald-950">calon_siswa</code> dan terhubung penuh antara Admin Siswa, Admin Doc, dan Portal Siswa.
                    </>
                  )}
                </span>
              </div>
              <span className="font-mono font-bold text-[10px] text-emerald-700 shrink-0 ml-2">
                {lang === 'ja' ? '合計' : 'Total'} {filteredStudentsInAdmin2.length} / {students.length} {lang === 'ja' ? '名' : 'Siswa'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PEMBIAYAAN KEBERANGKATAN & DANA TALANG 100% (ADMIN 2) */}
      {activeTab === 'dana' && (
        <div className="w-full max-w-full font-sans">
          <BiayaKeberangkatanView />
        </div>
      )}

      {/* TAB 6: SURAT PERJANJIAN & KONTRAK LEGAL LPK (ADMIN 2) */}
      {activeTab === 'kontrak' && (
        <div className="space-y-6 w-full max-w-full font-sans">
          {/* Top Header Selector Card for Admin 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center border border-purple-300 shrink-0">
                <FileText className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {lang === 'ja' ? '6. LPK法的契約書＆就労合意書モジュール' : '6. Modul Surat Perjanjian & Kontrak Legalitas LPK'}
                  </h2>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-300 font-mono">
                    {lang === 'ja' ? '学生管理＆書類管理同期' : 'Tersinkron Admin Siswa & Admin Doc'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {lang === 'ja'
                    ? 'マッチング保証条項の設定、保証人署名、およびLPK IJEF CORP公式契約書面の発行・印刷。'
                    : 'Pembuatan, penetapan pasal garansi job matching, penandatanganan penjamin, dan cetak dokumen resmi LPK IJEF CORP.'}
                </p>
              </div>
            </div>

            {/* Student Selector Bar for Admin 2 */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center space-x-3 w-full md:w-auto shrink-0">
              <div className="flex items-center space-x-2 text-xs text-slate-700 font-bold shrink-0">
                <UserCheck className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ja' ? '学生 / 候補者を選択:' : 'Pilih Siswa / Kandidat:'}</span>
              </div>
              <select
                value={selectedStudentId || (students[0]?.id || '')}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600 cursor-pointer flex-1 md:w-64"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaLengkap} — NIK: {s.noKtp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Surat Perjanjian */}
          <SuratPerjanjianForm />
        </div>
      )}

      {/* TAB DAFTAR MITRA TERDAFTAR (ADMIN 2) */}
      {activeTab === 'mitra-terdaftar' && (
        <div className="w-full max-w-full font-sans">
          <Admin2RegisteredMitraView onNavigateToApproval={() => setActiveTab('mitra-approval')} />
        </div>
      )}

      {/* TAB APPROVAL PENGAJUAN MITRA (ADMIN 2) */}
      {activeTab === 'mitra-approval' && (
        <div className="w-full max-w-full font-sans">
          <Admin2MitraApprovalView />
        </div>
      )}

      {/* TAB 8: MANAJEMEN AKUN, SUPER ADMIN & OTORISASI ROLE (ADMIN 2) */}
      {activeTab === 'accounts' && (
        <div className="w-full max-w-full font-sans">
          <Admin2AccountRoleManagement />
        </div>
      )}

      {/* TAB 7: PETUNJUK PENGGUNAAN & HIRARKI APLIKASI */}
      {activeTab === 'petunjuk' && (
        <div className="w-full max-w-full font-sans">
          <PetunjukPenggunaanView />
        </div>
      )}

      {/* ADD NEW ADMIN ACCOUNT MODAL */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 font-sans text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'ja' ? '新規管理者アカウント追加' : 'Tambah Akun Admin Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ja' ? '管理者の権限およびアクセス範囲を付与' : 'Berikan akses otorisasi administrator'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '管理者氏名' : 'Nama Lengkap Administrator'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ja' ? '例: 山田 太郎' : 'Contoh: Budi Santoso, S.Kom'}
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '公式管理用メールアドレス' : 'Email Resmi Admin'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@ijef.or.id"
                  value={newAccountForm.email}
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '付与ロール（役割）' : 'Role Otorisasi'}
                </label>
                <select
                  value={newAccountForm.role}
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                >
                  <option value="Super Admin">{lang === 'ja' ? 'スーパー管理者 (全権限)' : 'Super Admin (Akses Penuh)'}</option>
                  <option value="Admin Matching">{lang === 'ja' ? '求人・面接マッチング管理者' : 'Admin Matching Japan (Job & Interview)'}</option>
                  <option value="Evaluator & Verifikator">{lang === 'ja' ? '書類審査・評価担当者' : 'Evaluator & Verifikator LPK (Verifikasi Berkas)'}</option>
                  <option value="Viewer / Foreign Partner">{lang === 'ja' ? '閲覧専用パートナー（監理団体等）' : 'Viewer / Foreign Partner (Read-Only)'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '所属部門 / 部署' : 'Departemen / Divisi'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '日本配置事業部 (特定技能/実習)' : 'Divisi Penempatan Jepang (TSK/SSW)'}
                  value={newAccountForm.department}
                  onChange={(e) => setNewAccountForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer shadow-md shadow-purple-600/20"
                >
                  {lang === 'ja' ? 'アカウント保存' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE EDIT MODAL (Request 2 & Request 3) */}
      {editingCandidate && (
        <CandidateEditModal
          candidate={editingCandidate}
          initialTab={editModalTab}
          onClose={() => {
            setEditingCandidate(null);
            setEditModalTab('data');
          }}
          onSave={handleSaveCandidateFromModal}
        />
      )}

      {/* JAPANESE CV JIS PREVIEW MODAL (Request 3 - "Lihat CV Siswa" White CV Sheet) */}
      {selectedCVForJis && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto p-4 sm:p-6 space-y-4 text-slate-800 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ja' ? '日本JIS規格履歴書プレビュー:' : 'Pratinjau CV Bahasa Jepang (JIS Standard Rirekisho):'} {selectedCVForJis.namaLengkap}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{lang === 'ja' ? '印刷 (A4)' : 'Cetak CV (A4)'}</span>
                </button>
                <button
                  onClick={() => setSelectedCVForJis(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Render Japanese White CV Sheet */}
            <div className="bg-slate-50 p-2 sm:p-4 rounded-xl border border-slate-200 overflow-x-auto print:p-0 print:bg-white">
              <JapaneseCVSheet
                rirekishoRecord={selectedCVForJis}
                healthRecord={healthRecords[selectedCVForJis.siswaId]}
                discRecord={discRecords[selectedCVForJis.siswaId]}
                psikotesRecord={psikotesRecords[selectedCVForJis.siswaId]}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCandidate(selectedCVForJis);
                    setSelectedCVForJis(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '翻訳・ステータス編集' : 'Edit Terjemahan & Status'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '印刷' : 'Cetak CV'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCVForJis(null)}
                className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {lang === 'ja' ? '閉じる' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <form
            onSubmit={handleSaveJob}
            className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col text-slate-800 shadow-2xl my-auto overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 px-6 pt-5 shrink-0 bg-slate-50/80 rounded-t-3xl">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <span>
                    {lang === 'ja'
                      ? (jobForm.id ? '求人情報更新' : '新規求人登録')
                      : (jobForm.id ? 'UPDATE DATA LOWONGAN' : 'TAMBAH LOWONGAN BARU')}
                  </span>
                </h3>
                <p className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 uppercase tracking-widest mt-0.5">
                  {lang === 'ja' ? 'IJEF 求人マッチングシステム' : 'SISTEM KATALOG JOB MATCHING IJEF'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800">
              {/* SECTION 1: INFORMASI DASAR & LOKASI */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'ja' ? '基本情報＆勤務地' : 'INFORMASI DASAR & LOKASI'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '求人コード' : 'KODE LOWONGAN'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.kodeJob || ''}
                      onChange={(e) => setJobForm({ ...jobForm, kodeJob: e.target.value })}
                      placeholder="Contoh: INTL015 / IND012"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '募集ステータス' : 'STATUS LOWONGAN'}
                    </label>
                    <select
                      value={jobForm.statusJob === 'Tutup' ? 'Tutup' : 'Aktif'}
                      onChange={(e) => setJobForm({ ...jobForm, statusJob: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    >
                      <option value="Aktif">{lang === 'ja' ? '募集中 (OPEN)' : 'Aktif (OPEN)'}</option>
                      <option value="Tutup">{lang === 'ja' ? '締切済 (CLOSED)' : 'Tutup (CLOSED)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '緊急度' : 'STATUS URGENSI JOB'}
                    </label>
                    <select
                      value={(jobForm.urgensiJob || 'STANDART').toUpperCase()}
                      onChange={(e) => setJobForm({ ...jobForm, urgensiJob: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    >
                      <option value="URGENT">{lang === 'ja' ? '🔥 至急 (URGENT)' : '🔥 URGENT'}</option>
                      <option value="STANDART">{lang === 'ja' ? '⚡ 通常 (STANDART)' : '⚡ STANDART'}</option>
                      <option value="SLOW">{lang === 'ja' ? '⏳ 余裕あり (SLOW)' : '⏳ SLOW'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '対象居住地' : 'DOMISILI JOB SISWA'}
                    </label>
                    <select
                      value={jobForm.kategoriDomisili || (jobForm.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)')}
                      onChange={(e) => setJobForm({ ...jobForm, kategoriDomisili: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    >
                      <option value="Domestik (Jepang)">{lang === 'ja' ? '日本国内在住者' : 'Domestik (Jepang)'}</option>
                      <option value="Lokal (Indonesia)">{lang === 'ja' ? 'インドネシア国内' : 'Lokal (Indonesia)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '勤務地（都道府県）' : 'PREFEKTUR / LOKASI'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.lokasiPrefektur}
                      onChange={(e) => setJobForm({ ...jobForm, lokasiPrefektur: e.target.value })}
                      required
                      placeholder="Contoh: 兵庫県 (Hyogo), Kumamoto, Tokyo"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-5">
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '職種 / 求人タイトル' : 'NAMA LOWONGAN / JUDUL JOB'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.judulPekerjaan}
                      onChange={(e) => setJobForm({ ...jobForm, judulPekerjaan: e.target.value })}
                      required
                      placeholder="Contoh: KAIGO 介護 (Perawat Lansia) / PETERNAKAN SAPI (畜産業)"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '受入企業名' : 'NAMA PERUSAHAAN'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.perusahaanJepang || ''}
                      onChange={(e) => setJobForm({ ...jobForm, perusahaanJepang: e.target.value })}
                      placeholder="Contoh: GN / Kaisha Japan Co., Ltd"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '給与（月給/年収）' : 'GAJI (BULAN/TAHUN)'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.gajiString || ''}
                      onChange={(e) => setJobForm({ ...jobForm, gajiString: e.target.value })}
                      placeholder="Contoh: 220.000~223.000円/bulan"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-amber-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '監理団体 / 登録支援機関 (TSK)' : 'KUMIAI / TSK PARTNER RUJUKAN'}
                    </label>
                    <input
                      type="text"
                      value={jobForm.kumiaiRujukan || ''}
                      onChange={(e) => setJobForm({ ...jobForm, kumiaiRujukan: e.target.value })}
                      placeholder="Contoh: Hibiki / Enlink / Marta Kumiai"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: KLASIFIKASI & DOKUMEN / KANDIDAT */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ja' ? '候補者区分＆応募要件' : 'KLASIFIKASI & PERSYARATAN KANDIDAT'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '対象候補者区分' : 'KLASIFIKASI TARGET KANDIDAT'}
                    </label>
                    <select
                      value={jobForm.kategoriTarget}
                      onChange={(e) => setJobForm({ ...jobForm, kategoriTarget: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition"
                    >
                      <option value="Semua Non-IJEF">{lang === 'ja' ? 'すべての一般応募者 (Non-IJEF)' : 'Semua Non-IJEF'}</option>
                      <option value="SISWA NON IJEF (New Comer)">{lang === 'ja' ? '新規渡航者 (New Comer)' : 'SISWA NON IJEF (New Comer)'}</option>
                      <option value="MATCHING JOB - Engineering / Gijinkoku">{lang === 'ja' ? '技術・人文知識・国際業務 (技人国)' : 'MATCHING JOB - Engineering / Gijinkoku'}</option>
                      <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">{lang === 'ja' ? '実習生・研修生帰国者 (Ex-Magang)' : 'MATCHING JOB - Ex-Magang / Ex-Trainee'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '対象性別' : 'GENDER / JENIS KELAMIN'}
                    </label>
                    <select
                      value={jobForm.jenisKelamin || '男女 (Laki-laki & Perempuan)'}
                      onChange={(e) => setJobForm({ ...jobForm, jenisKelamin: e.target.value as any })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none transition"
                    >
                      <option value="男女 (Laki-laki & Perempuan)">{lang === 'ja' ? '男女問わず (男女)' : 'Pria & Wanita (男女)'}</option>
                      <option value="男 (Laki-laki)">{lang === 'ja' ? '男性のみ (男)' : 'Pria Saja (男)'}</option>
                      <option value="女 (Perempuan)">{lang === 'ja' ? '女性のみ (女)' : 'Wanita Saja (女)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '採用予定人数（枠）' : 'KUOTA / JUMLAH KEBUTUHAN'}
                    </label>
                    <input
                      type="number"
                      value={jobForm.kuotaSiswa}
                      onChange={(e) => setJobForm({ ...jobForm, kuotaSiswa: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-emerald-700 font-extrabold focus:ring-2 focus:ring-purple-500 outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '応募資格・必須要件 (JLPT, 特定技能, 年齢, 経験)' : 'KUALIFIKASI & SYARAT KHUSUS (JLPT, SSW, USIA, PENGALAMAN)'}
                    </label>
                    <textarea
                      rows={3}
                      value={jobForm.kualifikasi || jobForm.persyaratanJLPT}
                      onChange={(e) => setJobForm({ ...jobForm, kualifikasi: e.target.value, persyaratanJLPT: e.target.value })}
                      placeholder="Contoh: JLPT N4/JFT A-2 & SSW Kaigo, Usia maks 35 tahun, Berdomisili di Jepang / Indonesia, Pengalaman Kaigo min 1 tahun."
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed transition min-h-[90px] whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INFORMASI BIAYA & SUMBER */}
              <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200/80 pb-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? '渡航費用・待遇・福利厚生' : 'INFORMASI BIAYA & FASILITAS'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '渡航費用負担スキーム' : 'BIAYA JOB / PROSES & TANGGUNGAN'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobForm.biayaProses || ''}
                      onChange={(e) => setJobForm({ ...jobForm, biayaProses: e.target.value })}
                      placeholder="Contoh: Potong Gaji / Cash / Rp 30.000.000 (Free Tiket, MCU, Visa, EKTKLN)"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[70px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '宿舎寮・福利厚生' : 'FASILITAS ASRAMA & BENEFIT'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobForm.fasilitasAsrama || ''}
                      onChange={(e) => setJobForm({ ...jobForm, fasilitasAsrama: e.target.value })}
                      placeholder="Contoh: Asrama fully furnished, Transportasi, Lembur, Shakai Hoken"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[70px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '業務内容・職務詳細' : 'DESKRIPSI PEKERJAAN & TUGAS HARIAN'}
                    </label>
                    <textarea
                      rows={4}
                      value={jobForm.deskripsiPekerjaan || ''}
                      onChange={(e) => setJobForm({ ...jobForm, deskripsiPekerjaan: e.target.value })}
                      placeholder="Contoh: &#10;• Berdomisili di Jepang / Indonesia&#10;• Dapat mulai bekerja 1 September 2026&#10;• Memiliki pengalaman Kaigo minimal 1 tahun&#10;• Bersedia merawat pengguna layanan dengan disabilitas"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[110px] whitespace-pre-wrap"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-700 font-bold mb-1 uppercase tracking-wider">
                      {lang === 'ja' ? '特記事項・補足メモ' : 'KETERANGAN TAMBAHAN / SYARAT KHUSUS'}
                    </label>
                    <textarea
                      rows={3}
                      value={jobForm.keteranganTambahan || ''}
                      onChange={(e) => setJobForm({ ...jobForm, keteranganTambahan: e.target.value })}
                      placeholder="Contoh: Penerbangan dari Jakarta / Wawancara 3x via Zoom / Catatan khusus"
                      className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed transition min-h-[85px] whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-3xl shrink-0">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'BATAL'}
              </button>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-slate-900/20 flex items-center space-x-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ja' ? '求人情報を保存' : 'SIMPAN DATA LOWONGAN'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DETAILED JOB VIEW MODAL */}
      {selectedDetailJob && (() => {
        const viewLang = detailModalLang || lang || 'id';

        const rawKode = selectedDetailJob.kodeJob || selectedDetailJob.id || '';
        const cleanKodeJob =
          rawKode && !/^rp\s*/i.test(rawKode) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawKode)
            ? rawKode
            : `JOB-${selectedDetailJob.id || '001'}`;

        const rawTsk = selectedDetailJob.tskSumberJob || '';
        const cleanTsk =
          rawTsk && !/^rp\s*/i.test(rawTsk) && !/^\d{1,3}(\.\d{3}){2,}/.test(rawTsk)
            ? rawTsk
            : (viewLang === 'ja' ? 'IJEF推薦・社内' : 'Internal IJEF');

        const isClosed = selectedDetailJob.statusJob === 'Tutup';
        const urgensi = (selectedDetailJob.urgensiJob || 'STANDART').toUpperCase();
        const domisili = selectedDetailJob.kategoriDomisili || (selectedDetailJob.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
        const isDomestik = domisili === 'Domestik (Jepang)';

        const handleCopyJobText = () => {
          let textToCopy = '';
          if (viewLang === 'ja') {
            textToCopy = `📢 【日本求人情報 - ${cleanKodeJob}】
📌 職種・求人件名: ${getSanitizedJobTitle(selectedDetailJob, 'ja')}
🎯 募集区分: ${translateCandidateCategory(selectedDetailJob.kategoriTarget, 'ja')}
📊 募集状態: ${isClosed ? '締切済 (Closed)' : '募集中 (Open)'}
⚡ 緊急度: ${urgensi === 'URGENT' ? '至急 (Urgent)' : urgensi === 'SLOW' ? '余裕あり (Slow)' : '通常 (Standard)'}
📍 対象居住地: ${isDomestik ? '日本国内在住者' : 'インドネシア国内'}
🏢 勤務地（都道府県）: ${formatPrefecture(selectedDetailJob.lokasiPrefektur, 'ja')}
👤 募集性別: ${formatGender(selectedDetailJob.jenisKelamin, 'ja')}
👥 採用枠人数: ${selectedDetailJob.kuotaSiswa || 1} 名
💴 標準給与: ${formatSalary(selectedDetailJob, 'ja')}
🏢 受入企業・支援機関: ${getSanitizedCompany(selectedDetailJob, 'ja')} (${cleanTsk})

📋 応募資格・必要要件:
${formatQualification(selectedDetailJob.kualifikasi || selectedDetailJob.persyaratanJLPT, 'ja')}

💰 渡航手続費用スキーム:
${translateFeeText(selectedDetailJob.biayaProses, 'ja')}

🏨 福利厚生・住居寮:
${translateFacilityText(selectedDetailJob.fasilitasAsrama, 'ja')}

${selectedDetailJob.keteranganTambahan ? `ℹ️ 特記事項・補足事項:\n${translateNotesText(selectedDetailJob.keteranganTambahan, 'ja')}\n` : ''}
📲 IJEF公式ポータルよりエントリー受付中。`;
          } else {
            textToCopy = `📢 [LOWONGAN JEPANG - ${cleanKodeJob}]
📌 POSISI: ${getSanitizedJobTitle(selectedDetailJob, 'id')}
🎯 KATEGORI: ${selectedDetailJob.kategoriTarget || 'Semua Candidate'}
STATUS: ${isClosed ? 'Tutup' : 'Aktif'}
URGENSI: ${urgensi === 'URGENT' ? '🔥 URGENT' : urgensi === 'SLOW' ? '⏳ SLOW' : '⚡ STANDART'}
DOMISILI SISWA: ${domisili}
📍 LOKASI: ${formatPrefecture(selectedDetailJob.lokasiPrefektur, 'id')}
👤 TARGET GENDER: ${formatGender(selectedDetailJob.jenisKelamin, 'id')}
👥 KUOTA: ${selectedDetailJob.kuotaSiswa || 1} Orang Candidate
💴 GAJI: ${formatSalary(selectedDetailJob, 'id')} ${selectedDetailJob.gajiEstimasiIdr ? `(± Rp ${(selectedDetailJob.gajiEstimasiIdr).toLocaleString('id-ID')})` : ''}
🏢 PARTNER / TSK: ${cleanTsk}

📋 KUALIFIKASI & PERSYARATAN:
${formatQualification(selectedDetailJob.kualifikasi || selectedDetailJob.persyaratanJLPT, 'id')}

💰 BIAYA PROSES & TANGGUNGAN:
${translateFeeText(selectedDetailJob.biayaProses, 'id')}

🏨 FASILITAS & ASRAMA:
${translateFacilityText(selectedDetailJob.fasilitasAsrama, 'id')}

${selectedDetailJob.keteranganTambahan ? `ℹ️ KETERANGAN TAMBAHAN:\n${selectedDetailJob.keteranganTambahan}\n` : ''}
📲 Pendaftaran melalui Portal Resmi CV Matching IJEF.`;
          }

          navigator.clipboard.writeText(textToCopy);
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2500);
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-5 text-slate-800 shadow-2xl my-8">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                      {viewLang === 'ja' ? '求人コード:' : 'KODE:'} {cleanKodeJob}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        isClosed
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {viewLang === 'ja' ? (isClosed ? '状態: 締切済' : '状態: 募集中') : (isClosed ? 'STATUS: Tutup' : 'STATUS: Aktif')}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                        urgensi === 'URGENT'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : urgensi === 'SLOW'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {viewLang === 'ja' ? (urgensi === 'URGENT' ? '緊急度: 🔥 至急' : urgensi === 'SLOW' ? '緊急度: ⏳ 余裕あり' : '緊急度: ⚡ 通常') : (urgensi === 'URGENT' ? 'URGENSI: 🔥 URGENT' : urgensi === 'SLOW' ? 'URGENSI: ⏳ SLOW' : 'URGENSI: ⚡ STANDART')}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        isDomestik
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {viewLang === 'ja' ? (isDomestik ? '居住地: 🇯🇵 日本国内在住者' : '居住地: 🇮🇩 インドネシア国内') : `DOMISILI: ${domisili}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">
                    {getSanitizedJobTitle(selectedDetailJob, viewLang)}
                  </h3>
                  <p className="text-xs text-purple-700 font-bold">
                    {translateCandidateCategory(selectedDetailJob.kategoriTarget, viewLang)}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* In-Modal Language Toggle */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDetailModalLang('id')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        viewLang === 'id'
                          ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Tampilkan dalam Bahasa Indonesia"
                    >
                      <span>🇮🇩</span>
                      <span className="hidden sm:inline">ID</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailModalLang('ja')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1 ${
                        viewLang === 'ja'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="日本語で表示"
                    >
                      <span>🇯🇵</span>
                      <span className="hidden sm:inline">日本語</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailJob(null);
                      setDetailModalLang(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Categorized Detailed Breakdown Component */}
              <JobDescriptionCategorizedView job={selectedDetailJob} lang={viewLang} isAdminView={true} />

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJobText}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/20 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{viewLang === 'ja' ? (copySuccess ? 'クリップボードにコピーしました！' : '求人情報をコピー') : (copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Info Lowongan')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetJob = selectedDetailJob;
                      setSelectedDetailJob(null);
                      setDetailModalLang(null);
                      setJobForm(targetJob);
                      setShowJobModal(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-md shadow-purple-600/20 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{viewLang === 'ja' ? 'この求人を編集' : 'Edit Job Ini'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailJob(null);
                    setDetailModalLang(null);
                  }}
                  className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  {viewLang === 'ja' ? '閉じる' : 'Tutup'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT SELECTION STATUS & INTERVIEW SCHEDULING MODAL */}
      {editAppModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveAppUpdate}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 text-slate-800 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>
                    {lang === 'ja' ? '候補者選考ステータス＆面接日程設定' : 'Penjadwalan & Status Seleksi Candidate'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {lang === 'ja'
                    ? '面接方式（オンライン/対面）、日時、場所、および合否選考ステータスを設定します。'
                    : 'Atur metode interview (Online/Offline), waktu, lokasi, serta status kelulusan candidate.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditAppModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate & Job Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  {lang === 'ja' ? '候補者 / 学生を選択' : 'Pilih Candidate / Siswa'}
                </label>
                <select
                  value={editAppModal.siswaId}
                  onChange={(e) => {
                    const selected = rirekishoList.find((c) => c.siswaId === e.target.value || c.id === e.target.value);
                    if (selected) {
                      setEditAppModal({
                        ...editAppModal,
                        siswaId: selected.siswaId || selected.id,
                        namaSiswa: selected.namaLengkap,
                        emailSiswa: selected.email,
                        kategoriKandidat: selected.kategoriKandidat
                      });
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {rirekishoList.map((c, idx) => (
                    <option key={c.id ? `${c.id}-${idx}` : `cv-opt-${idx}`} value={c.siswaId || c.id}>
                      {c.namaLengkap} ({translateCandidateCategory(c.kategoriKandidat, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  {lang === 'ja' ? '求人を選択' : 'Pilih Lowongan Job'}
                </label>
                <select
                  value={editAppModal.jobId}
                  onChange={(e) => {
                    const selectedJob = jobPostings.find((j) => j.id === e.target.value);
                    if (selectedJob) {
                      setEditAppModal({
                        ...editAppModal,
                        jobId: selectedJob.id,
                        jobJudul: selectedJob.judulPekerjaan,
                        perusahaanJepang: selectedJob.perusahaanJepang
                      });
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {jobPostings.map((j, idx) => (
                    <option key={j.id ? `${j.id}-${idx}` : `job-opt-${idx}`} value={j.id}>
                      {getSanitizedJobTitle(j, lang)} - {getSanitizedCompany(j, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Seleksi */}
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                {lang === 'ja' ? '選考ステータス' : 'Status Seleksi Candidate'}
              </label>
              <select
                value={editAppModal.statusLamaran}
                onChange={(e) => setEditAppModal({ ...editAppModal, statusLamaran: e.target.value as any })}
                className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Terjadwal Interview">
                  {lang === 'ja' ? '📅 面接日程確定 (オンライン/対面)' : '📅 Terjadwal Interview (Online / Offline)'}
                </option>
                <option value="Lolos Interview (Naitei)">
                  {lang === 'ja' ? '🎉 面接合格・内定 (内定承諾)' : '🎉 Lolos Interview (Naitei / Accepted)'}
                </option>
                <option value="Seleksi Berkas Rirekisho">
                  {lang === 'ja' ? '📄 書類選考中 (履歴書確認)' : '📄 Seleksi Berkas Rirekisho'}
                </option>
                <option value="Proses Visa / COE">
                  {lang === 'ja' ? '🌐 在留資格申請・COE/VISA手続き' : '🌐 Proses Pengurusan Visa / COE'}
                </option>
                <option value="Ditolak">
                  {lang === 'ja' ? '❌ 不合格・見送り' : '❌ Tidak Lolos Seleksi'}
                </option>
              </select>
            </div>

            {/* Metode Interview Switch */}
            <div>
              <label className="block text-[11px] text-slate-700 mb-1.5 font-semibold">
                {lang === 'ja' ? '面接形式' : 'Metode Interview'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditAppModal({
                      ...editAppModal,
                      metodeInterview: 'ONLINE',
                      lokasiInterview: editAppModal?.lokasiInterview && typeof editAppModal.lokasiInterview === 'string' && editAppModal.lokasiInterview.startsWith('http')
                        ? editAppModal.lokasiInterview
                        : 'https://zoom.us/j/9876543210'
                    })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    editAppModal.metodeInterview === 'ONLINE' || !editAppModal.metodeInterview
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{lang === 'ja' ? 'オンライン (Zoom / Google Meet)' : 'ONLINE (Zoom / Meet)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditAppModal({
                      ...editAppModal,
                      metodeInterview: 'OFFLINE',
                      lokasiInterview: !(editAppModal?.lokasiInterview && typeof editAppModal.lokasiInterview === 'string' && editAppModal.lokasiInterview.startsWith('http'))
                        ? editAppModal.lokasiInterview
                        : 'Auditorium LPK IJEF Lt. 2, Jakarta / Office Kumiai'
                    })
                  }
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer ${
                    editAppModal.metodeInterview === 'OFFLINE'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{lang === 'ja' ? '対面面接 (現地/会場)' : 'OFFLINE (Tatap Muka)'}</span>
                </button>
              </div>
            </div>

            {/* Tanggal & Waktu Interview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  {lang === 'ja' ? '面接実施日' : 'Tanggal Interview'}
                </label>
                <input
                  type="date"
                  value={editAppModal.tanggalInterview || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditAppModal({ ...editAppModal, tanggalInterview: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                  {lang === 'ja' ? '面接時間 (WIB/JST)' : 'Waktu Interview (WIB)'}
                </label>
                <input
                  type="time"
                  value={editAppModal.waktuInterview || '09:00'}
                  onChange={(e) => setEditAppModal({ ...editAppModal, waktuInterview: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Link / Lokasi Interview */}
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-semibold flex items-center justify-between">
                <span>
                  {editAppModal.metodeInterview === 'OFFLINE'
                    ? (lang === 'ja' ? '対面面接の開催場所・住所' : 'Lokasi / Alamat Lengkap Tatap Muka')
                    : (lang === 'ja' ? 'ミーティングURL (Zoom / Google Meet / Teams)' : 'Link Meeting Room (Zoom / Google Meet / Teams)')}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {lang === 'ja' ? '必須' : 'Wajib diisi'}
                </span>
              </label>

              {editAppModal.metodeInterview === 'OFFLINE' ? (
                <div className="relative">
                  <MapPin className="w-4 h-4 text-amber-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={editAppModal.lokasiInterview || ''}
                    onChange={(e) => setEditAppModal({ ...editAppModal, lokasiInterview: e.target.value })}
                    placeholder={lang === 'ja' ? '例: LPK IJEF 第2ホール会議室 / ホテル会場' : 'Contoh: Ruang Meeting Utama LPK IJEF Lt. 2 / Hotel Borobudur Jakarta'}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Video className="w-4 h-4 text-sky-600 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={editAppModal.lokasiInterview || ''}
                    onChange={(e) => setEditAppModal({ ...editAppModal, lokasiInterview: e.target.value })}
                    placeholder="Contoh: https://zoom.us/j/9876543210 atau https://meet.google.com/abc-defg-hij"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-mono outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Catatan Admin / Kumiai */}
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-semibold">
                {lang === 'ja' ? '候補者への伝達事項・注意事項' : 'Catatan / Instruksi untuk Candidate'}
              </label>
              <textarea
                rows={2}
                value={editAppModal.catatanPerusahaan || ''}
                onChange={(e) => setEditAppModal({ ...editAppModal, catatanPerusahaan: e.target.value })}
                placeholder={lang === 'ja' ? '例: 原本書類持参、白シャツ・スーツ着用、面接開始15分前に入室してください。' : 'Misal: Harap membawa berkas fisik asli, berpakaian kemeja putih & jas rapi, hadir 15 menit sebelum waktu interview.'}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Schedule Preview Box */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                {lang === 'ja' ? '日程サマリープレビュー' : 'Preview Format Ringkasan Jadwal'}
              </p>
              <p className="text-xs text-purple-950 font-bold">
                {editAppModal.tanggalInterview ? (
                  <>
                    📅 {editAppModal.tanggalInterview} • {lang === 'ja' ? '時間' : 'Jam'} {editAppModal.waktuInterview || '09:00'} ({editAppModal.metodeInterview === 'OFFLINE' ? (lang === 'ja' ? '対面面接' : 'Offline Tatap Muka') : (lang === 'ja' ? 'オンライン Zoom' : 'Online Zoom')})
                  </>
                ) : (
                  editAppModal.jadwalInterview || (lang === 'ja' ? '未設定' : 'Jadwal belum dikonfigurasi')
                )}
              </p>
              <p className="text-[11px] text-slate-600 truncate">
                📍 {editAppModal.lokasiInterview || (lang === 'ja' ? '場所未入力' : 'Belum diisi')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditAppModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-purple-600/30 flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'ja' ? '面接日程・ステータスを保存' : 'Simpan Jadwal Interview'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Tambah Akun Administrator Baru */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0 animate-fade-in text-slate-800">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-300" />
                <h4 className="font-bold text-sm">
                  {lang === 'ja' ? '管理者アカウント追加＆ロール権限設定' : 'Tambah Akun Administrator & Otorisasi Role'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAccountModal(false)}
                className="p-1 hover:bg-purple-800 rounded-lg text-purple-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccountSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
              {/* Super Admin Special Access Toggle Banner */}
              <div
                onClick={() => {
                  const nextSuper = !newAccountForm.isSuperAdmin;
                  setNewAccountForm((prev) => ({
                    ...prev,
                    isSuperAdmin: nextSuper,
                    role: nextSuper ? 'SuperAdmin' : 'Admin Matching',
                    portalAccess: nextSuper ? 'ALL_PORTALS' : 'ADMIN_2_CV_PORTAL'
                  }));
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  newAccountForm.isSuperAdmin
                    ? 'bg-amber-50/90 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3 pr-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    newAccountForm.isSuperAdmin ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center space-x-1.5">
                      <span>{lang === 'ja' ? 'スーパー管理者特別アクセス権' : 'Hak Akses Khusus Super Admin'}</span>
                      <span className="bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Universal</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {lang === 'ja'
                        ? 'すべてのポータル（生徒管理、書類管理、マーケティング、提携LPK、生徒用）へのアクセスおよび監視権限が付与されます。'
                        : 'Bisa mengakses, monitoring, dan berpindah ke SEMUA portal (Admin Siswa, Admin Doc, Portal Marketing, Mitra LPK, & Siswa).'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-xl font-black ${newAccountForm.isSuperAdmin ? 'text-amber-600' : 'text-slate-300'}`}>
                    {newAccountForm.isSuperAdmin ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '管理者氏名' : 'Nama Lengkap Administrator'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newAccountForm.name}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                    placeholder={lang === 'ja' ? '例: 山田 太郎' : 'e.g. Hendra Pratama, M.Kom'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'ログイン用メールアドレス' : 'Email Administrator (Login)'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newAccountForm.email}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, email: e.target.value })}
                    placeholder={lang === 'ja' ? 'admin@ijef.or.id' : 'e.g. hendra.admin@ijef.id'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '電話番号 / WhatsApp' : 'No. Handphone / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={newAccountForm.phone}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, phone: e.target.value })}
                    placeholder="e.g. 081298765432"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '初期パスワード' : 'Kata Sandi Akun Awal'}
                  </label>
                  <input
                    type="text"
                    value={newAccountForm.initialPassword || 'admin2026!'}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, initialPassword: e.target.value })}
                    placeholder="admin2026!"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'ロール（役割・権限）' : 'Role / Peran Akses'}
                  </label>
                  <select
                    disabled={newAccountForm.isSuperAdmin}
                    value={newAccountForm.isSuperAdmin ? 'SuperAdmin' : newAccountForm.role}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="SuperAdmin">{lang === 'ja' ? 'スーパー管理者 (全権限)' : 'Super Admin (Akses Universal)'}</option>
                    <option value="Admin Matching">{lang === 'ja' ? '求人・面接マッチング管理者' : 'Admin Matching & Katalog Job'}</option>
                    <option value="Evaluator & Verifikator">{lang === 'ja' ? '書類審査・評価担当者' : 'Evaluator & Verifikator Berkas'}</option>
                    <option value="HR Legal">{lang === 'ja' ? 'HR・雇用契約担当' : 'HR Legal & Kontrak Kerja'}</option>
                    <option value="Dokter">{lang === 'ja' ? '健康診断・医療チーム' : 'Dokter / Tim Medis MCU'}</option>
                    <option value="Finance">{lang === 'ja' ? '経理・渡航費用サポート' : 'Finance & Dana Talang'}</option>
                    <option value="Viewer / Foreign Partner">{lang === 'ja' ? '閲覧専用パートナー（監理団体等）' : 'Viewer / Partner Kumiai'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '所属部門 / 部署' : 'Departemen / Divisi'}
                  </label>
                  <select
                    value={newAccountForm.department}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Divisi Penempatan Jepang (TSK/SSW)">
                      {lang === 'ja' ? '日本配置事業部 (特定技能/実習)' : 'Divisi Penempatan Jepang (TSK/SSW)'}
                    </option>
                    <option value="Direksi & Manajemen Pusat">
                      {lang === 'ja' ? '役員・中央経営陣' : 'Direksi & Manajemen Pusat'}
                    </option>
                    <option value="Divisi Verifikasi & Seleksi">
                      {lang === 'ja' ? '審査・選考部門' : 'Divisi Verifikasi & Seleksi'}
                    </option>
                    <option value="Legal & Kontrak Perjanjian">
                      {lang === 'ja' ? '法務・契約管理部門' : 'Legal & Kontrak Perjanjian'}
                    </option>
                    <option value="Kemitraan LPK & Kumiai">
                      {lang === 'ja' ? 'LPK＆監理団体連携推進' : 'Kemitraan LPK & Kumiai'}
                    </option>
                    <option value="Keuangan & Dana Talang">
                      {lang === 'ja' ? '財務・経理管理' : 'Keuangan & Dana Talang'}
                    </option>
                    <option value="Klinik / Tim Kesehatan">
                      {lang === 'ja' ? '提携クリニック・医療班' : 'Klinik / Tim Kesehatan'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? 'アクセス対象ポータル' : 'Cakupan Akses Portal'}
                </label>
                <select
                  disabled={newAccountForm.isSuperAdmin}
                  value={newAccountForm.isSuperAdmin ? 'ALL_PORTALS' : newAccountForm.portalAccess}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, portalAccess: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                >
                  <option value="ALL_PORTALS">{lang === 'ja' ? '👑 全ポータル統合アクセス (ALL_PORTALS)' : '👑 ALL_PORTALS (Akses Universal Semua Portal)'}</option>
                  <option value="ADMIN_2_CV_PORTAL">{lang === 'ja' ? '⚡ CV・マッチング管理 (ADMIN_2_CV_PORTAL)' : '⚡ ADMIN_2_CV_PORTAL (Back-Office CV & Matching)'}</option>
                  <option value="ADMIN_1_IJEF">{lang === 'ja' ? '🏛️ 生徒選考・財務管理 (ADMIN_1_IJEF)' : '🏛️ ADMIN_1_IJEF (SIM-SB Seleksi Siswa & Keuangan)'}</option>
                  <option value="MITRA_PORTAL">{lang === 'ja' ? '🤝 提携LPKポータル (MITRA_PORTAL)' : '🤝 MITRA_PORTAL (Portal Kemitraan LPK Daerah)'}</option>
                  <option value="STUDENT_PORTAL">{lang === 'ja' ? '🎓 生徒・候補者ポータル (STUDENT_PORTAL)' : '🎓 STUDENT_PORTAL (Portal Siswa / Kandidat)'}</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-700">
                  {lang === 'ja' ? '個別機能権限' : 'Wewenang Spesifik & Otorisasi Fitur'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {AVAILABLE_ADMIN_PERMISSIONS.map((perm) => {
                    const isChecked = newAccountForm.isSuperAdmin || newAccountForm.permissions.includes(perm);
                    return (
                      <label
                        key={perm}
                        className={`flex items-center space-x-2 text-[11px] p-1.5 rounded-lg border transition cursor-pointer ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={newAccountForm.isSuperAdmin}
                          checked={isChecked}
                          onChange={() => handleToggleNewPermission(perm)}
                          className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="truncate">{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'ja' ? '管理者アカウント保存' : 'Simpan Akun Administrator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Akun Administrator & Otorisasi Role */}
      {editingAdminAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0 animate-fade-in text-slate-800">
            <div className="p-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-purple-300" />
                <div>
                  <h4 className="font-bold text-sm">
                    {lang === 'ja' ? '管理者アカウント編集＆ロール権限設定' : 'Edit Akun Administrator & Otorisasi Role'}
                  </h4>
                  <p className="text-[10px] text-purple-300 font-mono">ID: {editingAdminAccount.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdminAccount(null)}
                className="p-1 hover:bg-purple-800 rounded-lg text-purple-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
              {/* Super Admin Special Access Toggle Banner */}
              <div
                onClick={() => {
                  const nextSuper = !editAdminForm.isSuperAdmin;
                  setEditAdminForm((prev) => ({
                    ...prev,
                    isSuperAdmin: nextSuper,
                    role: nextSuper ? 'SuperAdmin' : prev.role === 'SuperAdmin' ? 'Admin Matching' : prev.role,
                    portalAccess: nextSuper ? 'ALL_PORTALS' : 'ADMIN_2_CV_PORTAL'
                  }));
                }}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  editAdminForm.isSuperAdmin
                    ? 'bg-amber-50/90 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3 pr-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                    editAdminForm.isSuperAdmin ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center space-x-1.5">
                      <span>{lang === 'ja' ? 'スーパー管理者特別アクセス権' : 'Hak Akses Khusus Super Admin'}</span>
                      <span className="bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Universal</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {lang === 'ja'
                        ? 'すべてのポータル（生徒管理、書類管理、マーケティング、提携LPK、生徒用）へのアクセスおよび監視権限が付与されます。'
                        : 'Bisa mengakses, monitoring, dan berpindah ke SEMUA portal (Admin Siswa, Admin Doc, Portal Marketing, Mitra LPK, & Siswa).'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-xl font-black ${editAdminForm.isSuperAdmin ? 'text-amber-600' : 'text-slate-300'}`}>
                    {editAdminForm.isSuperAdmin ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '管理者氏名' : 'Nama Lengkap Administrator'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editAdminForm.name}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '管理者メールアドレス' : 'Email Administrator'}
                  </label>
                  <input
                    type="email"
                    required
                    value={editAdminForm.email}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '電話番号 / WhatsApp' : 'No. Handphone / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={editAdminForm.phone}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'アカウント状態' : 'Status Otorisasi Akun'}
                  </label>
                  <select
                    value={editAdminForm.status}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="AKTIF">{lang === 'ja' ? '🟢 有効 (ログイン・操作可能)' : '🟢 AKTIF (Bisa Login & Beroperasi)'}</option>
                    <option value="NONAKTIF">{lang === 'ja' ? '🔴 無効 (アクセス停止)' : '🔴 NONAKTIF (Kunci Akses Sesi)'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'ロール（役割・権限）' : 'Role / Peran Akses'}
                  </label>
                  <select
                    disabled={editAdminForm.isSuperAdmin}
                    value={editAdminForm.isSuperAdmin ? 'SuperAdmin' : editAdminForm.role}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="SuperAdmin">{lang === 'ja' ? 'スーパー管理者 (全権限)' : 'Super Admin (Akses Universal)'}</option>
                    <option value="Admin Matching">{lang === 'ja' ? '求人・面接マッチング管理者' : 'Admin Matching & Katalog Job'}</option>
                    <option value="Evaluator & Verifikator">{lang === 'ja' ? '書類審査・評価担当者' : 'Evaluator & Verifikator Berkas'}</option>
                    <option value="HR Legal">{lang === 'ja' ? 'HR・雇用契約担当' : 'HR Legal & Kontrak Kerja'}</option>
                    <option value="Dokter">{lang === 'ja' ? '健康診断・医療チーム' : 'Dokter / Tim Medis MCU'}</option>
                    <option value="Finance">{lang === 'ja' ? '経理・渡航費用サポート' : 'Finance & Dana Talang'}</option>
                    <option value="Viewer / Foreign Partner">{lang === 'ja' ? '閲覧専用パートナー（監理団体等）' : 'Viewer / Partner Kumiai'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '所属部門 / 部署' : 'Departemen / Divisi'}
                  </label>
                  <select
                    value={editAdminForm.department}
                    onChange={(e) => setEditAdminForm({ ...editAdminForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Divisi Penempatan Jepang (TSK/SSW)">
                      {lang === 'ja' ? '日本配置事業部 (特定技能/実習)' : 'Divisi Penempatan Jepang (TSK/SSW)'}
                    </option>
                    <option value="Direksi & Manajemen Pusat">
                      {lang === 'ja' ? '役員・中央経営陣' : 'Direksi & Manajemen Pusat'}
                    </option>
                    <option value="Divisi Verifikasi & Seleksi">
                      {lang === 'ja' ? '審査・選考部門' : 'Divisi Verifikasi & Seleksi'}
                    </option>
                    <option value="Legal & Kontrak Perjanjian">
                      {lang === 'ja' ? '法務・契約管理部門' : 'Legal & Kontrak Perjanjian'}
                    </option>
                    <option value="Kemitraan LPK & Kumiai">
                      {lang === 'ja' ? 'LPK＆監理団体連携推進' : 'Kemitraan LPK & Kumiai'}
                    </option>
                    <option value="Keuangan & Dana Talang">
                      {lang === 'ja' ? '財務・経理管理' : 'Keuangan & Dana Talang'}
                    </option>
                    <option value="Klinik / Tim Kesehatan">
                      {lang === 'ja' ? '提携クリニック・医療班' : 'Klinik / Tim Kesehatan'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? 'アクセス対象ポータル' : 'Cakupan Akses Portal'}
                </label>
                <select
                  disabled={editAdminForm.isSuperAdmin}
                  value={editAdminForm.isSuperAdmin ? 'ALL_PORTALS' : editAdminForm.portalAccess}
                  onChange={(e) => setEditAdminForm({ ...editAdminForm, portalAccess: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-600 cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                >
                  <option value="ALL_PORTALS">{lang === 'ja' ? '👑 全ポータル統合アクセス (ALL_PORTALS)' : '👑 ALL_PORTALS (Akses Universal Semua Portal)'}</option>
                  <option value="ADMIN_2_CV_PORTAL">{lang === 'ja' ? '⚡ CV・マッチング管理 (ADMIN_2_CV_PORTAL)' : '⚡ ADMIN_2_CV_PORTAL (Back-Office CV & Matching)'}</option>
                  <option value="ADMIN_1_IJEF">{lang === 'ja' ? '🏛️ 生徒選考・財務管理 (ADMIN_1_IJEF)' : '🏛️ ADMIN_1_IJEF (SIM-SB Seleksi Siswa & Keuangan)'}</option>
                  <option value="MITRA_PORTAL">{lang === 'ja' ? '🤝 提携LPKポータル (MITRA_PORTAL)' : '🤝 MITRA_PORTAL (Portal Kemitraan LPK Daerah)'}</option>
                  <option value="STUDENT_PORTAL">{lang === 'ja' ? '🎓 生徒・候補者ポータル (STUDENT_PORTAL)' : '🎓 STUDENT_PORTAL (Portal Siswa / Kandidat)'}</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-bold text-slate-700">
                  {lang === 'ja' ? '個別機能権限' : 'Wewenang Fitur Terotorisasi'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {AVAILABLE_ADMIN_PERMISSIONS.map((perm) => {
                    const isChecked = editAdminForm.isSuperAdmin || editAdminForm.permissions.includes(perm);
                    return (
                      <label
                        key={perm}
                        className={`flex items-center space-x-2 text-[11px] p-1.5 rounded-lg border transition cursor-pointer ${
                          isChecked ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={editAdminForm.isSuperAdmin}
                          checked={isChecked}
                          onChange={() => handleToggleEditPermission(perm)}
                          className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="truncate">{perm}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAdminAccount(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{lang === 'ja' ? '権限変更を保存' : 'Simpan Perubahan Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: Add / Edit Student Account in Admin 2 */}
      {showAddStudentModalInAdmin2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0 animate-fade-in text-slate-800">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">
                  {editingStudent
                    ? (lang === 'ja' ? '生徒・候補者アカウント編集' : 'Edit Akun Siswa / Peserta')
                    : (lang === 'ja' ? '生徒・候補者アカウント新規追加' : 'Tambah Akun Siswa / Peserta Baru')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModalInAdmin2(false)}
                className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmitInAdmin2} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '生徒・候補者氏名' : 'Nama Lengkap Siswa / Peserta'}
                </label>
                <input
                  type="text"
                  required
                  value={stuNama}
                  onChange={(e) => setStuNama(e.target.value)}
                  placeholder={lang === 'ja' ? '例: ブディ・プラタマ' : 'e.g. Budi Pratama Sitorus'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '有効なメールアドレス (ログイン)' : 'Email Aktif (Login)'}
                </label>
                <input
                  type="email"
                  required
                  value={stuEmail}
                  onChange={(e) => setStuEmail(e.target.value)}
                  placeholder="e.g. budi.pratama@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '電話番号 / WhatsApp' : 'No. Handphone / WA'}
                  </label>
                  <input
                    type="text"
                    value={stuNoHp}
                    onChange={(e) => setStuNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '身分証明書番号 (NIK/KTP)' : 'NIK (Nomor KTP)'}
                  </label>
                  <input
                    type="text"
                    value={stuNoKtp}
                    onChange={(e) => setStuNoKtp(e.target.value)}
                    placeholder="3271040101700003"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '希望プログラム / カテゴリ' : 'Kategori / Program'}
                  </label>
                  <select
                    value={stuKategori}
                    onChange={(e) => setStuKategori(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="SSW Japan">{lang === 'ja' ? '特定技能 (SSW)' : 'SSW Tokutei Ginou'}</option>
                    <option value="Internship / Magang">{lang === 'ja' ? '技能実習 / インターン' : 'Internship / Magang'}</option>
                    <option value="Engineering / Gijinkoku">{lang === 'ja' ? '技術・人文国際 (技人国)' : 'Engineering / Gijinkoku'}</option>
                    <option value="Ryugakusei / Studi">{lang === 'ja' ? '留学生 / 進学' : 'Ryugakusei / Studi'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '登録ステータス' : 'Status Pendaftaran'}
                  </label>
                  <select
                    value={stuStatusPendaftaran}
                    onChange={(e) => setStuStatusPendaftaran(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Draft">{lang === 'ja' ? '下書き (Draft)' : 'Draft'}</option>
                    <option value="Terdaftar">{lang === 'ja' ? '登録済 (Terdaftar)' : 'Terdaftar'}</option>
                    <option value="Terverifikasi">{lang === 'ja' ? '書類確認済 (Terverifikasi)' : 'Terverifikasi'}</option>
                    <option value="Diterima">{lang === 'ja' ? '合格・内定 (LULUS)' : 'Diterima (LULUS)'}</option>
                    <option value="Ditolak">{lang === 'ja' ? '不合格 (Ditolak)' : 'Ditolak'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModalInAdmin2(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '生徒アカウント保存' : 'Simpan Akun Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submodal: View Student Profile Details in Admin 2 */}
      {viewingStudentInAdmin2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0 animate-fade-in text-slate-800">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm">{viewingStudentInAdmin2.namaLengkap}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {lang === 'ja' ? '生徒ID:' : 'ID Siswa:'} {viewingStudentInAdmin2.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudentInAdmin2(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {lang === 'ja' ? '登録ステータス' : 'Status Registrasi'}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {viewingStudentInAdmin2.statusPendaftaran}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {lang === 'ja' ? '希望プログラム' : 'Program Minat'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {translateCandidateCategory(viewingStudentInAdmin2.kategoriKandidat, lang) || 'SSW Japan'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {lang === 'ja' ? '身分証明書番号 (NIK)' : 'Nomor KTP (NIK)'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{viewingStudentInAdmin2.noKtp || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    {lang === 'ja' ? '連絡先 / WhatsApp' : 'Kontak / No. WA'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{viewingStudentInAdmin2.noHp || '-'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block border-b pb-1">
                  {lang === 'ja' ? '連絡先＆住所詳細' : 'Detail Kontak & Alamat'}
                </span>
                <div className="text-slate-700 space-y-1">
                  <div><strong>{lang === 'ja' ? 'メールアドレス:' : 'Email:'}</strong> {viewingStudentInAdmin2.email}</div>
                  <div><strong>{lang === 'ja' ? '現住所:' : 'Alamat Domisili:'}</strong> {viewingStudentInAdmin2.alamatDomisili || '-'}</div>
                  <div><strong>{lang === 'ja' ? '生年月日・出生地:' : 'Tempat, Tgl Lahir:'}</strong> {viewingStudentInAdmin2.tempatLahir || '-'}, {viewingStudentInAdmin2.tanggalLahir || '-'}</div>
                  <div><strong>{lang === 'ja' ? '保護者・保証人氏名:' : 'Nama Ayah / Penjamin:'}</strong> {viewingStudentInAdmin2.namaAyah || '-'} ({viewingStudentInAdmin2.ktpNpwpAyah || '-'})</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingStudentInAdmin2(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {lang === 'ja' ? '閉じる' : 'Tutup Detail'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submodal: Reset Student Password in Admin 2 */}
      {showResetStudentPassModalInAdmin2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0 animate-fade-in text-slate-800">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">
                  {lang === 'ja' ? '生徒パスワードの初期化・再設定' : 'Reset Kata Sandi Siswa'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetStudentPassModalInAdmin2(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetStudentPasswordSubmitInAdmin2} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 min-h-0">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-slate-900">{showResetStudentPassModalInAdmin2.namaLengkap}</div>
                <div className="text-[10px] text-slate-500 font-mono">{showResetStudentPassModalInAdmin2.email}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '新規パスワード' : 'Kata Sandi Baru'}
                </label>
                <input
                  type="text"
                  required
                  value={studentNewPass}
                  onChange={(e) => setStudentNewPass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  {lang === 'ja'
                    ? '生徒はこの新しいパスワードで生徒ポータルにログインできます。'
                    : 'Siswa dapat menggunakan kata sandi ini untuk login ke Portal Siswa.'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetStudentPassModalInAdmin2(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? 'パスワード保存' : 'Simpan Kata Sandi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Spreadsheet Upload Modal */}
      <JobSpreadsheetUploadModal
        isOpen={showSpreadsheetModal}
        onClose={() => setShowSpreadsheetModal(false)}
        onImport={handleBatchImportJobs}
      />

      {/* Full Student CV Modal for Admin 2 */}
      {cvModalStudent && (
        <StudentCVModal
          student={cvModalStudent}
          healthRecord={healthRecords[cvModalStudent.id]}
          discRecord={discRecords[cvModalStudent.id]}
          psikotesRecord={psikotesRecords[cvModalStudent.id]}
          rirekishoRecord={rirekishoRecords[cvModalStudent.id]}
          portalContext="ADMIN_2"
          onClose={() => setCvModalStudent(null)}
        />
      )}

      {/* Google Drive Import Modal */}
      <GoogleDriveImportModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />

      {/* Confirmation Modal for Reset Job Default */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {lang === 'ja' ? '求人カタログを初期シードデータにリセット' : 'Reset Katalog Job ke Default Seed'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ja' ? '初期データ復元確認' : 'Konfirmasi Pemulihan Data Default'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {lang === 'ja'
                ? '求人カタログ全体をIJEFの初期標準シードデータに復元しますか？新しく追加・アップロードされた求人は初期データで上書きされます。'
                : 'Apakah Anda yakin ingin mereset seluruh katalog job ke data standar awal (Default Seed IJEF)? Data job tambahan yang baru Anda upload/tambahkan akan digantikan dengan data seed bawaan.'}
            </p>
            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  batchSaveJobPostings(INITIAL_JOBS, true);
                  setShowResetConfirmModal(false);
                  setToastMessage(lang === 'ja' ? '求人カタログが初期シードデータにリセットされました。' : 'Katalog job berhasil direset ke data seed default IJEF.');
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'はい、初期状態にリセット' : 'Ya, Reset ke Default'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Hapus Semua Job */}
      {showDeleteAllConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {lang === 'ja' ? '全求人案件を一括クリア・削除' : 'Kosongkan Semua Job Posting'}
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  {lang === 'ja' ? '全削除の警告' : 'Peringatan Penghapusan Total'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {lang === 'ja' ? (
                <>
                  カタログ内の<strong className="text-rose-700">すべての求人案件を削除</strong>してもよろしいですか？すべての求人がクリアされ、新しいスプレッドシートを新規インポートできるようになります。
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin <strong className="text-rose-700">MENGHAPUS / MENGOSONGKAN SEMUA JOB</strong> dalam katalog? Seluruh lowongan akan dihapus sehingga Anda dapat meng-upload spreadsheet baru dengan bersih.
                </>
              )}
            </p>
            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  batchSaveJobPostings([], true);
                  setShowDeleteAllConfirmModal(false);
                  setToastMessage(lang === 'ja' ? 'すべての求人案件がクリアされました。再アップロード可能です。' : 'Semua lowongan job berhasil dikosongkan. Siap untuk upload ulang.');
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'はい、全求人を削除' : 'Ya, Hapus Semua Job'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Lightbox Modal for 4x6 Preview */}
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
                  {lang === 'ja' ? '証明写真プレビュー (4×6 cm 比率)' : 'Pas Foto Kandidat (Ukuran 4×6 cm)'}
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
                {lang === 'ja' ? '日本標準履歴書写真規格 4×6 (比率 2:3)' : 'Standar Pas Foto 4×6 (Rasio 2:3)'}
              </span>
              <a
                href={previewPhotoZoom.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-purple-700 hover:text-purple-900 font-bold"
              >
                <span>{lang === 'ja' ? '原本写真を開く' : 'Buka Foto Asli'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Job Delete */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {lang === 'ja' ? '求人案件の削除' : 'Hapus Lowongan Job'}
                </h3>
                <p className="text-xs text-slate-500">{jobToDelete.kodeJob || 'Job ID'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {lang === 'ja' ? (
                <>
                  求人 <strong className="text-slate-900">"{getSanitizedJobTitle(jobToDelete, lang)}"</strong> ({formatPrefecture(jobToDelete.lokasiPrefektur, lang)}) を削除してもよろしいですか？この操作は元に戻せません。
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus job <strong className="text-slate-900">"{jobToDelete.judulPekerjaan}"</strong> ({jobToDelete.lokasiPrefektur})? Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </p>
            <div className="flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteJobPosting(jobToDelete.id);
                  const title = getSanitizedJobTitle(jobToDelete, lang);
                  setJobToDelete(null);
                  setToastMessage(lang === 'ja' ? `求人「${title}」を削除しました。` : `Job "${title}" berhasil dihapus.`);
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'この求人を削除' : 'Hapus Job Ini'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Data Checker Modal */}
      <DuplicateDataCheckerModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        portalContext="ADMIN_DOC"
      />
    </div>
  );
};

export default Admin2CVPortalView;

