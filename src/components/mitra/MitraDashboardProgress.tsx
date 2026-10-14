import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { CalonSiswa, CVRirekisho, JobApplication, JobPosting } from '../../types';
import { StudentCVModal } from '../StudentCVModal';
import { StudentPhotoBadge } from '../StudentPhotoBadge';
import { getStudentPhotoUrl, handleStudentImageError } from '../../utils/studentPhotoHelper';
import { MitraApplyJobModal } from './MitraApplyJobModal';
import { MitraJobFormModal } from './MitraJobFormModal';
import { MitraStudentFormModal } from './MitraStudentFormModal';
import {
  isJobActiveAndAvailable,
  isCandidateReadyForMatching,
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  translateProgressStatus,
  translateSector,
  translateSubmissionType,
  translateSubmissionStatus
} from '../../utils/mitraJobUtils';
import {
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  MapPin,
  Banknote,
  Search,
  Layers,
  Plane,
  Eye,
  PlusCircle,
  UserPlus
} from 'lucide-react';

interface MitraDashboardProgressProps {
  onNavigateTab: (tab: 'DASHBOARD' | 'JOBS' | 'STUDENTS' | 'APPLICATIONS' | 'APPROVALS') => void;
}

export const MitraDashboardProgress: React.FC<MitraDashboardProgressProps> = ({
  onNavigateTab
}) => {
  const { user } = useAuth();
  const {
    students,
    rirekishoRecords,
    jobPostings,
    jobApplications,
    healthRecords,
    discRecords,
    psikotesRecords,
    mitraSubmissions
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tMitra,
    bilingual
  } = useEcosystemTranslation('mitraPortal');

  const isJa = lang === 'ja';

  const mitraName = user?.namaMitra || user?.displayName || (isJa ? '提携機関パートナー' : 'LPK Mitra Mandiri Indonesia');
  const mitraId = user?.mitraId || 'MTR-2026-088';

  // Search in progress table
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');

  // Modal states
  const [selectedStudentForCV, setSelectedStudentForCV] = useState<CalonSiswa | null>(null);
  const [selectedCVRecord, setSelectedCVRecord] = useState<CVRirekisho | undefined>(undefined);
  const [quickApplyJob, setQuickApplyJob] = useState<JobPosting | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Compile candidate progress list
  const progressList = useMemo(() => {
    const list: Array<{
      id: string;
      namaLengkap: string;
      avatarUrl?: string;
      email: string;
      bidangKerja: string;
      levelBahasa: string;
      statusProgres: string;
      currentJobTitle?: string;
      currentCompany?: string;
      interviewDate?: string;
      applicationDate?: string;
      applicationStatus?: string;
      rawStudent?: CalonSiswa;
      rawCV?: CVRirekisho;
    }> = [];

    const rirekishoList = Object.values(rirekishoRecords) as CVRirekisho[];
    const registeredIds = new Set<string>();

    rirekishoList.forEach((cv) => {
      if (!isCandidateReadyForMatching(cv)) return;

      const candidateId = cv.siswaId || cv.id;
      if (!candidateId || registeredIds.has(candidateId)) return;
      registeredIds.add(candidateId);

      // Find matching application
      const matchedApp = jobApplications.find(
        (a) => a.siswaId === candidateId || a.emailSiswa.toLowerCase() === (cv.email || '').toLowerCase()
      );

      const studentObj: CalonSiswa = {
        id: candidateId,
        namaLengkap: cv.namaLengkap,
        email: cv.email,
        noHp: cv.noHp,
        kategoriKandidat: cv.kategoriKandidat || 'SISWA NON IJEF (New Comer)',
        kewarganegaraan: 'WNI',
        noKtp: '3201000000000000',
        noKk: '3201000000000000',
        alamatDomisili: cv.alamatLengkap || 'Indonesia',
        tempatLahir: cv.tempatLahir || 'Bandung',
        tanggalLahir: cv.tanggalLahir || '2002-01-01',
        agama: 'Islam',
        jenisKelamin: cv.jenisKelamin || 'Laki-laki',
        golonganDarah: 'O',
        statusPerkawinan: cv.statusPernikahan || 'Lajang',
        namaAyah: 'Wali',
        pekerjaanAyah: 'Wiraswasta',
        ktpNpwpAyah: '-',
        namaIbu: 'Ibu',
        pekerjaanIbu: 'Ibu Rumah Tangga',
        ktpNpwpIbu: '-',
        berkasDokumen: { pasFoto: cv.pasFotoUrl },
        statusPendaftaran: 'Terverifikasi',
        createdAt: cv.updatedAt || new Date().toISOString()
      };

      list.push({
        id: candidateId,
        namaLengkap: cv.namaLengkap,
        avatarUrl: getStudentPhotoUrl(studentObj, cv),
        email: cv.email,
        bidangKerja: cv.bidangKerja || 'Kaigo',
        levelBahasa: cv.levelBahasaJepang || 'N4',
        statusProgres: cv.statusProgres || 'Siap Matching',
        currentJobTitle: matchedApp?.jobJudul || (cv.detailProgres ? cv.detailProgres.replace('Melamar di: ', '') : '-'),
        currentCompany: matchedApp?.perusahaanJepang || (cv.namaTSK && typeof cv.namaTSK === 'string' && cv.namaTSK.startsWith('Mitra:') ? cv.namaTSK : 'TSK Partner'),
        interviewDate: matchedApp?.jadwalInterview,
        applicationDate: matchedApp?.tanggalLamar || cv.tanggalSubmit,
        applicationStatus: matchedApp?.statusLamaran || cv.statusProgres,
        rawStudent: studentObj,
        rawCV: cv
      });
    });

    return list;
  }, [rirekishoRecords, jobApplications]);

  // Funnel & Stats metrics
  const stats = useMemo(() => {
    let totalNominated = 0;
    let inInterview = 0;
    let naiteiPassed = 0;
    let inPreparation = 0;

    progressList.forEach((item) => {
      const sp = (item.statusProgres || '').toLowerCase();
      const as = (item.applicationStatus || '').toLowerCase();
      const combined = `${sp} ${as}`;

      if (combined.includes('naitei') || combined.includes('lolos') || combined.includes('visa') || combined.includes('coe')) {
        naiteiPassed++;
      } else if (combined.includes('interview') || combined.includes('wawancara')) {
        inInterview++;
      } else if (combined.includes('berkas') || combined.includes('matching') || combined.includes('lamar')) {
        totalNominated++;
      } else {
        inPreparation++;
      }
    });

    return {
      totalCandidates: progressList.length,
      totalNominated: totalNominated + inInterview + naiteiPassed,
      inInterview,
      naiteiPassed,
      inPreparation,
      totalJobs: jobPostings.filter(isJobActiveAndAvailable).length
    };
  }, [progressList, jobPostings]);

  // Filter table
  const filteredProgress = useMemo(() => {
    return progressList.filter((item) => {
      const term = pipelineSearch.toLowerCase();
      const matches =
        item.namaLengkap.toLowerCase().includes(term) ||
        item.bidangKerja.toLowerCase().includes(term) ||
        (item.currentJobTitle || '').toLowerCase().includes(term) ||
        (item.currentCompany || '').toLowerCase().includes(term);

      if (!matches) return false;

      if (selectedStageFilter !== 'ALL') {
        const status = item.statusProgres.toLowerCase();
        if (selectedStageFilter === 'NAITEI' && !status.includes('naitei') && !status.includes('lolos') && !status.includes('visa')) return false;
        if (selectedStageFilter === 'INTERVIEW' && !status.includes('interview')) return false;
        if (selectedStageFilter === 'MATCHING' && !status.includes('matching') && !status.includes('nunggu')) return false;
      }

      return true;
    });
  }, [progressList, pipelineSearch, selectedStageFilter]);

  // Top recent active job postings only
  const recentJobs = useMemo(() => {
    return jobPostings.filter(isJobActiveAndAvailable).slice(0, 3);
  }, [jobPostings]);

  return (
    <div className="space-y-6">
      {/* Toast Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slide-in ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
              : 'bg-indigo-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span className="text-xs sm:text-sm font-semibold">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white text-xs font-bold px-2 py-1 bg-black/20 hover:bg-black/30 rounded-lg cursor-pointer transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-xl p-3.5 sm:p-4.5 shadow-md relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldCheck className="w-3 h-3" />
              <span>{isJa ? '日本受入機関・LPK IJEF CORP 公式パートナーポータル' : 'Portal Kemitraan Resmi LPK IJEF CORP'}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
              {isJa ? 'パートナー候補生進捗ダッシュボード' : 'Dashboard Proses & Progres Siswa Mitra'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-normal">
              {isJa ? (
                <>
                  「<strong className="text-amber-300 font-bold">{mitraName}</strong>」様、ようこそ。候補生の書類準備状況、面接日程、内定結果をリアルタイムかつ透明性をもって管理・確認いただけます。
                </>
              ) : (
                <>
                  Selamat datang, <strong className="text-amber-300 font-bold">{mitraName}</strong>. Pantau status kesiapan berkas, jadwal wawancara, dan hasil kelulusan Naitei siswa binaan Anda secara transparan dan realtime.
                </>
              )}
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
              title={isJa ? '新規候補生を登録する' : 'Daftarkan siswa binaan baru dari lembaga Anda'}
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>{isJa ? '+ 新規候補生登録' : '+ Tambah Siswa Baru'}</span>
            </button>

            <button
              onClick={() => setShowAddJobModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer border border-emerald-400/30"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isJa ? '+ 自社求人登録' : '+ Tambah Job Sendiri'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('JOBS')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isJa ? '求人一覧' : 'Listing Job'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('STUDENTS')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isJa ? '職種別分類' : 'Klasifikasi Sektor'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{isJa ? '登録候補生総数' : 'Total Siswa Binaan'}</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats.totalCandidates}
            </div>
            <button
              type="button"
              onClick={() => setShowAddStudentModal(true)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title={isJa ? '新規候補生を登録' : 'Tambah Siswa Binaan Baru'}
            >
              <UserPlus className="w-3 h-3" />
              <span>{isJa ? '+ 登録' : '+ Tambah'}</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            {isJa ? (
              <>
                <span className="font-semibold text-indigo-700">{stats.inPreparation}</span> 名 育成・準備中
              </>
            ) : (
              <>
                <span className="font-semibold text-indigo-700">{stats.inPreparation}</span> Siswa Tahap Pembinaan
              </>
            )}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{isJa ? '面接選考中' : 'Tahap Interview User'}</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">
            {stats.inInterview}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            {isJa ? (
              <>
                <span className="font-semibold text-purple-600">面接実施中</span> （日本受入企業）
              </>
            ) : (
              <>
                <span className="font-semibold text-purple-600">Wawancara Aktif</span> dengan User Jepang
              </>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{isJa ? '内定獲得・契約締結' : 'Lolos Naitei / Kontrak'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {stats.naiteiPassed}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold mt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isJa ? 'COE・ビザ申請手続準備' : 'Siap Pengurusan Visa COE'}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{isJa ? '募集中の求人件数' : 'Lowongan Kerja Tersedia'}</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {stats.totalJobs}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-bold">{isJa ? '100% 認証済正規求人' : '100% Lowongan Terverifikasi'}</span>
          </div>
        </div>
      </div>

      {/* STATUS & MONITORING APPROVAL PENGAJUAN MITRA (ADMIN DOC VERIFIKASI) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-2xl shadow-md shadow-amber-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {isJa ? '申請状況・本部承認ステータス' : 'Status Pengajuan & Approval Admin Doc'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {isJa ? `全 ${(mitraSubmissions || []).length} 件の申請` : `${(mitraSubmissions || []).length} Total Pengajuan`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isJa
                  ? '本部管理者（Admin Doc）による新規候補生登録、自社求人登録、応募推薦の審査・承認状況をリアルタイムで確認できます。'
                  : 'Monitoring status verifikasi dan persetujuan pengajuan registrasi siswa, lowongan job baru, dan nominasi pelamar dari Admin Doc.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigateTab('APPROVALS')}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>{isJa ? 'すべての申請を見る' : 'Pantau Semua Pengajuan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {isJa
                  ? `${(mitraSubmissions || []).filter(s => s.status === 'PENDING' || s.status === 'MENUNGGU_APPROVAL').length} 件 承認待ち`
                  : `${(mitraSubmissions || []).filter(s => s.status === 'PENDING' || s.status === 'MENUNGGU_APPROVAL').length} Menunggu Approval`}
              </span>
            </span>
          </div>
        </div>

        {/* List of Recent Submissions */}
        {(mitraSubmissions || []).length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">{isJa ? '申請履歴がありません' : 'Belum ada riwayat pengajuan'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isJa
                ? '新規候補生登録、自社求人登録、応募推薦などの申請を行うと、ここに履歴と承認状況が表示されます。'
                : 'Pengajuan registrasi siswa baru, job sendiri, dan lamaran kerja akan otomatis tercatat dan menunggu persetujuan Admin Doc.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(mitraSubmissions || []).slice(0, 6).map((sub) => {
              const typeLabel = translateSubmissionType(sub.submissionType, lang);
              const typeBadgeColor =
                sub.submissionType === 'REGISTRASI_SISWA'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : sub.submissionType === 'TAMBAH_JOB_MITRA'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200';

              const statusLabel = translateSubmissionStatus(sub.status, lang);
              const statusBadge =
                sub.status === 'APPROVED' || sub.status === 'DISETUJUI'
                  ? { label: statusLabel, bg: 'bg-emerald-500 text-white', icon: CheckCircle2 }
                  : sub.status === 'REJECTED' || sub.status === 'DITOLAK' || sub.status === 'PERLU_REVISI'
                  ? { label: statusLabel, bg: 'bg-rose-500 text-white', icon: AlertCircle }
                  : { label: statusLabel, bg: 'bg-amber-500 text-white', icon: Clock };

              const StatusIcon = statusBadge.icon;

              return (
                <div
                  key={sub.id}
                  onClick={() => onNavigateTab('APPROVALS')}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${typeBadgeColor}`}>
                        {typeLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${statusBadge.bg}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                      {sub.targetTitle}
                    </h4>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {sub.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{new Date(sub.submittedAt).toLocaleDateString(isJa ? 'ja-JP' : 'id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
                      <span>{isJa ? '詳細' : 'Detail'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Funnel Journey Flow */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              {isJa ? '特定技能・日本就職キャリアパイプライン' : 'Alur Tahapan & Pipeline Karir Siswa ke Jepang'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isJa
                ? '登録、マッチング、面接から内定・COE交付・出国までの全工程を可視化。'
                : 'Visualisasi tahapan pendaftaran, matching, interview, hingga penerbitan Naitei dan COE.'}
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 w-fit">
            {isJa ? '日本雇用標準SOP基準' : 'SOP Standar Ketenagakerjaan Jepang'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Step 1 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{isJa ? '登録' : 'Input'}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">{isJa ? '候補生登録・職種選定' : 'Registrasi & Klasifikasi'}</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isJa ? '基本情報入力および希望職種（介護、食品、農業等）の適性選定。' : 'Input data siswa & pemetaan bidang kerja (Kaigo, PM, Pertanian, dll).'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase">{isJa ? '書類' : 'Dokumen'}</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900">{isJa ? '履歴書・健康診断(MCU)' : 'Rirekisho & MCU'}</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              {isJa ? 'JIS規格日本語履歴書の作成、健康診断(MCU Fit)、語学・技能検定登録。' : 'Penyusunan CV format JIS standar Jepang, MCU Fit, dan sertifikat bahasa.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-indigo-700 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <span className="text-[10px] font-bold text-indigo-700 uppercase">{isJa ? '選定' : 'Matching'}</span>
            </div>
            <h4 className="text-xs font-bold text-indigo-900">{isJa ? '求人選定・推薦応募' : 'Pilih Lowongan Job'}</h4>
            <p className="text-[11px] text-indigo-700 leading-snug">
              {isJa ? '求人データベースから最適な案件を選定し、候補生を推薦応募。' : 'Mitra memilih job dari database admin dan mendaftarkan siswa binaan.'}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white font-black text-xs flex items-center justify-center">
                4
              </span>
              <span className="text-[10px] font-bold text-purple-700 uppercase">{isJa ? '面接' : 'Interview'}</span>
            </div>
            <h4 className="text-xs font-bold text-purple-900">{isJa ? '受入企業面接' : 'Wawancara User'}</h4>
            <p className="text-[11px] text-purple-700 leading-snug">
              {isJa ? 'Zoom等による日本受入企業・監理団体/TSKとのオンライン面接。' : 'Interview online via Zoom dengan perwakilan perusahaan Jepang / Kumiai.'}
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                5
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">{isJa ? '内定' : 'Sukses'}</span>
            </div>
            <h4 className="text-xs font-bold text-emerald-900">{isJa ? '内定獲得・雇用契約' : 'Naitei & Kontrak'}</h4>
            <p className="text-[11px] text-emerald-700 leading-snug">
              {isJa ? '合格発表、条件提示書・雇用契約書の締結および内定受諾。' : 'Pengumuman kelulusan, penandatanganan kontrak kerja, dan penyerahan Naitei.'}
            </p>
          </div>

          {/* Step 6 */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center">
                6
              </span>
              <span className="text-[10px] font-bold text-amber-700 uppercase">{isJa ? '渡航' : 'Berangkat'}</span>
            </div>
            <h4 className="text-xs font-bold text-amber-900">{isJa ? 'COE・ビザ申請・出国' : 'COE, Visa & Terbang'}</h4>
            <p className="text-[11px] text-amber-700 leading-snug">
              {isJa ? '在留資格認定証明書(COE)交付、就労ビザ発給、オリエンテーション及び渡航。' : 'Pengurusan dokumen imigrasi Jepang dan jadwal keberangkatan.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Live Progress Table + Featured Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Progress Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                {isJa ? '候補生一覧＆リアルタイム進捗状況' : 'Daftar Siswa & Status Progress Realtime'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isJa ? 'パートナー機関に所属する全候補生の選考進捗を追跡。' : 'Pantau progres setiap kandidat yang terdaftar di mitra.'}
              </p>
            </div>

            {/* Filter Stage & Search */}
            <div className="flex items-center gap-2">
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">{isJa ? '全ステージ' : 'Semua Tahap'}</option>
                <option value="MATCHING">{isJa ? 'マッチング・書類選考' : 'Matching / Seleksi'}</option>
                <option value="INTERVIEW">{isJa ? '面接選考中' : 'Interview'}</option>
                <option value="NAITEI">{isJa ? '内定獲得' : 'Lolos Naitei'}</option>
              </select>

              <div className="relative w-44">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  placeholder={isJa ? '候補生名・求人・企業名で検索...' : 'Cari siswa / job...'}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">{isJa ? '候補生氏名（証明写真 4×6）' : 'Nama Siswa (Foto 4×6)'}</th>
                  <th className="py-3 px-3">{isJa ? '希望職種・分野' : 'Bidang Kerja'}</th>
                  <th className="py-3 px-3">{isJa ? '応募先求人 / 受入企業' : 'Lowongan / Perusahaan'}</th>
                  <th className="py-3 px-3">{isJa ? '選考進捗' : 'Status Progress'}</th>
                  <th className="py-3 px-3 text-right">{isJa ? '操作' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProgress.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      {isJa ? '検索条件に一致する候補生データが見つかりません。' : 'Tidak ada data siswa yang cocok dengan kriteria pencarian.'}
                    </td>
                  </tr>
                ) : (
                  filteredProgress.map((item, idx) => (
                    <tr key={item.id ? `${item.id}-${idx}` : `prog-row-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const photoSrc = item.avatarUrl || getStudentPhotoUrl(item.rawStudent, item.rawCV);
                            return (
                              <StudentPhotoBadge
                                photoUrl={photoSrc}
                                student={item.rawStudent}
                                rirekisho={item.rawCV}
                                namaLengkap={item.namaLengkap}
                                size="xs"
                                ratioLabel="4×6"
                                theme="indigo"
                                lang={lang}
                              />
                            );
                          })()}
                          <div>
                            <div>{item.namaLengkap}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">
                              {isJa ? `日本語 ${item.levelBahasa}` : `Level ${item.levelBahasa}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {translateSector(item.bidangKerja, lang)}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {getSanitizedJobTitle({ judulPekerjaan: item.currentJobTitle, posisiPekerjaan: item.currentJobTitle } as any, lang)}
                        </div>
                        <div className="text-[10px] text-slate-500 break-words leading-tight" title={getSanitizedCompany({ perusahaanJepang: item.currentCompany } as any, lang)}>
                          {getSanitizedCompany({ perusahaanJepang: item.currentCompany } as any, lang)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.statusProgres.includes('Lolos') || item.statusProgres.includes('Naitei')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.statusProgres.includes('Interview')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {translateProgressStatus(item.statusProgres, lang)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (item.rawStudent) {
                              setSelectedStudentForCV(item.rawStudent);
                              setSelectedCVRecord(item.rawCV);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>{isJa ? '詳細確認' : 'Detail'}</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              {isJa ? (
                <>
                  パートナー管理対象候補生: 全 <strong>{filteredProgress.length}</strong> 名
                </>
              ) : (
                <>
                  Total <strong>{filteredProgress.length}</strong> siswa dalam pemantauan mitra
                </>
              )}
            </span>
            <button
              onClick={() => onNavigateTab('STUDENTS')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>{isJa ? '全候補生分類一覧を見る' : 'Lihat Klasifikasi Lengkap'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Featured Jobs from Admin Data */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isJa ? '最新の受入企業求人（本部提供）' : 'Lowongan Kerja Terbaru (Admin)'}
              </h3>
              <button
                onClick={() => onNavigateTab('JOBS')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {isJa ? 'すべて見る' : 'Lihat Semua'}
              </button>
            </div>

            <div className="space-y-3">
              {recentJobs.map((job, idx) => {
                const cleanTitle = getSanitizedJobTitle(job, lang);
                const cleanCompany = getSanitizedCompany(job, lang);
                return (
                  <div
                    key={job.id ? `${job.id}-${idx}` : `recent-job-${idx}`}
                    className="p-3.5 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl border border-slate-200 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800">
                        {isJa ? '募集中' : (job.statusJob || 'Aktif')}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 font-mono">
                        ¥{job.gajiBulananYen?.toLocaleString('ja-JP')}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {cleanTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-start gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words leading-snug" title={cleanCompany}>{cleanCompany}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                      <span>📍 {formatPrefecture(job.lokasiPrefektur, lang)}</span>
                      <button
                        onClick={() => setQuickApplyJob(job)}
                        className="text-indigo-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isJa ? '候補生を推薦' : 'Daftarkan Siswa'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigateTab('JOBS')}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isJa ? `公開中の全求人一覧を開く (${jobPostings.filter(isJobActiveAndAvailable).length}件)` : `Buka Seluruh Listing Lowongan Aktif (${jobPostings.filter(isJobActiveAndAvailable).length})`}</span>
            </button>
          </div>

          {/* Support / Hubungan Mitra Box */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isJa ? 'IJEF パートナー支援窓口' : 'Layanan Kemitraan IJEF'}</span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {isJa ? 'マッチング・受入枠のご相談' : 'Bantuan Konsultasi Matching & Kuota'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isJa
                ? '特定技能の団体受入枠のご相談や面接日程調整は、IJEF本部サポートデスクが迅速に対応いたします。'
                : 'Membutuhkan kuota khusus untuk rombongan siswa atau koordinasi jadwal wawancara langsung? Tim Back-Office IJEF siap mendampingi mitra.'}
            </p>
            <div className="text-[11px] text-indigo-200 font-mono pt-1">
              {isJa ? '公式窓口: +62 811-2345-6789 (月〜土 9:00〜18:00)' : 'WhatsApp Hotline: +62 811-2345-6789 (Senin - Sabtu)'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Full CV Viewer */}
      {selectedStudentForCV && (
        <StudentCVModal
          student={selectedStudentForCV}
          rirekishoRecord={selectedCVRecord}
          healthRecord={healthRecords[selectedStudentForCV.id]}
          discRecord={discRecords[selectedStudentForCV.id]}
          psikotesRecord={psikotesRecords[selectedStudentForCV.id]}
          onClose={() => {
            setSelectedStudentForCV(null);
            setSelectedCVRecord(undefined);
          }}
          portalContext="MITRA"
        />
      )}

      {/* Modal 2: Quick Apply Job */}
      {quickApplyJob && (
        <MitraApplyJobModal
          job={quickApplyJob}
          onClose={() => setQuickApplyJob(null)}
          onSuccess={(name) => {
            if (isJa) {
              alert(`候補生「${name}」を求人「${getSanitizedJobTitle(quickApplyJob, 'ja')}」に推薦応募しました！`);
            } else {
              alert(`Siswa [${name}] berhasil didaftarkan ke lowongan ${getSanitizedJobTitle(quickApplyJob)}!`);
            }
          }}
        />
      )}

      {/* Modal 3: Tambah Job Sendiri Mitra */}
      <MitraJobFormModal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
        onSaveSuccess={(savedJob) => {
          setNotification({
            message: isJa
              ? `求人案件「${savedJob.judulPekerjaan}」(${savedJob.kodeJob}) を登録しました。本部審査（Admin 2）に入ります。`
              : `Lowongan "${savedJob.judulPekerjaan}" (${savedJob.kodeJob}) berhasil didaftarkan & masuk antrean verifikasi Admin 2!`,
            type: 'success'
          });
          setTimeout(() => setNotification(null), 7000);
          onNavigateTab('JOBS');
        }}
      />

      {/* Modal 4: Tambah Siswa Binaan Baru Mitra */}
      <MitraStudentFormModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={(studentName, email, category) => {
          setNotification({
            message: isJa
              ? `新規候補生「${studentName}」(${category}) を登録しました。アカウントが作成され、メール [${email}] でログインして履歴書を作成できます。`
              : `Berhasil mendaftarkan siswa baru [${studentName}] (${category})! Akun siswa aktif & dapat langsung login dengan email [${email}] untuk melengkapi Rirekisho JIS.`,
            type: 'success'
          });
          setTimeout(() => setNotification(null), 8000);
        }}
      />
    </div>
  );
};

