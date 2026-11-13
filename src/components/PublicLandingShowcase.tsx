import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import { getStoredUiShowcaseConfig } from '../data/uiShowcaseConfig';
import { detectJobSector, formatPrefecture, getSanitizedJobTitle, getSanitizedCompany, translateSector } from '../utils/mitraJobUtils';
import {
  Building2,
  Users,
  Search,
  Briefcase,
  MapPin,
  Banknote,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  LogIn,
  GraduationCap,
  Award,
  Globe,
  Flame,
  FileText,
  BookOpen,
  Calendar,
  Layers,
  Star
} from 'lucide-react';

interface PublicLandingShowcaseProps {
  onSelectPortal: (portal: 'mitra' | 'siswa' | 'admin') => void;
}

export const PublicLandingShowcase: React.FC<PublicLandingShowcaseProps> = ({ onSelectPortal }) => {
  const navigate = useNavigate();
  const { jobPostings, students, rirekishoRecords } = useApp();
  const { lang, setLang } = useEcosystemTranslation('common');

  const config = useMemo(() => getStoredUiShowcaseConfig(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedPrefecture, setSelectedPrefecture] = useState('ALL');

  // Filter active jobs only
  const activeJobs = useMemo(() => {
    return jobPostings.filter((j) => (j.statusJob || 'Aktif') !== 'Tutup');
  }, [jobPostings]);

  // Extract unique prefectures
  const prefectures = useMemo(() => {
    const set = new Set<string>();
    activeJobs.forEach((j) => {
      if (j.lokasiPrefektur && j.lokasiPrefektur !== 'Berbagai Prefektur di Jepang') {
        const clean = j.lokasiPrefektur.split('&')[0].trim();
        if (clean) set.add(clean);
      }
    });
    return Array.from(set).sort();
  }, [activeJobs]);

  // Filtered jobs for public view
  const filteredJobs = useMemo(() => {
    return activeJobs.filter((job) => {
      const title = (job.judulPekerjaan || '').toLowerCase();
      const company = (job.perusahaanJepang || '').toLowerCase();
      const pref = (job.lokasiPrefektur || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesTerm = !term || title.includes(term) || company.includes(term) || pref.includes(term);
      const matchesSector = selectedSector === 'ALL' || detectJobSector(job) === selectedSector;
      const matchesPref = selectedPrefecture === 'ALL' || pref.includes(selectedPrefecture.toLowerCase());

      return matchesTerm && matchesSector && matchesPref;
    });
  }, [activeJobs, searchTerm, selectedSector, selectedPrefecture]);

  // Public candidate list (deduplicated 175 master records)
  const candidateList = useMemo(() => {
    return Object.values(rirekishoRecords).slice(0, 8);
  }, [rirekishoRecords]);

  // Helper for job cover photo
  const getJobCoverPhoto = (job: any): string => {
    if (job.imageUrl && job.imageUrl.length > 10) return job.imageUrl;
    if (job.photoUrl && job.photoUrl.length > 10) return job.photoUrl;
    const sector = detectJobSector(job);
    const matchedSector = config.sectorCovers.find(s => s.name.toUpperCase().includes(sector) || sector.includes(s.id.toUpperCase()));
    return matchedSector ? matchedSector.imageUrl : config.defaultJobPhotoUrl;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-red-700 selection:text-white">
      {/* 1. TOP BRAND NAVIGATION BAR */}
      <nav className="bg-zinc-950 text-white border-b border-zinc-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-700 to-rose-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-red-900/50">
              IJEF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-wider text-white">SIMANTAP</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-700/30 text-red-400 border border-red-700/50">
                  LPK IJEF CORP
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">Sistem Terpadu Siswa & Job Matching Jepang</p>
            </div>
          </div>

          {/* Portal Switcher & Login Triggers */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onSelectPortal('mitra')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Mitra</span>
            </button>

            <button
              onClick={() => onSelectPortal('siswa')}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Masuk</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. DARK CHARCOAL HERO BANNER SECTION */}
      <section className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-zinc-800">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-700/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-red-950/80 text-red-300 border border-red-700/40 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>{config.heroTagline}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto">
            {config.heroTitle}
          </h1>

          <p className="text-xs sm:text-base text-zinc-300 max-w-2xl mx-auto font-medium leading-relaxed">
            {config.heroSubtitle}
          </p>

          {/* TWO MAIN ENTRY POINTS */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={() => onSelectPortal('mitra')}
              className="w-full sm:w-1/2 py-3.5 px-5 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-red-900/40 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Eksplorasi Portal Mitra</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectPortal('siswa')}
              className="w-full sm:w-1/2 py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-red-400" />
              <span>Eksplorasi Portal Siswa</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* FLOATING SEARCH & SECTOR FILTER BAR */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 text-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari Pekerjaan (Kaigo, Welder, Tokyo, Osaka)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-red-600 focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Sektor</option>
                  <option value="KAIGO">KAIGO (Perawat)</option>
                  <option value="PM">Pengolahan Makanan</option>
                  <option value="PERTANIAN">Pertanian</option>
                  <option value="KIKAI KAKOU">Manufaktur & Mesin</option>
                  <option value="ENGINEERING">Gijinkoku Engineer</option>
                  <option value="KONSTRUKSI">Konstruksi / Welder</option>
                </select>

                <select
                  value={selectedPrefecture}
                  onChange={(e) => setSelectedPrefecture(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Prefektur</option>
                  {prefectures.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISUAL SECTOR GRID ("INDUSTRI PILIHANMU") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
              SEKTOR UNGGULAN
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Industri Pilihanmu di Jepang</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-sm">
            Tersedia lowongan Tokutei Ginou (SSW), Magang Terampil (TITP), dan Gijinkoku Engineer.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {config.sectorCovers.map((sec) => (
            <div
              key={sec.id}
              onClick={() => setSelectedSector(sec.id.toUpperCase())}
              className="bg-white border border-slate-200 hover:border-red-600 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition cursor-pointer group flex flex-col justify-between"
            >
              <div className="h-28 relative overflow-hidden bg-slate-100">
                <img
                  src={sec.imageUrl}
                  alt={sec.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-700 text-white shadow-xs">
                  {sec.jobCount} Job
                </span>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-[10px] font-bold text-red-200">{sec.jpName}</p>
                  <h4 className="text-xs font-black leading-tight truncate">{sec.name}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PHOTO-FIRST JOB CARDS SHOWCASE ("LOWONGAN TERKINI") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                LOWONGAN AKTIF JEPANG
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Lowongan Terkini Siap Matching</h2>
          </div>
          <button
            onClick={() => onSelectPortal('mitra')}
            className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Lihat Semua ({activeJobs.length} Job)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">Tidak ada lowongan yang sesuai filter pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredJobs.slice(0, 8).map((job, idx) => {
              const coverPhoto = getJobCoverPhoto(job);
              const sector = detectJobSector(job);
              const title = getSanitizedJobTitle(job, lang);
              const company = getSanitizedCompany(job, lang);
              const pref = formatPrefecture(job.lokasiPrefektur, lang);

              return (
                <div
                  key={job.id ? `${job.id}-${idx}` : `job-${idx}`}
                  className="bg-white border border-slate-200 hover:border-red-600 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition duration-200 flex flex-col justify-between group"
                >
                  {/* Photo-First 16:9 Cover Photo */}
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      src={coverPhoto}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>

                    {/* Top Status & Sector Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>Buka</span>
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {translateSector(sector, lang)}
                      </span>
                    </div>

                    {/* Bottom Location */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 text-white">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="text-xs font-bold truncate">{pref}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition line-clamp-2">
                        {title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{company}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaji Bulanan</p>
                        <p className="text-sm font-black text-emerald-700">
                          ¥{job.gajiBulananYen ? job.gajiBulananYen.toLocaleString('ja-JP') : '220,000'} / Bln
                        </p>
                      </div>

                      <button
                        onClick={() => onSelectPortal('mitra')}
                        className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. KANDIDAT READY IJEF SHOWCASE ("KANDIDAT TERBAIK SIAP INTERVIEW") */}
      <section className="bg-zinc-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-400 bg-red-950 px-2.5 py-1 rounded-full border border-red-700/50">
                KANDIDAT TERVERIFIKASI
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Kandidat Terbaik Siap Interview</h2>
            </div>
            <button
              onClick={() => onSelectPortal('mitra')}
              className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Eksplorasi Seluruh Candidate JIS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {candidateList.map((cand, idx) => {
              const photo = cand.pasFotoUrl || cand.pasPhoto || config.defaultCandidatePhotoUrl;
              const isFemale = (cand.jenisKelamin || '').toLowerCase().includes('perempuan') || (cand.jenisKelamin || '').toLowerCase().includes('wanita');

              return (
                <div
                  key={cand.id ? `${cand.id}-${idx}` : `cand-${idx}`}
                  className="bg-zinc-900 border border-zinc-800 hover:border-red-600 rounded-2xl p-4 shadow-md transition flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row Avatar & Badges */}
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-800 border-2 border-red-600 shrink-0">
                        <img src={photo} alt={cand.namaLengkap} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-950 text-blue-300 border border-blue-800">
                          {cand.levelBahasaJepang || 'N4 / JFT'}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
                          {cand.namaLengkap || 'Kandidat IJEF'}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {isFemale ? '👩 Siswi (Wanita)' : '👨 Siswa (Pria)'} • {cand.umur || '22'} Thn
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Bidang Pilihan:</span>
                        <strong className="text-red-400 font-bold">{cand.bidangKerja || 'KAIGO'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Medical MCU:</span>
                        <span className="text-emerald-400 font-bold">Fit (Lolos) ✅</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span>Status Progres:</span>
                        <span className="text-amber-300 font-bold">{cand.statusProgres || 'Siap Matching'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPortal('mitra')}
                    className="w-full mt-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Lihat Rirekisho JIS
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. TRAINING & DEPARTURE PROMO BANNERS (PORTAL SISWA INFO) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {config.trainingBanners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-gradient-to-r ${banner.accentColor} text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px]`}
            >
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 pointer-events-none overflow-hidden">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              </div>

              <div className="relative z-10 space-y-2 max-w-md">
                <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  {banner.badge}
                </span>
                <h3 className="text-lg sm:text-xl font-black leading-snug">{banner.title}</h3>
                <p className="text-xs text-white/80 font-medium">{banner.subtitle}</p>
              </div>

              <div className="relative z-10 pt-4">
                <button
                  onClick={() => onSelectPortal('siswa')}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{banner.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 text-xs py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-red-700 flex items-center justify-center font-black text-white text-[10px]">
              IJEF
            </div>
            <span className="text-white font-bold">SIMANTAP IJEF CORP © 2026</span>
          </div>
          <p className="text-center sm:text-right text-zinc-500">
            Sistem Manajemen Siswa, Document Verification & Job Matching Terpadu.
          </p>
        </div>
      </footer>
    </div>
  );
};
