import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../Header';
import { Admin2Header } from './Admin2Header';
import { MarketingHeader } from '../marketing/MarketingHeader';
import { MarketingPortal } from '../marketing/MarketingPortal';
import { StudentMasterView } from '../StudentMasterView';
import { CandidatePortal } from '../CandidatePortal';
import { MedicalCheckup } from '../MedicalCheckup';
import { DiscAssessment } from '../DiscAssessment';
import { PsikotesModule } from '../PsikotesModule';
import { DukunganDanaForm } from '../DukunganDanaForm';
import { SuratPerjanjianForm } from '../SuratPerjanjianForm';
import { ApplicationSettings } from '../ApplicationSettings';
import { Admin2CVPortalView } from '../cvportal/Admin2CVPortalView';
import { PetunjukPenggunaanView } from '../cvportal/PetunjukPenggunaanView';
import { SuperAdminPortalSwitcher } from '../auth/SuperAdminPortalSwitcher';
import { ShieldCheck, Building2, Sparkles, Megaphone } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { activeTab, adminPortalCategoryMode, lang } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Universal Sticky Top Header Stack - Locked when scrolling */}
      <div className="sticky top-0 z-40 bg-white shadow-xs">
        <div className={`transition-all duration-300 ease-in-out ${adminPortalCategoryMode === 'ADMIN_1_IJEF' && sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}>
          {/* Universal Super Admin Quick Portal Switcher (Only renders for authenticated Super Admin accounts) */}
          <SuperAdminPortalSwitcher />

          {/* Render Dedicated Header Based on Active Admin Portal */}
          {adminPortalCategoryMode === 'MARKETING_PORTAL' ? (
            <MarketingHeader />
          ) : adminPortalCategoryMode === 'ADMIN_2_CV_PORTAL' ? (
            <Admin2Header />
          ) : (
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          )}
        </div>
      </div>

      <div className={`flex-1 transition-all duration-300 ease-in-out ${adminPortalCategoryMode === 'ADMIN_1_IJEF' && sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}>
        {/* Admin Content Module based on Selected Portal Mode & Active Tab */}
        <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {adminPortalCategoryMode === 'MARKETING_PORTAL' ? (
            <MarketingPortal />
          ) : adminPortalCategoryMode === 'ADMIN_2_CV_PORTAL' ? (
            <Admin2CVPortalView />
          ) : (
            <>
              {activeTab === 'master' && <StudentMasterView />}
              {activeTab === 'portal' && <CandidatePortal />}
              {activeTab === 'kesehatan' && <MedicalCheckup />}
              {activeTab === 'disc' && <DiscAssessment />}
              {activeTab === 'psikotes' && <PsikotesModule />}
              {activeTab === 'dana' && <DukunganDanaForm />}
              {activeTab === 'kontrak' && <SuratPerjanjianForm />}
              {activeTab === 'settings' && <ApplicationSettings />}
              {activeTab === 'petunjuk' && <PetunjukPenggunaanView />}
            </>
          )}
        </main>
      </div>

      {/* Admin Corporate Footer */}
      <footer className={`bg-white text-slate-600 py-5 px-4 border-t border-slate-200 text-xs mt-12 transition-all duration-300 ease-in-out ${adminPortalCategoryMode === 'ADMIN_1_IJEF' && sidebarOpen ? 'lg:ml-72 xl:ml-80' : 'ml-0'}`}>
        <div className="w-full px-2 sm:px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-6 h-6 rounded text-white font-bold flex items-center justify-center text-[10px] tracking-tight ${
                adminPortalCategoryMode === 'MARKETING_PORTAL'
                  ? 'bg-orange-600'
                  : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                  ? 'bg-emerald-600'
                  : 'bg-purple-600'
              }`}
            >
              {adminPortalCategoryMode === 'MARKETING_PORTAL' ? 'CRM' : adminPortalCategoryMode === 'ADMIN_1_IJEF' ? 'SISWA' : 'DOC'}
            </div>
            <span className="font-medium text-slate-700 text-xs">
              {adminPortalCategoryMode === 'MARKETING_PORTAL'
                ? (lang === 'ja' ? 'マーケティング・受講相談CRMポータル (Marketing)' : 'Portal Pemasaran, Intake Calon Siswa Baru & CRM Terintegrasi (Marketing)')
                : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                ? (lang === 'ja' ? 'LPK IJEF 生徒管理バックオフィス (Admin Siswa)' : 'Portal Back-Office Administrator SIM-SB LPK IJEF CORP (Admin Siswa)')
                : (lang === 'ja' ? 'CV作成＆求人マッチングバックオフィス (Admin Doc)' : 'Portal Back-Office CV-Portal & Job Matching Japan (Admin Doc)')}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
            <span
              className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${
                adminPortalCategoryMode === 'MARKETING_PORTAL'
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {adminPortalCategoryMode === 'MARKETING_PORTAL'
                ? (lang === 'ja' ? 'マーケティングCRM 稼働中' : 'Marketing & Intake CRM Active')
                : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                ? (lang === 'ja' ? '生徒管理 (SIM-SB) 稼働中' : 'Admin Siswa (SIBAL) Active')
                : (lang === 'ja' ? '書類管理 (CV-Portal) 稼働中' : 'Admin Doc (CV-Portal) Active')}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 flex items-center space-x-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 inline" />
              <span>LPK IJEF CORP Protected</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};


