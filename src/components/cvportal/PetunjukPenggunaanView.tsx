import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import {
  BookOpen,
  Users,
  Briefcase,
  Calendar,
  Banknote,
  FileText,
  Settings,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  Layers,
  HelpCircle,
  Sparkles,
  Info,
  ChevronRight,
  Building2,
  FileCheck2,
  Lock,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export const PetunjukPenggunaanView: React.FC = () => {
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tCommon,
    bilingual
  } = useEcosystemTranslation('common');
  const [activeMenuGuide, setActiveMenuGuide] = useState<
    'all' | 'hirarki' | 'monitoring' | 'kandidat' | 'jobs' | 'applications' | 'dana' | 'kontrak' | 'settings' | 'password'
  >('all');
  const [activePasswordTab, setActivePasswordTab] = useState<'MANDIRI' | 'ADMIN' | 'POLICY' | 'FAQ'>('MANDIRI');

  return (
    <div className="space-y-6 font-sans max-w-full text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-indigo-800/50 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase font-mono tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{lang === 'ja' ? 'システムマニュアル・運用ガイド' : 'Pusat Informasi & Manual Operasional'}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
              <span>{lang === 'ja' ? 'システム利用手順・権限構造 ＆ 業務フロー' : 'Petunjuk Penggunaan, Hirarki & Alur Proses Sistem'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              {lang === 'ja'
                ? 'LPK IJEF統合システムにおける各機能モジュールの操作手順、ロール別アクセス権限、および多段階承認プロセスの完全ガイドです。'
                : 'Panduan lengkap tata cara penggunaan setiap modul aplikasi, hirarki kewenangan peranan (role-based access), serta prosedur alur persetujuan (approval process) terintegrasi LPK IJEF.'}
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl text-xs space-y-1 shrink-0">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ja' ? '標準作業手順書 (SOP)' : 'Standar Operasional Prosedur (SOP)'}</span>
            </div>
            <p className="text-[11px] text-slate-400">{lang === 'ja' ? 'システムバージョン: 3.5.0 • SIM-SB LPK IJEF' : 'Versi Sistem: 3.5.0 • SIM-SB LPK IJEF'}</p>
          </div>
        </div>

        {/* Quick Filter Navigation Bar */}
        <div className="pt-4 border-t border-indigo-900/60 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveMenuGuide('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'ja' ? '全概要' : 'Semua Ringkasan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('hirarki')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'hirarki'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ja' ? '1. 権限構造＆役割' : '1. Hirarki & Peranan User'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('monitoring')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'monitoring'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ja' ? '2. 進捗モニタリング' : '2. Monitoring Progres'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('kandidat')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'kandidat'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'ja' ? '3. 日本語履歴書' : '3. CV Rirekisho'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('jobs')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'jobs'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ja' ? '4. 求人カタログ' : '4. Katalog Job Postings'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('applications')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'applications'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{lang === 'ja' ? '5. 組合面接' : '5. Interview Kumiai'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('dana')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'dana'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ja' ? '6. 資金援助・承認' : '6. Pembiayaan & Approval'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('kontrak')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'kontrak'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ja' ? '7. LPK契約書' : '7. Surat Kontrak LPK'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('settings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'settings'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'ja' ? '8. 管理者設定' : '8. Setting Admin'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMenuGuide('password')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              activeMenuGuide === 'password'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ja' ? '9. パスワード再設定手順' : '9. Tutorial Lupa Password'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HIRARKI KEWENANGAN & AKTOR PERANAN */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'hirarki') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center border border-indigo-200 shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '1. 権限階層 ＆ ユーザーアクセス権限 (Role-Based Access)' : '1. Hirarki Peranan & Hak Akses Pengguna (Role-Based Access)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? 'SIM-SB LPK IJEFシステムはデータの安全性と説明責任を担保するため、権限レベルを4つの主要段階に区分しています。'
                  : 'Aplikasi SIM-SB LPK IJEF membagi tingkat kewenangan pengguna menjadi 4 tingkatan utama untuk menjaga keamanan dan akuntabilitas data.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level 1 */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {lang === 'ja' ? 'レベル 1' : 'LEVEL 1'}
                </span>
                <UserCheck className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ja' ? '生徒・特定技能候補生' : 'Siswa / Calon Pekerja'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '個人基本情報、学歴、職歴の入力、必要書類のアップロード、求人マッチング選択、分割払い状況の確認を行います。'
                  : 'Mengisi biodata pribadi, riwayat pendidikan, riwayat kerja, mengunggah dokumen persyarat, memilih job matching, dan memantau status angsuran.'}
              </p>
              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <strong>{lang === 'ja' ? 'アクセス権:' : 'Akses:'}</strong> {lang === 'ja' ? '生徒専用ポータル' : 'Portal Siswa Dedicated'}
              </div>
            </div>

            {/* Level 2 */}
            <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
                  {lang === 'ja' ? 'レベル 2' : 'LEVEL 2'}
                </span>
                <ShieldCheck className="w-4 h-4 text-blue-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ja' ? 'LPK検証担当管理者' : 'Admin Verifikator LPK'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '候補者の書類検証、日本語履歴書（JIS規格）の翻訳管理、組合Zoom面接の日程調整、保証人データの確認を行います。'
                  : 'Melakukan verifikasi berkas kandidat, mengelola terjemahan CV Rirekisho bahasa Jepang, menjadwalkan wawancara Zoom Kumiai, serta memeriksa kelengkapan data penjamin.'}
              </p>
              <div className="pt-2 border-t border-blue-200 text-[10px] text-blue-800">
                <strong>{lang === 'ja' ? 'アクセス権:' : 'Akses:'}</strong> {lang === 'ja' ? '生徒管理＆書類ポータル' : 'Admin Siswa & Admin Doc Portal'}
              </div>
            </div>

            {/* Level 3 */}
            <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                  {lang === 'ja' ? 'レベル 3' : 'LEVEL 3'}
                </span>
                <Lock className="w-4 h-4 text-purple-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ja' ? '財務マネージャー' : 'User Manager Finance'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '保証人の支払能力の分析、立替資金限度額の承認、給与天引き分割払いの適格性確認、第2段階承認を行います。'
                  : 'Menganalisis kemampuan finansial penjamin, menyetujui limit pembiayaan Dana Talang, memverifikasi kelayakan angsuran potong gaji, dan memberikan persetujuan tahap 2.'}
              </p>
              <div className="pt-2 border-t border-purple-200 text-[10px] text-purple-800">
                <strong>{lang === 'ja' ? 'アクセス権:' : 'Akses:'}</strong> {lang === 'ja' ? 'マネージャー承認ダッシュボード' : 'Approval Manager Dashboard'}
              </div>
            </div>

            {/* Level 4 */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  {lang === 'ja' ? 'レベル 4' : 'LEVEL 4'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ja' ? '統括代表 (GM)' : 'General Manager (GM)'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '立替資金実行の最終承認、LPK就労協定書および雇用契約書の法的署名・発行を行います。'
                  : 'Persetujuan tertinggi (Final Approval) pencairan dana talangan, penandatanganan legalitas Surat Perjanjian Ikatan Dinas & Kontrak Kerja LPK.'}
              </p>
              <div className="pt-2 border-t border-emerald-200 text-[10px] text-emerald-800">
                <strong>{lang === 'ja' ? 'アクセス権:' : 'Akses:'}</strong> {lang === 'ja' ? 'エグゼクティブ最終決裁' : 'Executive Approval & Final Legal'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MONITORING PROGRES */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'monitoring') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center border border-amber-300 shrink-0">
              <BarChart3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '2. 進捗モニタリングダッシュボード' : '2. Modul Dashboard Monitoring Progres'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '生徒の合格実績・統計およびパフォーマンス指標を総合的に可視化します。'
                  : 'Pusat pantauan statistik dan metrik performa kelulusan siswa secara komprehensif.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '主な機能' : 'Fungsi Utama'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '登録生徒総数、面接合格状況、特定技能ビザ申請進捗、および実行済み融資・立替金の集計を表示します。'
                  : 'Menampilkan total statistik siswa terdaftar, status kelulusan interview, progres pengajuan visa Tokutei Ginou, serta rekapitulasi dana pembiayaan cair.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '統計指標' : 'Indikator Statistik'}</span>
              </h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>{lang === 'ja' ? '在籍生徒数 vs 内定獲得者数' : 'Jumlah Siswa Aktif vs Lulus Job'}</li>
                <li>{lang === 'ja' ? '監理団体・企業面接通過率' : 'Rasio Lolos Wawancara Kumiai'}</li>
                <li>{lang === 'ja' ? '渡航費用立替金の申請・承認進捗' : 'Progres Pengajuan Dana Talang'}</li>
                <li>{lang === 'ja' ? '就労業種・職種別の分布グラフ' : 'Grafik Distribusi Sektor Pekerjaan'}</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ArrowRight className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '利用手順' : 'Prosedur Penggunaan'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '管理者は月次定例会議時に本モジュールを開き、生徒の学習・就労進捗や承認待ち事項を素早く把握・確認します。'
                  : 'Admin cukup membuka modul ini saat rapat koordinasi bulanan untuk meninjau secara cepat performa siswa dan kendala administrasi yang membutuhkan persetujuan.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DATA KANDIDAT CV RIREKISHO */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'kandidat') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 font-bold flex items-center justify-center border border-sky-300 shrink-0">
              <Users className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '3. 候補者データ ＆ 日本語履歴書自動生成 (JIS規格)' : '3. Modul Data Kandidat & Auto-Translate CV Rirekisho (JIS Format)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '個人データ管理、日本語への自動翻訳（漢字・ふりがな）、およびJIS標準履歴書のPDF印刷。'
                  : 'Manajemen data pribadi, terjemahan otomatis ke Bahasa Jepang (Kanji & Furigana), serta pencetakan CV standar JIS.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>{lang === 'ja' ? '日本語自動翻訳' : 'Auto-Translate Jepang'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '氏名、住所、学歴、志望動機・自己紹介を日本語（漢字・カタカナ・ふりがな）へ自動変換します。'
                  : 'Setiap nama, alamat, riwayat sekolah, dan motivasi (Jikoshoukai) dapat diterjemahkan secara otomatis ke dalam Aksara Jepang (Kanji + Katakana).'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-sky-600" />
                <span>{lang === 'ja' ? '書類検証' : 'Verifikasi Dokumen'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '身分証明書(KTP)、卒業証明書、JLPT/JFT Basic A2合格証、特定技能評価試験合格証のスキャンを審査します。'
                  : 'Admin Siswa & Admin Doc memeriksa kelengkapan scan KTP, Ijazah, Sertifikat JLPT/JFT Basic A2, dan Sertifikat Tokutei Ginou Kaigo/Pengolahan Makanan.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ChevronRight className="w-4 h-4 text-sky-600" />
                <span>{lang === 'ja' ? 'JIS規格印刷' : 'Cetak Standard JIS'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '「JIS履歴書印刷」ボタンから、日本の受入企業・監理団体に送付可能な公式PDFドキュメントを出力します。'
                  : 'Aplikasi menyediakan tombol "Cetak CV Rirekisho JIS" untuk mengunduh dokumen PDF resmi siap kirim ke Kumiai/Pihak Penerima di Jepang.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: KATALOG JOB POSTINGS */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'jobs') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300 shrink-0">
              <Briefcase className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '4. 日本求人カタログ (求人案件一覧)' : '4. Modul Katalog Job Postings (Lowongan Kerja Jepang)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '提携組合/登録支援機関(TSK)からの特定技能・介護・製造・食品加工求人の情報センターです。'
                  : 'Pusat informasi lowongan Tokutei Ginou, Kaigo, Manufaktur, & Pengolahan Makanan dari Mitra Kumiai / TSK.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? '求人詳細情報' : 'Rincian Lowongan Job'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '企業名、就労先都道府県、想定月給（日本円）、勤務時間、必要資格証明書などの詳細を網羅しています。'
                  : 'Memuat informasi nama Perusahaan Jepang, Prefektur (Lokasi), Estimasi Gaji Bulanan (Yen), Jam Kerja, serta Kualifikasi Sertifikat yang dibutuhkan.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? '渡航費用連動' : 'Integrasi Biaya Proses'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '各求人に設定されたLPK手続き費用が、立替金シミュレーション計算機に自動連動します。'
                  : 'Setiap lowongan mencantumkan rincian nominal Biaya Proses LPK yang langsung tersinkronkan dengan kalkulator simulasi Dana Talang.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? 'マッチング手順' : 'Prosedur Matching'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '管理者は候補者の適性と求人要件を照合し、求人に紐づけて面接エントリーを行います。'
                  : 'Admin mencocokkan kualifikasi kandidat dengan kriteria job, lalu mengaitkan kandidat ke lowongan untuk didaftarkan wawancara.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: INTERVIEW & SELECTION */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'applications') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-800 font-bold flex items-center justify-center border border-pink-300 shrink-0">
              <Calendar className="w-5 h-5 text-pink-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '5. 面接 ＆ 選考管理モジュール (組合Zoom面接)' : '5. Modul Interview & Selection (Wawancara Zoom Kumiai)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '面接日程調整、Zoom会議リンク、および選考結果ステータスの更新を管理します。'
                  : 'Pengaturan jadwal wawancara, link Zoom Meeting, serta pembaharuan status hasil seleksi.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-pink-600" />
                <span>{lang === 'ja' ? '日程 ＆ Zoomリンク' : 'Jadwal & Link Zoom'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '面接日時（WIB / JST）、組合面接官名、公式Zoom会議URLを登録・共有します。'
                  : 'Admin menginput tanggal wawancara, waktu (WIB / JST), nama pewawancara dari Kumiai, dan tautan Zoom Meeting resmi.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-pink-600" />
                <span>{lang === 'ja' ? '選考ステータス' : 'Tahapan Seleksi'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '審査中（提出済）→ 面接予定 → 合格（内定承認）/ 不合格 をリアルタイム管理します。'
                  : 'Mengakomodasi status: Ditinjau (Submitted) → Dijadwalkan Wawancara → Lolos (Naitei / Disetujui) / Ditolak (Tidak Lolos).'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <span>{lang === 'ja' ? '内定後の自動連動' : 'Otomatisasi Lolos Job'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '合格（内定）となった候補者は自動的に渡航資金援助・融資承認モジュールへ連携されます。'
                  : 'Kandidat yang dinyatakan Lolos (Naitei) akan otomatis terhubung ke Modul Pembiayaan Job & Dana Talang untuk proses akad kredit.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: PEMBIAYAAN JOB & DANA TALANG (APPROVAL HIERARCHY) */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'dana') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center border border-amber-300 shrink-0">
              <Banknote className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja'
                  ? '6. 渡航費用支援 ＆ 立替金4段階承認フロー'
                  : '6. Modul Pembiayaan Job & Alur Persetujuan Approval Dana Talang (4-Tahap)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '給与天引き分割払いシミュレーション、保護者/保証人情報、および多階層承認プロセス。'
                  : 'Simulasi kalkulator angsuran potong gaji, penjaminan orang tua/wali, serta hirarki persetujuan bertingkat (Multi-Tier Approval).'}
              </p>
            </div>
          </div>

          {/* Detailed Approval Flow Visual Diagram */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {lang === 'ja' ? '多段階承認フロー手順 (APPROVAL PROCESS)' : 'PROSEDUR ALUR PERSETUJUAN MULTI-LAYER (APPROVAL PROCESS)'}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                {lang === 'ja' ? 'LPK IJEF公式SOP' : 'SOP Resmi LPK IJEF'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
              {/* Step 1 */}
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs">{lang === 'ja' ? '第1段階' : 'TAHAP 1'}</span>
                  <UserCheck className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-bold text-white text-xs">{lang === 'ja' ? '申請書の提出' : 'Pengajuan Permohonan'}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ja'
                    ? '候補者が分割期間（6〜24ヶ月）を選択し、保証人（親・後見人）情報を入力して申請します。'
                    : 'Kandidat memilih tenor angsuran (6 - 24 bulan), melengkapi identitas penjamin (orang tua/wali), dan mengajukan form permohonan.'}
                </p>
                <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-amber-200">
                  <strong>{lang === 'ja' ? '担当者:' : 'Aktor:'}</strong> {lang === 'ja' ? '生徒 / 候補者' : 'Siswa / Calon Pekerja'}
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs">{lang === 'ja' ? '第2段階' : 'TAHAP 2'}</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <h4 className="font-bold text-white text-xs">{lang === 'ja' ? 'LPK管理者による審査' : 'Verifikasi Admin LPK'}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ja'
                    ? '保証人身分証(NIK KTP)、給与明細/収入証明書、添付書類の妥当性を審査します。'
                    : 'Admin memeriksa validitas NIK KTP Penjamin, Slip Gaji/Surat Penghasilan Penjamin, serta kelengkapan dokumen pendukung.'}
                </p>
                <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-blue-300">
                  <strong>{lang === 'ja' ? '担当者:' : 'Aktor:'}</strong> {lang === 'ja' ? 'LPK検証担当管理者' : 'Admin Verifikator LPK'}
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs">{lang === 'ja' ? '第3段階' : 'TAHAP 3'}</span>
                  <Lock className="w-4 h-4 text-purple-400" />
                </div>
                <h4 className="font-bold text-white text-xs">{lang === 'ja' ? '財務責任者による承認' : 'Approval User Manager'}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ja'
                    ? '返済適格性を精査し、日本での給与天引きスキームを設定の上、立替限度額を承認します。'
                    : 'User Manager Finance menganalisis kelayakan kredit, menetapkan skema potong gaji di Jepang, dan menyetujui limit talangan.'}
                </p>
                <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-purple-300">
                  <strong>{lang === 'ja' ? '担当者:' : 'Aktor:'}</strong> {lang === 'ja' ? '財務マネージャー' : 'User Manager Finance'}
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs">{lang === 'ja' ? '第4段階' : 'TAHAP 4'}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-bold text-white text-xs">{lang === 'ja' ? '代表GMによる最終決裁' : 'Approval GM (Final)'}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === 'ja'
                    ? '代表が最終決裁を行い、法的書類に署名し、立替資金の実行を承認します。'
                    : 'General Manager memberikan persetujuan akhir (Final Approval), menandatangani berkas, dan mengotorisasi pencairan dana talangan.'}
                </p>
                <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-emerald-300">
                  <strong>{lang === 'ja' ? '担当者:' : 'Aktor:'}</strong> {lang === 'ja' ? '統括代表 (GM)' : 'General Manager (Final)'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '候補者と求人費用の自動連携' : 'Otomatisasi Integrasi Kandidat & Biaya Job'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '上部バーで候補者名を選択すると、システムが自動的にマッチング求人データを取得し、シミュレーション計算機に適用します。'
                  : 'Saat nama kandidat dipilih pada bar atas modul, sistem secara otomatis menarik data lowongan job matching kandidat tersebut dan langsung menerapkan biaya prosesnya ke dalam kalkulator simulasi.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>{lang === 'ja' ? '申請書PDFの出力・印刷' : 'Cetak & Unduh Naskah Permohonan PDF'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? 'シミュレーション結果と返済確約書を、LPK IJEFの公式印付きPDFとして印刷・ダウンロードできます。'
                  : 'Dokumen hasil simulasi dan komitmen pembayaran dapat dicetak langsung atau diunduh sebagai berkas PDF legal berstempel LPK IJEF.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: SURAT PERJANJIAN & KONTRAK LPK */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'kontrak') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300 shrink-0">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '7. LPK契約書モジュール (就労協定＆保証書)' : '7. Modul Surat Perjanjian LPK (Kontrak Kerja & Garansi)'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '就職協定書、就業保証宣誓書、およびLPK IJEF研修受講誓約書の発行を管理します。'
                  : 'Penerbitan Surat Perjanjian Ikatan Dinas, Pernyataan Garansi Kerja, serta Komitmen Pelatihan LPK IJEF.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? '三者間契約' : 'Perjanjian 3 Pihak'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '第1当事者（LPK IJEF代表）、第2当事者（候補生）、第3当事者（保護者・保証人）の権利義務を明文化します。'
                  : 'Mengatur klausul hak dan kewajiban antara Pihak I (Pimpinan LPK IJEF), Pihak II (Siswa/Kandidat Pekerja), dan Pihak III (Penjamin Orang Tua/Wali).'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? '就労保証条項' : 'Klausul Garansi Kerja'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '日本への配属保証（特定技能）および自己都合辞退時における費用精算ルールを明記しています。'
                  : 'Memuat jaminan penempatan kerja ke Jepang (Tokutei Ginou) serta hak retensi dana apabila terjadi pembatalan sepihak.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ChevronRight className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ja' ? '法的PDF出力' : 'Ekspor & Cetak PDF Legalisasi'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '印紙貼付欄付きの正式な合意書をダウンロードし、署名・捺印可能なPDFとして出力します。'
                  : 'Menyediakan lembar penandatanganan di atas materai Rp 10.000 yang dapat diunduh dalam bentuk berkas PDF resmi.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: SETTING ADMIN & MANAJEMEN AKUN */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'settings') && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center border border-purple-300 shrink-0">
              <Settings className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {lang === 'ja' ? '8. 管理者設定 ＆ 生徒アカウント管理' : '8. Modul Setting Admin & Manajemen Akun Siswa'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ja'
                  ? '生徒アカウント、ログインパスワード、およびポータル管理者の権限管理。'
                  : 'Pengelolaan akun pendaftaran, password login siswa, serta hak akses peranan pengelola portal.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ja' ? '生徒アカウント管理' : 'Manajemen Akun Siswa'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '生徒新規登録、ログインパスワード再設定、および受講・登録ステータスの有効化/無効化を行います。'
                  : 'Admin dapat menambah akun siswa baru, mereset password login portal, serta mengaktifkan/menonaktifkan status pendaftaran siswa.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ja' ? 'セキュリティ ＆ 監査ログ' : 'Keamanan & Log Sesi'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '認証情報の暗号化保存を徹底し、不正アクセスを防止するためのログイン履歴を監視します。'
                  : 'Memastikan kredensial login disimpan secara aman dan memantau riwayat aktivitas login pengguna untuk mencegah kebocoran data.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
                <ChevronRight className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ja' ? '機関・組織設定' : 'Konfigurasi Lembaga LPK'}</span>
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {lang === 'ja'
                  ? '組織名、レターヘッド、公式住所、連絡先、および公的文書の発行署名者を設定します。'
                  : 'Mengatur Nama LPK, Sub-Judul Kop Surat, Alamat Resmi, Nomor Telp/Email, serta Penandatangan Utama pada berkas otomatis.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: TUTORIAL & PROSEDUR LUPA KATA SANDI (PEMULIHAN AKUN) */}
      {(activeMenuGuide === 'all' || activeMenuGuide === 'password') && (
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center border border-amber-300 shrink-0">
                <KeyRound className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {lang === 'ja' ? '9. パスワード再設定・アカウント復旧マニュアル' : '9. Tutorial & Prosedur Lupa Kata Sandi (Pemulihan Akun)'}
                  </h2>
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lang === 'ja' ? '公式SOP' : 'SOP RESMI'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {lang === 'ja'
                    ? '生徒、提携機関、管理者スタッフ向けのアカウント復旧手順完全ガイド。'
                    : 'Panduan lengkap langkah demi langkah pemulihan akun bagi Calon Siswa, Lembaga Mitra LPK, dan Staf Pengelola.'}
                </p>
              </div>
            </div>

            {/* Inner Sub-Tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActivePasswordTab('MANDIRI')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activePasswordTab === 'MANDIRI'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'ja' ? '1. メール自己再設定' : '1. Reset Mandiri (Email)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePasswordTab('ADMIN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activePasswordTab === 'ADMIN'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'ja' ? '2. 管理者サポート' : '2. Bantuan Admin Siswa'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePasswordTab('POLICY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activePasswordTab === 'POLICY'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'ja' ? '3. セキュリティ基準' : '3. Standar Sandi'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePasswordTab('FAQ')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activePasswordTab === 'FAQ'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>{lang === 'ja' ? '4. よくある質問 (FAQ)' : '4. FAQ & Kendala'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: ALUR RESET MANDIRI VIA EMAIL (SELF SERVICE) */}
          {(activePasswordTab === 'MANDIRI' || activeMenuGuide === 'all') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-[11px]">
                    A
                  </span>
                  <span>
                    {lang === 'ja'
                      ? 'メールによるセルフパスワード再設定手順 (Self-Service Reset via Email)'
                      : 'Alur Reset Mandiri oleh Siswa & Mitra (Self-Service Reset via Email)'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {lang === 'ja' ? '所要時間目安: 1〜2分' : 'Estimasi Waktu: 1 - 2 Menit'}
                </span>
              </div>

              {/* Step Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Step 1 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                      {lang === 'ja' ? 'ログイン画面' : 'Halaman Login'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {lang === 'ja' ? '「パスワードをお忘れですか？」をクリック' : 'Klik "Lupa Kata Sandi?"'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'ログイン画面（生徒、提携機関、管理者ポータル）にて、パスワード欄横の「パスワードをお忘れですか？」リンクを押します。'
                      : 'Pada formulir login (Portal Siswa, Portal Mitra, atau Portal Admin), klik tombol teks "Lupa Kata Sandi?" yang terletak di sebelah kanan label Kata Sandi.'}
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-indigo-700 font-semibold">
                    {lang === 'ja' ? '場所: ログイン画面' : 'Lokasi: Modal Login • CandidateLogin / MitraLogin'}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-bold">
                      {lang === 'ja' ? 'メール入力' : 'Input Email'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {lang === 'ja' ? '登録メールアドレスを入力' : 'Masukkan Email Terdaftar'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? '登録時に使用した有効なメールアドレス（例: siswa@gmail.com）を入力します。'
                      : 'Ketik alamat email aktif yang Anda daftarkan saat registrasi awal akun SIM LPK IJEF (contoh: siswa@gmail.com).'}
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    {lang === 'ja' ? 'ヒント: 前後に空白が入らないよう確認してください。' : 'Tips: Pastikan tidak ada spasi di awal/akhir email.'}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                      3
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      {lang === 'ja' ? 'メール確認' : 'Cek Email'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {lang === 'ja' ? '受信トレイを確認' : 'Buka Kotak Masuk (Inbox)'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'パスワード再設定リンクが記載されたメールが自動送信されます。受信箱または迷惑メールフォルダをご確認ください。'
                      : 'Sistem mengirimkan email otomatis berisikan tautan enkripsi pemulihan kata sandi. Periksa folder Inbox atau folder Spam / Junk.'}
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-700 font-semibold">
                    {lang === 'ja' ? '送信元: SIM LPK IJEF' : 'Pengirim: Firebase Auth / SIM LPK IJEF'}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                      4
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                      {lang === 'ja' ? '完了' : 'Selesai'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-xs">
                    {lang === 'ja' ? '新パスワード設定 ＆ ログイン' : 'Ketik Sandi Baru & Login'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'メール内のリンクをクリックし、新しいパスワード（6文字以上）を設定してログインします。'
                      : 'Klik tautan dari email, masukkan kata sandi baru (min. 6-8 karakter), lalu kembali ke portal untuk login menggunakan kredensial baru.'}
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === 'ja' ? 'アカウントが利用可能になりました' : 'Akun Siap Digunakan Kembali'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALUR BANTUAN ADMIN SISWA / SUPER ADMIN (BACK-OFFICE ASSISTED) */}
          {(activePasswordTab === 'ADMIN' || activeMenuGuide === 'all') && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[11px]">
                    B
                  </span>
                  <span>
                    {lang === 'ja'
                      ? 'バックオフィス管理者によるパスワード再設定支援手順 (Admin-Assisted Reset)'
                      : 'Alur Bantuan Reset Sandi oleh Pengelola Back-Office (Admin Siswa SIM-SB)'}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded">
                  {lang === 'ja' ? '対象: メール利用不可 / 端末紛失時' : 'Khusus Kasus: Email Tidak Aktif / Hilang Akses HP'}
                </span>
              </div>

              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-2">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold">
                      <UserCheck className="w-4 h-4" />
                      <span>{lang === 'ja' ? '1. 本人確認' : '1. Verifikasi Identitas Siswa'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {lang === 'ja'
                        ? '生徒番号(NIS)、身分証明書原本(KTP)、登録電話番号を確認し、本人照合を行います。'
                        : 'Siswa melapor ke kantor LPK IJEF atau menghubungi hotline Admin Siswa. Petugas memverifikasi Nomor Induk Siswa, KTP asli, dan nomor telepon terdaftar.'}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <Settings className="w-4 h-4" />
                      <span>{lang === 'ja' ? '2. 生徒台帳アクセス' : '2. Akses Master Data Siswa'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {lang === 'ja'
                        ? '管理者は生徒台帳またはアカウント管理画面を開き、該当生徒を検索して「パスワードリセット」を実行します。'
                        : 'Admin Siswa membuka menu Master Siswa / Manajemen Akun, mencari data siswa yang bersangkutan, lalu menekan tombol "Reset Sandi Siswa".'}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/15 space-y-2">
                    <div className="flex items-center space-x-2 text-sky-400 font-bold">
                      <RefreshCw className="w-4 h-4" />
                      <span>{lang === 'ja' ? '3. 初期パスワード発行' : '3. Penerbitan Sandi Baru'}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {lang === 'ja'
                        ? '管理者が仮パスワードを発行し、生徒に通知します。初回ログイン時に速やかに変更するよう指示します。'
                        : 'Admin menetapkan kata sandi sementara atau mengirimkan email verifikasi baru, lalu menyerahkannya kepada siswa untuk diganti segera saat login.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STANDAR KEAMANAN SANDI & POLICY */}
          {(activePasswordTab === 'POLICY' || activeMenuGuide === 'all') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? 'パスワードの複雑性' : 'Kompleksitas Kata Sandi'}</span>
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  <li>{lang === 'ja' ? '最低6〜8文字以上' : 'Panjang minimal 6 - 8 karakter.'}</li>
                  <li>{lang === 'ja' ? '英大文字・小文字・数字の組み合わせ推奨' : 'Kombinasi huruf besar, huruf kecil, dan angka.'}</li>
                  <li>{lang === 'ja' ? '生年月日や連続した文字列（123456）を避ける' : 'Hindari tanggal lahir atau urutan berulang (123456).'}</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'ja' ? '不正アクセス防止' : 'Proteksi Brute-Force & Bot'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {lang === 'ja'
                    ? '連続5回の入力失敗で一時的なアカウントロックを適用し、総当たり攻撃から保護します。'
                    : 'Sistem menerapkan jeda otomatis apabila terjadi kesalahan input sandi berulang hingga 5 kali guna melindungi akun dari upaya peretasan.'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'ja' ? '機密性の保持' : 'Kerahasiaan Kredensial'}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {lang === 'ja'
                    ? 'パスワードを第三者と共有しないでください。LPKスタッフがパスワードを口頭で尋ねることはありません。'
                    : 'Dilarang membagikan kata sandi akun kepada pihak ketiga. Staf LPK IJEF tidak pernah meminta kata sandi Anda melalui telepon/pesan singkat.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ & TROUBLESHOOTING */}
          {(activePasswordTab === 'FAQ' || activeMenuGuide === 'all') && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>{lang === 'ja' ? 'パスワード再設定に関するよくある質問 (FAQ)' : 'Tanya Jawab Seputar Kendala Lupa Kata Sandi (FAQ)'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {lang === 'ja'
                      ? 'Q: パスワード再設定メールが届きません。どうすればよいですか？'
                      : 'Q: Mengapa email reset kata sandi belum masuk ke inbox saya?'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'A: 迷惑メール（Spam/Junk）フォルダをご確認ください。また、入力したアドレスが登録時のものと完全に一致しているかご確認ください。'
                      : 'A: Periksa folder Spam, Junk, atau tab Promotions di aplikasi email Anda. Pastikan pula alamat email yang dimasukkan telah sesuai persis dengan saat mendaftar.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {lang === 'ja'
                      ? 'Q: 「リンクの有効期限が切れています」と表示されます。'
                      : 'Q: Muncul keterangan "Tautan kedaluwarsa" (Link Expired)?'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'A: セキュリティのため再設定リンクは1時間で失効します。「パスワードをお忘れですか？」から再度リンクをリクエストしてください。'
                      : 'A: Demi keamanan, tautan reset hanya berlaku 1 jam. Silakan ulangi langkah "Lupa Kata Sandi?" untuk meminta tautan baru yang masih segar.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {lang === 'ja'
                      ? 'Q: パスワード変更後、登録書類や面接履歴データは消えませんか？'
                      : 'Q: Apakah data CV, riwayat interview, dan berkas saya akan hilang setelah reset password?'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'A: 消えません。提出済みの履歴書、健康診断結果、適性検査結果、求人マッチング履歴はすべて安全に保管されています。'
                      : 'A: Tidak. Seluruh riwayat berkas, hasil MCU, tes DISC/Psikotes, dan matching job Anda tersimpan aman di basis data dan tidak terpengaruh oleh penggantian kata sandi.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {lang === 'ja'
                      ? 'Q: 登録したメールアドレス自体を忘れてしまった場合は？'
                      : 'Q: Bagaimana jika saya lupa alamat email yang saya gunakan untuk mendaftar?'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {lang === 'ja'
                      ? 'A: 氏名と身分証明書番号(NIK)をLPK管理者へお伝えください。生徒マスターデータと照合してサポートします。'
                      : 'A: Hubungi Admin Siswa LPK IJEF dengan menyebutkan Nama Lengkap dan Nomor NIK KTP Anda. Admin akan membantu mencocokkan data di Master Data Siswa.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
