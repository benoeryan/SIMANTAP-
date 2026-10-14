import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MitraApprovalSubmission } from '../../types';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  X,
  User,
  Briefcase,
  FileText,
  Info
} from 'lucide-react';
import { translateSubmissionType, translateSubmissionStatus } from '../../utils/mitraJobUtils';

interface MitraApprovalTrackerViewProps {
  onNavigateTab?: (tab: 'DASHBOARD' | 'JOBS' | 'STUDENTS' | 'APPLICATIONS') => void;
}

export const MitraApprovalTrackerView: React.FC<MitraApprovalTrackerViewProps> = () => {
  const { user } = useAuth();
  const { mitraSubmissions, lang } = useApp();
  const isJa = lang === 'ja';

  const mitraId = user?.mitraId || 'MTR-2026-088';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<MitraApprovalSubmission | null>(null);

  // Filter submissions belonging to this mitra (or all if super admin / demo)
  const filteredSubmissions = useMemo(() => {
    return (mitraSubmissions || []).filter((sub) => {
      // Match mitra or if demo/admin/super_admin or if no mitraId filter is strictly enforced
      const matchesMitra = !mitraId || !sub.mitraId || sub.mitraId === mitraId || user?.role === 'admin' || (user?.role as any) === 'super_admin';
      
      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = sub.status === 'MENUNGGU_APPROVAL' || sub.status === 'PENDING';
      } else if (statusFilter === 'APPROVED') {
        matchesStatus = sub.status === 'DISETUJUI' || sub.status === 'APPROVED';
      } else if (statusFilter === 'REJECTED') {
        matchesStatus = sub.status === 'DITOLAK' || sub.status === 'PERLU_REVISI' || sub.status === 'REJECTED';
      }

      const matchesType = typeFilter === 'ALL' || sub.submissionType === typeFilter;
      
      const descText = (sub as any).description || sub.targetDetails?.alamat || '';
      const matchesSearch =
        !searchTerm ||
        sub.targetTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        descText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.catatanApproval?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [mitraSubmissions, mitraId, user, statusFilter, typeFilter, searchTerm]);

  const stats = useMemo(() => {
    const list = mitraSubmissions || [];
    return {
      total: list.length,
      pending: list.filter((s) => s.status === 'PENDING' || s.status === 'MENUNGGU_APPROVAL').length,
      approved: list.filter((s) => s.status === 'APPROVED' || s.status === 'DISETUJUI').length,
      rejected: list.filter((s) => s.status === 'REJECTED' || s.status === 'DITOLAK' || s.status === 'PERLU_REVISI').length
    };
  }, [mitraSubmissions]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {isJa ? '本部承認モニタリングポータル' : 'Portal Pantauan Persetujuan Admin Doc'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                ID Mitra: {mitraId}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {isJa ? '申請状況・Admin Doc承認ステータス管理' : 'Status Pengajuan & Approval Admin Doc'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isJa
                ? '新規候補生登録、自社求人登録、応募推薦に関するAdmin Docによる審査・承認履歴をリアルタイムで詳細に確認できます。'
                : 'Pantau status verifikasi, persetujuan revisi, hingga riwayat catatan dari Admin Doc untuk setiap pengajuan registrasi siswa, lowongan job, dan pelamar.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black font-mono text-amber-400">{stats.total}</div>
              <div className="text-[10px] text-slate-300 font-semibold">{isJa ? '総申請件数' : 'Total Pengajuan'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black font-mono text-amber-300">{stats.pending}</div>
              <div className="text-[10px] text-slate-300 font-semibold">{isJa ? '承認待ち' : 'Menunggu Approval'}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black font-mono text-emerald-400">{stats.approved}</div>
              <div className="text-[10px] text-slate-300 font-semibold">{isJa ? '承認済' : 'Disetujui'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isJa ? '申請タイトルやキーワードで検索...' : 'Cari pengajuan berdasarkan nama/judul...'}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { key: 'ALL', label: isJa ? 'すべて' : 'Semua' },
              { key: 'PENDING', label: isJa ? '承認待ち' : 'Menunggu' },
              { key: 'APPROVED', label: isJa ? '承認済' : 'Disetujui' },
              { key: 'REJECTED', label: isJa ? '要確認/拒否' : 'Revisi/Ditolak' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">{isJa ? 'すべての申請種別' : 'Semua Jenis Pengajuan'}</option>
            <option value="REGISTRASI_SISWA">{isJa ? '候補生登録' : 'Registrasi Siswa'}</option>
            <option value="TAMBAH_JOB_MITRA">{isJa ? '自社求人登録' : 'Tambah Job Mitra'}</option>
            <option value="LAMAR_JOB_SISWA">{isJa ? '求人応募推薦' : 'Lamar Job Siswa'}</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {isJa ? '該当する申請履歴がありません' : 'Tidak ada riwayat pengajuan yang ditemukan'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isJa
              ? '検索条件を変更するか、新規候補生や自社求人の登録を行ってください。'
              : 'Coba ubah filter pencarian atau lakukan pengajuan registrasi siswa, job baru, maupun lamaran kerja.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub) => {
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
                onClick={() => setSelectedSubmission(sub)}
                className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${typeBadgeColor}`}>
                      {typeLabel}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs ${statusBadge.bg}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                      {sub.targetTitle}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {sub.description || sub.targetDetails?.alamat || 'Pengajuan resmi kemitraan LPK IJEF.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(sub.submittedAt).toLocaleDateString(isJa ? 'ja-JP' : 'id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-1">
                    <span>{isJa ? '詳細確認' : 'Detail & Catatan'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {translateSubmissionType(selectedSubmission.submissionType, lang)}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">{selectedSubmission.targetTitle}</h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">ID Pengajuan: {selectedSubmission.id}</p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-medium">{isJa ? '申請ステータス' : 'Status Pengajuan:'}</span>
                  <div className="mt-1 font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{translateSubmissionStatus(selectedSubmission.status, lang)}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-slate-400 font-medium">{isJa ? '申請日時' : 'Waktu Pengajuan:'}</span>
                  <div className="mt-1 font-bold text-slate-800">
                    {new Date(selectedSubmission.submittedAt).toLocaleString(isJa ? 'ja-JP' : 'id-ID')}
                  </div>
                </div>
              </div>

              {selectedSubmission.description && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">{isJa ? '詳細説明' : 'Deskripsi & Keterangan:'}</span>
                  <p className="text-slate-600 leading-relaxed">{selectedSubmission.description}</p>
                </div>
              )}

              {/* Reviewer / Admin Doc Notes */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{isJa ? 'Admin Doc 本部審査ノート' : 'Catatan Verifikasi Admin Doc'}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selectedSubmission.approvalNotes || selectedSubmission.catatanApproval || (isJa ? '現在、Admin Docによる確認作業が進行中です。特記事項はありません。' : 'Belum ada catatan khusus dari Admin Doc. Pengajuan sedang dalam antrean verifikasi.')}
                </p>
                {selectedSubmission.reviewedAt && (
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                    <span>{isJa ? `審査担当: ${selectedSubmission.reviewedBy || 'Admin Doc'}` : `Ditinjau oleh: ${selectedSubmission.reviewedBy || 'Admin Doc'}`}</span>
                    <span>{new Date(selectedSubmission.reviewedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Approval Step History */}
              {selectedSubmission.approvalHistory && selectedSubmission.approvalHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 block">{isJa ? '承認履歴ログ' : 'Riwayat Log Persetujuan'}</span>
                  <div className="space-y-1.5">
                    {selectedSubmission.approvalHistory.map((h, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${h.status === 'DISETUJUI' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-bold text-slate-800">{h.actorName} ({h.actorRole})</span>
                        </div>
                        <span className="text-slate-500 font-mono">{new Date(h.date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isJa ? '閉じる' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
