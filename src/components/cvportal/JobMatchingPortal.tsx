import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import useSyncCRMLead from '../../hooks/useSyncCRMLead';
import { JobPosting, JobApplication, CandidateCategory, CVRirekisho } from '../../types';
import {
  isJobActiveAndAvailable,
  getSanitizedJobTitle,
  getSanitizedCompany,
  formatPrefecture,
  formatQualification,
  translateCandidateCategory
} from '../../utils/mitraJobUtils';
import { JobDescriptionCategorizedView } from '../common/JobDescriptionCategorizedView';
import {
  Building2,
  MapPin,
  Banknote,
  Search,
  CheckCircle2,
  Clock,
  Video,
  FileCheck2,
  Calendar,
  Sparkles,
  ChevronRight,
  Send,
  AlertCircle,
  Briefcase,
  Eye,
  Check
} from 'lucide-react';

export const JobMatchingPortal: React.FC = () => {
  const { user } = useAuth();
  const { leadData } = useSyncCRMLead();
  const { students, jobPostings, jobApplications, saveJobApplication, rirekishoRecords } = useApp();
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tJob,
    bilingual
  } = useEcosystemTranslation('jobMatching');

  const userEmail = user?.email || leadData?.email || '';
  const matchedStudent = students.find((s) => s.email?.toLowerCase().trim() === userEmail.toLowerCase().trim());
  const candidateCategory: CandidateCategory =
    matchedStudent?.kategoriKandidat ||
    leadData?.kategoriKandidat ||
    'SISWA NON IJEF (New Comer)';

  const [activeSubTab, setActiveSubTab] = useState<'katalog' | 'lamaran'>('katalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applyModal, setApplyModal] = useState<JobPosting | null>(null);
  const [applyNotice, setApplyNotice] = useState('');

  // Check candidate's existing Rirekisho CV
  const candidateCV = (Object.values(rirekishoRecords) as CVRirekisho[]).find(
    (cv) => cv.email.toLowerCase() === userEmail.toLowerCase()
  );

  // Candidate's submitted job applications
  const myApplications = jobApplications.filter(
    (app) => app.emailSiswa.toLowerCase() === userEmail.toLowerCase()
  );

  // Filter job opportunities based on candidate category and search filter (Hanya yang Aktif / Open)
  const filteredJobs = jobPostings.filter((job) => {
    if (!isJobActiveAndAvailable(job)) return false;

    const term = (searchTerm || '').toLowerCase();
    const cleanTitle = getSanitizedJobTitle(job, lang).toLowerCase();
    const cleanComp = getSanitizedCompany(job, lang).toLowerCase();
    const cleanPref = formatPrefecture(job.lokasiPrefektur, lang).toLowerCase();

    const matchesSearch =
      (job.judulPekerjaan || '').toLowerCase().includes(term) ||
      cleanTitle.includes(term) ||
      cleanComp.includes(term) ||
      cleanPref.includes(term) ||
      (job.perusahaanJepang || '').toLowerCase().includes(term) ||
      (job.lokasiPrefektur || '').toLowerCase().includes(term);

    const cat = candidateCategory || '';
    const target = job.kategoriTarget || '';

    const matchesCategory =
      target === 'Semua Non-IJEF' ||
      target === cat ||
      (cat.includes('Engineering') && target.includes('Engineering')) ||
      (cat.includes('Ex-Magang') && target.includes('Ex-Magang'));

    return matchesSearch && matchesCategory;
  });

  const handleApply = (job: JobPosting) => {
    const cleanTitle = getSanitizedJobTitle(job, lang);
    const cleanCompany = getSanitizedCompany(job, lang);

    if (!candidateCV) {
      alert(
        lang === 'ja'
          ? '履歴書ビルダー（Rirekisho Builder）タブでJIS規格履歴書を作成・保存してからご応募ください。'
          : 'Mohon isi terlebih dahulu Rirekisho CV Bahasa Jepang Anda pada tab Rirekisho Builder.'
      );
      return;
    }

    const newApp: JobApplication = {
      id: `APP-${Date.now()}`,
      jobId: job.id,
      jobJudul: cleanTitle,
      perusahaanJepang: cleanCompany,
      siswaId: user?.uid || `SISWA-${Date.now()}`,
      namaSiswa: candidateCV.namaLengkap,
      emailSiswa: userEmail,
      kategoriKandidat: candidateCategory,
      tanggalLamar: new Date().toISOString().split('T')[0],
      statusLamaran: lang === 'ja' ? '書類選考中（Rirekisho）' : 'Seleksi Berkas Rirekisho',
      catatanPerusahaan:
        lang === 'ja'
          ? 'JIS規格履歴書が日本企業の採用担当者へ送信されました。面接日程の調整をお待ちください。'
          : 'Berkas Rirekisho telah terkirim ke HRD Perusahaan Jepang. Menunggu jadwal seleksi interview.'
    };

    saveJobApplication(newApp);
    setApplyModal(null);
    setApplyNotice(
      lang === 'ja'
        ? `求人「${cleanTitle}」への応募が完了しました！履歴書が受入企業へ送信されました。`
        : `Sukses melamar lowongan ${cleanTitle}! Rirekisho Anda telah dikirim ke HRD Perusahaan.`
    );
    setTimeout(() => setApplyNotice(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-100 via-indigo-50 to-purple-50 border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden text-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'ja'
                  ? `日本就職・求人マッチングポータル • ${translateCandidateCategory(candidateCategory, lang)}`
                  : `Matching Job Japan Portal • ${candidateCategory}`}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'ja'
                ? '日本受入企業 求人マッチング＆選考ポータル'
                : 'Portal Job Matching & Lowongan Kerja Perusahaan Jepang'}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {lang === 'ja'
                ? '特定技能、技術・人文知識・国際業務（技人国）、元技能実習生向けの日本全国求人情報と履歴書マッチングを提供します。'
                : 'Sistem mencocokkan kualifikasi Rirekisho Anda dengan lowongan kerja Tokutei Ginou, Engineering (Gijinkoku), & Ex-Magang di berbagai Prefektur Jepang.'}
            </p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 self-start md:self-auto shadow-xs">
            <button
              onClick={() => setActiveSubTab('katalog')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeSubTab === 'katalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>
                {lang === 'ja' ? `求人カタログ (${filteredJobs.length})` : `Katalog Lowongan (${filteredJobs.length})`}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('lamaran')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
                activeSubTab === 'lamaran'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'ja' ? `応募履歴 (${myApplications.length})` : `Status Lamaran Saya (${myApplications.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {applyNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{applyNotice}</span>
        </div>
      )}

      {/* KATALOG LOWONGAN TAB */}
      {activeSubTab === 'katalog' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  lang === 'ja'
                    ? '職種、勤務地、キーワードで検索...'
                    : 'Cari posisi, perusahaan, atau prefektur (misal: Tokyo, Kaigo)...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="text-xs text-slate-600 flex items-center space-x-2">
              <span className="text-slate-500">{lang === 'ja' ? '対象区分:' : 'Target Kategori:'}</span>
              <span className="bg-indigo-50 text-indigo-800 font-bold px-2.5 py-1 rounded-md border border-indigo-200">
                {translateCandidateCategory(candidateCategory, lang)}
              </span>
            </div>
          </div>

          {/* Job Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job, idx) => {
              const hasApplied = myApplications.some((a) => a.jobId === job.id);
              const displayTitle = getSanitizedJobTitle(job, lang);
              const displayCompany = getSanitizedCompany(job, lang);
              const displayPrefecture = formatPrefecture(job.lokasiPrefektur, lang);
              const displayQual = formatQualification(job.persyaratanJLPT, lang);

              return (
                <div
                  key={job.id ? `${job.id}-${idx}` : `match-job-${idx}`}
                  className="bg-white border border-slate-200 hover:border-indigo-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {job.kodeJob || job.id}
                        </span>
                        <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {displayPrefecture}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {lang === 'ja' ? `募集枠: ${job.kuotaSiswa || 5}名` : `Kuota: ${job.kuotaSiswa || 5} Org`}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition line-clamp-2">
                        {displayTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-700 break-words leading-snug" title={displayCompany}>{displayCompany}</span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{lang === 'ja' ? '給与目安:' : 'Gaji:'}</span>
                        <span className="font-black text-amber-800">
                          {job.gajiBulananYen
                            ? `¥${job.gajiBulananYen.toLocaleString('ja-JP')} / ${lang === 'ja' ? '月' : 'bulan'}`
                            : (job.gajiString || (lang === 'ja' ? '規定による' : 'Sesuai Standar'))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{lang === 'ja' ? '性別要件:' : 'Kriteria Gender:'}</span>
                        <span className="font-bold text-slate-800">
                          {job.jenisKelamin
                            ? (lang === 'ja'
                                ? (job.jenisKelamin.toLowerCase().includes('laki') ? '男性' : job.jenisKelamin.toLowerCase().includes('perempuan') ? '女性' : '不問')
                                : job.jenisKelamin)
                            : (lang === 'ja' ? '不問' : 'Bebas')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-500">{lang === 'ja' ? '必要語学力:' : 'Syarat Bahasa:'}</span>
                        <span className="font-semibold text-indigo-700 truncate max-w-[150px]">{displayQual}</span>
                      </div>
                    </div>

                    {job.kualifikasi && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                        <span className="font-bold text-amber-900">{lang === 'ja' ? '要件: ' : 'Kualifikasi: '}</span>
                        {job.kualifikasi}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lang === 'ja' ? '求人詳細' : 'Detail Lowongan'}</span>
                    </button>

                    {hasApplied ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ja' ? '応募済' : 'Sudah Dilamar'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setApplyModal(job)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{lang === 'ja' ? 'この求人に応募' : 'Lamar Job Ini'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STATUS LAMARAN TAB */}
      {activeSubTab === 'lamaran' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <span>{lang === 'ja' ? '応募履歴・選考＆オンライン面接ステータス' : 'Daftar Aplikasi Matching Job & Status Interview Zoom'}</span>
            </h3>

            {myApplications.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm">
                  {lang === 'ja'
                    ? '現在応募中の求人はありません。'
                    : 'Anda belum mengajukan lamaran ke lowongan pekerjaan Jepang.'}
                </p>
                <button
                  onClick={() => setActiveSubTab('katalog')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-block cursor-pointer"
                >
                  {lang === 'ja' ? '募集中の求人を見る' : 'Jelajahi Katalog Lowongan Kerja'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div key={app.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {lang === 'ja' ? `申請ID: ${app.id} • 応募日: ${app.tanggalLamar}` : `ID Aplikasi: ${app.id} • Tanggal: ${app.tanggalLamar}`}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-0.5">{app.jobJudul}</h4>
                        <p className="text-xs text-indigo-700 font-medium">{getSanitizedCompany({ perusahaanJepang: app.perusahaanJepang }, lang)}</p>
                      </div>

                      <div className="inline-block">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            app.statusLamaran.includes('Lolos') || app.statusLamaran.includes('Naitei') || app.statusLamaran.includes('内定')
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : app.statusLamaran.includes('Zoom') || app.statusLamaran.includes('Interview') || app.statusLamaran.includes('面接')
                              ? 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          }`}
                        >
                          ● {app.statusLamaran}
                        </span>
                      </div>
                    </div>

                    {/* Interview Zoom Details */}
                    {app.jadwalInterview && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs space-y-2">
                        <div className="flex items-center space-x-2 text-purple-800 font-bold">
                          <Calendar className="w-4 h-4" />
                          <span>{lang === 'ja' ? '日本企業役員 面接日時:' : 'Jadwal Interview Direksi Perusahaan Jepang:'}</span>
                        </div>
                        <div className="text-slate-900 font-semibold pl-6">{app.jadwalInterview}</div>

                        {app.linkInterviewZoom && (
                          <div className="pl-6 pt-1">
                            <a
                              href={app.linkInterviewZoom}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{lang === 'ja' ? 'Zoom面接室へ入室' : 'Buka Room Interview Zoom'}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-500">
                        {lang === 'ja' ? '企業・監理団体からの備考: ' : 'Catatan Perusahaan/Kumiai: '}
                      </span>
                      <span>
                        {app.catatanPerusahaan ||
                          (lang === 'ja' ? '現在、採用担当者による履歴書審査中です。' : 'Sedang dilakukan seleksi berkas Rirekisho oleh manajemen.')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOB DETAIL MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-slate-900 shadow-2xl my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-xs font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedJob.kodeJob || selectedJob.id}
                  </span>
                  <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded text-[10px] font-bold border border-indigo-200">
                    {formatPrefecture(selectedJob.lokasiPrefektur, lang)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">{getSanitizedJobTitle(selectedJob, lang)}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {getSanitizedCompany(selectedJob, lang)} • {formatPrefecture(selectedJob.lokasiPrefektur, lang)}
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Categorized structured job view */}
              <JobDescriptionCategorizedView job={selectedJob} lang={lang} isStudentView={true} />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedJob(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {lang === 'ja' ? '閉じる' : 'Tutup'}
              </button>
              <button
                onClick={() => {
                  const current = selectedJob;
                  setSelectedJob(null);
                  setApplyModal(current);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'この求人に応募する' : 'Lamar Job Ini Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM APPLY MODAL */}
      {applyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 text-slate-900 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Send className="w-5 h-5 text-indigo-600" />
              <span>{lang === 'ja' ? 'JIS履歴書 提出確認' : 'Konfirmasi Pengiriman Rirekisho'}</span>
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed">
              {lang === 'ja'
                ? `求人「${getSanitizedJobTitle(applyModal, lang)}」（${getSanitizedCompany(applyModal, lang)}）へ応募します。`
                : `Anda akan mengajukan lamaran ke lowongan ${getSanitizedJobTitle(applyModal, lang)} (${getSanitizedCompany(applyModal, lang)}).`}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold">{lang === 'ja' ? '登録情報確認:' : 'Informasi Terkunci:'}</span>
              <p>
                {lang === 'ja'
                  ? `システムは以下の情報と共に履歴書を提出します：Email: ${userEmail}、区分: ${translateCandidateCategory(candidateCategory, lang)}`
                  : `Sistem akan menyertakan data Rirekisho Anda dengan Email: ${userEmail} dan Kategori: ${candidateCategory}.`}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setApplyModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                onClick={() => handleApply(applyModal)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                {lang === 'ja' ? '企業へ履歴書を送信' : 'Kirim Rirekisho Ke Perusahaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatchingPortal;
