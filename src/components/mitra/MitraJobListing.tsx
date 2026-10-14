import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { JobPosting } from '../../types';
import { MitraApplyJobModal } from './MitraApplyJobModal';
import { MitraJobFormModal } from './MitraJobFormModal';
import { JobDescriptionCategorizedView } from '../common/JobDescriptionCategorizedView';
import { formatRupiah } from '../../utils/financingCalculator';
import { useDevice } from '../../hooks/useDevice';
import {
  isJobActiveAndAvailable,
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  detectJobSector,
  translateSector
} from '../../utils/mitraJobUtils';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  Banknote,
  Users,
  Award,
  Filter,
  Sparkles,
  ChevronRight,
  Send,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Info,
  Calendar,
  Layers,
  ArrowUpDown,
  Home,
  Clock,
  UserCheck,
  Tag,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  PlusCircle,
  Plus,
  Edit3
} from 'lucide-react';

export const MitraJobListing: React.FC = () => {
  const { jobPostings, jobApplications } = useApp();
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tMitra,
    bilingual
  } = useEcosystemTranslation('mitraPortal');
  const device = useDevice();

  // Search & Filters (Permanently locked to active jobs managed by Admin 2 & Mitra)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedUrgensi, setSelectedUrgensi] = useState<string>('ALL');
  const [selectedDomisili, setSelectedDomisili] = useState<string>('ALL');
  const [selectedPrefecture, setSelectedPrefecture] = useState<string>('ALL');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [selectedMinSalary, setSelectedMinSalary] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SALARY_DESC' | 'QUOTA_DESC'>('NEWEST');

  // Modal states
  const [activeApplyJob, setActiveApplyJob] = useState<JobPosting | null>(null);
  const [selectedDetailJob, setSelectedDetailJob] = useState<JobPosting | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active-only base job pool (Strictly managed by Admin 2)
  const activeJobsPool = useMemo(() => {
    return jobPostings.filter(isJobActiveAndAvailable);
  }, [jobPostings]);

  // Extract unique prefectures strictly from active data
  const prefectures = useMemo(() => {
    const set = new Set<string>();
    activeJobsPool.forEach((j) => {
      if (j.lokasiPrefektur && j.lokasiPrefektur !== 'Berbagai Prefektur di Jepang') {
        const clean = j.lokasiPrefektur.split('&')[0].trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set).sort();
  }, [activeJobsPool]);

  // Filter & Sort Logic (Strictly on active jobs)
  const filteredJobs = useMemo(() => {
    let result = activeJobsPool.filter((job) => {
      const sanitizedTitle = getSanitizedJobTitle(job).toLowerCase();
      const sanitizedCompany = getSanitizedCompany(job).toLowerCase();
      const rawTitle = (job.judulPekerjaan || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !term ||
        sanitizedTitle.includes(term) ||
        rawTitle.includes(term) ||
        sanitizedCompany.includes(term) ||
        (job.lokasiPrefektur || '').toLowerCase().includes(term) ||
        (job.kodeJob || '').toLowerCase().includes(term) ||
        (job.persyaratanJLPT || '').toLowerCase().includes(term) ||
        (job.deskripsiPekerjaan || '').toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Urgensi filter
      if (selectedUrgensi !== 'ALL') {
        const urgensi = (job.urgensiJob || 'STANDART').toUpperCase();
        if (urgensi !== selectedUrgensi) return false;
      }

      // Domisili filter
      if (selectedDomisili !== 'ALL') {
        const dom = job.kategoriDomisili || (job.statusJob === 'Lokal/Domestik (Jepang)' ? 'Domestik (Jepang)' : 'Lokal (Indonesia)');
        if (dom !== selectedDomisili) return false;
      }

      // Sector filter
      if (selectedSector !== 'ALL') {
        const sector = detectJobSector(job);
        if (selectedSector === 'KAIGO' && sector !== 'KAIGO') return false;
        if (selectedSector === 'PM' && sector !== 'PM') return false;
        if (selectedSector === 'PERTANIAN' && sector !== 'PERTANIAN') return false;
        if (selectedSector === 'KIKAI KAKOU' && sector !== 'KIKAI KAKOU') return false;
        if (selectedSector === 'ENGINEERING' && sector !== 'ENGINEERING') return false;
        if (selectedSector === 'KONSTRUKSI' && sector !== 'KONSTRUKSI') return false;
      }

      // Prefecture filter
      if (selectedPrefecture !== 'ALL') {
        if (!(job.lokasiPrefektur || '').includes(selectedPrefecture)) return false;
      }

      // Target category filter
      if (selectedTarget !== 'ALL') {
        if (job.kategoriTarget !== selectedTarget && job.kategoriTarget !== 'Semua Non-IJEF') {
          return false;
        }
      }

      // Salary filter
      if (selectedMinSalary > 0) {
        if ((job.gajiBulananYen || 0) < selectedMinSalary) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'SALARY_DESC') {
      result = [...result].sort((a, b) => (b.gajiBulananYen || 0) - (a.gajiBulananYen || 0));
    } else if (sortBy === 'QUOTA_DESC') {
      result = [...result].sort((a, b) => (b.kuotaSiswa || 0) - (a.kuotaSiswa || 0));
    }

    return result;
  }, [activeJobsPool, searchTerm, selectedUrgensi, selectedDomisili, selectedSector, selectedPrefecture, selectedTarget, selectedMinSalary, sortBy]);

  // Urgensi Counts from active pool
  const urgensiCounts = useMemo(() => {
    const counts = {
      ALL: activeJobsPool.length,
      URGENT: 0,
      STANDART: 0,
      SLOW: 0
    };

    activeJobsPool.forEach((j) => {
      const u = (j.urgensiJob || 'STANDART').toUpperCase();
      if (u === 'URGENT') counts.URGENT++;
      else if (u === 'SLOW') counts.SLOW++;
      else counts.STANDART++;
    });

    return counts;
  }, [activeJobsPool]);

  // Sector Counts from active pool
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: 0,
      KAIGO: 0,
      PM: 0,
      PERTANIAN: 0,
      KIKAI_KAKOU: 0,
      ENGINEERING: 0,
      KONSTRUKSI: 0
    };

    counts.ALL = activeJobsPool.length;

    activeJobsPool.forEach((j) => {
      const s = detectJobSector(j);
      if (s === 'KAIGO') counts.KAIGO++;
      else if (s === 'PM') counts.PM++;
      else if (s === 'PERTANIAN') counts.PERTANIAN++;
      else if (s === 'KIKAI KAKOU') counts.KIKAI_KAKOU++;
      else if (s === 'ENGINEERING') counts.ENGINEERING++;
      else if (s === 'KONSTRUKSI') counts.KONSTRUKSI++;
    });

    return counts;
  }, [activeJobsPool]);

  const handleApplySuccess = (candidateNames: string) => {
    setSuccessToast(
      lang === 'ja'
        ? `候補生 [${candidateNames}] の求人推薦が完了しました！`
        : `Berhasil mendaftarkan siswa [${candidateNames}] ke lowongan pekerjaan! Data telah disinkronkan ke Back-Office Admin.`
    );
    setTimeout(() => setSuccessToast(null), 6000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slide-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-emerald-100 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-700/50 rounded-lg cursor-pointer"
          >
            {lang === 'ja' ? '閉じる' : 'Tutup'}
          </button>
        </div>
      )}

      {/* Header Banner - Responsive */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{lang === 'ja' ? '募集中・選考可能求人 • IJEF公式認証' : 'Lowongan Aktif & Siap Daftar • Terverifikasi IJEF'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
              {lang === 'ja' ? 'パートナー企業向け 日本求人リスティング' : 'Listing Lowongan Kerja Jepang untuk Mitra'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'ja'
                ? '特定技能、技術・人文知識・国際業務（技人国）、および元実習生向け求人一覧です。パートナー機関は候補生を推薦・登録できます。'
                : 'Daftar lowongan resmi Tokutei Ginou (SSW), Gijinkoku Engineer, dan Ex-Magang yang telah diverifikasi oleh Back-Office Admin IJEF. Mitra dapat langsung memilih job, mendaftarkan siswa binaannya, atau menambahkan lowongan pekerjaan sendiri.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setEditingJob(null);
                  setShowAddJobModal(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition active:scale-95 shrink-0 cursor-pointer border border-emerald-400/30"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'ja' ? '+ 自社求人を追加（パートナー）' : '+ Tambah Job Sendiri (Mitra)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics - Adaptive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-3 rounded-2xl">
              <div className="text-[10px] sm:text-[11px] text-indigo-200 font-medium">{lang === 'ja' ? '募集中求人' : 'Lowongan Aktif'}</div>
              <div className="text-lg sm:text-2xl font-black text-white mt-0.5">{activeJobsPool.length}</div>
              <div className="text-[9px] sm:text-[10px] text-emerald-300 font-medium mt-0.5">{lang === 'ja' ? '応募受付中' : 'Status Siap Lamar'}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-3 rounded-2xl">
              <div className="text-[10px] sm:text-[11px] text-indigo-200 font-medium">{lang === 'ja' ? '検索結果' : 'Tersedia untuk Mitra'}</div>
              <div className="text-lg sm:text-2xl font-black text-amber-300 mt-0.5">{filteredJobs.length}</div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 mt-0.5">{lang === 'ja' ? '該当件数' : 'Sesuai Filter'}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-3 rounded-2xl col-span-2 sm:col-span-1">
              <div className="text-[10px] sm:text-[11px] text-indigo-200 font-medium">{lang === 'ja' ? '平均月給' : 'Gaji Rata-Rata'}</div>
              <div className="text-lg sm:text-2xl font-black text-emerald-300 mt-0.5">¥210,000+</div>
              <div className="text-[9px] sm:text-[10px] text-slate-300 mt-0.5">
                {lang === 'ja' ? '年収換算 約250万〜350万円' : '~Rp 22-30 Jt/bln'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Selection Pills - Horizontal swipeable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scroll-smooth -mx-1 px-1">
        <button
          onClick={() => setSelectedSector('ALL')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{lang === 'ja' ? '全分野' : 'Semua Bidang'} ({sectorCounts.ALL})</span>
        </button>

        <button
          onClick={() => setSelectedSector('KAIGO')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'KAIGO'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🏥 {lang === 'ja' ? '介護分野' : 'Kaigo (Caregiver)'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'KAIGO' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.KAIGO}
          </span>
        </button>

        <button
          onClick={() => setSelectedSector('PM')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'PM'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🍱 {lang === 'ja' ? '食品製造' : 'Pengolahan Makanan'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'PM' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.PM}
          </span>
        </button>

        <button
          onClick={() => setSelectedSector('PERTANIAN')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'PERTANIAN'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🌾 {lang === 'ja' ? '農業分野' : 'Pertanian (Agri)'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'PERTANIAN' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.PERTANIAN}
          </span>
        </button>

        <button
          onClick={() => setSelectedSector('KIKAI KAKOU')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'KIKAI KAKOU'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>⚙️ {lang === 'ja' ? '機械加工・製造' : 'Manufaktur & Mesin'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'KIKAI KAKOU' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.KIKAI_KAKOU}
          </span>
        </button>

        <button
          onClick={() => setSelectedSector('ENGINEERING')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'ENGINEERING'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>💻 {lang === 'ja' ? '技術・技人国' : 'Gijinkoku Engineer'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'ENGINEERING' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.ENGINEERING}
          </span>
        </button>

        <button
          onClick={() => setSelectedSector('KONSTRUKSI')}
          className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            selectedSector === 'KONSTRUKSI'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🏗️ {lang === 'ja' ? '建設分野' : 'Konstruksi'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSector === 'KONSTRUKSI' ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {sectorCounts.KONSTRUKSI}
          </span>
        </button>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={lang === 'ja' ? '求人名、企業名、勤務地、資格要件で検索...' : 'Cari judul lowongan, perusahaan, prefektur, atau syarat JLPT...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition text-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="NEWEST">⚡ {lang === 'ja' ? '新着順' : 'Terbaru'}</option>
                <option value="SALARY_DESC">💰 {lang === 'ja' ? '給与が高い順' : 'Gaji Tertinggi'}</option>
                <option value="QUOTA_DESC">👥 {lang === 'ja' ? '募集枠が多い順' : 'Kuota Terbanyak'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Urgensi Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {lang === 'ja' ? '緊急度' : 'Urgensi'}
            </label>
            <select
              value={selectedUrgensi}
              onChange={(e) => setSelectedUrgensi(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ja' ? 'すべての緊急度' : 'Semua Urgensi'} ({urgensiCounts.ALL})</option>
              <option value="URGENT">🔥 Urgent ({urgensiCounts.URGENT})</option>
              <option value="STANDART">⚡ Standart ({urgensiCounts.STANDART})</option>
              <option value="SLOW">⏳ Slow ({urgensiCounts.SLOW})</option>
            </select>
          </div>

          {/* Domisili Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {lang === 'ja' ? '居住地対象' : 'Domisili Kandidat'}
            </label>
            <select
              value={selectedDomisili}
              onChange={(e) => setSelectedDomisili(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ja' ? 'すべて（国内/現地）' : 'Semua Domisili'}</option>
              <option value="Lokal (Indonesia)">🇮🇩 {lang === 'ja' ? 'インドネシア国内' : 'Lokal (Indonesia)'}</option>
              <option value="Domestik (Jepang)">🇯🇵 {lang === 'ja' ? '日本在住・元実習生' : 'Domestik (Jepang)'}</option>
            </select>
          </div>

          {/* Prefecture Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {lang === 'ja' ? '勤務都道府県' : 'Prefektur Jepang'}
            </label>
            <select
              value={selectedPrefecture}
              onChange={(e) => setSelectedPrefecture(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ja' ? '全プレフェクチュア' : 'Semua Prefektur'}</option>
              {prefectures.map((pref) => (
                <option key={pref} value={pref}>
                  📍 {pref}
                </option>
              ))}
            </select>
          </div>

          {/* Experience / Target Candidate Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {lang === 'ja' ? '応募資格（経験/新人）' : 'Syarat Pengalaman'}
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{lang === 'ja' ? 'すべての応募資格' : 'Semua (New Comer & Ex-Magang)'}</option>
              <option value="SISWA NON IJEF (New Comer)">🌱 {lang === 'ja' ? '新人・未経験可 (New Comer)' : 'New Comer (Non-Pengalaman)'}</option>
              <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">⭐ {lang === 'ja' ? '元実習生・経験者限定' : 'Wajib Berpengalaman (Ex-Magang)'}</option>
              <option value="MATCHING JOB - Engineering / Gijinkoku">🎓 {lang === 'ja' ? 'エンジニア・技人国' : 'Gijinkoku Engineer'}</option>
            </select>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span>
            {lang === 'ja' ? '表示中: ' : 'Menampilkan '}
            <strong className="text-slate-900">{filteredJobs.length}</strong> {lang === 'ja' ? '件の求人' : 'lowongan aktif'}
          </span>
          <div className="flex items-center gap-2">
            {(searchTerm || selectedSector !== 'ALL' || selectedUrgensi !== 'ALL' || selectedDomisili !== 'ALL' || selectedPrefecture !== 'ALL' || selectedTarget !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSector('ALL');
                  setSelectedUrgensi('ALL');
                  setSelectedDomisili('ALL');
                  setSelectedPrefecture('ALL');
                  setSelectedTarget('ALL');
                  setSortBy('NEWEST');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{lang === 'ja' ? 'フィルター解除' : 'Reset Filter'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Grid - Adaptive Responsive Layout */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">
            {lang === 'ja' ? '条件に一致する求人は見つかりませんでした' : 'Tidak ada lowongan aktif yang sesuai kriteria'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {lang === 'ja'
              ? '検索キーワードまたは分野フィルターを変更して再検索してください。'
              : 'Silakan sesuaikan kata kunci pencarian atau ubah filter sektor bidang kerja untuk melihat lowongan aktif lainnya.'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedUrgensi('ALL');
              setSelectedDomisili('ALL');
              setSelectedSector('ALL');
              setSelectedPrefecture('ALL');
              setSelectedTarget('ALL');
              setSelectedMinSalary(0);
              setSortBy('NEWEST');
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            {lang === 'ja' ? 'すべての求人を表示' : 'Lihat Semua Lowongan Aktif'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredJobs.map((job, idx) => {
            const sector = detectJobSector(job);
            const appliedCandidatesCount = jobApplications.filter((a) => a.jobId === job.id).length;
            const cleanTitle = getSanitizedJobTitle(job, lang);
            const cleanCompany = getSanitizedCompany(job, lang);
            const cleanPrefecture = formatPrefecture(job.lokasiPrefektur, lang);

            return (
              <div
                key={job.id ? `${job.id}-${idx}` : `job-card-${idx}`}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group relative"
              >
                {/* Top badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          sector === 'KAIGO'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : sector === 'PM'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : sector === 'PERTANIAN'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : sector === 'ENGINEERING'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {translateSector(sector, lang)}
                      </span>

                      {/* Status Ketersediaan: Aktif / Close */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>{lang === 'ja' ? 'Aktif' : 'Aktif'}</span>
                      </span>

                      {/* Domisili Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          (job.kategoriDomisili === 'Domestik (Jepang)' || job.statusJob === 'Lokal/Domestik (Jepang)')
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {(job.kategoriDomisili === 'Domestik (Jepang)' || job.statusJob === 'Lokal/Domestik (Jepang)')
                          ? (lang === 'ja' ? '🇯🇵 日本在住・元実習生' : '🇯🇵 Domestik (Jepang)')
                          : (lang === 'ja' ? '🇮🇩 インドネシア国内' : '🇮🇩 Lokal (Indonesia)')}
                      </span>

                      {/* Urgensi Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          (job.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : (job.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}
                      >
                        {(job.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                          ? (lang === 'ja' ? '🔥 急募 (Urgent)' : '🔥 URGENT')
                          : (job.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                          ? (lang === 'ja' ? '⏳ 通常 (Slow)' : '⏳ SLOW')
                          : (lang === 'ja' ? '⚡ 標準 (Standard)' : '⚡ STANDART')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {job.kodeJob || job.id}
                      </span>
                      <button
                        onClick={() => {
                          setEditingJob(job);
                          setShowAddJobModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                        title={lang === 'ja' ? '求人情報を編集' : 'Edit / Sesuaikan Data Job'}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Sanitized Job Title (Clean, no TSK name) */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-700 transition">
                    {cleanTitle}
                  </h3>

                  {/* Japanese Company & Clean Location (NO TSK) */}
                  <div className="space-y-1 mt-2.5 text-xs text-slate-600">
                    <div className="flex items-start gap-1.5 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="break-words leading-snug" title={cleanCompany}>{cleanCompany}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cleanPrefecture}</span>
                      {job.jenisKelamin && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {lang === 'ja'
                              ? job.jenisKelamin.toLowerCase().includes('laki') && !job.jenisKelamin.toLowerCase().includes('perempuan')
                                ? '男性'
                                : job.jenisKelamin.toLowerCase().includes('perempuan') && !job.jenisKelamin.toLowerCase().includes('laki')
                                ? '女性'
                                : '不問 (男女)'
                              : job.jenisKelamin}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Salary Highlight Box */}
                  <div className="mt-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-3 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] sm:text-[11px] text-slate-500">{lang === 'ja' ? '基本月給目安:' : 'Estimasi Gaji Pokok:'}</div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-indigo-600 uppercase">
                        {lang === 'ja' ? '特定技能・技能実習' : 'Tokutei/Magang'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                        ¥{job.gajiBulananYen?.toLocaleString('ja-JP')}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500">
                        (~{formatRupiah(job.gajiEstimasiIdr || job.gajiBulananYen * 108)})
                      </span>
                    </div>
                  </div>

                  {/* Qualifications & Quota Info */}
                  <div className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-start gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {lang === 'ja' ? '要件:' : 'Syarat:'} <strong>{job.persyaratanJLPT || (lang === 'ja' ? '日本語N4以上 / JFT-Basic' : 'Min. N4 / JFT-Basic')}</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {lang === 'ja' ? '募集枠:' : 'Kuota:'} <strong>{job.kuotaSiswa || 5} {lang === 'ja' ? '名' : 'Siswa'}</strong>
                      </span>
                      <span className="text-indigo-700 font-semibold">
                        {appliedCandidatesCount} {lang === 'ja' ? '名推薦済' : 'Siswa Terdaftar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons - Touch friendly */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDetailJob(job)}
                    className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer shrink-0"
                    title={lang === 'ja' ? '詳細を見る' : 'Lihat Detail Lowongan'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveApplyJob(job)}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? '候補生を推薦・応募する' : 'Pilih Job & Daftarkan Siswa'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Apply / Nominate Candidate to Job */}
      {activeApplyJob && (
        <MitraApplyJobModal
          job={activeApplyJob}
          onClose={() => setActiveApplyJob(null)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* Modal 2: Detail Job View (Categorized & Structured) */}
      {selectedDetailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-4 sm:my-6 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                    {translateSector(detectJobSector(selectedDetailJob), lang)} • ID {selectedDetailJob.kodeJob || selectedDetailJob.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      (selectedDetailJob.kategoriDomisili === 'Domestik (Jepang)' || selectedDetailJob.statusJob === 'Lokal/Domestik (Jepang)')
                        ? 'bg-sky-400/20 text-sky-200 border border-sky-400/30'
                        : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                    }`}
                  >
                    {(selectedDetailJob.kategoriDomisili === 'Domestik (Jepang)' || selectedDetailJob.statusJob === 'Lokal/Domestik (Jepang)')
                      ? (lang === 'ja' ? '🇯🇵 日本在住・元実習生' : '🇯🇵 Domestik (Jepang)')
                      : (lang === 'ja' ? '🇮🇩 インドネシア国内' : '🇮🇩 Lokal (Indonesia)')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      (selectedDetailJob.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : (selectedDetailJob.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {(selectedDetailJob.urgensiJob || 'STANDART').toUpperCase() === 'URGENT'
                      ? (lang === 'ja' ? '🔥 急募 (Urgent)' : '🔥 URGENT')
                      : (selectedDetailJob.urgensiJob || 'STANDART').toUpperCase() === 'SLOW'
                      ? (lang === 'ja' ? '⏳ 通常 (Slow)' : '⏳ SLOW')
                      : (lang === 'ja' ? '⚡ 標準 (Standard)' : '⚡ STANDART')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      selectedDetailJob.statusJob === 'Tutup'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {selectedDetailJob.statusJob === 'Tutup' ? 'Close' : 'Aktif'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-2">
                  {getSanitizedJobTitle(selectedDetailJob, lang)}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {getSanitizedCompany(selectedDetailJob, lang)} • {formatPrefecture(selectedDetailJob.lokasiPrefektur, lang)}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetailJob(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Structured Categorized Job Description */}
              <JobDescriptionCategorizedView job={selectedDetailJob} lang={lang} isMitraView={true} />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setSelectedDetailJob(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'ja' ? '閉じる' : 'Tutup'}
              </button>

              <button
                onClick={() => {
                  const job = selectedDetailJob;
                  setSelectedDetailJob(null);
                  setActiveApplyJob(job);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'ja' ? '候補生を推薦・応募する' : 'Pilih Job & Daftarkan Siswa Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add / Edit Job Posting by Mitra (Same schema and pattern as Admin 2) */}
      <MitraJobFormModal
        isOpen={showAddJobModal}
        onClose={() => {
          setShowAddJobModal(false);
          setEditingJob(null);
        }}
        initialJob={editingJob}
        onSaveSuccess={(savedJob) => {
          setSuccessToast(
            lang === 'ja'
              ? `求人「${savedJob.judulPekerjaan}」(${savedJob.kodeJob}) を保存しました。`
              : `Lowongan "${savedJob.judulPekerjaan}" (${savedJob.kodeJob}) berhasil disimpan ke katalog dan langsung aktif!`
          );
          setTimeout(() => setSuccessToast(null), 5000);
        }}
      />
    </div>
  );
};
