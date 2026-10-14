import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AdminUser, CalonSiswa } from '../../types';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  Lock,
  Save,
  BadgeCheck,
  Briefcase,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Search,
  RotateCcw,
  Plus,
  Filter,
  Check,
  ShieldAlert,
  GraduationCap,
  Phone,
  FileText,
  UserCheck,
  Megaphone,
  Copy,
  Handshake
} from 'lucide-react';
import { AdminAccountViewModal } from './settings/AdminAccountViewModal';
import { StudentAccountViewModal } from './settings/StudentAccountViewModal';
import { MitraAccountViewModal } from './settings/MitraAccountViewModal';
import { MitraAccountFormModal } from './settings/MitraAccountFormModal';
import { MitraListView } from './settings/MitraListView';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalType?: 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'MARKETING_PORTAL';
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  portalType = 'ADMIN_1_IJEF'
}) => {
  const { user, updateUserProfile, updateAdminPassword } = useAuth();
  const {
    masterSettings,
    updateMasterSettings,
    students,
    saveStudentRegistration,
    deleteStudent
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'password' | 'account_list' | 'student_list' | 'mitra_list' | 'info'
  >('profile');

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [adminRole, setAdminRole] = useState(
    user?.adminRole || (portalType === 'MARKETING_PORTAL' ? 'Staff Marketing & Konselor' : portalType === 'ADMIN_1_IJEF' ? 'SuperAdmin SIBAL' : 'Admin Matching Japan')
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin Account List & Management States
  const [searchTerm, setSearchTerm] = useState('');
  const [portalFilter, setPortalFilter] = useState<'ALL' | 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'MARKETING_PORTAL'>('ALL');
  const [viewingAdminAccount, setViewingAdminAccount] = useState<AdminUser | null>(null);

  // Modal Add/Edit Admin Account State
  const [showAccountFormModal, setShowAccountFormModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminUser | null>(null);
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accPortalAccess, setAccPortalAccess] = useState<'ALL_PORTALS' | 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'MARKETING_PORTAL' | 'MITRA_PORTAL' | 'STUDENT_PORTAL'>('ADMIN_1_IJEF');
  const [accRole, setAccRole] = useState('HR Legal');
  const [accDepartment, setAccDepartment] = useState('');
  const [accPassword, setAccPassword] = useState('');

  // Reset Password Submodal State for Admin
  const [resetAccount, setResetAccount] = useState<AdminUser | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Student Account Management States
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('Semua');
  const [viewingStudent, setViewingStudent] = useState<CalonSiswa | null>(null);
  const [editingStudent, setEditingStudent] = useState<CalonSiswa | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showResetStudentPassModal, setShowResetStudentPassModal] = useState<CalonSiswa | null>(null);
  const [studentNewPass, setStudentNewPass] = useState('');

  // Student Edit Form States
  const [stuNama, setStuNama] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuNoHp, setStuNoHp] = useState('');
  const [stuNoKtp, setStuNoKtp] = useState('');
  const [stuKategori, setStuKategori] = useState<any>('Tokutei Ginou (SSW)');
  const [stuStatusPendaftaran, setStuStatusPendaftaran] = useState<'Draft' | 'Terdaftar' | 'Terverifikasi' | 'Diterima' | 'Ditolak'>('Terdaftar');

  // Mitra Account Management States
  const [viewingMitraAccount, setViewingMitraAccount] = useState<AdminUser | null>(null);
  const [editingMitraAccount, setEditingMitraAccount] = useState<AdminUser | null>(null);
  const [showMitraFormModal, setShowMitraFormModal] = useState(false);
  const [showResetMitraPassModal, setShowResetMitraPassModal] = useState<AdminUser | null>(null);
  const [mitraNewPass, setMitraNewPass] = useState('');

  // Quick Password Peek & Copy States for Tables
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isMarketing = portalType === 'MARKETING_PORTAL';
  const isAdmin1 = portalType === 'ADMIN_1_IJEF';
  const isAdmin2 = portalType === 'ADMIN_2_CV_PORTAL';
  // Hak akses penuh (Daftar Akun Admin, Siswa, Mitra, dan Matriks RBAC) hanya muncul di Admin 2
  const showFullAccess = isAdmin2;

  useEffect(() => {
    if (!showFullAccess && activeTab !== 'profile' && activeTab !== 'password') {
      setActiveTab('profile');
    }
  }, [showFullAccess, activeTab]);

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setAdminRole(
        user.adminRole ||
          (portalType === 'MARKETING_PORTAL'
            ? 'Staff Marketing & Konselor'
            : portalType === 'ADMIN_1_IJEF'
            ? 'SuperAdmin SIBAL'
            : 'Admin Matching Japan')
      );
    }
  }, [user, isOpen, portalType]);

  if (!isOpen || !user) return null;

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    try {
      await updateUserProfile({
        displayName,
        email,
        adminRole
      });

      setProfileMessage({
        type: 'success',
        text: 'Profil pengelola berhasil diperbarui & disinkronkan ke sistem!'
      });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.message || 'Gagal menyimpan pembaruan profil.'
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: 'Kata sandi baru minimal harus 6 karakter.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.'
      });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await updateAdminPassword(newPassword);
      if (res.success) {
        setPasswordMessage({
          type: 'success',
          text: 'Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.'
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({
          type: 'error',
          text: res.error || 'Gagal memperbarui kata sandi.'
        });
      }
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem saat memperbarui kata sandi.'
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  // ===============================================
  // ADMIN ACCOUNTS MANAGEMENT HANDLERS
  // ===============================================
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccName('');
    setAccEmail('');
    setAccPortalAccess(portalType);
    setAccRole('HR Legal');
    setAccDepartment('Biro Hukum & Legalitas');
    setAccPassword('AdminIJEF2026!');
    setShowAccountFormModal(true);
  };

  const handleOpenEditAccount = (acc: AdminUser) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccEmail(acc.email);
    setAccPortalAccess(acc.portalAccess || 'ADMIN_1_IJEF');
    setAccRole(acc.role);
    setAccDepartment(acc.department || '');
    setAccPassword(acc.passwordHint || acc.password || '');
    setShowAccountFormModal(true);
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentList = masterSettings.adminUsers || [];

    if (editingAccount) {
      const updatedList = currentList.map((item) =>
        item.id === editingAccount.id
          ? {
              ...item,
              name: accName,
              email: accEmail,
              portalAccess: accPortalAccess,
              role: accRole as any,
              department: accDepartment,
              passwordHint: accPassword || item.passwordHint,
              password: accPassword || item.password
            }
          : item
      );
      updateMasterSettings({ adminUsers: updatedList });
      alert(`Akun administrator "${accName}" berhasil diperbarui.`);
    } else {
      const newId = `ADM-${String(currentList.length + 1).padStart(2, '0')}`;
      const newAdmin: AdminUser = {
        id: newId,
        name: accName,
        email: accEmail,
        portalAccess: accPortalAccess,
        role: accRole as any,
        department: accDepartment,
        status: 'AKTIF',
        lastLogin: 'Belum pernah login',
        passwordHint: accPassword || 'AdminIJEF2026!',
        password: accPassword || 'AdminIJEF2026!',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: ['Akses Standar Portal']
      };
      updateMasterSettings({ adminUsers: [...currentList, newAdmin] });
      alert(`Akun administrator baru "${accName}" (${accEmail}) berhasil ditambahkan.`);
    }

    setShowAccountFormModal(false);
  };

  const handleToggleAdminStatus = (accId: string) => {
    const currentList = masterSettings.adminUsers || [];
    const updatedList = currentList.map((item) => {
      if (item.id === accId) {
        const isCurrentlyActive = item.status === 'AKTIF' || item.status === 'Aktif';
        return {
          ...item,
          status: isCurrentlyActive ? ('NONAKTIF' as const) : ('AKTIF' as const)
        };
      }
      return item;
    });
    updateMasterSettings({ adminUsers: updatedList });
  };

  const handleDeleteAdminAccount = (accId: string, accName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun administrator "${accName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      const currentList = masterSettings.adminUsers || [];
      const updatedList = currentList.filter((item) => item.id !== accId);
      updateMasterSettings({ adminUsers: updatedList });
      alert(`Akun administrator "${accName}" telah dihapus.`);
    }
  };

  const handleOpenResetPasswordModal = (acc: AdminUser) => {
    setResetAccount(acc);
    setResetNewPass('AdminIJEF2026!');
    setResetSuccessMsg(null);
  };

  const handleSaveResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAccount) return;

    const currentList = masterSettings.adminUsers || [];
    const updatedList = currentList.map((item) => {
      if (item.id === resetAccount.id) {
        return {
          ...item,
          passwordHint: resetNewPass,
          password: resetNewPass
        };
      }
      return item;
    });

    updateMasterSettings({ adminUsers: updatedList });
    setResetSuccessMsg(`Kata sandi untuk ${resetAccount.name} (${resetAccount.email}) berhasil diatur ulang ke "${resetNewPass}"!`);
  };

  // ===============================================
  // STUDENT ACCOUNTS MANAGEMENT HANDLERS
  // ===============================================
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStuNama('');
    setStuEmail('');
    setStuNoHp('');
    setStuNoKtp('');
    setStuKategori('Tokutei Ginou (SSW)');
    setStuStatusPendaftaran('Terdaftar');
    setShowAddStudentModal(true);
  };

  const handleOpenEditStudent = (stu: CalonSiswa) => {
    setEditingStudent(stu);
    setStuNama(stu.namaLengkap);
    setStuEmail(stu.email);
    setStuNoHp(stu.noHp || stu.whatsapp || '');
    setStuNoKtp(stu.noKtp || '');
    setStuKategori(stu.kategoriKandidat || 'Tokutei Ginou (SSW)');
    setStuStatusPendaftaran(stu.statusPendaftaran as any);
    setShowAddStudentModal(true);
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStu: CalonSiswa = (editingStudent
      ? {
          ...editingStudent,
          namaLengkap: stuNama,
          email: stuEmail,
          noHp: stuNoHp,
          whatsapp: stuNoHp,
          noKtp: stuNoKtp,
          kategoriKandidat: stuKategori,
          statusPendaftaran: stuStatusPendaftaran
        }
      : {
          id: `STU-${Date.now().toString().slice(-6)}`,
          namaLengkap: stuNama,
          email: stuEmail,
          noHp: stuNoHp,
          whatsapp: stuNoHp,
          noKtp: stuNoKtp,
          noKk: '',
          tempatLahir: 'Indonesia',
          tanggalLahir: '2000-01-01',
          agama: 'Islam',
          jenisKelamin: 'Laki-Laki',
          golonganDarah: 'O',
          statusPerkawinan: 'Belum Menikah',
          kategoriKandidat: stuKategori,
          statusPendaftaran: stuStatusPendaftaran,
          password: 'siswa2026!',
          passwordHint: 'siswa2026!',
          createdAt: new Date().toISOString().split('T')[0]
        }) as any;

    saveStudentRegistration(updatedStu);
    setShowAddStudentModal(false);
    setEditingStudent(null);
    alert(`Akun Siswa / Peserta "${updatedStu.namaLengkap}" berhasil disimpan!`);
  };

  const handleDeleteStudentAccount = (stuId: string, stuNama: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun siswa "${stuNama}"? Seluruh data pendaftaran dan asesmen akan dihapus.`
      )
    ) {
      deleteStudent(stuId);
      alert(`Akun siswa "${stuNama}" berhasil dihapus.`);
    }
  };

  const handleResetStudentPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetStudentPassModal) return;
    alert(
      `Kata sandi akun siswa "${showResetStudentPassModal.namaLengkap}" (${showResetStudentPassModal.email}) telah berhasil diset ulang ke "${studentNewPass || 'siswa2026!'}"!`
    );
    setShowResetStudentPassModal(null);
    setStudentNewPass('');
  };

  // ===============================================
  // MITRA ACCOUNTS MANAGEMENT HANDLERS
  // ===============================================
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
        status: m.status
      }));
      localStorage.setItem('ijef_mitra_organizations', JSON.stringify(orgs));
    } catch (e) {}
  };

  const handleSaveMitraSubmit = (accountData: Partial<AdminUser>, isNew: boolean) => {
    const currentList = masterSettings.adminUsers || [];
    let updatedList: AdminUser[];

    if (isNew) {
      const newId = `MTR-${String(currentList.filter((m) => m.role === 'Mitra LPK').length + 1).padStart(2, '0')}`;
      const newMitra: AdminUser = {
        id: newId,
        name: accountData.name || 'Mitra Baru',
        picName: accountData.picName || accountData.name || 'PIC Mitra',
        email: accountData.email || '',
        phone: accountData.phone || '',
        role: 'Mitra LPK',
        mitraType: accountData.mitraType || 'Mitra LPK',
        department: accountData.department || 'Mitra Kumiai & TSK Jepang',
        kota: accountData.kota || 'Jawa Barat',
        portalAccess: 'MITRA_PORTAL',
        status: accountData.status || 'AKTIF',
        lastLogin: 'Belum pernah login',
        passwordHint: accountData.password || accountData.passwordHint || 'MitraIJEF2026!',
        password: accountData.password || accountData.passwordHint || 'MitraIJEF2026!',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: ['Katalog Lowongan Kerja', 'Nominasi Siswa Siap Matching', 'Pelacakan Interview Kumiai']
      };
      updatedList = [...currentList, newMitra];
      alert(`Akun Lembaga Mitra "${newMitra.name}" (${newMitra.email}) berhasil ditambahkan & disahkan!`);
    } else {
      updatedList = currentList.map((item) =>
        item.id === accountData.id
          ? {
              ...item,
              ...accountData,
              passwordHint: accountData.password || item.passwordHint,
              password: accountData.password || item.password
            }
          : item
      );
      alert(`Data Akun Mitra "${accountData.name}" berhasil diperbarui.`);
    }

    updateMasterSettings({ adminUsers: updatedList });
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
  };

  const handleToggleMitraStatus = (mitraId: string) => {
    const currentList = masterSettings.adminUsers || [];
    const updatedList = currentList.map((item) => {
      if (item.id === mitraId) {
        const isCurrentlyActive = item.status === 'AKTIF' || item.status === 'Aktif';
        return {
          ...item,
          status: isCurrentlyActive ? ('NONAKTIF' as const) : ('AKTIF' as const)
        };
      }
      return item;
    });
    updateMasterSettings({ adminUsers: updatedList });
    syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
  };

  const handleDeleteMitraAccount = (mitraId: string, mitraName: string) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun mitra "${mitraName}"? Akses login portal mitra akan dinonaktifkan.`
      )
    ) {
      const currentList = masterSettings.adminUsers || [];
      const updatedList = currentList.filter((item) => item.id !== mitraId);
      updateMasterSettings({ adminUsers: updatedList });
      syncMitraStorage(updatedList.filter((m) => m.role === 'Mitra LPK' || m.portalAccess === 'MITRA_PORTAL'));
      alert(`Akun mitra "${mitraName}" telah dihapus.`);
    }
  };

  const handleResetMitraPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetMitraPassModal) return;

    const currentList = masterSettings.adminUsers || [];
    const updatedList = currentList.map((item) => {
      if (item.id === showResetMitraPassModal.id) {
        return {
          ...item,
          passwordHint: mitraNewPass || 'MitraIJEF2026!',
          password: mitraNewPass || 'MitraIJEF2026!'
        };
      }
      return item;
    });

    updateMasterSettings({ adminUsers: updatedList });
    alert(`Kata sandi akun mitra "${showResetMitraPassModal.name}" telah diubah ke "${mitraNewPass || 'MitraIJEF2026!'}".`);
    setShowResetMitraPassModal(null);
    setMitraNewPass('');
  };

  // Data Filtering
  const allAccounts = masterSettings.adminUsers || [];
  const adminAndStaffAccounts = allAccounts.filter(
    (acc) => acc.role !== 'Mitra LPK' && acc.portalAccess !== 'MITRA_PORTAL'
  );
  const mitraAccounts = allAccounts.filter(
    (acc) => acc.role === 'Mitra LPK' || acc.portalAccess === 'MITRA_PORTAL' || (acc.id && typeof acc.id === 'string' && acc.id.startsWith('MTR'))
  );

  const filteredAdminAccounts = adminAndStaffAccounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.department && acc.department.toLowerCase().includes(searchTerm.toLowerCase()));

    if (portalFilter === 'ALL') return matchesSearch;
    if (portalFilter === 'ADMIN_1_IJEF') {
      return matchesSearch && (acc.portalAccess === 'ADMIN_1_IJEF' || acc.portalAccess === 'ALL_PORTALS');
    }
    if (portalFilter === 'ADMIN_2_CV_PORTAL') {
      return matchesSearch && (acc.portalAccess === 'ADMIN_2_CV_PORTAL' || acc.portalAccess === 'ALL_PORTALS');
    }
    if (portalFilter === 'MARKETING_PORTAL') {
      return matchesSearch && (acc.portalAccess === 'MARKETING_PORTAL' || acc.portalAccess === 'ALL_PORTALS' || acc.role?.toLowerCase().includes('marketing'));
    }
    return matchesSearch;
  });

  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      (stu.namaLengkap || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (stu.email || '').toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      (stu.noHp || '').includes(studentSearchTerm) ||
      (stu.noKtp || '').includes(studentSearchTerm);

    if (studentStatusFilter === 'Semua') return matchesSearch;
    return matchesSearch && stu.statusPendaftaran === studentStatusFilter;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] min-h-0">
          {/* Modal Header */}
          <div
            className={`p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0 ${
              isMarketing
                ? 'bg-slate-900 border-b border-orange-800'
                : isAdmin1
                ? 'bg-slate-900 border-b border-emerald-800'
                : 'bg-slate-900 border-b border-purple-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isMarketing
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : isAdmin1
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}
              >
                {isMarketing ? <Megaphone className="w-5 h-5" /> : isAdmin1 ? <Building2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      isMarketing
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                        : isAdmin1
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {isMarketing ? 'SETTING AKUN MARKETING & CRM' : isAdmin1 ? 'SETTING AKUN ADMIN 1' : 'SETTING AKUN ADMIN 2'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {isMarketing
                    ? 'Pengaturan Akun Tim Marketing & Administrator CRM'
                    : isAdmin1
                    ? 'Pengaturan Akun Administrator SIBAL LPK'
                    : 'Pengaturan Akun Administrator CV-Portal Japan (Hak Akses Penuh)'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-3 sm:px-4 pt-2 overflow-x-auto gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'profile'
                  ? isMarketing
                    ? 'border-orange-600 text-orange-800 bg-white rounded-t-lg'
                    : isAdmin1
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-purple-600 text-purple-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil Pengelola</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'password'
                  ? isMarketing
                    ? 'border-orange-600 text-orange-800 bg-white rounded-t-lg'
                    : isAdmin1
                    ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                    : 'border-purple-600 text-purple-800 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Ubah Kata Sandi</span>
            </button>

            {/* Hak Akses Penuh: Hanya Muncul di Admin 2 Saja */}
            {showFullAccess && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('account_list')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'account_list'
                      ? 'border-purple-600 text-purple-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Daftar Akun Admin ({adminAndStaffAccounts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('student_list')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'student_list'
                      ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Akun Siswa ({students.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mitra_list')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'mitra_list'
                      ? 'border-pink-600 text-pink-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-pink-600" />
                  <span>Daftar Akun Mitra ({mitraAccounts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'info'
                      ? 'border-purple-600 text-purple-800 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hak Akses & Portal</span>
                </button>
              </>
            )}
          </div>

          {/* Modal Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 min-h-0">
            {/* TAB 1: PROFIL PENGELOLA */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl mx-auto">
                {profileMessage && (
                  <div
                    className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-bold ${
                      profileMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {profileMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-lg border-2 border-slate-700">
                    {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{displayName || 'Administrator'}</h4>
                    <p className="text-xs text-slate-500">{email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                      {adminRole}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Pengelola</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Kredensial Login</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan / Peran Sistem</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={adminRole}
                      onChange={(e) => setAdminRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{profileSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: UBAH KATA SANDI */}
            {activeTab === 'password' && (
              <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl mx-auto">
                {passwordMessage && (
                  <div
                    className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-bold ${
                      passwordMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Keamanan Akun:</span> Pastikan kata sandi baru terdiri minimal 6 karakter
                    kombinasi huruf dan angka.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{passwordSaving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: DAFTAR AKUN ADMIN & STAF (Admin 2 Only) */}
            {showFullAccess && activeTab === 'account_list' && (
              <div className="space-y-4">
                {/* Search & Portal Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari nama admin, email, jabatan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                      <button
                        type="button"
                        onClick={() => setPortalFilter('ALL')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          portalFilter === 'ALL' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalFilter('ADMIN_1_IJEF')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          portalFilter === 'ADMIN_1_IJEF' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Admin Siswa
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalFilter('ADMIN_2_CV_PORTAL')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          portalFilter === 'ADMIN_2_CV_PORTAL' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Admin Doc
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortalFilter('MARKETING_PORTAL')}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                          portalFilter === 'MARKETING_PORTAL' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Marketing
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddAccount}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Akun Admin</span>
                  </button>
                </div>

                {/* Table of Admin Accounts */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="p-3 pl-4">Administrator</th>
                        <th className="p-3">Akses Portal</th>
                        <th className="p-3">Jabatan & Departemen</th>
                        <th className="p-3">Kata Sandi (Admin Doc)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredAdminAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Tidak ada akun admin yang cocok dengan kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredAdminAccounts.map((acc) => {
                          const isAktif = acc.status === 'AKTIF' || acc.status === 'Aktif';
                          const isSuper = acc.isSuperAdmin || acc.role === 'SuperAdmin';
                          const resolvedPass =
                            acc.password ||
                            acc.passwordHint ||
                            (isSuper ? 'AdminIJEF2026!' : acc.portalAccess === 'MARKETING_PORTAL' ? 'MarketingIJEF2026!' : 'AdminIJEF2026!');
                          const isRevealed = !!revealedPasswords[acc.id];

                          return (
                            <tr
                              key={acc.id}
                              onClick={() => setViewingAdminAccount(acc)}
                              className="hover:bg-purple-50/40 transition cursor-pointer"
                            >
                              <td className="p-3 pl-4">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-full font-bold text-xs text-white bg-slate-800 flex items-center justify-center shadow-xs shrink-0">
                                    {acc.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                                      <span>{acc.name}</span>
                                      {isSuper && (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] px-1 py-0.2 rounded font-mono font-bold">
                                          SUPER
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">{acc.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  {acc.portalAccess || 'ALL_PORTALS'}
                                </span>
                              </td>

                              <td className="p-3">
                                <div className="font-bold text-slate-800 text-xs">{acc.role}</div>
                                <div className="text-[10px] text-slate-500">{acc.department || 'IJEF Corp'}</div>
                              </td>

                              {/* Password column for Admin 2 */}
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                  <span className="font-mono font-bold text-[11px] text-purple-900">
                                    {isRevealed ? resolvedPass : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => togglePasswordReveal(acc.id, e)}
                                    className="p-0.5 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                                    title={isRevealed ? 'Sembunyikan' : 'Lihat Kata Sandi'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyPassword(acc.id, resolvedPass, e)}
                                    className="p-0.5 text-slate-400 hover:text-purple-700 transition cursor-pointer"
                                    title="Salin Kata Sandi"
                                  >
                                    {copiedId === acc.id ? (
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
                                  onClick={() => handleToggleAdminStatus(acc.id)}
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
                                    onClick={() => setViewingAdminAccount(acc)}
                                    className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                                    title="Lihat Detail Akun"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditAccount(acc)}
                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                                    title="Edit Akun"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenResetPasswordModal(acc)}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Reset Password Akun"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAdminAccount(acc.id, acc.name)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Hapus Akun"
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
              </div>
            )}

            {/* TAB 4: DAFTAR AKUN SISWA (Admin 2 Only) */}
            {showFullAccess && activeTab === 'student_list' && (
              <div className="space-y-4">
                {/* Search & Status Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari nama siswa, email, NIK, WhatsApp..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
                      <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
                      {['Semua', 'Terdaftar', 'Terverifikasi', 'Diterima'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStudentStatusFilter(status)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            studentStatusFilter === status ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddStudent}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Siswa Manual</span>
                  </button>
                </div>

                {/* Table of Students */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                        <th className="p-3 pl-4">Siswa / Peserta</th>
                        <th className="p-3">Kontak Login</th>
                        <th className="p-3">Program Minat</th>
                        <th className="p-3">Kata Sandi (Admin Doc)</th>
                        <th className="p-3">Status Registrasi</th>
                        <th className="p-3 text-center pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Tidak ada data siswa yang cocok dengan filter pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((stu) => {
                          const isAccepted = stu.statusPendaftaran === 'Diterima';
                          const isVerified = stu.statusPendaftaran === 'Terverifikasi';
                          const isRejected = stu.statusPendaftaran === 'Ditolak';
                          const resolvedPass = stu.password || stu.passwordHint || 'siswa2026!';
                          const isRevealed = !!revealedPasswords[stu.id];

                          return (
                            <tr
                              key={stu.id}
                              onClick={() => setViewingStudent(stu)}
                              className="hover:bg-emerald-50/40 transition cursor-pointer"
                            >
                              <td className="p-3 pl-4">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-8 h-8 rounded-full font-bold text-xs text-white bg-emerald-700 flex items-center justify-center shadow-xs shrink-0">
                                    {stu.namaLengkap ? stu.namaLengkap.substring(0, 2).toUpperCase() : 'SW'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{stu.namaLengkap}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">NIK: {stu.noKtp || '-'}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="font-mono text-slate-800 text-xs flex items-center space-x-1">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{stu.email}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{stu.noHp || stu.whatsapp || '-'}</span>
                                </div>
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                  {stu.kategoriKandidat || 'Tokutei Ginou'}
                                </span>
                              </td>

                              {/* Password column for Admin 2 */}
                              <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                <div className="inline-flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                  <span className="font-mono font-bold text-[11px] text-emerald-900">
                                    {isRevealed ? resolvedPass : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => togglePasswordReveal(stu.id, e)}
                                    className="p-0.5 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                                    title={isRevealed ? 'Sembunyikan' : 'Lihat Kata Sandi'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyPassword(stu.id, resolvedPass, e)}
                                    className="p-0.5 text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                                    title="Salin Kata Sandi"
                                  >
                                    {copiedId === stu.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                                  <span>{stu.statusPendaftaran}</span>
                                </span>
                              </td>

                              <td className="p-3 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => setViewingStudent(stu)}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                    title="Lihat Detail Siswa"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStudent(stu)}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                    title="Edit Data Siswa"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowResetStudentPassModal(stu);
                                      setStudentNewPass('siswa2026!');
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                    title="Reset Password Siswa"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStudentAccount(stu.id, stu.namaLengkap)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Hapus Siswa"
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
              </div>
            )}

            {/* TAB 5: DAFTAR AKUN MITRA (Admin 2 Only) */}
            {showFullAccess && activeTab === 'mitra_list' && (
              <MitraListView
                mitraAccounts={mitraAccounts}
                onOpenAddModal={() => {
                  setEditingMitraAccount(null);
                  setShowMitraFormModal(true);
                }}
                onViewAccount={(mitra) => setViewingMitraAccount(mitra)}
                onEditAccount={(mitra) => {
                  setEditingMitraAccount(mitra);
                  setShowMitraFormModal(true);
                }}
                onResetPassword={(mitra) => {
                  setShowResetMitraPassModal(mitra);
                  setMitraNewPass('MitraIJEF2026!');
                }}
                onToggleStatus={handleToggleMitraStatus}
                onDeleteAccount={handleDeleteMitraAccount}
              />
            )}

            {/* TAB 6: HAK AKSES & PORTAL INFO (Admin 2 Only) */}
            {showFullAccess && activeTab === 'info' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-950">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 text-purple-700" />
                    <span>Struktur Otorisasi & Hak Akses Multi-Portal IJEF Corp</span>
                  </div>
                  <p className="text-slate-600">
                    Sistem IJEF Corp mengintegrasikan 4 portal operasional terisolasi dengan otorisasi berbasis peran (RBAC). Admin Doc & Super Admin memiliki kewenangan penuh mengelola akun dan memeriksa kredensial sistem.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>1. Portal Admin Siswa (SIM-SB IJEF)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Dikhususkan untuk manajemen pendaftaran calon siswa, presensi, kurikulum LPK, berkas administrasi dan pelaporan SIBAL.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>2. Portal Admin Doc (CV-Portal Japan)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Pusat kendali Job Matching Jepang, pembuatan CV Rirekisho standar JIS, asesmen wawancara Kumiai/TSK, dan manajemen akun multi-portal.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Megaphone className="w-4 h-4 text-orange-600" />
                      <span>3. Portal Marketing & CRM</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Dikhususkan untuk tim marketing memantau prospek leads, follow-up calon siswa, dan konsultasi program magang Jepang.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Handshake className="w-4 h-4 text-pink-600" />
                      <span>4. Portal Mitra LPK & Kumiai</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Akses eksternal bagi mitra LPK daerah dan Kumiai Jepang untuk melihat katalog lowongan kerja dan menominasikan kandidat.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Otorisasi Sistem Terenkripsi & Sinkron Real-time</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>

      {/* SUBMODALS: VIEW DETAIL ACCOUNT MODALS */}
      <AdminAccountViewModal
        account={viewingAdminAccount}
        onClose={() => setViewingAdminAccount(null)}
        onEdit={(acc) => {
          setViewingAdminAccount(null);
          handleOpenEditAccount(acc);
        }}
        onResetPassword={(acc) => {
          setViewingAdminAccount(null);
          handleOpenResetPasswordModal(acc);
        }}
      />

      <StudentAccountViewModal
        student={viewingStudent}
        onClose={() => setViewingStudent(null)}
        onEdit={(stu) => {
          setViewingStudent(null);
          handleOpenEditStudent(stu);
        }}
        onResetPassword={(stu) => {
          setViewingStudent(null);
          setShowResetStudentPassModal(stu);
          setStudentNewPass('siswa2026!');
        }}
      />

      <MitraAccountViewModal
        mitra={viewingMitraAccount}
        onClose={() => setViewingMitraAccount(null)}
        onEdit={(mitra) => {
          setViewingMitraAccount(null);
          setEditingMitraAccount(mitra);
          setShowMitraFormModal(true);
        }}
        onResetPassword={(mitra) => {
          setViewingMitraAccount(null);
          setShowResetMitraPassModal(mitra);
          setMitraNewPass('MitraIJEF2026!');
        }}
      />

      {/* SUBMODAL: MITRA FORM MODAL (Add / Edit Mitra) */}
      <MitraAccountFormModal
        isOpen={showMitraFormModal}
        onClose={() => {
          setShowMitraFormModal(false);
          setEditingMitraAccount(null);
        }}
        onSave={handleSaveMitraSubmit}
        editingMitra={editingMitraAccount}
      />

      {/* SUBMODAL: ADD / EDIT ADMIN ACCOUNT */}
      {showAccountFormModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-purple-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h4 className="font-bold text-sm">
                  {editingAccount ? 'Edit Akun Administrator' : 'Tambah Administrator Baru'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountFormModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountSubmit} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Administrator</label>
                <input
                  type="text"
                  required
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="Contoh: Ryan Benoe, S.Kom."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Kredensial Login</label>
                <input
                  type="email"
                  required
                  value={accEmail}
                  onChange={(e) => setAccEmail(e.target.value)}
                  placeholder="admin@ijefcorp.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hak Akses Portal Utama</label>
                <select
                  value={accPortalAccess}
                  onChange={(e: any) => setAccPortalAccess(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL_PORTALS">Semua Portal (SuperAdmin)</option>
                  <option value="ADMIN_1_IJEF">Admin Siswa (SIM-SB IJEF LPK)</option>
                  <option value="ADMIN_2_CV_PORTAL">Admin Doc (CV-Portal Japan)</option>
                  <option value="MARKETING_PORTAL">Portal Marketing & CRM</option>
                  <option value="MITRA_PORTAL">Portal Mitra LPK & Kumiai</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                  <input
                    type="text"
                    required
                    value={accRole}
                    onChange={(e) => setAccRole(e.target.value)}
                    placeholder="Contoh: HR Legal"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departemen / Divisi</label>
                  <input
                    type="text"
                    value={accDepartment}
                    onChange={(e) => setAccDepartment(e.target.value)}
                    placeholder="Biro Hukum"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Akun</label>
                <input
                  type="text"
                  required
                  value={accPassword}
                  onChange={(e) => setAccPassword(e.target.value)}
                  placeholder="AdminIJEF2026!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccountFormModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingAccount ? 'Simpan Perubahan' : 'Buat Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: RESET ADMIN PASSWORD */}
      {resetAccount && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm my-auto overflow-hidden flex flex-col min-h-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-amber-800">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Reset Password Akun Admin</h4>
              </div>
              <button
                type="button"
                onClick={() => setResetAccount(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPasswordSubmit} className="p-4 sm:p-5 space-y-3 text-xs flex-1 min-h-0">
              {resetSuccessMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Reset Berhasil!</span>
                  </div>
                  <p className="text-[11px]">{resetSuccessMsg}</p>
                  <button
                    type="button"
                    onClick={() => setResetAccount(null)}
                    className="w-full mt-2 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-slate-600">
                    Atur ulang kata sandi login untuk admin{' '}
                    <strong className="text-slate-900">{resetAccount.name}</strong> ({resetAccount.email}):
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                    <input
                      type="text"
                      required
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setResetAccount(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Simpan Password Baru</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: ADD / EDIT STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md my-auto overflow-hidden flex flex-col max-h-[90vh] min-h-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-emerald-800">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">
                  {editingStudent ? 'Edit Akun Calon Siswa' : 'Tambah Calon Siswa Manual'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="p-4 sm:p-5 space-y-3 text-xs overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={stuNama}
                  onChange={(e) => setStuNama(e.target.value)}
                  placeholder="Contoh: Muhammad Irsan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Siswa (Login Portal)</label>
                <input
                  type="email"
                  required
                  value={stuEmail}
                  onChange={(e) => setStuEmail(e.target.value)}
                  placeholder="siswa@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    required
                    value={stuNoHp}
                    onChange={(e) => setStuNoHp(e.target.value)}
                    placeholder="08123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIK (No. KTP)</label>
                  <input
                    type="text"
                    value={stuNoKtp}
                    onChange={(e) => setStuNoKtp(e.target.value)}
                    placeholder="3201..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program Peminatan</label>
                  <select
                    value={stuKategori}
                    onChange={(e) => setStuKategori(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Tokutei Ginou (SSW)">Tokutei Ginou (SSW)</option>
                    <option value="Ginou Jisshusei (Magang)">Ginou Jisshusei (Magang)</option>
                    <option value="Engineering (Gijinkoku)">Engineering (Gijinkoku)</option>
                    <option value="Ryugaku (Studi Jepang)">Ryugaku (Studi Jepang)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Registrasi</label>
                  <select
                    value={stuStatusPendaftaran}
                    onChange={(e: any) => setStuStatusPendaftaran(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Terdaftar">Terdaftar</option>
                    <option value="Terverifikasi">Terverifikasi</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingStudent ? 'Simpan Perubahan' : 'Daftarkan Siswa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: RESET STUDENT PASSWORD */}
      {showResetStudentPassModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm my-auto overflow-hidden flex flex-col min-h-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-amber-800">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Reset Kata Sandi Siswa</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetStudentPassModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetStudentPasswordSubmit} className="p-4 sm:p-5 space-y-3 text-xs flex-1 min-h-0">
              <p className="text-slate-600">
                Atur ulang kata sandi login portal siswa untuk{' '}
                <strong className="text-slate-900">{showResetStudentPassModal.namaLengkap}</strong> (
                {showResetStudentPassModal.email}):
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru Siswa</label>
                <input
                  type="text"
                  required
                  value={studentNewPass}
                  onChange={(e) => setStudentNewPass(e.target.value)}
                  placeholder="siswa2026!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetStudentPassModal(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Simpan Password Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: RESET MITRA PASSWORD */}
      {showResetMitraPassModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm my-auto overflow-hidden flex flex-col min-h-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-amber-800">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Reset Kata Sandi Mitra</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowResetMitraPassModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetMitraPasswordSubmit} className="p-4 sm:p-5 space-y-3 text-xs flex-1 min-h-0">
              <p className="text-slate-600">
                Atur ulang kata sandi login portal kemitraan untuk{' '}
                <strong className="text-slate-900">{showResetMitraPassModal.name}</strong> ({showResetMitraPassModal.email}):
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kata Sandi Baru Mitra</label>
                <input
                  type="text"
                  required
                  value={mitraNewPass}
                  onChange={(e) => setMitraNewPass(e.target.value)}
                  placeholder="MitraIJEF2026!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetMitraPassModal(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Simpan Password Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
