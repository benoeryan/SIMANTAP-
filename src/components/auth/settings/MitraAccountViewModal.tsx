import React, { useState } from 'react';
import { AdminUser } from '../../../types';
import {
  X,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Briefcase,
  ShieldCheck,
  Edit3,
  RotateCcw,
  Handshake,
  MapPin,
  Users
} from 'lucide-react';

interface MitraAccountViewModalProps {
  mitra: AdminUser | null;
  onClose: () => void;
  onEdit: (mitra: AdminUser) => void;
  onResetPassword: (mitra: AdminUser) => void;
}

export const MitraAccountViewModal: React.FC<MitraAccountViewModalProps> = ({
  mitra,
  onClose,
  onEdit,
  onResetPassword
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!mitra) return null;

  const isAktif = mitra.status === 'AKTIF' || mitra.status === 'Aktif';

  // Password resolution for Admin 2 master visibility
  const resolvedPassword =
    mitra.password ||
    mitra.passwordHint ||
    'MitraIJEF2026!';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[92vh] min-h-0">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-black text-sm flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">{mitra.name}</h4>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                  MITRA RESMI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">ID: {mitra.id}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 min-h-0">
          {/* Card Kredensial & Password Mitra Khusus Admin 2 */}
          <div className="p-3.5 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-purple-950 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-700" />
                <span>Kredensial Akses & Kata Sandi Mitra (Otorisasi Admin Doc)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-200 text-purple-900 rounded">
                PORTAL MITRA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Email */}
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Email Login Mitra</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-900 font-semibold text-xs truncate mr-1">
                    {mitra.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mitra.email, 'email')}
                    className="p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded transition cursor-pointer shrink-0"
                    title="Salin Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Kata Sandi Akun</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-900 font-bold text-xs">
                    {showPassword ? resolvedPassword : '••••••••••••'}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded transition cursor-pointer"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(resolvedPassword, 'password')}
                      className="p-1 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded transition cursor-pointer"
                      title="Salin Kata Sandi"
                    >
                      {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {copiedField && (
              <div className="text-[11px] text-emerald-700 font-bold flex items-center space-x-1 animate-fade-in">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{copiedField === 'email' ? 'Email mitra' : 'Kata sandi'} berhasil disalin ke clipboard!</span>
              </div>
            )}
          </div>

          {/* Info Detail Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Nama Lembaga / Instansi</span>
              <span className="font-bold text-slate-900 text-xs">{mitra.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">PIC / Penanggung Jawab</span>
              <span className="font-bold text-slate-800 text-xs">{mitra.picName || mitra.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Kategori Kemitraan</span>
              <span className="font-bold text-slate-800 text-xs">{mitra.mitraType || mitra.role || 'Mitra LPK'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Departemen & Wilayah</span>
              <span className="font-bold text-slate-800 text-xs">{mitra.department || mitra.kota || 'Jepang / Indonesia'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">No. WhatsApp / HP PIC</span>
              <span className="font-mono text-slate-700 text-[11px]">{mitra.phone || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Status Kemitraan</span>
              <span
                className={`inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                <span>{isAktif ? 'AKTIF' : 'NONAKTIF'}</span>
              </span>
            </div>
          </div>

          {/* Otorisasi & Fitur Kemitraan */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Hak Akses Portal Kemitraan (MITRA_PORTAL)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 font-medium">Akses Katalog Lowongan Kerja Jepang</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 font-medium">Pengajuan Nominasi Siswa Siap Matching</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 font-medium">Monitoring Real-Time Interview Kumiai</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 font-medium">Sinkronisasi Siswa Binaan ke CV Portal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(mitra);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Akun Mitra</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetPassword(mitra);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
