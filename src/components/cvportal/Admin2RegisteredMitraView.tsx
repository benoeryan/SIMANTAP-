import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { AdminUser, AdminRole } from '../../types';
import { INITIAL_MITRA_ORGANIZATIONS } from '../../data/seedData';
import { saveMitraOrganizationToFirestore, deleteMitraOrganizationFromFirestore } from '../../lib/firebase';
import { FirebaseSyncControlBar } from '../common/FirebaseSyncControlBar';
import {
  Building2,
  Search,
  Filter,
  UserPlus,
  Plus,
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
  UserCheck,
  MapPin,
  Sparkles,
  Users,
  ExternalLink,
  Lock,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  MessageSquare,
  Globe2,
  Briefcase,
  X,
  Save,
  HelpCircle
} from 'lucide-react';

interface RegisteredMitraViewProps {
  onNavigateToApproval?: () => void;
}

export const Admin2RegisteredMitraView: React.FC<RegisteredMitraViewProps> = ({
  onNavigateToApproval
}) => {
  const { masterSettings, updateMasterSettings, students, mitraSubmissions } = useApp();
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tMitra,
    bilingual
  } = useEcosystemTranslation('mitraPortal');
  const { user } = useAuth();

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [wilayahFilter, setWilayahFilter] = useState('ALL');
  const [tableLayoutMode, setTableLayoutMode] = useState<'standard' | 'auth'>('standard');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMitra, setEditingMitra] = useState<AdminUser | null>(null);
  const [viewingMitra, setViewingMitra] = useState<AdminUser | null>(null);
  const [resetPassMitra, setResetPassMitra] = useState<AdminUser | null>(null);
  const [newPassInput, setNewPassInput] = useState('MitraIJEF2026!');
  const [waInviteMitra, setWaInviteMitra] = useState<AdminUser | null>(null);

  // Password toggle map in table/cards
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    showToast('Teks berhasil disalin ke clipboard!', 'info');
  };

  const togglePasswordReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sync to localStorage for fast portal fallback
  const syncMitraStorage = (mitraList: AdminUser[]) => {
    try {
      const orgs = mitraList.map((m) => ({
        id: m.id,
        name: m.name,
        picName: m.picName || m.name,
        email: m.email,
        phone: m.phone || '-',
        category: m.mitraType || m.role || 'Mitra LPK',
        wilayah: m.department || m.kota || 'Jepang / Indonesia',
        status: m.status,
        passwordHint: m.passwordHint || m.password || 'MitraIJEF2026!'
      }));
      localStorage.setItem('ijef_mitra_organizations', JSON.stringify(orgs));
    } catch (e) {
      console.error('Failed to sync mitra organizations to localStorage:', e);
    }
  };

  // Extract all registered Mitra from masterSettings.adminUsers (deduplicated by id)
  const mitraAccounts = useMemo(() => {
    const rawList = masterSettings.adminUsers || [];
    const map = new Map<string, AdminUser>();
    rawList.forEach((acc) => {
      if (
        acc &&
        acc.id &&
        (acc.role === 'Mitra LPK' ||
         acc.portalAccess === 'MITRA_PORTAL' ||
         (typeof acc.id === 'string' && acc.id.startsWith('MTR')) ||
         (acc.mitraType && acc.mitraType.length > 0))
      ) {
        map.set(acc.id, acc);
      }
    });
    return Array.from(map.values());
  }, [masterSettings.adminUsers]);

  // Auto-recovery: if mitraAccounts is empty, auto-seed INITIAL_MITRA_ORGANIZATIONS
  useEffect(() => {
    if (mitraAccounts.length === 0) {
      const currentList = masterSettings.adminUsers || [];
      const userMap = new Map<string, AdminUser>(currentList.map((u) => [u.id, u]));
      INITIAL_MITRA_ORGANIZATIONS.forEach((m) => {
        if (!userMap.has(m.id)) {
          userMap.set(m.id, m);
        }
      });
      const updated = Array.from(userMap.values());
      updateMasterSettings({ adminUsers: updated });
      syncMitraStorage(updated.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    }
  }, [mitraAccounts.length, masterSettings.adminUsers, updateMasterSettings]);

  // Statistics
  const stats = useMemo(() => {
    const total = mitraAccounts.length;
    const active = mitraAccounts.filter((m) => m.status === 'AKTIF' || m.status === 'Aktif').length;
    const suspended = mitraAccounts.filter(
      (m) => m.status === 'NONAKTIF' || m.status === 'Nonaktif' || (m.status as string) === 'SUSPENDED'
    ).length;
    const lpkIndo = mitraAccounts.filter(
      (m) =>
        m.mitraType?.includes('LPK') ||
        m.mitraType?.includes('Pengirim') ||
        (!m.department?.includes('Jepang') && !m.department?.includes('Kumiai') && !m.department?.includes('TSK'))
    ).length;
    const japanOrg = mitraAccounts.filter(
      (m) =>
        m.mitraType?.includes('Kumiai') ||
        m.mitraType?.includes('TSK') ||
        m.department?.includes('Jepang') ||
        m.department?.includes('Kumiai') ||
        m.department?.includes('TSK')
    ).length;

    // Total nominated students from submissions and student database
    const totalSiswaBinaan = (mitraSubmissions || []).filter((s) => s.submissionType === 'REGISTRASI_SISWA').length;

    return { total, active, suspended, lpkIndo, japanOrg, totalSiswaBinaan };
  }, [mitraAccounts, mitraSubmissions]);

  // Filtered Mitra list
  const filteredMitra = useMemo(() => {
    return mitraAccounts.filter((m) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        (m.picName && m.picName.toLowerCase().includes(term)) ||
        m.email.toLowerCase().includes(term) ||
        (m.phone && m.phone.toLowerCase().includes(term)) ||
        (m.department && m.department.toLowerCase().includes(term)) ||
        (m.kota && m.kota.toLowerCase().includes(term)) ||
        (m.id && m.id.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Category filter
      if (categoryFilter === 'LPK') {
        const isLpk = m.mitraType?.includes('LPK') || m.mitraType?.includes('Pengirim') || (!m.department?.includes('Jepang') && !m.department?.includes('Kumiai') && !m.department?.includes('TSK'));
        if (!isLpk) return false;
      } else if (categoryFilter === 'KUMIAI') {
        const isKumiai = m.mitraType?.includes('Kumiai') || m.department?.includes('Kumiai');
        if (!isKumiai) return false;
      } else if (categoryFilter === 'TSK') {
        const isTsk = m.mitraType?.includes('TSK') || m.department?.includes('TSK');
        if (!isTsk) return false;
      } else if (categoryFilter === 'KAMPUS') {
        const isKampus = m.mitraType?.includes('SMK') || m.mitraType?.includes('Kampus') || m.mitraType?.includes('Universitas');
        if (!isKampus) return false;
      }

      // Status filter
      if (statusFilter === 'AKTIF') {
        if (m.status !== 'AKTIF' && m.status !== 'Aktif') return false;
      } else if (statusFilter === 'NONAKTIF') {
        if (m.status === 'AKTIF' || m.status === 'Aktif') return false;
      }

      return true;
    });
  }, [mitraAccounts, searchTerm, categoryFilter, statusFilter]);

  // Handle Save / Add Mitra
  const handleSaveMitra = (accountData: Partial<AdminUser>, isNew: boolean) => {
    const currentList = masterSettings.adminUsers || [];
    let updatedList: AdminUser[];

    if (isNew) {
      const newId = `MTR-${String(mitraAccounts.length + 1).padStart(2, '0')}`;
      const newMitra: AdminUser = {
        id: newId,
        name: accountData.name || 'Mitra Baru',
        picName: accountData.picName || accountData.name || 'PIC Mitra',
        email: (accountData.email || '').trim().toLowerCase(),
        phone: accountData.phone || '',
        role: 'Mitra LPK',
        mitraType: accountData.mitraType || 'LPK Pengirim Daerah (SO)',
        department: accountData.department || `Mitra Kumiai & TSK (${accountData.kota || 'Indonesia'})`,
        kota: accountData.kota || 'Jawa Barat',
        address: accountData.address || '',
        portalAccess: 'MITRA_PORTAL',
        status: accountData.status || 'AKTIF',
        lastLogin: 'Belum pernah login',
        passwordHint: accountData.password || accountData.passwordHint || 'MitraIJEF2026!',
        password: accountData.password || accountData.passwordHint || 'MitraIJEF2026!',
        createdAt: new Date().toISOString().split('T')[0],
        kuotaSiswa: accountData.kuotaSiswa || 50,
        totalSiswaBinaan: 0,
        permissions: [
          'Katalog Lowongan Kerja',
          'Nominasi Siswa Siap Matching',
          'Pelacakan Interview Kumiai',
          'Input Registrasi Siswa Mitra'
        ]
      };
      updatedList = [...currentList, newMitra];
      saveMitraOrganizationToFirestore(newMitra).catch(console.error);
      showToast(`Lembaga Mitra "${newMitra.name}" (${newMitra.email}) berhasil didaftarkan resmi!`, 'success');
    } else {
      let editedItem: AdminUser | null = null;
      updatedList = currentList.map((item) => {
        if (item.id === accountData.id) {
          editedItem = {
            ...item,
            ...accountData,
            email: (accountData.email || item.email).trim().toLowerCase(),
            passwordHint: accountData.password || item.passwordHint,
            password: accountData.password || item.password
          };
          return editedItem;
        }
        return item;
      });
      if (editedItem) {
        saveMitraOrganizationToFirestore(editedItem).catch(console.error);
      }
      showToast(`Data Akun Mitra "${accountData.name}" berhasil diperbarui.`, 'success');
    }

    updateMasterSettings({ adminUsers: updatedList });
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    setShowAddModal(false);
    setEditingMitra(null);
  };

  // Toggle Status
  const handleToggleStatus = (mitraId: string) => {
    const currentList = masterSettings.adminUsers || [];
    const target = currentList.find((m) => m.id === mitraId);
    if (!target) return;

    const newStatus = target.status === 'AKTIF' || target.status === 'Aktif' ? 'NONAKTIF' : 'AKTIF';
    const updatedTarget = { ...target, status: newStatus as any };
    const updatedList = currentList.map((item) =>
      item.id === mitraId ? updatedTarget : item
    );

    updateMasterSettings({ adminUsers: updatedList });
    saveMitraOrganizationToFirestore(updatedTarget).catch(console.error);
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    showToast(
      `Status kemitraan "${target.name}" diubah menjadi ${newStatus === 'AKTIF' ? 'AKTIF (Diizinkan Login)' : 'DITANGGUHKAN'}.`,
      newStatus === 'AKTIF' ? 'success' : 'info'
    );
  };

  // Delete Mitra
  const handleDeleteMitra = (mitraId: string, name: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin MENGHAPUS / MEMBATALKAN pendaftaran Lembaga Mitra "${name}"?\n\nPerhatian: Email mitra ini tidak akan dapat mendaftar atau login lagi di Portal Mitra.`
      )
    ) {
      return;
    }

    const currentList = masterSettings.adminUsers || [];
    const updatedList = currentList.filter((item) => item.id !== mitraId);

    updateMasterSettings({ adminUsers: updatedList });
    deleteMitraOrganizationFromFirestore(mitraId).catch(console.error);
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    showToast(`Lembaga Mitra "${name}" telah dihapus dari daftar resmi.`, 'info');
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassMitra) return;

    const currentList = masterSettings.adminUsers || [];
    let updatedMitraObj: AdminUser | null = null;
    const updatedList = currentList.map((item) => {
      if (item.id === resetPassMitra.id) {
        updatedMitraObj = {
          ...item,
          passwordHint: newPassInput || 'MitraIJEF2026!',
          password: newPassInput || 'MitraIJEF2026!'
        };
        return updatedMitraObj;
      }
      return item;
    });

    updateMasterSettings({ adminUsers: updatedList });
    if (updatedMitraObj) {
      saveMitraOrganizationToFirestore(updatedMitraObj).catch(console.error);
    }
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    showToast(`Kata sandi akun mitra "${resetPassMitra.name}" telah diubah ke "${newPassInput}".`, 'success');
    setResetPassMitra(null);
    setNewPassInput('');
  };

  // Generate WhatsApp Invitation message
  const getWhatsAppInvitationText = (m: AdminUser) => {
    const pass = m.passwordHint || m.password || 'MitraIJEF2026!';
    return `Yth. Bpk/Ibu ${m.picName || 'Pimpinan'} (${m.name}),\n\nLembaga Anda telah resmi DIDAFTARKAN & DIOTORISASI sebagai Mitra Resmi di Portal Kemitraan LPK IJEF CORP.\n\nBerikut kredensial akses pendaftaran & login Portal Mitra:\n🌐 URL Portal Mitra: https://ijefcorp.com/mitra/login\n📧 Email Terdaftar: ${m.email}\n🔑 Kata Sandi Sementara: ${pass}\n🏛️ ID Mitra: ${m.id}\n\nSilakan masuk atau lakukan aktivasi di portal mitra untuk mendaftarkan siswa binaan, mengajukan kandidat ke lowongan kerja Jepang (SSW/Kaigo/Teknik), dan memantau status interview secara realtime.\n\nSalam hangat,\nAdmin Doc - Back-Office LPK IJEF CORP`;
  };

  // Restore / Re-sync Default Mitra Organizations
  const handleRestoreDefaultMitra = () => {
    const currentList = masterSettings.adminUsers || [];
    const userMap = new Map<string, AdminUser>(currentList.map((u) => [u.id, u]));
    INITIAL_MITRA_ORGANIZATIONS.forEach((m) => {
      userMap.set(m.id, m);
    });
    const updated = Array.from(userMap.values());
    updateMasterSettings({ adminUsers: updated });
    syncMitraStorage(updated.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
    for (const m of INITIAL_MITRA_ORGANIZATIONS) {
      saveMitraOrganizationToFirestore(m).catch(console.error);
    }
    showToast(`13 Mitra Organisasi Bawaan berhasil disinkronkan & dipulihkan!`, 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID Mitra', 'Nama Lembaga', 'Email Resmi', 'Nama PIC', 'Nomor WA/HP', 'Kategori', 'Wilayah', 'Status', 'Kata Sandi Awal', 'Tanggal Daftar'];
    const rows = mitraAccounts.map((m) => [
      `"${m.id}"`,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email}"`,
      `"${(m.picName || m.name).replace(/"/g, '""')}"`,
      `"${m.phone || '-'}"`,
      `"${(m.mitraType || m.role || 'Mitra LPK').replace(/"/g, '""')}"`,
      `"${(m.department || m.kota || '-').replace(/"/g, '""')}"`,
      `"${m.status}"`,
      `"${m.passwordHint || m.password || 'MitraIJEF2026!'}"`,
      `"${m.createdAt || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Mitra_Terdaftar_IJEF_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('File CSV direktori mitra berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 text-white border text-xs font-bold animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 border-emerald-500 text-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-500 text-rose-300'
              : 'bg-slate-900 border-purple-500 text-purple-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER SECTION: DAFTAR MITRA TERDAFTAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-7 rounded-3xl border border-purple-800/40 shadow-xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 border border-purple-400/30 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-purple-200">
              <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{lang === 'ja' ? '戦略的提携機関認証モジュール • ADMIN 2' : 'MODUL OTORISASI MITRA STRATEGIS • ADMIN 2'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{lang === 'ja' ? '登録提携機関一覧 & メール認証管理' : 'Daftar Mitra Terdaftar & Otorisasi Email'}</span>
              <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-xl font-mono font-bold">
                {stats.total} {lang === 'ja' ? '機関' : 'Mitra'}
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed">
              {lang === 'ja' ? (
                <><strong>Admin Doc IJEF CORP</strong>によって承認されたすべての提携機関（インドネシア地方送り出しLPK、監理団体・組合、日本登録支援機関TSK、高校・大学）を管理します。<span className="text-amber-300 font-bold">ここで登録されたメールアドレスは提携機関ポータルのログイン・アカウント有効化の認証キーとなります。</span></>
              ) : (
                <>Kelola seluruh lembaga mitra yang telah disahkan oleh <strong>Admin Doc IJEF CORP</strong> (LPK Pengirim Daerah, Kumiai, TSK Jepang, SMK & Kampus).{' '}<span className="text-amber-300 font-bold">Email yang didaftarkan di sini adalah kunci otorisasi wajib saat Mitra melakukan pendaftaran akun / login di Portal Mitra.</span></>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingMitra(null);
                setShowAddModal(true);
              }}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-950/40 transition flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{lang === 'ja' ? '+ 新規提携機関を登録' : '+ Daftarkan Mitra Baru'}</span>
            </button>

            <button
              type="button"
              onClick={handleRestoreDefaultMitra}
              className="px-3.5 py-3 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-bold rounded-2xl text-xs border border-indigo-700/50 transition flex items-center space-x-1.5 cursor-pointer"
              title={lang === 'ja' ? '公式初期13提携機関を復元・同期' : 'Pulihkan & Sinkronkan 13 Lembaga Mitra Bawaan Resmi'}
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ja' ? '標準13機関を復元' : 'Pulihkan 13 Mitra Bawaan'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs border border-white/20 transition flex items-center space-x-1.5 cursor-pointer"
              title={lang === 'ja' ? '提携機関一覧エクスポート (CSV)' : 'Ekspor Direktori Mitra (CSV)'}
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'ja' ? 'CSV出力' : 'Ekspor CSV'}</span>
            </button>

            {onNavigateToApproval && (
              <button
                type="button"
                onClick={onNavigateToApproval}
                className="px-3.5 py-3 bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-bold rounded-2xl text-xs border border-purple-700/50 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ja' ? '提携申請承認管理' : 'Approval Pengajuan Mitra'}</span>
              </button>
            )}
          </div>
        </div>

        {/* METRIC PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-200/80">{lang === 'ja' ? '登録提携機関総数' : 'Total Mitra Terdaftar'}</div>
            <div className="text-xl font-black mt-1 text-white">{stats.total}</div>
            <div className="text-[10px] text-purple-300/80 font-semibold mt-0.5">{lang === 'ja' ? '公式ホワイトリスト' : 'Whitelist Resmi'}</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-emerald-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">{lang === 'ja' ? '有効・認証済機関' : 'Mitra Aktif / Verified'}</div>
            <div className="text-xl font-black mt-1 text-emerald-300">{stats.active}</div>
            <div className="text-[10px] text-emerald-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'ログイン＆マッチング可' : 'Siap Login & Matching'}</div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-blue-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-200">{lang === 'ja' ? '地方送り出し機関 (LPK)' : 'LPK Pengirim Daerah'}</div>
            <div className="text-xl font-black mt-1 text-blue-300">{stats.lpkIndo}</div>
            <div className="text-[10px] text-blue-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'インドネシア送出機関' : 'Sending Org (Indonesia)'}</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-amber-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-200">{lang === 'ja' ? '組合・TSK（日本）' : 'Kumiai & TSK Jepang'}</div>
            <div className="text-xl font-black mt-1 text-amber-300">{stats.japanOrg}</div>
            <div className="text-[10px] text-amber-200/80 font-semibold mt-0.5">{lang === 'ja' ? '受入監理団体・支援機関' : 'Asosiasi & Penerima'}</div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-purple-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-200">{lang === 'ja' ? '提携機関登録生徒数' : 'Siswa Terdaftar Mitra'}</div>
            <div className="text-xl font-black mt-1 text-purple-300">{stats.totalSiswaBinaan}</div>
            <div className="text-[10px] text-purple-200/80 font-semibold mt-0.5">{lang === 'ja' ? '連携育成生徒' : 'Binaan Terhubung'}</div>
          </div>

          <div className="bg-rose-500/10 backdrop-blur-sm rounded-2xl p-3.5 border border-rose-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-rose-200">{lang === 'ja' ? '停止中機関' : 'Mitra Ditangguhkan'}</div>
            <div className="text-xl font-black mt-1 text-rose-300">{stats.suspended}</div>
            <div className="text-[10px] text-rose-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'アクセス凍結' : 'Akses Dibekukan'}</div>
          </div>
        </div>

        {/* Real-time Firebase Sync Bar for Mitra */}
        <div className="mt-4 pt-4 border-t border-purple-800/40">
          <FirebaseSyncControlBar domain="mitra" variant="compact" />
        </div>
      </div>

      {/* HOW IT WORKS INFO CALLOUT */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-amber-950">
              Alur Pendaftaran & Otorisasi Lembaga Mitra (Admin Doc ➔ Portal Mitra):
            </h4>
            <ol className="mt-1 text-xs text-amber-900/90 list-decimal list-inside space-y-1 font-medium">
              <li>
                <strong>Admin Doc mendaftarkan email & profil lembaga mitra</strong> melalui tombol <em>"+ Daftarkan Mitra Baru"</em> di atas.
              </li>
              <li>
                Admin Doc membagikan <strong>Email Resmi</strong> dan <strong>Kata Sandi Sementara</strong> ke PIC Mitra melalui WhatsApp (tombol kirim undangan WA tersedia).
              </li>
              <li>
                Mitra membuka <strong>Portal Mitra</strong> (<code className="bg-amber-200/70 px-1 py-0.5 rounded font-mono font-bold">/mitra/login</code> atau <code className="bg-amber-200/70 px-1 py-0.5 rounded font-mono font-bold">/portal-mitra</code>) dan memasukkan email yang telah didaftarkan untuk login / aktivasi.
              </li>
              <li>
                Sistem secara otomatis memvalidasi email terhadap database Admin Doc dan memberikan akses ke Dashboard Kemitraan resmi IJEF Corp.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'ja' ? '提携機関名、担当者、ログインメール、所在地、電話番号、IDで検索...' : 'Cari nama lembaga mitra, PIC, email login, wilayah kota, nomor WA, atau ID...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Filter className="w-3.5 h-3.5" /> {lang === 'ja' ? '区分:' : 'Filter:'}
            </span>

            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lang === 'ja' ? `すべて (${mitraAccounts.length})` : `Semua (${mitraAccounts.length})`}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('LPK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'LPK'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              {lang === 'ja' ? '送出機関 (LPK)' : 'LPK Pengirim'}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('KUMIAI')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'KUMIAI'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {lang === 'ja' ? '監理団体 (組合)' : 'Kumiai Jepang'}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('TSK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'TSK'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {lang === 'ja' ? '登録支援機関 (TSK)' : 'TSK Penerima'}
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('KAMPUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === 'KAMPUS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {lang === 'ja' ? '高校・大学' : 'SMK / Kampus'}
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">{lang === 'ja' ? '状態: すべて' : 'Status: Semua'}</option>
              <option value="AKTIF">{lang === 'ja' ? '状態: 有効・認証済' : 'Status: Aktif & Diizinkan'}</option>
              <option value="NONAKTIF">{lang === 'ja' ? '状態: 停止中' : 'Status: Ditangguhkan'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* MITRA LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Bar matching Screenshot */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-700" />
              <h3 className="text-base font-extrabold text-slate-900">
                {lang === 'ja' ? '登録提携機関台帳' : 'Daftar Mitra Terdaftar'}
              </h3>
              <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                {filteredMitra.length} {lang === 'ja' ? '機関' : 'Mitra'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'ja'
                ? '候補者登録フォーム選択用および提携機関ポータル認証用の機関名台帳を管理'
                : 'Kelola daftar nama mitra untuk pilihan di form kandidat & otorisasi portal mitra'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setTableLayoutMode('standard')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  tableLayoutMode === 'standard'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ja' ? '標準形式 (4列)' : 'Format Form (4 Kolom)'}
              </button>
              <button
                type="button"
                onClick={() => setTableLayoutMode('auth')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  tableLayoutMode === 'auth'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ja' ? '認証管理形式 (7列)' : 'Format Otorisasi (7 Kolom)'}
              </button>
            </div>

            {/* + Tambah Mitra Button */}
            <button
              type="button"
              onClick={() => {
                setEditingMitra(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ja' ? '+ 機関追加' : '+ Tambah Mitra'}</span>
            </button>
          </div>
        </div>

        {filteredMitra.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center border border-purple-200">
              <Building2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">{lang === 'ja' ? '提携機関が見つかりません' : 'Tidak Ditemukan Lembaga Mitra'}</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lang === 'ja'
                ? '検索条件に一致する機関データがありません。「+ 機関追加」ボタンから新規提携機関を登録してください。'
                : 'Tidak ada data mitra yang sesuai dengan pencarian atau filter Anda. Silakan klik tombol "+ Tambah Mitra" untuk menambahkan lembaga baru.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {lang === 'ja' ? '検索条件をリセット' : 'Reset Filter Pencarian'}
            </button>
          </div>
        ) : tableLayoutMode === 'standard' ? (
          /* ========================================================================= */
          /* FORMAT 1: STANDAR FORM KANDIDAT (4 KOLOM PERSIS SCREENSHOT USER)          */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0f172a] text-white">
                <tr className="text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-5 text-slate-200 w-1/4">{lang === 'ja' ? '提携機関名' : 'NAMA MITRA'}</th>
                  <th className="py-3.5 px-5 text-slate-200 w-1/4">{lang === 'ja' ? '担当者・連絡先' : 'KONTAK / PERSON'}</th>
                  <th className="py-3.5 px-5 text-slate-200 w-2/5">{lang === 'ja' ? '所在地・住所' : 'ALAMAT / LOKASI'}</th>
                  <th className="py-3.5 px-5 text-slate-200 text-right w-24">{lang === 'ja' ? '操作' : 'AKSI'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMitra.map((mitra) => {
                  return (
                    <tr
                      key={mitra.id}
                      onClick={() => setViewingMitra(mitra)}
                      className="hover:bg-blue-50/30 transition cursor-pointer group"
                    >
                      {/* KOLOM 1: NAMA MITRA */}
                      <td className="py-4 px-5 align-top">
                        <div className="font-black text-slate-900 uppercase text-xs sm:text-sm tracking-wide group-hover:text-blue-900">
                          {mitra.name}
                        </div>
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          {mitra.email}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            {mitra.id}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                            {mitra.mitraType || 'LPK Daerah'}
                          </span>
                        </div>
                      </td>

                      {/* KOLOM 2: KONTAK / PERSON */}
                      <td className="py-4 px-5 align-top">
                        <div className="font-black text-slate-900 uppercase text-xs">
                          {mitra.picName || mitra.name}
                        </div>
                        {mitra.phone && (
                          <div className="text-xs text-slate-600 mt-1">
                            Telp: <span className="font-medium text-slate-800">{mitra.phone}</span>
                          </div>
                        )}
                        {mitra.phone && mitra.phone !== '-' && (
                          <div className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                            <span>WA:</span>
                            <a
                              href={`https://wa.me/${mitra.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline flex items-center gap-0.5"
                            >
                              <span>{mitra.phone}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </td>

                      {/* KOLOM 3: ALAMAT / LOKASI */}
                      <td className="py-4 px-5 align-top">
                        <div className="text-xs text-slate-700 leading-relaxed font-normal">
                          {mitra.address || mitra.kota || mitra.department || '-'}
                        </div>
                      </td>

                      {/* KOLOM 4: AKSI */}
                      <td className="py-4 px-5 align-top text-right">
                        <div
                          className="flex items-center justify-end space-x-3 text-xs font-bold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setEditingMitra(mitra)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {lang === 'ja' ? '編集' : 'Edit'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMitra(mitra.id, mitra.name)}
                            className="text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                          >
                            {lang === 'ja' ? '削除' : 'Hapus'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingMitra(mitra)}
                            className="text-purple-600 hover:text-purple-800 hover:underline text-[11px] cursor-pointer"
                          >
                            {lang === 'ja' ? '詳細' : 'Detail'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* FORMAT 2: OTORISASI LENGKAP PORTAL (7 KOLOM + KEAMANAN & SANDI)           */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">{lang === 'ja' ? '提携機関＆ID' : 'Lembaga Mitra & ID'}</th>
                  <th className="py-3.5 px-4">{lang === 'ja' ? '公式メール（ログインキー）' : 'Email Resmi (Kunci Login)'}</th>
                  <th className="py-3.5 px-4">{lang === 'ja' ? '担当者＆連絡先' : 'PIC & WhatsApp'}</th>
                  <th className="py-3.5 px-4">{lang === 'ja' ? '区分＆所在地' : 'Kategori & Wilayah'}</th>
                  <th className="py-3.5 px-4">{lang === 'ja' ? '初期パスワード' : 'Kata Sandi Awal'}</th>
                  <th className="py-3.5 px-4 text-center">{lang === 'ja' ? '認証ステータス' : 'Status Otorisasi'}</th>
                  <th className="py-3.5 px-4 text-right">{lang === 'ja' ? '管理操作' : 'Aksi Kelola'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMitra.map((mitra) => {
                  const isAktif = mitra.status === 'AKTIF' || mitra.status === 'Aktif';
                  const password = mitra.passwordHint || mitra.password || 'MitraIJEF2026!';
                  const isRevealed = revealedPasswords[mitra.id];

                  return (
                    <tr
                      key={mitra.id}
                      onClick={() => setViewingMitra(mitra)}
                      className="hover:bg-purple-50/40 transition cursor-pointer group"
                    >
                      {/* Nama Lembaga & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              mitra.mitraType?.includes('Kumiai') || mitra.department?.includes('Kumiai')
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : mitra.mitraType?.includes('TSK') || mitra.department?.includes('TSK')
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-purple-100 text-purple-800 border-purple-300'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 group-hover:text-purple-950 flex items-center gap-1.5">
                              <span>{mitra.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">{mitra.id}</span>
                              {mitra.createdAt && <span>• Tgl: {mitra.createdAt}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email Resmi Mitra */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <div className="font-mono text-purple-950 font-bold bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg text-[11px] inline-flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{mitra.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(mitra.email, `email-${mitra.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-700 rounded transition cursor-pointer"
                            title="Salin Email Resmi"
                          >
                            {copiedField === `email-${mitra.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                          ✓ Terotorisasi untuk Portal Mitra
                        </span>
                      </td>

                      {/* PIC & WhatsApp */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{mitra.picName || mitra.name}</div>
                        {mitra.phone ? (
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <a
                              href={`https://wa.me/${mitra.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-700 hover:text-emerald-800 font-medium hover:underline flex items-center gap-0.5"
                            >
                              <span>{mitra.phone}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum ada kontak WA</span>
                        )}
                      </td>

                      {/* Kategori & Wilayah */}
                      <td className="py-3.5 px-4">
                        <div className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 mb-0.5">
                          {mitra.mitraType || 'LPK Pengirim (SO)'}
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{mitra.kota || mitra.department || 'Indonesia / Jepang'}</span>
                        </div>
                      </td>

                      {/* Kata Sandi Awal */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1">
                          <div className="bg-slate-50 border border-slate-200 px-2 py-1 rounded font-mono text-[11px] text-slate-800">
                            {isRevealed ? password : '••••••••••'}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => togglePasswordReveal(mitra.id, e)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            title={isRevealed ? 'Sembunyikan' : 'Tampilkan Kata Sandi'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(password, `pass-${mitra.id}`);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-700 rounded transition cursor-pointer"
                            title="Salin Kata Sandi"
                          >
                            {copiedField === `pass-${mitra.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status Otorisasi */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isAktif
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-600' : 'bg-rose-600'}`}
                          />
                          <span>{isAktif ? 'Aktif (Terotorisasi)' : 'Ditangguhkan'}</span>
                        </span>
                      </td>

                      {/* Aksi Kelola */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Tombol Kirim Undangan WA */}
                          <button
                            type="button"
                            onClick={() => setWaInviteMitra(mitra)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                            title="Kirim / Salin Undangan Pendaftaran WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Reset Password */}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPassMitra(mitra);
                              setNewPassInput('MitraIJEF2026!');
                            }}
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition cursor-pointer"
                            title="Ubah / Reset Kata Sandi"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => setEditingMitra(mitra)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer"
                            title="Edit Data Lembaga Mitra"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(mitra.id)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isAktif
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={isAktif ? 'Tangguhkan Kemitraan' : 'Aktifkan Kemitraan'}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMitra(mitra.id, mitra.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition cursor-pointer"
                            title="Hapus Lembaga Mitra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: TAMBAH / EDIT MITRA TERDAFTAR */}
      {/* ============================================================ */}
      {(showAddModal || editingMitra) && (
        <MitraRegistrationFormModal
          isOpen={showAddModal || !!editingMitra}
          onClose={() => {
            setShowAddModal(false);
            setEditingMitra(null);
          }}
          onSave={handleSaveMitra}
          editingMitra={editingMitra}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: DETAIL PROFIL MITRA & SISWA BINAAN */}
      {/* ============================================================ */}
      {viewingMitra && (
        <MitraDetailViewModal
          mitra={viewingMitra}
          onClose={() => setViewingMitra(null)}
          onEdit={(m) => {
            setViewingMitra(null);
            setEditingMitra(m);
          }}
          onResetPassword={(m) => {
            setViewingMitra(null);
            setResetPassMitra(m);
            setNewPassInput('MitraIJEF2026!');
          }}
          onSendInvite={(m) => {
            setViewingMitra(null);
            setWaInviteMitra(m);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3: RESET PASSWORD MITRA */}
      {/* ============================================================ */}
      {resetPassMitra && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-purple-800">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-purple-400" />
                <h4 className="font-bold text-sm">Reset Kata Sandi Mitra</h4>
              </div>
              <button
                type="button"
                onClick={() => setResetPassMitra(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Atur kata sandi akses baru untuk lembaga mitra <strong className="text-slate-900">{resetPassMitra.name}</strong> ({resetPassMitra.email}):
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="MitraIJEF2026!"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPassMitra(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kata Sandi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: KIRIM / SALIN FORMAT UNDANGAN WHATSAPP KE PIC MITRA */}
      {/* ============================================================ */}
      {waInviteMitra && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-300" />
                <div>
                  <h4 className="font-bold text-sm">Undangan Pendaftaran Portal Mitra WhatsApp</h4>
                  <p className="text-[10px] text-emerald-200">Kirim instruksi resmi ke PIC {waInviteMitra.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaInviteMitra(null)}
                className="p-1 text-emerald-200 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-950">
                <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Email Mitra Ini Telah Terdaftar & Diotorisasi:</span>
                </div>
                <div className="font-mono text-xs font-black">{waInviteMitra.email}</div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  PIC: {waInviteMitra.picName || waInviteMitra.name} ({waInviteMitra.phone || 'Nomor WA belum diisi'})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Preview Pesan WhatsApp (Siap Kirim):
                </label>
                <textarea
                  readOnly
                  rows={8}
                  value={getWhatsAppInvitationText(waInviteMitra)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-mono text-slate-800 focus:outline-none select-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(getWhatsAppInvitationText(waInviteMitra), 'wa-invite')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedField === 'wa-invite' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Salin Pesan WA</span>
                    </>
                  )}
                </button>

                {waInviteMitra.phone && (
                  <a
                    href={`https://wa.me/${waInviteMitra.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      getWhatsAppInvitationText(waInviteMitra)
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Buka WhatsApp & Kirim</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: MITRA REGISTRATION FORM MODAL (Add & Edit)
// =========================================================================
interface MitraRegistrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Partial<AdminUser>, isNew: boolean) => void;
  editingMitra: AdminUser | null;
}

const MitraRegistrationFormModal: React.FC<MitraRegistrationFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMitra
}) => {
  const [namaLembaga, setNamaLembaga] = useState('');
  const [picName, setPicName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mitraType, setMitraType] = useState('LPK Pengirim Daerah (SO)');
  const [wilayah, setWilayah] = useState('Jawa Tengah - Semarang');
  const [address, setAddress] = useState('');
  const [kuotaSiswa, setKuotaSiswa] = useState<number>(50);
  const [password, setPassword] = useState('MitraIJEF2026!');
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');

  React.useEffect(() => {
    if (editingMitra) {
      setNamaLembaga(editingMitra.name || '');
      setPicName(editingMitra.picName || editingMitra.name || '');
      setEmail(editingMitra.email || '');
      setPhone(editingMitra.phone || '');
      setMitraType(editingMitra.mitraType || editingMitra.role || 'LPK Pengirim Daerah (SO)');
      setWilayah(editingMitra.kota || editingMitra.department || 'Jawa Tengah - Semarang');
      setAddress(editingMitra.address || '');
      setKuotaSiswa(editingMitra.kuotaSiswa || 50);
      setPassword(editingMitra.passwordHint || editingMitra.password || 'MitraIJEF2026!');
      setStatus(editingMitra.status === 'AKTIF' || editingMitra.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF');
    } else {
      setNamaLembaga('');
      setPicName('');
      setEmail('');
      setPhone('');
      setMitraType('LPK Pengirim Daerah (SO)');
      setWilayah('Jawa Tengah - Semarang');
      setAddress('');
      setKuotaSiswa(50);
      setPassword('MitraIJEF2026!');
      setStatus('AKTIF');
    }
  }, [editingMitra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLembaga || !email) {
      alert('Nama Lembaga Mitra dan Email Login Resmi wajib diisi.');
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
      department: `Mitra ${mitraType} (${wilayah})`,
      kota: wilayah,
      address: address,
      kuotaSiswa: kuotaSiswa,
      portalAccess: 'MITRA_PORTAL',
      status: status,
      passwordHint: password || 'MitraIJEF2026!',
      password: password || 'MitraIJEF2026!',
      permissions: [
        'Katalog Lowongan Kerja',
        'Nominasi Siswa Siap Matching',
        'Pelacakan Interview Kumiai',
        'Input Registrasi Siswa Mitra'
      ]
    };

    onSave(payload, !editingMitra);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-purple-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-600/30 border border-purple-400/40 rounded-xl text-purple-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                {editingMitra ? 'Edit Data Lembaga Mitra Terdaftar' : 'Daftarkan Lembaga Mitra Baru (Admin Doc)'}
              </h4>
              <p className="text-[10px] text-purple-200">
                Email yang didaftarkan akan menjadi kunci pendaftaran akun di Portal Mitra
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Section: Identitas Lembaga */}
          <div className="space-y-3">
            <div className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Identitas Lembaga / LPK / Kumiai</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Lembaga / Instansi / LPK Mitra <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaLembaga}
                onChange={(e) => setNamaLembaga(e.target.value)}
                placeholder="Contoh: LPK Mitra Mandiri Indonesia / Kumiai Tokyo Sangyo"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategori Kemitraan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={mitraType}
                  onChange={(e) => setMitraType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="LPK Pengirim Daerah (SO)">LPK Pengirim Daerah (SO / Sending Org)</option>
                  <option value="Kumiai Jepang (Asosiasi Penerima)">Kumiai Jepang (Asosiasi Penerima)</option>
                  <option value="TSK / Perusahaan Penerima Jepang">TSK / Perusahaan Penerima Jepang</option>
                  <option value="SMK / Kampus Vokasi Mitra">SMK / Kampus Vokasi Mitra</option>
                  <option value="Asosiasi & Komunitas Kerjasama">Asosiasi & Komunitas Kerjasama</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wilayah / Kota / Prefektur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wilayah}
                  onChange={(e) => setWilayah(e.target.value)}
                  placeholder="Contoh: Jawa Tengah - Semarang / Tokyo"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Kantor</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Pemuda No. 45, Semarang, Jawa Tengah"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Section: Email Resmi & Kredensial Akses */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="text-[11px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>2. Email Resmi & Kunci Otorisasi Portal Mitra</span>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
              <label className="block font-bold text-purple-950 mb-1">
                Email Resmi Mitra (KUNCI OTORISASI PORTAL) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-600 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mitra.mandiri@lpkmitra.id"
                  className="w-full bg-white border border-purple-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-[10px] text-purple-800 mt-1 font-medium">
                ⚠️ Mitra <strong>hanya dapat mendaftar dan masuk</strong> ke Portal Mitra menggunakan email ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama PIC / Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Contoh: Drs. Bambang Sudirman"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor WhatsApp PIC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi Awal / Password Hint
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="MitraIJEF2026!"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Kemitraan</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="AKTIF">🟢 AKTIF (Diizinkan Mendaftar / Login)</option>
                  <option value="NONAKTIF">🔴 DITANGGUHKAN (Akses Diblokir)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 -mx-5 -mb-5 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer transition flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{editingMitra ? 'Simpan Perubahan' : 'Sahkan & Daftarkan Mitra'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUBCOMPONENT: MITRA DETAIL VIEW MODAL
// =========================================================================
interface MitraDetailViewModalProps {
  mitra: AdminUser | null;
  onClose: () => void;
  onEdit: (mitra: AdminUser) => void;
  onResetPassword: (mitra: AdminUser) => void;
  onSendInvite: (mitra: AdminUser) => void;
}

const MitraDetailViewModal: React.FC<MitraDetailViewModalProps> = ({
  mitra,
  onClose,
  onEdit,
  onResetPassword,
  onSendInvite
}) => {
  const { students, mitraSubmissions } = useApp();
  const [showPass, setShowPass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!mitra) return null;

  const isAktif = mitra.status === 'AKTIF' || mitra.status === 'Aktif';
  const password = mitra.passwordHint || mitra.password || 'MitraIJEF2026!';

  // Filter students from this Mitra
  const nominatedStudents = (mitraSubmissions || []).filter(
    (s) =>
      s.mitraName?.toLowerCase() === mitra.name?.toLowerCase() ||
      s.mitraId === mitra.id ||
      s.email?.toLowerCase() === mitra.email?.toLowerCase()
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-black text-lg flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white">{mitra.name}</h3>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">
                  {mitra.id}
                </span>
              </div>
              <p className="text-xs text-purple-200">{mitra.mitraType || 'Mitra LPK Resmi IJEF Corp'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-purple-200 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* Card Kredensial Login Mitra */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-black text-purple-950 flex items-center space-x-1.5 text-xs">
                <Lock className="w-4 h-4 text-purple-700" />
                <span>Kredensial Otorisasi Login Portal Mitra</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isAktif ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isAktif ? '🟢 Terverifikasi & Aktif' : '🔴 Ditangguhkan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Email Login Resmi (Whitelist)
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-950 font-bold text-xs truncate mr-1">
                    {mitra.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mitra.email, 'email')}
                    className="p-1 text-slate-400 hover:text-purple-700 rounded transition cursor-pointer"
                    title="Salin Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-purple-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Kata Sandi Akses
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-950 font-bold text-xs">
                    {showPass ? password : '••••••••••'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="p-1 text-slate-400 hover:text-purple-700 rounded transition cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(password, 'pass')}
                      className="p-1 text-slate-400 hover:text-purple-700 rounded transition cursor-pointer"
                    >
                      {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profil Kontak & Wilayah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Penanggung Jawab (PIC)
              </span>
              <div className="font-extrabold text-sm text-slate-900">{mitra.picName || mitra.name}</div>
              <div className="flex items-center space-x-2 text-slate-700 font-medium">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{mitra.phone || 'Belum diisi'}</span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSendInvite(mitra)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Kredensial via WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Wilayah & Legalitas
              </span>
              <div className="font-bold text-slate-900">{mitra.kota || mitra.department || 'Jepang / Indonesia'}</div>
              <div className="text-slate-600 text-[11px]">{mitra.address || 'Alamat kantor terpusat'}</div>
              <div className="text-[10px] text-slate-400 pt-1 font-mono">
                Terdaftar sejak: {mitra.createdAt || 'Juli 2026'}
              </div>
            </div>
          </div>

          {/* Aktivitas Pengajuan Siswa Binaan */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Riwayat Siswa Binaan & Pengajuan Mitra ({nominatedStudents.length})</span>
              </span>
            </div>

            {nominatedStudents.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-[11px]">
                Belum ada berkas pengajuan atau registrasi siswa dari lembaga mitra ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nominatedStudents.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{sub.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {sub.id} • {sub.createdAt}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sub.status === 'APPROVED' || sub.status === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'REJECTED' || sub.status === 'DITOLAK'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onResetPassword(mitra)}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-purple-700 font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Kata Sandi</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => onEdit(mitra)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Lembaga Mitra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
