import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import useSyncCRMLead from '../../hooks/useSyncCRMLead';
import { CandidateCategory, CalonSiswa } from '../../types';
import { isIjefCategory } from '../../utils/candidateUtils';
import { translateCandidateCategory } from '../../utils/mitraJobUtils';
import {
  GraduationCap,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  UserPlus,
  Brain,
  FileCheck,
  CheckSquare,
  UploadCloud,
  Stethoscope,
  ChevronRight,
  FileText,
  Sparkles,
  Briefcase,
  LayoutDashboard
} from 'lucide-react';
import { CandidatePortal } from '../CandidatePortal';
import { RirekishoBuilder } from '../cvportal/RirekishoBuilder';
import { JobMatchingPortal } from '../cvportal/JobMatchingPortal';
import { StudentMonitoringDashboard } from '../StudentMonitoringDashboard';
import { SuperAdminPortalSwitcher } from '../auth/SuperAdminPortalSwitcher';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { students, activeStudent, selectedStudentId, setSelectedStudentId, lang, t } = useApp();
  const navigate = useNavigate();
  const { leadData, loading: crmLoading } = useSyncCRMLead();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedStudentObj = selectedStudentId
    ? students.find((s) => s.id === selectedStudentId)
    : null;

  const studentByEmail = user?.email
    ? students.find(
        (s) =>
          s.email?.toLowerCase().trim() === user.email?.toLowerCase().trim() ||
          s.id === user?.uid ||
          s.id === user?.email
      )
    : null;

  // Match logged in student in Firestore database
  const matchedStudent: CalonSiswa = React.useMemo(() => {
    let base = user?.role === 'admin'
      ? (selectedStudentObj || activeStudent || studentByEmail || (students.length > 0 ? students[0] : {
          id: user?.uid || `SISWA-${Date.now()}`,
          namaLengkap: user?.displayName || 'Siswa',
          email: user?.email || '',
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
          email: user?.email || '',
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

    if (user?.role === 'siswa' && user?.displayName) {
      base = {
        ...base,
        namaLengkap: user.displayName,
        email: user.email || base.email
      };
    }
    return base;
  }, [user, selectedStudentObj, activeStudent, studentByEmail, students]);

  // Synchronize selectedStudentId in AppContext if candidate is identified
  useEffect(() => {
    if (matchedStudent?.id && selectedStudentId !== matchedStudent.id && user?.role === 'siswa') {
      setSelectedStudentId(matchedStudent.id);
    }
  }, [matchedStudent?.id, selectedStudentId, setSelectedStudentId, user?.role]);

  // Active subtab & form step state for IJEF candidates
  const [activePortalSubTab, setActivePortalSubTab] = useState<
    'dashboard' | 'pendaftaran' | 'disc' | 'psikotes' | 'status'
  >('dashboard');
  const [formStep, setFormStep] = useState<number>(1);

  // Active subtab state for Non-IJEF CV-Portal candidates
  const [nonIjefTab, setNonIjefTab] = useState<'dashboard' | 'biodata' | 'rirekisho' | 'job_matching'>('dashboard');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine candidate category - prioritize matchedStudent!
  const candidateCategory: CandidateCategory =
    matchedStudent?.kategoriKandidat ||
    leadData?.kategoriKandidat ||
    (user?.role === 'admin' ? activeStudent?.kategoriKandidat : null) ||
    'SISWA NON IJEF';
  const isIjefStudent = isIjefCategory(candidateCategory);

  const studentNavItems = [
    {
      id: 'dashboard',
      step: 1,
      label: lang === 'ja' ? '生徒ダッシュボード' : 'Dashboard Monitoring Siswa',
      desc: lang === 'ja' ? 'リアルタイム進捗・選考状況' : 'Status Real-time & Alur SIM',
      icon: LayoutDashboard,
      color: 'emerald'
    },
    {
      id: 'pendaftaran',
      step: 1,
      label: lang === 'ja' ? '1. 基本登録フォーム' : '1. Form Pendaftaran',
      desc: lang === 'ja' ? '基本情報・証明写真' : 'Biodata Demografi & Pasfoto',
      icon: UserPlus,
      color: 'amber'
    },
    {
      id: 'pendaftaran',
      step: 2,
      label: lang === 'ja' ? '2. 保護者・保証人情報' : '2. Data Orang Tua / Penjamin',
      desc: lang === 'ja' ? '職業・住所・緊急連絡先' : 'Pekerjaan, Alamat & Kontak',
      icon: FileText,
      color: 'amber'
    },
    {
      id: 'pendaftaran',
      step: 3,
      label: lang === 'ja' ? '3. 健康診断・問診票' : '3. Skrining Kesehatan Mandiri',
      desc: lang === 'ja' ? '既往歴・健康状態チェック' : 'Riwayat Penyakit & Fit Test',
      icon: Stethoscope,
      color: 'amber'
    },
    {
      id: 'pendaftaran',
      step: 4,
      label: lang === 'ja' ? '4. 書類・資格証提出' : '4. Unggah Dokumen & Berkas',
      desc: lang === 'ja' ? '身分証・卒業証書・認定書' : 'KTP, KK, Ijazah & Sertifikat',
      icon: UploadCloud,
      color: 'amber'
    },
    {
      id: 'disc',
      step: 1,
      label: lang === 'ja' ? '5. DISC性格適性検査' : '5. Asesmen Kepribadian DISC',
      desc: lang === 'ja' ? '24問自己適性評価' : '24 Set Soal Evaluasi Diri',
      icon: Brain,
      color: 'purple'
    },
    {
      id: 'psikotes',
      step: 1,
      label: lang === 'ja' ? '6. 心理適性テスト（50問）' : '6. Ujian Psikotes 50 Soal',
      desc: lang === 'ja' ? '論理・計算・言語理解' : 'Logika, Numerik & Verbal',
      icon: FileCheck,
      color: 'indigo'
    },
    {
      id: 'status',
      step: 1,
      label: lang === 'ja' ? '7. 提出書類・契約確認' : '7. Status Berkas & Legalitas',
      desc: lang === 'ja' ? '資格基準・誓約事項' : 'Kualifikasi & Syarat Akad',
      icon: CheckSquare,
      color: 'emerald'
    }
  ];

  const currentNav = studentNavItems.find(
    (item) => item.id === activePortalSubTab && item.step === formStep
  ) || studentNavItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Sticky Locked Header Section for Student Portal */}
      <div className="sticky top-0 z-40 bg-white shadow-xs">
        <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}>
          {/* Super Admin Universal Portal Switcher (Only visible when SuperAdmin is logged in) */}
          <SuperAdminPortalSwitcher />

          {/* Clean Student Header */}
          <header className="bg-white border-b border-slate-200">
            <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
              {/* Student Portal Branding & 3-Line Menu Trigger */}
              <div className="flex items-center justify-between space-x-2 sm:space-x-3 w-full sm:w-auto min-w-0">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-amber-700 hover:text-amber-800 rounded-xl border border-slate-300 transition shadow-xs cursor-pointer min-h-[40px] flex items-center space-x-1.5 shrink-0"
                    title="Buka / Tutup Menu Portal Siswa"
                    aria-label="Toggle Student Portal Navigation Sidebar"
                  >
                    <Menu className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 hidden xs:inline">Menu</span>
                  </button>

                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500 text-slate-950 font-black text-sm sm:text-lg flex items-center justify-center shadow-xs tracking-tight border border-amber-600/30 shrink-0">
                    IJEF
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <h1 className="text-xs sm:text-base font-bold tracking-tight text-slate-900 truncate">
                        LPK IJEF CORP
                      </h1>
                      <span className="bg-amber-100 text-amber-800 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full border border-amber-300 font-extrabold uppercase tracking-wider shrink-0">
                        {isIjefStudent
                          ? (lang === 'ja' ? 'IJEF生ポータル' : 'Portal Siswa IJEF')
                          : (lang === 'ja' ? '非IJEF・外部ポータル' : 'CV-Portal Non-IJEF')}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-none hidden xs:block">
                      {lang === 'ja'
                        ? '日本研修・就職マッチング管理システム'
                        : 'Sistem Informasi Pendaftaran & Matching Job Pelatihan Jepang'}
                    </p>
                  </div>
                </div>

                {/* Category Badge Banner */}
                <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-900 text-[11px] truncate">
                    {lang === 'ja'
                      ? `区分: ${translateCandidateCategory(candidateCategory, lang)}`
                      : `Kategori: ${candidateCategory}`}
                  </span>
                </div>
              </div>

              {/* Language Switcher & User Profile & Logout Button */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                <LanguageSwitcher variant="pill" className="shrink-0" />

                {user && (
                  <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl shrink-0 min-w-0">
                    <div className="flex items-center space-x-1.5 text-xs min-w-0">
                      <div className="p-1 rounded-lg bg-amber-200 text-amber-800 shrink-0">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs max-w-[120px] xs:max-w-[160px] truncate">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-[10px] text-amber-800 font-medium truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="h-5 w-px bg-slate-300 shrink-0" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition cursor-pointer min-h-[32px] shrink-0"
                      title={t.common.logout}
                    >
                      <LogOut className="w-3 h-3 shrink-0" />
                      <span className="inline">{t.common.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Non-IJEF Navigation Subtab Bar (if candidate is Non-IJEF or Matching Job) */}
          {!isIjefStudent && (
            <div className="bg-white border-b border-slate-200 px-4 py-3">
              <div className="w-full px-1 sm:px-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-bold">CV-Portal:</span>
                  <span className="text-slate-600">
                    {lang === 'ja'
                      ? '進捗ステータス確認・書類提出・JIS履歴書作成・求人応募'
                      : 'Pantau dashboard status, lengkapi berkas, buat Rirekisho JIS & lamar pekerjaan'}
                  </span>
                </div>

                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                  <button
                    onClick={() => {
                      setNonIjefTab('dashboard');
                      setActivePortalSubTab('dashboard');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      nonIjefTab === 'dashboard' && activePortalSubTab === 'dashboard'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'ja' ? 'ダッシュボード' : 'Dashboard'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setNonIjefTab('biodata');
                      setActivePortalSubTab('pendaftaran');
                      setFormStep(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      nonIjefTab === 'biodata' || activePortalSubTab === 'pendaftaran'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-purple-300" />
                    <span>{lang === 'ja' ? '1. 基本情報・書類' : '1. Biodata & Berkas'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setNonIjefTab('rirekisho');
                      setActivePortalSubTab('pendaftaran');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      nonIjefTab === 'rirekisho'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-300" />
                    <span>{lang === 'ja' ? '2. JIS履歴書' : '2. Rirekisho CV JIS'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setNonIjefTab('job_matching');
                      setActivePortalSubTab('pendaftaran');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      nonIjefTab === 'job_matching'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                    <span>{lang === 'ja' ? '3. 日本求人マッチング' : '3. Lowongan Matching Japan'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col justify-between transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}>
        {/* Main Candidate Content */}
        <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1">
          {activePortalSubTab === 'dashboard' || (!isIjefStudent && nonIjefTab === 'dashboard') ? (
            <StudentMonitoringDashboard
              onNavigateToTab={(tab, step) => {
                if (tab === 'rirekisho' || tab === 'job_matching') {
                  setNonIjefTab(tab);
                  setActivePortalSubTab('pendaftaran');
                } else if (tab === 'pendaftaran' && !isIjefStudent) {
                  setNonIjefTab('biodata');
                  setActivePortalSubTab('pendaftaran');
                  if (step) setFormStep(step);
                } else {
                  setActivePortalSubTab(tab as any);
                  if (step) setFormStep(step);
                }
              }}
            />
          ) : isIjefStudent || nonIjefTab === 'biodata' || activePortalSubTab === 'pendaftaran' || activePortalSubTab === 'status' ? (
            /* CANDIDATE PORTAL (Handles both IJEF and Non-IJEF with smart bypass for step 3/DISC/Psikotes) */
            <CandidatePortal
              activePortalSubTab={activePortalSubTab as any}
              setActivePortalSubTab={setActivePortalSubTab as any}
              formStep={formStep}
              setFormStep={setFormStep}
            />
          ) : (
            /* NON-IJEF CV-PORTAL WORKFLOW (Rirekisho / Job Matching) */
            <>
              {nonIjefTab === 'rirekisho' && <RirekishoBuilder />}
              {nonIjefTab === 'job_matching' && <JobMatchingPortal />}
            </>
          )}
        </main>

        {/* Student Footer */}
        <footer className="bg-white text-slate-600 py-4 px-4 border-t border-slate-200 text-xs mt-8">
          <div className="w-full px-1 sm:px-3 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-slate-700 font-medium text-xs">
                {lang === 'ja'
                  ? `LPK IJEF CORP 候補生・求人ポータル • ${translateCandidateCategory(candidateCategory, lang)}`
                  : `Portal Siswa & CV-Portal LPK IJEF CORP • ${candidateCategory}`}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {lang === 'ja'
                  ? 'Firebase認証＆Firestore DB 暗号化通信'
                  : 'Koneksi Akses Terenkripsi Firebase Auth & Firestore DB'}
              </span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile & Tablet Backdrop Overlay (< lg only) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Left Collapsible Slide-Over Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] sm:w-80 bg-white border-r border-slate-200 text-slate-900 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 font-black text-base flex items-center justify-center shadow-xs border border-amber-600/30">
              IJEF
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                {isIjefStudent
                  ? (lang === 'ja' ? 'IJEF生ポータル' : 'Portal Siswa IJEF')
                  : (lang === 'ja' ? '非IJEF・外部ポータル' : 'CV-Portal Non-IJEF')}
              </h2>
              <p className="text-[10px] text-amber-800 font-mono font-semibold">
                {lang === 'ja' ? 'マイページ・登録ポータル' : 'Modul Mandiri Pendaftaran'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={lang === 'ja' ? 'サイドバーを閉じる' : 'Tutup Sidebar Portal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Profile Info Card inside Sidebar */}
        {user && (
          <div className="p-3 mx-3 mt-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>{lang === 'ja' ? '認証済候補生' : 'Kandidat Terverifikasi'}</span>
              <Briefcase className="w-3 h-3 text-amber-700" />
            </div>
            <div className="font-bold text-slate-900 truncate">{user.displayName || user.email}</div>
            <div className="text-[10px] text-amber-900 font-mono font-bold truncate">
              {lang === 'ja'
                ? `区分: ${translateCandidateCategory(candidateCategory, lang)}`
                : `Kategori: ${candidateCategory}`}
            </div>
          </div>
        )}

        {/* Sidebar Navigation Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            {lang === 'ja'
              ? (isIjefStudent ? '登録・選考ステップ' : '履歴書・求人マッチング')
              : `Tahapan ${isIjefStudent ? 'Pendaftaran & Seleksi' : 'CV & Matching Job'}`}
          </div>

          {isIjefStudent ? (
            studentNavItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activePortalSubTab === item.id && formStep === item.step;

              return (
                <button
                  key={`${item.id}-${item.step}-${idx}`}
                  onClick={() => {
                    setActivePortalSubTab(item.id as any);
                    setFormStep(item.step);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition min-h-[46px] group cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-slate-100 text-slate-500 group-hover:text-amber-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-snug truncate">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-slate-950 font-medium' : 'text-slate-500 group-hover:text-slate-600'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-slate-950 translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                </button>
              );
            })
          ) : (
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setNonIjefTab('dashboard');
                  setActivePortalSubTab('dashboard');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                  nonIjefTab === 'dashboard' && activePortalSubTab === 'dashboard'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold">
                      {lang === 'ja' ? '1. 生徒ダッシュボード' : '1. Dashboard Monitoring Siswa'}
                    </div>
                    <div className="text-[10px] text-purple-200">
                      {lang === 'ja' ? 'リアルタイム進捗・選考状況' : 'Status Alur & Progres SIM'}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setNonIjefTab('biodata');
                  setActivePortalSubTab('pendaftaran');
                  setFormStep(1);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                  nonIjefTab === 'biodata' || (activePortalSubTab === 'pendaftaran' && nonIjefTab !== 'rirekisho' && nonIjefTab !== 'job_matching')
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold">
                      {lang === 'ja' ? '2. 基本情報・書類' : '2. Biodata & Berkas Dokumen'}
                    </div>
                    <div className="text-[10px] text-purple-200">
                      {lang === 'ja' ? '基本情報入力・書類提出' : 'Isi Biodata & Unggah Dokumen'}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setNonIjefTab('rirekisho');
                  setActivePortalSubTab('pendaftaran');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                  nonIjefTab === 'rirekisho'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold">
                      {lang === 'ja' ? '3. JIS規格履歴書' : '3. Rirekisho CV JIS'}
                    </div>
                    <div className="text-[10px] text-purple-200">
                      {lang === 'ja' ? 'JIS履歴書作成・編集' : 'Isi / Lengkapi Form CV'}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setNonIjefTab('job_matching');
                  setActivePortalSubTab('pendaftaran');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                  nonIjefTab === 'job_matching'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold">
                      {lang === 'ja' ? '4. 日本求人マッチング' : '4. Catalog Job Matching'}
                    </div>
                    <div className="text-[10px] text-purple-200">
                      {lang === 'ja' ? '日本企業求人へ応募' : 'Lamar Lowongan Jepang'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition cursor-pointer min-h-[40px]"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'ja' ? 'ポータルからログアウト' : 'Keluar dari Portal'}</span>
          </button>

          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-mono pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{lang === 'ja' ? 'Firestore 暗号化通信' : 'Koneksi Firestore Encrypted'}</span>
          </div>
        </div>
      </aside>
    </div>
  );
};


