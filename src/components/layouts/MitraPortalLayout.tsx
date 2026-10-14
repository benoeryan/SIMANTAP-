import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useDevice } from '../../hooks/useDevice';
import { isJobActiveAndAvailable } from '../../utils/mitraJobUtils';
import { MitraDashboardProgress } from '../mitra/MitraDashboardProgress';
import { MitraJobListing } from '../mitra/MitraJobListing';
import { MitraStudentClassification } from '../mitra/MitraStudentClassification';
import { MitraApplicationsTracker } from '../mitra/MitraApplicationsTracker';
import { MitraApprovalTrackerView } from '../mitra/MitraApprovalTrackerView';
import {
  Building2,
  Users,
  Briefcase,
  Layers,
  FileCheck2,
  LogOut,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  Smartphone,
  Tablet,
  Laptop,
  Monitor
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminPortalSwitcher } from '../auth/SuperAdminPortalSwitcher';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

type MitraTab = 'DASHBOARD' | 'JOBS' | 'STUDENTS' | 'APPLICATIONS' | 'APPROVALS';

export const MitraPortalLayout: React.FC = () => {
  const { user, logout, role, setDemoSession } = useAuth();
  const { jobPostings, jobApplications, lang, t } = useApp();
  const navigate = useNavigate();
  const device = useDevice();

  const [activeTab, setActiveTab] = useState<MitraTab>('DASHBOARD');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOrgInfo, setShowOrgInfo] = useState(false);

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Mandiri Indonesia';
  const mitraId = user?.mitraId || 'MTR-2026-088';

  // Only count active & available jobs for partner display
  const activeJobsCount = useMemo(() => {
    return jobPostings.filter(isJobActiveAndAvailable).length;
  }, [jobPostings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDeviceIcon = () => {
    if (device.isMobile) return <Smartphone className="w-3 h-3 text-indigo-500" />;
    if (device.isTablet) return <Tablet className="w-3 h-3 text-indigo-500" />;
    if (device.isLaptop) return <Laptop className="w-3 h-3 text-indigo-500" />;
    return <Monitor className="w-3 h-3 text-indigo-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans pb-16 md:pb-0">
      {/* Locked Sticky Header Section for Mitra Portal */}
      <div className="sticky top-0 z-40 bg-white shadow-xs">
        {/* Super Admin Universal Portal Switcher */}
        <SuperAdminPortalSwitcher />

        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-3">
              {/* Logo & Portal Brand */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-900 to-slate-900 flex items-center justify-center text-amber-400 font-black shadow-sm shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight shrink-0">
                      IJEF CORP
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                      {lang === 'ja' ? '受入企業・パートナーポータル' : 'PORTAL MITRA'}
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
                    {lang === 'ja' 
                      ? '日本受入機関・特定技能マッチング・選考状況管理システム' 
                      : 'Sistem Informasi Kemitraan & Penempatan Kerja Jepang'}
                  </div>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 flex-wrap justify-center">
                <button
                  onClick={() => setActiveTab('DASHBOARD')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activeTab === 'DASHBOARD'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ja' ? 'ダッシュボード' : 'Dashboard'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('JOBS')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activeTab === 'JOBS'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ja' ? '求人票一覧' : 'Lowongan'}</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-indigo-100 text-indigo-800 rounded-full font-bold">
                    {activeJobsCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('STUDENTS')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activeTab === 'STUDENTS'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ja' ? '推薦候補生一覧' : 'Kandidat'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('APPLICATIONS')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activeTab === 'APPLICATIONS'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ja' ? '応募・選考管理' : 'Pelacak Lamaran'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('APPROVALS')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    activeTab === 'APPROVALS'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{lang === 'ja' ? '申請ステータス' : 'Status Pengajuan'}</span>
                </button>
              </nav>

              {/* Right Action: Language Switcher, Org Info & Logout */}
              <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                <LanguageSwitcher variant="pill" className="shrink-0" />

                <button
                  onClick={() => setShowOrgInfo(true)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-2 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition cursor-pointer shrink-0"
                >
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 max-w-[130px]">
                    <div className="text-xs font-bold text-slate-900 truncate">{mitraName}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">ID: {mitraId}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                  title={t.common.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="flex lg:hidden items-center gap-1.5 shrink-0">
                <LanguageSwitcher variant="compact" className="shrink-0" />
                <button
                  onClick={() => setShowOrgInfo(true)}
                  className="p-2 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl transition cursor-pointer text-xs font-bold shrink-0"
                  title="Info Lembaga"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sub-header Navigation Tabs for medium screens (lg only) */}
          <div className="hidden lg:flex xl:hidden border-t border-slate-100 px-4 py-2 bg-slate-50/80 overflow-x-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ja' ? 'ダッシュボード' : 'Dashboard Progres'}</span>
              </button>

              <button
                onClick={() => setActiveTab('JOBS')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'JOBS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ja' ? '求人票一覧' : 'Listing Lowongan Job'}</span>
                <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                  activeTab === 'JOBS' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {activeJobsCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('STUDENTS')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'STUDENTS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ja' ? '推薦候補生一覧' : 'Klasifikasi Bidang Kerja'}</span>
              </button>

              <button
                onClick={() => setActiveTab('APPLICATIONS')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'APPLICATIONS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'ja' ? '応募・選考管理' : 'Pelacak Lamaran'}</span>
              </button>

              <button
                onClick={() => setActiveTab('APPROVALS')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'APPROVALS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                <span>{lang === 'ja' ? '申請ステータス' : 'Status Pengajuan'}</span>
              </button>
            </div>
          </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-2 animate-slide-in">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 mb-3">
              <div className="text-xs font-bold text-indigo-950">{mitraName}</div>
              <div className="text-[11px] text-indigo-700">{lang === 'ja' ? '提携ID:' : 'Mitra ID:'} {mitraId}</div>
            </div>

            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{lang === 'ja' ? 'ダッシュボード進捗' : 'Dashboard Progres'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('JOBS');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'JOBS' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>{lang === 'ja' ? `求人情報一覧 (${activeJobsCount})` : `Listing Lowongan Job (${activeJobsCount})`}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('STUDENTS');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'STUDENTS' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{lang === 'ja' ? '専門分野別・候補生管理' : 'Klasifikasi Bidang Kerja'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('APPLICATIONS');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'APPLICATIONS' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{lang === 'ja' ? '応募・選考進捗管理' : 'Pelacak Lamaran'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('APPROVALS');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'APPROVALS' ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ja' ? '申請・承認ステータス' : 'Status Pengajuan'}</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowOrgInfo(true);
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold text-indigo-700 py-2"
              >
                {lang === 'ja' ? '提携機関プロファイル' : 'Info Lembaga Mitra'}
              </button>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-rose-600 py-2 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'ログアウト' : 'Keluar'}</span>
              </button>
            </div>
          </div>
        )}
      </header>
      </div>

      {/* Main Content View */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'DASHBOARD' && (
          <MitraDashboardProgress onNavigateTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'JOBS' && <MitraJobListing />}

        {activeTab === 'STUDENTS' && <MitraStudentClassification />}

        {activeTab === 'APPLICATIONS' && <MitraApplicationsTracker />}

        {activeTab === 'APPROVALS' && <MitraApprovalTrackerView />}
      </main>

      {/* Responsive Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 shadow-lg px-1 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'DASHBOARD' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">{lang === 'ja' ? 'ダッシュボード' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition relative ${
            activeTab === 'JOBS' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">{lang === 'ja' ? '求人一覧' : 'Lowongan'}</span>
          <span className="absolute top-0 right-1 px-1 py-0.2 rounded-full text-[8px] bg-indigo-600 text-white font-bold">
            {activeJobsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'STUDENTS' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">{lang === 'ja' ? '候補生' : 'Kandidat'}</span>
        </button>

        <button
          onClick={() => setActiveTab('APPLICATIONS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'APPLICATIONS' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span className="text-[9px] mt-0.5">{lang === 'ja' ? '応募進捗' : 'Lamaran'}</span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVALS')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'APPROVALS' ? 'text-indigo-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-amber-600" />
          <span className="text-[9px] mt-0.5">{lang === 'ja' ? '申請' : 'Approval'}</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8 sm:mt-12">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>
              {lang === 'ja'
                ? `戦略的提携機関ポータル © ${new Date().getFullYear()} LPK IJEF CORP • 無断転載を禁じます。`
                : `Portal Kemitraan Strategis © ${new Date().getFullYear()} LPK IJEF CORP • All Rights Reserved.`}
            </span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
              {getDeviceIcon()}
              <span>{device.deviceLabel}</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Modal Organization Profile */}
      {showOrgInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                  {lang === 'ja' ? '提携機関プロファイル' : 'Profil Lembaga Mitra'}
                </span>
                <h3 className="text-base font-black text-white mt-1">{mitraName}</h3>
                <p className="text-xs text-slate-300">{lang === 'ja' ? '提携認証コード:' : 'Kode Kemitraan:'} {mitraId}</p>
              </div>
              <button
                onClick={() => setShowOrgInfo(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">{lang === 'ja' ? '提携ステータス:' : 'Status Kemitraan:'}</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'ja' ? '有効・認証済み' : 'Aktif & Terverifikasi'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">{lang === 'ja' ? '機関分類:' : 'Kategori Lembaga:'}</span>
                  <span className="font-bold">{lang === 'ja' ? 'LPK / 送出機関 / 提携教育機関' : 'LPK / Asosiasi Mitra Kerja Sama'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">{lang === 'ja' ? '受入・送出プログラム:' : 'Program Penempatan:'}</span>
                  <span className="font-bold">{lang === 'ja' ? '特定技能 (SSW) & 技人国 (技術・人文知識・国際業務)' : 'Tokutei Ginou (SSW) & Gijinkoku'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">{lang === 'ja' ? '登録アカウントEmail:' : 'Email Akun:'}</span>
                  <span className="font-mono text-[11px] font-bold text-indigo-700">{user?.email}</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-[11px] text-indigo-900 leading-relaxed">
                {lang === 'ja'
                  ? '提携機関アカウントには、全求人カタログの閲覧、推薦候補生の登録、面接日時の確認および選考進捗のリアルタイム管理権限が付与されています。'
                  : 'Mitra memiliki hak akses untuk menelusuri seluruh listing lowongan pekerjaan admin, merekomendasikan siswa binaan, serta memantau jadwal dan hasil wawancara kerja.'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowOrgInfo(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? '閉じる' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

