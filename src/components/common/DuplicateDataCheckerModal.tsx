import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CVRirekisho } from '../../types';
import {
  detectDuplicates,
  studentToUnified,
  cvToUnified,
  UnifiedRecordItem,
  DuplicateGroup,
  DuplicateField
} from '../../utils/duplicateDetector';
import {
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  ShieldAlert,
  Search,
  Sparkles,
  ExternalLink,
  Users,
  Eye,
  Check,
  Filter,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { StudentPhotoBadge } from '../StudentPhotoBadge';
import { getStudentPhotoUrl, handleStudentImageError } from '../../utils/studentPhotoHelper';

interface DuplicateDataCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalContext?: 'ADMIN_SISWA' | 'ADMIN_DOC' | 'ALL';
  onSelectStudentToView?: (studentId: string) => void;
}

export const DuplicateDataCheckerModal: React.FC<DuplicateDataCheckerModalProps> = ({
  isOpen,
  onClose,
  portalContext = 'ALL',
  onSelectStudentToView
}) => {
  const {
    students,
    deleteStudent,
    rirekishoRecords,
    deleteRirekishoRecord,
    lang
  } = useApp();

  const isJa = lang === 'ja';

  const [scope, setScope] = useState<'ALL' | 'ADMIN_SISWA' | 'ADMIN_DOC'>(
    portalContext === 'ADMIN_DOC'
      ? 'ADMIN_DOC'
      : portalContext === 'ADMIN_SISWA'
      ? 'ADMIN_SISWA'
      : 'ALL'
  );

  const [criteria, setCriteria] = useState<{
    nik: boolean;
    email: boolean;
    phone: boolean;
    name: boolean;
  }>({
    nik: true,
    email: true,
    phone: true,
    name: true
  });

  const [searchFilter, setSearchFilter] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<'ALL' | DuplicateField>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<UnifiedRecordItem | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Convert raw data to unified format based on scope
  const unifiedItems: UnifiedRecordItem[] = useMemo(() => {
    const list: UnifiedRecordItem[] = [];

    if (scope === 'ALL' || scope === 'ADMIN_SISWA') {
      students.forEach((s) => list.push(studentToUnified(s)));
    }

    if (scope === 'ALL' || scope === 'ADMIN_DOC') {
      (Object.values(rirekishoRecords) as CVRirekisho[]).forEach((cv) => list.push(cvToUnified(cv)));
    }

    return list;
  }, [students, rirekishoRecords, scope]);

  // Run duplicate detector
  const duplicateGroups: DuplicateGroup[] = useMemo(() => {
    const detected = detectDuplicates(unifiedItems, criteria);

    return detected.filter((group) => {
      // Filter by criteria dropdown
      if (filterCriteria !== 'ALL' && group.matchType !== filterCriteria) {
        return false;
      }
      // Filter by search query
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesVal = group.matchedValue.toLowerCase().includes(q);
        const matchesRecord = group.records.some(
          (r) =>
            r.namaLengkap.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.noKtp.toLowerCase().includes(q) ||
            r.noHp.toLowerCase().includes(q)
        );
        return matchesVal || matchesRecord;
      }
      return true;
    });
  }, [unifiedItems, criteria, filterCriteria, searchFilter]);

  const totalDuplicateRecords = useMemo(() => {
    const ids = new Set<string>();
    duplicateGroups.forEach((g) => g.records.forEach((r) => ids.add(`${r.type}-${r.id}`)));
    return ids.size;
  }, [duplicateGroups]);

  // Delete a record
  const handleDeleteRecord = async (record: UnifiedRecordItem) => {
    setDeletingId(`${record.type}-${record.id}`);
    try {
      if (record.type === 'STUDENT') {
        deleteStudent(record.id);
      } else {
        deleteRirekishoRecord(record.id);
      }
      showToast(
        isJa
          ? `重複データ「${record.namaLengkap}」(${record.id}) を正常に削除しました。`
          : `Data duplikat "${record.namaLengkap}" (${record.id}) berhasil dihapus.`
      );
    } catch (e: any) {
      showToast(
        isJa
          ? `削除中にエラーが発生しました: ${e?.message || '不明なエラー'}`
          : `Gagal menghapus data: ${e?.message || 'Error tidak diketahui'}`
      );
    } finally {
      setDeletingId(null);
      setConfirmDeleteRecord(null);
    }
  };

  // Clean all dummy records that duplicate real ones
  const handleAutoCleanDummyDuplicates = () => {
    let cleanedCount = 0;
    duplicateGroups.forEach((group) => {
      const hasReal = group.records.some((r) => !r.isDummy);
      if (hasReal) {
        group.records.forEach((r) => {
          if (r.isDummy) {
            if (r.type === 'STUDENT') {
              deleteStudent(r.id);
            } else {
              deleteRirekishoRecord(r.id);
            }
            cleanedCount++;
          }
        });
      }
    });

    if (cleanedCount > 0) {
      showToast(
        isJa
          ? `${cleanedCount} 件のダミー重複データを自動クリーンアップしました。`
          : `Berhasil membersihkan ${cleanedCount} data duplikat dummy secara otomatis.`
      );
    } else {
      showToast(
        isJa
          ? 'クリーンアップ対象のダミー重複データは見つかりませんでした。'
          : 'Tidak ada data duplikat dumi yang perlu dibersihkan.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-60 bg-slate-900 text-white border border-emerald-500/80 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDeleteRecord && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-rose-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="text-base font-black text-slate-900">
                {isJa ? '重複データを削除しますか？' : 'Hapus Data Duplikat Ini?'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isJa
                  ? `「${confirmDeleteRecord.namaLengkap}」(${confirmDeleteRecord.id}) のデータをシステムおよびデータベースから恒久的に削除します。この操作は取り消せません。`
                  : `Anda akan menghapus data "${confirmDeleteRecord.namaLengkap}" (${confirmDeleteRecord.id}) secara permanen dari sistem & Firestore. Tindakan ini tidak dapat dibatalkan.`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">ID:</span>
                <span className="font-mono font-bold text-slate-900">{confirmDeleteRecord.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono font-semibold">{confirmDeleteRecord.noKtp || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold">{confirmDeleteRecord.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isJa ? 'ステータス:' : 'Sumber Data:'}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    confirmDeleteRecord.isDummy
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {confirmDeleteRecord.isDummy ? 'data dumi' : 'Data Asli Firebase'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isJa ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRecord(confirmDeleteRecord)}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-rose-600/30 flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId ? (isJa ? '削除中...' : 'Menghapus...') : isJa ? '削除を実行' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dialog Box */}
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-indigo-900/50 shrink-0">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg border border-white/20 shrink-0 mt-0.5">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  {isJa ? '重複データ検出・統合管理' : 'Cek & Kelola Duplikasi Data'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  {portalContext === 'ADMIN_DOC'
                    ? 'Admin Doc / CV Portal'
                    : portalContext === 'ADMIN_SISWA'
                    ? 'Admin Siswa IJEF'
                    : 'Universal Multi-Portal'}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-1">
                {isJa
                  ? 'NIK、メールアドレス、電話番号、氏名による同一人物の重複判定と一括クリーンアップ'
                  : 'Deteksi otomatis siswa atau kandidat ganda berdasarkan NIK KTP, Email, No. WhatsApp, dan Nama Lengkap.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
            title={isJa ? '閉じる' : 'Tutup'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Options */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0">
          {/* Row 1: Scope & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Scope Switcher */}
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scope === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isJa ? '全データ (Siswa & CV)' : 'Semua Portal (Siswa & CV)'}
              </button>
              <button
                type="button"
                onClick={() => setScope('ADMIN_SISWA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scope === 'ADMIN_SISWA'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isJa ? 'Admin Siswa のみ' : 'Admin Siswa Saja'}
              </button>
              <button
                type="button"
                onClick={() => setScope('ADMIN_DOC')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scope === 'ADMIN_DOC'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isJa ? 'Admin Doc (CV JIS) のみ' : 'Admin Doc (CV JIS) Saja'}
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  isJa
                    ? '名前、NIK、メール、電話番号で検索...'
                    : 'Cari nama, NIK, email, atau no HP...'
                }
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Criteria Checkboxes & Fast Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                {isJa ? '検出基準:' : 'Kriteria Deteksi:'}
              </span>

              <label className="inline-flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={criteria.nik}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, nik: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>🪪 NIK / KTP</span>
              </label>

              <label className="inline-flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={criteria.email}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, email: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>✉️ Email</span>
              </label>

              <label className="inline-flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={criteria.phone}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, phone: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>📱 No. HP</span>
              </label>

              <label className="inline-flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={criteria.name}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, name: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>👤 Nama Lengkap</span>
              </label>
            </div>

            {/* Quick Auto-Clean Button */}
            {duplicateGroups.some((g) => g.hasRealAndDummyMix) && (
              <button
                type="button"
                onClick={handleAutoCleanDummyDuplicates}
                className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isJa ? 'ダミー重複を一括消去' : 'Bersihkan Duplikat Dummy Otomatis'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body / Duplicates List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Indicator Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border text-xs font-medium bg-white shadow-xs">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  duplicateGroups.length > 0
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}
              >
                {duplicateGroups.length}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {duplicateGroups.length > 0
                    ? isJa
                      ? `${duplicateGroups.length} 件の重複グループ (${totalDuplicateRecords} 名のレコード) を検出`
                      : `Ditemukan ${duplicateGroups.length} Kelompok Duplikat (${totalDuplicateRecords} Data Siswa/Kandidat)`
                    : isJa
                    ? '重複データは見つかりませんでした (全データ固有・整合)'
                    : 'Tidak Ditemukan Duplikasi Data (Seluruh Data Unik)'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {isJa
                    ? `スキャン対象: 合計 ${unifiedItems.length} 件のレコード`
                    : `Total ${unifiedItems.length} rekaman dianalisis pada filter portal saat ini`}
                </div>
              </div>
            </div>

            {duplicateGroups.length > 0 && (
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                  <span>⭐ Direkomendasikan Simpan</span>
                </span>
                <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg font-bold">
                  <span>🗑️ Hapus Duplikat</span>
                </span>
              </div>
            )}
          </div>

          {/* If Clean (No Duplicates) */}
          {duplicateGroups.length === 0 && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-black text-slate-900">
                  {isJa ? 'データベースはクリーンです' : 'Database Bersih & Bebas Duplikat!'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isJa
                    ? '選択された条件（NIK、メール、電話番号、氏名）において重複している生徒・候補者データは検出されませんでした。'
                    : 'Tidak ditemukan data ganda berdasarkan kriteria NIK, Email, No. WhatsApp, maupun Nama Lengkap pada portal yang dipilih.'}
                </p>
              </div>
            </div>
          )}

          {/* Duplicates Groups Cards */}
          {duplicateGroups.map((group, groupIdx) => (
            <div
              key={group.groupId}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Group Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {groupIdx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {group.matchFieldLabel}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                      {group.matchedValue}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {group.hasRealAndDummyMix && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{isJa ? '本物＆ダミー混在' : 'Campuran Data Asli & Dummy'}</span>
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-500">
                    {group.records.length} {isJa ? '件の重複' : 'Data Cocok'}
                  </span>
                </div>
              </div>

              {/* Group Records Cards Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.records.map((record) => {
                  const isRecommended = record.id === group.recommendedKeepId;
                  const isStudentPortal = record.type === 'STUDENT';

                  return (
                    <div
                      key={`${record.type}-${record.id}`}
                      className={`relative p-4 rounded-2xl border transition-all ${
                        isRecommended
                          ? 'border-indigo-300 bg-indigo-50/20 ring-1 ring-indigo-400/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Recommended Keep Badge */}
                      {isRecommended && (
                        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>{isJa ? '推奨マスター (保持)' : 'Rekomendasi Master'}</span>
                        </div>
                      )}

                      {/* Record Content */}
                      <div className="flex items-start space-x-3">
                        {/* Photo */}
                        <div className="relative shrink-0">
                          {(() => {
                            const resolvedUrl = getStudentPhotoUrl(record.pasFotoUrl, record.rawStudent || record.rawCV);
                            if (resolvedUrl && resolvedUrl.trim().length > 0) {
                              return (
                                <img
                                  src={resolvedUrl.trim()}
                                  alt={record.namaLengkap}
                                  referrerPolicy="no-referrer"
                                  onError={handleStudentImageError}
                                  className="w-12 h-14 object-cover rounded-xl border border-slate-200 shadow-xs"
                                />
                              );
                            }
                            return (
                              <div className="w-12 h-14 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">
                                {record.namaLengkap ? record.namaLengkap.slice(0, 2).toUpperCase() : '??'}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                isStudentPortal
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {isStudentPortal ? 'ADMIN SISWA' : 'ADMIN DOC (CV JIS)'}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                record.isDummy
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {record.isDummy ? 'data dumi' : 'Data Asli Firebase'}
                            </span>
                          </div>

                          <h5 className="text-sm font-bold text-slate-900 truncate">
                            {record.namaLengkap}
                          </h5>

                          <div className="text-[11px] text-slate-500 font-mono">
                            ID: <span className="font-bold text-slate-700">{record.id}</span>
                          </div>

                          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 pt-1">
                            <div className="truncate">
                              <span className="text-slate-400">NIK:</span>{' '}
                              <span className="font-mono font-semibold text-slate-800">
                                {record.noKtp || '-'}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">Email:</span>{' '}
                              <span className="font-semibold text-slate-800">{record.email || '-'}</span>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">WhatsApp:</span>{' '}
                              <span className="font-semibold text-slate-800">{record.noHp || '-'}</span>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">Kategori:</span>{' '}
                              <span className="font-medium text-slate-800">
                                {record.kategoriKandidat}
                              </span>
                            </div>
                            <div className="truncate">
                              <span className="text-slate-400">Status:</span>{' '}
                              <span className="font-bold text-indigo-700">{record.statusInfo}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar for each record */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {onSelectStudentToView && isStudentPortal ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStudentToView(record.id);
                              onClose();
                            }}
                            className="inline-flex items-center space-x-1 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isJa ? '詳細を見る' : 'Lihat Profil'}</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRecord(record)}
                          className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isJa ? 'この重複を削除' : 'Hapus Data Ini'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {isJa
              ? '💡 重複レコードを削除すると、選択された単一のマスターデータのみが保持されます。'
              : '💡 Hapus data duplikat yang redundan atau dummy agar data siswa tetap akurat dan rapi.'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            {isJa ? '閉じる' : 'Tutup Panel'}
          </button>
        </div>
      </div>
    </div>
  );
};
