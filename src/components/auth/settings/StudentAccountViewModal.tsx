import React, { useState } from 'react';
import { CalonSiswa } from '../../../types';
import {
  X,
  GraduationCap,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Calendar,
  FileText,
  UserCheck,
  CheckCircle2,
  Edit3,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface StudentAccountViewModalProps {
  student: CalonSiswa | null;
  onClose: () => void;
  onEdit: (student: CalonSiswa) => void;
  onResetPassword: (student: CalonSiswa) => void;
}

export const StudentAccountViewModal: React.FC<StudentAccountViewModalProps> = ({
  student,
  onClose,
  onEdit,
  onResetPassword
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!student) return null;

  const isAccepted = student.statusPendaftaran === 'Diterima';
  const isVerified = student.statusPendaftaran === 'Terverifikasi';
  const isRejected = student.statusPendaftaran === 'Ditolak';

  // Password resolution for Admin 2 master visibility
  const resolvedPassword =
    student.password ||
    student.passwordHint ||
    'siswa2026!';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg my-auto overflow-hidden flex flex-col max-h-[92vh] min-h-0">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-emerald-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-black text-sm flex items-center justify-center">
              {student.namaLengkap ? student.namaLengkap.substring(0, 2).toUpperCase() : 'SW'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-white">{student.namaLengkap}</h4>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                  {student.kategoriKandidat || 'SSW Japan'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">ID: {student.id}</div>
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
          {/* Card Kredensial & Password Siswa Khusus Admin 2 */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Kredensial Akses & Kata Sandi Siswa (Otorisasi Admin Doc)</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                PORTAL SISWA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Email */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Email Login Siswa</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-900 font-semibold text-xs truncate mr-1">
                    {student.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(student.email, 'email')}
                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer shrink-0"
                    title="Salin Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Kata Sandi Akun</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-900 font-bold text-xs">
                    {showPassword ? resolvedPassword : '••••••••••••'}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                      title={showPassword ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(resolvedPassword, 'password')}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
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
                <span>{copiedField === 'email' ? 'Email siswa' : 'Kata sandi'} berhasil disalin ke clipboard!</span>
              </div>
            )}
          </div>

          {/* Info Detail Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Status Registrasi</span>
              <span
                className={`inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isAccepted
                    ? 'bg-emerald-100 text-emerald-800'
                    : isVerified
                    ? 'bg-blue-100 text-blue-800'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAccepted
                      ? 'bg-emerald-600'
                      : isVerified
                      ? 'bg-blue-600'
                      : isRejected
                      ? 'bg-rose-600'
                      : 'bg-amber-600'
                  }`}
                />
                <span>{student.statusPendaftaran}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Kategori Peminatan</span>
              <span className="font-bold text-slate-900 text-xs">{student.kategoriKandidat || 'Tokutei Ginou'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">NIK (No. KTP)</span>
              <span className="font-mono text-slate-800 text-[11px]">{student.noKtp || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">No. WhatsApp / Telepon</span>
              <span className="font-mono text-slate-800 text-[11px]">{student.noHp || student.whatsapp || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Jenis Kelamin</span>
              <span className="text-slate-800 text-xs">{student.jenisKelamin || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Tgl Registrasi</span>
              <span className="font-mono text-slate-700 text-[11px]">{student.createdAt || 'Baru'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Alamat Domisili</span>
              <span className="text-slate-800 text-xs">{student.alamatDomisili || student.alamatKtp || '-'}</span>
            </div>
          </div>

          {/* Dokumen & Kelengkapan */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">
              Status Berkas Pendaftaran & Sinkronisasi
            </span>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">KTP / NIK</span>
                <span className="text-emerald-700 font-bold">Valid</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">Ijazah Terakhir</span>
                <span className="text-emerald-700 font-bold">Terunggah</span>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="text-slate-600 font-medium">Sertifikat JFT/JLPT</span>
                <span className="text-blue-700 font-bold">Siap Matching</span>
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
                onEdit(student);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Data Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetPassword(student);
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
