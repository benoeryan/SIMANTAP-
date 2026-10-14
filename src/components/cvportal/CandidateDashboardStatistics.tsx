import React, { useState } from 'react';
import {
  Users,
  User,
  RotateCw,
  Check,
  X,
  AlertCircle,
  Calendar,
  Star,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export interface CandidateDashboardStatisticsData {
  total: number;
  pria: number;
  wanita: number;
  priaSiapMatching?: number;
  wanitaSiapMatching?: number;
  totalSiapMatching?: number;
  nihongoCheck: number;
  belumLolosNihongo: number;
  pendingNungguJob: number;
  penjadwalanInterview: number;
  onProses: number;
  tidakLolosInterview: number;
  lolosInterview: number;
  prosesVisa: number;
  statusOnJob: number;
  cancel: number;
  belumAda: number;
  siswaIjefOffline: number;
  siswaIjefOnline: number;
  siswaMitra: number;
  siswaNonIjefNewComer: number;
  matchingExMagang: number;
  matchingEngineering: number;
  lainnya: number;
}

export function getCandidateGender(c: any): 'Laki-laki' | 'Perempuan' {
  if (!c) return 'Laki-laki';
  const g = (c.jenisKelamin || c.gender || c.sex || c.kelamin || '').toString().trim().toLowerCase();
  if (
    g === 'perempuan' ||
    g === 'wanita' ||
    g === 'female' ||
    g === 'p' ||
    g.includes('perempuan') ||
    g.includes('wanita') ||
    g.includes('女')
  ) {
    return 'Perempuan';
  }
  return 'Laki-laki';
}

export function isCandidateSiapMatching(c: any): boolean {
  if (!c) return false;
  const sp = (c.statusProgres || '').toString().trim().toLowerCase();
  if (!sp || sp === 'belum ada' || sp === '-' || sp === 'belum ada status') {
    return false;
  }
  if (
    sp.includes('proses') ||
    sp.includes('interview') ||
    sp.includes('naitei') ||
    sp.includes('visa') ||
    sp.includes('coe') ||
    sp.includes('cancel') ||
    sp.includes('batal') ||
    sp.includes('nihongo') ||
    sp.includes('on job') ||
    sp.includes('selesai')
  ) {
    return false;
  }
  return (
    sp === 'pending nunggu job' ||
    sp === 'nunggu job' ||
    sp === 'menunggu job' ||
    sp === 'pending' ||
    sp === 'siap matching' ||
    sp === 'siap matching job' ||
    sp.includes('pending nunggu job') ||
    sp.includes('nunggu job') ||
    sp.includes('menunggu job')
  );
}

export function calculateCandidateStatistics(candidates: any[]): CandidateDashboardStatisticsData {
  const stats: CandidateDashboardStatisticsData = {
    total: candidates.length,
    pria: 0,
    wanita: 0,
    priaSiapMatching: 0,
    wanitaSiapMatching: 0,
    totalSiapMatching: 0,
    nihongoCheck: 0,
    belumLolosNihongo: 0,
    pendingNungguJob: 0,
    penjadwalanInterview: 0,
    onProses: 0,
    tidakLolosInterview: 0,
    lolosInterview: 0,
    prosesVisa: 0,
    statusOnJob: 0,
    cancel: 0,
    belumAda: 0,
    siswaIjefOffline: 0,
    siswaIjefOnline: 0,
    siswaMitra: 0,
    siswaNonIjefNewComer: 0,
    matchingExMagang: 0,
    matchingEngineering: 0,
    lainnya: 0,
  };

  candidates.forEach((c) => {
    // Category source detection
    const cat = (c.kategoriKandidat || c.programDiminati || '').toString().trim();
    const catUpper = cat.toUpperCase();
    if (catUpper.includes('IJEF - OFFLINE') || catUpper === 'SISWA IJEF - OFFLINE' || catUpper === 'IJEF OFFLINE') {
      stats.siswaIjefOffline++;
    } else if (catUpper.includes('IJEF - ONLINE') || catUpper === 'SISWA IJEF - ONLINE' || catUpper === 'IJEF ONLINE') {
      stats.siswaIjefOnline++;
    } else if (catUpper.includes('MITRA') || catUpper.includes('SISWA MITRA')) {
      stats.siswaMitra++;
    } else if (catUpper.includes('NON IJEF') || catUpper.includes('NEW COMER') || catUpper.includes('NON-IJEF')) {
      stats.siswaNonIjefNewComer++;
    } else if (catUpper.includes('EX-MAGANG') || catUpper.includes('EX MAGANG') || catUpper.includes('TRAINEE')) {
      stats.matchingExMagang++;
    } else if (catUpper.includes('ENGINEER') || catUpper.includes('GIJINKOKU')) {
      stats.matchingEngineering++;
    } else {
      stats.lainnya++;
    }
    // Gender detection: Pria (Laki-laki) vs Wanita (Perempuan)
    const gender = getCandidateGender(c);
    if (gender === 'Laki-laki') {
      stats.pria++;
    } else if (gender === 'Perempuan') {
      stats.wanita++;
    }

    const isMatchingReady = isCandidateSiapMatching(c);
    const sp = (c.statusProgres || '').toString().trim();
    const s = sp.toLowerCase();

    if (isMatchingReady) {
      stats.pendingNungguJob++;
    } else if (!s || s === 'belum ada' || s === 'belum ada status' || s === '-') {
      stats.belumAda++;
    } else if (s.includes('belum lolos nihongo') || s.includes('tidak lolos nihongo')) {
      stats.belumLolosNihongo++;
    } else if (s.includes('nihongo check') || s === 'nihongo') {
      stats.nihongoCheck++;
    } else if (s.includes('tidak lolos interview') || s.includes('gagal interview') || s === 'ditolak' || s.includes('tidak lolos')) {
      stats.tidakLolosInterview++;
    } else if (s.includes('penjadwalan interview') || s.includes('terjadwal interview') || s.includes('jadwal interview') || s.includes('interviewing')) {
      stats.penjadwalanInterview++;
    } else if ((s.includes('lolos interview') && !s.includes('tidak')) || s.includes('naitei') || s.includes('lolos naitei')) {
      stats.lolosInterview++;
    } else if (s.includes('proses visa') || s.includes('proses visas') || s.includes('coe') || s.includes('visa')) {
      stats.prosesVisa++;
    } else if (
      s.includes('on job') ||
      s.includes('selesai') ||
      s.includes('status on job')
    ) {
      stats.statusOnJob++;
    } else if (s.includes('cancel') || s.includes('batal') || s.includes('mengundurkan diri')) {
      stats.cancel++;
    } else if (s.includes('on proses') || s.includes('proses') || s.includes('sedang proses')) {
      stats.onProses++;
    } else {
      stats.belumAda++;
    }

    if (isMatchingReady) {
      stats.totalSiapMatching = (stats.totalSiapMatching || 0) + 1;
      if (gender === 'Laki-laki') {
        stats.priaSiapMatching = (stats.priaSiapMatching || 0) + 1;
      } else if (gender === 'Perempuan') {
        stats.wanitaSiapMatching = (stats.wanitaSiapMatching || 0) + 1;
      }
    }
  });

  return stats;
}

interface CandidateDashboardStatisticsProps {
  stats?: CandidateDashboardStatisticsData;
  candidates?: any[];
  selectedStatus?: string;
  onSelectStatus?: (statusKey: string) => void;
  selectedGender?: string; // 'Semua' | 'Laki-laki' | 'Perempuan'
  onSelectGender?: (genderKey: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (categoryKey: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  isMitraView?: boolean; // Khusus Portal Mitra: hanya tampilkan 4 status (Total, Siap Matching Job, Penjadwalan Interview, Status On Job)
}

export const CandidateDashboardStatistics: React.FC<CandidateDashboardStatisticsProps> = ({
  stats: propStats,
  candidates,
  selectedStatus = 'Semua',
  onSelectStatus,
  selectedGender = 'Semua',
  onSelectGender,
  selectedCategory = 'Semua',
  onSelectCategory,
  onRefresh,
  isRefreshing = false,
  className = '',
  isMitraView = false
}) => {
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  // Compute global unfiltered stats
  const totalStats: CandidateDashboardStatisticsData = React.useMemo(() => {
    if (candidates && candidates.length > 0) {
      return calculateCandidateStatistics(candidates);
    }
    if (propStats) {
      return propStats;
    }
    return {
      total: 0,
      pria: 0,
      wanita: 0,
      priaSiapMatching: 0,
      wanitaSiapMatching: 0,
      totalSiapMatching: 0,
      nihongoCheck: 0,
      belumLolosNihongo: 0,
      pendingNungguJob: 0,
      penjadwalanInterview: 0,
      onProses: 0,
      tidakLolosInterview: 0,
      lolosInterview: 0,
      prosesVisa: 0,
      statusOnJob: 0,
      cancel: 0,
      belumAda: 0,
      siswaIjefOffline: 0,
      siswaIjefOnline: 0,
      siswaMitra: 0,
      siswaNonIjefNewComer: 0,
      matchingExMagang: 0,
      matchingEngineering: 0,
      lainnya: 0,
    };
  }, [candidates, propStats]);

  // Candidates filtered ONLY by active category (used for gender classification stats so Pria and Wanita cards always show full category breakdown)
  const categoryFilteredCandidates = React.useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    if (!selectedCategory || selectedCategory === 'Semua') return candidates;
    return candidates.filter((c) => {
      const cat = (c.kategoriKandidat || c.programDiminati || '').toString().trim().toUpperCase();
      const filterUp = selectedCategory.toUpperCase();
      if (filterUp.includes('IJEF - OFFLINE') || filterUp.includes('SISWA IJEF - OFFLINE')) {
        return cat.includes('IJEF - OFFLINE') || cat === 'SISWA IJEF - OFFLINE' || cat === 'IJEF OFFLINE';
      } else if (filterUp.includes('IJEF - ONLINE') || filterUp.includes('SISWA IJEF - ONLINE')) {
        return cat.includes('IJEF - ONLINE') || cat === 'SISWA IJEF - ONLINE' || cat === 'IJEF ONLINE';
      } else if (filterUp.includes('MITRA')) {
        return cat.includes('MITRA') || cat.includes('SISWA MITRA');
      } else if (filterUp.includes('NEW COMER') || filterUp.includes('NON IJEF')) {
        return cat.includes('NON IJEF') || cat.includes('NEW COMER') || cat.includes('NON-IJEF');
      } else if (filterUp.includes('EX-MAGANG') || filterUp.includes('EX MAGANG') || filterUp.includes('TRAINEE')) {
        return cat.includes('EX-MAGANG') || cat.includes('EX MAGANG') || cat.includes('TRAINEE');
      } else if (filterUp.includes('ENGINEER') || filterUp.includes('GIJINKOKU')) {
        return cat.includes('ENGINEER') || cat.includes('GIJINKOKU');
      } else {
        return cat === filterUp || cat.includes(filterUp);
      }
    });
  }, [candidates, selectedCategory]);

  // Gender stats (always based on categoryFilteredCandidates, unaffected by selectedGender, so Pria & Wanita are always correctly divided)
  const genderStats: CandidateDashboardStatisticsData = React.useMemo(() => {
    if (categoryFilteredCandidates.length > 0) {
      return calculateCandidateStatistics(categoryFilteredCandidates);
    }
    return totalStats;
  }, [categoryFilteredCandidates, totalStats]);

  // Active gender stats for Pria and Wanita cards/ratio
  const activeGenderTotal = isMitraView ? (genderStats.totalSiapMatching ?? genderStats.pendingNungguJob) : genderStats.total;
  const activeGenderPria = isMitraView ? (genderStats.priaSiapMatching ?? 0) : genderStats.pria;
  const activeGenderWanita = isMitraView ? (genderStats.wanitaSiapMatching ?? 0) : genderStats.wanita;
  const genderPriaPercentage = activeGenderTotal > 0
    ? ((activeGenderPria / activeGenderTotal) * 100).toFixed(1)
    : '0.0';
  const genderWanitaPercentage = activeGenderTotal > 0
    ? ((activeGenderWanita / activeGenderTotal) * 100).toFixed(1)
    : '0.0';

  // Candidates filtered by category and gender (for status cards)
  const filteredCandidatesForStats = React.useMemo(() => {
    if (categoryFilteredCandidates.length === 0) return [];
    if (!selectedGender || selectedGender === 'Semua') return categoryFilteredCandidates;
    return categoryFilteredCandidates.filter((c) => {
      const g = getCandidateGender(c);
      if (selectedGender === 'Laki-laki' && g !== 'Laki-laki') return false;
      if (selectedGender === 'Perempuan' && g !== 'Perempuan') return false;
      return true;
    });
  }, [categoryFilteredCandidates, selectedGender]);

  // If a category or gender is active, calculate contextual stats so card counts match table counts
  const stats: CandidateDashboardStatisticsData = React.useMemo(() => {
    if ((selectedCategory && selectedCategory !== 'Semua') || (selectedGender && selectedGender !== 'Semua')) {
      if (filteredCandidatesForStats.length > 0) {
        return calculateCandidateStatistics(filteredCandidatesForStats);
      }
      return {
        total: 0,
        pria: 0,
        wanita: 0,
        priaSiapMatching: 0,
        wanitaSiapMatching: 0,
        totalSiapMatching: 0,
        nihongoCheck: 0,
        belumLolosNihongo: 0,
        pendingNungguJob: 0,
        penjadwalanInterview: 0,
        onProses: 0,
        tidakLolosInterview: 0,
        lolosInterview: 0,
        prosesVisa: 0,
        statusOnJob: 0,
        cancel: 0,
        belumAda: 0,
        siswaIjefOffline: 0,
        siswaIjefOnline: 0,
        siswaMitra: 0,
        siswaNonIjefNewComer: 0,
        matchingExMagang: 0,
        matchingEngineering: 0,
        lainnya: 0,
      };
    }
    return totalStats;
  }, [selectedCategory, selectedGender, filteredCandidatesForStats, totalStats]);

  const total = stats.total;
  const getPercentage = (count: number): string => {
    if (!total || total === 0) return '0.0';
    return ((count / total) * 100).toFixed(1);
  };

  const priaPercentage = getPercentage(stats.pria);
  const wanitaPercentage = getPercentage(stats.wanita);

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      setInternalRefreshing(true);
      setTimeout(() => {
        setInternalRefreshing(false);
      }, 700);
    }
  };

  const refreshingState = isRefreshing || internalRefreshing;

  // 10 Status items corresponding exactly to the uploaded design
  const cardItems = [
    {
      id: 'TOTAL',
      key: 'Semua',
      title: 'TOTAL KANDIDAT',
      count: stats.total,
      percentage: '100.0',
      badgeType: 'navy',
      badgeText: '',
      badgeIcon: Users,
      barColor: 'bg-white',
      percentColor: 'text-white'
    },
    {
      id: 'NIHONGO_CHECK',
      key: 'Nihongo check',
      title: 'NIHONGO CHECK',
      count: stats.nihongoCheck,
      percentage: getPercentage(stats.nihongoCheck),
      badgeType: 'amber',
      badgeText: 'v',
      badgeIcon: Check,
      barColor: 'bg-amber-500',
      percentColor: 'text-amber-600',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-600'
    },
    {
      id: 'BELUM_LOLOS_NIHONGO',
      key: 'Belum Lolos Nihongo check',
      title: 'BELUM LOLOS NIHONGO CHECK',
      count: stats.belumLolosNihongo,
      percentage: getPercentage(stats.belumLolosNihongo),
      badgeType: 'rose',
      badgeText: 'x',
      badgeIcon: X,
      barColor: 'bg-rose-500',
      percentColor: 'text-rose-600',
      badgeBg: 'bg-rose-50 border-rose-200 text-rose-500'
    },
    {
      id: 'PENDING_NUNGGU_JOB',
      key: 'Pending Nunggu Job',
      title: 'PENDING NUNGGU JOB',
      count: stats.pendingNungguJob,
      percentage: getPercentage(stats.pendingNungguJob),
      badgeType: 'orange',
      badgeText: '!',
      badgeIcon: AlertCircle,
      barColor: 'bg-orange-500',
      percentColor: 'text-orange-600',
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-500'
    },
    {
      id: 'PENJADWALAN_INTERVIEW',
      key: 'Penjadwalan Interview',
      title: 'PENJADWALAN INTERVIEW',
      count: stats.penjadwalanInterview,
      percentage: getPercentage(stats.penjadwalanInterview),
      badgeType: 'purple',
      badgeText: 'cal',
      badgeIcon: Calendar,
      barColor: 'bg-purple-500',
      percentColor: 'text-purple-600',
      badgeBg: 'bg-purple-50 border-purple-200 text-purple-600'
    },
    {
      id: 'ON_PROSES',
      key: 'On Proses',
      title: 'ON PROSES',
      count: stats.onProses,
      percentage: getPercentage(stats.onProses),
      badgeType: 'sky',
      badgeText: '★',
      badgeIcon: Star,
      barColor: 'bg-sky-500',
      percentColor: 'text-sky-600',
      badgeBg: 'bg-sky-50 border-sky-200 text-sky-500'
    },
    {
      id: 'TIDAK_LOLOS_INTERVIEW',
      key: 'Tidak Lolos Interview',
      title: 'TIDAK LOLOS INTERVIEW',
      count: stats.tidakLolosInterview,
      percentage: getPercentage(stats.tidakLolosInterview),
      badgeType: 'pink',
      badgeText: 'x',
      badgeIcon: X,
      barColor: 'bg-pink-500',
      percentColor: 'text-pink-600',
      badgeBg: 'bg-pink-50 border-pink-200 text-pink-500'
    },
    {
      id: 'LOLOS_INTERVIEW',
      key: 'Lolos Interview (Naitei)',
      title: 'LOLOS INTERVIEW (NAITEI)',
      count: stats.lolosInterview,
      percentage: getPercentage(stats.lolosInterview),
      badgeType: 'indigo',
      badgeText: '★',
      badgeIcon: Star,
      barColor: 'bg-indigo-500',
      percentColor: 'text-indigo-600',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-600'
    },
    {
      id: 'PROSES_VISA_COE',
      key: 'Proses Visas/COE',
      title: 'PROSES VISA / COE',
      count: stats.prosesVisa,
      percentage: getPercentage(stats.prosesVisa),
      badgeType: 'teal',
      badgeText: 'v',
      badgeIcon: CheckCircle2,
      barColor: 'bg-teal-500',
      percentColor: 'text-teal-600',
      badgeBg: 'bg-teal-50 border-teal-200 text-teal-600'
    },
    {
      id: 'STATUS_ON_JOB',
      key: 'Status On Job (Selesai)',
      title: 'STATUS ON JOB (SELESAI)',
      count: stats.statusOnJob,
      percentage: getPercentage(stats.statusOnJob),
      badgeType: 'emerald',
      badgeText: 'check',
      badgeIcon: CheckCircle2,
      barColor: 'bg-emerald-500',
      percentColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-600'
    },
    {
      id: 'CANCEL',
      key: 'Cancel',
      title: 'CANCEL',
      count: stats.cancel,
      percentage: getPercentage(stats.cancel),
      badgeType: 'slate',
      badgeText: 'x',
      badgeIcon: X,
      barColor: 'bg-slate-600',
      percentColor: 'text-slate-600',
      badgeBg: 'bg-slate-100 border-slate-300 text-slate-700'
    },
    {
      id: 'BELUM_ADA_STATUS',
      key: 'Belum Ada',
      title: 'BELUM ADA STATUS',
      count: stats.belumAda,
      percentage: getPercentage(stats.belumAda),
      badgeType: 'gray',
      badgeText: '?',
      badgeIcon: HelpCircle,
      barColor: 'bg-slate-300',
      percentColor: 'text-slate-400',
      badgeBg: 'bg-slate-50 border-slate-200 text-slate-400'
    },
  ];

  // Filter cards based on isMitraView (Khusus Mitra: Total, Siap Matching Job, Penjadwalan Interview, Status On Job)
  const displayedCardItems = React.useMemo(() => {
    if (!isMitraView) return cardItems;

    // Filter to only the 4 requested statuses
    return cardItems
      .filter((item) =>
        item.id === 'TOTAL' ||
        item.id === 'PENDING_NUNGGU_JOB' ||
        item.id === 'PENJADWALAN_INTERVIEW' ||
        item.id === 'STATUS_ON_JOB'
      )
      .map((item) => {
        if (item.id === 'PENDING_NUNGGU_JOB') {
          return {
            ...item,
            title: 'SIAP MATCHING JOB',
            badgeText: 'ready',
            badgeBg: 'bg-orange-50 border-orange-200 text-orange-600',
          };
        }
        if (item.id === 'STATUS_ON_JOB') {
          return {
            ...item,
            title: 'STATUS ON JOB',
          };
        }
        return item;
      });
  }, [cardItems, isMitraView]);

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs ${className}`}>
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1c1a4e]">
            {isMitraView ? 'STATUS KANDIDAT MITRA' : 'DASHBOARD STATISTIK'}
          </h2>
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
            {isMitraView
              ? 'MONITORING KANDIDAT SIAP MATCHING, PENJADWALAN INTERVIEW & STATUS ON JOB'
              : 'RINGKASAN DATA KANDIDAT PORTAL CV IJEF'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={refreshingState}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs rounded-xl border border-slate-300 shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            title="Muat ulang dan sinkronkan data statistik kandidat"
          >
            <RotateCw className={`w-3.5 h-3.5 text-slate-600 ${refreshingState ? 'animate-spin' : ''}`} />
            <span className="uppercase tracking-wider">REFRESH DATA</span>
          </button>
        </div>
      </div>

      {/* KLASIFIKASI PEMISAHAN JENIS KELAMIN (GENDER) - INTERAKTIF */}
      <div className="bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3.5 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isMitraView
                    ? 'KLASIFIKASI PEMISAHAN JENIS KELAMIN (SIAP MATCHING JOB)'
                    : 'KLASIFIKASI PEMISAHAN JENIS KELAMIN'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {isMitraView ? 'Siap Matching Job' : 'Interaktif'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isMitraView
                  ? 'Khusus kandidat siap matching job: Klik kartu Pria atau Wanita untuk menyaring daftar kandidat'
                  : 'Klik kartu Pria atau Wanita untuk menyaring dan langsung menampilkan daftar kandidat yang dipilih'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedGender && selectedGender !== 'Semua' && (
              <button
                type="button"
                onClick={() => onSelectGender && onSelectGender('Semua')}
                className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Hapus filter jenis kelamin dan tampilkan semua"
              >
                <span>✕ Reset Filter ({selectedGender === 'Laki-laki' ? 'Pria' : 'Wanita'})</span>
              </button>
            )}
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
              {selectedGender === 'Laki-laki'
                ? (isMitraView ? 'Filter: ♂ Pria (Siap Matching)' : 'Filter: ♂ Pria (Laki-laki)')
                : selectedGender === 'Perempuan'
                ? (isMitraView ? 'Filter: ♀ Wanita (Siap Matching)' : 'Filter: ♀ Wanita (Perempuan)')
                : (isMitraView ? 'Semua Gender (Siap Matching)' : 'Semua Gender')}
            </span>
          </div>
        </div>

        {/* 3 Clickable Gender Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. SEMUA GENDER */}
          <button
            type="button"
            onClick={() => onSelectGender && onSelectGender('Semua')}
            className={`text-left rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              selectedGender === 'Semua' || !selectedGender
                ? 'bg-[#1c1a4e] text-white border-[#1c1a4e] ring-2 ring-indigo-400 shadow-md scale-[1.01]'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  selectedGender === 'Semua' || !selectedGender
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {isMitraView ? 'SEMUA GENDER (SIAP MATCHING)' : 'SEMUA GENDER'}
                </span>
                <span className={`text-xs font-bold ${
                  selectedGender === 'Semua' || !selectedGender ? 'text-indigo-200' : 'text-slate-500'
                }`}>
                  100% {isMitraView ? 'Siap Matching' : 'Total'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black ${
                  selectedGender === 'Semua' || !selectedGender ? 'text-white' : 'text-slate-900'
                }`}>
                  {activeGenderTotal}
                </span>
                <span className={`text-xs font-bold ${
                  selectedGender === 'Semua' || !selectedGender ? 'text-white/80' : 'text-slate-500'
                }`}>
                  {isMitraView ? 'Kandidat Siap Matching' : 'Kandidat'}
                </span>
              </div>
              <p className={`text-[11px] font-medium mt-1 ${
                selectedGender === 'Semua' || !selectedGender ? 'text-white/75' : 'text-slate-500'
              }`}>
                Pria ({activeGenderPria}) + Wanita ({activeGenderWanita})
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-current/15 flex items-center justify-between text-[10px] font-bold">
              <span>{selectedGender === 'Semua' || !selectedGender ? (isMitraView ? '✓ Menampilkan Siap Matching' : '✓ Menampilkan Semua') : 'Klik untuk Semua'}</span>
              <span>100%</span>
            </div>
          </button>

          {/* 2. PRIA (LAKI-LAKI) */}
          <button
            type="button"
            onClick={() => onSelectGender && onSelectGender(selectedGender === 'Laki-laki' ? 'Semua' : 'Laki-laki')}
            className={`text-left rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              selectedGender === 'Laki-laki'
                ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white border-blue-600 ring-3 ring-blue-400 shadow-lg scale-[1.02]'
                : 'bg-white text-slate-800 border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 shadow-2xs hover:scale-[1.01]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  selectedGender === 'Laki-laki'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  <span>♂</span>
                  <span>{isMitraView ? 'PRIA SIAP MATCHING' : 'PRIA (LAKI-LAKI)'}</span>
                </span>
                <span className={`text-xs font-black ${
                  selectedGender === 'Laki-laki' ? 'text-blue-100' : 'text-blue-700'
                }`}>
                  {genderPriaPercentage}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black ${
                  selectedGender === 'Laki-laki' ? 'text-white' : 'text-slate-900'
                }`}>
                  {activeGenderPria}
                </span>
                <span className={`text-xs font-bold ${
                  selectedGender === 'Laki-laki' ? 'text-blue-100' : 'text-blue-700'
                }`}>
                  {isMitraView ? 'Siswa Pria (Siap Matching)' : 'Siswa Pria'}
                </span>
              </div>
              <p className={`text-[11px] font-medium mt-1 ${
                selectedGender === 'Laki-laki' ? 'text-blue-100' : 'text-slate-500'
              }`}>
                {genderPriaPercentage}% {isMitraView ? 'dari kandidat siap matching' : 'dari total kandidat'}
              </p>
            </div>

            <div className="mt-3">
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                selectedGender === 'Laki-laki' ? 'bg-white/25' : 'bg-blue-100'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedGender === 'Laki-laki' ? 'bg-white' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(Number(genderPriaPercentage), activeGenderPria > 0 ? 5 : 0))}%` }}
                />
              </div>
              <div className={`mt-2 text-[10px] font-bold flex items-center justify-between ${
                selectedGender === 'Laki-laki' ? 'text-white' : 'text-blue-800'
              }`}>
                <span>{selectedGender === 'Laki-laki' ? '✓ Filter Aktif (Pria)' : 'Klik Tampilkan Pria'}</span>
                <span>{activeGenderPria} Siswa</span>
              </div>
            </div>
          </button>

          {/* 3. WANITA (PEREMPUAN) */}
          <button
            type="button"
            onClick={() => onSelectGender && onSelectGender(selectedGender === 'Perempuan' ? 'Semua' : 'Perempuan')}
            className={`text-left rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              selectedGender === 'Perempuan'
                ? 'bg-gradient-to-br from-rose-600 to-pink-700 text-white border-rose-500 ring-3 ring-rose-400 shadow-lg scale-[1.02]'
                : 'bg-white text-slate-800 border-rose-200 hover:border-rose-400 hover:bg-rose-50/40 shadow-2xs hover:scale-[1.01]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  selectedGender === 'Perempuan'
                    ? 'bg-white/20 text-white'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}>
                  <span>♀</span>
                  <span>{isMitraView ? 'WANITA SIAP MATCHING' : 'WANITA (PEREMPUAN)'}</span>
                </span>
                <span className={`text-xs font-black ${
                  selectedGender === 'Perempuan' ? 'text-rose-100' : 'text-rose-700'
                }`}>
                  {genderWanitaPercentage}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black ${
                  selectedGender === 'Perempuan' ? 'text-white' : 'text-slate-900'
                }`}>
                  {activeGenderWanita}
                </span>
                <span className={`text-xs font-bold ${
                  selectedGender === 'Perempuan' ? 'text-rose-100' : 'text-rose-700'
                }`}>
                  {isMitraView ? 'Siswi Wanita (Siap Matching)' : 'Siswi Wanita'}
                </span>
              </div>
              <p className={`text-[11px] font-medium mt-1 ${
                selectedGender === 'Perempuan' ? 'text-rose-100' : 'text-slate-500'
              }`}>
                {genderWanitaPercentage}% {isMitraView ? 'dari kandidat siap matching' : 'dari total kandidat'}
              </p>
            </div>

            <div className="mt-3">
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${
                selectedGender === 'Perempuan' ? 'bg-white/25' : 'bg-rose-100'
              }`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedGender === 'Perempuan' ? 'bg-white' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(Number(genderWanitaPercentage), activeGenderWanita > 0 ? 5 : 0))}%` }}
                />
              </div>
              <div className={`mt-2 text-[10px] font-bold flex items-center justify-between ${
                selectedGender === 'Perempuan' ? 'text-white' : 'text-rose-800'
              }`}>
                <span>{selectedGender === 'Perempuan' ? '✓ Filter Aktif (Wanita)' : 'Klik Tampilkan Wanita'}</span>
                <span>{activeGenderWanita} Siswi</span>
              </div>
            </div>
          </button>
        </div>

        {/* Dual Ratio Visual Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
            <span className="text-blue-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>♂ Pria: <strong>{activeGenderPria}</strong> Siswa ({genderPriaPercentage}%)</span>
            </span>
            <span className="text-slate-400 font-medium text-[10px] hidden sm:inline">
              {isMitraView ? 'Rasio Distribusi Gender (Siap Matching Job)' : 'Rasio Distribusi Gender'}
            </span>
            <span className="text-rose-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span>♀ Wanita: <strong>{activeGenderWanita}</strong> Siswi ({genderWanitaPercentage}%)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-blue-600 h-full transition-all duration-500"
              style={{ width: `${genderPriaPercentage}%` }}
              title={`Pria: ${activeGenderPria} (${genderPriaPercentage}%)`}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${genderWanitaPercentage}%` }}
              title={`Wanita: ${activeGenderWanita} (${genderWanitaPercentage}%)`}
            />
          </div>
        </div>
      </div>

      {/* KLASIFIKASI KATEGORI SUMBER SISWA */}
      <div className="bg-gradient-to-br from-slate-50 via-teal-50/25 to-emerald-50/30 border border-slate-200/90 rounded-2xl p-4 sm:p-5 mb-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3.5 border-b border-slate-200/80">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                  {isMitraView ? 'KATEGORI SUMBER SISWA & MITRA' : 'KLASIFIKASI KATEGORI SUMBER SISWA'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Interaktif
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Klik salah satu kategori sumber siswa untuk memfilter daftar kandidat secara instan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedCategory && selectedCategory !== 'Semua' && (
              <button
                type="button"
                onClick={() => onSelectCategory && onSelectCategory('Semua')}
                className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Reset filter kategori"
              >
                <span>✕ Reset Kategori</span>
              </button>
            )}
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
              Filter Kategori: {selectedCategory || 'Semua'}
            </span>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              key: 'SISWA IJEF - Offline',
              title: 'Siswa IJEF Offline',
              sub: 'Asrama LPK',
              count: totalStats.siswaIjefOffline,
              badgeBg: 'bg-indigo-100 text-indigo-800',
              activeColor: 'bg-indigo-700 text-white border-indigo-700 ring-2 ring-indigo-400 shadow-md'
            },
            {
              key: 'SISWA IJEF - Online',
              title: 'Siswa IJEF Online',
              sub: 'Kelas Virtual',
              count: totalStats.siswaIjefOnline,
              badgeBg: 'bg-blue-100 text-blue-800',
              activeColor: 'bg-blue-700 text-white border-blue-700 ring-2 ring-blue-400 shadow-md'
            },
            {
              key: 'SISWA MITRA / NON IJEF',
              title: 'Siswa Mitra',
              sub: 'Jaringan Mitra',
              count: totalStats.siswaMitra,
              badgeBg: 'bg-teal-100 text-teal-800',
              activeColor: 'bg-teal-700 text-white border-teal-700 ring-2 ring-teal-400 shadow-md'
            },
            {
              key: 'NEW COMER',
              title: 'Siswa New Comer',
              sub: 'Non IJEF Reguler',
              count: totalStats.siswaNonIjefNewComer,
              badgeBg: 'bg-emerald-100 text-emerald-800',
              activeColor: 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400 shadow-md'
            },
            {
              key: 'EX MAGANG/EX-TRAINEE',
              title: 'Ex-Magang / Trainee',
              sub: 'Matching Job',
              count: totalStats.matchingExMagang,
              badgeBg: 'bg-purple-100 text-purple-800',
              activeColor: 'bg-purple-700 text-white border-purple-700 ring-2 ring-purple-400 shadow-md'
            },
            {
              key: 'MATCHING JOB - Engineering / Gijinkoku',
              title: 'Engineering / Gijinkoku',
              sub: 'Professional',
              count: totalStats.matchingEngineering,
              badgeBg: 'bg-amber-100 text-amber-900',
              activeColor: 'bg-amber-700 text-white border-amber-700 ring-2 ring-amber-400 shadow-md'
            }
          ].map((cat) => {
            const isSelectedCat = selectedCategory === cat.key || (cat.key === 'SISWA IJEF - Offline' && selectedCategory?.includes('SISWA IJEF')) || (cat.key === 'NEW COMER' && selectedCategory === 'NEW COMER');
            const pct = (totalStats.total || 0) > 0 ? ((cat.count / totalStats.total) * 100).toFixed(1) : '0.0';
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(isSelectedCat ? 'Semua' : cat.key)}
                className={`text-left rounded-xl p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelectedCat ? cat.activeColor : `bg-white border-slate-200 hover:border-slate-300 shadow-2xs`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isSelectedCat ? 'bg-white/20 text-white' : cat.badgeBg
                    }`}>
                      {cat.sub}
                    </span>
                    <span className={`text-[10px] font-bold ${
                      isSelectedCat ? 'text-white/90' : 'text-slate-500'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono tracking-tight my-0.5">
                    {cat.count} <span className="text-[10px] font-normal">Siswa</span>
                  </div>
                  <div className={`text-[11px] font-bold leading-tight ${
                    isSelectedCat ? 'text-white' : 'text-slate-800'
                  }`}>
                    {cat.title}
                  </div>
                </div>
                <div className={`mt-2 pt-1.5 border-t text-[9px] font-semibold flex items-center justify-between ${
                  isSelectedCat ? 'border-white/20 text-white/80' : 'border-slate-100 text-slate-400'
                }`}>
                  <span>{isSelectedCat ? '✓ Aktif' : 'Klik Filter'}</span>
                  <span>{cat.count} Orang</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Cards Grid: 4 Columns for Mitra, 5 Columns for Admin */}
      <div className={`grid gap-3.5 sm:gap-4 ${isMitraView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
        {displayedCardItems.map((item) => {
          const isSelected = selectedStatus === item.key;
          const isNavy = item.badgeType === 'navy';

          if (isNavy) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectStatus && onSelectStatus(isSelected ? 'Semua' : item.key)}
                className={`text-left rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden bg-[#242167] text-white ${
                  isSelected
                    ? 'ring-3 ring-indigo-400 scale-[1.02] shadow-lg'
                    : 'hover:bg-[#1e1b59] hover:shadow-md hover:scale-[1.01]'
                }`}
              >
                {/* Top Row: Icon + Large Count */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white leading-none tracking-tight">
                    {item.count}
                  </div>
                </div>

                {/* Middle Info: Title + Percentage */}
                <div className="mt-4">
                  <div className="text-[10px] sm:text-[11px] font-black text-white/90 uppercase tracking-wider leading-tight">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200 mt-1.5">
                    <span>Total Siswa</span>
                    <span className="text-white font-black">{item.percentage}%</span>
                  </div>
                </div>

                {/* Bottom Progress Bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-full" />
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-white/75 flex items-center justify-between">
                    <span>{isSelected ? '✓ Filter Aktif' : 'Semua Kandidat'}</span>
                    <span className="text-white/60 text-[9px]">100% Data</span>
                  </div>
                </div>
              </button>
            );
          }

          // Cards 2 through 10 (White Background with distinct colored badges and bars)
          const numPercent = Number(item.percentage) || 0;
          const barWidthPercent = item.count > 0 ? Math.max(numPercent, 4) : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectStatus && onSelectStatus(isSelected ? 'Semua' : item.key)}
              className={`text-left bg-white border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-[#242167] ring-2 ring-[#242167] shadow-md scale-[1.02] bg-indigo-50/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md hover:scale-[1.01]'
              }`}
            >
              {/* Top Row: Square Badge + Large Count */}
              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-lg border shadow-2xs leading-none shrink-0 ${item.badgeBg}`}
                >
                  <span>{item.badgeText}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none tracking-tight">
                  {item.count}
                </div>
              </div>

              {/* Middle Row: Title */}
              <div className="mt-3.5">
                <div
                  className="text-[10px] sm:text-[11px] font-black text-slate-700 uppercase tracking-wider leading-tight min-h-[28px] line-clamp-2"
                  title={item.title}
                >
                  {item.title}
                </div>

                {/* Percentage Calculation based on Total Students */}
                <div className="flex items-center justify-between text-[11px] mt-1.5 font-bold">
                  <span className="text-slate-400 text-[10px]">Persentase</span>
                  <span className={`font-black ${item.percentColor}`}>
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Bottom Row: Dynamic Progress Bar */}
              <div className="mt-3">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                    style={{ width: `${barWidthPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
                  <span className={isSelected ? 'text-[#242167] font-black' : ''}>
                    {isSelected ? '✓ Filter Aktif' : `${item.count} Siswa`}
                  </span>
                  <span className="text-[9px] text-slate-400">{item.percentage}% dari Total</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CandidateDashboardStatistics;
