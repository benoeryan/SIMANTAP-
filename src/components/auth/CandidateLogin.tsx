import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const CandidateLogin: React.FC = () => {
  const { loginWithEmail, registerSiswa, loginWithGoogle, setDemoSession } = useAuth();
  const { students, setSelectedStudentId } = useApp();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isRegister) {
      if (!displayName.trim()) {
        setErrorMsg('Nama lengkap wajib diisi');
        setLoading(false);
        return;
      }
      const res = await registerSiswa(email, password, displayName);
      if (res.success) {
        navigate('/portal-siswa');
      } else {
        setErrorMsg(res.error || 'Gagal mendaftarkan akun siswa baru.');
      }
    } else {
      const res = await loginWithEmail(email, password);
      if (res.success) {
        if (res.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          const student = students.find(
            (s) => s.email?.toLowerCase().trim() === email.toLowerCase().trim()
          );
          if (student) {
            setSelectedStudentId(student.id);
          }
          navigate('/portal-siswa');
        }
      } else {
        setErrorMsg(res.error || 'Email atau password salah.');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await loginWithGoogle();
    if (res.success) {
      if (res.approvalStatus === 'PENDING_DOC_APPROVAL' || res.error) {
        setErrorMsg(res.error || 'Pendaftaran berhasil via Google. Akun Anda sedang menunggu persetujuan dari Admin DOC LPK IJEF.');
        setLoading(false);
        return;
      }
      if (res.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/portal-siswa');
      }
    } else {
      setErrorMsg(res.error || 'Gagal masuk dengan Google.');
    }
    setLoading(false);
  };

  const handleDemoSiswa = (name: string, email: string) => {
    const student = students.find(
      (s) => s.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );
    if (student) {
      setSelectedStudentId(student.id);
    }
    setDemoSession('siswa', name, email);
    navigate('/portal-siswa');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center z-10">
        <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full mb-4 shadow-sm">
          <GraduationCap className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase">
            LPK IJEF CORP • PORTAL CANDIDATE
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isRegister ? 'Pendaftaran Akun Calon Siswa' : 'Login Portal Calon Siswa'}
        </h1>
        <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto">
          Sistem Informasi Manajemen Pelatihan & Magang Kerja Jepang (Tokutei Ginou / Ginou Jisshusei / Gijinkoku).
        </p>
      </div>

      {/* Login / Register Box */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-2xl sm:px-10 space-y-6">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 5 Demo Accounts One-Click Quick Login Buttons */}
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-950 font-extrabold">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pilih & Masuk Akun Demo Siswa (1-Click Login):</span>
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase font-bold">
                5 Kategori Siswa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {/* 1. SISWA IJEF - OFFLINE */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Bagas Pratama', 'siswa.offline@ijef.id')}
                className="p-2.5 bg-white hover:bg-amber-100/80 border border-amber-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-900 text-[11px] truncate">
                      Bagas Pratama
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-300">
                      SISWA IJEF
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    siswa.offline@ijef.id
                  </div>
                </div>
                <div className="text-[10px] text-amber-800 font-medium mt-1 pt-1 border-t border-amber-100/80 flex items-center justify-between">
                  <span>OFFLINE • Baru Masuk & Melengkapi Data Admin Siswa</span>
                  <ArrowRight className="w-3 h-3 text-amber-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              {/* 2. SISWA IJEF - ONLINE */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Anisa Rahma', 'siswa.online@ijef.id')}
                className="p-2.5 bg-white hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-[11px] truncate">
                      Anisa Rahma
                    </span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                      SISWA IJEF
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    siswa.online@ijef.id
                  </div>
                </div>
                <div className="text-[10px] text-emerald-800 font-medium mt-1 pt-1 border-t border-emerald-100/80 flex items-center justify-between">
                  <span>ONLINE • Baru Masuk Belajar Admin Siswa</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              {/* 3. SISWA NON IJEF - NEW COMER */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Rian Hidayat', 'newcomer@ijef.id')}
                className="p-2.5 bg-white hover:bg-purple-100/80 border border-purple-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-purple-900 text-[11px] truncate">
                      Rian Hidayat
                    </span>
                    <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-300">
                      NON IJEF
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    newcomer@ijef.id
                  </div>
                </div>
                <div className="text-[10px] text-purple-800 font-medium mt-1 pt-1 border-t border-purple-100/80 flex items-center justify-between">
                  <span>NEW COMER • Dalam Proses Nihongo Check Admin Doc</span>
                  <ArrowRight className="w-3 h-3 text-purple-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              {/* 4. SISWA MATCHING JOB - EX-MAGANG/EX-TRAINEE */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Titin Sumarni', 'exmagang@ijef.id')}
                className="p-2.5 bg-white hover:bg-blue-100/80 border border-blue-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 text-[11px] truncate">
                      Titin Sumarni
                    </span>
                    <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-300">
                      MATCHING JOB
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    exmagang@ijef.id
                  </div>
                </div>
                <div className="text-[10px] text-blue-800 font-medium mt-1 pt-1 border-t border-blue-100/80 flex items-center justify-between">
                  <span>EX-MAGANG • Dalam Proses Matching Job Admin Doc</span>
                  <ArrowRight className="w-3 h-3 text-blue-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              {/* 5. SISWA MATCHING JOB - ENGINEERING/GIJINKOKU */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Agus Setiawan, S.T.', 'engineering@ijef.id')}
                className="p-2.5 bg-white hover:bg-indigo-100/80 border border-indigo-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-900 text-[11px] truncate">
                      Agus Setiawan, S.T.
                    </span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-300">
                      MATCHING JOB
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    engineering@ijef.id
                  </div>
                </div>
                <div className="text-[10px] text-indigo-800 font-medium mt-1 pt-1 border-t border-indigo-100/80 flex items-center justify-between">
                  <span>ENGINEERING / GIJINKOKU • Interview Zoom</span>
                  <ArrowRight className="w-3 h-3 text-indigo-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>

              {/* 6. SISWA MITRA / NON IJEF */}
              <button
                type="button"
                onClick={() => handleDemoSiswa('Muhammad Danang Suryono', 'danang.suryono@gmail.com')}
                className="p-2.5 bg-white hover:bg-teal-100/80 border border-teal-300 rounded-xl text-left transition cursor-pointer shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-teal-950 text-[11px] truncate">
                      Danang Suryono
                    </span>
                    <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded border border-teal-300">
                      SISWA MITRA
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    danang.suryono@gmail.com
                  </div>
                </div>
                <div className="text-[10px] text-teal-800 font-medium mt-1 pt-1 border-t border-teal-100/80 flex items-center justify-between">
                  <span>SISWA MITRA / NON IJEF • Terdaftar oleh Mitra</span>
                  <ArrowRight className="w-3 h-3 text-teal-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            </div>
          </div>

          {/* Sample Credentials Table for Manual Email Login */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-amber-800 font-bold text-[11px] uppercase tracking-wide">
              <span className="flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Kredensial Manual Akun Demo (Pass: password123):</span>
              </span>
            </div>
            <div className="space-y-1 text-[10px] font-mono text-slate-700">
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-teal-200">
                <span>danang.suryono@gmail.com</span>
                <span className="text-teal-700 font-bold">SISWA MITRA / NON IJEF</span>
              </div>
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                <span>siswa.offline@ijef.id</span>
                <span className="text-amber-700 font-bold">SISWA IJEF - Offline</span>
              </div>
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                <span>siswa.online@ijef.id</span>
                <span className="text-emerald-700 font-bold">SISWA IJEF - Online</span>
              </div>
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                <span>newcomer@ijef.id</span>
                <span className="text-purple-700 font-bold">SISWA NON IJEF (New Comer)</span>
              </div>
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                <span>exmagang@ijef.id</span>
                <span className="text-blue-700 font-bold">MATCHING JOB (Ex-Magang)</span>
              </div>
              <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-200">
                <span>engineering@ijef.id</span>
                <span className="text-indigo-700 font-bold">MATCHING JOB (Engineering)</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Sesuai KTP
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required={isRegister}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Ahmad Fauzi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email Aktif
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siswa@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Kata Sandi (Password)
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 transition cursor-pointer hover:underline"
                  >
                    Lupa Kata Sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isRegister ? 'Daftar Akun Siswa Baru' : 'Masuk Portal Siswa'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-3 text-slate-500">Atau Gunakan</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Masuk dengan Email Google</span>
          </button>

          {/* Toggle Login/Register & Contact Admin Notice */}
          <div className="text-center pt-3 border-t border-slate-200 space-y-2">
            <p className="text-[11px] text-slate-600 font-medium">
              Belum memiliki akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg(null);
                }}
                className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
              >
                Daftar disini
              </button>{' '}
              atau{' '}
              <button
                type="button"
                onClick={() => {
                  window.open('https://wa.me/628122334455?text=Halo%20Admin%20DOC%20LPK%20IJEF,%20saya%20ingin%20mendaftarkan%20akun%20baru%20calon%20siswa%20di%20portal.', '_blank');
                }}
                className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                contact admin untuk didaftarkan
              </button>
            </p>

            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
            >
              {isRegister
                ? 'Sudah memiliki akun? Klik untuk Login'
                : 'Belum punya akun? Daftar Akun Calon Siswa Baru'}
            </button>
          </div>

          {/* Portal Switcher Links */}
          <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-[11px]">
            <button
              type="button"
              onClick={() => navigate('/mitra/login')}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-800 font-semibold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Akses Portal Mitra LPK</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Akses Portal Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        portalType="SISWA"
      />
    </div>
  );
};
