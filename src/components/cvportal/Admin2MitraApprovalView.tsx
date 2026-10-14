import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import {
  MitraApprovalSubmission,
  MitraApprovalStatus,
  MitraSubmissionType,
  JobPosting,
  JobApplication,
  CalonSiswa
} from '../../types';
import { getSanitizedCompany } from '../../utils/mitraJobUtils';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Users,
  Briefcase,
  FileCheck2,
  Eye,
  Check,
  X,
  Edit3,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Building2,
  Calendar,
  MapPin,
  Banknote,
  GraduationCap,
  FileText,
  AlertTriangle,
  History,
  Send,
  UserCheck,
  HelpCircle
} from 'lucide-react';

export const Admin2MitraApprovalView: React.FC = () => {
  const {
    mitraSubmissions,
    updateMitraSubmissionStatus,
    deleteMitraSubmission,
    students,
    jobPostings,
    jobApplications
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tMitra,
    bilingual
  } = useEcosystemTranslation('mitraApproval');

  const { user } = useAuth();

  // Active Admin / Reviewer Info
  const currentActorName = user?.displayName || user?.email || 'Admin Doc (CV Portal & Matching)';
  const currentActorRole = user?.adminRole || 'Admin Doc Back-Office';

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedMitraFilter, setSelectedMitraFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailModalSubmission, setDetailModalSubmission] = useState<MitraApprovalSubmission | null>(null);
  const [approveModalSubmission, setApproveModalSubmission] = useState<MitraApprovalSubmission | null>(null);
  const [revisionModalSubmission, setRevisionModalSubmission] = useState<MitraApprovalSubmission | null>(null);
  const [rejectModalSubmission, setRejectModalSubmission] = useState<MitraApprovalSubmission | null>(null);

  // Form Inputs for Actions
  const [approvalNotesInput, setApprovalNotesInput] = useState('');
  const [revisionNotesInput, setRevisionNotesInput] = useState('');
  const [rejectionNotesInput, setRejectionNotesInput] = useState('');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct list of Mitras
  const mitraOptions = useMemo(() => {
    const set = new Set<string>();
    mitraSubmissions.forEach((s) => {
      if (s.mitraName) set.add(s.mitraName);
    });
    return Array.from(set);
  }, [mitraSubmissions]);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return mitraSubmissions.filter((sub) => {
      // Type Filter
      if (selectedTypeFilter !== 'ALL' && sub.submissionType !== selectedTypeFilter) return false;

      // Status Filter
      if (selectedStatusFilter !== 'ALL' && sub.status !== selectedStatusFilter) return false;

      // Mitra Filter
      if (selectedMitraFilter !== 'ALL' && sub.mitraName !== selectedMitraFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTarget = sub.targetTitle?.toLowerCase().includes(term);
        const matchesMitra = sub.mitraName?.toLowerCase().includes(term);
        const matchesCategory = sub.targetCategory?.toLowerCase().includes(term);
        const matchesNotes = sub.catatanApproval?.toLowerCase().includes(term) || sub.catatanRevisi?.toLowerCase().includes(term);
        if (!matchesTarget && !matchesMitra && !matchesCategory && !matchesNotes) return false;
      }

      return true;
    });
  }, [mitraSubmissions, selectedTypeFilter, selectedStatusFilter, selectedMitraFilter, searchTerm]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = mitraSubmissions.length;
    const pending = mitraSubmissions.filter((s) => s.status === 'MENUNGGU_APPROVAL').length;
    const approved = mitraSubmissions.filter((s) => s.status === 'DISETUJUI').length;
    const revision = mitraSubmissions.filter((s) => s.status === 'PERLU_REVISI').length;
    const rejected = mitraSubmissions.filter((s) => s.status === 'DITOLAK').length;

    const studentCount = mitraSubmissions.filter((s) => s.submissionType === 'REGISTRASI_SISWA').length;
    const jobCount = mitraSubmissions.filter((s) => s.submissionType === 'TAMBAH_JOB_MITRA').length;
    const appCount = mitraSubmissions.filter((s) => s.submissionType === 'LAMAR_JOB_SISWA').length;

    return { total, pending, approved, revision, rejected, studentCount, jobCount, appCount };
  }, [mitraSubmissions]);

  // Handle Approve Submission
  const handleConfirmApprove = () => {
    if (!approveModalSubmission) return;

    updateMitraSubmissionStatus(approveModalSubmission.id, 'DISETUJUI', {
      name: currentActorName,
      role: currentActorRole,
      catatan: approvalNotesInput || 'Pengajuan mitra disetujui & diverifikasi lengkap oleh Admin Doc.'
    });

    showToast(`Pengajuan "${approveModalSubmission.targetTitle}" berhasil DISETUJUI dan langsung aktif di sistem!`, 'success');
    setApproveModalSubmission(null);
    setApprovalNotesInput('');
  };

  // Handle Request Revision
  const handleConfirmRevision = () => {
    if (!revisionModalSubmission) return;

    if (!revisionNotesInput.trim()) {
      alert('Mohon tuliskan rincian bagian atau berkas apa yang perlu direvisi oleh Mitra.');
      return;
    }

    updateMitraSubmissionStatus(revisionModalSubmission.id, 'PERLU_REVISI', {
      name: currentActorName,
      role: currentActorRole,
      catatanRevisi: revisionNotesInput.trim()
    });

    showToast(`Permintaan perbaikan/revisi telah dikirimkan ke Mitra ${revisionModalSubmission.mitraName}.`, 'info');
    setRevisionModalSubmission(null);
    setRevisionNotesInput('');
  };

  // Handle Reject Submission
  const handleConfirmReject = () => {
    if (!rejectModalSubmission) return;

    if (!rejectionNotesInput.trim()) {
      alert('Mohon masukkan alasan penolakan pengajuan.');
      return;
    }

    updateMitraSubmissionStatus(rejectModalSubmission.id, 'DITOLAK', {
      name: currentActorName,
      role: currentActorRole,
      catatan: rejectionNotesInput.trim()
    });

    showToast(`Pengajuan "${rejectModalSubmission.targetTitle}" telah DITOLAK.`, 'error');
    setRejectModalSubmission(null);
    setRejectionNotesInput('');
  };

  // Helper badge renderers
  const renderTypeBadge = (type: MitraSubmissionType) => {
    switch (type) {
      case 'REGISTRASI_SISWA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
            <span>{lang === 'ja' ? '新規生徒登録' : 'Registrasi Siswa Baru'}</span>
          </span>
        );
      case 'TAMBAH_JOB_MITRA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'ja' ? '提携機関独自求人追加' : 'Tambah Lowongan Job Sendiri'}</span>
          </span>
        );
      case 'LAMAR_JOB_SISWA':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-700" />
            <span>{lang === 'ja' ? '求人応募・生徒推薦' : 'Pilih Job & Daftar Siswa'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'MENUNGGU_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{lang === 'ja' ? '承認待ち' : 'MENUNGGU APPROVAL'}</span>
          </span>
        );
      case 'DISETUJUI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'ja' ? '承認済 (APPROVED)' : 'DISETUJUI (APPROVED)'}</span>
          </span>
        );
      case 'PERLU_REVISI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-orange-700" />
            <span>{lang === 'ja' ? '要修正' : 'PERLU REVISI'}</span>
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 shadow-xs">
            <X className="w-3.5 h-3.5 text-rose-700" />
            <span>{lang === 'ja' ? '却下' : 'DITOLAK'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-white text-xs font-bold animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 border border-emerald-400'
              : toastMessage.type === 'error'
              ? 'bg-rose-800 border border-rose-400'
              : 'bg-indigo-800 border border-indigo-400'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner - Compact */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-xl p-2.5 sm:p-3 shadow-sm border border-purple-900/40 relative overflow-hidden space-y-2">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 relative z-10">
          <div className="space-y-0.5 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <ShieldCheck className="w-2.5 h-2.5 text-amber-300" />
              <span>{lang === 'ja' ? 'Admin Doc バックオフィス認証・検証システム' : 'Sistem Otorisasi & Verifikasi Back-Office Admin Doc'}</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white">
              {lang === 'ja' ? '提携機関申請承認センター' : 'Pusat Approval Pengajuan Mitra'}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-purple-200/90 leading-normal font-normal">
              {lang === 'ja' ? (
                <>提携機関からの3系統の申請を管理・検証: <strong>(1) 新規育成生徒の登録</strong>、<strong>(2) 独自求人票の追加</strong>、<strong>(3) 日本求人への応募・候補者推薦</strong>。</>
              ) : (
                <>Kelola dan validasi 3 jalur pengajuan kemitraan: <strong>(1) Registrasi Siswa Binaan Baru</strong>,{' '}<strong>(2) Penambahan Lowongan Pekerjaan Mandiri (Job Mitra)</strong>, dan{' '}<strong>(3) Pendaftaran/Nominasi Siswa ke Lowongan Job Jepang</strong>.</>
              )}
            </p>
          </div>

          {/* Current Reviewer Role Box */}
          <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2 border border-white/20 shrink-0 text-right lg:text-left space-y-0.5">
            <div className="text-[8px] uppercase tracking-wider text-purple-300 font-mono font-bold">
              {lang === 'ja' ? '現在の担当検証者:' : 'Verifikator Aktif Saat Ini:'}
            </div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <UserCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{currentActorName}</span>
            </div>
            <div className="text-[9px] text-amber-300 font-semibold">{currentActorRole}</div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => {
            setSelectedStatusFilter('ALL');
            setSelectedTypeFilter('ALL');
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'ja' ? '申請総数' : 'Total Masuk'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-black text-xs group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-1">{lang === 'ja' ? 'すべての申請区分' : 'Semua jenis pengajuan'}</div>
        </div>

        {/* Menunggu Approval */}
        <div
          onClick={() => setSelectedStatusFilter('MENUNGGU_APPROVAL')}
          className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">{lang === 'ja' ? '要審査' : 'Perlu Review'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-black text-xs group-hover:scale-110 transition animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 mt-2">{stats.pending}</div>
          <div className="text-[10px] text-amber-700 mt-1 font-bold">{lang === 'ja' ? 'Admin Doc承認待ち' : 'Menunggu Otorisasi Admin Doc'}</div>
        </div>

        {/* Disetujui */}
        <div
          onClick={() => setSelectedStatusFilter('DISETUJUI')}
          className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">{lang === 'ja' ? '承認済' : 'Disetujui'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-black text-xs group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{stats.approved}</div>
          <div className="text-[10px] text-emerald-700 mt-1">{lang === 'ja' ? 'DB反映・マッチング可' : 'Aktif di database & matching'}</div>
        </div>

        {/* Perlu Revisi */}
        <div
          onClick={() => setSelectedStatusFilter('PERLU_REVISI')}
          className="bg-orange-50/80 rounded-2xl p-4 border border-orange-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">{lang === 'ja' ? '要修正' : 'Perlu Revisi'}</span>
            <div className="w-8 h-8 rounded-xl bg-orange-200 text-orange-900 flex items-center justify-center font-black text-xs group-hover:scale-110 transition">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-900 mt-2">{stats.revision}</div>
          <div className="text-[10px] text-orange-700 mt-1">{lang === 'ja' ? '提携機関回答待ち' : 'Menunggu feedback mitra'}</div>
        </div>

        {/* Ditolak */}
        <div
          onClick={() => setSelectedStatusFilter('DITOLAK')}
          className="bg-rose-50/80 rounded-2xl p-4 border border-rose-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">{lang === 'ja' ? '却下' : 'Ditolak'}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-900 flex items-center justify-center font-black text-xs group-hover:scale-110 transition">
              <X className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900 mt-2">{stats.rejected}</div>
          <div className="text-[10px] text-rose-700 mt-1">{lang === 'ja' ? '要件不適合' : 'Tidak memenuhi syarat'}</div>
        </div>
      </div>

      {/* Main Filter & Navigation Tabs */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
          <button
            onClick={() => setSelectedTypeFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              selectedTypeFilter === 'ALL'
                ? 'bg-purple-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? `すべての申請 (${stats.total})` : `Semua Pengajuan (${stats.total})`}</span>
          </button>

          <button
            onClick={() => setSelectedTypeFilter('REGISTRASI_SISWA')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              selectedTypeFilter === 'REGISTRASI_SISWA'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? `新規生徒登録 (${stats.studentCount})` : `Registrasi Siswa Baru (${stats.studentCount})`}</span>
          </button>

          <button
            onClick={() => setSelectedTypeFilter('TAMBAH_JOB_MITRA')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              selectedTypeFilter === 'TAMBAH_JOB_MITRA'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? `提携機関求人 (${stats.jobCount})` : `Lowongan Job Mitra (${stats.jobCount})`}</span>
          </button>

          <button
            onClick={() => setSelectedTypeFilter('LAMAR_JOB_SISWA')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              selectedTypeFilter === 'LAMAR_JOB_SISWA'
                ? 'bg-blue-700 text-white shadow-md'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? `求人応募・生徒推薦 (${stats.appCount})` : `Lamaran / Nominasi Siswa (${stats.appCount})`}</span>
          </button>
        </div>

        {/* Secondary Filter Bar: Search, Status, Mitra */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa / lowongan / mitra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              <option value="ALL">Semua Status Approval</option>
              <option value="MENUNGGU_APPROVAL">🟡 Menunggu Approval ({stats.pending})</option>
              <option value="DISETUJUI">🟢 Disetujui (Approved) ({stats.approved})</option>
              <option value="PERLU_REVISI">🟠 Perlu Revisi ({stats.revision})</option>
              <option value="DITOLAK">🔴 Ditolak ({stats.rejected})</option>
            </select>
          </div>

          {/* Mitra Filter */}
          <div>
            <select
              value={selectedMitraFilter}
              onChange={(e) => setSelectedMitraFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
            >
              <option value="ALL">Semua Lembaga Mitra ({mitraOptions.length})</option>
              {mitraOptions.map((m) => (
                <option key={m} value={m}>
                  🏢 {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submissions List Table / Cards */}
        <div className="pt-2">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Tidak ada pengajuan yang sesuai filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Coba sesuaikan kata kunci pencarian atau ganti filter kategori/status di atas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((sub) => {
                const isPending = sub.status === 'MENUNGGU_APPROVAL';

                return (
                  <div
                    key={sub.id}
                    className={`rounded-2xl p-5 border transition duration-200 bg-white shadow-xs hover:shadow-md ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-200/60 bg-amber-50/10'
                        : sub.status === 'PERLU_REVISI'
                        ? 'border-orange-300'
                        : sub.status === 'DISETUJUI'
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Info details */}
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {renderTypeBadge(sub.submissionType)}
                          {renderStatusBadge(sub.status)}
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Diajukan: {sub.submittedAt}</span>
                          </span>
                        </div>

                        {/* Title & Mitra Origin */}
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <span>{sub.targetTitle}</span>
                            {sub.targetCategory && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {sub.targetCategory}
                              </span>
                            )}
                          </h3>
                          <div className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              Pengaju: <strong className="text-indigo-950 font-bold">{sub.mitraName}</strong>
                            </span>
                            {sub.mitraPhone && (
                              <span className="text-slate-400 font-mono">({sub.mitraPhone})</span>
                            )}
                          </div>
                        </div>

                        {/* Specific Meta Info based on Type */}
                        {sub.submissionType === 'REGISTRASI_SISWA' && sub.targetDetails && (
                          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-purple-700 block font-semibold">Email:</span>
                              <span className="font-mono text-slate-800">{sub.targetDetails.email || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-purple-700 block font-semibold">Level Bahasa:</span>
                              <span className="font-bold text-slate-800">{sub.targetDetails.levelBahasa || 'N4'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-purple-700 block font-semibold">Bidang Minat:</span>
                              <span className="font-bold text-slate-800">{sub.targetDetails.bidangKerja || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-purple-700 block font-semibold">Domisili:</span>
                              <span className="text-slate-800">{sub.targetDetails.domisili || '-'}</span>
                            </div>
                          </div>
                        )}

                        {sub.submissionType === 'TAMBAH_JOB_MITRA' && sub.targetDetails && (
                          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-semibold">Perusahaan Jepang:</span>
                              <span className="font-bold text-slate-800">{getSanitizedCompany({ perusahaanJepang: sub.targetDetails.perusahaanJepang })}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-semibold">Prefektur / Lokasi:</span>
                              <span className="font-bold text-slate-800">{sub.targetDetails.lokasiPrefektur || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-semibold">Gaji Bulanan:</span>
                              <span className="font-bold text-emerald-800">
                                ¥{Number(sub.targetDetails.gajiBulananYen || 0).toLocaleString()} (Rp{' '}
                                {Number(sub.targetDetails.gajiEstimasiIdr || 0).toLocaleString('id-ID')})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 block font-semibold">Kuota:</span>
                              <span className="font-bold text-slate-800">{sub.targetDetails.kuotaSiswa || 1} Orang</span>
                            </div>
                          </div>
                        )}

                        {sub.submissionType === 'LAMAR_JOB_SISWA' && sub.targetDetails && (
                          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-blue-700 block font-semibold">Nama Siswa:</span>
                              <span className="font-bold text-slate-900">{sub.targetDetails.namaSiswa || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-blue-700 block font-semibold">Target Lowongan Job:</span>
                              <span className="font-bold text-slate-900">{sub.targetDetails.jobJudul || '-'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-blue-700 block font-semibold">Perusahaan Jepang:</span>
                              <span className="font-bold text-slate-900">{getSanitizedCompany({ perusahaanJepang: sub.targetDetails.perusahaanJepang })}</span>
                            </div>
                          </div>
                        )}

                        {/* Catatan Approval / Catatan Revisi jika ada */}
                        {sub.catatanApproval && sub.status === 'DISETUJUI' && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Catatan Otorisasi Admin Doc: </span>
                              <span>{sub.catatanApproval}</span>
                              <div className="text-[10px] text-emerald-700 mt-1">
                                Disetujui oleh: <strong>{sub.reviewedBy}</strong> ({sub.reviewerRole}) pada {sub.reviewedAt}
                              </div>
                            </div>
                          </div>
                        )}

                        {sub.catatanRevisi && sub.status === 'PERLU_REVISI' && (
                          <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Catatan Revisi untuk Mitra: </span>
                              <span>{sub.catatanRevisi}</span>
                              <div className="text-[10px] text-orange-700 mt-1">
                                Diminta oleh: <strong>{sub.reviewedBy}</strong> ({sub.reviewerRole}) pada {sub.reviewedAt}
                              </div>
                            </div>
                          </div>
                        )}

                        {sub.catatanApproval && sub.status === 'DITOLAK' && (
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                            <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Alasan Penolakan: </span>
                              <span>{sub.catatanApproval}</span>
                              <div className="text-[10px] text-rose-700 mt-1">
                                Ditolak oleh: <strong>{sub.reviewedBy}</strong> ({sub.reviewerRole}) pada {sub.reviewedAt}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Action Buttons Group */}
                      <div className="flex flex-row lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        {/* Tombol Detail Lengkap */}
                        <button
                          onClick={() => setDetailModalSubmission(sub)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                          title="Lihat Detail Berkas & Data"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Detail</span>
                        </button>

                        {/* Tombol Setujui (Approve) */}
                        <button
                          onClick={() => {
                            setApprovalNotesInput(
                              sub.submissionType === 'REGISTRASI_SISWA'
                                ? 'Data identitas dan riwayat belajar valid. Siswa resmi disetujui masuk pool matching Jepang.'
                                : sub.submissionType === 'TAMBAH_JOB_MITRA'
                                ? 'Lowongan kerja terverifikasi valid dari Kumiai/Perusahaan Jepang. Job posting telah dipublikasikan.'
                                : 'Nominasi kandidat memenuhi syarat kualifikasi lowongan. Siap dijadwalkan wawancara Zoom Kumiai.'
                            );
                            setApproveModalSubmission(sub);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            sub.status === 'DISETUJUI'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{sub.status === 'DISETUJUI' ? 'Perbarui Approval' : 'Setujui (Approve)'}</span>
                        </button>

                        {/* Tombol Minta Revisi */}
                        <button
                          onClick={() => {
                            setRevisionNotesInput(sub.catatanRevisi || '');
                            setRevisionModalSubmission(sub);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-700" />
                          <span>Minta Revisi</span>
                        </button>

                        {/* Tombol Tolak */}
                        <button
                          onClick={() => {
                            setRejectionNotesInput(sub.catatanApproval || '');
                            setRejectModalSubmission(sub);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DETAIL LENGKAP PENGAJUAN */}
      {/* ========================================================================= */}
      {detailModalSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  {detailModalSubmission.submissionType === 'REGISTRASI_SISWA' ? (
                    <GraduationCap className="w-5 h-5" />
                  ) : detailModalSubmission.submissionType === 'TAMBAH_JOB_MITRA' ? (
                    <Briefcase className="w-5 h-5" />
                  ) : (
                    <FileCheck2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Detail Berkas & Data Pengajuan Mitra
                  </h3>
                  <p className="text-xs text-purple-700 font-mono font-bold">
                    ID Submission: {detailModalSubmission.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
              {/* Summary Cards */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mitra Pengaju</span>
                    <h4 className="text-sm font-black text-slate-900">{detailModalSubmission.mitraName}</h4>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Email: {detailModalSubmission.mitraEmail || '-'} | Telp: {detailModalSubmission.mitraPhone || '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStatusBadge(detailModalSubmission.status)}
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Waktu submit: {detailModalSubmission.submittedAt}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Detail Content */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider">
                  Isi Payload Formulir Pengajuan:
                </h4>
                <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Target / Judul:</span>
                      <span className="text-sm font-bold text-slate-900">{detailModalSubmission.targetTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block">Kategori / Sektor:</span>
                      <span className="text-sm font-bold text-purple-900">
                        {detailModalSubmission.targetCategory || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Target Details JSON View or formatted fields */}
                  {detailModalSubmission.targetDetails && (
                    <div className="pt-3 border-t border-purple-100">
                      <div className="text-[11px] font-bold text-purple-900 mb-2">Rincian Lengkap Data yang Dikirim:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-purple-100">
                        {Object.entries(detailModalSubmission.targetDetails).map(([key, value]) => (
                          <div key={key} className="space-y-0.5">
                            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">{key}:</span>
                            <div className="text-xs font-semibold text-slate-800 break-words">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval History Logs */}
              {detailModalSubmission.approvalHistory && detailModalSubmission.approvalHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Riwayat & Jejak Audit Approval:</span>
                  </h4>
                  <div className="space-y-2">
                    {detailModalSubmission.approvalHistory.map((h, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-900">{h.actorName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                          </div>
                          <div className="text-[11px] text-purple-700 font-semibold">{h.actorRole}</div>
                          {h.notes && <div className="text-xs text-slate-600 mt-1 italic">"{h.notes}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setDetailModalSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const sub = detailModalSubmission;
                    setDetailModalSubmission(null);
                    setApprovalNotesInput(
                      'Disetujui lengkap oleh Admin Doc dan siap diproses ke tahap pencocokan kerja Jepang.'
                    );
                    setApproveModalSubmission(sub);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KONFIRMASI APPROVAL / SETUJUI */}
      {/* ========================================================================= */}
      {approveModalSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Otorisasi & Persetujuan Pengajuan
                </h3>
                <p className="text-xs text-emerald-700 font-semibold">
                  Validasi data oleh {currentActorName} ({currentActorRole})
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
              <div className="font-bold text-sm">{approveModalSubmission.targetTitle}</div>
              <div className="text-[11px] text-emerald-800">
                Diajukan oleh Mitra: <strong>{approveModalSubmission.mitraName}</strong>
              </div>
              <div className="text-[11px] text-emerald-700">
                Pengesahan ini akan langsung memperbarui status siswa/job/lamaran menjadi <strong>DISETUJUI & AKTIF</strong> di seluruh ekosistem Admin Doc dan Portal Siswa.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Catatan Otorisasi / Instruksi Khusus:</label>
              <textarea
                rows={3}
                value={approvalNotesInput}
                onChange={(e) => setApprovalNotesInput(e.target.value)}
                placeholder="Tuliskan catatan persetujuan verifikasi..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalSubmission(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmApprove}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-700/20"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Persetujuan (Approve)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MINTA REVISI */}
      {/* ========================================================================= */}
      {revisionModalSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-orange-300 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Kirim Permintaan Revisi ke Mitra
                </h3>
                <p className="text-xs text-orange-700 font-semibold">
                  Mitra akan menerima notifikasi dan catatan perbaikan ini
                </p>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-950 space-y-1">
              <div className="font-bold">{revisionModalSubmission.targetTitle}</div>
              <div className="text-[11px] text-orange-800">
                Mitra: <strong>{revisionModalSubmission.mitraName}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Rincian Bagian yang Perlu Diperbaiki / Dilengkapi: <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={4}
                value={revisionNotesInput}
                onChange={(e) => setRevisionNotesInput(e.target.value)}
                placeholder="Contoh: Foto KTP buram, mohon upload scan KTP asli dan sertifikat kelulusan JLPT N4 terbaru..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRevisionModalSubmission(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-700/20"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Catatan Revisi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TOLAK PENGAJUAN */}
      {/* ========================================================================= */}
      {rejectModalSubmission && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-300 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <X className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Tolak Pengajuan Mitra
                </h3>
                <p className="text-xs text-rose-700 font-semibold">
                  Tindakan ini akan menandai pengajuan sebagai DITOLAK
                </p>
              </div>
            </div>

            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1">
              <div className="font-bold">{rejectModalSubmission.targetTitle}</div>
              <div className="text-[11px] text-rose-800">
                Mitra: <strong>{rejectModalSubmission.mitraName}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Alasan Penolakan: <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionNotesInput}
                onChange={(e) => setRejectionNotesInput(e.target.value)}
                placeholder="Tuliskan alasan penolakan secara jelas..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalSubmission(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-700/20"
              >
                <X className="w-4 h-4" />
                <span>Konfirmasi Penolakan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
