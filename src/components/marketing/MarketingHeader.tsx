import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { useNavigate } from 'react-router-dom';
import { AccountSettingsModal } from '../auth/AccountSettingsModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { getMarketingAccessInfo, getScopedLeadsForUser } from '../../utils/crmAuthUtils';
import { translatePipelineStage, translateMarketingRole } from '../../utils/marketingTranslations';
import {
  Megaphone,
  UserCheck,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  Flame,
  PlusCircle,
  Menu,
  ShieldCheck,
  Lock,
  Crown
} from 'lucide-react';

export interface MarketingHeaderProps {
  onOpenNewLeadModal?: () => void;
  activeMarketingTab?: string;
  setActiveMarketingTab?: (tab: string) => void;
}

export const MarketingHeader: React.FC<MarketingHeaderProps> = ({
  onOpenNewLeadModal,
  activeMarketingTab: propActiveTab,
  setActiveMarketingTab: propSetTab
}) => {
  const { lang, t, leads, selectedLeadId, setSelectedLeadId, searchTerm, setSearchTerm, marketingActiveTab, setMarketingActiveTab, masterSettings } = useApp();
  const { bilingual } = useEcosystemTranslation();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Marketing access info and scoped leads for current user
  const accessInfo = useMemo(() => {
    return getMarketingAccessInfo(user, masterSettings?.adminUsers);
  }, [user, masterSettings]);

  const scopedLeads = useMemo(() => {
    return getScopedLeadsForUser(leads, accessInfo);
  }, [leads, accessInfo]);

  const activeTab = (propActiveTab || marketingActiveTab) as 'dashboard' | 'pipeline' | 'form' | 'table' | 'followup' | 'team' | 'campaigns' | 'settings';
  const handleTabChange = (tabId: any) => {
    if (propSetTab) propSetTab(tabId);
    setMarketingActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const totalLeads = scopedLeads.length;
  const totalDeal = scopedLeads.filter((l) => l.statusLead === 'DEAL_TERDAFTAR').length;
  const totalActive = scopedLeads.filter((l) => ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP', 'DIHUBUNGI', 'KONSULTASI_VISIT'].includes(l.statusLead)).length;

  const marketingMenuItems = [
    { id: 'dashboard', label: bilingual('Dashboard Analitik', 'ダッシュボード'), icon: TrendingUp, badge: null },
    { id: 'pipeline', label: bilingual('Kanban Pipeline', 'カンバン・パイプライン'), icon: Sparkles, badge: totalLeads },
    { id: 'form', label: bilingual('Input Siswa Baru', '新規生徒受付'), icon: PlusCircle, badge: null },
    { id: 'table', label: bilingual('Data Master Leads', '見込み客マスター'), icon: Building2, badge: null },
    { id: 'followup', label: bilingual('Follow-Up & WA', 'フォローアップ管理'), icon: UserCheck, badge: totalActive },
    { id: 'team', label: bilingual('Tim Marketing', '営業チーム・目標'), icon: Users, badge: null },
    { id: 'campaigns', label: bilingual('Kampanye & Event', 'プロモーション広告'), icon: Megaphone, badge: null },
    { id: 'settings', label: bilingual('Pengaturan CRM', 'システム設定'), icon: Settings, badge: null },
  ];

  return (
    <>
      <header className="bg-white border-b border-orange-200 text-slate-800 shadow-xs sticky top-0 z-30">
        {/* Top Header Row */}
        <div className="w-full px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left Branding */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white font-black text-base flex items-center justify-center shadow-sm border border-orange-400/30 shrink-0">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                    {bilingual('PORTAL MARKETING & INTAKE CRM', 'マーケティング＆新規生徒獲得ポータル')}
                  </h1>
                  <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded-full border border-orange-200 font-mono font-bold shrink-0">
                    CRM v1.0
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate hidden xs:block">
                  {bilingual(
                    'Pusat Akuisisi Calon Siswa & Integrasi Otomatis Seluruh Portal LPK IJEF',
                    '見込み生徒管理・自動全ポータル連携・フォローアップ'
                  )}
                </p>
              </div>
            </div>

            {/* Hamburger on Mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right Area: Search, Quick Lead Picker, Language Switcher & Profile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto min-w-0">
            {/* Search & Lead Select */}
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex-1 min-w-0">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={bilingual('Cari lead (Nama/WA/Kota)...', 'リード検索 (氏名/WA)...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white text-xs text-slate-800 pl-8 pr-2 py-1.5 rounded-md border border-slate-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder:text-slate-400 min-w-0"
                />
              </div>

              <div className="flex items-center space-x-1.5 pr-1 min-w-0">
                <UserCheck className="w-4 h-4 text-orange-600 shrink-0" />
                <select
                  value={selectedLeadId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedLeadId(id || null);
                    if (id) {
                      const found = scopedLeads.find(l => l.id === id);
                      if (found) {
                        setSearchTerm(found.namaLengkap);
                      }
                    } else {
                      setSearchTerm('');
                    }
                  }}
                  className="w-full sm:w-auto bg-white text-xs text-slate-800 px-2 py-1.5 rounded-md border border-slate-300 font-medium focus:outline-none focus:border-orange-500 max-w-[130px] sm:max-w-[170px] truncate min-w-0"
                >
                  <option value="">-- {bilingual('Pilih Lead Prospek', 'リードを選択')} --</option>
                  {scopedLeads
                    .filter((l) =>
                      l.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      l.noWhatsapp.includes(searchTerm) ||
                      (l.kotaDomisili && l.kotaDomisili.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.namaLengkap} ({translatePipelineStage(l.statusLead, lang)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Language Switcher - Non-overlapping */}
            <div className="shrink-0 flex items-center justify-end">
              <LanguageSwitcher variant="pill" className="shrink-0" />
            </div>

            {/* User Profile & Access Badge & Account Settings & Logout */}
            {user && (
              <div className="flex items-center justify-between sm:justify-start space-x-1.5 bg-slate-100 p-1.5 px-2.5 rounded-xl border border-slate-200 shrink-0 min-w-0">
                <div className="flex items-center space-x-2 text-xs min-w-0">
                  <div className={`p-1.5 rounded-full shrink-0 ${accessInfo.isLeaderOrAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-orange-100 text-orange-800'}`}>
                    {accessInfo.isLeaderOrAdmin ? <Crown className="w-3.5 h-3.5 text-amber-700" /> : <UserIcon className="w-3.5 h-3.5 text-orange-700" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] leading-tight max-w-[110px] sm:max-w-[140px] truncate">
                      {accessInfo.staffName}
                    </div>
                    <div className="text-[10px] text-orange-700 font-mono font-bold truncate flex items-center space-x-1">
                      {accessInfo.isLeaderOrAdmin ? (
                        <span className="text-amber-800 font-extrabold flex items-center space-x-0.5">
                          <span>👑</span>
                          <span>{translateMarketingRole(accessInfo.roleTitle, lang)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium flex items-center space-x-0.5">
                          <Lock className="w-2.5 h-2.5 text-slate-400 inline" />
                          <span>{translateMarketingRole(accessInfo.roleTitle, lang)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAccountSettingsOpen(true)}
                  title={bilingual('Setting Akun', 'アカウント設定')}
                  className="p-1.5 text-slate-600 hover:text-orange-700 hover:bg-orange-100 rounded-lg transition cursor-pointer border border-slate-200"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  title={t.common.logout}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dedicated 8-Menu Sub Navigation Bar */}
        <div className={`bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/40 border-t border-orange-200 px-3 sm:px-6 py-2 overflow-x-auto ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-max">
            {marketingMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-orange-200/60 hover:border-orange-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-orange-600'}`} />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-white text-orange-700'
                          : 'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
        portalType="MARKETING_PORTAL"
      />
    </>
  );
};
