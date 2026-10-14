import React, { useState } from 'react';
import { AdminUser } from '../../../types';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  Phone,
  Briefcase,
  Edit3,
  RotateCcw
} from 'lucide-react';

interface AdminAccountViewModalProps {
  account: AdminUser | null;
  onClose: () => void;
  onEdit: (account: AdminUser) => void;
  onResetPassword: (account: AdminUser) => void;
}

export const AdminAccountViewModal: React.FC<AdminAccountViewModalProps> = ({
  account,
  onClose,
  onEdit,
  onResetPassword
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!account) return null;

  const isSuper = account.isSuperAdmin || account.role === 'SuperAdmin';
  const isAktif = account.status === 'AKTIF' || account.status === 'Aktif';
  
  // Password resolution for Admin 2 master visibility
  const resolvedPassword =
    account.password ||
    account.passwordHint ||
    (isSuper ? 'AdminIJEF2026!' : account.portalAccess === 'MARKETING_PORTAL' ? 'MarketingIJEF2026!' : 'AdminIJEF2026!');

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
              {account.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">{account.name}</h4>
                {isSuper && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">ID: {account.id}</div>
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
          {/* Card Kredensial & Password Khusus Admin 2 */}
          <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-purple-950 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-700" />
                <span>Kredensial Akses & Kata Sandi (Otorisasi Penuh Admin Doc)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-purple-200 text-purple-900 rounded">
                TERVERIFIKASI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Email */}
              <div className="bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Email Login</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-900 font-semibold text-xs truncate mr-1">
                    {account.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(account.email, 'email')}
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
                <span>{copiedField === 'email' ? 'Email login' : 'Kata sandi'} berhasil disalin ke clipboard!</span>
              </div>
            )}
          </div>

          {/* Info Detail Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Jabatan & Role</span>
              <span className="font-bold text-slate-900 text-xs">{account.role}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Departemen / Divisi</span>
              <span className="font-bold text-slate-800 text-xs">{account.department || 'LPK IJEF CORP'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Lingkup Akses Portal</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                {account.portalAccess || 'ALL_PORTALS'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Status Akun</span>
              <span
                className={`inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                <span>{isAktif ? 'AKTIF' : 'NONAKTIF'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Sesi Terakhir</span>
              <span className="font-mono text-slate-700 text-[11px]">{account.lastLogin || 'Baru saja'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">No. Telepon / WhatsApp</span>
              <span className="font-mono text-slate-700 text-[11px]">{account.phone || '-'}</span>
            </div>
          </div>

          {/* Otorisasi & Hak Akses Badges */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Daftar Modul & Hak Akses Khusus
            </span>
            <div className="flex flex-wrap gap-1.5">
              {account.permissions && account.permissions.length > 0 ? (
                account.permissions.map((perm, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-medium border border-slate-200 flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>{perm}</span>
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-slate-500 italic">Hak akses standar administrator sistem.</span>
              )}
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
                onEdit(account);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Akun</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetPassword(account);
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
