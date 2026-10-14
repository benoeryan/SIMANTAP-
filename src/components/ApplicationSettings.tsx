import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import { isSuperAdminUser } from '../utils/authUtils';
import { formatRupiah } from '../utils/financingCalculator';
import {
  AdminRole,
  AdminUser,
  ApprovalRule,
  BatchRegistration,
  DiscRoleMapping
} from '../types';
import {
  Settings,
  Coins,
  Award,
  Calendar,
  ShieldCheck,
  Users,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Info,
  Lock,
  FileText,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Check,
  X,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  Edit3,
  Edit,
  Phone,
  Mail,
  Building,
  Key,
  Shield,
  CheckSquare,
  Square,
  Search,
  UserCheck,
  AlertTriangle,
  Copy,
  ExternalLink,
  Sliders
} from 'lucide-react';

const getAvailablePermissions = (isJa: boolean) => [
  { id: 'Akses SIBAL LPK', label: isJa ? 'LPK管理アクセス（受講生管理ポータル）' : 'Akses SIBAL LPK (Admin Siswa Portal)', desc: isJa ? '受講生管理、マスターデータ、会計＆契約' : 'Pengelolaan siswa, master data, keuangan & kontrak' },
  { id: 'Akses CV Portal & Job Matching', label: isJa ? 'CVポータル＆求人マッチング（JIS文書ポータル）' : 'Akses CV Portal JIS (Admin Doc Portal)', desc: isJa ? '求人マッチング、CV検証、面接＆配属管理' : 'Job matching, verifikasi CV, interview & penempatan' },
  { id: 'Skrining Medis & MCU Medis', label: isJa ? '健康診断・MCUスクリーニング（医師）' : 'Skrining Medis & MCU Medis (Dokter)', desc: isJa ? 'MCU結果入力、適格/不適格判定、健康履歴' : 'Input hasil MCU, fit/unfit, dan riwayat kesehatan' },
  { id: 'Uji DISC & Asesmen Psikotes', label: isJa ? 'DISC適性検査＆心理テスト（HR/心理担当）' : 'Uji DISC & Asesmen Psikotes (HR/Psikolog)', desc: isJa ? '性格診断、論理的思考力＆正確性評価' : 'Penilaian kepribadian, logika & ketelitian' },
  { id: 'Persetujuan & Dana Talang', label: isJa ? '立替金援助・融資承認（経理・財務）' : 'Persetujuan Dana Talang (Finance)', desc: isJa ? '保証人審査、返済期間、立替金実行確認' : 'Verifikasi jaminan, tenor, dan pencairan talangan' },
  { id: 'Pengesahan Kontrak & Legalitas', label: isJa ? '契約締結＆法的確認（法務・HR）' : 'Pengesahan Kontrak & Legalitas (HR Legal)', desc: isJa ? '提携契約書および受講生合意書のドラフト作成' : 'Drafting kontrak kerja sama dan perjanjian siswa' },
  { id: 'Pengaturan Master & RBAC Management', label: isJa ? 'マスター設定＆RBAC管理（最高管理者）' : 'Pengaturan Master & RBAC (SuperAdmin)', desc: isJa ? 'グローバル設定、料金、募集枠＆管理者アカウント' : 'Konfigurasi global, tarif, kuota & akun admin' }
];

export const ApplicationSettings: React.FC = () => {
  const { masterSettings, updateMasterSettings } = useApp();
  const {
    lang,
    isJapanese,
    setLang,
    scoped: tCommon,
    bilingual
  } = useEcosystemTranslation('common');
  const { user, updateAdminPassword } = useAuth();

  const availablePermissions = getAvailablePermissions(lang === 'ja' || isJapanese);

  // SuperAdmin Access Control Check using centralized authUtils
  const isSuperAdmin = isSuperAdminUser(user, masterSettings?.adminUsers);

  // Active module tab in sidebar
  const [activeModule, setActiveModule] = useState<
    'financial' | 'scoring' | 'batches' | 'approvals' | 'rbac'
  >('financial');

  // Local state initialized from masterSettings
  const [financialState, setFinancialState] = useState({
    baseProgramCost: masterSettings.baseProgramCost,
    dt100DpPercent: masterSettings.dt100DpPercent,
    dt50DpPercent: masterSettings.dt50DpPercent,
    dp30DpPercent: masterSettings.dp30DpPercent,
    adminFeePercent: masterSettings.adminFeePercent || 2.5,
    tenorOptions: masterSettings.tenorOptions || [3, 6, 12, 18, 24]
  });

  const [scoringState, setScoringState] = useState({
    psikotesPassingThresholdPercent: masterSettings.psikotesPassingThresholdPercent,
    defaultEvaluatorName: masterSettings.defaultEvaluatorName,
    discRoleMappings: masterSettings.discRoleMappings || []
  });

  const [batchState, setBatchState] = useState<BatchRegistration[]>(
    masterSettings.batches || []
  );

  const [approvalState, setApprovalState] = useState<ApprovalRule[]>(
    masterSettings.approvalRules || []
  );

  const [adminUsersState, setAdminUsersState] = useState<AdminUser[]>(
    masterSettings.adminUsers || []
  );

  // Search & Filter for Admin Accounts
  const [searchAdminQuery, setSearchAdminQuery] = useState('');
  const [roleAdminFilter, setRoleAdminFilter] = useState('ALL');
  const [portalAdminFilter, setPortalAdminFilter] = useState('ALL');

  // View, Edit, and Delete Modal States for Admin Accounts
  const [selectedAdminUser, setSelectedAdminUser] = useState<AdminUser | null>(null);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showPasswordInView, setShowPasswordInView] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [editingAdminUser, setEditingAdminUser] = useState<AdminUser | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  const [deletingAdminUser, setDeletingAdminUser] = useState<AdminUser | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);

  // New item modal/form states
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatch, setNewBatch] = useState({
    name: '',
    startDate: '',
    endDate: '',
    quota: 50
  });

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'HR Legal' as AdminRole,
    department: 'HR, Legal & Kontrak LPK',
    portalAccess: 'ADMIN_1_IJEF' as 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL',
    phone: '',
    passwordHint: 'admin123',
    status: 'AKTIF' as 'AKTIF' | 'NONAKTIF' | 'SUSPENDED',
    permissions: ['Akses SIBAL LPK', 'Pengesahan Kontrak & Legalitas'] as string[]
  });

  const [showAddDiscModal, setShowAddDiscModal] = useState(false);
  const [newDiscMapping, setNewDiscMapping] = useState({
    jobSector: '',
    idealDisc: 'Steadiness' as 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance',
    minScorePercent: 70
  });

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRule, setNewRule] = useState({
    targetWorkflow: 'Pencairan Dana Talang' as 'Pencairan Dana Talang' | 'Pengesahan Kontrak',
    stageName: '',
    requiredRole: 'Finance' as AdminRole,
    autoNotify: true
  });

  const [activeWorkflowTab, setActiveWorkflowTab] = useState<
    'Pencairan Dana Talang' | 'Pengesahan Kontrak'
  >('Pencairan Dana Talang');

  // Password update form states
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Password Update Handler calling Firebase Auth updatePassword
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdateStatus(null);

    if (newAdminPassword.length < 6) {
      setPasswordUpdateStatus({
        type: 'error',
        message: 'Kata sandi minimal harus 6 karakter.'
      });
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      setPasswordUpdateStatus({
        type: 'error',
        message: 'Konfirmasi kata sandi baru tidak cocok. Silakan periksa kembali.'
      });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateAdminPassword(newAdminPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordUpdateStatus({
        type: 'success',
        message: 'Kata sandi Administrator berhasil diperbarui di Firebase Auth!'
      });
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      showToast('Kredensial Kata Sandi Admin berhasil diperbarui!');
    } else {
      setPasswordUpdateStatus({
        type: 'error',
        message: res.error || 'Gagal memperbarui kata sandi. Silakan login ulang untuk re-autentikasi.'
      });
    }
  };

  // Master Save Handler
  const handleSaveAll = () => {
    const calculatedPassingScore = Math.round(
      (scoringState.psikotesPassingThresholdPercent / 100) * 50
    );

    updateMasterSettings({
      baseProgramCost: Number(financialState.baseProgramCost),
      dt100DpPercent: Number(financialState.dt100DpPercent),
      dt50DpPercent: Number(financialState.dt50DpPercent),
      dp30DpPercent: Number(financialState.dp30DpPercent),
      adminFeePercent: Number(financialState.adminFeePercent),
      tenorOptions: financialState.tenorOptions,
      psikotesPassingThresholdPercent: Number(scoringState.psikotesPassingThresholdPercent),
      psikotesPassingScore: calculatedPassingScore,
      defaultEvaluatorName: scoringState.defaultEvaluatorName,
      discRoleMappings: scoringState.discRoleMappings,
      batches: batchState,
      approvalRules: approvalState,
      adminUsers: adminUsersState
    });

    showToast('Seluruh Konfigurasi Pengaturan Master berhasil disimpan & disinkronkan ke Firestore!');
  };

  // Financial Helpers
  const toggleTenor = (tenor: number) => {
    setFinancialState((prev) => {
      const exists = prev.tenorOptions.includes(tenor);
      const updated = exists
        ? prev.tenorOptions.filter((t) => t !== tenor)
        : [...prev.tenorOptions, tenor].sort((a, b) => a - b);
      return { ...prev, tenorOptions: updated };
    });
  };

  // Batch Handlers
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.startDate || !newBatch.endDate) return;

    const created: BatchRegistration = {
      id: `b_${Date.now()}`,
      name: newBatch.name,
      startDate: newBatch.startDate,
      endDate: newBatch.endDate,
      quota: Number(newBatch.quota),
      registeredCount: 0,
      status: 'OPEN'
    };

    setBatchState((prev) => [...prev, created]);
    setShowAddBatchModal(false);
    setNewBatch({ name: '', startDate: '', endDate: '', quota: 50 });
    showToast(`Gelombang pendaftaran "${created.name}" berhasil ditambahkan!`);
  };

  const toggleBatchStatus = (batchId: string) => {
    setBatchState((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const nextStatus = b.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const deleteBatch = (batchId: string) => {
    setBatchState((prev) => prev.filter((b) => b.id !== batchId));
    showToast('Gelombang pendaftaran berhasil dihapus');
  };

  // User RBAC Handlers
  const handleViewUser = (u: AdminUser) => {
    setSelectedAdminUser(u);
    setShowPasswordInView(false);
    setCopiedPassword(false);
    setShowViewUserModal(true);
  };

  const handleOpenEditUser = (u: AdminUser) => {
    setEditingAdminUser({
      ...u,
      department: u.department || 'SIBAL LPK Central',
      portalAccess: u.portalAccess || 'ADMIN_1_IJEF',
      status: u.status || 'AKTIF',
      phone: u.phone || '',
      passwordHint: u.passwordHint || 'admin123',
      permissions: u.permissions && u.permissions.length > 0 ? [...u.permissions] : ['Akses SIBAL LPK']
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminUser || !editingAdminUser.name || !editingAdminUser.email) return;

    const currentAdmins = masterSettings.adminUsers || adminUsersState;
    const updated = currentAdmins.map((u) => {
      if (u.id === editingAdminUser.id) {
        return {
          ...u,
          name: editingAdminUser.name,
          email: editingAdminUser.email,
          role: editingAdminUser.role,
          department: editingAdminUser.department || 'SIBAL LPK Central',
          portalAccess: editingAdminUser.portalAccess || 'ADMIN_1_IJEF',
          status: editingAdminUser.status || 'AKTIF',
          phone: editingAdminUser.phone || '',
          passwordHint: editingAdminUser.passwordHint || '',
          permissions: editingAdminUser.permissions || []
        };
      }
      return u;
    });

    setAdminUsersState(updated);
    updateMasterSettings({ adminUsers: updated });
    setShowEditUserModal(false);
    if (selectedAdminUser && selectedAdminUser.id === editingAdminUser.id) {
      setSelectedAdminUser(editingAdminUser);
    }
    showToast(`Akun admin "${editingAdminUser.name}" berhasil diperbarui!`);
  };

  const handleOpenDeleteUser = (u: AdminUser) => {
    setDeletingAdminUser(u);
    setShowDeleteUserModal(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!deletingAdminUser) return;
    const currentAdmins = masterSettings.adminUsers || adminUsersState;
    const updated = currentAdmins.filter((u) => u.id !== deletingAdminUser.id);
    setAdminUsersState(updated);
    updateMasterSettings({ adminUsers: updated });
    setShowDeleteUserModal(false);
    if (showViewUserModal && selectedAdminUser?.id === deletingAdminUser.id) {
      setShowViewUserModal(false);
    }
    showToast(`Akun admin "${deletingAdminUser.name}" berhasil dihapus.`);
    setDeletingAdminUser(null);
  };

  const toggleEditPermission = (permId: string) => {
    if (!editingAdminUser) return;
    const cur = editingAdminUser.permissions || [];
    const next = cur.includes(permId) ? cur.filter((p) => p !== permId) : [...cur, permId];
    setEditingAdminUser({ ...editingAdminUser, permissions: next });
  };

  const toggleNewUserPermission = (permId: string) => {
    const cur = newUser.permissions || [];
    const next = cur.includes(permId) ? cur.filter((p) => p !== permId) : [...cur, permId];
    setNewUser({ ...newUser, permissions: next });
  };

  const handleCopyPassword = (pwd?: string) => {
    if (!pwd) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pwd);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      showToast('Kata sandi berhasil disalin ke clipboard.');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const currentAdmins = masterSettings.adminUsers || adminUsersState;
    const userCreated: AdminUser = {
      id: `ADM-${String(currentAdmins.length + 1).padStart(2, '0')}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department || 'SIBAL LPK Central',
      portalAccess: newUser.portalAccess || 'ADMIN_1_IJEF',
      phone: newUser.phone || '',
      passwordHint: newUser.passwordHint || 'admin123',
      status: newUser.status || 'AKTIF',
      lastLogin: 'Baru saja',
      permissions: newUser.permissions && newUser.permissions.length > 0 ? newUser.permissions : ['Akses SIBAL LPK', 'Pendaftaran & Dokumen']
    };

    const updated = [userCreated, ...currentAdmins];
    setAdminUsersState(updated);
    updateMasterSettings({ adminUsers: updated });
    setShowAddUserModal(false);
    setNewUser({
      name: '',
      email: '',
      role: 'HR Legal',
      department: 'HR, Legal & Kontrak LPK',
      portalAccess: 'ADMIN_1_IJEF',
      phone: '',
      passwordHint: 'admin123',
      status: 'AKTIF',
      permissions: ['Akses SIBAL LPK', 'Pengesahan Kontrak & Legalitas']
    });
    showToast(`Pengguna Admin "${userCreated.name}" berhasil ditambahkan!`);
  };

  const toggleUserStatus = (userId: string) => {
    const currentAdmins = masterSettings.adminUsers || adminUsersState;
    const updated = currentAdmins.map((u) => {
      if (u.id === userId) {
        const isAktif = u.status === 'AKTIF' || u.status === 'Aktif';
        return {
          ...u,
          status: (isAktif ? 'NONAKTIF' : 'AKTIF') as any
        };
      }
      return u;
    });
    setAdminUsersState(updated);
    updateMasterSettings({ adminUsers: updated });
  };

  const deleteUser = (userId: string) => {
    const userToDelete = (masterSettings.adminUsers || adminUsersState).find((u) => u.id === userId);
    if (userToDelete) {
      handleOpenDeleteUser(userToDelete);
    }
  };

  // DISC Mapping Handlers
  const handleAddDiscMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscMapping.jobSector) return;

    const created: DiscRoleMapping = {
      id: `disc_${Date.now()}`,
      jobSector: newDiscMapping.jobSector,
      idealDisc: newDiscMapping.idealDisc,
      minScorePercent: Number(newDiscMapping.minScorePercent)
    };

    setScoringState((prev) => ({
      ...prev,
      discRoleMappings: [...prev.discRoleMappings, created]
    }));
    setShowAddDiscModal(false);
    setNewDiscMapping({ jobSector: '', idealDisc: 'Steadiness', minScorePercent: 70 });
    showToast(`Sektor Pekerjaan "${created.jobSector}" berhasil ditambahkan.`);
  };

  const deleteDiscMapping = (id: string) => {
    setScoringState((prev) => ({
      ...prev,
      discRoleMappings: prev.discRoleMappings.filter((m) => m.id !== id)
    }));
  };

  // Approval Rule Handlers
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.stageName) return;

    const rulesForTarget = approvalState.filter((r) => r.targetWorkflow === newRule.targetWorkflow);

    const created: ApprovalRule = {
      id: `appr_${Date.now()}`,
      targetWorkflow: newRule.targetWorkflow,
      stageName: newRule.stageName,
      requiredRole: newRule.requiredRole,
      order: rulesForTarget.length + 1,
      autoNotify: newRule.autoNotify
    };

    setApprovalState((prev) => [...prev, created]);
    setShowAddRuleModal(false);
    setNewRule({
      targetWorkflow: 'Pencairan Dana Talang',
      stageName: '',
      requiredRole: 'Finance',
      autoNotify: true
    });
    showToast(`Tahapan Persetujuan "${created.stageName}" ditambahkan.`);
  };

  const deleteRule = (id: string) => {
    setApprovalState((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-emerald-600 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <div className="bg-slate-50 text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-xs tracking-wider uppercase">
            <Settings className="w-4 h-4" />
            <span>{lang === 'ja' ? 'LPK IJEF CORP マスター設定・管理コンフィグ' : 'KONFIGURASI PENGATURAN MASTER LPK IJEF CORP'}</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {lang === 'ja' ? '情報システム ＆ バックオフィス・コントロールセンター' : 'Sistem Informasi & Control Center Back-Office'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {lang === 'ja'
              ? '費用パラメータ、心理テスト＆DISC基準、募集期次定員、多段階承認、およびロール権限（RBAC）を設定します。'
              : 'Atur parameter pembiayaan, kriteria psikotes & DISC, kuota gelombang, persetujuan bertingkat, serta hak akses pengguna (RBAC).'}
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{lang === 'ja' ? '全設定を保存' : 'Simpan Seluruh Pengaturan'}</span>
        </button>
      </div>

      {/* Layout Grid: Left Sidebar Tabs + Right Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1 flex lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-1.5 lg:space-x-0 scrollbar-thin scrollbar-thumb-slate-200">
            <span className="text-[10px] font-bold text-slate-400 px-3 py-1 hidden lg:block uppercase tracking-wider">
              {lang === 'ja' ? '設定モジュール' : 'Modul Konfigurasi'}
            </span>

            <button
              onClick={() => setActiveModule('financial')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 lg:shrink ${
                activeModule === 'financial'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span>{lang === 'ja' ? '1. 資金援助・立替金' : '1. Pembiayaan & Dana Talang'}</span>
            </button>

            <button
              onClick={() => setActiveModule('scoring')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 lg:shrink ${
                activeModule === 'scoring'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 shrink-0" />
              <span>{lang === 'ja' ? '2. 合格基準 ＆ DISC' : '2. Ambang Kelulusan & DISC'}</span>
            </button>

            <button
              onClick={() => setActiveModule('batches')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 lg:shrink ${
                activeModule === 'batches'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{lang === 'ja' ? '3. 募集期次 ＆ 定員' : '3. Gelombang & Kuota'}</span>
            </button>

            <button
              onClick={() => setActiveModule('approvals')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 lg:shrink ${
                activeModule === 'approvals'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>{lang === 'ja' ? '4. 多段階承認フロー' : '4. Persetujuan Bertingkat'}</span>
            </button>

            <button
              onClick={() => setActiveModule('rbac')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 lg:shrink ${
                activeModule === 'rbac'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{lang === 'ja' ? '5. ロール ＆ 権限管理 (RBAC)' : '5. Role & Hak Akses (RBAC)'}</span>
            </button>
          </div>

          {/* Quick System Summary Box */}
          <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ja' ? 'Firestoreシステム状態' : 'Status Sistem Firestore'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lang === 'ja' ? 'ドキュメント:' : 'Dokumen:'} <code className="text-amber-300">pengaturan_master/global_config</code>
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{lang === 'ja' ? '同期モード' : 'Sinkronisasi'}</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <Check className="w-3.0 h-3.0" />
                <span>{lang === 'ja' ? '自動リアルタイム' : 'Otomatis'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Area (3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* ========================================================= */}
          {/* MODULE 1: MANAJEMEN PEMBIAYAAN & DANA TALANG */}
          {/* ========================================================= */}
          {activeModule === 'financial' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ja' ? '1. 費用パラメータ＆立替金支援プログラム設定' : '1. Parameter Pembiayaan & Program Dana Talang'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ja'
                      ? '標準研修費用、頭金（DP）プラン、管理手数料率、利用可能な分割返済期間（回数）を設定します。'
                      : 'Atur biaya standar pelatihan, skema DP, persen biaya admin, serta pilihan tenor angsuran.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Program Cost & Admin Fee */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ja' ? 'LPK標準研修費用 (Base Program Cost)' : 'Biaya Standar Pelatihan LPK (Base Program Cost)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        value={financialState.baseProgramCost}
                        onChange={(e) =>
                          setFinancialState((prev) => ({ ...prev, baseProgramCost: Number(e.target.value) }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'ja' ? '換算表示: ' : 'Terbaca: '}<strong className="text-amber-700">{formatRupiah(financialState.baseProgramCost)}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'ja' ? '立替金管理・事務手数料率 (%)' : 'Biaya Administrasi & Operasional Dana Talang (%)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={financialState.adminFeePercent}
                        onChange={(e) =>
                          setFinancialState((prev) => ({ ...prev, adminFeePercent: Number(e.target.value) }))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {lang === 'ja' ? '立替金融資総額に対して適用されます。' : 'Dikenakan pada plafond pinjaman Dana Talang.'}
                    </p>
                  </div>
                </div>

                {/* Down Payment Tiers */}
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-700">
                    {lang === 'ja' ? '各プランの頭金（Down Payment - DP）割合' : 'Persentase Uang Muka (Down Payment - DP) Per Skema'}
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="block text-[11px] font-bold text-slate-600 mb-1">DT 100% (No DP)</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={financialState.dt100DpPercent}
                          onChange={(e) =>
                            setFinancialState((prev) => ({ ...prev, dt100DpPercent: Number(e.target.value) }))
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1.5 text-xs font-bold text-slate-800"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="block text-[11px] font-bold text-slate-600 mb-1">DT 50%</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={financialState.dt50DpPercent}
                          onChange={(e) =>
                            setFinancialState((prev) => ({ ...prev, dt50DpPercent: Number(e.target.value) }))
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1.5 text-xs font-bold text-slate-800"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="block text-[11px] font-bold text-slate-600 mb-1">DP 30%</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={financialState.dp30DpPercent}
                          onChange={(e) =>
                            setFinancialState((prev) => ({ ...prev, dp30DpPercent: Number(e.target.value) }))
                          }
                          className="w-full bg-white border border-slate-300 rounded-lg pl-2 pr-6 py-1.5 text-xs font-bold text-slate-800"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tenor Toggle Switches */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  {lang === 'ja' ? '利用可能な返済期間（クリックで有効/無効を切替）' : 'Opsi Tenor Angsuran Tersedia (Klik untuk Mengaktifkan/Menegecualikan)'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {[3, 6, 12, 18, 24, 36].map((tenor) => {
                    const active = financialState.tenorOptions.includes(tenor);
                    return (
                      <button
                        key={tenor}
                        type="button"
                        onClick={() => toggleTenor(tenor)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border cursor-pointer ${
                          active
                            ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        {active ? (
                          <ToggleRight className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{tenor} {lang === 'ja' ? 'ヶ月' : 'Bulan'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODULE 2: AMBANG KELULUSAN & ASESMEN */}
          {/* ========================================================= */}
          {activeModule === 'scoring' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'ja' ? '2. 心理テスト合格基準 ＆ 職種別DISC適性基準' : '2. Ambang Kelulusan Psikotes & Profil DISC Pekerjaan'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ja'
                      ? '心理テスト（全50問）の合格基準点、担当医名、職種（特定技能など）別の理想的なDISCプロファイルを設定します。'
                      : 'Atur standar passing grade psikotes (50 soal), penanggung jawab medis, dan profil DISC ideal per sektor pekerjaan.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '心理テスト合格基準点 (Passing Grade %)' : 'Ambang Passing Grade Kelulusan Psikotes (%)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scoringState.psikotesPassingThresholdPercent}
                      onChange={(e) =>
                        setScoringState((prev) => ({
                          ...prev,
                          psikotesPassingThresholdPercent: Number(e.target.value)
                        }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {lang === 'ja' ? '必要正解数: ' : 'Minimal Jawaban Benar: '}
                      <strong className="underline">
                        {lang === 'ja'
                          ? `50問中 ${Math.round((scoringState.psikotesPassingThresholdPercent / 100) * 50)} 問以上`
                          : `${Math.round((scoringState.psikotesPassingThresholdPercent / 100) * 50)} dari 50 Soal`}
                      </strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'デフォルト担当医師 / 医療評価者氏名' : 'Nama Dokter / Evaluator Medis Default'}
                  </label>
                  <input
                    type="text"
                    value={scoringState.defaultEvaluatorName}
                    onChange={(e) =>
                      setScoringState((prev) => ({ ...prev, defaultEvaluatorName: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {lang === 'ja' ? '受講生の健康スクリーニングフォームに自動的に反映されます。' : 'Akan otomatis muncul di formulir Skrining Kesehatan calon siswa.'}
                  </p>
                </div>
              </div>

              {/* DISC Ideal Profile Mapping per Job Sector */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {lang === 'ja' ? '職種別理想DISCプロファイル設定 (日本・特定技能向け)' : 'Pemetaan Profil DISC Ideal Per Sektor Pekerjaan (Jepang / Tokutei Ginou)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {lang === 'ja' ? '受講生のDISCテスト結果をこの職種基準と照合・適合度判定します。' : 'Sistem akan membandingkan hasil tes DISC siswa dengan profil ideal sektor ini.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddDiscModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'ja' ? '職種を追加' : 'Tambah Sektor'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">{lang === 'ja' ? '対象職種 / 分野' : 'Sektor Pekerjaan'}</th>
                        <th className="p-3">{lang === 'ja' ? '理想DISCタイプ' : 'Profil DISC Ideal'}</th>
                        <th className="p-3">{lang === 'ja' ? '最小適合率 (%)' : 'Kesesuaian Min. (%)'}</th>
                        <th className="p-3 text-right">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scoringState.discRoleMappings.map((mapping) => (
                        <tr key={mapping.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{mapping.jobSector}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                mapping.idealDisc === 'Dominance'
                                  ? 'bg-red-100 text-red-800'
                                  : mapping.idealDisc === 'Influence'
                                  ? 'bg-amber-100 text-amber-800'
                                  : mapping.idealDisc === 'Steadiness'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              High {mapping.idealDisc}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {mapping.minScorePercent}%
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => deleteDiscMapping(mapping.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODULE 3: MANAJEMEN GELOMBANG PENDAFTARAN */}
          {/* ========================================================= */}
          {activeModule === 'batches' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'ja' ? '3. 募集期次 ＆ 募集定員管理' : '3. Manajemen Gelombang & Kuota Pendaftaran'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ja' ? '新規受講生の募集受付の開始/停止および各期次の募集枠を設定します。' : 'Buka/tutup pendaftaran siswa baru dan batasi jumlah kuota per gelombang.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddBatchModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ja' ? '新規期次を追加' : 'Tambah Gelombang Baru'}</span>
                </button>
              </div>

              {/* Batches Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">{lang === 'ja' ? '期次名称' : 'Nama Gelombang'}</th>
                      <th className="p-3">{lang === 'ja' ? '受付期間' : 'Periode Tanggal'}</th>
                      <th className="p-3">{lang === 'ja' ? '定員充足状況' : 'Progres Kuota'}</th>
                      <th className="p-3">{lang === 'ja' ? '受付状態' : 'Status Portal'}</th>
                      <th className="p-3 text-right">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchState.map((batch) => {
                      const percent = Math.min(
                        100,
                        Math.round((batch.registeredCount / batch.quota) * 100)
                      );
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{batch.name}</td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">
                            {batch.startDate} {lang === 'ja' ? '〜' : 's/d'} {batch.endDate}
                          </td>
                          <td className="p-3">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-600">
                                <span>
                                  {batch.registeredCount} / {batch.quota} {lang === 'ja' ? '名' : 'Siswa'}
                                </span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleBatchStatus(batch.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition cursor-pointer ${
                                batch.status === 'OPEN'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {batch.status === 'OPEN'
                                ? (lang === 'ja' ? '受付中 (OPEN)' : 'DIBUKA (OPEN)')
                                : (lang === 'ja' ? '受付終了 (CLOSED)' : 'DITUTUP (CLOSED)')}
                            </button>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => deleteBatch(batch.id)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODULE 4: MULTI-LAYERED APPROVAL RULES */}
          {/* ========================================================= */}
          {activeModule === 'approvals' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'ja' ? '4. 多段階承認ワークフロー (Approval Flow)' : '4. Workflow Persetujuan Bertingkat (Approval Flow)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ja' ? '順次承認が必要な段階と承認権限ロールを設定します。' : 'Tentukan tahapan dan role admin yang wajib melakukan otorisasi secara berurutan.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddRuleModal(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'ja' ? '承認ステップを追加' : 'Tambah Tahapan'}</span>
                </button>
              </div>

              {/* Workflow Tab Selector */}
              <div className="flex space-x-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveWorkflowTab('Pencairan Dana Talang')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeWorkflowTab === 'Pencairan Dana Talang'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'ja' ? '立替金実行・支払承認' : 'Pencairan Dana Talang'}
                </button>
                <button
                  onClick={() => setActiveWorkflowTab('Pengesahan Kontrak')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeWorkflowTab === 'Pengesahan Kontrak'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'ja' ? '契約・覚書締結承認' : 'Pengesahan Kontrak & MoU'}
                </button>
              </div>

              {/* Workflow Stages Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {lang === 'ja' ? `承認ステップ順序 [${activeWorkflowTab === 'Pencairan Dana Talang' ? '立替金実行承認' : '契約締結承認'}]` : `Urutan Tahapan Persetujuan [${activeWorkflowTab}]`}
                </h4>

                <div className="space-y-3">
                  {approvalState
                    .filter((r) => r.targetWorkflow === activeWorkflowTab)
                    .sort((a, b) => a.order - b.order)
                    .map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-7 h-7 bg-indigo-600 text-white rounded-full font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900">{rule.stageName}</h5>
                            <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-500">
                              <span>{lang === 'ja' ? '必須承認ロール:' : 'Wajib Diotorisasi Oleh:'}</span>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-bold rounded-md">
                                {rule.requiredRole}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {rule.autoNotify && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                              {lang === 'ja' ? 'メール通知有効' : 'Email Notifikasi Aktif'}
                            </span>
                          )}
                          <button
                            onClick={() => deleteRule(rule.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODULE 5: MANAJEMEN ROLE & AKSES ADMIN (RBAC & KREDENSIAL) */}
          {/* ========================================================= */}
          {activeModule === 'rbac' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-100 text-purple-800 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === 'ja' ? '5. 管理者アカウント、アクセス権限 (RBAC) ＆ 認証管理' : '5. Manajemen Akun Admin, Hak Akses (RBAC) & Kredensial'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ja'
                        ? 'Firestore上の管理者一覧、RBACロール権限の割り当て、およびパスワードの更新管理を行います。'
                        : 'Atur daftar staf administrator di Firestore DB, kelola role RBAC, dan perbarui kata sandi otorisasi.'}
                    </p>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{lang === 'ja' ? '新規管理者を追加' : 'Tambah Admin Baru'}</span>
                  </button>
                )}
              </div>

              {/* SuperAdmin Access Restriction Banner */}
              {!isSuperAdmin ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950">
                      {lang === 'ja' ? 'アクセス制限中 - SuperAdmin権限が必要です' : 'Akses Terkunci - Pembatasan Wewenang SuperAdmin'}
                    </h4>
                    <p className="mt-0.5 text-amber-800 text-[11px]">
                      {lang === 'ja'
                        ? '管理者アカウント一覧の閲覧・編集およびパスワードの更新は、SuperAdmin権限を持つアカウントのみ実行可能です。'
                        : 'Halaman manajemen akun administrator dan pembaruan kata sandi otorisasi hanya dapat diakses & diubah oleh pengguna yang memiliki flag SuperAdmin.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Role Legend Guide */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
                      <span className="font-bold text-indigo-900 block">SuperAdmin</span>
                      <span className="text-[10px] text-indigo-700">{lang === 'ja' ? '全モジュール＆認証の完全権限' : 'Akses Penuh Seluruh Modul & Passwords'}</span>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                      <span className="font-bold text-blue-900 block">HR Legal</span>
                      <span className="text-[10px] text-blue-700">{lang === 'ja' ? 'DISC、心理テスト、契約締結' : 'DISC, Psikotes, Kontrak'}</span>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
                      <span className="font-bold text-rose-900 block">{lang === 'ja' ? '担当医師' : 'Dokter'}</span>
                      <span className="text-[10px] text-rose-700">{lang === 'ja' ? '健康スクリーニング＆MCU' : 'Skrining Kesehatan Medis'}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <span className="font-bold text-emerald-900 block">{lang === 'ja' ? '財務・経理' : 'Finance'}</span>
                      <span className="text-[10px] text-emerald-700">{lang === 'ja' ? '立替金支援申請・実行' : 'Aplikasi Dana Talang'}</span>
                    </div>
                  </div>

                  {/* Section 1: Daftar Akun Administrator dari Firestore */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                          <span>{lang === 'ja' ? '認証済み管理者アカウント一覧 (Firestore DB)' : 'Daftar Akun Administrator Terverifikasi (Firestore DB)'}</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {lang === 'ja' ? '行または操作ボタンをクリックして詳細閲覧、権限編集、またはアカウント削除を行います。' : 'Klik pada baris atau tombol aksi untuk melihat detail lengkap, mengedit hak akses, atau menghapus akun.'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {lang === 'ja' ? 'コレクション: ' : 'Koleksi: '}<code className="text-purple-600 font-bold">users [role=admin]</code>
                        </span>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row items-center gap-3">
                      <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder={lang === 'ja' ? '氏名、メール、ロール、部署で管理者を検索...' : 'Cari admin berdasarkan nama, email, role, atau divisi...'}
                          value={searchAdminQuery}
                          onChange={(e) => setSearchAdminQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                          value={roleAdminFilter}
                          onChange={(e) => setRoleAdminFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                        >
                          <option value="ALL">{lang === 'ja' ? '全てのロール' : 'Semua Role'}</option>
                          <option value="SuperAdmin">SuperAdmin</option>
                          <option value="HR Legal">HR Legal</option>
                          <option value="Dokter">{lang === 'ja' ? '医師 (Dokter)' : 'Dokter'}</option>
                          <option value="Finance">{lang === 'ja' ? '経理・財務 (Finance)' : 'Finance'}</option>
                          <option value="Admin Matching">{lang === 'ja' ? 'マッチング担当' : 'Admin Matching'}</option>
                          <option value="Verifikator CV JIS">{lang === 'ja' ? 'CV検証担当' : 'Verifikator CV'}</option>
                        </select>

                        <select
                          value={portalAdminFilter}
                          onChange={(e) => setPortalAdminFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                        >
                          <option value="ALL">{lang === 'ja' ? '全てのポータル' : 'Semua Portal'}</option>
                          <option value="ALL_PORTALS">ALL PORTALS</option>
                          <option value="ADMIN_1_IJEF">ADMIN 1 (SIBAL)</option>
                          <option value="ADMIN_2_CV_PORTAL">ADMIN 2 (CV PORTAL)</option>
                        </select>

                        {(searchAdminQuery || roleAdminFilter !== 'ALL' || portalAdminFilter !== 'ALL') && (
                          <button
                            onClick={() => {
                              setSearchAdminQuery('');
                              setRoleAdminFilter('ALL');
                              setPortalAdminFilter('ALL');
                            }}
                            className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition"
                            title={lang === 'ja' ? 'フィルター解除' : 'Reset Filter'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] border-b border-slate-800 tracking-wider">
                          <tr>
                            <th className="p-3 pl-4">{lang === 'ja' ? '管理者' : 'Administrator'}</th>
                            <th className="p-3">{lang === 'ja' ? '利用可能ポータル' : 'Portal Access'}</th>
                            <th className="p-3">{lang === 'ja' ? 'ロール ＆ 部署' : 'Role & Departemen'}</th>
                            <th className="p-3">{lang === 'ja' ? 'ステータス' : 'Status Otorisasi'}</th>
                            <th className="p-3 text-center pr-4">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const allAdmins = masterSettings.adminUsers || adminUsersState;
                            const filtered = allAdmins.filter((u) => {
                              const q = searchAdminQuery.toLowerCase();
                              const matchesSearch =
                                !searchAdminQuery ||
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.role && u.role.toLowerCase().includes(q)) ||
                                (u.department && u.department.toLowerCase().includes(q));

                              const matchesRole =
                                roleAdminFilter === 'ALL' ||
                                (roleAdminFilter === 'SuperAdmin' && (u.role === 'SuperAdmin' || u.isSuperAdmin)) ||
                                u.role === roleAdminFilter;

                              const matchesPortal =
                                portalAdminFilter === 'ALL' ||
                                u.portalAccess === portalAdminFilter ||
                                (!u.portalAccess && portalAdminFilter === 'ALL_PORTALS');

                              return matchesSearch && matchesRole && matchesPortal;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                      <Users className="w-8 h-8 text-slate-300" />
                                      <p className="font-semibold text-xs text-slate-600">
                                        {lang === 'ja' ? '検索条件に一致する管理者は見つかりませんでした。' : 'Tidak ada administrator yang cocok dengan filter pencarian.'}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((u) => {
                              const isAktif = u.status === 'AKTIF' || u.status === 'Aktif';
                              const isAllPortals = u.portalAccess === 'ALL_PORTALS' || !u.portalAccess;
                              const isAdmin1Only = u.portalAccess === 'ADMIN_1_IJEF';
                              const isSuper = u.role === 'SuperAdmin' || u.isSuperAdmin;

                              return (
                                <tr
                                  key={u.id}
                                  onClick={() => handleViewUser(u)}
                                  className="hover:bg-purple-50/50 transition cursor-pointer group"
                                >
                                  <td className="p-3 pl-4 font-bold text-slate-900">
                                    <div className="flex items-center space-x-2.5">
                                      <div
                                        className={`w-8 h-8 rounded-full font-bold text-xs text-white flex items-center justify-center shrink-0 shadow-2xs ${
                                          isSuper
                                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700 ring-2 ring-purple-200'
                                            : isAllPortals
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                                            : isAdmin1Only
                                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                                            : 'bg-gradient-to-br from-purple-600 to-pink-600'
                                        }`}
                                      >
                                        {u.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                          <span>{u.name}</span>
                                          {isSuper && (
                                            <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-amber-300">
                                              SUPER
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                                        isAllPortals
                                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                          : isAdmin1Only
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-purple-50 text-purple-700 border-purple-200'
                                      }`}
                                    >
                                      {isAllPortals
                                        ? 'ALL PORTALS'
                                        : isAdmin1Only
                                        ? 'ADMIN 1 (SIBAL)'
                                        : 'ADMIN 2 (CV-PORTAL)'}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    <div className="font-bold text-slate-800 text-xs">{u.role}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                                      <span>{u.department || 'SIBAL LPK Central'}</span>
                                      {u.permissions && u.permissions.length > 0 && (
                                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                          {u.permissions.length} {lang === 'ja' ? '件の権限' : 'Izin'}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUserStatus(u.id);
                                      }}
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center space-x-1 cursor-pointer transition ${
                                        isAktif
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                      }`}
                                      title={lang === 'ja' ? 'クリックして有効/無効を切替' : 'Klik untuk mengubah status aktif/nonaktif'}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${isAktif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                      <span>{isAktif ? (lang === 'ja' ? '有効' : 'AKTIF') : (lang === 'ja' ? '無効' : 'NONAKTIF')}</span>
                                    </button>
                                  </td>

                                  <td className="p-3 text-center pr-4">
                                    <div className="flex items-center justify-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                      {/* View Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleViewUser(u)}
                                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-800 rounded-lg border border-blue-200 transition cursor-pointer shadow-2xs"
                                        title={lang === 'ja' ? '管理者詳細 ＆ 権限の確認' : 'Lihat Detail Administrator & Hak Akses'}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Edit Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditUser(u)}
                                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-800 rounded-lg border border-amber-200 transition cursor-pointer shadow-2xs"
                                        title={lang === 'ja' ? 'アカウント ＆ 権限の編集' : 'Edit Akun & Hak Akses'}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDeleteUser(u)}
                                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-lg border border-rose-200 transition cursor-pointer shadow-2xs"
                                        title={lang === 'ja' ? '管理者アカウントの削除' : 'Hapus Akun Administrator'}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 2: Form Secure Update Kata Sandi Admin (Firebase Auth Method) */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                        <KeyRound className="w-4 h-4" />
                        <span>{lang === 'ja' ? '管理者パスワード更新フォーム (Firebase Auth 連携)' : 'Formulir Pembaruan Kata Sandi Administrator (Firebase Auth Method)'}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'ja'
                          ? 'Firebase Authentication SDK の updatePassword() 関数を呼び出し、現在ログイン中の管理者パスワードを安全に更新します。'
                          : 'Memanggil fungsi updatePassword(auth.currentUser, newPassword) secara langsung pada Firebase Authentication SDK untuk memperbarui kredensial akun saat ini.'}
                      </p>

                      {passwordUpdateStatus && (
                        <div
                          className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                            passwordUpdateStatus.type === 'success'
                              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                              : 'bg-rose-950/80 border-rose-800 text-rose-300'
                          }`}
                        >
                          {passwordUpdateStatus.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                          <span>{passwordUpdateStatus.message}</span>
                        </div>
                      )}

                      <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            {lang === 'ja' ? '新しいパスワード' : 'Kata Sandi Baru'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder={lang === 'ja' ? '6文字以上' : 'Minimal 6 Karakter'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            {lang === 'ja' ? '新しいパスワード（確認用）' : 'Konfirmasi Kata Sandi Baru'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={confirmAdminPassword}
                            onChange={(e) => setConfirmAdminPassword(e.target.value)}
                            placeholder={lang === 'ja' ? 'パスワードを再入力' : 'Ulangi Kata Sandi'}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{isUpdatingPassword ? (lang === 'ja' ? '処理中...' : 'Memproses...') : (lang === 'ja' ? 'パスワードを更新' : 'Update Password Auth')}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODALS SECTION */}
      {/* ========================================================= */}

      {/* ========================================================= */}
      {/* MODAL: VIEW DETAIL ADMINISTRATOR & HAK AKSES */}
      {/* ========================================================= */}
      {showViewUserModal && selectedAdminUser && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header with avatar & role */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl font-bold text-base text-white flex items-center justify-center shadow-md ${
                    selectedAdminUser.role === 'SuperAdmin' || selectedAdminUser.isSuperAdmin
                      ? 'bg-gradient-to-br from-purple-600 to-indigo-700 ring-2 ring-purple-300'
                      : selectedAdminUser.portalAccess === 'ALL_PORTALS' || !selectedAdminUser.portalAccess
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600'
                      : selectedAdminUser.portalAccess === 'ADMIN_1_IJEF'
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                      : 'bg-gradient-to-br from-purple-600 to-pink-600'
                  }`}
                >
                  {selectedAdminUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedAdminUser.name}</h3>
                    {(selectedAdminUser.role === 'SuperAdmin' || selectedAdminUser.isSuperAdmin) && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAdminUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setShowViewUserModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{lang === 'ja' ? 'アカウント状態' : 'Status Akun'}</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedAdminUser.status === 'AKTIF' || selectedAdminUser.status === 'Aktif'
                        ? 'bg-emerald-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      selectedAdminUser.status === 'AKTIF' || selectedAdminUser.status === 'Aktif'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {selectedAdminUser.status === 'AKTIF' || selectedAdminUser.status === 'Aktif'
                      ? (lang === 'ja' ? '有効 (AKTIF)' : 'AKTIF')
                      : (lang === 'ja' ? '無効 (NONAKTIF)' : (selectedAdminUser.status || 'NONAKTIF'))}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{lang === 'ja' ? 'ポータル権限' : 'Hak Portal'}</span>
                <span className="text-xs font-bold text-indigo-700 mt-1 block">
                  {selectedAdminUser.portalAccess === 'ALL_PORTALS' || !selectedAdminUser.portalAccess
                    ? 'ALL PORTALS'
                    : selectedAdminUser.portalAccess === 'ADMIN_1_IJEF'
                    ? 'ADMIN 1 (SIBAL)'
                    : 'ADMIN 2 (CV-PORTAL)'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{lang === 'ja' ? '付与ロール' : 'Role Otorisasi'}</span>
                <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                  {selectedAdminUser.role}
                </span>
              </div>
            </div>

            {/* Detailed Info Cards */}
            <div className="space-y-3 text-xs">
              {/* Account & Department Info */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'ja' ? '所属部署 ＆ 基本情報' : 'Departemen & Penempatan'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ja' ? '部署 / 所属' : 'Divisi / Departemen'}</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAdminUser.department || 'SIBAL LPK Central Back-Office'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ja' ? '管理者ID' : 'ID Administrator'}</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedAdminUser.id}</span>
                  </div>
                  {selectedAdminUser.phone && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">{lang === 'ja' ? '電話番号 / WhatsApp' : 'Nomor Telepon / WA'}</span>
                      <span className="font-semibold text-slate-800">{selectedAdminUser.phone}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 block">{lang === 'ja' ? '最終ログイン' : 'Terakhir Aktif'}</span>
                    <span className="font-semibold text-slate-800">{selectedAdminUser.lastLogin || (lang === 'ja' ? '直近' : 'Baru saja')}</span>
                  </div>
                </div>
              </div>

              {/* Password Hint / Kredensial Box */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-700" />
                    <span>{lang === 'ja' ? '認証パスワード / 資格情報' : 'Kata Sandi Otorisasi / Kredensial'}</span>
                  </h4>
                  <span className="text-[10px] text-purple-700 font-semibold">{lang === 'ja' ? 'システム保存済み' : 'Tersimpan di Sistem'}</span>
                </div>
                <div className="flex items-center justify-between bg-white border border-purple-200 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-500 font-mono">Password:</span>
                    <span className="font-mono font-bold text-purple-950">
                      {showPasswordInView
                        ? selectedAdminUser.passwordHint || 'admin123'
                        : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPasswordInView(!showPasswordInView)}
                      className="p-1 text-purple-700 hover:text-purple-950 hover:bg-purple-100 rounded transition"
                      title={showPasswordInView ? (lang === 'ja' ? 'パスワードを隠す' : 'Sembunyikan Kata Sandi') : (lang === 'ja' ? 'パスワードを表示' : 'Tampilkan Kata Sandi')}
                    >
                      {showPasswordInView ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(selectedAdminUser.passwordHint || 'admin123')}
                      className="p-1 text-purple-700 hover:text-purple-950 hover:bg-purple-100 rounded transition"
                      title={lang === 'ja' ? 'パスワードをコピー' : 'Salin Kata Sandi'}
                    >
                      {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Matrix Permissions */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === 'ja' ? `モジュール権限マトリクス (${selectedAdminUser.permissions?.length || 0})` : `Matriks Izin Akses Modul (${selectedAdminUser.permissions?.length || 0})`}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {availablePermissions.map((perm) => {
                    const hasPerm =
                      selectedAdminUser.role === 'SuperAdmin' ||
                      selectedAdminUser.isSuperAdmin ||
                      selectedAdminUser.permissions?.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        className={`flex items-center space-x-2 p-2 rounded-lg text-[11px] border transition ${
                          hasPerm
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-semibold'
                            : 'bg-slate-100/70 text-slate-400 border-slate-200 line-through'
                        }`}
                      >
                        {hasPerm ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{perm.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions in View Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowViewUserModal(false);
                  handleOpenDeleteUser(selectedAdminUser);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-rose-200 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'ja' ? 'アカウント削除' : 'Hapus Akun'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowViewUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {lang === 'ja' ? '閉じる' : 'Tutup'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowViewUserModal(false);
                    handleOpenEditUser(selectedAdminUser);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? 'このアカウントを編集' : 'Edit Akun Ini'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ADMINISTRATOR & HAK AKSES */}
      {/* ========================================================= */}
      {showEditUserModal && editingAdminUser && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {lang === 'ja' ? '管理者アカウント＆権限の編集' : 'Edit Akun Administrator & Hak Akses'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {editingAdminUser.id}</p>
                </div>
              </div>
              <button onClick={() => setShowEditUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '管理者氏名' : 'Nama Lengkap Admin'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAdminUser.name}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'メールアドレス' : 'Email Pengguna'}
                  </label>
                  <input
                    type="email"
                    required
                    value={editingAdminUser.email}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '付与ロール' : 'Role Otorisasi'}
                  </label>
                  <select
                    value={editingAdminUser.role}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, role: e.target.value as AdminRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="SuperAdmin">SuperAdmin {lang === 'ja' ? '(全権限＆認証)' : '(Full Access & Passwords)'}</option>
                    <option value="Admin 1 (SIM-SB IJEF)">Admin 1 {lang === 'ja' ? '(生徒管理・SIM-SB)' : '(SIM-SB IJEF Central)'}</option>
                    <option value="Admin 2 (CV Portal & Matching)">Admin 2 {lang === 'ja' ? '(書類・CV Portal JIS)' : '(CV Portal JIS)'}</option>
                    <option value="HR Legal">HR Legal {lang === 'ja' ? '(DISC、心理テスト、契約)' : '(DISC, Psikotes & Kontrak)'}</option>
                    <option value="Dokter">{lang === 'ja' ? '担当医師 (医療スクリーニング)' : 'Dokter (Skrining Medis MCU)'}</option>
                    <option value="Finance">{lang === 'ja' ? '経理・財務 (立替金支援)' : 'Finance (Aplikasi Dana Talang)'}</option>
                    <option value="Admin Matching">{lang === 'ja' ? 'マッチング担当 (日本配属)' : 'Admin Matching (Penempatan Jepang)'}</option>
                    <option value="Verifikator CV JIS">{lang === 'ja' ? 'CV検証担当 (JIS)' : 'Verifikator CV JIS'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'ポータルアクセス権' : 'Hak Akses Portal'}
                  </label>
                  <select
                    value={editingAdminUser.portalAccess || 'ADMIN_1_IJEF'}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, portalAccess: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL_PORTALS">ALL PORTALS (SuperAdmin Universal)</option>
                    <option value="ADMIN_1_IJEF">ADMIN 1 (SIBAL LPK Central)</option>
                    <option value="ADMIN_2_CV_PORTAL">ADMIN 2 (CV Portal & Matching)</option>
                    <option value="MITRA_PORTAL">PORTAL MITRA LPK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '部署 / 所属' : 'Divisi / Departemen'}
                  </label>
                  <input
                    type="text"
                    value={editingAdminUser.department || ''}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, department: e.target.value })}
                    placeholder={lang === 'ja' ? '例: 役員・IT管理部門' : 'e.g. Direksi & IT Back-Office'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'アカウント状態' : 'Status Otorisasi'}
                  </label>
                  <select
                    value={editingAdminUser.status || 'AKTIF'}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="AKTIF">{lang === 'ja' ? '有効 (ログイン可能)' : 'AKTIF (Dapat Login)'}</option>
                    <option value="NONAKTIF">{lang === 'ja' ? '無効 (アクセス停止中)' : 'NONAKTIF (Akses Ditangguhkan)'}</option>
                    <option value="SUSPENDED">{lang === 'ja' ? '停止 (アカウントロック)' : 'SUSPENDED (Terkunci)'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '電話番号 / WhatsApp' : 'Nomor Telepon / WhatsApp'}
                  </label>
                  <input
                    type="text"
                    value={editingAdminUser.phone || ''}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, phone: e.target.value })}
                    placeholder="e.g. 081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'パスワード / ヒント' : 'Kata Sandi / Password Hint'}
                  </label>
                  <input
                    type="text"
                    value={editingAdminUser.passwordHint || ''}
                    onChange={(e) => setEditingAdminUser({ ...editingAdminUser, passwordHint: e.target.value })}
                    placeholder={lang === 'ja' ? 'アカウントパスワード' : 'Kata sandi akun'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Matriks Izin Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  {lang === 'ja' ? `モジュール権限マトリクス (${editingAdminUser.permissions?.length || 0} 選択中)` : `Matriks Hak Akses Modul (${editingAdminUser.permissions?.length || 0} dipilih)`}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {availablePermissions.map((perm) => {
                    const isChecked = editingAdminUser.permissions?.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start space-x-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEditPermission(perm.id)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div className="leading-tight">
                          <span className="font-bold text-[11px] block">{perm.label}</span>
                          <span className="text-[9px] text-slate-400 block">{perm.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {lang === 'ja' ? '変更を保存' : 'Simpan Perubahan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DELETE CONFIRMATION ADMINISTRATOR */}
      {/* ========================================================= */}
      {showDeleteUserModal && deletingAdminUser && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {lang === 'ja' ? 'アカウント削除の確認' : 'Konfirmasi Hapus Akun'}
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  {lang === 'ja' ? 'この操作は取り消せません' : 'Tindakan ini tidak dapat dibatalkan'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
              <p className="text-slate-600">
                {lang === 'ja'
                  ? '以下の管理者アカウントをシステムから削除してもよろしいですか？'
                  : 'Apakah Anda yakin ingin menghapus administrator berikut dari sistem?'}
              </p>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1 mt-2">
                <div className="font-bold text-slate-900 text-xs">{deletingAdminUser.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">{deletingAdminUser.email}</div>
                <div className="text-[10px] text-purple-700 font-semibold">
                  Role: {deletingAdminUser.role} • {deletingAdminUser.department || 'LPK Central'}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                {lang === 'ja'
                  ? '削除されたアカウントはLPKポータルへログインできなくなります。'
                  : 'Akun ini tidak akan dapat login lagi ke portal LPK IJEF CORP.'}
              </p>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setShowDeleteUserModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {lang === 'ja' ? 'キャンセル' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
              >
                {lang === 'ja' ? 'はい、削除する' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD BATCH */}
      {/* ========================================================= */}
      {showAddBatchModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ja' ? '新規募集期生を追加' : 'Tambah Gelombang Pendaftaran'}
              </h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '期生名 / バッチ名' : 'Nama Gelombang'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: 第4期生 - 2026' : 'e.g. Gelombang 4 - 2026'}
                  required
                  value={newBatch.name}
                  onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '開始日' : 'Tgl Mulai'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.startDate}
                    onChange={(e) => setNewBatch({ ...newBatch, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '終了日' : 'Tgl Selesai'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.endDate}
                    onChange={(e) => setNewBatch({ ...newBatch, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '定員人数 (名)' : 'Batas Kuota Siswa'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newBatch.quota}
                  onChange={(e) => setNewBatch({ ...newBatch, quota: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'ja' ? '期生を保存' : 'Simpan Gelombang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD USER RBAC */}
      {/* ========================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {lang === 'ja' ? '新規管理者を追加' : 'Tambah Administrator Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ja' ? '新しい管理者アカウントをFirestore DBに登録' : 'Daftarkan akun admin baru ke Firestore DB'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '管理者氏名' : 'Nama Lengkap Admin'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ahmad Fauzi, S.E."
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'メールアドレス' : 'Email Pengguna'}
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ahmad@ijefcorp.com"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '付与ロール' : 'Role Otorisasi'}
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as AdminRole })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="SuperAdmin">SuperAdmin {lang === 'ja' ? '(全権限＆認証)' : '(Full Access & Passwords)'}</option>
                    <option value="HR Legal">HR Legal {lang === 'ja' ? '(DISC＆契約)' : '(DISC & Kontrak)'}</option>
                    <option value="Dokter">{lang === 'ja' ? '担当医師 (健康スクリーニング)' : 'Dokter (Skrining Kesehatan)'}</option>
                    <option value="Finance">{lang === 'ja' ? '経理・財務 (立替金支援)' : 'Finance (Dukungan Dana)'}</option>
                    <option value="Admin 1 (SIM-SB IJEF)">Admin 1 {lang === 'ja' ? '(生徒管理・SIM-SB)' : '(SIM-SB IJEF)'}</option>
                    <option value="Admin 2 (CV Portal & Matching)">Admin 2 {lang === 'ja' ? '(CV・マッチング)' : '(CV Portal & Matching)'}</option>
                    <option value="Admin Matching">{lang === 'ja' ? 'マッチング担当' : 'Admin Matching'}</option>
                    <option value="Verifikator CV JIS">{lang === 'ja' ? 'CV検証担当 (JIS)' : 'Verifikator CV JIS'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? 'ポータルアクセス権' : 'Hak Akses Portal'}
                  </label>
                  <select
                    value={newUser.portalAccess}
                    onChange={(e) => setNewUser({ ...newUser, portalAccess: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL_PORTALS">ALL PORTALS (SuperAdmin Universal)</option>
                    <option value="ADMIN_1_IJEF">ADMIN 1 (SIBAL LPK Central)</option>
                    <option value="ADMIN_2_CV_PORTAL">ADMIN 2 (CV Portal & Matching)</option>
                    <option value="MITRA_PORTAL">PORTAL MITRA LPK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '部署 / 所属' : 'Divisi / Departemen'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '例: 人事・法務・契約' : 'e.g. HR, Legal & Kontrak LPK'}
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'ja' ? '初期パスワード / ヒント' : 'Kata Sandi / Password Hint'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. admin123"
                    value={newUser.passwordHint}
                    onChange={(e) => setNewUser({ ...newUser, passwordHint: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Permissions Checkbox for new user */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  {lang === 'ja' ? `モジュール権限を選択 (${newUser.permissions.length} 選択中)` : `Pilih Hak Akses Modul (${newUser.permissions.length} dipilih)`}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {availablePermissions.map((perm) => {
                    const isChecked = newUser.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start space-x-2 p-1.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleNewUserPermission(perm.id)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-[11px] leading-tight">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'ja' ? '新規管理者を登録' : 'Simpan Admin Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add DISC Sector Mapping */}
      {showAddDiscModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ja' ? '職種別DISCプロファイルを追加' : 'Tambah Profil DISC Pekerjaan'}
              </h3>
              <button onClick={() => setShowAddDiscModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDiscMapping} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '職種セクター / 分野' : 'Sektor Pekerjaan / Bidang'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: IT・ソフトウェアエンジニア' : 'e.g. IT & Software Engineering'}
                  required
                  value={newDiscMapping.jobSector}
                  onChange={(e) => setNewDiscMapping({ ...newDiscMapping, jobSector: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '理想の主要DISCタイプ' : 'Profil DISC Dominan Ideal'}
                </label>
                <select
                  value={newDiscMapping.idealDisc}
                  onChange={(e) =>
                    setNewDiscMapping({
                      ...newDiscMapping,
                      idealDisc: e.target.value as any
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Dominance">High Dominance (D)</option>
                  <option value="Influence">High Influence (I)</option>
                  <option value="Steadiness">High Steadiness (S)</option>
                  <option value="Compliance">High Compliance (C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '最低適合率 (%)' : 'Persentase Minimal Kesesuaian'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={newDiscMapping.minScorePercent}
                  onChange={(e) =>
                    setNewDiscMapping({ ...newDiscMapping, minScorePercent: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDiscModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'ja' ? 'マッピングを保存' : 'Simpan Pemetaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Approval Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'ja' ? '承認ステップを追加' : 'Tambah Tahapan Persetujuan'}
              </h3>
              <button onClick={() => setShowAddRuleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '対象ワークフロー' : 'Target Workflow'}
                </label>
                <select
                  value={newRule.targetWorkflow}
                  onChange={(e) => setNewRule({ ...newRule, targetWorkflow: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="Pencairan Dana Talang">{lang === 'ja' ? '立替金支援の実行' : 'Pencairan Dana Talang'}</option>
                  <option value="Pengesahan Kontrak">{lang === 'ja' ? '雇用契約の締結・承認' : 'Pengesahan Kontrak'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? 'ステップ名' : 'Nama Tahapan'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: 保証書類の確認' : 'e.g. Verifikasi Dokumen Jaminan'}
                  required
                  value={newRule.stageName}
                  onChange={(e) => setNewRule({ ...newRule, stageName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {lang === 'ja' ? '承認担当ロール' : 'Role Penanggung Jawab'}
                </label>
                <select
                  value={newRule.requiredRole}
                  onChange={(e) => setNewRule({ ...newRule, requiredRole: e.target.value as AdminRole })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="HR Legal">HR Legal</option>
                  <option value="Dokter">{lang === 'ja' ? '医師 (Dokter)' : 'Dokter'}</option>
                  <option value="Finance">{lang === 'ja' ? '経理 (Finance)' : 'Finance'}</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="autoNotify"
                  checked={newRule.autoNotify}
                  onChange={(e) => setNewRule({ ...newRule, autoNotify: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="autoNotify" className="text-xs text-slate-700 font-semibold">
                  {lang === 'ja' ? '関係スタッフへ自動メール通知を送信' : 'Kirim Notifikasi Email Otomatis Ke Staf Terkait'}
                </label>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  {lang === 'ja' ? 'キャンセル' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'ja' ? 'ステップを保存' : 'Simpan Tahapan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
