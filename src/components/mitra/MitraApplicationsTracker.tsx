import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { JobApplication, JobPosting, CVRirekisho, CalonSiswa } from '../../types';
import { StudentCVModal } from '../StudentCVModal';
import {
  getSanitizedJobTitle,
  getSanitizedCompany,
  translateApplicationStatus
} from '../../utils/mitraJobUtils';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  Video,
  Award,
  AlertCircle,
  Filter,
  Users,
  Eye,
  Send,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Banknote,
  ArrowRight
} from 'lucide-react';

export const MitraApplicationsTracker: React.FC = () => {
  const { user } = useAuth();
  const {
    jobApplications,
    jobPostings,
    rirekishoRecords,
    students,
    healthRecords,
    discRecords,
    psikotesRecords,
    saveJobApplication
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tMitra,
    bilingual
  } = useEcosystemTranslation('mitraPortal');

  const mitraName = user?.namaMitra || user?.displayName || 'LPK Mitra Mandiri Indonesia';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal
  const [selectedStudentForCV, setSelectedStudentForCV] = useState<CalonSiswa | null>(null);
  const [selectedCVRecord, setSelectedCVRecord] = useState<CVRirekisho | undefined>(undefined);
  const [editingNotesApp, setEditingNotesApp] = useState<JobApplication | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Translations dictionary
  const t = {
    id: {
      badge: 'Monitoring Pendaftaran & Hasil Interview',
      title: 'Pelacak Pendaftaran Siswa ke Lowongan Kerja',
      subtitle:
        'Daftar seluruh pengajuan siswa binaan mitra ke perusahaan Jepang. Pantau jadwal zoom interview, catatan rekomendasi, dan status kelulusan secara terpusat.',
      searchPlaceholder: 'Cari nama siswa, lowongan pekerjaan, nama perusahaan...',
      allStatus: '🎯 Semua Status Lamaran',
      optBerkas: 'Seleksi Berkas Rirekisho',
      optInterview: 'Terjadwal Interview',
      optNaitei: 'Lolos Naitei (Kontrak Kerja)',
      optGagal: 'Gagal / Review Ulang',
      emptyTitle: 'Belum ada pendaftaran yang sesuai filter',
      emptyDesc: 'Buka menu Listing Job untuk memilih lowongan aktif dan mendaftarkan siswa binaan Anda.',
      appDate: 'Tanggal Lamar:',
      profileBtn: 'Lihat Profil & Jikoshoukai',
      notesBtn: 'Catatan Mitra',
      zoomSchedule: 'Jadwal Wawancara Online:',
      zoomMeetingLink: 'Link Meeting:',
      readyEarly: 'Harap Siap 15 Menit Sebelum Jadwal',
      mitraRecTitle: 'Rekomendasi / Catatan Mitra:',
      mitraRecEmpty: 'Belum ada catatan khusus.',
      companyFeedbackTitle: 'Umpan Balik Perusahaan / Back-Office Admin:',
      companyFeedbackDefault: 'Sedang dalam review verifikasi berkas oleh Tim Penempatan IJEF.',
      modalTitle: 'Update Catatan Mitra untuk Kandidat',
      modalLabel: 'Catatan Kesiapan, Keunggulan & Kualifikasi Siswa:',
      modalPlaceholder: 'Tuliskan catatan kemajuan bahasa, sertifikasi SSW tambahan, atau instruksi khusus...',
      cancelBtn: 'Batal',
      saveBtn: 'Simpan Catatan',
      toastSuccess: 'Catatan mitra berhasil diperbarui dan disinkronkan ke Back-Office.',
      closeBtn: 'Tutup'
    },
    ja: {
      badge: '応募・面接進捗モニタリング',
      title: '候補生求人応募・選考ステータストラッカー',
      subtitle:
        'パートナー機関から日本企業へ推薦・応募した候補生の一覧です。Zoom面接日時、推薦所見、内定結果およびビザ進捗をリアルタイムに確認できます。',
      searchPlaceholder: '候補者名、求人名、企業名で検索...',
      allStatus: '🎯 全ての選考ステータス',
      optBerkas: '書類選考中（履歴書確認）',
      optInterview: '企業面接調整・選考中',
      optNaitei: '内定獲得（雇用契約締結）',
      optGagal: '不採用 / 再検討',
      emptyTitle: '該当する応募データがありません',
      emptyDesc: '求人リストメニューから募集中の求人を選択し、候補生を推薦してください。',
      appDate: '応募日:',
      profileBtn: '自己紹介・履歴書',
      notesBtn: 'パートナー所見',
      zoomSchedule: 'オンライン面接日時:',
      zoomMeetingLink: '面接URL (Zoom):',
      readyEarly: '開始15分前に入室待機をお願いします',
      mitraRecTitle: 'パートナー推薦所見・特記事項:',
      mitraRecEmpty: '特記事項なし',
      companyFeedbackTitle: '受入企業・事務局フィードバック:',
      companyFeedbackDefault: 'IJEF本部にて書類審査およびマッチング精査中。',
      modalTitle: '候補者に関するパートナー所見の更新',
      modalLabel: '日本語習熟度、推薦理由、人物像・特記事項:',
      modalPlaceholder: '日本語会話力、性格、SSW追加取得状況、希望条件などを入力してください...',
      cancelBtn: 'キャンセル',
      saveBtn: '所見を保存する',
      toastSuccess: 'パートナー所見を正常に保存・同期しました。',
      closeBtn: '閉じる'
    }
  }[lang];

  // Filter applications for this Mitra
  const myApplications = useMemo(() => {
    return jobApplications.filter((app) => {
      const matchesSearch =
        (app.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.jobJudul || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.perusahaanJepang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.emailSiswa || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter !== 'ALL') {
        if (app.statusLamaran !== statusFilter) return false;
      }

      return true;
    });
  }, [jobApplications, searchTerm, statusFilter]);

  const handleSaveNotes = () => {
    if (!editingNotesApp) return;

    const updated: JobApplication = {
      ...editingNotesApp,
      catatanMitra: tempNotes
    };

    saveJobApplication(updated);
    setEditingNotesApp(null);
    setToastMessage(t.toastSuccess);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenCV = (siswaId: string, emailSiswa: string) => {
    const cvList = Object.values(rirekishoRecords) as CVRirekisho[];
    const cv = cvList.find(
      (c) => c.siswaId === siswaId || (c.email || '').toLowerCase() === emailSiswa.toLowerCase()
    );

    const std = students.find(
      (s) => s.id === siswaId || (s.email || '').toLowerCase() === emailSiswa.toLowerCase()
    );

    if (std) {
      setSelectedStudentForCV(std);
      setSelectedCVRecord(cv);
    } else if (cv) {
      const fallbackStd: CalonSiswa = {
        id: cv.siswaId || cv.id,
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
      setSelectedStudentForCV(fallbackStd);
      setSelectedCVRecord(cv);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-slide-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-100 hover:text-white text-xs font-bold px-2 py-1 bg-emerald-700/50 rounded-lg cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="ALL">{t.allStatus}</option>
              <option value="Seleksi Berkas Rirekisho">{t.optBerkas}</option>
              <option value="Terjadwal Interview">{t.optInterview}</option>
              <option value="Lolos Naitei">{t.optNaitei}</option>
              <option value="Gagal / Review Ulang">{t.optGagal}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Cards / List */}
      {myApplications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">{t.emptyTitle}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myApplications.map((app, idx) => (
            <div
              key={app.id ? `${app.id}-${idx}` : `app-track-${idx}`}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition duration-200 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        app.statusLamaran === 'Lolos Naitei'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : app.statusLamaran === 'Terjadwal Interview'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}
                    >
                      {translateApplicationStatus(app.statusLamaran, lang)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {app.id}</span>
                    <span className="text-xs text-slate-500">• {t.appDate} {app.tanggalLamar}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {app.namaSiswa}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-semibold text-indigo-700">
                      {getSanitizedJobTitle({ judulPekerjaan: app.jobJudul, posisiPekerjaan: app.jobJudul } as any, lang)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {getSanitizedCompany({ perusahaanJepang: app.perusahaanJepang } as any, lang)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenCV(app.siswaId, app.emailSiswa)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.profileBtn}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingNotesApp(app);
                      setTempNotes(app.catatanMitra || '');
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t.notesBtn}</span>
                  </button>
                </div>
              </div>

              {/* Interview schedule box if scheduled */}
              {app.jadwalInterview && (
                <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>{t.zoomSchedule} {app.jadwalInterview}</span>
                    </div>
                    {app.linkZoomInterview && (
                      <div className="text-[11px] text-purple-700 font-mono">
                        {t.zoomMeetingLink} {app.linkZoomInterview}
                      </div>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded-lg text-[11px] w-fit">
                    {t.readyEarly}
                  </span>
                </div>
              )}

              {/* Notes Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">{t.mitraRecTitle}</span>
                  <p className="text-slate-600 italic">
                    {app.catatanMitra || app.rekomendasiMitra || t.mitraRecEmpty}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">{t.companyFeedbackTitle}</span>
                  <p className="text-slate-600">
                    {app.catatanPerusahaan || t.companyFeedbackDefault}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Modal 2: Edit Mitra Notes */}
      {editingNotesApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">
                  {t.modalTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {editingNotesApp.namaSiswa} • {getSanitizedJobTitle({ judulPekerjaan: editingNotesApp.jobJudul } as any, lang)}
                </p>
              </div>
              <button
                onClick={() => setEditingNotesApp(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                {t.modalLabel}
              </label>
              <textarea
                rows={4}
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder={t.modalPlaceholder}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setEditingNotesApp(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {t.cancelBtn}
              </button>

              <button
                onClick={handleSaveNotes}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                {t.saveBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
