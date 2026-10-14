import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { isSuperAdminUser } from '../../utils/authUtils';
import {
  Crown,
  Building2,
  Sparkles,
  Users,
  GraduationCap,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Eye,
  Sliders,
  ExternalLink,
  Check,
  Megaphone
} from 'lucide-react';

interface SuperAdminPortalSwitcherProps {
  compact?: boolean;
}

export const SuperAdminPortalSwitcher: React.FC<SuperAdminPortalSwitcherProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const {
    adminPortalCategoryMode,
    setAdminPortalCategoryMode,
    students,
    selectedStudentId,
    setSelectedStudentId,
    masterSettings,
    lang
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  const isSuperAdmin = isSuperAdminUser(user, masterSettings?.adminUsers);

  // If NOT a Super Admin, do not render switcher bar at all
  if (!isSuperAdmin) {
    return null;
  }

  // Determine current active portal
  const currentPath = location.pathname;
  let activePortalLabel = lang === 'ja' ? '生徒管理者 (Admin Siswa)' : 'Admin Siswa (SIM-SB IJEF)';
  let activePortalKey: 'MARKETING' | 'ADMIN_1' | 'ADMIN_2' | 'MITRA' | 'SISWA' = 'ADMIN_1';

  if (currentPath.includes('portal-mitra')) {
    activePortalLabel = lang === 'ja' ? '提携機関ポータル (Mitra)' : 'Portal Mitra LPK';
    activePortalKey = 'MITRA';
  } else if (currentPath.includes('portal-siswa')) {
    activePortalLabel = lang === 'ja' ? '生徒・候補者ポータル' : 'Portal Siswa / Kandidat';
    activePortalKey = 'SISWA';
  } else if (adminPortalCategoryMode === 'MARKETING_PORTAL') {
    activePortalLabel = lang === 'ja' ? 'マーケティング & 生徒獲得CRM' : 'Portal Marketing & Intake CRM';
    activePortalKey = 'MARKETING';
  } else if (adminPortalCategoryMode === 'ADMIN_2_CV_PORTAL') {
    activePortalLabel = lang === 'ja' ? '書類・マッチング管理者 (Admin Doc)' : 'Admin Doc (CV-Portal & Job Matching)';
    activePortalKey = 'ADMIN_2';
  } else {
    activePortalLabel = lang === 'ja' ? '生徒管理者 (Admin Siswa)' : 'Admin Siswa (SIM-SB IJEF CORP)';
    activePortalKey = 'ADMIN_1';
  }

  const handleSwitchToMarketing = () => {
    setAdminPortalCategoryMode('MARKETING_PORTAL');
    if (currentPath !== '/admin/dashboard') {
      navigate('/admin/dashboard');
    }
    setDropdownOpen(false);
  };

  const handleSwitchToAdmin1 = () => {
    setAdminPortalCategoryMode('ADMIN_1_IJEF');
    if (currentPath !== '/admin/dashboard') {
      navigate('/admin/dashboard');
    }
    setDropdownOpen(false);
  };

  const handleSwitchToAdmin2 = () => {
    setAdminPortalCategoryMode('ADMIN_2_CV_PORTAL');
    if (currentPath !== '/admin/dashboard') {
      navigate('/admin/dashboard');
    }
    setDropdownOpen(false);
  };

  const handleSwitchToMitra = () => {
    navigate('/portal-mitra');
    setDropdownOpen(false);
  };

  const handleSwitchToStudent = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentId(studentId);
    }
    navigate('/portal-siswa');
    setDropdownOpen(false);
    setStudentDropdownOpen(false);
  };

  if (compact) {
    return (
      <div className="relative inline-block text-left z-40">
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-2.5 py-1.5 rounded-xl text-xs font-black shadow-md flex items-center space-x-1.5 transition cursor-pointer border border-amber-300"
          title={lang === 'ja' ? 'スーパー管理者ユニバーサルアクセス - 全ポータル切替' : 'Akses Universal Super Admin - Beralih ke Semua Portal'}
        >
          <Crown className="w-3.5 h-3.5 text-slate-950 shrink-0 animate-pulse" />
          <span className="truncate max-w-[130px] hidden sm:inline">{lang === 'ja' ? 'スーパー管理者' : 'Super Admin Portal'}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-45"
              onClick={() => setDropdownOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-2 text-white text-xs space-y-1 font-sans z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-amber-300">{lang === 'ja' ? 'スーパー管理者全権アクセス' : 'Akses Universal Super Admin'}</span>
              </div>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                BYPASS ALL
              </span>
            </div>

            <div className="p-1 space-y-1">
              <button
                type="button"
                onClick={handleSwitchToMarketing}
                className={`w-full text-left p-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                  activePortalKey === 'MARKETING'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-orange-400" />
                  <div>
                    <div>{lang === 'ja' ? '📢 マーケティング & CRM' : '📢 Portal Marketing & CRM'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang === 'ja' ? '見込み生徒獲得・全ポータル自動連携' : 'Input Calon Siswa & Integrasi Terpadu'}</div>
                  </div>
                </div>
                {activePortalKey === 'MARKETING' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={handleSwitchToAdmin1}
                className={`w-full text-left p-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                  activePortalKey === 'ADMIN_1'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div>{lang === 'ja' ? '🏛️ 生徒管理者 (Admin Siswa)' : '🏛️ Admin Siswa: SIM-SB IJEF'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang === 'ja' ? '生徒台帳、健康診断、DISC、契約書' : 'Master Siswa, MCU, DISC, Kontrak'}</div>
                  </div>
                </div>
                {activePortalKey === 'ADMIN_1' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={handleSwitchToAdmin2}
                className={`w-full text-left p-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                  activePortalKey === 'ADMIN_2'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <div>
                    <div>{lang === 'ja' ? '⚡ 書類管理者 (Admin Doc)' : '⚡ Admin Doc: CV & Job Matching'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang === 'ja' ? '日本求人カタログ・JIS履歴書' : 'Katalog Job Japan & Rirekisho JIS'}</div>
                  </div>
                </div>
                {activePortalKey === 'ADMIN_2' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={handleSwitchToMitra}
                className={`w-full text-left p-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                  activePortalKey === 'MITRA'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <div>
                    <div>{lang === 'ja' ? '🤝 提携機関ポータル' : '🤝 Portal Mitra LPK'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang === 'ja' ? '提携先ダッシュボード・送出登録' : 'Dashboard & Pendaftaran Mitra'}</div>
                  </div>
                </div>
                {activePortalKey === 'MITRA' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchToStudent()}
                className={`w-full text-left p-2 rounded-xl font-bold flex items-center justify-between transition cursor-pointer ${
                  activePortalKey === 'SISWA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <div>
                    <div>{lang === 'ja' ? '🎓 生徒・候補者ポータル' : '🎓 Portal Siswa / Kandidat'}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang === 'ja' ? '進捗確認・自己申告フォーム' : 'Monitoring Siswa & Form Mandiri'}</div>
                  </div>
                </div>
                {activePortalKey === 'SISWA' && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-purple-950 text-white border-b border-amber-500/30 px-3 sm:px-6 py-2 shadow-lg relative z-40">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Super Admin Identity & Badge */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Crown className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-amber-300 tracking-wide text-xs">
                {lang === 'ja' ? '👑 スーパー管理者: 全ポータルユニバーサルアクセス' : '👑 SUPER ADMIN: AKSES UNIVERSAL SEMUA PORTAL'}
              </span>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                {lang === 'ja' ? '現在:' : 'AKTIF:'} {activePortalLabel}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {lang === 'ja'
                ? '全権限バイパスにより各ポータルをシームレスに切替・管理できます'
                : 'Hak akses istimewa bypass untuk mengelola dan berpindah antar portal secara instan'}
            </p>
          </div>
        </div>

        {/* Right: Instant Portal Switcher Buttons & Student Impersonator */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Button: Marketing (Placed in front of Admin 1!) */}
          <button
            type="button"
            onClick={handleSwitchToMarketing}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs ${
              activePortalKey === 'MARKETING'
                ? 'bg-orange-500 text-slate-950 font-black shadow-md border border-orange-300 ring-2 ring-orange-400/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-orange-400" />
            <span>{lang === 'ja' ? '📢 マーケティング' : '📢 Portal Marketing'}</span>
          </button>

          {/* Button: Admin Siswa */}
          <button
            type="button"
            onClick={handleSwitchToAdmin1}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs ${
              activePortalKey === 'ADMIN_1'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md border border-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ja' ? '🏛️ 生徒管理者 (Admin Siswa)' : '🏛️ Admin Siswa (SIM-SB)'}</span>
          </button>

          {/* Button: Admin Doc */}
          <button
            type="button"
            onClick={handleSwitchToAdmin2}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs ${
              activePortalKey === 'ADMIN_2'
                ? 'bg-purple-500 text-white font-black shadow-md border border-purple-300 ring-2 ring-purple-400/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>{lang === 'ja' ? '⚡ 書類管理者 (Admin Doc)' : '⚡ Admin Doc (CV Matching)'}</span>
          </button>

          {/* Button: Portal Mitra */}
          <button
            type="button"
            onClick={handleSwitchToMitra}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs ${
              activePortalKey === 'MITRA'
                ? 'bg-teal-500 text-slate-950 font-black shadow-md border border-teal-300 ring-2 ring-teal-400/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span>{lang === 'ja' ? '🤝 提携機関ポータル' : '🤝 Portal Mitra'}</span>
          </button>

          {/* Button: Portal Siswa */}
          <button
            type="button"
            onClick={() => handleSwitchToStudent()}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer text-xs ${
              activePortalKey === 'SISWA'
                ? 'bg-blue-500 text-white font-black shadow-md border border-blue-300 ring-2 ring-blue-400/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'ja' ? '🎓 生徒ポータル' : '🎓 Portal Siswa'}</span>
          </button>

          {/* Quick Select Student Dropdown for Super Admin (Rendered in orange banner when in Portal Siswa) */}
          {activePortalKey !== 'SISWA' && (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setStudentDropdownOpen((prev) => !prev)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition"
                title={lang === 'ja' ? '特定生徒のアカウント/プロフィールを直接閲覧' : 'Akses Langsung Akun / Profil Siswa Tertentu'}
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden lg:inline">{lang === 'ja' ? '生徒画面を確認' : 'Lihat Akun Siswa'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {studentDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-45"
                    onClick={() => setStudentDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-2 text-white text-xs space-y-1 font-sans z-50 max-h-64 overflow-y-auto">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      {lang === 'ja' ? '閲覧する生徒を選択:' : 'Pilih Siswa untuk Dilihat di Portal:'}
                    </div>
                    {students.slice(0, 10).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSwitchToStudent(s.id)}
                        className="w-full text-left p-2 rounded-xl font-medium hover:bg-slate-800 text-slate-200 hover:text-amber-300 flex items-center justify-between transition cursor-pointer text-xs"
                      >
                        <div>
                          <div className="font-bold">{s.namaLengkap}</div>
                          <div className="text-[10px] text-slate-400">{s.id} • {s.kategoriKandidat || 'SSW'}</div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

