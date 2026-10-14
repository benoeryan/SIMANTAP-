import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import { isIjefStudent } from '../utils/studentSourceHelper';
import { isSuperAdminUser, canUserAccessModule } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
import { AccountSettingsModal } from './auth/AccountSettingsModal';
import { LanguageSwitcher } from './common/LanguageSwitcher';
import {
  Building2,
  UserCheck,
  Stethoscope,
  Brain,
  FileCheck,
  Coins,
  FileText,
  UserPlus,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ChevronRight,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

export interface HeaderProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>> | ((open: boolean) => void);
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen: propSidebarOpen,
  setSidebarOpen: propSetSidebarOpen
}) => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    healthRecords,
    discRecords,
    psikotesRecords,
    financingRecords,
    contractRecords,
    setAdminPortalCategoryMode,
    masterSettings
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tSiswa,
    bilingual
  } = useEcosystemTranslation('adminSiswa');

  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const sidebarOpen = propSidebarOpen !== undefined ? propSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = propSetSidebarOpen || setInternalSidebarOpen;

  const isSuperAdmin = isSuperAdminUser(user, masterSettings?.adminUsers);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeHealth = activeStudent ? healthRecords[activeStudent.id] : null;
  const activeDisc = activeStudent ? discRecords[activeStudent.id] : null;
  const activePsikotes = activeStudent ? psikotesRecords[activeStudent.id] : null;
  const activeFinancing = activeStudent ? financingRecords[activeStudent.id] : null;
  const activeContract = activeStudent ? contractRecords[activeStudent.id] : null;

  const rawNavItems = [
    { id: 'master', label: lang === 'ja' ? '生徒マスターダッシュボード' : 'Dashboard Master Siswa', icon: Building2, color: 'emerald', desc: lang === 'ja' ? '生徒総合データベース' : 'Database Ringkasan Siswa' },
    { id: 'portal', label: lang === 'ja' ? '1. 生徒受付・登録' : '1. Portal Pendaftaran', icon: UserPlus, color: 'indigo', desc: lang === 'ja' ? '登録情報・提出書類管理' : 'Registrasi & Dokumen Siswa' },
    { id: 'kesehatan', label: lang === 'ja' ? '2. 健康診断（MCU）' : '2. Skrining Kesehatan', icon: Stethoscope, color: 'indigo', desc: lang === 'ja' ? 'Fit To Work判定・検査所見' : 'Fit To Work & Lab Medis' },
    { id: 'disc', label: lang === 'ja' ? '3. DISC適性診断' : '3. Asesmen DISC', icon: Brain, color: 'indigo', desc: lang === 'ja' ? '行動特性・職場適性分析' : 'Profil Kepribadian Kerja' },
    { id: 'psikotes', label: lang === 'ja' ? '4. 心理適性テスト（50問）' : '4. Psikotes 50 Soal', icon: FileCheck, color: 'indigo', desc: lang === 'ja' ? '論理・計算・業務適性' : 'Logika & Kuantitatif' },
    { id: 'dana', label: lang === 'ja' ? '5. 研修費用・サポート資金' : '5. Biaya Pelatihan LPK', icon: Coins, color: 'indigo', desc: lang === 'ja' ? '学費支援・分割計画管理' : 'Pembiayaan & Pendidikan LPK' },
    { id: 'kontrak', label: lang === 'ja' ? '6. 契約書・誓約書' : '6. Surat Perjanjian', icon: FileText, color: 'indigo', desc: lang === 'ja' ? '法的合意書・権利義務条項' : 'Legalitas & Pasal Kerja' },
    { id: 'settings', label: lang === 'ja' ? 'マスターシステム設定' : 'Pengaturan Master', icon: Settings, color: 'amber', desc: lang === 'ja' ? '料金体系・運用パラメータ' : 'Sistem & Tarif Biaya' },
    { id: 'petunjuk', label: lang === 'ja' ? '運用マニュアル・フロー' : 'Petunjuk & Hirarki Proses', icon: BookOpen, color: 'indigo', desc: lang === 'ja' ? '利用ガイドライン・手順' : 'Panduan Penggunaan & Flow SIM' },
  ];

  // Filter modules based on user authorization
  const navItems = rawNavItems.filter((item) => {
    if (item.id === 'settings') {
      return isSuperAdmin;
    }
    return canUserAccessModule(user, item.id, masterSettings?.adminUsers);
  });

  const currentNav = navItems.find((item) => item.id === activeTab) || navItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <>
      {/* Top Main Navigation Header Bar */}
      <header className="bg-white text-slate-800 border-b border-slate-200 shadow-sm">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between w-full md:w-auto gap-2 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {/* 3-Line Hamburger Menu Toggle Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition shadow-xs cursor-pointer min-h-[40px] flex items-center space-x-1.5 shrink-0"
                title={lang === 'ja' ? 'サイドバーナビゲーション メニューの開閉' : 'Buka / Tutup Menu Navigasi Sidebar'}
                aria-label="Toggle Navigation Sidebar Menu"
              >
                <Menu className="w-5 h-5 shrink-0 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950 hidden xs:inline">{lang === 'ja' ? 'メニュー' : 'Menu'}</span>
              </button>

              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 text-white font-black text-sm sm:text-lg flex items-center justify-center shadow-xs tracking-tight border border-emerald-500 shrink-0">
                  IJEF
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <h1 className="text-xs sm:text-base font-bold tracking-tight text-slate-900 truncate">
                      LPK IJEF CORP
                    </h1>
                    <span className="bg-emerald-50 text-emerald-700 text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 font-mono font-bold shrink-0">
                      SIM v2.6
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[180px] sm:max-w-none hidden xs:block">
                    {lang === 'ja'
                      ? '日本研修生 登録・選考管理システム'
                      : 'Sistem Informasi Manajemen Pendaftaran & Seleksi Pelatihan'}
                  </p>
                </div>
              </div>
            </div>

            {/* Active Current Module Pill Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs shrink-0">
              <CurrentIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-800 text-[11px] max-w-[130px] md:max-w-none truncate">
                {currentNav.label}
              </span>
            </div>
          </div>

          {/* Right Section: Candidate Selector, Search, & User Profile / Logout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto min-w-0">
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '生徒検索 (氏名/身分証番号)...' : 'Cari siswa (Nama/NIK)...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-xs text-slate-800 pl-8 pr-2 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400 min-w-0"
                />
              </div>

              <div className="flex items-center space-x-1.5 pr-1 min-w-0">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => setSelectedStudentId(e.target.value || null)}
                  className="w-full sm:w-auto bg-white text-xs text-slate-800 px-2 py-1.5 rounded-md border border-slate-300 font-medium focus:outline-none focus:border-emerald-500 max-w-[140px] sm:max-w-[180px] truncate min-w-0"
                >
                  {students
                    .filter(
                      (s) =>
                        s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.noKtp.includes(searchTerm)
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} ({s.id})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher variant="pill" className="shrink-0" />

            {/* User Profile, Account Settings & Logout */}
            {user && (
              <div className="flex items-center justify-between sm:justify-start space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl shrink-0 min-w-0">
                <div className="flex items-center space-x-2 text-xs min-w-0">
                  <div className={`p-1 rounded-full ${role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} shrink-0`}>
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-[11px] leading-tight max-w-[120px] sm:max-w-[160px] truncate">
                      {user.displayName || user.email}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-mono font-bold capitalize truncate">
                      {user.adminRole || (role === 'admin' ? (lang === 'ja' ? '• 生徒管理担当' : '• Admin Siswa (SIBAL)') : (lang === 'ja' ? '• 生徒ポータル' : '• Portal Siswa'))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAccountSettingsOpen(true)}
                  title={lang === 'ja' ? 'アカウント設定' : 'Setting Akun Admin Siswa'}
                  className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0 border border-slate-200"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  title={lang === 'ja' ? 'ログアウト' : 'Keluar / Logout'}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Student Quick Progress Tracker Bar */}
        {activeStudent && (
          <div className="bg-slate-50 border-t border-b border-slate-200 px-3 sm:px-6 py-2 text-xs">
            <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-medium text-slate-500">{lang === 'ja' ? '選択中生徒:' : 'Siswa Terpilih:'}</span>
                <span className="font-bold text-slate-900">{activeStudent.namaLengkap}</span>
                <span className="text-slate-500 font-mono text-[11px]">{lang === 'ja' ? '身分証番号:' : 'NIK:'} {activeStudent.noKtp}</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                  {activeStudent.statusPendaftaran}
                </span>
              </div>

              {/* Quick Status Chips */}
              <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] font-mono overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none touch-pan-x">
                <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-600">{lang === 'ja' ? '健康診断:' : 'Medis:'}</span>
                  {activeHealth ? (
                    <span
                      className={
                        activeHealth.statusFit === 'FIT'
                          ? 'text-emerald-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }
                    >
                      {activeHealth.statusFit}
                    </span>
                  ) : (
                    <span className="text-slate-400">{lang === 'ja' ? '未受検' : 'Belum'}</span>
                  )}
                </span>

                <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <Brain className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="text-slate-600">DISC:</span>
                  {activeDisc ? (
                    <span className="text-purple-700 font-bold">{activeDisc.dominantType}</span>
                  ) : (
                    <span className="text-slate-400">{lang === 'ja' ? '未診断' : 'Belum'}</span>
                  )}
                </span>

                <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-600">{lang === 'ja' ? '適性テスト:' : 'Psikotes:'}</span>
                  {activePsikotes ? (
                    <span
                      className={
                        activePsikotes.statusKelulusan === 'LULUS'
                          ? 'text-emerald-700 font-bold'
                          : 'text-rose-700 font-bold'
                      }
                    >
                      {activePsikotes.scorePercentage}% ({activePsikotes.statusKelulusan === 'LULUS' ? (lang === 'ja' ? '合格' : 'LULUS') : (lang === 'ja' ? '不合格' : 'TIDAK LULUS')})
                    </span>
                  ) : (
                    <span className="text-slate-400">{lang === 'ja' ? '未受験' : 'Belum'}</span>
                  )}
                </span>

                <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-slate-600">{lang === 'ja' ? '費用:' : 'Dana:'}</span>
                  {activeFinancing ? (
                    <span className="text-amber-800 font-bold">
                      {lang === 'ja'
                        ? (activeFinancing.programOption === 'TALANGAN' || activeFinancing.skemaPilihan?.includes('DT') ? '立替金支援' : '自己負担/一括')
                        : activeFinancing.programOption}
                    </span>
                  ) : (
                    <span className="text-slate-400">{lang === 'ja' ? '未設定' : 'Belum'}</span>
                  )}
                </span>

                <span className="flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-600">{lang === 'ja' ? '契約書:' : 'Kontrak:'}</span>
                  {activeContract ? (
                    <span className="text-emerald-700 font-bold">
                      {lang === 'ja'
                        ? (activeContract.statusPersetujuan === 'SAH' ? '締結済' : activeContract.statusPersetujuan === 'DRAFT' ? '下書き' : (activeContract.statusPersetujuan as string) === 'DITOLAK' ? '却下' : activeContract.statusPersetujuan)
                        : activeContract.statusPersetujuan}
                    </span>
                  ) : (
                    <span className="text-slate-400">{lang === 'ja' ? '未作成' : 'Draft'}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ======================================================================== */}
      {/* LEFT SIDEBAR DRAWER MENU                                                 */}
      {/* On Mobile/Tablet (<lg): Slide-over drawer with backdrop overlay         */}
      {/* On Desktop (>=lg): Fixed side-by-side sidebar with independent scrolling */}
      {/* ======================================================================== */}

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
        className={`fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] sm:w-80 bg-white border-r border-slate-200 text-slate-800 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-xs border border-emerald-500">
              IJEF
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">LPK IJEF CORP</h2>
              <p className="text-[10px] text-emerald-700 font-mono font-bold">
                {lang === 'ja' ? 'SIM ナビゲーション' : 'Modul Navigasi SIM'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-200 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={lang === 'ja' ? 'メニューを閉じる' : 'Tutup Menu Sidebar'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Student Quick Info Card inside Sidebar */}
        {activeStudent && (
          <div className="p-3 mx-3 mt-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
              {lang === 'ja' ? '現在選択中の生徒' : 'Siswa Terpilih Saat Ini'}
            </div>
            <div className="font-bold text-slate-900 truncate">{activeStudent.namaLengkap}</div>
            <div className="text-[11px] text-slate-600 font-mono flex items-center justify-between">
              <span>{lang === 'ja' ? '身分証番号:' : 'NIK:'} {activeStudent.noKtp}</span>
              <span className="text-emerald-700 font-bold">{activeStudent.statusPendaftaran}</span>
            </div>
          </div>
        )}

        {/* Sidebar Navigation Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            {lang === 'ja' ? '主要研修管理モジュール' : 'Modul Utama SIM Pelatihan'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            let activeBg = 'bg-indigo-600 text-white shadow-xs';
            if (item.color === 'emerald') {
              activeBg = 'bg-emerald-600 text-white shadow-xs';
            } else if (item.color === 'amber') {
              activeBg = 'bg-amber-600 text-white shadow-xs';
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition min-h-[46px] group cursor-pointer ${
                  isActive
                    ? `${activeBg}`
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:text-emerald-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-snug truncate">{item.label}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-600'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'text-white translate-x-0.5' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: User Profile & Security Info */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          {user && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.displayName || user.email}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono font-bold">
                    {isSuperAdmin
                      ? (lang === 'ja' ? '• スーパー管理者' : '• Super Admin IJEF')
                      : user.adminRole
                      ? `• ${user.adminRole}`
                      : role === 'admin'
                      ? (lang === 'ja' ? '• IJEF 管理スタッフ' : '• Staf Admin IJEF')
                      : (lang === 'ja' ? '• 生徒' : '• Siswa')}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={() => setAccountSettingsOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                  title={lang === 'ja' ? 'アカウント設定' : 'Setting Akun Admin Siswa'}
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                  title={lang === 'ja' ? 'ログアウト' : 'Keluar / Logout'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-mono pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{lang === 'ja' ? 'Firestore 暗号化通信' : 'Koneksi Firestore Encrypted'}</span>
          </div>
        </div>
      </aside>

      {/* Account Settings Modal Admin 1 */}
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        portalType="ADMIN_1_IJEF"
      />
    </>
  );
};




