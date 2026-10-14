import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import {
  translatePipelineStage,
  translateLeadSource,
  translateJobSector,
  translateMarketingRole,
  translateFollowUpMethod,
  translateCandidateCategory,
  translateReligion,
  translateGender,
  translateJapaneseLevel
} from '../../utils/marketingTranslations';
import {
  MarketingLead,
  LeadStatus,
  FollowUpLogItem,
  MarketingStaff,
  Gender,
  Religion,
  BloodType,
  MaritalStatus,
  CandidateCategory
} from '../../types';
import { INITIAL_MARKETING_STAFF } from '../../data/crmSeedData';
import { getMarketingAccessInfo, getScopedLeadsForUser, getCanonicalPipelineStage, CanonicalPipelineStageKey } from '../../utils/crmAuthUtils';
import { isIjefCategory, isNonIjefCategory, getTargetPortalForCategory, getTargetPortalLabel } from '../../utils/candidateUtils';
import { applyCandidateSorting, SORT_OPTIONS } from '../../utils/sortHelper';
import { MarketingDashboardView } from './MarketingDashboardView';
import { MarketingFollowUpView } from './MarketingFollowUpView';
import { MarketingCampaignsView } from './MarketingCampaignsView';
import { MarketingSettingsView } from './MarketingSettingsView';
import { MarketingLeadEditModal } from './MarketingLeadEditModal';
import {
  Megaphone,
  Users,
  UserPlus,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowUpDown,
  TrendingUp,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Building2,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Award,
  RefreshCw,
  Plus,
  FileText,
  MapPin,
  Stethoscope,
  GraduationCap,
  X,
  Send,
  Eye,
  Check,
  UserCheck,
  Settings,
  Lock,
  Crown,
  GripVertical,
  Move,
  Target
} from 'lucide-react';

export const MarketingPortal: React.FC = () => {
  const {
    leads,
    students,
    saveLead,
    deleteLead,
    updateLeadStatus,
    addFollowUpLog,
    registerAndIntegrateLeadToAllPortals,
    selectedLeadId,
    setSelectedLeadId,
    setAdminPortalCategoryMode,
    setActiveTab,
    marketingActiveTab,
    setMarketingActiveTab,
    searchTerm,
    setSearchTerm,
    masterSettings,
    updateMasterSettings,
    lang
  } = useApp();

  const { bilingual } = useEcosystemTranslation();
  const { user } = useAuth();

  // Marketing Staff list from data / settings
  const staffList: MarketingStaff[] = useMemo(() => {
    if (masterSettings?.marketingStaff && masterSettings.marketingStaff.length > 0) {
      return masterSettings.marketingStaff;
    }
    return INITIAL_MARKETING_STAFF;
  }, [masterSettings?.marketingStaff]);

  // Target Marketing Staff Edit Modal State
  const [targetModalStaff, setTargetModalStaff] = useState<MarketingStaff | null>(null);
  const [staffTargetInput, setStaffTargetInput] = useState<number>(20);

  const handleSaveStaffTarget = (staffId: string, newTarget: number) => {
    const updatedStaffList = staffList.map((s) =>
      s.id === staffId ? { ...s, targetBulanan: newTarget } : s
    );
    updateMasterSettings({ marketingStaff: updatedStaffList });
    setTargetModalStaff(null);
    setSuccessToast(
      bilingual(
        `🎯 Target bulanan staff marketing berhasil diperbarui menjadi ${newTarget} siswa/bulan!`,
        `🎯 スタッフの月間目標を ${newTarget} 名/月に更新しました！`
      )
    );
  };

  // Compute CRM Access & Role for Current User
  const accessInfo = useMemo(() => {
    return getMarketingAccessInfo(user, masterSettings?.adminUsers, staffList);
  }, [user, masterSettings?.adminUsers, staffList]);

  // Inspector filter for Leaders & Admins
  const [selectedStaffInspector, setSelectedStaffInspector] = useState<string>('ALL');

  // Strictly Scoped Leads based on User Access Level (Staff vs Leader/Admin)
  const scopedLeads = useMemo(() => {
    return getScopedLeadsForUser(leads, accessInfo, selectedStaffInspector);
  }, [leads, accessInfo, selectedStaffInspector]);

  // Active Tab synchronized with Global App State
  const activeTab = marketingActiveTab || 'dashboard';
  const setActiveInternalTab = (tab: any) => {
    setMarketingActiveTab(tab);
  };
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [picFilter, setPicFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('DEFAULT');
  
  // Detail Modal State
  const [activeDetailLead, setActiveDetailLead] = useState<MarketingLead | null>(null);

  // Edit Master Lead Modal State
  const [editingLead, setEditingLead] = useState<MarketingLead | null>(null);

  const handleSaveEditedLead = (updatedLead: MarketingLead) => {
    saveLead(updatedLead);
    setEditingLead(null);
    if (activeDetailLead?.id === updatedLead.id) {
      setActiveDetailLead(updatedLead);
    }
    setSuccessToast(
      bilingual(
        `✅ Data master lead "${updatedLead.namaLengkap}" berhasil diperbarui!`,
        `✅ リード「${updatedLead.namaLengkap}」のデータを更新しました！`
      )
    );
  };
  
  // Follow Up Modal State
  const [followUpModalOpen, setFollowUpModalOpen] = useState<boolean>(false);
  const [followUpTargetLead, setFollowUpTargetLead] = useState<MarketingLead | null>(null);
  const [followUpChannel, setFollowUpChannel] = useState<'WHATSAPP' | 'TELEPON' | 'TATAP_MUKA_LPK' | 'ZOOM' | 'EMAIL'>('WHATSAPP');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [followUpNextDate, setFollowUpNextDate] = useState<string>('');
  const [followUpNextAction, setFollowUpNextAction] = useState<string>('');

  // Notification Banner State
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Drag and Drop & Quick Move States for Kanban Cards
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CanonicalPipelineStageKey | null>(null);
  const [quickMoveLead, setQuickMoveLead] = useState<MarketingLead | null>(null);

  // Form State for New Intake Lead
  const [formNamaLengkap, setFormNamaLengkap] = useState('');
  const [formNamaPanggilan, setFormNamaPanggilan] = useState('');
  const [formNoWhatsapp, setFormNoWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formKotaDomisili, setFormKotaDomisili] = useState('');
  const [formProvinsiDomisili, setFormProvinsiDomisili] = useState('Jawa Barat');
  const [formTempatLahir, setFormTempatLahir] = useState('');
  const [formTanggalLahir, setFormTanggalLahir] = useState('2003-06-15');
  const [formJenisKelamin, setFormJenisKelamin] = useState<Gender>('Laki-laki');
  const [formAgama, setFormAgama] = useState<Religion>('Islam');
  const [formGolonganDarah, setFormGolonganDarah] = useState<BloodType>('O');
  const [formStatusPernikahan, setFormStatusPernikahan] = useState<MaritalStatus>('Lajang');
  const [formNikKtp, setFormNikKtp] = useState('');
  const [formNoKk, setFormNoKk] = useState('');
  const [formAlamatLengkap, setFormAlamatLengkap] = useState('');
  const [formKategoriKandidat, setFormKategoriKandidat] = useState<CandidateCategory>('SISWA IJEF - Offline');
  const [formBidangMinat, setFormBidangMinat] = useState('Kaigo (Caregiver / Perawat Lansia)');
  const [formSumberLead, setFormSumberLead] = useState('Instagram Ads');
  const [formPicStaff, setFormPicStaff] = useState(
    !accessInfo.isLeaderOrAdmin && accessInfo.staffName ? accessInfo.staffName : 'Beno Ryan'
  );
  const [formTinggiBadan, setFormTinggiBadan] = useState<number | ''>(170);
  const [formBeratBadan, setFormBeratBadan] = useState<number | ''>(62);
  const [formPendidikanTerakhir, setFormPendidikanTerakhir] = useState('SMK / SMA');
  const [formJurusanPendidikan, setFormJurusanPendidikan] = useState('Keperawatan');
  const [formRiwayatBahasaJepang, setFormRiwayatBahasaJepang] = useState('Belum Pernah (Pemula N5)');
  const [formRiwayatPaspor, setFormRiwayatPaspor] = useState('BELUM');
  const [formMemilikiSim, setFormMemilikiSim] = useState('SIM C');
  const [formTato, setFormTato] = useState<'YA' | 'TIDAK'>('TIDAK');
  const [formMerokok, setFormMerokok] = useState<'YA' | 'TIDAK'>('TIDAK');
  const [formButaWarna, setFormButaWarna] = useState<'YA' | 'TIDAK'>('TIDAK');
  const [formPatahTulang, setFormPatahTulang] = useState<'YA' | 'TIDAK'>('TIDAK');
  const [formNamaAyah, setFormNamaAyah] = useState('');
  const [formNamaIbu, setFormNamaIbu] = useState('');
  const [formNoHpOrangTua, setFormNoHpOrangTua] = useState('');
  const [formPekerjaanOrangTua, setFormPekerjaanOrangTua] = useState('');
  const [formCatatanMarketing, setFormCatatanMarketing] = useState('');

  // Lock PIC to current staff if not Leader/Admin
  useEffect(() => {
    if (!accessInfo.isLeaderOrAdmin && accessInfo.staffName) {
      setFormPicStaff(accessInfo.staffName);
    }
  }, [accessInfo]);

  // Filtered Leads from Scoped Collection
  const filteredLeads = useMemo(() => {
    const filtered = scopedLeads.filter((lead) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        (selectedLeadId && lead.id === selectedLeadId) ||
        lead.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.noWhatsapp.includes(searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.kotaDomisili && lead.kotaDomisili.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.nikKtp && lead.nikKtp.includes(searchTerm));

      const canonicalStatus = getCanonicalPipelineStage(lead.statusLead);
      const matchStatus =
        statusFilter === 'ALL' ||
        lead.statusLead === statusFilter ||
        canonicalStatus === statusFilter;

      const leadPicName = (lead.picMarketingStaff || lead.assignedStaff || '').toLowerCase();
      const targetPic = picFilter.toLowerCase();
      const matchPic =
        picFilter === 'ALL' ||
        leadPicName === targetPic ||
        leadPicName.includes(targetPic);

      const matchSource = sourceFilter === 'ALL' || lead.sumberLead === sourceFilter;

      const leadCategory = lead.kategoriKandidat || 'SISWA NON IJEF (New Comer)';
      const matchCategory =
        categoryFilter === 'ALL' ||
        leadCategory === categoryFilter ||
        (categoryFilter === 'IJEF' && isIjefCategory(leadCategory)) ||
        (categoryFilter === 'NON_IJEF' && isNonIjefCategory(leadCategory)) ||
        (categoryFilter.includes('Offline') && leadCategory.includes('Offline')) ||
        (categoryFilter.includes('Online') && leadCategory.includes('Online')) ||
        (categoryFilter.includes('Ex-Magang') && (leadCategory.includes('Ex-Magang') || leadCategory.includes('Ex-Trainee'))) ||
        (categoryFilter.includes('Engineering') && (leadCategory.includes('Engineering') || leadCategory.includes('Gijinkoku'))) ||
        (categoryFilter.includes('MITRA') && leadCategory.includes('MITRA')) ||
        (categoryFilter.includes('New Comer') && (leadCategory.includes('NON IJEF') || leadCategory.includes('New Comer')));

      return matchSearch && matchStatus && matchPic && matchSource && matchCategory;
    });

    return applyCandidateSorting(filtered, sortBy);
  }, [scopedLeads, searchTerm, statusFilter, picFilter, sourceFilter, categoryFilter, sortBy, selectedLeadId]);

  // Key KPI Metrics computed over Scoped Leads
  const totalLeadsCount = scopedLeads.length;
  const newLeadsCount = scopedLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'LEAD_BARU').length;
  const activeProspekCount = scopedLeads.filter((l) =>
    ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP'].includes(getCanonicalPipelineStage(l.statusLead))
  ).length;
  const dealClosingCount = scopedLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
  const lostCount = scopedLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'LOST_BATAL').length;
  const closingRate = totalLeadsCount > 0 ? Math.round((dealClosingCount / totalLeadsCount) * 100) : 0;
  // Helper to reliably check if a lead is integrated to Admin Siswa or Admin Doc
  const isLeadActuallyIntegrated = useCallback(
    (l: MarketingLead) => {
      const sid = l.siswaId || l.integratedStudentId;
      const hasFlag = Boolean(l.terintegrasiKeAdmin1 || l.integratedToAdmin1);
      const existsInStudents = sid ? students.some((s) => s.id === sid) : false;
      const nameMatchedStudent = students.find(
        (s) =>
          Boolean(
            s.namaLengkap &&
              l.namaLengkap &&
              s.namaLengkap.toLowerCase().trim() === l.namaLengkap.toLowerCase().trim()
          ) ||
          Boolean(
            s.noHp &&
              l.noWhatsapp &&
              s.noHp.replace(/\D/g, '') === l.noWhatsapp.replace(/\D/g, '')
          )
      );

      return Boolean((hasFlag && sid) || existsInStudents || nameMatchedStudent);
    },
    [students]
  );

  const getEffectiveStudentId = useCallback(
    (l: MarketingLead) => {
      if (l.siswaId) return l.siswaId;
      if (l.integratedStudentId) return l.integratedStudentId;
      const nameMatchedStudent = students.find(
        (s) =>
          Boolean(
            s.namaLengkap &&
              l.namaLengkap &&
              s.namaLengkap.toLowerCase().trim() === l.namaLengkap.toLowerCase().trim()
          ) ||
          Boolean(
            s.noHp &&
              l.noWhatsapp &&
              s.noHp.replace(/\D/g, '') === l.noWhatsapp.replace(/\D/g, '')
          )
      );
      return nameMatchedStudent?.id || l.id;
    },
    [students]
  );

  const integratedStudentsCount = scopedLeads.filter((l) => isLeadActuallyIntegrated(l)).length;

  // Pipeline Stages (Canonical 6 Stages)
  const pipelineStages: { status: CanonicalPipelineStageKey; label: string; color: string; desc: string; icon: any }[] = [
    {
      status: 'LEAD_BARU',
      label: bilingual('1. Lead Baru', '1. 新規リード'),
      color: 'border-blue-500 bg-blue-50/50 text-blue-900',
      desc: bilingual('Inquiry baru masuk dari sosmed/web/mitra', 'SNS/Web/紹介からの新規問い合わせ'),
      icon: UserPlus
    },
    {
      status: 'KONTAK_AWAL',
      label: bilingual('2. Kontak Awal', '2. 初回コンタクト'),
      color: 'border-amber-500 bg-amber-50/50 text-amber-900',
      desc: bilingual('Chat WA & perkenalan program LPK', 'WA連絡・プログラム案内'),
      icon: Phone
    },
    {
      status: 'KONSULTASI_LPK',
      label: bilingual('3. Konseling / Edukasi', '3. カウンセリング・相談'),
      color: 'border-purple-500 bg-purple-50/50 text-purple-900',
      desc: bilingual('Konsultasi detail gaji, biaya & tahapan', '給与・費用・スケジュールの相談'),
      icon: MessageCircle
    },
    {
      status: 'FOLLOW_UP',
      label: bilingual('4. Follow Up Intensif', '4. 集中フォローアップ'),
      color: 'border-indigo-500 bg-indigo-50/50 text-indigo-900',
      desc: bilingual('Penyampaian berkas, persetujuan ortu', '必要書類提出・保護者同意確認'),
      icon: Clock
    },
    {
      status: 'DEAL_TERDAFTAR',
      label: bilingual('5. Closing (Terdaftar & Terintegrasi)', '5. 成約 (登録・連携完了)'),
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-900',
      desc: bilingual('Resmi terdaftar & tersinkron ke semua portal', '正式登録＆全ポータルへ即時同期'),
      icon: CheckCircle2
    },
    {
      status: 'LOST_BATAL',
      label: bilingual('Batal / Tertunda', '辞退 / 保留'),
      color: 'border-rose-300 bg-rose-50/50 text-rose-900',
      desc: bilingual('Belum berminat atau kendala keluarga', '検討見送りまたは家庭の事情等'),
      icon: AlertCircle
    }
  ];

  // Helper for Auto-Filling Quick Test Data
  const handleAutoFillForm = (preset: 'kaigo' | 'pertanian' | 'engineering' | 'irodori') => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    if (preset === 'irodori') {
      setFormNamaLengkap(`Rizky Pratama ${randomNum}`);
      setFormNamaPanggilan('Rizky');
      setFormNoWhatsapp(`08125544${randomNum}`);
      setFormEmail(`rizky.${randomNum}@ijef.id`);
      setFormKotaDomisili('Garut');
      setFormProvinsiDomisili('Jawa Barat');
      setFormTempatLahir('Garut');
      setFormTanggalLahir('2004-06-18');
      setFormJenisKelamin('Laki-laki');
      setFormAgama('Islam');
      setFormGolonganDarah('O');
      setFormStatusPernikahan('Lajang');
      setFormNikKtp(`320501180604${randomNum}`);
      setFormNoKk(`320501100512${randomNum}`);
      setFormAlamatLengkap(`Kp. Tarogong No. ${randomNum}, Tarogong Kidul, Garut`);
      setFormKategoriKandidat('SISWA IJEF - Offline');
      setFormBidangMinat('Belajar Bahasa Jepang Irodori');
      setFormSumberLead('Sosialisasi SMK / SMA');
      setFormPicStaff('Beno Ryan');
      setFormTinggiBadan(169);
      setFormBeratBadan(61);
      setFormPendidikanTerakhir('SMK / SMA');
      setFormJurusanPendidikan('Teknik Komputer & Jaringan');
      setFormRiwayatBahasaJepang('Belum Pernah (Pemula N5)');
      setFormRiwayatPaspor('BELUM');
      setFormMemilikiSim('SIM C');
      setFormNamaAyah('Dedi Supriadi');
      setFormNamaIbu('Eni Rohaeni');
      setFormNoHpOrangTua(`08139988${randomNum}`);
      setFormPekerjaanOrangTua('Wiraswasta');
      setFormCatatanMarketing('Siswa baru asrama IJEF. Fokus utama belajar bahasa Jepang Irodori A1/A2. Sektor spesifik akan diupdate saat siap matching job.');
    } else if (preset === 'kaigo') {
      setFormNamaLengkap(`Fajar Ramadhan ${randomNum}`);
      setFormNamaPanggilan('Fajar');
      setFormNoWhatsapp(`08129988${randomNum}`);
      setFormEmail(`fajar.${randomNum}@ijef.id`);
      setFormKotaDomisili('Bandung');
      setFormProvinsiDomisili('Jawa Barat');
      setFormTempatLahir('Bandung');
      setFormTanggalLahir('2004-03-20');
      setFormJenisKelamin('Laki-laki');
      setFormAgama('Islam');
      setFormGolonganDarah('O');
      setFormStatusPernikahan('Lajang');
      setFormNikKtp(`320401200304${randomNum}`);
      setFormNoKk(`320401100512${randomNum}`);
      setFormAlamatLengkap(`Jl. Cihampelas No. ${randomNum}, RT 02/05, Kota Bandung`);
      setFormKategoriKandidat('SISWA IJEF - Offline');
      setFormBidangMinat('Kaigo (Caregiver / Perawat Lansia)');
      setFormSumberLead('Instagram Ads');
      setFormPicStaff('Beno Ryan');
      setFormTinggiBadan(173);
      setFormBeratBadan(65);
      setFormPendidikanTerakhir('SMK / SMA');
      setFormJurusanPendidikan('Keperawatan');
      setFormRiwayatBahasaJepang('Belum Pernah (Pemula N5)');
      setFormRiwayatPaspor('BELUM');
      setFormMemilikiSim('SIM C');
      setFormNamaAyah('Bambang Sutrisno');
      setFormNamaIbu('Siti Aminah');
      setFormNoHpOrangTua(`08137788${randomNum}`);
      setFormPekerjaanOrangTua('Wiraswasta');
      setFormCatatanMarketing('Sangat termotivasi bekerja di panti lansia Tokyo. Siap tinggal di asrama LPK.');
    } else if (preset === 'pertanian') {
      setFormNamaLengkap(`Dewi Anggraini ${randomNum}`);
      setFormNamaPanggilan('Dewi');
      setFormNoWhatsapp(`08138877${randomNum}`);
      setFormEmail(`dewi.${randomNum}@ijef.id`);
      setFormKotaDomisili('Cirebon');
      setFormProvinsiDomisili('Jawa Barat');
      setFormTempatLahir('Cirebon');
      setFormTanggalLahir('2003-08-14');
      setFormJenisKelamin('Perempuan');
      setFormAgama('Islam');
      setFormGolonganDarah('A');
      setFormStatusPernikahan('Lajang');
      setFormNikKtp(`320901540803${randomNum}`);
      setFormNoKk(`320901100512${randomNum}`);
      setFormAlamatLengkap(`Desa Sumberjaya No. ${randomNum}, Kec. Plumbon, Cirebon`);
      setFormKategoriKandidat('SISWA IJEF - Online');
      setFormBidangMinat('Pertanian (Nogyo / Greenhouse)');
      setFormSumberLead('TikTok Official IJEF');
      setFormPicStaff('Salma Nurhaliza');
      setFormTinggiBadan(160);
      setFormBeratBadan(50);
      setFormPendidikanTerakhir('SMA');
      setFormJurusanPendidikan('IPA');
      setFormRiwayatBahasaJepang('Pernah Belajar Mandiri (Hiragana/Katakana)');
      setFormRiwayatPaspor('BELUM');
      setFormMemilikiSim('SIM C');
      setFormNamaAyah('Suryanto');
      setFormNamaIbu('Nurhayati');
      setFormNoHpOrangTua(`08126655${randomNum}`);
      setFormPekerjaanOrangTua('Petani');
      setFormCatatanMarketing('Ingin program Tokutei Ginou Pertanian Hokkaido/Nagano. Keluarga sangat mendukung.');
    } else {
      setFormNamaLengkap(`Hendra Gunawan, S.T. ${randomNum}`);
      setFormNamaPanggilan('Hendra');
      setFormNoWhatsapp(`08216655${randomNum}`);
      setFormEmail(`hendra.${randomNum}@ijef.id`);
      setFormKotaDomisili('Semarang');
      setFormProvinsiDomisili('Jawa Tengah');
      setFormTempatLahir('Semarang');
      setFormTanggalLahir('2001-11-10');
      setFormJenisKelamin('Laki-laki');
      setFormAgama('Islam');
      setFormGolonganDarah('B');
      setFormStatusPernikahan('Lajang');
      setFormNikKtp(`337401101101${randomNum}`);
      setFormNoKk(`337401100512${randomNum}`);
      setFormAlamatLengkap(`Jl. Pandanaran No. ${randomNum}, Kota Semarang`);
      setFormKategoriKandidat('MATCHING JOB - Engineering / Gijinkoku');
      setFormBidangMinat('Engineering & Konstruksi / IT');
      setFormSumberLead('Referral Alumni / Teman');
      setFormPicStaff('Agus Puriyanto');
      setFormTinggiBadan(176);
      setFormBeratBadan(68);
      setFormPendidikanTerakhir('S1 / D4');
      setFormJurusanPendidikan('Teknik Mesin');
      setFormRiwayatBahasaJepang('Sertifikat JLPT N4 / NAT-TEST');
      setFormRiwayatPaspor('SUDAH');
      setFormMemilikiSim('SIM A & SIM C');
      setFormNamaAyah('Gunawan');
      setFormNamaIbu('Sri Wahyuni');
      setFormNoHpOrangTua(`08217744${randomNum}`);
      setFormPekerjaanOrangTua('PNS Pensiunan');
      setFormCatatanMarketing('Lulusan Teknik Mesin siap interview Gijinkoku ke Jepang. Paspor aktif & JLPT N4.');
    }
  };

  // Submit New Lead Form
  const handleSubmitLeadForm = (directIntegrate: boolean) => {
    if (!formNamaLengkap.trim()) {
      alert(bilingual('Nama lengkap calon siswa wajib diisi.', '生徒の氏名を入力してください。'));
      return;
    }
    if (!formNoWhatsapp.trim()) {
      alert(bilingual('Nomor WhatsApp wajib diisi.', 'WhatsApp番号を入力してください。'));
      return;
    }

    const leadId = `LEAD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    
    // Calculate approximate age
    const birthYear = new Date(formTanggalLahir).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedUsia = !isNaN(birthYear) ? Math.max(18, currentYear - birthYear) : 21;

    const newLead: MarketingLead = {
      id: leadId,
      namaLengkap: formNamaLengkap.trim(),
      namaPanggilan: formNamaPanggilan.trim() || formNamaLengkap.split(' ')[0],
      noWhatsapp: formNoWhatsapp.trim(),
      email: formEmail.trim() || `siswa.${leadId.toLowerCase()}@ijef.id`,
      kotaDomisili: formKotaDomisili.trim() || 'Bandung',
      provinsiDomisili: formProvinsiDomisili,
      tempatLahir: formTempatLahir.trim() || 'Bandung',
      tanggalLahir: formTanggalLahir,
      usia: calculatedUsia,
      jenisKelamin: formJenisKelamin,
      agama: formAgama,
      golonganDarah: formGolonganDarah,
      statusPernikahan: formStatusPernikahan,
      nikKtp: formNikKtp.trim() || `320101${String(Date.now()).slice(-10)}`,
      noKk: formNoKk.trim() || `320101${String(Date.now()).slice(-10)}`,
      alamatLengkap: formAlamatLengkap.trim() || 'Jl. Raya LPK IJEF Corp No. 1, Bandung',
      kategoriKandidat: formKategoriKandidat,
      programMinat: formKategoriKandidat,
      bidangMinat: formBidangMinat,
      sumberLead: formSumberLead,
      picMarketingStaff: formPicStaff,
      statusLead: directIntegrate ? 'DEAL_TERDAFTAR' : 'LEAD_BARU',
      tanggalMasukLead: new Date().toISOString().split('T')[0],
      tinggiBadan: Number(formTinggiBadan) || 170,
      beratBadan: Number(formBeratBadan) || 60,
      pendidikanTerakhir: formPendidikanTerakhir,
      jurusanPendidikan: formJurusanPendidikan,
      riwayatBahasaJepang: formRiwayatBahasaJepang,
      riwayatPaspor: formRiwayatPaspor,
      memilikiSim: formMemilikiSim,
      kondisiFisikKhusus: {
        tato: formTato,
        merokok: formMerokok,
        butaWarna: formButaWarna,
        patahTulang: formPatahTulang
      },
      namaAyah: formNamaAyah,
      namaIbu: formNamaIbu,
      noHpOrangTua: formNoHpOrangTua,
      pekerjaanOrangTua: formPekerjaanOrangTua,
      alamatOrangTua: formAlamatLengkap,
      catatanKonselingAwal: formCatatanMarketing,
      riwayatFollowUp: [
        {
          id: `FL-${Date.now()}`,
          tanggal: new Date().toLocaleString('id-ID'),
          timestamp: new Date().toISOString(),
          petugas: user?.displayName || formPicStaff || 'Marketing LPK',
          actorName: user?.displayName || formPicStaff || 'Marketing LPK',
          metode: 'WhatsApp',
          channel: 'WHATSAPP',
          hasil: directIntegrate 
            ? (isIjefCategory(formKategoriKandidat)
                ? 'Input langsung & integrasi ke Portal Admin Siswa (SIM-SB) & Skrining MCU.'
                : 'Input langsung & integrasi ke Portal Admin Doc (CV Rirekisho JIS & Matching Job).')
            : 'Lead baru berhasil diinput ke CRM. Menunggu kontak awal tim marketing.',
          ringkasanPembahasan: directIntegrate 
            ? (isIjefCategory(formKategoriKandidat)
                ? 'Input langsung & integrasi ke Portal Admin Siswa (SIM-SB) & Skrining MCU.'
                : 'Input langsung & integrasi ke Portal Admin Doc (CV Rirekisho JIS & Matching Job).')
            : 'Lead baru berhasil diinput ke CRM. Menunggu kontak awal tim marketing.',
          statusLeadSetelahnya: directIntegrate ? 'DEAL_TERDAFTAR' : 'LEAD_BARU'
        }
      ],
      followUpLogs: [
        {
          id: `LOG-${Date.now()}`,
          tanggal: new Date().toLocaleString('id-ID'),
          timestamp: new Date().toISOString(),
          actorName: user?.displayName || formPicStaff || 'Marketing LPK',
          petugas: user?.displayName || formPicStaff || 'Marketing LPK',
          channel: 'WHATSAPP',
          metode: 'WhatsApp',
          hasil: directIntegrate 
            ? (isIjefCategory(formKategoriKandidat)
                ? bilingual('Input langsung & integrasi ke Portal Admin Siswa (SIM-SB) & Skrining MCU.', '生徒台帳（SIM-SB）および健康診断への直接連携登録。')
                : bilingual('Input langsung & integrasi ke Portal Admin Doc (CV Rirekisho JIS & Matching Job).', '管理書類ポータル（JIS履歴書・求人マッチング）への直接連携登録。'))
            : bilingual(
                'Lead baru berhasil diinput ke CRM. Menunggu kontak awal tim marketing.',
                '新規リードがCRMに保存されました。マーケティングチームの初回連絡待ち。'
              ),
          ringkasanPembahasan: directIntegrate 
            ? (isIjefCategory(formKategoriKandidat)
                ? bilingual('Input langsung & integrasi ke Portal Admin Siswa (SIM-SB) & Skrining MCU.', '生徒台帳（SIM-SB）および健康診断への直接連携登録。')
                : bilingual('Input langsung & integrasi ke Portal Admin Doc (CV Rirekisho JIS & Matching Job).', '管理書類ポータル（JIS履歴書・求人マッチング）への直接連携登録。'))
            : bilingual(
                'Lead baru berhasil diinput ke CRM. Menunggu kontak awal tim marketing.',
                '新規リードがCRMに保存されました。マーケティングチームの初回連絡待ち。'
              ),
          statusLeadSetelahnya: directIntegrate ? 'DEAL_TERDAFTAR' : 'LEAD_BARU'
        }
      ]
    };

    if (directIntegrate) {
      const isIjef = isIjefCategory(newLead.kategoriKandidat);
      const result = registerAndIntegrateLeadToAllPortals(newLead);
      const createdStudentId = typeof result === 'object' ? result.studentId : result;
      if (isIjef) {
        setSuccessToast(
          bilingual(
            `🎉 Sukses! Siswa IJEF "${newLead.namaLengkap}" berhasil dibuat dengan ID [${createdStudentId}] dan langsung masuk ke Portal Admin Siswa (SIM-SB) & Skrining MCU!`,
            `🎉 成功！ IJEF生徒「${newLead.namaLengkap}」がID [${createdStudentId}] で登録され、生徒台帳（SIM-SB）へ直接連携されました！`
          )
        );
      } else {
        setSuccessToast(
          bilingual(
            `🎉 Sukses! Kandidat "${newLead.namaLengkap}" (${newLead.kategoriKandidat}) berhasil dibuat dengan ID [${createdStudentId}] dan langsung masuk ke Portal Admin Doc (CV Rirekisho JIS & Matching Job)!`,
            `🎉 成功！ 候補者「${newLead.namaLengkap}」がID [${createdStudentId}] で登録され、管理書類ポータル（JIS履歴書・求人マッチング）へ直接連携されました！`
          )
        );
      }
    } else {
      saveLead(newLead);
      setSuccessToast(
        bilingual(
          `✅ Lead prospek "${newLead.namaLengkap}" berhasil disimpan ke sistem CRM Marketing!`,
          `✅ 見込み生徒「${newLead.namaLengkap}」がマーケティングCRMに保存されました！`
        )
      );
    }

    // Reset Form
    setFormNamaLengkap('');
    setFormNamaPanggilan('');
    setFormNoWhatsapp('');
    setFormEmail('');
    setFormKotaDomisili('');
    setFormNikKtp('');
    setFormNoKk('');
    setFormAlamatLengkap('');
    setFormCatatanMarketing('');
    
    // Switch to Pipeline View
    setActiveInternalTab('pipeline');
  };

  // One-Click Integration for Existing Lead
  const handleTriggerIntegrate = (lead: MarketingLead) => {
    const isIjef = isIjefCategory(lead.kategoriKandidat || lead.programMinat);
    const targetInfo = getTargetPortalLabel(lead.kategoriKandidat || lead.programMinat);

    if (isLeadActuallyIntegrated(lead)) {
      const existingId = getEffectiveStudentId(lead);
      setSuccessToast(
        bilingual(
          `Lead "${lead.namaLengkap}" sudah terdaftar dengan ID: ${existingId}`,
          `リード「${lead.namaLengkap}」は既にID「${existingId}」で登録済みです。`
        )
      );
      return;
    }

    const result = registerAndIntegrateLeadToAllPortals(lead);
    const generatedStudentId = typeof result === 'object' ? result.studentId : result;
    if (isIjef) {
      setSuccessToast(
        bilingual(
          `🚀 Integrasi Berhasil! Data Siswa IJEF "${lead.namaLengkap}" telah masuk ke Portal ${targetInfo.portalName} [${generatedStudentId}] dan modul MCU Kesehatan.`,
          `🚀 連携完了！ IJEF生徒「${lead.namaLengkap}」が${targetInfo.portalName} [${generatedStudentId}] に連携されました！`
        )
      );
    } else {
      setSuccessToast(
        bilingual(
          `🚀 Integrasi Berhasil! Data Kandidat "${lead.namaLengkap}" (${lead.kategoriKandidat}) telah masuk langsung ke Portal ${targetInfo.portalName} (CV-Portal JIS ID: ${generatedStudentId}) untuk proses matching job.`,
          `🚀 連携完了！ 候補者「${lead.namaLengkap}」が${targetInfo.portalName}（JIS履歴書 ID: ${generatedStudentId}）へ直接連携されました！`
        )
      );
    }
  };

  // Drag & Drop Handlers for Kanban Pipeline
  const handleDragStart = (e: React.DragEvent, lead: MarketingLead) => {
    setDraggedLeadId(lead.id);
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageStatus: CanonicalPipelineStageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageStatus) {
      setDragOverStage(stageStatus);
    }
  };

  const handleDragEnter = (e: React.DragEvent, stageStatus: CanonicalPipelineStageKey) => {
    e.preventDefault();
    setDragOverStage(stageStatus);
  };

  const handleDragLeave = (e: React.DragEvent, stageStatus: CanonicalPipelineStageKey) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stageStatus) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: CanonicalPipelineStageKey) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDragOverStage(null);
    setDraggedLeadId(null);

    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentStage = getCanonicalPipelineStage(lead.statusLead);
    if (currentStage === targetStage) return;

    const targetStageObj = pipelineStages.find((s) => s.status === targetStage);
    const targetLabel = targetStageObj?.label || targetStage;

    updateLeadStatus(
      leadId,
      targetStage as LeadStatus,
      `Status dipindahkan ke [${targetLabel}] via geser kartu (Kanban Drag & Drop)`
    );

    setSuccessToast(
      bilingual(
        `✨ Berhasil digeser! "${lead.namaLengkap}" dipindahkan ke tahap: ${targetLabel}`,
        `✨ 移動完了！「${lead.namaLengkap}」がステージ「${targetLabel}」へ移動しました`
      )
    );
  };

  // Open WhatsApp Link
  const handleOpenWhatsApp = (lead: MarketingLead, customMessage?: string) => {
    let cleanPhone = lead.noWhatsapp.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message =
      customMessage ||
      bilingual(
        `Halo Kak ${lead.namaPanggilan || lead.namaLengkap}, salam kenal saya ${user?.displayName || lead.picMarketingStaff || 'Tim Konselor'} dari LPK IJEF CORP.\n\nTerima kasih telah berkonsultasi mengenai program Pelatihan & Kerja Jepang (${translateJobSector(lead.bidangMinat, 'id') || 'Tokutei Ginou'}). Apakah saat ini ada waktu luang untuk kami jelaskan tahapan pendaftaran & jadwal kelas terdekat? Arigatou gozaimasu!`,
        `こんにちは、${lead.namaPanggilan || lead.namaLengkap}様。LPK IJEF CORPの${user?.displayName || lead.picMarketingStaff || 'カウンセラー'}です。\n\n日本就労・研修プログラム（${translateJobSector(lead.bidangMinat, 'ja') || '特定技能'}）へのご相談ありがとうございます。今後の登録手続きや直近の研修スケジュールについてご案内してもよろしいでしょうか？よろしくお願いいたします。`
      );

    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Save Follow Up Log
  const handleSaveFollowUpLog = () => {
    if (!followUpTargetLead) return;
    if (!followUpNotes.trim()) {
      alert(bilingual('Catatan follow-up wajib diisi.', 'フォローアップ記録を入力してください。'));
      return;
    }

    const newLog: FollowUpLogItem = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: user?.displayName || followUpTargetLead.picMarketingStaff || 'Tim Marketing',
      channel: followUpChannel,
      ringkasanPembahasan: followUpNotes.trim(),
      tindakLanjutBerikutnya: followUpNextAction.trim() || undefined,
      jadwalFollowUpBerikutnya: followUpNextDate || undefined,
      statusLeadSetelahnya: followUpTargetLead.statusLead
    };

    addFollowUpLog(followUpTargetLead.id, newLog);
    setFollowUpModalOpen(false);
    setFollowUpNotes('');
    setFollowUpNextAction('');
    setFollowUpNextDate('');
    setSuccessToast(
      bilingual(
        `📝 Catatan follow-up untuk "${followUpTargetLead.namaLengkap}" berhasil ditambahkan!`,
        `📝 「${followUpTargetLead.namaLengkap}」のフォローアップ記録を保存しました！`
      )
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 0: DASHBOARD ANALITIK VIEW */}
      {activeTab === 'dashboard' && (
        <MarketingDashboardView
          leads={scopedLeads}
          staffList={staffList}
          accessInfo={accessInfo}
          allTeamLeads={leads}
          selectedStaffFilter={selectedStaffInspector}
          onSelectStaffFilter={setSelectedStaffInspector}
          onNavigateTab={(tab, catFilter) => {
            if (catFilter) {
              setCategoryFilter(catFilter);
            }
            setActiveInternalTab(tab);
          }}
          selectedCategoryFilter={categoryFilter}
          onSelectCategoryFilter={setCategoryFilter}
          onOpenWhatsApp={handleOpenWhatsApp}
          onOpenFollowUp={(lead) => {
            setFollowUpTargetLead(lead);
            setFollowUpModalOpen(true);
          }}
          onOpenDetail={(lead) => setActiveDetailLead(lead)}
          onTriggerIntegrate={handleTriggerIntegrate}
        />
      )}

      {/* TAB 1: KANBAN PIPELINE VIEW */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Interactive Helper Banner */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-indigo-50 border border-orange-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center space-x-2.5 text-xs text-slate-800">
              <div className="w-7 h-7 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <GripVertical className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900">
                  {bilingual('Kanban Drag & Drop Aktif:', 'インタラクティブ看板:')}
                </span>{' '}
                <span className="text-slate-600">
                  {bilingual(
                    'Klik & tahan/geser (Drag & Drop) kartu kandidat langsung ke kolom tahapan tujuan, atau gunakan opsi dropdown di sudut kartu.',
                    'カードをドラッグ＆ドロップして目的の列に直接移動するか、各カードの選択メニューをご利用ください。'
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Sort Selector in Kanban */}
              <div className="flex items-center space-x-1.5 bg-white border border-orange-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-bold shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="DEFAULT">{bilingual('Sortir: Default', '並び替え: デフォルト')}</option>
                  <option value="NAME_ASC">{bilingual('Nama (A - Z)', '氏名順 (A - Z)')}</option>
                  <option value="NAME_DESC">{bilingual('Nama (Z - A)', '氏名順 (Z - A)')}</option>
                  <option value="DATE_NEWEST">{bilingual('Tanggal Terbaru', '日付: 新しい順')}</option>
                  <option value="DATE_OLDEST">{bilingual('Tanggal Paling Lama (termasuk tanpa tanggal)', '日付: 古い順 (日付なし含む)')}</option>
                  <option value="LAST_7_DAYS">{bilingual('7 Hari Terakhir', '過去7日間')}</option>
                  <option value="LAST_30_DAYS">{bilingual('30 Hari Terakhir', '過去30日間')}</option>
                  <option value="THIS_MONTH">{bilingual('Bulan Ini', '今月')}</option>
                  <option value="LAST_MONTH">{bilingual('Bulan Lalu', '先月')}</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-orange-200 rounded-xl px-2.5 py-1 text-xs text-slate-800 font-bold shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">{bilingual('Semua Kategori', '全カテゴリー')}</option>
                <option value="IJEF">{bilingual('⭐ Jalur IJEF (SIM-SB)', '⭐ IJEF生 (SIM-SB)')}</option>
                <option value="NON_IJEF">{bilingual('🌐 Jalur Non-IJEF (JIS)', '🌐 Non-IJEF生 (JIS求人)')}</option>
                <option value="SISWA IJEF - Offline">1. SISWA IJEF - Offline</option>
                <option value="SISWA IJEF - Online">2. SISWA IJEF - Online</option>
                <option value="SISWA NON IJEF (New Comer)">3. SISWA NON IJEF (New Comer)</option>
                <option value="SISWA MITRA / NON IJEF">4. SISWA MITRA / NON IJEF</option>
                <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">5. Ex-Magang / Ex-Trainee</option>
                <option value="MATCHING JOB - Engineering / Gijinkoku">6. Engineering / Gijinkoku</option>
              </select>

              {categoryFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className="text-[10px] font-extrabold text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                >
                  ✕ Reset
                </button>
              )}

              <div className="text-[11px] font-bold text-orange-800 bg-white/90 px-3 py-1 rounded-xl border border-orange-200 shrink-0 flex items-center space-x-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{bilingual(`${filteredLeads.length} Lead Aktif`, `${filteredLeads.length}件のリード`)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {pipelineStages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === stage.status);
              const StageIcon = stage.icon;
              const isOverThisStage = dragOverStage === stage.status;

              return (
                <div
                  key={stage.status}
                  onDragOver={(e) => handleDragOver(e, stage.status)}
                  onDragEnter={(e) => handleDragEnter(e, stage.status)}
                  onDragLeave={(e) => handleDragLeave(e, stage.status)}
                  onDrop={(e) => handleDrop(e, stage.status)}
                  className={`border rounded-2xl p-3 flex flex-col min-h-[520px] transition-all duration-200 ${
                    isOverThisStage
                      ? 'bg-orange-50/90 border-orange-500 ring-4 ring-orange-500/20 shadow-lg scale-[1.01]'
                      : 'bg-slate-100/90 border-slate-200'
                  }`}
                >
                  {/* Stage Header */}
                  <div className={`p-2.5 rounded-xl border shadow-2xs space-y-1 mb-3 transition-colors ${
                    isOverThisStage ? 'bg-orange-100/80 border-orange-300' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                        <StageIcon className="w-3.5 h-3.5 text-orange-600" />
                        <span className="whitespace-normal leading-snug font-bold text-slate-900">{stage.label}</span>
                      </div>
                      <span className={`w-5 h-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center transition-colors ${
                        isOverThisStage ? 'bg-orange-600 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        {stageLeads.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{stage.desc}</p>
                  </div>

                  {/* Stage Leads Cards */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] pr-0.5">
                    {/* Active Drag Over Placeholder */}
                    {isOverThisStage && draggedLeadId && (
                      <div className="p-3 border-2 border-dashed border-orange-500 bg-orange-100/70 rounded-xl text-center text-xs font-bold text-orange-900 flex items-center justify-center space-x-2 animate-pulse shadow-inner">
                        <Sparkles className="w-4 h-4 text-orange-600 animate-spin" />
                        <span>{bilingual(`Lepas di sini untuk pindah ke ${stage.label}`, `ここにドロップして移動`)}</span>
                      </div>
                    )}

                    {stageLeads.length === 0 && !isOverThisStage ? (
                      <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-[11px]">
                        {bilingual('Tidak ada lead', 'リードなし')}
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 rounded-xl border bg-white shadow-2xs hover:shadow-md transition-all space-y-2.5 cursor-grab active:cursor-grabbing select-none group ${
                            draggedLeadId === lead.id
                              ? 'opacity-40 scale-95 border-dashed border-orange-400 bg-orange-50/60 ring-2 ring-orange-400'
                              : isLeadActuallyIntegrated(lead)
                              ? 'border-emerald-300 ring-1 ring-emerald-500/20 hover:border-emerald-400'
                              : 'border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          {/* Top: Program, Destination Badge & Grip */}
                          <div className="flex items-center justify-between text-[10px] gap-1">
                            <span className={`font-bold px-1.5 py-0.5 rounded border truncate ${
                              isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}>
                              {isIjefCategory(lead.kategoriKandidat || lead.programMinat) ? 'Admin Siswa' : 'Admin Doc'}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <span className="text-slate-500 font-medium truncate max-w-[65px]">
                                PIC: {lead.picMarketingStaff?.split(' ')[0] || 'Admin'}
                              </span>
                              <button
                                type="button"
                                draggable={false}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickMoveLead(lead);
                                }}
                                className="p-0.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition cursor-pointer"
                                title={bilingual('Klik untuk pilih tahap / Tahan & Geser', 'クリックしてステージ選択 / ドラッグして移動')}
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Candidate Identity */}
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs leading-snug">
                              {lead.namaLengkap}
                            </h4>
                            <div className="text-[11px] text-slate-600 font-medium flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {lead.kotaDomisili || 'Bandung'} • {lead.usia} {bilingual('thn', '歳')}
                              </span>
                            </div>
                            <div className="text-[10px] text-indigo-700 font-bold mt-1 truncate">
                              🎯 {translateJobSector(lead.bidangMinat || lead.programMinat, lang) || lead.bidangMinat || lead.programMinat}
                            </div>
                          </div>

                          {/* Integration Status Badge */}
                          {isLeadActuallyIntegrated(lead) ? (
                            <div className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center space-x-1.5 ${
                              isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                  ? bilingual(`Admin Siswa: ${getEffectiveStudentId(lead)}`, `生徒台帳: ${getEffectiveStudentId(lead)}`)
                                  : bilingual(`Admin Doc: ${getEffectiveStudentId(lead)}`, `書類管理: ${getEffectiveStudentId(lead)}`)}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTriggerIntegrate(lead);
                              }}
                              className={`w-full py-1.5 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition flex items-center justify-center space-x-1 cursor-pointer active:scale-95 ${
                                isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                              }`}
                              title={
                                isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                  ? bilingual('Integrasikan langsung ke Admin Siswa (SIM-SB) & Skrining MCU', '生徒台帳（SIM-SB）へ直接連携')
                                  : bilingual('Integrasikan langsung ke Admin Doc (CV-Portal JIS & Pool Matching)', '管理書類ポータル（JIS履歴書）へ直接連携')
                              }
                            >
                              <Sparkles className="w-3 h-3 text-amber-200" />
                              <span>
                                {isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                                  ? bilingual('⚡ Masuk Admin Siswa', '⚡ 生徒台帳へ連携')
                                  : bilingual('⚡ Masuk Admin Doc', '⚡ 管理書類へ連携')}
                              </span>
                            </button>
                          )}

                          {/* Action Bar */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                              type="button"
                              draggable={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWhatsApp(lead);
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
                              title={bilingual('Chat WhatsApp', 'WhatsApp チャットを開く')}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              draggable={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFollowUpTargetLead(lead);
                                setFollowUpModalOpen(true);
                              }}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                              title={bilingual('Tambah Catatan Follow-Up', 'フォローアップ記録を追加')}
                            >
                              <Clock className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              draggable={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLead(lead);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition cursor-pointer"
                              title={bilingual('Edit Data Lead', 'リード情報を編集')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              draggable={false}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDetailLead(lead);
                              }}
                              className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                              title={bilingual('Lihat Detail Profil Lead', 'リード詳細プロフィール')}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Move Stage Dropdown */}
                            <select
                              draggable={false}
                              value={getCanonicalPipelineStage(lead.statusLead)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                              className="text-[9px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 font-bold focus:outline-none max-w-[78px] truncate cursor-pointer"
                            >
                              <option value="LEAD_BARU">{bilingual('1. Baru', '1. 新規')}</option>
                              <option value="KONTAK_AWAL">{bilingual('2. Kontak', '2. 初回連絡')}</option>
                              <option value="KONSULTASI_LPK">{bilingual('3. Konsul', '3. 相談')}</option>
                              <option value="FOLLOW_UP">{bilingual('4. Follow', '4. フォロー')}</option>
                              <option value="DEAL_TERDAFTAR">{bilingual('5. Closing', '5. 成約')}</option>
                              <option value="LOST_BATAL">{bilingual('6. Batal', '6. 辞退')}</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FORMULIR INTAKE & PENDAFTARAN SISWA BARU */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header of Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {bilingual('Pendaftaran & Intake Calon Siswa', '生徒登録＆インテーク')}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {bilingual('Formulir Penerimaan & Registrasi Siswa Baru', '新規生徒受付・登録フォーム')}
              </h2>
              <p className="text-xs text-slate-500">
                {bilingual(
                  'Input data lengkap siswa untuk disimpan ke CRM atau langsung didaftarkan & disinkronkan ke seluruh portal LPK IJEF.',
                  'CRMに生徒データを保存するか、LPK IJEFの全ポータル（生徒台帳、健康診断、JIS履歴書）へ直接登録・連携します。'
                )}
              </p>
            </div>

            {/* Quick Demo Pre-fills */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] font-bold text-slate-500">{bilingual('Contoh Cepat:', 'デモ入力:')}</span>
              <button
                type="button"
                onClick={() => handleAutoFillForm('irodori')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
              >
                <span>🇯🇵</span>
                <span>{bilingual('+ Demo Belajar Irodori (Asrama)', '+ いろどり学習デモ (寮生)')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAutoFillForm('kaigo')}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {bilingual('+ Demo Kaigo (Bandung)', '+ 介護デモ (バンドン)')}
              </button>
              <button
                type="button"
                onClick={() => handleAutoFillForm('pertanian')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {bilingual('+ Demo Pertanian (Cirebon)', '+ 農業デモ (チレビョン)')}
              </button>
              <button
                type="button"
                onClick={() => handleAutoFillForm('engineering')}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                {bilingual('+ Demo Engineering (S1)', '+ 技術デモ (大卒)')}
              </button>
            </div>
          </div>

          {/* Form Grid Sections */}
          <div className="space-y-6">
            {/* Section 1: Data Identitas Pribadi */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>{bilingual('Data Identitas & Kontak Calon Siswa', '1. 基本情報・連絡先')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nama Lengkap Sesuai KTP', '氏名 (身分証準拠)')} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNamaLengkap}
                    onChange={(e) => setFormNamaLengkap(e.target.value)}
                    placeholder={bilingual('Contoh: Bagas Pratama', '例: Bagas Pratama')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Nama Panggilan', '呼び名・ニックネーム')}</label>
                  <input
                    type="text"
                    value={formNamaPanggilan}
                    onChange={(e) => setFormNamaPanggilan(e.target.value)}
                    placeholder={bilingual('Contoh: Bagas', '例: Bagas')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nomor WhatsApp Aktif', 'WhatsApp 番号')} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formNoWhatsapp}
                    onChange={(e) => setFormNoWhatsapp(e.target.value)}
                    placeholder="081299887701"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Alamat Email Aktif', 'メールアドレス')}</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="siswa@gmail.com"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('NIK KTP (16 Digit)', '国民身分番号 (NIK KTP)')}</label>
                  <input
                    type="text"
                    value={formNikKtp}
                    onChange={(e) => setFormNikKtp(e.target.value)}
                    placeholder="3201011505030001"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Nomor Kartu Keluarga (KK)', '家族カード番号 (No KK)')}</label>
                  <input
                    type="text"
                    value={formNoKk}
                    onChange={(e) => setFormNoKk(e.target.value)}
                    placeholder="3201011005120011"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tempat Lahir', '出生地')}</label>
                  <input
                    type="text"
                    value={formTempatLahir}
                    onChange={(e) => setFormTempatLahir(e.target.value)}
                    placeholder="Bandung"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tanggal Lahir', '生年月日')}</label>
                  <input
                    type="date"
                    value={formTanggalLahir}
                    onChange={(e) => setFormTanggalLahir(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Jenis Kelamin', '性別')}</label>
                  <select
                    value={formJenisKelamin}
                    onChange={(e) => setFormJenisKelamin(e.target.value as Gender)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Laki-laki">{translateGender('Laki-laki', lang)}</option>
                    <option value="Perempuan">{translateGender('Perempuan', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Agama', '宗教')}</label>
                  <select
                    value={formAgama}
                    onChange={(e) => setFormAgama(e.target.value as Religion)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="Islam">{translateReligion('Islam', lang)}</option>
                    <option value="Kristen">{translateReligion('Kristen', lang)}</option>
                    <option value="Katolik">{translateReligion('Katolik', lang)}</option>
                    <option value="Hindu">{translateReligion('Hindu', lang)}</option>
                    <option value="Buddha">{translateReligion('Buddha', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Golongan Darah', '血液型')}</label>
                  <select
                    value={formGolonganDarah}
                    onChange={(e) => setFormGolonganDarah(e.target.value as BloodType)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="TIDAK TAHU">{bilingual('TIDAK TAHU', '不明')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Kota / Kabupaten Domisili', '現住所の都市 / 地域')}</label>
                  <input
                    type="text"
                    value={formKotaDomisili}
                    onChange={(e) => setFormKotaDomisili(e.target.value)}
                    placeholder={bilingual('Bandung / Cirebon / dsb', 'バンドン / チレビョン 等')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{bilingual('Alamat Lengkap Domisili', '詳細住所')}</label>
                <input
                  type="text"
                  value={formAlamatLengkap}
                  onChange={(e) => setFormAlamatLengkap(e.target.value)}
                  placeholder={bilingual('Jl. Raya No. XX, RT/RW, Kelurahan, Kecamatan, Kota', '通り名、番地、RT/RW、町村、都市')}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Section 2: Fisik, Pendidikan & Kesiapan Kerja */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>{bilingual('Kondisi Fisik, Pendidikan & Kualifikasi Magang', '2. 身体条件・学歴・日本向け資格')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tinggi Badan (cm)', '身長 (cm)')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="170"
                    value={formTinggiBadan === '' ? '' : formTinggiBadan}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setFormTinggiBadan(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Berat Badan (kg)', '体重 (kg)')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="62"
                    value={formBeratBadan === '' ? '' : formBeratBadan}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setFormBeratBadan(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Pendidikan Terakhir', '最終学歴')}</label>
                  <select
                    value={formPendidikanTerakhir}
                    onChange={(e) => setFormPendidikanTerakhir(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="SMK / SMA">SMK / SMA</option>
                    <option value="D3">D3 (Diploma 3)</option>
                    <option value="S1 / D4">S1 / D4 (Sarjana)</option>
                    <option value="SMP">SMP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Jurusan Pendidikan', '専攻・学科')}</label>
                  <input
                    type="text"
                    value={formJurusanPendidikan}
                    onChange={(e) => setFormJurusanPendidikan(e.target.value)}
                    placeholder={bilingual('Keperawatan / Otomotif / IPA / dsb', '看護 / 自動車 / 理科 / 等')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Riwayat Bahasa Jepang', '日本語学習歴 / 資格')}</label>
                  <select
                    value={formRiwayatBahasaJepang}
                    onChange={(e) => setFormRiwayatBahasaJepang(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="Belum Pernah (Pemula N5)">{translateJapaneseLevel('Belum Pernah (Pemula N5)', lang)}</option>
                    <option value="Pernah Belajar Mandiri (Hiragana/Katakana)">{translateJapaneseLevel('Pernah Belajar Mandiri (Hiragana/Katakana)', lang)}</option>
                    <option value="Sertifikat JLPT N5 / JFT-Basic">{translateJapaneseLevel('Sertifikat JLPT N5 / JFT-Basic', lang)}</option>
                    <option value="Sertifikat JLPT N4">{translateJapaneseLevel('Sertifikat JLPT N4', lang)}</option>
                    <option value="Sertifikat JLPT N3">{translateJapaneseLevel('Sertifikat JLPT N3', lang)}</option>
                    <option value="Sertifikat JLPT N2">{translateJapaneseLevel('Sertifikat JLPT N2', lang)}</option>
                    <option value="Sertifikat JLPT N1">{translateJapaneseLevel('Sertifikat JLPT N1', lang)}</option>
                    <option value="Ex-Japan Trainee (Ex-Kenshusei)">{translateJapaneseLevel('Ex-Japan Trainee (Ex-Kenshusei)', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Status Paspor', 'パスポート所持状況')}</label>
                  <select
                    value={formRiwayatPaspor}
                    onChange={(e) => setFormRiwayatPaspor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="BELUM">{bilingual('Belum Memiliki Paspor', '未所持')}</option>
                    <option value="SUDAH">{bilingual('Sudah Memiliki Paspor Aktif', '有効な旅券あり')}</option>
                    <option value="KEDALUWARSA">{bilingual('Paspor Kedaluwarsa', '期限切れ')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Kepemilikan SIM', '運転免許証 (SIM)')}</label>
                  <select
                    value={formMemilikiSim}
                    onChange={(e) => setFormMemilikiSim(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="SIM C">SIM C (Motor)</option>
                    <option value="SIM A">SIM A (Mobil)</option>
                    <option value="SIM A & SIM C">SIM A & C</option>
                    <option value="TIDAK ADA">{bilingual('Tidak Ada SIM', 'なし')}</option>
                  </select>
                </div>

                {/* Screening Fisik Checkbox Grid */}
                <div className="flex items-center space-x-3 pt-4">
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTato === 'YA'}
                      onChange={(e) => setFormTato(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600"
                    />
                    <span>{bilingual('Bertato', 'タトゥー')}</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formMerokok === 'YA'}
                      onChange={(e) => setFormMerokok(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600"
                    />
                    <span>{bilingual('Merokok', '喫煙')}</span>
                  </label>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formButaWarna === 'YA'}
                      onChange={(e) => setFormButaWarna(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600"
                    />
                    <span>{bilingual('Buta Warna', '色覚異常')}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Data Orang Tua / Penjamin & Asal Pemasaran */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>{bilingual('Data Orang Tua / Penjamin & Pemasaran LPK', '3. 保護者/身元保証人情報＆マーケティング経路')}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Nama Ayah', '父親の氏名')}</label>
                  <input
                    type="text"
                    value={formNamaAyah}
                    onChange={(e) => setFormNamaAyah(e.target.value)}
                    placeholder={bilingual('Nama Ayah Kandung', '実父の氏名')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Nama Ibu', '母親の氏名')}</label>
                  <input
                    type="text"
                    value={formNamaIbu}
                    onChange={(e) => setFormNamaIbu(e.target.value)}
                    placeholder={bilingual('Nama Ibu Kandung', '実母の氏名')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('No HP / WA Orang Tua', '保護者の電話/WA番号')}</label>
                  <input
                    type="tel"
                    value={formNoHpOrangTua}
                    onChange={(e) => setFormNoHpOrangTua(e.target.value)}
                    placeholder="08123456789"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Pekerjaan Orang Tua', '保護者の職業')}</label>
                  <input
                    type="text"
                    value={formPekerjaanOrangTua}
                    onChange={(e) => setFormPekerjaanOrangTua(e.target.value)}
                    placeholder={bilingual('Wiraswasta / Petani / PNS', '自営業 / 農業 / 公務員 等')}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Kategori / Program Minat', '希望プログラム分類')}</label>
                  <select
                    value={formKategoriKandidat}
                    onChange={(e) => {
                      const newCat = e.target.value as CandidateCategory;
                      setFormKategoriKandidat(newCat);
                      if (isIjefCategory(newCat) && formBidangMinat === 'Kaigo (Caregiver / Perawat Lansia)') {
                        setFormBidangMinat('Belajar Bahasa Jepang Irodori');
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="SISWA IJEF - Offline">{translateCandidateCategory('SISWA IJEF - Offline', lang)} (Asrama)</option>
                    <option value="SISWA IJEF - Online">{translateCandidateCategory('SISWA IJEF - Online', lang)}</option>
                    <option value="MATCHING JOB - Engineering / Gijinkoku">{translateCandidateCategory('MATCHING JOB - Engineering / Gijinkoku', lang)}</option>
                    <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">{translateCandidateCategory('MATCHING JOB - Ex-Magang / Ex-Trainee', lang)}</option>
                    <option value="SISWA NON IJEF (New Comer)">{translateCandidateCategory('SISWA NON IJEF (New Comer)', lang)}</option>
                    <option value="SISWA MITRA / NON IJEF">{translateCandidateCategory('SISWA MITRA / NON IJEF', lang)}</option>
                  </select>
                  {/* Dynamic Destination Indicator */}
                  <div className={`mt-1.5 p-2 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 border ${
                    isIjefCategory(formKategoriKandidat)
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isIjefCategory(formKategoriKandidat)
                        ? bilingual('🎯 Rute Integrasi: Masuk Portal Admin Siswa (SIM-SB) & Skrining MCU', '🎯 連携先: 生徒台帳（SIM-SB）＆健康診断モジュール')
                        : bilingual('🎯 Rute Integrasi: Langsung Masuk Portal Admin Doc (CV-Portal JIS & Matching Pool)', '🎯 連携先: 管理書類ポータル（JIS履歴書・求人マッチング）へ直接登録')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">{bilingual('Bidang / Sektor Minat di Jepang', '希望業種・職種 (日本)')}</label>
                    {isIjefCategory(formKategoriKandidat) && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {bilingual('Tersedia Pilihan Universal', '共通コース対応')}
                      </span>
                    )}
                  </div>
                  <select
                    value={formBidangMinat}
                    onChange={(e) => setFormBidangMinat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <optgroup label={bilingual('📚 Program Pembelajaran & Bahasa Jepang (Universal / Belum Matching)', '📚 日本語学習・総合準備（共通コース）')}>
                      <option value="Belajar Bahasa Jepang Irodori">
                        {bilingual('Belajar Bahasa Jepang Irodori (Dasar & Percakapan A1/A2)', '日本語学習（いろどり・生活会話 A1/A2）')}
                      </option>
                      <option value="Belajar Bahasa Jepang Minna no Nihongo">
                        {bilingual('Belajar Bahasa Jepang Minna no Nihongo (Tata Bahasa N5/N4)', '日本語学習（みんなの日本語・文法 N5/N4）')}
                      </option>
                      <option value="Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)">
                        {bilingual('Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)', '日本語総合準備クラス（分野未定・研修中）')}
                      </option>
                      <option value="Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)">
                        {bilingual('Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)', '特定技能総合準備（分野選定中）')}
                      </option>
                      <option value="Program Bahasa Jepang Intensif (Asrama Offline)">
                        {bilingual('Program Bahasa Jepang Intensif (Asrama Offline)', '集中日本語・生活研修（寮生コース）')}
                      </option>
                      <option value="Program Bahasa Jepang Online (Reguler / Pemula)">
                        {bilingual('Program Bahasa Jepang Online (Reguler / Pemula)', 'オンライン日本語研修コース')}
                      </option>
                      <option value="Belum Menentukan Bidang (Fokus Bahasa Jepang)">
                        {bilingual('Belum Menentukan Bidang (Fokus Bahasa Jepang)', '総合進学・日本語専念（分野後日決定）')}
                      </option>
                    </optgroup>
                    <optgroup label={bilingual('🏭 Sektor Kerja Spesifik (Siap Matching Job / Pilihan Awal)', '🏭 特定技能・職種別（求人マッチング）')}>
                      <option value="Kaigo (Caregiver / Perawat Lansia)">{translateJobSector('Kaigo (Caregiver / Perawat Lansia)', lang)}</option>
                      <option value="Pengolahan Makanan (Food Processing)">{translateJobSector('Pengolahan Makanan (Food Processing)', lang)}</option>
                      <option value="Pertanian (Nogyo / Greenhouse)">{translateJobSector('Pertanian (Nogyo / Greenhouse)', lang)}</option>
                      <option value="Manufaktur & Permesinan (Machining)">{translateJobSector('Manufaktur & Permesinan (Machining)', lang)}</option>
                      <option value="Konstruksi (Building & Civil)">{translateJobSector('Konstruksi (Building & Civil)', lang)}</option>
                      <option value="Restoran & Jasa Makanan (Food Service)">{translateJobSector('Restoran & Jasa Makanan (Food Service)', lang)}</option>
                      <option value="Perhotelan (Hospitality / Accommodation)">{translateJobSector('Perhotelan (Hospitality / Accommodation)', lang)}</option>
                      <option value="Engineering & Konstruksi / IT">{translateJobSector('Engineering & Konstruksi / IT', lang)}</option>
                      <option value="Pengelasan (Welding)">{translateJobSector('Pengelasan (Welding)', lang)}</option>
                      <option value="Pembersihan Gedung (Building Cleaning)">{translateJobSector('Pembersihan Gedung (Building Cleaning)', lang)}</option>
                      <option value="Peternakan (Livestock)">{translateJobSector('Peternakan (Livestock)', lang)}</option>
                      <option value="Lainnya">{translateJobSector('Lainnya', lang)}</option>
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-start space-x-1.5 leading-tight">
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span>
                      {bilingual(
                        'Untuk siswa asrama & online, dapat memilih opsi universal (seperti "Belajar Bahasa Jepang Irodori"). Ketika siswa sudah cukup belajar dan siap matching job, bidang kerja spesifik tinggal diupdate.',
                        '寮生およびオンライン生は「日本語学習（いろどり）」等の共通学習を選択できます。後ほど求人マッチング準備が整った段階で具体的な職種へ更新可能です。'
                      )}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Sumber Perolehan Lead', '獲得経路 / 広告ソース')}</label>
                  <select
                    value={formSumberLead}
                    onChange={(e) => setFormSumberLead(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="Instagram Ads">{translateLeadSource('Instagram Ads', lang)}</option>
                    <option value="TikTok Official IJEF">{translateLeadSource('TikTok Official IJEF', lang)}</option>
                    <option value="Sosialisasi SMK / SMA">{translateLeadSource('Sosialisasi SMK / SMA', lang)}</option>
                    <option value="Audiensi & Roadshow Kampus">{translateLeadSource('Audiensi & Roadshow Kampus', lang)}</option>
                    <option value="Meeting & Kemitraan Lembaga / BLK">{translateLeadSource('Meeting & Kemitraan Lembaga / BLK', lang)}</option>
                    <option value="Meeting Appointment B2B / Kemitraan">{translateLeadSource('Meeting Appointment B2B / Kemitraan', lang)}</option>
                    <option value="Job Fair">{translateLeadSource('Job Fair', lang)}</option>
                    <option value="Webinar Online">{translateLeadSource('Webinar Online', lang)}</option>
                    <option value="Website IJEF Corp">{translateLeadSource('Website IJEF Corp', lang)}</option>
                    <option value="Referral Alumni / Teman">{translateLeadSource('Referral Alumni / Teman', lang)}</option>
                    <option value="Mitra LPK Daerah">{translateLeadSource('Mitra LPK Daerah', lang)}</option>
                    <option value="Walk-in / Datang Langsung">{translateLeadSource('Walk-in / Datang Langsung', lang)}</option>
                    <option value="Brosur & Spanduk">{translateLeadSource('Brosur & Spanduk', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{bilingual('PIC Staff Marketing Pengampu', '担当マーケティングスタッフ')}</span>
                    {!accessInfo.isLeaderOrAdmin && (
                      <span className="text-[10px] text-blue-600 font-bold flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>{bilingual('Otomatis Akun Anda', '現在のアカウント')}</span>
                      </span>
                    )}
                  </label>
                  {!accessInfo.isLeaderOrAdmin ? (
                    <div className="w-full bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-950 font-bold flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>{accessInfo.staffName || formPicStaff} ({translateMarketingRole(accessInfo.roleTitle, lang)})</span>
                      </div>
                      <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md font-semibold">
                        {bilingual('Terkunci', '固定')}
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formPicStaff}
                      onChange={(e) => setFormPicStaff(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                    >
                      {staffList.map((st) => (
                        <option key={st.id} value={st.nama}>
                          {st.nama} ({translateMarketingRole(st.roleMarketing, lang)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Catatan Konseling & Konsultasi Awal', '初期カウンセリングメモ・特記事項')}
                </label>
                <textarea
                  rows={2}
                  value={formCatatanMarketing}
                  onChange={(e) => setFormCatatanMarketing(e.target.value)}
                  placeholder={bilingual(
                    'Contoh: Sangat berminat bidang Kaigo, keluarga sudah menyetujui, siap masuk asrama gelombang April 2026.',
                    '例: 介護職に強い関心あり、家族同意済み、2026年4月期入寮希望。'
                  )}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Action Submit Buttons - Compact and Aligned */}
            <div className="pt-4 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleSubmitLeadForm(false)}
                className="h-8.5 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 transition inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{bilingual('Simpan Lead CRM (Prospek)', 'CRMリード（見込み客）として保存')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitLeadForm(true)}
                className={`h-8.5 px-3.5 text-white font-bold text-xs rounded-lg transition inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                  isIjefCategory(formKategoriKandidat)
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>
                  {isIjefCategory(formKategoriKandidat)
                    ? bilingual(
                        '⚡ Simpan & Masuk ke Admin Siswa (SIM-SB)',
                        '⚡ 保存＆生徒台帳（SIM-SB）へ連携'
                      )
                    : bilingual(
                        '⚡ Simpan & Masuk ke Admin Doc (CV JIS)',
                        '⚡ 保存＆管理書類ポータル（JIS履歴書）へ連携'
                      )}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TABEL MASTER LEADS */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Daftar Seluruh Leads & Calon Siswa Terdata', '全リード＆登録見込み生徒マスター一覧')}
                </h3>
                {!accessInfo.isLeaderOrAdmin && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200 flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>{bilingual(`Data Pribadi (${accessInfo.staffName})`, `担当データ (${accessInfo.staffName})`)}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {bilingual(
                  `Menampilkan ${filteredLeads.length} dari ${scopedLeads.length} data prospek ${accessInfo.isLeaderOrAdmin ? '(Semua Tim)' : `(Milik ${accessInfo.staffName})`}.`,
                  `全 ${scopedLeads.length} 件中 ${filteredLeads.length} 件を表示中 ${accessInfo.isLeaderOrAdmin ? '(全チーム)' : `(担当: ${accessInfo.staffName})`}`
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Selector with all requested options */}
              <div className="h-8.5 flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="DEFAULT">{bilingual('Sortir: Default', '並び替え: デフォルト')}</option>
                  <option value="NAME_ASC">{bilingual('Nama (A - Z)', '氏名順 (A - Z)')}</option>
                  <option value="NAME_DESC">{bilingual('Nama (Z - A)', '氏名順 (Z - A)')}</option>
                  <option value="DATE_NEWEST">{bilingual('Tanggal Terbaru', '日付: 新しい順')}</option>
                  <option value="DATE_OLDEST">{bilingual('Tanggal Paling Lama (termasuk tanpa tanggal)', '日付: 古い順 (日付なし含む)')}</option>
                  <option value="LAST_7_DAYS">{bilingual('7 Hari Terakhir', '過去7日間')}</option>
                  <option value="LAST_30_DAYS">{bilingual('30 Hari Terakhir', '過去30日間')}</option>
                  <option value="THIS_MONTH">{bilingual('Bulan Ini', '今月')}</option>
                  <option value="LAST_MONTH">{bilingual('Bulan Lalu', '先月')}</option>
                </select>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">{bilingual('Semua Kategori', '全カテゴリー')}</option>
                <option value="IJEF">{bilingual('⭐ Jalur IJEF (SIM-SB)', '⭐ IJEF生 (SIM-SB)')}</option>
                <option value="NON_IJEF">{bilingual('🌐 Jalur Non-IJEF (JIS)', '🌐 Non-IJEF生 (JIS求人)')}</option>
                <option value="SISWA IJEF - Offline">1. SISWA IJEF - Offline</option>
                <option value="SISWA IJEF - Online">2. SISWA IJEF - Online</option>
                <option value="SISWA NON IJEF (New Comer)">3. SISWA NON IJEF (New Comer)</option>
                <option value="SISWA MITRA / NON IJEF">4. SISWA MITRA / NON IJEF</option>
                <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">5. Ex-Magang / Ex-Trainee</option>
                <option value="MATCHING JOB - Engineering / Gijinkoku">6. Engineering / Gijinkoku</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8.5 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">{bilingual('Semua Status', 'すべてのステータス')}</option>
                <option value="LEAD_BARU">{bilingual('1. Lead Baru', '1. 新規リード')}</option>
                <option value="KONTAK_AWAL">{bilingual('2. Kontak Awal', '2. 初回コンタクト')}</option>
                <option value="KONSULTASI_LPK">{bilingual('3. Konsultasi LPK', '3. 相談・カウンセリング')}</option>
                <option value="FOLLOW_UP">{bilingual('4. Follow Up', '4. フォローアップ')}</option>
                <option value="DEAL_TERDAFTAR">{bilingual('5. Deal Terdaftar', '5. 成約・登録完了')}</option>
                <option value="LOST_BATAL">{bilingual('6. Batal', '6. 辞退・保留')}</option>
              </select>

              {categoryFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter('ALL')}
                  className="h-8.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 rounded-lg transition cursor-pointer"
                >
                  ✕ Reset Kategori
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase">
                  <th className="py-3 px-4">{bilingual('Nama Calon Siswa', '生徒氏名')}</th>
                  <th className="py-3 px-3">{bilingual('Kontak WhatsApp', '連絡先 (WhatsApp)')}</th>
                  <th className="py-3 px-3">{bilingual('Kota Domisili', '居住地')}</th>
                  <th className="py-3 px-3">{bilingual('Peminatan Kerja', '希望職種・学歴')}</th>
                  <th className="py-3 px-3">{bilingual('Sumber & PIC', '獲得元＆担当者')}</th>
                  <th className="py-3 px-3">{bilingual('Status Lead', 'ステータス')}</th>
                  <th className="py-3 px-3">{bilingual('Sinkronisasi Portal', 'システム連携')}</th>
                  <th className="py-3 px-4 text-center">{bilingual('Aksi Cepat', 'クイック操作')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setEditingLead(lead)}
                        className="font-bold text-slate-900 hover:text-orange-600 transition cursor-pointer flex items-center space-x-1.5 group"
                        title={bilingual('Klik untuk edit data master lead', 'クリックしてリード情報を編集')}
                      >
                        <span className="group-hover:underline underline-offset-2">{lead.namaLengkap}</span>
                        <Edit className="w-3 h-3 text-slate-400 group-hover:text-orange-600 opacity-60 group-hover:opacity-100 transition" />
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {lead.id} • {lead.usia} {bilingual('thn', '歳')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-medium text-slate-800">{lead.noWhatsapp}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{lead.email}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {lead.kotaDomisili || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-indigo-900 text-[11px] block truncate max-w-[160px]">
                        {translateJobSector(lead.bidangMinat || lead.programMinat, lang) || lead.bidangMinat || lead.programMinat}
                      </span>
                      <span className="text-[10px] text-slate-500">{lead.pendidikanTerakhir}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] font-semibold text-slate-800">
                        {translateLeadSource(lead.sumberLead, lang) || lead.sumberLead}
                      </div>
                      <div className="text-[10px] text-orange-700 font-bold">PIC: {lead.picMarketingStaff || '-'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={getCanonicalPipelineStage(lead.statusLead)}
                        onChange={(e) => {
                          const newStatus = e.target.value as LeadStatus;
                          updateLeadStatus(lead.id, newStatus);
                          setSuccessToast(
                            bilingual(
                              `Status prospek ${lead.namaLengkap} diubah ke "${translatePipelineStage(newStatus, lang)}"`,
                              `リード「${lead.namaLengkap}」のステータスを更新しました`
                            )
                          );
                        }}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none transition shadow-2xs ${
                          getCanonicalPipelineStage(lead.statusLead) === 'DEAL_TERDAFTAR'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : getCanonicalPipelineStage(lead.statusLead) === 'LEAD_BARU'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                            : getCanonicalPipelineStage(lead.statusLead) === 'LOST_BATAL'
                            ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={bilingual('Klik untuk ubah status prospek', 'クリックしてステータスを変更')}
                      >
                        <option value="LEAD_BARU">{translatePipelineStage('LEAD_BARU', lang)}</option>
                        <option value="KONTAK_AWAL">{translatePipelineStage('KONTAK_AWAL', lang)}</option>
                        <option value="KONSULTASI_LPK">{translatePipelineStage('KONSULTASI_LPK', lang)}</option>
                        <option value="FOLLOW_UP">{translatePipelineStage('FOLLOW_UP', lang)}</option>
                        <option value="DEAL_TERDAFTAR">{translatePipelineStage('DEAL_TERDAFTAR', lang)}</option>
                        <option value="LOST_BATAL">{translatePipelineStage('LOST_BATAL', lang)}</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {isLeadActuallyIntegrated(lead) ? (
                        <div className={`font-bold flex items-center space-x-1 text-[11px] ${
                          isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                            ? 'text-emerald-700'
                            : 'text-blue-700'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <div className="truncate">
                            <span className="block">{getEffectiveStudentId(lead)}</span>
                            <span className="text-[9px] font-normal opacity-80">
                              {isIjefCategory(lead.kategoriKandidat || lead.programMinat) ? 'Admin Siswa (SIM-SB)' : 'Admin Doc (JIS)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTriggerIntegrate(lead);
                          }}
                          className={`px-2.5 py-1 text-white font-extrabold text-[10px] rounded-lg shadow-2xs transition flex items-center space-x-1 cursor-pointer active:scale-95 ${
                            isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>
                            {isIjefCategory(lead.kategoriKandidat || lead.programMinat)
                              ? bilingual('⚡ Admin Siswa', '⚡ 生徒台帳')
                              : bilingual('⚡ Admin Doc', '⚡ 管理書類')}
                          </span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(lead)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition cursor-pointer"
                          title={bilingual('Chat WhatsApp', 'WhatsApp チャットを開く')}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFollowUpTargetLead(lead);
                            setFollowUpModalOpen(true);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                          title={bilingual('Catat Follow-Up', 'フォローアップ記録')}
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingLead(lead)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition cursor-pointer"
                          title={bilingual('Edit Data Master Lead', 'リード情報を編集')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDetailLead(lead)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                          title={bilingual('Lihat Detail Profil', '詳細プロフィール')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(bilingual(`Hapus data lead "${lead.namaLengkap}"?`, `リード "${lead.namaLengkap}" のデータを削除しますか？`))) {
                              deleteLead(lead.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title={bilingual('Hapus Lead', 'リード削除')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TIM MARKETING & TARGET LEADERBOARD */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Tim Konselor & Marketing LPK IJEF CORP', 'LPK IJEF マーケティング＆カウンセラーチーム')}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual(
                    'Target pencapaian closing calon siswa, distribusi lead, dan metrik konversi tim marketing.',
                    '生徒獲得目標の達成状況、担当リード配分、マーケティングチームの成約・コンバージョン率指標。'
                  )}
                </p>
              </div>
              <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
                {staffList.length} {bilingual('Staff Aktif', '名のアクティブスタッフ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((staff, idx) => {
                const staffLeads = leads.filter((l) => {
                  const leadPic = (l.picMarketingStaff || l.assignedStaff || '').toLowerCase();
                  return leadPic === staff.nama.toLowerCase() || leadPic.includes(staff.nama.toLowerCase());
                });
                const staffClosing = staffLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
                const percentTarget = Math.min(100, Math.round((staffClosing / (staff.targetBulanan || 20)) * 100));
                const isCurrentUser = staff.nama.toLowerCase() === (accessInfo.staffName || '').toLowerCase() || staff.email?.toLowerCase() === (accessInfo.staffEmail || '').toLowerCase();

                return (
                  <div
                    key={staff.id}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isCurrentUser
                        ? 'border-orange-400 bg-orange-50/40 shadow-md ring-2 ring-orange-400/30'
                        : 'border-slate-200 bg-white shadow-2xs hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {staff.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-slate-900 text-xs">{staff.nama}</h4>
                            {isCurrentUser && (
                              <span className="bg-orange-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                {bilingual('Anda', 'あなた')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-orange-700 font-semibold">{translateMarketingRole(staff.roleMarketing, lang)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>{bilingual('Pencapaian Target:', '目標達成率:')}</span>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">
                            {staffClosing} / {staff.targetBulanan || 20} {bilingual('Siswa', '名')} ({percentTarget}%)
                          </span>
                          {accessInfo.isLeaderOrAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setTargetModalStaff(staff);
                                setStaffTargetInput(staff.targetBulanan || 20);
                              }}
                              title={bilingual('Update Target Marketing Staff Ini', 'このスタッフの目標を更新')}
                              className="p-1 rounded-md text-orange-600 hover:bg-orange-100 hover:text-orange-800 transition cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentTarget}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-[10px]">
                      <div className="p-2 bg-slate-50 rounded-xl">
                        <div className="text-slate-400 font-medium">{bilingual('Lead Diampu', '担当リード')}</div>
                        <div className="font-bold text-slate-800 text-xs">{staffLeads.length} {bilingual('Lead', '件')}</div>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-900">
                        <div className="text-emerald-700 font-medium">{bilingual('Total Closing', '成約件数')}</div>
                        <div className="font-bold text-xs">{staffClosing} {bilingual('Siswa', '名')}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FOLLOW UP & WHATSAPP GATEWAY */}
      {activeTab === 'followup' && (
        <MarketingFollowUpView
          leads={scopedLeads}
          staffList={staffList}
          onOpenWhatsApp={handleOpenWhatsApp}
          onOpenFollowUp={(lead) => {
            setFollowUpTargetLead(lead);
            setFollowUpModalOpen(true);
          }}
          onOpenDetail={(lead) => setActiveDetailLead(lead)}
          onAddFollowUpLog={addFollowUpLog}
        />
      )}

      {/* TAB 6: KAMPANYE & EVENT PROMOSI */}
      {activeTab === 'campaigns' && (
        <MarketingCampaignsView staffList={staffList} />
      )}

      {/* TAB 7: PENGATURAN CRM & INTEGRASI */}
      {activeTab === 'settings' && (
        <MarketingSettingsView leads={scopedLeads} onSaveLead={saveLead} />
      )}

      {/* TAB 8 (FALLBACK / LOGS): RIWAYAT FOLLOW-UP & INTEGRASI */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {bilingual('Log Interaksi Follow-Up & Integrasi Lintas Portal', 'フォローアップ履歴＆ポータル連携ログ')}
              </h3>
              <p className="text-xs text-slate-500">
                {bilingual(
                  `Audit trail seluruh aktivitas kontak WhatsApp, telepon, dan sinkronisasi ke Admin Siswa & Admin Doc ${accessInfo.isLeaderOrAdmin ? '(Semua Tim)' : `(Khusus Data ${accessInfo.staffName})`}.`,
                  `WhatsApp連絡、通話、生徒台帳・JIS履歴書連携の全監査ログ ${accessInfo.isLeaderOrAdmin ? '(全チーム)' : `(担当: ${accessInfo.staffName})`}`
                )}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(() => {
              const allLogs = scopedLeads.flatMap((l) => {
                const logs = Array.isArray(l.followUpLogs) && l.followUpLogs.length > 0
                  ? l.followUpLogs
                  : Array.isArray(l.riwayatFollowUp)
                  ? l.riwayatFollowUp
                  : [];
                return logs.map((log) => ({
                  ...log,
                  id: log.id || `LOG-${Math.random()}`,
                  leadName: l.namaLengkap,
                  leadId: l.id,
                  bidang: l.bidangMinat,
                  displayChannel: log.channel || log.metode || 'WHATSAPP',
                  displayActor: log.actorName || log.petugas || l.assignedStaff || 'Marketing Staff',
                  displayText: log.ringkasanPembahasan || log.hasil || '-',
                  displayTime: log.timestamp || log.tanggal || new Date().toISOString()
                }));
              });

              if (allLogs.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    {bilingual('Belum ada riwayat follow-up.', 'フォローアップ履歴はまだありません。')}
                  </div>
                );
              }

              return allLogs
                .sort((a, b) => new Date(b.displayTime).getTime() - new Date(a.displayTime).getTime())
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{log.leadName}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full font-semibold">
                          {log.displayChannel}
                        </span>
                        <span className="text-[10px] text-slate-400">{log.displayActor}</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{log.displayText}</p>
                      {log.tindakLanjutBerikutnya && (
                        <div className="text-[11px] text-indigo-700 font-semibold">
                          {bilingual('Next Action:', '次回アクション:')} {log.tindakLanjutBerikutnya} ({log.jadwalFollowUpBerikutnya || bilingual('Segera', '至急')})
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.displayTime).toLocaleString(lang === 'ja' ? 'ja-JP' : 'id-ID')}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR LEAD PROSPEK */}
      {activeDetailLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-orange-600 to-rose-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-sm">
                  {activeDetailLead.namaLengkap.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{activeDetailLead.namaLengkap}</h3>
                  <p className="text-xs text-orange-100">
                    ID: {activeDetailLead.id} • {bilingual('Status', 'ステータス')}: {translatePipelineStage(getCanonicalPipelineStage(activeDetailLead.statusLead), lang)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const leadToEdit = activeDetailLead;
                    setActiveDetailLead(null);
                    setEditingLead(leadToEdit);
                  }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-white/30 shadow-xs"
                  title={bilingual('Edit Data Master Lead Ini', 'このリード情報を編集')}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{bilingual('Edit Data', '編集')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailLead(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">WhatsApp</span>
                  <span className="font-mono font-bold text-slate-800">{activeDetailLead.noWhatsapp}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{bilingual('Email', 'メールアドレス')}</span>
                  <span className="font-medium text-slate-800 truncate block">{activeDetailLead.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{bilingual('NIK KTP', '国民身分番号 (NIK)')}</span>
                  <span className="font-mono font-medium text-slate-800">{activeDetailLead.nikKtp || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{bilingual('Domisili', '居住地')}</span>
                  <span className="font-medium text-slate-800">{activeDetailLead.kotaDomisili}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{bilingual('Pendidikan', '最終学歴')}</span>
                  <span className="font-medium text-slate-800">{activeDetailLead.pendidikanTerakhir} ({activeDetailLead.jurusanPendidikan || '-'})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">{bilingual('Bahasa Jepang', '日本語力')}</span>
                  <span className="font-medium text-slate-800">{translateJapaneseLevel(activeDetailLead.riwayatBahasaJepang, lang) || activeDetailLead.riwayatBahasaJepang}</span>
                </div>
              </div>

              {/* Physical Screening Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {bilingual('Skrining Fisik & Berkas', '身体スクリーニング＆書類状況')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    {bilingual('Tinggi/Berat:', '身長/体重:')}{' '}
                    <strong>{activeDetailLead.tinggiBadan} cm / {activeDetailLead.beratBadan} kg</strong>
                  </div>
                  <div>
                    {bilingual('Paspor:', '旅券:')}{' '}
                    <strong>
                      {activeDetailLead.riwayatPaspor === 'SUDAH'
                        ? bilingual('Sudah Ada', '所持')
                        : activeDetailLead.riwayatPaspor === 'BELUM'
                        ? bilingual('Belum Ada', '未所持')
                        : activeDetailLead.riwayatPaspor}
                    </strong>
                  </div>
                  <div>
                    {bilingual('SIM:', '免許:')}{' '}
                    <strong>{activeDetailLead.memilikiSim}</strong>
                  </div>
                  <div>
                    {bilingual('Tato/Rokok:', '刺青/喫煙:')}{' '}
                    <strong>
                      {activeDetailLead.kondisiFisikKhusus?.tato === 'YA' ? bilingual('Bertato', 'タトゥーあり') : bilingual('Bebas Tato', 'なし')} /{' '}
                      {activeDetailLead.kondisiFisikKhusus?.merokok === 'YA' ? bilingual('Merokok', '喫煙') : bilingual('Non-Perokok', '非喫煙')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Parent Details */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  {bilingual('Orang Tua / Penjamin', '保護者 / 保証人情報')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>{bilingual('Ayah:', '父親:')} <strong>{activeDetailLead.namaAyah || '-'}</strong></div>
                  <div>{bilingual('Ibu:', '母親:')} <strong>{activeDetailLead.namaIbu || '-'}</strong></div>
                  <div>{bilingual('No HP Ortu:', '保護者連絡先:')} <strong>{activeDetailLead.noHpOrangTua || '-'}</strong></div>
                </div>
              </div>

              {/* Integration Status & Actions */}
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-950">
                    {bilingual('Status Integrasi Sistem SIM-SB:', 'SIM-SB システム連携ステータス:')}
                  </span>
                  {isLeadActuallyIntegrated(activeDetailLead) ? (
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {bilingual(`Tersinkron (${getEffectiveStudentId(activeDetailLead)})`, `連携済み (${getEffectiveStudentId(activeDetailLead)})`)}
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {bilingual('Belum Terintegrasi', '未連携')}
                    </span>
                  )}
                </div>

                {!isLeadActuallyIntegrated(activeDetailLead) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleTriggerIntegrate(activeDetailLead);
                      setActiveDetailLead(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-emerald-600 hover:from-orange-700 hover:to-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>
                      {bilingual(
                        '⚡ Daftarkan & Integrasikan ke Seluruh Portal Sekarang',
                        '⚡ 今すぐ全ポータルへ本登録＆即時連携（生徒台帳、健康診断、JIS履歴書）'
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(activeDetailLead)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{bilingual('Buka Chat WhatsApp', 'WhatsApp を開く')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const leadToEdit = activeDetailLead;
                    setActiveDetailLead(null);
                    setEditingLead(leadToEdit);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{bilingual('Edit Data Lead', 'リード情報を編集')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveDetailLead(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer"
              >
                {bilingual('Tutup', '閉じる')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK FOLLOW UP MODAL */}
      {followUpModalOpen && followUpTargetLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-extrabold text-white">
                  {bilingual('Catat Follow-Up & Konsultasi Lead', 'フォローアップ＆カウンセリング記録')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFollowUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-orange-950">
                {bilingual('Calon Siswa:', '対象生徒:')} <strong>{followUpTargetLead.namaLengkap}</strong> ({followUpTargetLead.noWhatsapp})
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{bilingual('Kanal Komunikasi', '通信チャネル')}</label>
                <select
                  value={followUpChannel}
                  onChange={(e) => setFollowUpChannel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                >
                  <option value="WHATSAPP">WhatsApp Chat / Voice Note</option>
                  <option value="TELEPON">{bilingual('Panggilan Telepon Langsung', '電話通話')}</option>
                  <option value="TATAP_MUKA_LPK">{bilingual('Tatap Muka di Kantor LPK', 'LPK校舎での対面面談')}</option>
                  <option value="ZOOM">Online Meeting Zoom / GMeet</option>
                  <option value="EMAIL">{bilingual('Email Resmi', '公式メール')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{bilingual('Ringkasan Pembahasan & Minat Siswa', '相談概要・生徒の関心点')}</label>
                <textarea
                  rows={3}
                  required
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder={bilingual('Tuliskan poin penting hasil pembicaraan...', '相談・対話の重要ポイントを入力してください...')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Rencana Aksi Berikutnya', '次回アクション')}</label>
                  <input
                    type="text"
                    value={followUpNextAction}
                    onChange={(e) => setFollowUpNextAction(e.target.value)}
                    placeholder={bilingual('Kirim brosur rincian biaya', '費用案内パンフレット送付')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tanggal Follow Up Berikutnya', '次回フォロー予定日')}</label>
                  <input
                    type="date"
                    value={followUpNextDate}
                    onChange={(e) => setFollowUpNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveFollowUpLog}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{bilingual('Simpan Catatan Follow-Up', 'フォローアップ記録を保存')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MOVE STAGE MODAL (ALTERNATIVE FOR CLICK / TAP / HOLD) */}
      {quickMoveLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {bilingual('Pindahkan Tahap Prospek', 'パイプラインステージ変更')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {bilingual('Pilih kolom tahapan baru untuk kandidat ini', '候補者の移動先ステージを選択してください')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickMoveLead(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Summary Box */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900">{quickMoveLead.namaLengkap}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {quickMoveLead.kotaDomisili || 'Bandung'} • {quickMoveLead.bidangMinat || quickMoveLead.programMinat}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isIjefCategory(quickMoveLead.kategoriKandidat || quickMoveLead.programMinat)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {isIjefCategory(quickMoveLead.kategoriKandidat || quickMoveLead.programMinat) ? 'Admin Siswa' : 'Admin Doc'}
                </span>
              </div>

              {/* Stage Selection Options */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  {bilingual('Pilih Tahap Tujuan:', '移動先ステージを選択:')}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {pipelineStages.map((stage) => {
                    const isCurrent = getCanonicalPipelineStage(quickMoveLead.statusLead) === stage.status;
                    const StageIcon = stage.icon;

                    return (
                      <button
                        key={stage.status}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          updateLeadStatus(
                            quickMoveLead.id,
                            stage.status as LeadStatus,
                            `Status dipindahkan ke [${stage.label}] via Quick Move Mover`
                          );
                          setSuccessToast(
                            bilingual(
                              `✨ "${quickMoveLead.namaLengkap}" berhasil dipindahkan ke: ${stage.label}`,
                              `✨ 「${quickMoveLead.namaLengkap}」がステージ「${stage.label}」へ移動しました`
                            )
                          );
                          setQuickMoveLead(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                            : 'bg-white hover:bg-orange-50 border-slate-200 hover:border-orange-300 text-slate-900 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>
                            <StageIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{stage.label}</span>
                            <span className="text-[10px] text-slate-500">{stage.desc}</span>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md shrink-0">
                            {bilingual('Tahap Saat Ini', '現在のステージ')}
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setQuickMoveLead(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {bilingual('Batal', 'キャンセル')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPDATE TARGET BULANAN MARKETING STAFF */}
      {targetModalStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {bilingual('Update Target Marketing', 'マーケティング目標の更新')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {targetModalStaff.nama} ({translateMarketingRole(targetModalStaff.roleMarketing, lang)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetModalStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200/80 text-orange-900">
                <div className="font-bold mb-1">{bilingual('Target Closing Bulanan (Siswa Baru)', '月間成約目標（新入生数）')}</div>
                <p className="text-[11px] text-orange-800">
                  {bilingual(
                    'Tentukan jumlah target closing / deal siswa terdaftar per bulan untuk staf marketing ini.',
                    'このマーケティング担当者の月間成約・生徒登録目標人数を設定してください。'
                  )}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Target Bulanan (Jumlah Siswa)', '月間目標（生徒数）')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={staffTargetInput}
                    onChange={(e) => setStaffTargetInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                  <span className="font-bold text-slate-600 shrink-0">{bilingual('Siswa / Bln', '名 / 月')}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
                  {bilingual('Pilihan Cepat:', 'クイック選択:')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 20, 25, 30, 40, 50].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStaffTargetInput(val)}
                      className={`px-3 py-1 rounded-xl font-bold text-xs border transition cursor-pointer ${
                        staffTargetInput === val
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                    >
                      {val} {bilingual('Siswa', '名')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTargetModalStaff(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {bilingual('Batal', 'キャンセル')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveStaffTarget(targetModalStaff.id, staffTargetInput);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{bilingual('Simpan Target', '目標を保存')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MASTER LEAD MODAL */}
      <MarketingLeadEditModal
        isOpen={!!editingLead}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSave={handleSaveEditedLead}
        staffList={staffList}
        isLeaderOrAdmin={accessInfo.isLeaderOrAdmin}
      />
    </div>
  );
};
