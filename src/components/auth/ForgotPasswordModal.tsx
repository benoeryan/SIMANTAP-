import React, { useState } from 'react';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  HelpCircle,
  Building2,
  PhoneCall,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onViewTutorial?: () => void;
  portalType?: 'SISWA' | 'MITRA' | 'ADMIN';
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onViewTutorial,
  portalType = 'SISWA'
}) => {
  const { sendPasswordReset, resetStudentPasswordDirect } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [activeMode, setActiveMode] = useState<'EMAIL_LINK' | 'DIRECT_RESET'>('EMAIL_LINK');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email yang terdaftar.');
      setLoading(false);
      return;
    }

    const res = await sendPasswordReset(email.trim());
    if (res.success) {
      setSuccessMsg(res.message || `Tautan pemulihan kata sandi telah dikirim ke ${email}.`);
    } else {
      setErrorMsg(res.error || 'Gagal mengirim email reset kata sandi. Pastikan email valid.');
    }
    setLoading(false);
  };

  const handleDirectReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email akun Anda.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
      setLoading(false);
      return;
    }

    const res = await resetStudentPasswordDirect(email.trim(), newPassword);
    if (res.success) {
      setSuccessMsg(res.message || 'Kata sandi berhasil diperbarui!');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setErrorMsg(res.error || 'Gagal mereset kata sandi.');
    }
    setLoading(false);
  };

  const handleQuickEmailFill = (quickEmail: string) => {
    setEmail(quickEmail);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Pemulihan & Lupa Kata Sandi
                </h3>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase">
                  {portalType}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atur ulang kata sandi akun SIM LPK IJEF Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-slate-800">
          {/* Method Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveMode('EMAIL_LINK');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'EMAIL_LINK'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kirim Link via Email</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('DIRECT_RESET');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeMode === 'DIRECT_RESET'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reset Langsung (Instan)</span>
            </button>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Alert Success */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">{successMsg}</span>
                <p className="text-[11px] text-emerald-700">
                  {activeMode === 'EMAIL_LINK'
                    ? 'Buka email Anda dan klik tautan untuk menyelesaikan perubahan kata sandi, lalu coba login kembali.'
                    : 'Gunakan kata sandi baru Anda untuk login ke dalam portal.'}
                </p>
              </div>
            </div>
          )}

          {/* Form Mode 1: Kirim Link via Email */}
          {activeMode === 'EMAIL_LINK' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com / siswa@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sistem akan mengirimkan tautan pemulihan kata sandi resmi ke alamat email ini.
                </p>
              </div>

              {/* Quick Fill Demo Emails for Fast Testing */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Pilih Cepat Email Demo:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickEmailFill('siswa.offline@ijef.id')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    siswa.offline@ijef.id
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickEmailFill('siswa.online@ijef.id')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    siswa.online@ijef.id
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickEmailFill('siswa@gmail.com')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[10px] font-mono font-medium transition cursor-pointer"
                  >
                    siswa@gmail.com
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Mengirim Tautan...</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Kirim Tautan Reset Kata Sandi</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Mode 2: Reset Langsung (Direct Instant Reset) */}
          {activeMode === 'DIRECT_RESET' && (
            <form onSubmit={handleDirectReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com / siswa@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru (Minimal 6 Karakter)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Menyimpan Sandi Baru...</span>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Simpan & Perbarui Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Helpdesk / Admin 1 Contact Box */}
          <div className="pt-3 border-t border-slate-200">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs">
              <PhoneCall className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-900">
                  Email Tidak Aktif atau Lupa Email Terdaftar?
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Hubungi staf Admin Siswa SIM-SB LPK IJEF untuk verifikasi identitas fisik & permohonan reset kata sandi manual via menu <strong>Master Manajemen Akun Siswa</strong>.
                </p>
                {onViewTutorial && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewTutorial();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline pt-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Buka Panduan Tutorial Lengkap di Petunjuk Penggunaan &rarr;</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enkripsi Kredensial Standar Firebase Auth</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
