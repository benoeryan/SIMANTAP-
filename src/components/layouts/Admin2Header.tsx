import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AccountSettingsModal } from '../auth/AccountSettingsModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import {
  Sparkles,
  Building2,
  LogOut,
  User as UserIcon,
  Settings,
  ShieldCheck,
  Globe2,
  Layers,
  Menu
} from 'lucide-react';

export const Admin2Header: React.FC = () => {
  const { lang, t } = useApp();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white border-b border-purple-200 text-slate-800 shadow-xs">
        {/* Main Admin 2 Branding Bar */}
        <div className="w-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* 3-Line Hamburger Menu Toggle Button for Admin 2 Left Sidebar */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin2-sidebar'))}
              className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg border border-purple-300 transition shadow-xs cursor-pointer min-h-[36px] flex items-center space-x-1.5 shrink-0"
              title={lang === 'ja' ? 'サイドバーメニューを開閉' : 'Buka / Tutup Menu Navigasi Sidebar'}
              aria-label="Toggle Navigation Sidebar Menu"
            >
              <Menu className="w-4 h-4 shrink-0 text-purple-800" />
              <span className="text-xs font-bold text-purple-950 hidden xs:inline">{t.common.menu}</span>
            </button>

            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center shadow-xs border border-purple-400/30 shrink-0 tracking-tighter">
              DOC
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 truncate">
                  {lang === 'ja' ? '書類管理者 (Admin Doc) • CVポータル＆日本ジョブマッチング' : 'ADMIN DOC • CV-PORTAL & JOB MATCHING JEPANG'}
                </h1>
                <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.2 rounded border border-purple-200 font-mono font-bold shrink-0">
                  IJEF CORP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate hidden xs:block">
                {lang === 'ja' 
                  ? '日本受入企業マッチング・JIS履歴書審査・渡航管理システム'
                  : 'Sistem Otorisasi Back-Office Matching Perusahaan Jepang & Verifikasi CV Rirekisho Candidate'}
              </p>
            </div>
          </div>

          {/* Right Area: Language Switcher & User Profile */}
          <div className="flex items-center space-x-2 shrink-0">
            <LanguageSwitcher variant="pill" />

            {/* User Profile & Account Settings & Logout */}
            {user && (
              <div className="flex items-center space-x-1 bg-slate-100 p-1 px-2.5 rounded-lg border border-slate-200 shrink-0">
                <div className="flex items-center space-x-1.5 text-xs">
                  <div className="p-1 rounded-full bg-purple-200 text-purple-700 shrink-0">
                    <UserIcon className="w-3 h-3" />
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-bold text-slate-800 text-[11px] leading-tight max-w-[130px] truncate">
                      {user.displayName || user.email}
                    </div>
                    <div className="text-[9px] text-purple-700 font-mono font-bold truncate">
                      {user.adminRole || (lang === 'ja' ? '• 日本マッチング管理者' : '• Admin Matching Japan')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAccountSettingsOpen(true)}
                  title={lang === 'ja' ? '書類管理者 (Admin Doc) アカウント設定' : 'Setting Akun Admin Doc'}
                  className="p-1 text-slate-600 hover:text-purple-700 hover:bg-purple-100 rounded-md transition cursor-pointer border border-slate-200/80"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleLogout}
                  title={t.common.logout}
                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-md transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Account Settings Modal Admin 2 */}
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        portalType="ADMIN_2_CV_PORTAL"
      />
    </>
  );
};
