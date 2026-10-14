import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { INITIAL_MITRA_ORGANIZATIONS } from '../../data/seedData';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Users,
  Briefcase,
  KeyRound,
  GraduationCap,
  CheckCircle2,
  Phone,
  Handshake,
  UserPlus,
  HelpCircle,
  Send,
  MessageSquare,
  Globe2,
  MapPin,
  Check
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

export const MitraLogin: React.FC = () => {
  const { loginWithEmail, setDemoSession } = useAuth();
  const { masterSettings, updateMasterSettings, lang } = useApp();
  const isJa = lang === 'ja';
  const navigate = useNavigate();

  // Mode: 'LOGIN' or 'REGISTER'
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Registration verification state
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVerifiedMitra, setRegVerifiedMitra] = useState<any | null>(null);
  const [regCheckError, setRegCheckError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Submit Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Mohon masukkan Email dan Kata Sandi Lembaga Mitra.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await loginWithEmail(email, password, 'mitra');
    setLoading(false);

    if (result.success) {
      navigate('/portal-mitra');
    } else {
      setErrorMsg(result.error || 'Login gagal. Periksa kembali email dan password mitra Anda.');
    }
  };

  const handleDemoMitra = (namaMitra: string, emailMitra: string) => {
    setDemoSession('mitra', namaMitra, emailMitra);
    navigate('/portal-mitra');
  };

  // Check Email Whitelist for Mitra Registration
  const handleCheckEmailWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRegCheckError('Masukkan email resmi lembaga mitra Anda terlebih dahulu.');
      return;
    }

    setRegLoading(true);
    setRegCheckError(null);
    setRegVerifiedMitra(null);
    setRegSuccessMsg(null);

    setTimeout(() => {
      // 1. Search in masterSettings.adminUsers
      const adminUsers = masterSettings?.adminUsers || [];
      let found = adminUsers.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail &&
          (u.role === 'Mitra LPK' || u.portalAccess === 'MITRA_PORTAL' || (u.id && typeof u.id === 'string' && u.id.startsWith('MTR')) || (u.mitraType && u.mitraType.length > 0))
      );

      // 2. Fallback to localStorage ijef_mitra_organizations
      if (!found) {
        try {
          const stored = localStorage.getItem('ijef_mitra_organizations');
          if (stored) {
            const orgs = JSON.parse(stored);
            const foundInStorage = orgs.find((o: any) => o.email?.toLowerCase() === cleanEmail);
            if (foundInStorage) {
              found = {
                id: foundInStorage.id,
                name: foundInStorage.name,
                picName: foundInStorage.picName,
                email: foundInStorage.email,
                phone: foundInStorage.phone,
                role: 'Mitra LPK',
                mitraType: foundInStorage.category,
                department: foundInStorage.wilayah,
                status: foundInStorage.status || 'AKTIF',
                password: foundInStorage.passwordHint || 'MitraIJEF2026!'
              } as any;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }

      // 3. Fallback to INITIAL_MITRA_ORGANIZATIONS seed
      if (!found) {
        const foundSeed = INITIAL_MITRA_ORGANIZATIONS.find((o) => o.email.toLowerCase() === cleanEmail);
        if (foundSeed) {
          found = foundSeed;
        }
      }

      setRegLoading(false);

      if (found) {
        setRegVerifiedMitra(found);
        setRegPass(found.passwordHint || found.password || 'MitraIJEF2026!');
        setRegPhone(found.phone || '');
        setRegCheckError(null);
      } else {
        setRegVerifiedMitra(null);
        setRegCheckError(
          `Email "${cleanEmail}" belum terdaftar dalam Direktori Mitra Resmi Admin Doc IJEF CORP. Lembaga Anda wajib didaftarkan terlebih dahulu oleh Tim Back-Office / Admin Doc sebelum dapat membuat akun di Portal Mitra.`
        );
      }
    }, 400);
  };

  // Complete Registration & Enter Portal
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regVerifiedMitra) return;

    // Update the account password/phone in masterSettings if changed
    const currentList = masterSettings?.adminUsers || [];
    const updatedList = currentList.map((item) => {
      if (item.id === regVerifiedMitra.id || item.email.toLowerCase() === regVerifiedMitra.email.toLowerCase()) {
        return {
          ...item,
          phone: regPhone || item.phone,
          password: regPass || item.password || 'MitraIJEF2026!',
          passwordHint: regPass || item.passwordHint || 'MitraIJEF2026!',
          status: 'AKTIF' as const
        };
      }
      return item;
    });

    if (updateMasterSettings) {
      updateMasterSettings({ adminUsers: updatedList });
    }

    setRegSuccessMsg('Pendaftaran & Verifikasi Kemitraan Berhasil! Mengalihkan ke Portal Mitra...');

    setTimeout(() => {
      setDemoSession(
        'mitra',
        regVerifiedMitra.name || 'Lembaga Mitra IJEF',
        regVerifiedMitra.email,
        'Mitra LPK',
        false,
        'MITRA_PORTAL'
      );
      navigate('/portal-mitra');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background accents */}
      <div className="absolute inset-0 bg-radial from-indigo-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding & Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center z-10 px-4">
        <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-500/30 px-4 py-1.5 rounded-full mb-3 shadow-sm">
          <Handshake className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black text-indigo-200 tracking-wider uppercase">
            {isJa ? 'LPK IJEF CORP • 提携パートナーポータル' : 'LPK IJEF CORP • PORTAL MITRA STRATEGIS'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isJa ? '提携校・監理団体・支援機関 公式ポータル' : 'Portal Kemitraan Resmi (Mitra LPK & Kumiai)'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          {isJa
            ? '送出機関（提携LPK）、日本の監理団体、登録支援機関、専門学校・大学向けの候補生推薦および面接進捗管理システム'
            : 'Akses khusus Lembaga Pelatihan Kerja (LPK Pengirim), Kumiai, TSK Jepang, dan SMK/Kampus untuk nominasi siswa & pemantauan interview kerja.'}
        </p>
      </div>

      {/* Main Container Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
        <div className="bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
          {/* TAB SWITCHER: LOGIN vs DAFTAR AKUN */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 border-b border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('LOGIN');
                setErrorMsg(null);
              }}
              className={`py-3 rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-white text-purple-950 font-black shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <KeyRound className="w-4 h-4 text-purple-700" />
              <span>{isJa ? '提携先ログイン' : 'Masuk Akun Mitra'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMsg(null);
                setRegCheckError(null);
              }}
              className={`py-3 rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-white text-purple-950 font-black shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>{isJa ? 'パートナー登録 / 認証' : 'Daftar / Aktivasi Mitra'}</span>
              <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-full border border-amber-300">
                {isJa ? '事前認証制' : 'Email Admin Doc'}
              </span>
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* ======================================================= */}
            {/* VIEW 1: STANDARD LOGIN MODE */}
            {/* ======================================================= */}
            {authMode === 'LOGIN' && (
              <div className="space-y-5">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Quick 1-Click Demo Buttons for Mitra Organizations */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-purple-950 font-black">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{isJa ? 'デモ提携先クイックログイン (1-Click):' : 'Masuk Cepat Akun Mitra Demo (1-Click):'}</span>
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full uppercase font-bold">
                      {isJa ? '提携先' : 'Akses Mitra'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {/* Mitra 1 */}
                    <button
                      type="button"
                      onClick={() => handleDemoMitra('LPK Mitra Mandiri Indonesia', 'mitra.mandiri@lpkmitra.id')}
                      className="p-3 bg-white hover:bg-purple-100/70 border border-purple-300 rounded-xl text-left transition cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-purple-950 text-xs truncate">
                          LPK Mitra Mandiri Indonesia
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          mitra.mandiri@lpkmitra.id
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-purple-700 flex items-center justify-between">
                        <span>{isJa ? '分野: 介護・食品' : 'Sektor: Kaigo & PM'}</span>
                        <span className="text-emerald-700">{isJa ? 'ログイン →' : 'Masuk →'}</span>
                      </div>
                    </button>

                    {/* Mitra 2 */}
                    <button
                      type="button"
                      onClick={() => handleDemoMitra('LPK Karya Jepang Nusantara', 'mitra.karya@lpkjepang.com')}
                      className="p-3 bg-white hover:bg-purple-100/70 border border-purple-300 rounded-xl text-left transition cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-extrabold text-purple-950 text-xs truncate">
                          LPK Karya Jepang Nusantara
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          mitra.karya@lpkjepang.com
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] font-bold text-purple-700 flex items-center justify-between">
                        <span>{isJa ? '分野: 農業・製造' : 'Sektor: Pertanian & Manufaktur'}</span>
                        <span className="text-emerald-700">{isJa ? 'ログイン →' : 'Masuk →'}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Standard Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isJa ? '提携先公式メールアドレス' : 'Email Resmi Lembaga Mitra / LPK'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mitra.mandiri@lpkmitra.id"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isJa ? 'パスワード' : 'Kata Sandi Akses'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setShowForgotModal(true);
                        }}
                        className="text-[11px] font-bold text-purple-700 hover:text-purple-900 transition cursor-pointer hover:underline"
                      >
                        {isJa ? 'パスワードをお忘れですか？' : 'Lupa Kata Sandi?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{loading ? (isJa ? '認証中...' : 'Memverifikasi...') : (isJa ? 'パートナーポータルにログイン' : 'Masuk ke Portal Mitra')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ======================================================= */}
            {/* VIEW 2: REGISTRATION / EMAIL WHITELIST VERIFICATION */}
            {/* ======================================================= */}
            {authMode === 'REGISTER' && (
              <div className="space-y-4 text-xs">
                {/* Info Callout */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-900 rounded-xl shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-950">
                      {isJa ? '提携先アカウント登録・認証手続き' : 'Otorisasi Pendaftaran Akun Mitra'}
                    </h4>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                      {isJa
                        ? 'パートナーシップの信頼性と法令遵守を確保するため、ポータルへの新規登録はIJEF事務局にて事前登録された公式メールアドレスのみ可能です。'
                        : 'Untuk menjamin legalitas kemitraan, pendaftaran akun baru di Portal Mitra hanya dapat dilakukan menggunakan Email Lembaga yang telah didaftarkan sebelumnya oleh Admin Doc IJEF CORP.'}
                    </p>
                  </div>
                </div>

                {regSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-2 text-xs text-emerald-900 font-bold animate-pulse">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{regSuccessMsg}</span>
                  </div>
                )}

                {regCheckError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-900">
                    <div className="flex items-start space-x-2 font-bold text-rose-950">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{isJa ? '登録アクセス不可' : 'Akses Pendaftaran Ditolak'}</span>
                    </div>
                    <p className="text-[11px] text-rose-800">{regCheckError}</p>
                    <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                      <span className="text-[10px] text-rose-700 font-medium">
                        {isJa ? 'IJEFとの提携をご希望ですか？' : 'Belum bekerjasama dengan IJEF?'}
                      </span>
                      <a
                        href="https://wa.me/6281288882026?text=Halo%20Admin%20IJEF,%20Lembaga%20kami%20ingin%20mendaftar%20sebagai%20Mitra%20Resmi%20untuk%20Job%20Matching%20Jepang."
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{isJa ? 'IJEF事務局にお問い合わせ' : 'Hubungi Admin Doc IJEF'}</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Step 1: Input & Check Email */}
                {!regVerifiedMitra && (
                  <form onSubmit={handleCheckEmailWhitelist} className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {isJa ? '事前登録済みメールアドレスを入力:' : 'Masukkan Email Lembaga yang Didaftarkan Admin Doc:'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="contoh: mitra.mandiri@lpkmitra.id"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isJa
                          ? '※ IJEF事務局に登録済みの公式メールアドレスを入力してください。'
                          : '* Masukkan email resmi yang telah didaftarkan oleh Admin Doc IJEF CORP.'}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {regLoading ? (
                        <span>{isJa ? '認証確認中...' : 'Memeriksa Otorisasi Admin Doc...'}</span>
                      ) : (
                        <>
                          <span>{isJa ? 'メール認証ステータスを確認' : 'Periksa Status Otorisasi Email'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Step 2: Verified Mitra Account Confirmation */}
                {regVerifiedMitra && (
                  <form onSubmit={handleCompleteRegistration} className="space-y-4 animate-fade-in">
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-emerald-900 font-extrabold text-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{isJa ? '提携先機関が正式に確認されました！' : 'Lembaga Mitra Terverifikasi Resmi!'}</span>
                      </div>
                      <div className="text-[11px] text-emerald-950 font-bold pl-7">
                        <div>{isJa ? '機関名: ' : 'Nama: '}{regVerifiedMitra.name}</div>
                        <div className="text-[10px] text-emerald-800 font-normal">
                          {isJa ? '区分: ' : 'Kategori: '}{regVerifiedMitra.mitraType || regVerifiedMitra.role} • ID: {regVerifiedMitra.id}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-mono mt-0.5">
                          Email: {regVerifiedMitra.email}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {isJa ? '担当者電話番号 / WhatsApp:' : 'Nomor WhatsApp PIC / Konfirmasi Kontak:'}
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="0812-3456-7890"
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {isJa ? '設定するパスワード:' : 'Konfirmasi Kata Sandi Akun Mitra:'}
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={regPass}
                            onChange={(e) => setRegPass(e.target.value)}
                            placeholder={isJa ? 'アカウントのパスワード' : 'Kata sandi akun mitra'}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {isJa ? '次回以降のログインに使用します。' : 'Kata sandi ini yang akan Anda gunakan untuk login selanjutnya.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRegVerifiedMitra(null);
                          setRegEmail('');
                        }}
                        className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
                      >
                        {isJa ? 'メール変更' : 'Ganti Email'}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isJa ? 'アカウント有効化してポータルへ' : 'Aktivasi Akun & Masuk ke Portal Mitra'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Portal Switcher Links */}
            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-[11px]">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer flex items-center justify-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>{isJa ? '生徒・候補生ポータル' : 'Portal Calon Siswa'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 font-medium transition cursor-pointer flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-600" />
                <span>{isJa ? 'IJEF 管理者ポータル' : 'Portal Admin IJEF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        portalType="MITRA"
      />
    </div>
  );
};
