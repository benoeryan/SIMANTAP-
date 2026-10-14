import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { MarketingLead } from '../../types';
import { translateMarketingRole } from '../../utils/marketingTranslations';
import {
  User,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Briefcase,
  FileSpreadsheet,
  Mail,
  Building2,
  Lock,
  Megaphone,
  Check,
  Save,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';
import { INITIAL_LEADS } from '../../data/crmSeedData';

interface MarketingSettingsViewProps {
  leads: MarketingLead[];
  onSaveLead: (lead: MarketingLead) => void;
}

export const MarketingSettingsView: React.FC<MarketingSettingsViewProps> = ({ leads, onSaveLead }) => {
  const { masterSettings, updateMasterSettings, lang } = useApp();
  const { bilingual } = useEcosystemTranslation();
  const { user, updateUserProfile, updateAdminPassword } = useAuth();

  // Active Tab in Marketing Settings
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'INTEGRATION' | 'BACKUP'>('PROFILE');

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [adminRole, setAdminRole] = useState(user?.adminRole || 'Staff Marketing & Konselor');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Integration & System Settings
  const [autoSyncAdmin1, setAutoSyncAdmin1] = useState(true);
  const [autoSyncCVPortal, setAutoSyncCVPortal] = useState(true);
  const [csPhone, setCsPhone] = useState('081299887700');
  const [brandName, setBrandName] = useState('LPK IJEF Corp Bandung');
  const [integrationSaved, setIntegrationSaved] = useState(false);

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileSaving(true);

    const res = await updateUserProfile({
      displayName,
      email,
      adminRole
    });

    setProfileSaving(false);
    if (res.success) {
      // Sync into masterSettings.adminUsers
      const currentList = masterSettings.adminUsers || [];
      const updatedList = currentList.map((a) =>
        a.email === user?.email || a.name === user?.displayName
          ? {
              ...a,
              name: displayName,
              email: email,
              role: adminRole
            }
          : a
      );
      updateMasterSettings({ adminUsers: updatedList });

      setProfileMessage({
        type: 'success',
        text: bilingual(
          'Profil Pengelola Marketing berhasil diperbarui dan disinkronkan!',
          'マーケティング管理者プロフィールが正常に更新・同期されました！'
        )
      });
      setTimeout(() => setProfileMessage(null), 3500);
    } else {
      setProfileMessage({
        type: 'error',
        text: res.error || bilingual('Gagal memperbarui profil pengguna.', 'ユーザープロフィールの更新に失敗しました。')
      });
    }
  };

  // Update Password Handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: bilingual('Kata sandi minimal harus 6 karakter.', 'パスワードは最低6文字必要です。')
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: bilingual(
          'Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.',
          'パスワードの確認が一致しません。もう一度お確かめください。'
        )
      });
      return;
    }

    setPasswordSaving(true);
    const res = await updateAdminPassword(newPassword);
    setPasswordSaving(false);

    if (res.success) {
      setPasswordMessage({
        type: 'success',
        text: bilingual(
          'Kata sandi akun Marketing berhasil diperbarui di sistem!',
          'マーケティングアカウントのパスワードが正常に更新されました！'
        )
      });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } else {
      setPasswordMessage({
        type: 'error',
        text: res.error || bilingual('Gagal memperbarui kata sandi.', 'パスワードの更新に失敗しました。')
      });
    }
  };

  // Save Integration Handler
  const handleSaveIntegration = () => {
    setIntegrationSaved(true);
    setTimeout(() => setIntegrationSaved(false), 3000);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'ID Lead',
      'Nama Lengkap',
      'Nama Panggilan',
      'No WhatsApp',
      'Email',
      'Kota',
      'Provinsi',
      'Usia',
      'Program Minat',
      'Bidang Minat',
      'Sumber Lead',
      'PIC Marketing',
      'Status Lead',
      'Tanggal Masuk',
      'Terintegrasi Admin Siswa',
      'ID Siswa Terdaftar'
    ];

    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.namaLengkap}"`,
      `"${l.namaPanggilan || ''}"`,
      `"${l.noWhatsapp}"`,
      `"${l.email || ''}"`,
      `"${l.kotaDomisili || ''}"`,
      `"${l.provinsiDomisili || ''}"`,
      l.usia || '',
      `"${l.programMinat || ''}"`,
      `"${l.bidangMinat || ''}"`,
      `"${l.sumberLead || ''}"`,
      `"${l.picMarketingStaff || ''}"`,
      `"${l.statusLead}"`,
      `"${l.tanggalMasukLead || ''}"`,
      l.terintegrasiKeAdmin1 ? 'YA' : 'TIDAK',
      `"${l.siswaId || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Database_Leads_Marketing_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Backup_CRM_Leads_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset Demo Leads
  const handleResetDemoData = () => {
    const confirmMsg = bilingual(
      'Apakah Anda yakin ingin memulihkan data demo prospek marketing default? Data yang ditambahkan manual akan di-reset.',
      'マーケティングの初期デモデータを復元してもよろしいですか？手動で追加したデータはリセットされます。'
    );
    if (window.confirm(confirmMsg)) {
      INITIAL_LEADS.forEach((lead) => onSaveLead(lead));
      alert(bilingual('Data demo leads marketing berhasil dipulihkan!', 'マーケティングのデモデータが正常に復元されました！'));
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12 animate-fade-in">
      {/* Top Banner Notice: Full Access RBAC in Admin 2 Only */}
      <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-purple-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-400/30 uppercase">
                {bilingual('Keamanan & Otorisasi RBAC', 'RBAC セキュリティ＆権限管理')}
              </span>
              <span className="text-[10px] text-purple-300 font-mono">• {bilingual('Terpusat', '統合管理')}</span>
            </div>
            <p className="text-xs text-purple-100 font-medium mt-0.5">
              {bilingual(
                'Pengelolaan Hak Akses Penuh, Penunjukan Super Admin, dan Master Akun Lintas Portal terpusat di Portal Admin 2 (Matching & CV Japan).',
                '全アクセス権限、特権管理者（スーパー管理者）の任命、およびポータル横断マスターアカウント管理は「管理者ポータル2（求人マッチング＆CV作成）」で一元管理されています。'
              )}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-purple-200 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center space-x-2 shrink-0">
          <Lock className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {bilingual('Akses Portal Ini: ', '当ポータル対象: ')}
            <strong>{bilingual('Tim Marketing & Intake CRM', 'マーケティング＆生徒獲得CRMチーム')}</strong>
          </span>
        </div>
      </div>

      {/* Header View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-orange-100 text-orange-700 border border-orange-200 shadow-xs shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {bilingual('Pengaturan Akun Marketing & CRM', 'マーケティングアカウント設定')}
            </h2>
            <p className="text-xs text-slate-500">
              {bilingual(
                'Kelola identitas profil pengelola, keamanan kata sandi, dan integrasi WhatsApp Gateway',
                'マーケティング担当者プロフィール、パスワード変更、およびCRM連携設定'
              )}
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{bilingual('Profil & Kata Sandi', 'プロフィール＆パスワード')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INTEGRATION')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'INTEGRATION'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{bilingual('Integrasi & WhatsApp', '連携＆WhatsApp設定')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BACKUP')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'BACKUP'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{bilingual('Cadangkan & Ekspor', 'バックアップ＆出力')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIL PENGELOLA & UBAH KATA SANDI */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Profil Pengelola Marketing */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {bilingual('Profil Pengelola Marketing', 'マーケティング管理者プロフィール')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {bilingual('Informasi identitas akun staf & konselor LPK', '担当スタッフ・カウンセラーのアカウント情報')}
                  </p>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                Marketing CRM
              </span>
            </div>

            {profileMessage && (
              <div
                className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
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

            {/* Profile Avatar Card */}
            <div className="flex items-center space-x-3.5 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80">
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                {displayName.substring(0, 2).toUpperCase() || 'MK'}
              </div>
              <div>
                <div className="font-extrabold text-slate-900 text-sm leading-tight">
                  {displayName || user?.displayName || bilingual('Staf Marketing LPK', 'マーケティング担当スタッフ')}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {email || user?.email || 'marketing@ijefcorp.com'}
                </div>
                <div className="inline-flex items-center space-x-1.5 mt-1.5 px-2 py-0.5 bg-orange-200/80 text-orange-900 text-[10px] font-bold rounded-md">
                  <Briefcase className="w-3 h-3 text-orange-800" />
                  <span>{translateMarketingRole(adminRole, lang)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Nama Lengkap Pengelola / Konselor', '管理者 / カウンセラー氏名')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={bilingual('Contoh: Budi Santoso, S.Kom', '例: Budi Santoso')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Email Akun Pengelola', 'ログイン用メールアドレス')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@ijefcorp.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Sub-Role / Jabatan Spesifik Tim Marketing', '役割・役職')}
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Staff Marketing & Konselor">
                      {bilingual('Staff Marketing & Konselor', 'マーケティングスタッフ＆相談カウンセラー')}
                    </option>
                    <option value="Koordinator Intake & Follow-Up">
                      {bilingual('Koordinator Intake & Follow-Up', '生徒獲得＆フォローアップ統括')}
                    </option>
                    <option value="Digital Marketer & Ads Specialist">
                      {bilingual('Digital Marketer & Ads Specialist', 'デジタルマーケティング＆広告スペシャリスト')}
                    </option>
                    <option value="Customer Relations & CS LPK">
                      {bilingual('Customer Relations & CS LPK', 'カスタマーリレーション＆CS窓口')}
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {profileSaving
                    ? bilingual('Menyimpan Perubahan...', '保存中...')
                    : bilingual('Simpan Perubahan Profil', 'プロフィールを更新')}
                </span>
              </button>
            </form>
          </div>

          {/* Card 2: Ubah Kata Sandi Akun */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {bilingual('Ubah Kata Sandi', 'パスワード変更')}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {bilingual('Perbarui kata sandi akun untuk keamanan login', '安全なアクセスのためパスワードを更新')}
                    </p>
                  </div>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {bilingual('Keamanan', 'セキュリティ')}
                </span>
              </div>

              {passwordMessage && (
                <div
                  className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
                    passwordMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
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

              <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kata Sandi Baru', '新しいパスワード')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder={bilingual('Minimal 6 karakter', '6文字以上')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Konfirmasi Kata Sandi Baru', '新しいパスワード（確認）')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={bilingual('Ulangi kata sandi baru', '新しいパスワードを再入力')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  {bilingual(
                    '💡 Tips Keamanan: Gunakan kombinasi huruf besar, angka, dan simbol untuk melindungi kredensial akses CRM marketing Anda.',
                    '💡 セキュリティアドバイス: 大文字・数字・記号を組み合わせて安全なパスワードを設定してください。'
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-orange-400" />
                  <span>
                    {passwordSaving
                      ? bilingual('Memperbarui Sandi...', '更新中...')
                      : bilingual('Perbarui Kata Sandi Akun', 'パスワードを更新')}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRASI & WHATSAPP GATEWAY */}
      {activeTab === 'INTEGRATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Auto Sync & Pipeline Bridge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {bilingual('Sinkronisasi Otomatis Seluruh Portal', '全ポータル間自動データ同期')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {bilingual(
                      'Koneksi data prospek deal ke Admin Siswa SIM-SB & Admin Doc CV Portal',
                      '成約リードを生徒管理（Admin 1）および求人マッチング・CV作成（Admin 2）に自動連携'
                    )}
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                {bilingual('Aktif', '有効')}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {bilingual('Auto-Sync ke Admin Siswa (SIM-SB)', '生徒管理（Admin 1）への自動同期')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {bilingual(
                        'Otomatis membuat akun calon siswa saat status lead berpindah ke DEAL_TERDAFTAR',
                        'ステータスが「正式登録完了（DEAL_TERDAFTAR）」になった際、自動的に生徒アカウントを起票'
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncAdmin1}
                    onChange={(e) => setAutoSyncAdmin1(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">
                      {bilingual('Auto-Sync ke CV Rirekisho JIS (Admin 2)', '履歴書・CV（Admin 2）への自動登録')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {bilingual(
                        'Menyiapkan profil kandidat di katalog job matching Jepang',
                        '日本企業向け人材カタログに候補者プロフィールを自動準備'
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSyncCVPortal}
                    onChange={(e) => setAutoSyncCVPortal(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-200 text-orange-950 space-y-1 text-[11px]">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-700" />
                  <span>{bilingual('Jaminan Integritas Data CRM', 'CRMデータ整合性保証')}</span>
                </div>
                <p className="text-orange-900/80 leading-relaxed">
                  {bilingual(
                    'Setiap lead yang diintegrasikan mendapatkan ID Siswa unik permanen (contoh: IJEF-2026-XXX) yang otomatis terhubung ke sistem seleksi, rekam medis MCU, dan berkas pendaftaran.',
                    '連携された各リードには恒久的な固有生徒ID（例: IJEF-2026-XXX）が発行され、選考情報、健康診断結果（MCU）、提出書類と自動紐づけされます。'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: WhatsApp CS & Branding */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {bilingual('WhatsApp Gateway & Identitas Brand', 'WhatsApp Gateway ＆ ブランド設定')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {bilingual(
                      'Nomor CS resmi dan identitas lembaga dalam pesan WhatsApp',
                      '公式CS窓口番号およびメッセージ内での表記名称'
                    )}
                  </p>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                WhatsApp
              </span>
            </div>

            {integrationSaved && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {bilingual(
                    'Pengaturan WhatsApp Gateway & Brand berhasil disimpan!',
                    'WhatsApp Gatewayおよびブランド設定が保存されました！'
                  )}
                </span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Nomor WhatsApp CS / Hotline Utama LPK', '公式WhatsApp CS / ホットライン番号')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={csPhone}
                    onChange={(e) => setCsPhone(e.target.value)}
                    placeholder="081299887700"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Nama Resmi Lembaga / Brand LPK', '機関・ブランド正式名称')}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="LPK IJEF Corp Bandung"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveIntegration}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{bilingual('Simpan Pengaturan Integrasi', '連携設定を保存')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CADANGKAN & EKSPOR DATA PROSPEK */}
      {activeTab === 'BACKUP' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {bilingual('Cadangkan, Ekspor & Rekapitulasi Data Leads CRM', 'リードデータ出力・バックアップ・総括')}
              </h3>
              <p className="text-xs text-slate-500">
                {bilingual(
                  'Unduh salinan data seluruh calon siswa, riwayat follow-up, dan performa closing marketing.',
                  '全見込み生徒データ、商談フォロー履歴、および成約パフォーマンスの出力を行います。'
                )}
              </p>
            </div>
            <span className="bg-orange-100 text-orange-800 text-xs font-mono font-bold px-3 py-1 rounded-full border border-orange-200 self-start sm:self-auto">
              {bilingual(`Total ${leads.length} Data Leads`, `合計 ${leads.length} 件のリード`)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ekspor CSV / Excel */}
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{bilingual('Ekspor Format Excel / CSV', 'Excel / CSV 形式で出力')}</span>
                </div>
                <p className="text-[11px] text-emerald-900/70 leading-snug">
                  {bilingual(
                    'Unduh seluruh baris data leads lengkap dengan kontak WhatsApp, kota, bidang minat, dan status integrasi SIM-SB.',
                    'WhatsApp連絡先、居住地域、希望分野、連携ステータスを含む全リードデータをCSV形式でダウンロードします。'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {bilingual(`Unduh Berkas CSV (${leads.length} Leads)`, `CSVダウンロード (${leads.length}件)`)}
                </span>
              </button>
            </div>

            {/* Cadangkan JSON Database */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-800 font-bold text-xs">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>{bilingual('Cadangan Database JSON', 'JSONデータベース バックアップ')}</span>
                </div>
                <p className="text-[11px] text-indigo-900/70 leading-snug">
                  {bilingual(
                    'Salinan terstruktur seluruh data CRM termasuk log audit dan riwayat chat konsultasi follow-up.',
                    '監査ログおよび相談履歴を含むCRM全データの構造化バックアップファイルを保存します。'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{bilingual('Cadangkan JSON Database', 'JSONバックアップを作成')}</span>
              </button>
            </div>

            {/* Pulihkan Data Demo */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <RefreshCw className="w-4 h-4 text-amber-700" />
                  <span>{bilingual('Reset / Pulihkan Demo CRM', 'デモデータの復元・リセット')}</span>
                </div>
                <p className="text-[11px] text-amber-900/70 leading-snug">
                  {bilingual(
                    'Pulihkan basis data awal prospek leads marketing beserta alur tahapan pipeline teruji.',
                    '標準のデモ見込み生徒データおよびパイプライン進捗を初期状態に復元します。'
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDemoData}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{bilingual('Pulihkan Data Demo', 'デモデータを復元')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
