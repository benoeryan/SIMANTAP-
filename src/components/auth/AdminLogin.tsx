import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  KeyRound,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Briefcase,
  Eye,
  EyeOff,
  Megaphone,
  Users
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const AdminLogin: React.FC = () => {
  const { loginWithEmail, loginWithGoogle, setDemoSession } = useAuth();
  const { setAdminPortalCategoryMode, adminPortalCategoryMode, setActiveTab, lang } = useApp();
  const isJa = lang === 'ja';
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    // Call loginWithEmail requiring back-office authorized access ('admin' / 'marketing')
    const targetRole = adminPortalCategoryMode === 'MARKETING_PORTAL' ? 'marketing' : 'admin';
    const res = await loginWithEmail(usernameOrEmail, password, targetRole);

    if (res.success && (res.role === 'admin' || res.role === 'marketing')) {
      if (res.role === 'marketing' || adminPortalCategoryMode === 'MARKETING_PORTAL') {
        setAdminPortalCategoryMode('MARKETING_PORTAL');
      } else if (adminPortalCategoryMode === 'ADMIN_1_IJEF') {
        setActiveTab('master');
      }
      navigate('/admin/dashboard');
    } else {
      setErrorMsg(
        res.error || (isJa ? '認証に失敗しました。ユーザー名/メールアドレスおよびパスワードを確認してください。' : 'Autentikasi gagal. Pastikan username/email & password administrator/marketing benar.')
      );
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await loginWithGoogle();
    if (res.success) {
      if (res.role === 'marketing' || adminPortalCategoryMode === 'MARKETING_PORTAL') {
        setAdminPortalCategoryMode('MARKETING_PORTAL');
      } else if (adminPortalCategoryMode === 'ADMIN_1_IJEF') {
        setActiveTab('master');
      }
      navigate('/admin/dashboard');
    } else {
      setErrorMsg(res.error || (isJa ? 'Googleログインに失敗しました。' : 'Gagal masuk dengan Email Google.'));
    }
    setLoading(false);
  };

  const handleDemoMarketing = () => {
    setAdminPortalCategoryMode('MARKETING_PORTAL');
    setDemoSession('marketing', 'Irsan Wijaya (Telemarketer & Intake)', 'irsan.marketing@ijefcorp.com', 'Telemarketer', true, 'MARKETING_PORTAL');
    navigate('/admin/dashboard');
  };

  const handleDemoAdmin1 = () => {
    setAdminPortalCategoryMode('ADMIN_1_IJEF');
    setActiveTab('master');
    setDemoSession('admin', 'Admin Siswa (SIBAL LPK)', 'admin1@ijefcorp.com', 'Admin Siswa (SIM-SB IJEF)', false, 'ADMIN_1_IJEF');
    navigate('/admin/dashboard');
  };

  const handleDemoAdmin2 = () => {
    setAdminPortalCategoryMode('ADMIN_2_CV_PORTAL');
    setDemoSession('admin', 'SuperAdmin CV-Portal (Admin Doc)', 'admin2@ijefcorp.com', 'SuperAdmin', true, 'ADMIN_2_CV_PORTAL');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="pill" />
      </div>

      {/* Top Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10 space-y-2">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center space-x-1 text-slate-500 hover:text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isJa ? '生徒ポータル' : 'Portal Siswa'}</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => navigate('/mitra/login')}
            className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isJa ? '提携パートナーポータル' : 'Portal Mitra LPK'}</span>
          </button>
        </div>

        <div className="flex justify-center">
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-md text-amber-600 ring-1 ring-amber-500/20">
            <Building2 className="w-8 h-8" />
          </div>
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider">
            {isJa ? '管理者バックオフィス認証ゲートウェイ' : 'GERBANG OTORISASI PORTAL ADMIN BACK-OFFICE'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isJa ? 'LPK IJEF CORP 統合管理システム' : 'Sistem Informasi LPK IJEF CORP'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {isJa ? 'ポータル選択：マーケティングCRM、生徒管理（Admin Siswa）、書類・日本就労マッチング（Admin Doc）' : 'Pilih portal kerja: Marketing & Intake CRM, Admin Siswa (SIBAL LPK), atau Admin Doc (CV-Portal Jepang)'}
        </p>
      </div>

      {/* 3 Portal Choice Gateway Cards */}
      <div className="mt-6 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-4 z-10">
        {/* Portal 0: Marketing & CRM */}
        <div
          onClick={() => setAdminPortalCategoryMode('MARKETING_PORTAL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between ${
            adminPortalCategoryMode === 'MARKETING_PORTAL'
              ? 'bg-white border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                {isJa ? 'マーケティングCRM' : 'PORTAL MARKETING (DEPAN ADM SISWA)'}
              </span>
              {adminPortalCategoryMode === 'MARKETING_PORTAL' && (
                <CheckCircle2 className="w-5 h-5 text-orange-600" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-orange-600 shrink-0" />
                <span>{isJa ? 'マーケティング＆募集CRM' : 'Marketing & Intake CRM'}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isJa ? '入校候補生の獲得、進捗パイプライン、生徒マスター・MCU・DISC・JIS履歴書への自動連携。' : 'Pintu masuk pendaftaran calon siswa, funnel pipeline prospek, auto-sinkronisasi ke Master Siswa, MCU, DISC & CV JIS.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDemoMarketing();
            }}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <Megaphone className="w-4 h-4" />
            <span>{isJa ? 'デモ：マーケティング' : 'Masuk Demo Marketing'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Portal 1: Admin Siswa */}
        <div
          onClick={() => setAdminPortalCategoryMode('ADMIN_1_IJEF')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between ${
            adminPortalCategoryMode === 'ADMIN_1_IJEF'
              ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                {isJa ? '生徒管理（Admin Siswa）' : 'PORTAL ADMIN SISWA'}
              </span>
              {adminPortalCategoryMode === 'ADMIN_1_IJEF' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isJa ? '1. 生徒育成管理 (SIBAL)' : '1. SIBAL LPK IJEF CORP'}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isJa ? '生徒マスターデータ、校内選考、健康診断（MCU）、DISC適性検査、50問心理テスト、学費支援・契約管理。' : 'Pengelolaan Master Data Siswa, Seleksi Internal, Medical Check-Up (MCU), Asesmen DISC, Psikotes 50 Soal, Pembiayaan & Kontrak.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDemoAdmin1();
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <Building2 className="w-4 h-4" />
            <span>{isJa ? 'デモ：生徒管理' : 'Masuk Demo Admin Siswa'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Portal 2: Admin Doc */}
        <div
          onClick={() => setAdminPortalCategoryMode('ADMIN_2_CV_PORTAL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 relative overflow-hidden flex flex-col justify-between ${
            adminPortalCategoryMode === 'ADMIN_2_CV_PORTAL'
              ? 'bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-lg'
              : 'bg-white/80 border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                {isJa ? '書類・マッチング (Admin Doc)' : 'PORTAL ADMIN DOC'}
              </span>
              {adminPortalCategoryMode === 'ADMIN_2_CV_PORTAL' && (
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{isJa ? '2. CVポータル＆日本マッチング' : '2. CV-Portal & Matching Japan'}</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isJa ? 'JIS規格履歴書審査、日本企業求人カタログ、Zoom面接日程調整、合格・内定進捗管理。' : 'Pengelolaan Master Rirekisho JIS Resume, Catalog Job Posting Perusahaan Jepang, Penjadwalan Interview Zoom & Tracking Match.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDemoAdmin2();
            }}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isJa ? 'デモ：書類・マッチング' : 'Masuk Demo Admin Doc'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Admin Login Form Box */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white border border-slate-200 py-6 px-6 shadow-xl rounded-2xl sm:px-8 space-y-5">
          {/* Active Selected Destination Badge */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-600 font-semibold">{isJa ? '対象ポータル:' : 'Tujuan Login Portal:'}</span>
            <span
              className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                adminPortalCategoryMode === 'MARKETING_PORTAL'
                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                  : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-purple-100 text-purple-800 border border-purple-300'
              }`}
            >
              {adminPortalCategoryMode === 'MARKETING_PORTAL'
                ? (isJa ? 'マーケティング＆CRM' : 'MARKETING & INTAKE CRM')
                : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                ? (isJa ? '生徒管理 (ADMIN SISWA)' : 'ADMIN SISWA (SIBAL LPK)')
                : (isJa ? '書類・マッチング (ADMIN DOC)' : 'ADMIN DOC (CV-PORTAL)')}
            </span>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sample Demo Admin / Marketing Credentials Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px] uppercase tracking-wide">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {adminPortalCategoryMode === 'MARKETING_PORTAL'
                    ? (isJa ? 'マーケティングチーム ログイン情報:' : 'Kredensial Login Tim Marketing CRM:')
                    : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                    ? (isJa ? '生徒管理者 ログイン情報:' : 'Kredensial Login Admin Siswa (SIBAL):')
                    : (isJa ? 'スーパー管理者 / Admin Doc ログイン情報:' : 'Kredensial SuperAdmin / Admin Doc:')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (adminPortalCategoryMode === 'MARKETING_PORTAL') {
                    setUsernameOrEmail('irsan.marketing@ijefcorp.com');
                    setPassword('MarketingIJEF2026!');
                  } else if (adminPortalCategoryMode === 'ADMIN_1_IJEF') {
                    setUsernameOrEmail('admin1@ijefcorp.com');
                    setPassword('password123');
                  } else {
                    setUsernameOrEmail('admin@ijefcorp.com');
                    setPassword('password123');
                  }
                  setErrorMsg(null);
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer"
              >
                {isJa ? '自動入力' : 'Isi Otomatis'}
              </button>
            </div>

            {adminPortalCategoryMode === 'MARKETING_PORTAL' ? (
              <div className="bg-white p-2.5 rounded border border-orange-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? '担当 1:' : 'Marketing 1:'}</span>
                  <span className="text-orange-700 font-bold">irsan.marketing@ijefcorp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? '担当 2:' : 'Marketing 2:'}</span>
                  <span className="text-orange-700 font-bold">salma.marketing@ijefcorp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? 'パスワード:' : 'Kata Sandi:'}</span>
                  <span className="text-slate-800 font-bold">MarketingIJEF2026! / password123</span>
                </div>
              </div>
            ) : adminPortalCategoryMode === 'ADMIN_1_IJEF' ? (
              <div className="bg-white p-2.5 rounded border border-emerald-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? '生徒管理メール:' : 'Email Admin Siswa:'}</span>
                  <span className="text-emerald-700 font-bold">admin1@ijefcorp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? 'パスワード:' : 'Kata Sandi:'}</span>
                  <span className="text-slate-800">password123</span>
                </div>
              </div>
            ) : (
              <div className="bg-white p-2.5 rounded border border-purple-200 space-y-1 font-mono text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? '管理者メール:' : 'SuperAdmin / Admin Doc Email:'}</span>
                  <span className="text-purple-700 font-bold">admin@ijefcorp.com / admin2@ijefcorp.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isJa ? 'パスワード:' : 'Kata Sandi:'}</span>
                  <span className="text-slate-800">password123</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {adminPortalCategoryMode === 'MARKETING_PORTAL'
                  ? (isJa ? 'マーケティング担当メール / ユーザー名' : 'Email Staf Marketing / Username')
                  : (isJa ? '管理者ユーザー名 / メールアドレス' : 'Username / Admin Email')}
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={
                    adminPortalCategoryMode === 'MARKETING_PORTAL'
                      ? "irsan.marketing@ijefcorp.com"
                      : "admin@ijefcorp.com"
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isJa ? '認証パスワード' : 'Kata Sandi Otorisasi'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer hover:underline"
                >
                  {isJa ? 'パスワードをお忘れですか？' : 'Lupa Kata Sandi?'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? (isJa ? 'パスワードを非表示' : 'Sembunyikan Kata Sandi') : (isJa ? 'パスワードを表示' : 'Tampilkan Kata Sandi')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2 ${
                adminPortalCategoryMode === 'MARKETING_PORTAL'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : adminPortalCategoryMode === 'ADMIN_1_IJEF'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <span>{isJa ? '管理者認証を確認中...' : 'Memverifikasi Akses Admin...'}</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {isJa
                      ? `${adminPortalCategoryMode === 'MARKETING_PORTAL' ? 'マーケティング' : adminPortalCategoryMode === 'ADMIN_1_IJEF' ? '生徒管理' : '書類・マッチング'}ポータルへログイン`
                      : `Masuk Portal ${adminPortalCategoryMode === 'MARKETING_PORTAL' ? 'Marketing' : adminPortalCategoryMode === 'ADMIN_1_IJEF' ? 'Admin Siswa' : 'Admin Doc'}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2.5 text-slate-500">{isJa ? 'または' : 'Atau Opsi Masuk'}</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2l-3.7 2.9C3.7 20.4 7.5 23 12 23z"
              />
            </svg>
            <span>{isJa ? 'Google アカウントでログイン' : 'Masuk dengan Email Google'}</span>
          </button>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 text-center space-y-1">
            <p className="font-semibold text-slate-700">Belum memiliki akun?</p>
            <p className="text-slate-600">
              Silakan <button type="button" onClick={() => navigate('/login')} className="text-amber-700 underline font-bold cursor-pointer">Daftar disini</button> atau contact admin untuk didaftarkan.
            </p>
            <p className="font-semibold text-slate-700 pt-1 border-t border-slate-200">{isJa ? 'Firebase 暗号化バックオフィス認証' : 'Firebase Encrypted Back-Office Auth'}</p>
            <p>{isJa ? '全管理者の操作ログは Cloud Firestore 監査証跡に記録されます。' : 'Aktivitas staf dicatat pada Audit Trail Firestore DB.'}</p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={usernameOrEmail.includes('@') ? usernameOrEmail : ''}
        portalType="ADMIN"
      />
    </div>
  );
};

