import React, { useState } from 'react';
import { AdminUser } from '../../../types';
import {
  Building2,
  Search,
  Filter,
  UserPlus,
  Edit3,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Mail,
  Phone,
  Handshake,
  UserCheck
} from 'lucide-react';

interface MitraListViewProps {
  mitraAccounts: AdminUser[];
  onOpenAddModal: () => void;
  onViewAccount: (mitra: AdminUser) => void;
  onEditAccount: (mitra: AdminUser) => void;
  onResetPassword: (mitra: AdminUser) => void;
  onToggleStatus: (mitraId: string) => void;
  onDeleteAccount: (mitraId: string, name: string) => void;
}

export const MitraListView: React.FC<MitraListViewProps> = ({
  mitraAccounts,
  onOpenAddModal,
  onViewAccount,
  onEditAccount,
  onResetPassword,
  onToggleStatus,
  onDeleteAccount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePasswordReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyPassword = (id: string, pass: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pass);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMitra = mitraAccounts.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.picName && m.picName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.department && m.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.kota && m.kota.toLowerCase().includes(searchTerm.toLowerCase()));

    if (categoryFilter === 'ALL') return matchesSearch;
    if (categoryFilter === 'LPK') return matchesSearch && (m.mitraType?.includes('LPK') || m.role?.includes('LPK'));
    if (categoryFilter === 'JAPAN') {
      return (
        matchesSearch &&
        (m.mitraType?.includes('Kumiai') ||
          m.mitraType?.includes('TSK') ||
          m.department?.includes('Jepang') ||
          m.department?.includes('Japan') ||
          m.department?.includes('Kumiai'))
      );
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls: Search & Category Filter & Add Account Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari lembaga, PIC, email, wilayah mitra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Mitra
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('LPK')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                categoryFilter === 'LPK'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              LPK Daerah
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('JAPAN')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                categoryFilter === 'JAPAN'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Kumiai & TSK Jepang
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Akun Mitra</span>
        </button>
      </div>

      {/* Standardized Mitra Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <th className="p-3 pl-4">Lembaga / PIC Mitra</th>
              <th className="p-3">Kategori & Wilayah</th>
              <th className="p-3">Kontak Login</th>
              <th className="p-3">Kata Sandi (Admin Doc)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center pr-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredMitra.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Tidak ada akun kemitraan yang cocok dengan pencarian filter.
                </td>
              </tr>
            ) : (
              filteredMitra.map((mitra) => {
                const isAktif = mitra.status === 'AKTIF' || mitra.status === 'Aktif';
                const resolvedPass =
                  mitra.password ||
                  mitra.passwordHint ||
                  'MitraIJEF2026!';
                const isRevealed = !!revealedPasswords[mitra.id];

                return (
                  <tr
                    key={mitra.id}
                    onClick={() => onViewAccount(mitra)}
                    className="hover:bg-purple-50/40 transition cursor-pointer"
                  >
                    <td className="p-3 pl-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full font-bold text-xs text-white bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-xs shrink-0">
                          {mitra.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                            <span>{mitra.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            PIC: {mitra.picName || mitra.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800 text-xs">
                        {mitra.mitraType || mitra.role || 'Mitra LPK'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {mitra.department || mitra.kota || 'Nasional / Jepang'}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-mono text-slate-800 text-xs flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{mitra.email}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>{mitra.phone || '-'}</span>
                      </div>
                    </td>

                    {/* Password column for Admin 2 */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                        <span className="font-mono font-bold text-[11px] text-purple-900">
                          {isRevealed ? resolvedPass : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => togglePasswordReveal(mitra.id, e)}
                          className="p-0.5 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                          title={isRevealed ? 'Sembunyikan' : 'Lihat Kata Sandi'}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPassword(mitra.id, resolvedPass, e)}
                          className="p-0.5 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                          title="Salin Kata Sandi"
                        >
                          {copiedId === mitra.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onToggleStatus(mitra.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 cursor-pointer transition ${
                          isAktif
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{isAktif ? 'AKTIF' : 'NONAKTIF'}</span>
                      </button>
                    </td>

                    <td className="p-3 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onViewAccount(mitra)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                          title="Lihat Detail Akun Mitra"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditAccount(mitra)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit Data Mitra"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onResetPassword(mitra)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Reset Kata Sandi Mitra"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteAccount(mitra.id, mitra.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Akun Mitra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend & Sync Notice */}
      <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Handshake className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Akun kemitraan disahkan oleh Admin Doc dan memiliki hak login langsung ke <code className="font-mono font-bold text-purple-950">PORTAL MITRA (Katalog & Nominasi)</code>.
          </span>
        </div>
        <span className="font-mono font-bold text-[10px] text-purple-700 shrink-0 ml-2">
          Total {filteredMitra.length} / {mitraAccounts.length} Mitra Terdaftar
        </span>
      </div>
    </div>
  );
};
