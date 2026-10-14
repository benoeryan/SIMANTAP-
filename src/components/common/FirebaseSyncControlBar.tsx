import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CloudLightning,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Briefcase,
  ShieldCheck,
  Radio,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface FirebaseSyncControlBarProps {
  domain?: 'all' | 'mitra' | 'students' | 'admins' | 'jobs';
  variant?: 'compact' | 'full' | 'header' | 'card';
  showCounters?: boolean;
  className?: string;
}

export const FirebaseSyncControlBar: React.FC<FirebaseSyncControlBarProps> = ({
  domain = 'all',
  variant = 'card',
  showCounters = true,
  className = ''
}) => {
  const { firebaseSyncStatus, syncFirebaseDomain, refreshFirebaseDomain, lang = 'id' } = useApp();
  const [localFeedback, setLocalFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const domainNames = {
    all: lang === 'ja' ? '全ドメイン（提携先、生徒、管理者、求人）' : 'Semua Domain (Mitra, Siswa, Admin, Jobs)',
    mitra: lang === 'ja' ? '提携先・許可リストデータ' : 'Data Mitra Terdaftar & Whitelist',
    students: lang === 'ja' ? '生徒・JIS履歴書候補者データ' : 'Data Siswa & Kandidat CV JIS',
    admins: lang === 'ja' ? '管理者・マーケティングロールアカウント' : 'Akun Admin & Role Marketing',
    jobs: lang === 'ja' ? '求人・募集要項リスト' : 'Listingan Lowongan Kerja'
  };

  const domainIcons = {
    all: Database,
    mitra: Building2,
    students: Users,
    admins: ShieldCheck,
    jobs: Briefcase
  };

  const IconComponent = domainIcons[domain] || Database;

  const handleSync = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLocalFeedback({ text: `Menyinkronkan data ${domainNames[domain]} ke Firebase...`, type: 'info' });
      const result = await syncFirebaseDomain(domain);
      if (result.success) {
        setLocalFeedback({ text: result.message || 'Sinkronisasi Firebase berhasil!', type: 'success' });
      } else {
        setLocalFeedback({ text: result.message || 'Gagal sinkronisasi', type: 'error' });
      }
      setTimeout(() => setLocalFeedback(null), 4000);
    } catch (err: any) {
      setLocalFeedback({ text: `Gagal sinkronisasi: ${err?.message || 'Error'}`, type: 'error' });
      setTimeout(() => setLocalFeedback(null), 4000);
    }
  };

  const handleRefresh = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setLocalFeedback({ text: `Memuat ulang data terbaru dari Firebase...`, type: 'info' });
      const result = await refreshFirebaseDomain(domain);
      if (result.success) {
        setLocalFeedback({ text: result.message || 'Data Firebase berhasil dimuat!', type: 'success' });
      } else {
        setLocalFeedback({ text: result.message || 'Gagal memuat data', type: 'error' });
      }
      setTimeout(() => setLocalFeedback(null), 4000);
    } catch (err: any) {
      setLocalFeedback({ text: `Gagal refresh: ${err?.message || 'Error'}`, type: 'error' });
      setTimeout(() => setLocalFeedback(null), 4000);
    }
  };

  const isCurrentDomainSyncing = (firebaseSyncStatus?.isSyncing ?? false) && (firebaseSyncStatus.activeDomain === domain || firebaseSyncStatus.activeDomain === 'all' || domain === 'all');

  // Header mini variant
  if (variant === 'header') {
    return (
      <div id={`firebase-sync-header-${domain}`} className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Firebase DB Live</span>
        </div>

        <button
          id={`btn-sync-domain-${domain}`}
          type="button"
          onClick={handleSync}
          disabled={(firebaseSyncStatus?.isSyncing ?? false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-sm ${
            isCurrentDomainSyncing
              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
          }`}
          title={lang === 'ja' ? 'ローカルデータをFirebaseに同期' : 'Sinkronkan data lokal ke database Firebase'}
        >
          <CloudLightning className={`w-3.5 h-3.5 ${isCurrentDomainSyncing ? 'animate-spin text-amber-700' : 'text-emerald-100'}`} />
          <span>{isCurrentDomainSyncing ? (lang === 'ja' ? '同期中...' : 'Menyinkronkan...') : (lang === 'ja' ? 'Firebase同期' : 'Sinkronkan Firebase')}</span>
        </button>

        <button
          id={`btn-refresh-domain-${domain}`}
          type="button"
          onClick={handleRefresh}
          disabled={(firebaseSyncStatus?.isSyncing ?? false)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg transition-all shadow-sm"
          title={lang === 'ja' ? 'Firebaseから最新データを再取得' : 'Refresh data dari database Firebase'}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isCurrentDomainSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          <span className="hidden md:inline">{lang === 'ja' ? '再読み込み' : 'Refresh'}</span>
        </button>
      </div>
    );
  }

  // Compact toolbar variant
  if (variant === 'compact') {
    return (
      <div id={`firebase-sync-compact-${domain}`} className={`flex items-center flex-wrap gap-2 ${className}`}>
        <button
          id={`btn-sync-compact-${domain}`}
          type="button"
          onClick={handleSync}
          disabled={(firebaseSyncStatus?.isSyncing ?? false)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all active:scale-95 shadow-sm"
        >
          <Cloud className={`w-3.5 h-3.5 text-emerald-600 ${isCurrentDomainSyncing ? 'animate-bounce' : ''}`} />
          <span>{lang === 'ja' ? 'Firebaseデータ同期' : 'Singkronkan Data Firebase'}</span>
        </button>

        <button
          id={`btn-refresh-compact-${domain}`}
          type="button"
          onClick={handleRefresh}
          disabled={(firebaseSyncStatus?.isSyncing ?? false)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isCurrentDomainSyncing ? 'animate-spin' : ''}`} />
          <span>{lang === 'ja' ? '更新' : 'Refresh'}</span>
        </button>

        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          {lang === 'ja' ? '同期完了:' : 'Tersinkron:'} {(firebaseSyncStatus?.lastSyncedAt ?? '-')}
        </span>
      </div>
    );
  }

  // Full / Card variant with rich info & domain counters
  return (
    <div
      id={`firebase-sync-panel-${domain}`}
      className={`bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 sm:p-5 border border-indigo-800/40 shadow-lg relative overflow-hidden ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                {lang === 'ja' ? 'Firebase Database同期 ＆ 各ポータル自動反映' : 'Sinkronisasi Firebase Database & Auto-Update Portal'}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {lang === 'ja' ? 'リアルタイム稼働中' : 'Firebase Aktif'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {lang === 'ja'
                ? <>同期対象: <span className="font-semibold text-emerald-300">{domainNames[domain]}</span>。Firebaseから全ポータル（生徒管理、書類管理、マーケティング、提携先、生徒）へリアルタイムに自動反映されます。</>
                : <>Target sinkronisasi: <span className="font-semibold text-emerald-300">{domainNames[domain]}</span>. Update otomatis tersinkron dari database Firebase ke semua portal (Admin Siswa, Admin Doc, Portal Marketing, Mitra, Siswa).</>}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <button
            id={`btn-card-sync-${domain}`}
            type="button"
            onClick={handleSync}
            disabled={(firebaseSyncStatus?.isSyncing ?? false)}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-md active:scale-95 ${
              isCurrentDomainSyncing
                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 hover:shadow-emerald-500/20'
            }`}
          >
            <CloudLightning className={`w-4 h-4 ${isCurrentDomainSyncing ? 'animate-spin text-slate-900' : 'text-emerald-200'}`} />
            <span>{isCurrentDomainSyncing ? (lang === 'ja' ? '同期中...' : 'Menyinkronkan...') : (lang === 'ja' ? 'Firebaseデータ同期' : 'Singkronkan Data Firebase')}</span>
          </button>

          <button
            id={`btn-card-refresh-${domain}`}
            type="button"
            onClick={handleRefresh}
            disabled={(firebaseSyncStatus?.isSyncing ?? false)}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 shadow-md"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isCurrentDomainSyncing ? 'animate-spin' : ''}`} />
            <span>{lang === 'ja' ? '更新' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {localFeedback && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
          localFeedback.type === 'success' ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/50' :
          localFeedback.type === 'error' ? 'bg-rose-900/60 text-rose-200 border border-rose-700/50' :
          'bg-blue-900/60 text-blue-200 border border-blue-700/50'
        }`}>
          {localFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {localFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {localFeedback.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
          <span>{localFeedback.text}</span>
        </div>
      )}
    </div>
  );
};
