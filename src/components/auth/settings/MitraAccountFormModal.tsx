import React, { useState, useEffect } from 'react';
import { AdminUser } from '../../../types';
import {
  X,
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  Lock,
  Save,
  Handshake,
  ShieldCheck
} from 'lucide-react';

interface MitraAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Partial<AdminUser>, isNew: boolean) => void;
  editingMitra: AdminUser | null;
}

export const MitraAccountFormModal: React.FC<MitraAccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMitra
}) => {
  const [namaLembaga, setNamaLembaga] = useState('');
  const [picName, setPicName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mitraType, setMitraType] = useState('Mitra LPK');
  const [wilayah, setWilayah] = useState('Jawa Barat');
  const [password, setPassword] = useState('MitraIJEF2026!');
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  useEffect(() => {
    if (editingMitra) {
      setNamaLembaga(editingMitra.name || '');
      setPicName(editingMitra.picName || editingMitra.name || '');
      setEmail(editingMitra.email || '');
      setPhone(editingMitra.phone || '');
      setMitraType(editingMitra.mitraType || editingMitra.role || 'Mitra LPK');
      setWilayah(editingMitra.department || editingMitra.kota || 'Jawa Barat');
      setPassword(editingMitra.passwordHint || editingMitra.password || '');
      setStatus(editingMitra.status === 'AKTIF' || editingMitra.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF');
    } else {
      setNamaLembaga('');
      setPicName('');
      setEmail('');
      setPhone('');
      setMitraType('Mitra LPK');
      setWilayah('Jawa Barat');
      setPassword('MitraIJEF2026!');
      setStatus('AKTIF');
    }
  }, [editingMitra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLembaga || !email) {
      alert('Nama Lembaga Mitra dan Email Login wajib diisi.');
      return;
    }

    const payload: Partial<AdminUser> = {
      ...(editingMitra ? { id: editingMitra.id } : {}),
      name: namaLembaga,
      picName: picName || namaLembaga,
      email: email.trim().toLowerCase(),
      phone: phone,
      role: 'Mitra LPK' as any,
      mitraType: mitraType,
      department: `Mitra Kumiai & TSK (${wilayah})`,
      kota: wilayah,
      portalAccess: 'MITRA_PORTAL',
      status: status,
      passwordHint: password || 'MitraIJEF2026!',
      password: password || 'MitraIJEF2026!',
      permissions: ['Katalog Lowongan Kerja', 'Nominasi Siswa Siap Matching', 'Pelacakan Interview Kumiai']
    };

    onSave(payload, !editingMitra);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-purple-800">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            <h4 className="font-bold text-sm">
              {editingMitra ? 'Edit Akun Lembaga Mitra' : 'Tambah Akun Mitra LPK / Kumiai Baru'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lembaga / Instansi / LPK Mitra
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={namaLembaga}
                onChange={(e) => setNamaLembaga(e.target.value)}
                placeholder="Contoh: LPK Mitra Mandiri Indonesia"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama PIC / Penanggung Jawab Mitra
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: Bpk. Agus Puriyanto"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email Kredensial Login Portal Mitra
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mitra.lpk@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP PIC</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Kemitraan</label>
              <select
                value={mitraType}
                onChange={(e) => setMitraType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Mitra LPK">Mitra LPK Daerah</option>
                <option value="Mitra Kumiai">Mitra Kumiai Jepang</option>
                <option value="TSK Partner">TSK Partner Jepang</option>
                <option value="Sending Org">Sending Organization (SO)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah / Lokasi</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value)}
                  placeholder="Jawa Barat / Tokyo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status Kemitraan</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="AKTIF">AKTIF (Diberi Akses)</option>
                <option value="NONAKTIF">NONAKTIF (Ditangguhkan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kata Sandi Akun Mitra
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 karakter (cth: MitraIJEF2026!)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Kata sandi ini dapat dilihat langsung oleh Admin Doc dan digunakan login di Portal Mitra.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingMitra ? 'Simpan Perubahan' : 'Buat Akun Mitra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
