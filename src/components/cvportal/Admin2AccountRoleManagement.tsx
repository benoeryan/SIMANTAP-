import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth, DEFAULT_INITIAL_ADMIN_USERS } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import { AdminRole, AdminUser, CalonSiswa, RoleAuditLog } from '../../types';
import { saveAdminUserToFirestore, deleteAdminUserFromFirestore } from '../../lib/firebase';
import { FirebaseSyncControlBar } from '../common/FirebaseSyncControlBar';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Key,
  UserCheck,
  UserPlus,
  Users,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Check,
  X,
  Lock,
  History,
  ChevronRight,
  ArrowRight,
  Briefcase,
  Stethoscope,
  Scale,
  DollarSign,
  BookOpen,
  Megaphone,
  Target,
  BarChart3,
  Share2,
  MessageSquare,
  BadgePercent,
  PhoneCall
} from 'lucide-react';

interface UnifiedAccount {
  id: string;
  sourceType: 'ADMIN' | 'MITRA' | 'SISWA';
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  roleCategory: 'SUPER_ADMIN' | 'ADMIN_2' | 'ADMIN_1' | 'MARKETING' | 'STAFF' | 'MITRA' | 'SISWA';
  department: string;
  portalAccess: 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL' | 'STUDENT_PORTAL' | 'MARKETING_PORTAL';
  status: 'Aktif' | 'Nonaktif' | 'SUSPENDED';
  isSuperAdmin: boolean;
  permissions: string[];
  lastLogin?: string;
  passwordHint?: string;
  createdAt?: string;
  rawStudent?: CalonSiswa;
  rawAdmin?: AdminUser;
  [key: string]: any;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'FULL_BYPASS', label: '👑 Akses Penuh Super Admin (Bypass All)', desc: 'Dapat mengelola seluruh sistem, database, dan menghapus data' },
  { id: 'MANAGE_USERS_ROLES', label: '👥 Kelola User & Tunjuk Role Admin', desc: 'Wewenang membuat akun, menunjuk Super Admin, dan mengubah izin' },
  { id: 'MANAGE_MARKETING_LEADS', label: '📢 Kelola CRM Leads & Pipeline Intake', desc: 'Manajemen prospek calon siswa, follow up WhatsApp, status intake, & konversi' },
  { id: 'MANAGE_MARKETING_CAMPAIGN', label: '🎯 Kelola Kampanye & Iklan Promosi', desc: 'Pengaturan iklan Meta/TikTok/Google, materi brosur promosi, dan event seminar' },
  { id: 'MANAGE_MARKETING_AFFILIATE', label: '🤝 Kelola Program Afiliasi & Referral', desc: 'Manajemen komisi agen mitra daerah, reward alumni, dan tracking bonus pendaftaran' },
  { id: 'MANAGE_MARKETING_ANALYTICS', label: '📊 Akses Analitik & Laporan Pemasaran', desc: 'Laporan konversi intake, CAC, efektivitas channel promosi, & ROI pendaftaran' },
  { id: 'MANAGE_MARKETING_CS', label: '💬 Live Chat & Konseling Pendaftaran', desc: 'Konseling jurusan kerja Jepang, broadcast info, & penanganan FAQ calon siswa' },
  { id: 'APPROVE_MITRA_STUDENT', label: '🎓 Approval Siswa Mitra Baru', desc: 'Otorisasi dan verifikasi registrasi calon siswa dari LPK Mitra' },
  { id: 'APPROVE_MITRA_JOB', label: '💼 Approval Lowongan Job Mitra', desc: 'Validasi dan pengesahan posting lowongan kerja yang diinput oleh Mitra' },
  { id: 'APPROVE_MITRA_APPLICATION', label: '📋 Approval Lamaran Siswa Mitra', desc: 'Review kelayakan & pengesahan pendaftaran siswa mitra ke lowongan kerja' },
  { id: 'MANAGE_JOBS', label: '💼 Kelola Katalog Job Postings & TSK', desc: 'Tambah, edit, dan hapus lowongan kerja ke Jepang' },
  { id: 'MANAGE_RIREKISHO', label: '📄 Verifikasi & Terjemahan CV Rirekisho JIS', desc: 'Validasi dokumen, auto-translate katakana, dan cetak CV' },
  { id: 'MANAGE_INTERVIEWS', label: '🎙️ Jadwal Interview & Seleksi Kumiai', desc: 'Atur Zoom interview, catat hasil wawancara, dan approval naitei' },
  { id: 'MANAGE_FINANCING', label: '💰 Otorisasi Pembiayaan & Dana Talang', desc: 'Kelola simulasi pinjaman, tenor, dan approval dana talang' },
  { id: 'MANAGE_CONTRACTS', label: '⚖️ Pengesahan Surat Perjanjian & Legal LPK', desc: 'Review draf kontrak kerja dan penjaminan peserta' },
  { id: 'MANAGE_MCU_HEALTH', label: '🩺 Diagnosa MCU & Rekam Medis Kesehatan', desc: 'Input hasil laboratorium, rontgen, dan evaluasi fit to work' },
  { id: 'MANAGE_PSYCHOLOGY', label: '🧠 Evaluasi DISC & Psikotes Siswa', desc: 'Akses hasil tes psikologi dan rekomendasi karakter' },
  { id: 'MANAGE_STUDENTS', label: '🎓 Registrasi & Data Master Siswa', desc: 'Kelola formulir pendaftaran dan berkas administrasi calon siswa' }
];

export const Admin2AccountRoleManagement: React.FC = () => {
  const { masterSettings, updateMasterSettings, students, saveStudentRegistration, deleteStudent } = useApp();
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tRole,
    bilingual
  } = useEcosystemTranslation('roleManagement');
  const { user } = useAuth();

  const currentActorName = user?.displayName || 'Admin Doc (CV Portal & Matching)';
  const currentActorRole = user?.adminRole || 'Admin Doc';

  // Filters & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'ACCOUNTS' | 'AUDIT_LOG' | 'SECURITY_POLICY'>('ACCOUNTS');

  // Modals State
  const [showAppointSuperAdminModal, setShowAppointSuperAdminModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UnifiedAccount | null>(null);
  const [resetPassAccount, setResetPassAccount] = useState<UnifiedAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('AdminIJEF2026!');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Appoint Super Admin Form State
  const [appointTargetMode, setAppointTargetMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string>('');
  const [newSuperAdminForm, setNewSuperAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Direksi Eksekutif & IT Back-Office',
    password: 'SuperAdmin2026!'
  });

  // Create New Account Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin Doc (CV Portal & Matching)' as AdminRole,
    department: 'Divisi Penempatan Jepang (TSK/SSW)',
    portalAccess: 'ADMIN_2_CV_PORTAL' as 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL' | 'STUDENT_PORTAL' | 'MARKETING_PORTAL',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password: 'Admin2026!',
    permissions: [
      'MANAGE_JOBS',
      'MANAGE_RIREKISHO',
      'MANAGE_INTERVIEWS',
      'MANAGE_USERS_ROLES'
    ]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to add audit log
  const addAuditLog = (
    action: RoleAuditLog['action'],
    targetUserName: string,
    targetUserEmail: string,
    assignedRole: string,
    notes?: string
  ) => {
    const newLog: RoleAuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      actorName: currentActorName,
      actorRole: currentActorRole,
      targetUserName,
      targetUserEmail,
      assignedRole,
      timestamp: new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      notes
    };

    const currentLogs = masterSettings.roleAuditLogs || [];
    updateMasterSettings({
      roleAuditLogs: [newLog, ...currentLogs]
    });
  };

  // Compile Unified List of ALL accounts in the system
  const allAccounts = useMemo<UnifiedAccount[]>(() => {
    const list: UnifiedAccount[] = [];
    const registeredEmails = new Set<string>();

    // Combine Master Settings adminUsers with DEFAULT_INITIAL_ADMIN_USERS to guarantee default admins are always present
    const adminMap = new Map<string, AdminUser>();
    (masterSettings.adminUsers || []).forEach((adm) => {
      if (adm && (adm.id || adm.email)) {
        adminMap.set((adm.id || adm.email).toLowerCase(), adm);
      }
    });
    DEFAULT_INITIAL_ADMIN_USERS.forEach((adm) => {
      const key = (adm.id || adm.email).toLowerCase();
      if (!adminMap.has(key)) {
        adminMap.set(key, adm);
      }
    });

    const adminUsers = Array.from(adminMap.values());
    adminUsers.forEach((adm) => {
      const email = adm.email.toLowerCase().trim();
      registeredEmails.add(email);

      const rLow = (adm.role || '').toLowerCase();
      const isSuper =
        adm.isSuperAdmin ||
        adm.role === 'SuperAdmin' ||
        (rLow.includes('super') && !rLow.includes('admin 2') && !rLow.includes('admin 1') && !rLow.includes('marketing'));

      let roleCategory: UnifiedAccount['roleCategory'] = 'STAFF';
      if (adm.role === 'SuperAdmin' || (isSuper && !rLow.includes('admin 2') && !rLow.includes('admin 1') && !rLow.includes('marketing') && !rLow.includes('doc'))) {
        roleCategory = 'SUPER_ADMIN';
      } else if (rLow.includes('admin 2') || rLow.includes('admin doc') || rLow.includes('matching') || adm.portalAccess === 'ADMIN_2_CV_PORTAL') {
        roleCategory = 'ADMIN_2';
      } else if (rLow.includes('admin 1') || rLow.includes('admin siswa') || rLow.includes('akademik') || adm.portalAccess === 'ADMIN_1_IJEF') {
        roleCategory = 'ADMIN_1';
      } else if (
        rLow.includes('marketing') ||
        rLow.includes('konselor') ||
        rLow.includes('telemarketing') ||
        rLow.includes('digital market') ||
        rLow.includes('akuisisi') ||
        rLow.includes('promosi') ||
        adm.portalAccess === 'MARKETING_PORTAL'
      ) {
        roleCategory = 'MARKETING';
      } else if (rLow.includes('dokter') || rLow.includes('medis') || rLow.includes('legal') || rLow.includes('hr') || rLow.includes('finance')) {
        roleCategory = 'STAFF';
      } else if (rLow.includes('mitra') || adm.portalAccess === 'MITRA_PORTAL') {
        roleCategory = 'MITRA';
      }

      list.push({
        id: adm.id,
        sourceType: 'ADMIN',
        name: adm.name,
        email: adm.email,
        phone: adm.phone || '-',
        role: adm.role,
        roleCategory,
        department: adm.department || (isSuper ? 'Direksi & IT Back-Office' : roleCategory === 'MARKETING' ? 'Divisi Pemasaran & Intake' : 'Divisi Operasional'),
        portalAccess: adm.portalAccess || (isSuper ? 'ALL_PORTALS' : roleCategory === 'MARKETING' ? 'MARKETING_PORTAL' : 'ADMIN_2_CV_PORTAL'),
        status: (adm.status === 'AKTIF' || adm.status === 'Aktif') ? 'Aktif' : 'Nonaktif',
        isSuperAdmin: isSuper,
        permissions: adm.permissions || (isSuper ? AVAILABLE_PERMISSIONS.map((p) => p.id) : roleCategory === 'MARKETING' ? ['MANAGE_MARKETING_LEADS', 'MANAGE_MARKETING_CAMPAIGN', 'MANAGE_MARKETING_AFFILIATE', 'MANAGE_MARKETING_ANALYTICS', 'MANAGE_MARKETING_CS', 'MANAGE_STUDENTS'] : ['MANAGE_JOBS', 'MANAGE_RIREKISHO']),
        lastLogin: adm.lastLogin || '28 Jul 2026, 10:15 WIB',
        createdAt: adm.createdAt || '2026-01-10',
        rawAdmin: adm
      });
    });

    // 2. Student Accounts from students context
    students.forEach((stu) => {
      const email = (stu.email || '').toLowerCase().trim();
      if (!email || registeredEmails.has(email)) return;
      registeredEmails.add(email);

      list.push({
        id: stu.id,
        sourceType: 'SISWA',
        name: stu.namaLengkap,
        email: stu.email,
        phone: stu.noHp || '-',
        role: 'Siswa',
        roleCategory: 'SISWA',
        department: `Kandidat (${stu.kategoriKandidat || 'SSW Japan'})`,
        portalAccess: 'STUDENT_PORTAL',
        status: stu.statusPendaftaran === 'Ditolak' ? 'Nonaktif' : 'Aktif',
        isSuperAdmin: false,
        permissions: ['Akses Portal Mandiri Siswa', 'Upload Berkas & CV'],
        lastLogin: 'Aktif di Portal Siswa',
        createdAt: stu.createdAt || '2026-02-01',
        rawStudent: stu
      });
    });

    return list;
  }, [masterSettings.adminUsers, students]);

  // Filtered accounts based on search & filters
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter((acc) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        acc.name.toLowerCase().includes(term) ||
        acc.email.toLowerCase().includes(term) ||
        acc.department.toLowerCase().includes(term) ||
        (acc.phone && acc.phone.includes(term)) ||
        acc.role.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      // Filter by role category
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'SUPER_ADMIN' && !acc.isSuperAdmin) return false;
        if (roleFilter === 'ADMIN_2' && acc.roleCategory !== 'ADMIN_2') return false;
        if (roleFilter === 'ADMIN_1' && acc.roleCategory !== 'ADMIN_1') return false;
        if (roleFilter === 'MARKETING' && acc.roleCategory !== 'MARKETING') return false;
        if (roleFilter === 'MITRA' && acc.roleCategory !== 'MITRA') return false;
        if (roleFilter === 'STAFF' && acc.roleCategory !== 'STAFF') return false;
        if (roleFilter === 'SISWA' && acc.roleCategory !== 'SISWA') return false;
      }

      // Filter by status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'AKTIF' && acc.status !== 'Aktif') return false;
        if (statusFilter === 'NONAKTIF' && acc.status !== 'Nonaktif') return false;
      }

      return true;
    });
  }, [allAccounts, searchTerm, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = allAccounts.length;
    const superAdmins = allAccounts.filter((a) => a.isSuperAdmin).length;
    const admin2Count = allAccounts.filter((a) => a.roleCategory === 'ADMIN_2').length;
    const admin1Count = allAccounts.filter((a) => a.roleCategory === 'ADMIN_1').length;
    const marketingCount = allAccounts.filter((a) => a.roleCategory === 'MARKETING').length;
    const staffCount = allAccounts.filter((a) => a.roleCategory === 'STAFF').length;
    const mitraCount = allAccounts.filter((a) => a.roleCategory === 'MITRA').length;
    const siswaCount = allAccounts.filter((a) => a.roleCategory === 'SISWA').length;

    return { total, superAdmins, admin2Count, admin1Count, marketingCount, staffCount, mitraCount, siswaCount };
  }, [allAccounts]);

  // ==========================================
  // HANDLERS: APPOINT SUPER ADMIN
  // ==========================================
  const handleAppointSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();

    if (appointTargetMode === 'EXISTING') {
      if (!selectedExistingUserId) {
        showToast('Pilih akun yang ingin ditunjuk sebagai Super Admin', 'error');
        return;
      }

      const target = allAccounts.find((a) => a.id === selectedExistingUserId);
      if (!target) return;

      const currentAdmins = [...(masterSettings.adminUsers || [])];
      const existingIdx = currentAdmins.findIndex((a) => a.id === target.id || a.email.toLowerCase() === target.email.toLowerCase());

      const fullPerms = AVAILABLE_PERMISSIONS.map((p) => p.id);

      if (existingIdx >= 0) {
        const updatedTarget = {
          ...currentAdmins[existingIdx],
          role: 'SuperAdmin' as AdminRole,
          isSuperAdmin: true,
          portalAccess: 'ALL_PORTALS' as const,
          status: 'AKTIF' as const,
          department: currentAdmins[existingIdx].department || 'Direksi Eksekutif & IT Back-Office',
          permissions: fullPerms
        };
        currentAdmins[existingIdx] = updatedTarget;
        saveAdminUserToFirestore(updatedTarget).catch(console.error);
      } else {
        // Was from students or elsewhere, add to adminUsers
        const newSuperAdm: AdminUser = {
          id: target?.id && typeof target.id === 'string' && target.id.startsWith('ADM-') ? target.id : `ADM-SUPER-${Date.now().toString().slice(-4)}`,
          name: target.name,
          email: target.email,
          phone: target.phone,
          role: 'SuperAdmin',
          isSuperAdmin: true,
          department: 'Direksi Eksekutif & IT Back-Office',
          portalAccess: 'ALL_PORTALS',
          status: 'AKTIF',
          lastLogin: 'Baru ditunjuk',
          createdAt: new Date().toISOString().split('T')[0],
          permissions: fullPerms
        };
        currentAdmins.unshift(newSuperAdm);
        saveAdminUserToFirestore(newSuperAdm).catch(console.error);
      }

      updateMasterSettings({ adminUsers: currentAdmins });
      addAuditLog('APPOINT_SUPER_ADMIN', target.name, target.email, 'SuperAdmin', 'Ditunjuk menjadi Super Admin dengan hak akses penuh semua portal');
      showToast(`Berhasil menunjuk ${target.name} sebagai Super Administrator! 🎉`);
    } else {
      // Create new Super Admin
      if (!newSuperAdminForm.name || !newSuperAdminForm.email) {
        showToast('Nama dan Email Super Admin baru wajib diisi', 'error');
        return;
      }

      const currentAdmins = [...(masterSettings.adminUsers || [])];
      const newId = `ADM-SUPER-${Date.now().toString().slice(-4)}`;
      const fullPerms = AVAILABLE_PERMISSIONS.map((p) => p.id);

      const newSuperAdminObj: AdminUser = {
        id: newId,
        name: newSuperAdminForm.name,
        email: newSuperAdminForm.email,
        phone: newSuperAdminForm.phone || '-',
        role: 'SuperAdmin',
        isSuperAdmin: true,
        department: newSuperAdminForm.department || 'Direksi Eksekutif & IT Back-Office',
        portalAccess: 'ALL_PORTALS',
        status: 'AKTIF',
        lastLogin: 'Baru dibuat',
        createdAt: new Date().toISOString().split('T')[0],
        passwordHint: newSuperAdminForm.password,
        permissions: fullPerms
      };
      currentAdmins.unshift(newSuperAdminObj);
      saveAdminUserToFirestore(newSuperAdminObj).catch(console.error);

      updateMasterSettings({ adminUsers: currentAdmins });
      addAuditLog('APPOINT_SUPER_ADMIN', newSuperAdminForm.name, newSuperAdminForm.email, 'SuperAdmin', 'Akun Super Admin baru dibuat dengan akses penuh');
      showToast(`Akun Super Admin ${newSuperAdminForm.name} berhasil dibuat! 👑`);
    }

    setShowAppointSuperAdminModal(false);
    setSelectedExistingUserId('');
    setNewSuperAdminForm({
      name: '',
      email: '',
      phone: '',
      department: 'Direksi Eksekutif & IT Back-Office',
      password: 'SuperAdmin2026!'
    });
  };

  // Quick 1-Click Promote to Super Admin
  const handleQuickPromoteToSuperAdmin = (acc: UnifiedAccount) => {
    const confirmPromote = window.confirm(
      `Konfirmasi Penunjukan Super Admin:\n\nApakah Anda yakin ingin menunjuk "${acc.name}" (${acc.email}) menjadi SUPER ADMIN dengan hak akses penuh ke seluruh modul sistem?`
    );
    if (!confirmPromote) return;

    const currentAdmins = [...(masterSettings.adminUsers || [])];
    const existingIdx = currentAdmins.findIndex((a) => a.id === acc.id || a.email.toLowerCase() === acc.email.toLowerCase());
    const fullPerms = AVAILABLE_PERMISSIONS.map((p) => p.id);

    if (existingIdx >= 0) {
      const updatedPromoted = {
        ...currentAdmins[existingIdx],
        role: 'SuperAdmin' as AdminRole,
        isSuperAdmin: true,
        portalAccess: 'ALL_PORTALS' as const,
        status: 'AKTIF' as const,
        department: 'Direksi Eksekutif & IT Back-Office',
        permissions: fullPerms
      };
      currentAdmins[existingIdx] = updatedPromoted;
      saveAdminUserToFirestore(updatedPromoted).catch(console.error);
    } else {
      const newPromoted: AdminUser = {
        id: acc?.id && typeof acc.id === 'string' && acc.id.startsWith('ADM-') ? acc.id : `ADM-SUPER-${Date.now().toString().slice(-4)}`,
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        role: 'SuperAdmin',
        isSuperAdmin: true,
        department: 'Direksi Eksekutif & IT Back-Office',
        portalAccess: 'ALL_PORTALS',
        status: 'AKTIF',
        lastLogin: 'Baru ditunjuk',
        createdAt: new Date().toISOString().split('T')[0],
        permissions: fullPerms
      };
      currentAdmins.unshift(newPromoted);
      saveAdminUserToFirestore(newPromoted).catch(console.error);
    }

    updateMasterSettings({ adminUsers: currentAdmins });
    addAuditLog('APPOINT_SUPER_ADMIN', acc.name, acc.email, 'SuperAdmin', 'Promosi instan 1-klik ke Super Admin dari Portal Admin Doc');
    showToast(`Otoritas Super Admin berhasil diberikan kepada ${acc.name}! 👑`);
  };

  // ==========================================
  // HANDLERS: CREATE NEW ACCOUNT
  // ==========================================
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name || !createForm.email) {
      showToast('Nama dan Email wajib diisi', 'error');
      return;
    }

    const isSuper = createForm.role === 'SuperAdmin';
    const newId = `ADM-${Date.now().toString().slice(-4)}`;

    const newAdmin: AdminUser = {
      id: newId,
      name: createForm.name,
      email: createForm.email,
      phone: createForm.phone || '-',
      role: createForm.role,
      department: createForm.department,
      portalAccess: createForm.portalAccess,
      status: createForm.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF',
      isSuperAdmin: isSuper,
      lastLogin: 'Belum pernah login',
      createdAt: new Date().toISOString().split('T')[0],
      passwordHint: createForm.password,
      permissions: isSuper ? AVAILABLE_PERMISSIONS.map((p) => p.id) : createForm.permissions
    };

    const currentAdmins = masterSettings.adminUsers || [];
    updateMasterSettings({
      adminUsers: [newAdmin, ...currentAdmins]
    });
    saveAdminUserToFirestore(newAdmin).catch(console.error);

    addAuditLog('CREATE_ADMIN', createForm.name, createForm.email, createForm.role, `Pembuatan akun baru dengan role ${createForm.role} dan portal ${createForm.portalAccess}`);
    showToast(`Akun ${createForm.name} (${createForm.role}) berhasil didaftarkan!`);
    setShowCreateAccountModal(false);

    // Reset form
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      role: 'Admin 2 (CV Portal & Matching)',
      department: 'Divisi Penempatan Jepang (TSK/SSW)',
      portalAccess: 'ADMIN_2_CV_PORTAL',
      status: 'Aktif',
      password: 'Admin2026!',
      permissions: [
        'MANAGE_JOBS',
        'MANAGE_RIREKISHO',
        'MANAGE_INTERVIEWS',
        'MANAGE_USERS_ROLES'
      ]
    });
  };

  // ==========================================
  // HANDLERS: EDIT ACCOUNT & ROLE
  // ==========================================
  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const isSuper = editingAccount.role === 'SuperAdmin' || editingAccount.isSuperAdmin;
    const currentAdmins = [...(masterSettings.adminUsers || [])];
    const existingIdx = currentAdmins.findIndex((a) => a.id === editingAccount.id || a.email.toLowerCase() === editingAccount.email.toLowerCase());

    const updatedAdmin: AdminUser = {
      id: editingAccount.id,
      name: editingAccount.name,
      email: editingAccount.email,
      phone: editingAccount.phone,
      role: editingAccount.role,
      department: editingAccount.department,
      portalAccess: editingAccount.portalAccess,
      status: editingAccount.status === 'Aktif' ? 'AKTIF' : 'NONAKTIF',
      isSuperAdmin: isSuper,
      lastLogin: editingAccount.lastLogin,
      permissions: isSuper ? AVAILABLE_PERMISSIONS.map((p) => p.id) : editingAccount.permissions
    };

    if (existingIdx >= 0) {
      currentAdmins[existingIdx] = updatedAdmin;
    } else {
      currentAdmins.unshift(updatedAdmin);
    }

    // Also update student record if applicable
    if (editingAccount.sourceType === 'SISWA' && editingAccount.rawStudent) {
      saveStudentRegistration({
        ...editingAccount.rawStudent,
        namaLengkap: editingAccount.name,
        email: editingAccount.email,
        noHp: editingAccount.phone || editingAccount.rawStudent.noHp,
        statusPendaftaran: editingAccount.status === 'Aktif' ? 'Terdaftar' : 'Ditolak'
      });
    }

    updateMasterSettings({ adminUsers: currentAdmins });
    saveAdminUserToFirestore(updatedAdmin).catch(console.error);

    addAuditLog('UPDATE_ROLE', editingAccount.name, editingAccount.email, editingAccount.role, `Pembaruan peran menjadi ${editingAccount.role} & status ${editingAccount.status}`);
    showToast(`Data akun & role ${editingAccount.name} berhasil diperbarui!`);
    setEditingAccount(null);
  };

  // Toggle Status
  const handleToggleStatus = (acc: UnifiedAccount) => {
    const newStatus = acc.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const currentAdmins = [...(masterSettings.adminUsers || [])];
    const existingIdx = currentAdmins.findIndex((a) => a.id === acc.id || a.email.toLowerCase() === acc.email.toLowerCase());

    if (existingIdx >= 0) {
      const updatedAdm = {
        ...currentAdmins[existingIdx],
        status: (newStatus === 'Aktif' ? 'AKTIF' : 'NONAKTIF') as 'AKTIF' | 'NONAKTIF'
      };
      currentAdmins[existingIdx] = updatedAdm;
      updateMasterSettings({ adminUsers: currentAdmins });
      saveAdminUserToFirestore(updatedAdm).catch(console.error);
    }

    if (acc.sourceType === 'SISWA' && acc.rawStudent) {
      saveStudentRegistration({
        ...acc.rawStudent,
        statusPendaftaran: newStatus === 'Aktif' ? 'Terverifikasi' : 'Ditolak'
      });
    }

    addAuditLog('TOGGLE_STATUS', acc.name, acc.email, acc.role, `Mengubah status akun menjadi ${newStatus}`);
    showToast(`Status akun ${acc.name} diubah menjadi ${newStatus}`);
  };

  // Delete Account
  const handleDeleteAccount = (acc: UnifiedAccount) => {
    if (acc.isSuperAdmin && allAccounts.filter((a) => a.isSuperAdmin).length <= 1) {
      showToast('Tidak dapat menghapus satu-satunya Super Admin aktif di sistem', 'error');
      return;
    }

    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus akun "${acc.name}" (${acc.email}) dari sistem?`);
    if (!confirmDelete) return;

    if (acc.sourceType === 'ADMIN') {
      const currentAdmins = (masterSettings.adminUsers || []).filter((a) => a.id !== acc.id && a.email.toLowerCase() !== acc.email.toLowerCase());
      updateMasterSettings({ adminUsers: currentAdmins });
      deleteAdminUserFromFirestore(acc.id).catch(console.error);
    } else if (acc.sourceType === 'SISWA') {
      deleteStudent(acc.id);
    }

    addAuditLog('DELETE_ACCOUNT', acc.name, acc.email, acc.role, 'Akun dihapus permanen dari sistem');
    showToast(`Akun ${acc.name} berhasil dihapus dari sistem`);
  };

  // Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassAccount) return;

    if (newPasswordInput.length < 6) {
      showToast('Kata sandi minimal 6 karakter', 'error');
      return;
    }

    const currentAdmins = [...(masterSettings.adminUsers || [])];
    const existingIdx = currentAdmins.findIndex((a) => a.id === resetPassAccount.id || a.email.toLowerCase() === resetPassAccount.email.toLowerCase());

    if (existingIdx >= 0) {
      const updatedAdmin = {
        ...currentAdmins[existingIdx],
        passwordHint: newPasswordInput
      };
      currentAdmins[existingIdx] = updatedAdmin;
      updateMasterSettings({ adminUsers: currentAdmins });
      saveAdminUserToFirestore(updatedAdmin).catch(console.error);
    }

    addAuditLog('RESET_PASSWORD', resetPassAccount.name, resetPassAccount.email, resetPassAccount.role, `Reset kata sandi akun ke '${newPasswordInput}'`);
    showToast(`Kata sandi akun ${resetPassAccount.name} berhasil direset! 🔑`);
    setResetPassAccount(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-bold transition-all transform animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-rose-950 text-rose-100 border-rose-500/50 shadow-rose-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* HEADER SECTION WITH HERO METRICS */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-xl p-3.5 sm:p-4.5 text-white shadow-md border border-purple-500/20 relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 bg-purple-500/20 border border-purple-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-purple-200 backdrop-blur-xs">
              <Crown className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>{lang === 'ja' ? 'ADMIN DOC 集中権限・アカウント管理' : 'OTORISASI & MANAJEMEN AKUN TERPUSAT ADMIN DOC'}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>{lang === 'ja' ? '全アカウント管理＆スーパー管理者任命' : 'Pengelolaan Seluruh Akun & Penunjukan Super Admin'}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-purple-200/90 max-w-2xl leading-normal font-normal">
              {lang === 'ja'
                ? 'システムアカウントの管理、スーパー管理者の任命、ロール権限の設定、およびスタッフ・提携機関・候補者の全アカウントの監視を行うAdmin Docの総合権限画面です。'
                : 'Wewenang penuh Admin Doc untuk mengelola akun sistem, menunjuk/mengangkat Super Admin, mengonfigurasi hak akses role, dan memonitor seluruh akun staf, mitra, serta kandidat.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAppointSuperAdminModal(true)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-2 rounded-lg text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950" />
              <span>{lang === 'ja' ? '👑 スーパー管理者任命・作成' : '👑 Tunjuk / Buat Super Admin'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateAccountModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'ja' ? '新規アカウント追加' : 'Tambah Akun Baru'}</span>
            </button>
          </div>
        </div>

        {/* METRIC PILLS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-200/80">{lang === 'ja' ? '全アカウント総数' : 'Total Seluruh Akun'}</div>
            <div className="text-xl font-black mt-1 text-white">{stats.total}</div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">{lang === 'ja' ? 'リアルタイム同期' : 'Tersinkron Realtime'}</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-3 border border-amber-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-200 flex items-center gap-1">
              <span>👑 {lang === 'ja' ? 'スーパー管理者' : 'Super Admin'}</span>
            </div>
            <div className="text-xl font-black mt-1 text-amber-300">{stats.superAdmins}</div>
            <div className="text-[10px] text-amber-200/80 font-semibold mt-0.5">{lang === 'ja' ? '最高統括権限' : 'Otoritas Tertinggi'}</div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-3 border border-purple-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-purple-200">{lang === 'ja' ? 'Admin Doc (CV/求人)' : 'Admin Doc (CV Portal)'}</div>
            <div className="text-xl font-black mt-1 text-purple-300">{stats.admin2Count}</div>
            <div className="text-[10px] text-purple-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'マッチング＆求人台帳' : 'Matching & Job Catalog'}</div>
          </div>

          <div className="bg-indigo-500/10 backdrop-blur-sm rounded-2xl p-3 border border-indigo-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-200">{lang === 'ja' ? '生徒管理 (SIM-SB)' : 'Admin Siswa (SIM-SB)'}</div>
            <div className="text-xl font-black mt-1 text-indigo-300">{stats.admin1Count}</div>
            <div className="text-[10px] text-indigo-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'IJEF運営管理' : 'Operasional IJEF'}</div>
          </div>

          <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl p-3 border border-orange-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-orange-200 flex items-center gap-1">
              <span>📢 {lang === 'ja' ? 'マーケティング' : 'Tim Marketing'}</span>
            </div>
            <div className="text-xl font-black mt-1 text-orange-300">{stats.marketingCount}</div>
            <div className="text-[10px] text-orange-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'CRMリード＆集客' : 'CRM Leads & Intake'}</div>
          </div>

          <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-3 border border-blue-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-blue-200">{lang === 'ja' ? '医療/HR/財務スタッフ' : 'Staf Medis / HR / Fin'}</div>
            <div className="text-xl font-black mt-1 text-blue-300">{stats.staffCount}</div>
            <div className="text-[10px] text-blue-200/80 font-semibold mt-0.5">{lang === 'ja' ? '審査・法務チーム' : 'Tim Penilai & Legal'}</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-3 border border-emerald-500/20">
            <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-200">{lang === 'ja' ? '生徒/提携機関アカウント' : 'Akun Siswa / Mitra'}</div>
            <div className="text-xl font-black mt-1 text-emerald-300">{stats.siswaCount + stats.mitraCount}</div>
            <div className="text-[10px] text-emerald-200/80 font-semibold mt-0.5">{lang === 'ja' ? 'ポータル個別利用' : 'Portal Mandiri'}</div>
          </div>
        </div>

        {/* Real-time Firebase Sync Bar for Admin & Roles */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <FirebaseSyncControlBar domain="admins" variant="compact" />
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('ACCOUNTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'ACCOUNTS'
              ? 'bg-purple-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'ja' ? `全アカウント一覧＆ロール権限 (${filteredAccounts.length})` : `Daftar Seluruh Akun & Otoritas Role (${filteredAccounts.length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('AUDIT_LOG')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'AUDIT_LOG'
              ? 'bg-purple-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{lang === 'ja' ? `監査ログ＆ロール任命履歴 (${(masterSettings.roleAuditLogs || []).length})` : `Log Audit & Riwayat Penunjukan Role (${(masterSettings.roleAuditLogs || []).length})`}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SECURITY_POLICY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'SECURITY_POLICY'
              ? 'bg-purple-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{lang === 'ja' ? 'ロール別アクセス権限マトリクス' : 'Matriks Hak Akses Per Role'}</span>
        </button>
      </div>

      {/* SUB-TAB 1: ACCOUNTS LIST */}
      {activeSubTab === 'ACCOUNTS' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={lang === 'ja' ? '氏名、メール、ID、役職、部署で検索...' : 'Cari berdasarkan nama, email, NIK, peran, atau departemen...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-purple-500 focus:bg-white transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Role Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'ja' ? 'すべての権限 (Roles)' : 'Semua Peran (Roles)'}</option>
                  <option value="SUPER_ADMIN">👑 {lang === 'ja' ? 'スーパー管理者' : 'Super Admin'}</option>
                  <option value="ADMIN_2">⚡ {lang === 'ja' ? 'Admin Doc (CV/求人/マッチング)' : 'Admin Doc (CV Portal & Matching)'}</option>
                  <option value="ADMIN_1">🏛️ {lang === 'ja' ? '生徒管理 (SIM-SB IJEF)' : 'Admin Siswa (SIM-SB IJEF)'}</option>
                  <option value="MARKETING">📢 {lang === 'ja' ? 'マーケティング＆CRM' : 'Tim Marketing & CRM'}</option>
                  <option value="STAFF">🩺 {lang === 'ja' ? '医療・HR・財務スタッフ' : 'Tim Medis, HR & Keuangan'}</option>
                  <option value="MITRA">🤝 {lang === 'ja' ? '提携機関 / LPK' : 'Mitra / LPK Partner'}</option>
                  <option value="SISWA">🎓 {lang === 'ja' ? '生徒 / 候補者' : 'Siswa / Kandidat'}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === 'ja' ? 'すべての状態' : 'Semua Status'}</option>
                  <option value="AKTIF">🟢 {lang === 'ja' ? '有効' : 'Aktif'}</option>
                  <option value="NONAKTIF">🔴 {lang === 'ja' ? '無効・停止中' : 'Nonaktif'}</option>
                </select>
              </div>

              {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 px-2 py-1 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* ACCOUNTS TABLE */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-4">Identitas Akun</th>
                  <th className="p-3.5">Role & Otoritas</th>
                  <th className="p-3.5">Departemen / Divisi</th>
                  <th className="p-3.5">Akses Portal</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center pr-4">Aksi Wewenang Admin Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold">Tidak ada akun yang sesuai kriteria pencarian.</p>
                      <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau reset filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc, idx) => {
                    const isSuper = acc.isSuperAdmin;
                    return (
                      <tr
                        key={`${acc.id}-${idx}`}
                        className={`hover:bg-purple-50/40 transition ${
                          isSuper ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* 1. Identitas Akun */}
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center border shadow-xs shrink-0 ${
                                isSuper
                                  ? 'bg-amber-100 text-amber-900 border-amber-400 ring-2 ring-amber-400/30'
                                  : acc.roleCategory === 'ADMIN_2'
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : acc.roleCategory === 'ADMIN_1'
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  : acc.roleCategory === 'MARKETING'
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : acc.roleCategory === 'MITRA'
                                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {isSuper ? '👑' : acc.roleCategory === 'MARKETING' ? '📢' : acc.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                                <span>{acc.name}</span>
                                {isSuper && (
                                  <span className="bg-amber-400/20 text-amber-900 border border-amber-400 text-[9px] font-black px-1.5 py-0.2 rounded">
                                    SUPER ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                                <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{acc.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role & Otoritas */}
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                              isSuper
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                                : acc.roleCategory === 'ADMIN_2'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : acc.roleCategory === 'ADMIN_1'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : acc.roleCategory === 'MARKETING'
                                ? 'bg-orange-50 text-orange-800 border-orange-300 font-bold'
                                : acc.roleCategory === 'MITRA'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {isSuper && <Crown className="w-3 h-3 text-amber-600" />}
                            {acc.roleCategory === 'MARKETING' && <Megaphone className="w-3 h-3 text-orange-600" />}
                            <span>{acc.role}</span>
                          </span>
                        </td>

                        {/* 3. Departemen */}
                        <td className="p-3.5 text-[11px] font-medium text-slate-700">
                          {acc.department}
                        </td>

                        {/* 4. Akses Portal */}
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              acc.portalAccess === 'ALL_PORTALS'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : acc.portalAccess === 'ADMIN_2_CV_PORTAL'
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : acc.portalAccess === 'ADMIN_1_IJEF'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : acc.portalAccess === 'MARKETING_PORTAL'
                                ? 'bg-orange-50 text-orange-800 border-orange-300'
                                : acc.portalAccess === 'MITRA_PORTAL'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {acc.portalAccess === 'ALL_PORTALS'
                              ? '🌐 Semua Portal'
                              : acc.portalAccess === 'ADMIN_2_CV_PORTAL'
                              ? '⚡ Admin Doc (CV)'
                              : acc.portalAccess === 'ADMIN_1_IJEF'
                              ? '🏛️ Admin Siswa (IJEF)'
                              : acc.portalAccess === 'MARKETING_PORTAL'
                              ? '📢 Marketing CRM'
                              : acc.portalAccess === 'MITRA_PORTAL'
                              ? '🤝 Portal Mitra'
                              : '🎓 Portal Siswa'}
                          </span>
                        </td>

                        {/* 5. Status */}
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 cursor-pointer transition ${
                              acc.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                acc.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{acc.status}</span>
                          </button>
                        </td>

                        {/* 6. Action Column */}
                        <td className="p-3.5 pr-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {!isSuper && (
                              <button
                                type="button"
                                onClick={() => handleQuickPromoteToSuperAdmin(acc)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                                title="Promosikan Akun Ini Menjadi Super Admin"
                              >
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Tunjuk Super</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingAccount(acc)}
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                              title="Edit Data & Otoritas Role"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setResetPassAccount(acc);
                                setNewPasswordInput('AdminIJEF2026!');
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Reset Password / PIN Akun"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc)}
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

      {/* SUB-TAB 2: AUDIT LOG */}
      {activeSubTab === 'AUDIT_LOG' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>Log Audit & Rekam Jejak Otoritas Admin</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Setiap tindakan penunjukan role, promosi Super Admin, dan perubahan hak akses tercatat secara permanen di sini.
              </p>
            </div>
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full border border-purple-200">
              {(masterSettings.roleAuditLogs || []).length} Log Tercatat
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="p-3 pl-4">Waktu</th>
                  <th className="p-3">Pelaksana (Actor)</th>
                  <th className="p-3">Tindakan Otoritas</th>
                  <th className="p-3">Target Akun</th>
                  <th className="p-3">Role Ditugaskan</th>
                  <th className="p-3 pr-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {(masterSettings.roleAuditLogs || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Belum ada riwayat perubahan otoritas role.
                    </td>
                  </tr>
                ) : (
                  (masterSettings.roleAuditLogs || []).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 pl-4 text-[10px] font-mono text-slate-500">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div>{log.actorName}</div>
                        <div className="text-[10px] text-purple-700">{log.actorRole}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'APPOINT_SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : log.action === 'CREATE_ADMIN'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : log.action === 'DELETE_ACCOUNT'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300'
                          }`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{log.targetUserName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{log.targetUserEmail}</div>
                      </td>
                      <td className="p-3 font-bold text-purple-800">{log.assignedRole}</td>
                      <td className="p-3 pr-4 text-slate-600 text-[11px]">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SECURITY POLICY MATRIX */}
      {activeSubTab === 'SECURITY_POLICY' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Matriks Hierarki & Wewenang Per Role Sistem</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar baku pembagian tanggung jawab modul kerja di lingkungan LPK IJEF & CV Portal Jepang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Super Admin */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-300 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-black text-sm">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>👑 Super Administrator</span>
              </div>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Pemegang otoritas tertinggi dengan hak bypass ke seluruh modul: kelola semua akun admin, delegasi role, otorisasi dana talang, dan sinkronisasi Cloud Firestore.
              </p>
              <div className="pt-2 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: ALL_PORTALS (Akses Penuh)
              </div>
            </div>

            {/* Admin Doc */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 rounded-2xl border border-purple-300 space-y-2">
              <div className="flex items-center space-x-2 text-purple-900 font-black text-sm">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>⚡ Admin Doc (CV Portal & Matching)</span>
              </div>
              <p className="text-xs text-purple-800/90 leading-relaxed">
                Pengelola sentral lowongan kerja Jepang, kurasi dan verifikasi CV JIS Rirekisho, jadwal interview Zoom dengan Kumiai, pendaftaran siswa ke job, serta otorisasi role sistem.
              </p>
              <div className="pt-2 text-[10px] font-bold text-purple-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: ADMIN_2_CV_PORTAL + User Management
              </div>
            </div>

            {/* Tim Marketing & CRM */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border border-orange-300 space-y-2">
              <div className="flex items-center space-x-2 text-orange-900 font-black text-sm">
                <Megaphone className="w-4 h-4 text-orange-600" />
                <span>📢 Tim Marketing & CRM Intake</span>
              </div>
              <p className="text-xs text-orange-800/90 leading-relaxed">
                Pengelolaan leads calon siswa (CRM), follow up WhatsApp, manajemen kampanye & iklan digital, program komisi referral/afiliasi mitra, live chat konseling pendaftaran, serta analitik intake.
              </p>
              <div className="pt-2 text-[10px] font-bold text-orange-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: MARKETING_PORTAL (CRM & Pemasaran)
              </div>
            </div>

            {/* Admin Siswa */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-300 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-900 font-black text-sm">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>🏛️ Admin Siswa (SIM-SB IJEF)</span>
              </div>
              <p className="text-xs text-indigo-800/90 leading-relaxed">
                Pengelola pendaftaran awal siswa, verifikasi kelengkapan berkas fisik/dokumen, pengelolaan modul skrining kesehatan MCU, tes DISC, dan asesmen psikotes.
              </p>
              <div className="pt-2 text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: ADMIN_1_IJEF
              </div>
            </div>

            {/* Mitra */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 p-4 rounded-2xl border border-teal-300 space-y-2">
              <div className="flex items-center space-x-2 text-teal-900 font-black text-sm">
                <Briefcase className="w-4 h-4 text-teal-600" />
                <span>🤝 Mitra LPK & TSK Partner</span>
              </div>
              <p className="text-xs text-teal-800/90 leading-relaxed">
                Portal mandiri mitra untuk melihat katalog lowongan aktif yang dikelola Admin Doc, menominasikan siswa binaan yang siap matching, dan memantau status seleksi.
              </p>
              <div className="pt-2 text-[10px] font-bold text-teal-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: MITRA_PORTAL
              </div>
            </div>

            {/* Tim Medis & Psikolog */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl border border-blue-300 space-y-2">
              <div className="flex items-center space-x-2 text-blue-900 font-black text-sm">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>🩺 Tim Medis Dokter & Evaluator</span>
              </div>
              <p className="text-xs text-blue-800/90 leading-relaxed">
                Input dan verifikasi data rekam medis Medical Check-Up (MCU), diagnosa fisik, serta scoring asesmen psikologi kandidat sesuai standar kerja di Jepang.
              </p>
              <div className="pt-2 text-[10px] font-bold text-blue-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: Modul MCU & Psikotes
              </div>
            </div>

            {/* HR Legal & Finance */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-300 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 font-black text-sm">
                <Scale className="w-4 h-4 text-slate-600" />
                <span>⚖️ HR Legal & Keuangan</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Validasi kontrak surat perjanjian penempatan LPK, review penjamin, serta pemrosesan skema pengajuan dana talang dan verifikasi cicilan siswa.
              </p>
              <div className="pt-2 text-[10px] font-bold text-slate-900 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> Akses: Modul Kontrak & Dana Talang
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: TUNJUK / BUAT SUPER ADMIN */}
      {/* ========================================== */}
      {showAppointSuperAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleAppointSuperAdmin}
            className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full text-slate-800 shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-150"
          >
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Tunjuk / Buat Super Administrator</h3>
                  <p className="text-[11px] text-amber-100">Otorisasi Hak Akses Penuh Sistem (Wewenang Admin Doc & Super Admin)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointSuperAdminModal(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              {/* Otoritas Warning Card */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-900 block text-xs">Peringatan Keamanan & Hak Istimewa</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Akun yang ditunjuk sebagai <strong>Super Admin</strong> akan memiliki akses tak terbatas ke seluruh modul: mengelola akun staf, menunjuk role lain, otorisasi dana talang, dan sinkronisasi cloud database.
                  </p>
                </div>
              </div>

              {/* Target Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppointTargetMode('EXISTING')}
                  className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 cursor-pointer ${
                    appointTargetMode === 'EXISTING'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span>Pilih Akun yang Sudah Ada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAppointTargetMode('NEW')}
                  className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 cursor-pointer ${
                    appointTargetMode === 'NEW'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-purple-600" />
                  <span>Buat Akun Super Admin Baru</span>
                </button>
              </div>

              {appointTargetMode === 'EXISTING' ? (
                <div className="space-y-2">
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Pilih Pengguna / Administrator:
                  </label>
                  <select
                    value={selectedExistingUserId}
                    onChange={(e) => setSelectedExistingUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  >
                    <option value="">-- Pilih Akun Target --</option>
                    {allAccounts
                      .filter((a) => !a.isSuperAdmin)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — ({acc.email}) | Role Saat Ini: {acc.role}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                      Nama Lengkap Super Admin:
                    </label>
                    <input
                      type="text"
                      value={newSuperAdminForm.name}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, name: e.target.value })}
                      placeholder="Contoh: Direktur Operasional / Ir. H. Ahmad"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                        Email Login:
                      </label>
                      <input
                        type="email"
                        value={newSuperAdminForm.email}
                        onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, email: e.target.value })}
                        placeholder="superadmin@ijefcorp.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                        No. HP / WhatsApp:
                      </label>
                      <input
                        type="text"
                        value={newSuperAdminForm.phone}
                        onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, phone: e.target.value })}
                        placeholder="0812xxxxxxxx"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                      Kata Sandi Default:
                    </label>
                    <input
                      type="text"
                      value={newSuperAdminForm.password}
                      onChange={(e) => setNewSuperAdminForm({ ...newSuperAdminForm, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAppointSuperAdminModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>Sah & Tunjuk Super Admin</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: BUAT AKUN BARU DENGAN ROLE TERTENTU */}
      {/* ========================================== */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleCreateAccount}
            className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full text-slate-800 shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-150"
          >
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Tambah Akun Baru Sistem</h3>
                  <p className="text-[11px] text-slate-400">Tentukan Role, Hak Akses Modul & Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Nama Lengkap / Instansi:
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nama staf / admin / mitra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Email Login:
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@ijefcorp.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Pilih Peran (Role):
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminRole;
                      let suggestedPortal: any = 'ADMIN_2_CV_PORTAL';
                      let dept = createForm.department;
                      let perms = [...createForm.permissions];

                      if (newRole === 'SuperAdmin') {
                        suggestedPortal = 'ALL_PORTALS';
                        dept = 'Direksi Eksekutif & IT Back-Office';
                        perms = AVAILABLE_PERMISSIONS.map((p) => p.id);
                      } else if (
                        newRole === 'Marketing Manager' ||
                        newRole === 'Staff Marketing & Konselor' ||
                        newRole === 'Digital Marketer & Ads' ||
                        newRole === 'Telemarketing & CS' ||
                        newRole === 'Field Acquisition & Referral' ||
                        newRole === 'Content Creator & Media Promosi'
                      ) {
                        suggestedPortal = 'MARKETING_PORTAL';
                        dept = 'Divisi Marketing & CRM Intake';
                        perms = [
                          'MANAGE_MARKETING_LEADS',
                          'MANAGE_MARKETING_CAMPAIGNS',
                          'MANAGE_MARKETING_AFFILIATES',
                          'MANAGE_MARKETING_CHATS'
                        ];
                      } else if (newRole.includes('Admin 1') || newRole.includes('Admin Siswa')) {
                        suggestedPortal = 'ADMIN_1_IJEF';
                        dept = 'Divisi Operasional & Pendaftaran IJEF';
                      } else if (newRole.includes('Mitra')) {
                        suggestedPortal = 'MITRA_PORTAL';
                        dept = 'LPK Mitra Daerah / Sending Partner';
                      } else if (newRole.includes('Dokter')) {
                        suggestedPortal = 'ADMIN_1_IJEF';
                        dept = 'Tim Medis MCU & Kesehatan';
                      } else if (newRole.includes('Finance')) {
                        suggestedPortal = 'ADMIN_1_IJEF';
                        dept = 'Finance & Dana Talang';
                      } else if (newRole.includes('HR Legal')) {
                        suggestedPortal = 'ADMIN_1_IJEF';
                        dept = 'HR, Legal & Kontrak LPK';
                      }

                      setCreateForm({
                        ...createForm,
                        role: newRole,
                        portalAccess: suggestedPortal,
                        department: dept,
                        permissions: perms
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                  >
                    <optgroup label="👑 Direksi & Super Admin">
                      <option value="SuperAdmin">👑 Super Administrator (Akses Penuh)</option>
                    </optgroup>
                    <optgroup label="⚡ Admin Doc & CV Portal">
                      <option value="Admin Doc (CV Portal & Matching)">⚡ Admin Doc (CV Portal & Job Matching)</option>
                      <option value="Admin Matching">💼 Admin Matching & Seleksi</option>
                      <option value="Verifikator CV JIS">📄 Staff Verifikator CV Rirekisho</option>
                      <option value="Sensei / Instruktur">👨‍🏫 Sensei / Instruktur Bahasa Jepang</option>
                    </optgroup>
                    <optgroup label="📢 Divisi Marketing & CRM Pendaftaran">
                      <option value="Marketing Manager">📢 Marketing Manager (Otoritas Leads & Campaign)</option>
                      <option value="Staff Marketing & Konselor">🎯 Staff Marketing & Konselor Pendaftaran</option>
                      <option value="Digital Marketer & Ads">💻 Digital Marketer & Ads Specialist</option>
                      <option value="Telemarketing & CS">📞 Telemarketing & Customer Support</option>
                      <option value="Field Acquisition & Referral">🤝 Field Acquisition & Koordinator Afiliasi</option>
                      <option value="Content Creator & Media Promosi">🎬 Content Creator & Media Promosi</option>
                    </optgroup>
                    <optgroup label="🏛️ Admin Siswa & Operasional IJEF">
                      <option value="Admin Siswa (SIM-SB IJEF)">🏛️ Admin Siswa (SIM-SB Pendaftaran Siswa)</option>
                      <option value="Dokter">🩺 Dokter / Tim Medis MCU</option>
                      <option value="HR Legal">⚖️ HR Legal & Kontrak LPK</option>
                      <option value="Finance">💰 Staff Finance & Dana Talang</option>
                    </optgroup>
                    <optgroup label="🤝 Mitra & Siswa">
                      <option value="Mitra LPK">🤝 Mitra LPK / TSK Partner</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Akses Portal Utama:
                  </label>
                  <select
                    value={createForm.portalAccess}
                    onChange={(e) => setCreateForm({ ...createForm, portalAccess: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                  >
                    <option value="ALL_PORTALS">🌐 Semua Portal (Super Admin / Direksi)</option>
                    <option value="ADMIN_2_CV_PORTAL">⚡ Admin Doc - CV Portal & Job Matching</option>
                    <option value="MARKETING_PORTAL">📢 Portal Marketing - CRM & Akuisisi Siswa</option>
                    <option value="ADMIN_1_IJEF">🏛️ Admin Siswa - SIM-SB & Operasional IJEF</option>
                    <option value="MITRA_PORTAL">🤝 Portal Mitra LPK / TSK</option>
                    <option value="STUDENT_PORTAL">🎓 Portal Siswa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Departemen / Divisi:
                  </label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Kata Sandi Awal:
                  </label>
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Granular Permissions Checkbox List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Hak Akses & Otoritas Modul:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = createForm.role === 'SuperAdmin' || createForm.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start space-x-2 p-2 rounded-lg border transition cursor-pointer ${
                          isChecked ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={createForm.role === 'SuperAdmin'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({
                                ...createForm,
                                permissions: [...createForm.permissions, perm.id]
                              });
                            } else {
                              setCreateForm({
                                ...createForm,
                                permissions: createForm.permissions.filter((p) => p !== perm.id)
                              });
                            }
                          }}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="text-[11px]">
                          <div>{perm.label}</div>
                          <div className="text-[9px] text-slate-500 font-normal">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateAccountModal(false)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>Simpan & Daftarkan Akun</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: EDIT DATA & ROLE AKUN */}
      {/* ========================================== */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleSaveEditAccount}
            className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full text-slate-800 shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-150"
          >
            <div className="bg-purple-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Ubah Peran & Hak Akses Akun</h3>
                  <p className="text-[11px] text-purple-200">{editingAccount.name} ({editingAccount.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-800 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Nama Lengkap:
                  </label>
                  <input
                    type="text"
                    value={editingAccount.name}
                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Peran (Role):
                  </label>
                  <select
                    value={editingAccount.role}
                    onChange={(e) => {
                      const newRole = e.target.value as AdminRole;
                      const isSuper = newRole === 'SuperAdmin';
                      let portal = editingAccount.portalAccess;
                      if (isSuper) {
                        portal = 'ALL_PORTALS';
                      } else if (
                        newRole === 'Marketing Manager' ||
                        newRole === 'Staff Marketing & Konselor' ||
                        newRole === 'Digital Marketer & Ads' ||
                        newRole === 'Telemarketing & CS' ||
                        newRole === 'Field Acquisition & Referral' ||
                        newRole === 'Content Creator & Media Promosi'
                      ) {
                        portal = 'MARKETING_PORTAL';
                      }
                      setEditingAccount({
                        ...editingAccount,
                        role: newRole,
                        isSuperAdmin: isSuper,
                        portalAccess: portal
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                  >
                    <optgroup label="👑 Direksi & Super Admin">
                      <option value="SuperAdmin">👑 Super Administrator (Akses Penuh)</option>
                    </optgroup>
                    <optgroup label="⚡ Admin Doc & CV Portal">
                      <option value="Admin Doc (CV Portal & Matching)">⚡ Admin Doc (CV Portal & Job Matching)</option>
                      <option value="Admin Matching">💼 Admin Matching & Seleksi</option>
                      <option value="Verifikator CV JIS">📄 Staff Verifikator CV Rirekisho</option>
                      <option value="Sensei / Instruktur">👨‍🏫 Sensei / Instruktur Bahasa Jepang</option>
                    </optgroup>
                    <optgroup label="📢 Divisi Marketing & CRM Pendaftaran">
                      <option value="Marketing Manager">📢 Marketing Manager (Otoritas Leads & Campaign)</option>
                      <option value="Staff Marketing & Konselor">🎯 Staff Marketing & Konselor Pendaftaran</option>
                      <option value="Digital Marketer & Ads">💻 Digital Marketer & Ads Specialist</option>
                      <option value="Telemarketing & CS">📞 Telemarketing & Customer Support</option>
                      <option value="Field Acquisition & Referral">🤝 Field Acquisition & Koordinator Afiliasi</option>
                      <option value="Content Creator & Media Promosi">🎬 Content Creator & Media Promosi</option>
                    </optgroup>
                    <optgroup label="🏛️ Admin Siswa & Operasional IJEF">
                      <option value="Admin Siswa (SIM-SB IJEF)">🏛️ Admin Siswa (SIM-SB Pendaftaran Siswa)</option>
                      <option value="Dokter">🩺 Dokter / Tim Medis MCU</option>
                      <option value="HR Legal">⚖️ HR Legal & Kontrak LPK</option>
                      <option value="Finance">💰 Staff Finance & Dana Talang</option>
                    </optgroup>
                    <optgroup label="🤝 Mitra & Siswa">
                      <option value="Mitra LPK">🤝 Mitra LPK / TSK Partner</option>
                      <option value="Siswa">🎓 Siswa / Kandidat</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Akses Portal:
                  </label>
                  <select
                    value={editingAccount.portalAccess}
                    onChange={(e) => setEditingAccount({ ...editingAccount, portalAccess: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                  >
                    <option value="ALL_PORTALS">🌐 Semua Portal</option>
                    <option value="ADMIN_2_CV_PORTAL">⚡ Admin Doc - CV Portal</option>
                    <option value="MARKETING_PORTAL">📢 Portal Marketing - CRM & Akuisisi Siswa</option>
                    <option value="ADMIN_1_IJEF">🏛️ Admin Siswa - SIM-SB IJEF</option>
                    <option value="MITRA_PORTAL">🤝 Portal Mitra</option>
                    <option value="STUDENT_PORTAL">🎓 Portal Siswa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Departemen / Divisi:
                  </label>
                  <input
                    type="text"
                    value={editingAccount.department}
                    onChange={(e) => setEditingAccount({ ...editingAccount, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                    Status Akun:
                  </label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                  >
                    <option value="Aktif">🟢 Aktif</option>
                    <option value="Nonaktif">🔴 Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkbox List for Edit */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Kustomisasi Hak Akses Modul:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = editingAccount.role === 'SuperAdmin' || editingAccount.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start space-x-2 p-2 rounded-lg border transition cursor-pointer ${
                          isChecked ? 'bg-purple-50/70 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={editingAccount.role === 'SuperAdmin'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingAccount({
                                ...editingAccount,
                                permissions: [...editingAccount.permissions, perm.id]
                              });
                            } else {
                              setEditingAccount({
                                ...editingAccount,
                                permissions: editingAccount.permissions.filter((p) => p !== perm.id)
                              });
                            }
                          }}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="text-[11px]">
                          <div>{perm.label}</div>
                          <div className="text-[9px] text-slate-500 font-normal">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Role</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: RESET PASSWORD AKUN */}
      {/* ========================================== */}
      {resetPassAccount && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full text-slate-800 shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in duration-150"
          >
            <div className="bg-amber-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Reset Kata Sandi Akun</h3>
                  <p className="text-[11px] text-amber-100">{resetPassAccount.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPassAccount(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <p>
                Masukkan kata sandi baru untuk akun <strong>{resetPassAccount.name}</strong> ({resetPassAccount.email}):
              </p>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Kata Sandi Baru:
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('AdminIJEF2026!')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                >
                  Gunakan: AdminIJEF2026!
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordInput('SiswaIJEF2026!')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold"
                >
                  Gunakan: SiswaIJEF2026!
                </button>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setResetPassAccount(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer text-xs"
              >
                <Key className="w-4 h-4" />
                <span>Simpan Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
