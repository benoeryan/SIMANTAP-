import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { MarketingLead, MarketingStaff, CandidateCategory } from '../../types';
import { MarketingAccessInfo, getCanonicalPipelineStage } from '../../utils/crmAuthUtils';
import {
  translatePipelineStage,
  translateLeadSource,
  translateJobSector,
  translateMarketingRole,
  translateCandidateCategory
} from '../../utils/marketingTranslations';
import {
  isIjefCategory,
  isNonIjefCategory,
  getTargetPortalLabel
} from '../../utils/candidateUtils';
import {
  TrendingUp,
  Users,
  UserPlus,
  Flame,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Clock,
  Briefcase,
  Target,
  Award,
  Layers,
  ChevronRight,
  Send,
  Zap,
  Globe,
  Share2,
  PhoneCall,
  Lock,
  Crown,
  ShieldCheck,
  GraduationCap,
  Laptop,
  UserCheck,
  Handshake,
  Cpu,
  Filter,
  ArrowUpRight,
  RotateCcw,
  Check
} from 'lucide-react';

interface MarketingDashboardViewProps {
  leads: MarketingLead[];
  staffList: MarketingStaff[];
  accessInfo?: MarketingAccessInfo;
  allTeamLeads?: MarketingLead[];
  selectedStaffFilter?: string;
  onSelectStaffFilter?: (staff: string) => void;
  onNavigateTab: (tab: any, categoryFilter?: string) => void;
  onOpenWhatsApp: (lead: MarketingLead) => void;
  onOpenFollowUp: (lead: MarketingLead) => void;
  onOpenDetail: (lead: MarketingLead) => void;
  onTriggerIntegrate: (lead: MarketingLead) => void;
  selectedCategoryFilter?: string;
  onSelectCategoryFilter?: (category: string) => void;
}

export const MarketingDashboardView: React.FC<MarketingDashboardViewProps> = ({
  leads,
  staffList,
  accessInfo,
  allTeamLeads,
  selectedStaffFilter = 'ALL',
  onSelectStaffFilter,
  onNavigateTab,
  onOpenWhatsApp,
  onOpenFollowUp,
  onOpenDetail,
  onTriggerIntegrate,
  selectedCategoryFilter,
  onSelectCategoryFilter
}) => {
  const { lang } = useApp();
  const { bilingual } = useEcosystemTranslation();
  const isLeaderOrAdmin = accessInfo?.isLeaderOrAdmin ?? true;
  const staffName = accessInfo?.staffName || 'Staff Marketing';
  const roleTitle = accessInfo?.roleTitle || 'Marketing LPK';

  // Category Classification Filter State on Dashboard
  const [internalCategoryFilter, setInternalCategoryFilter] = useState<string>('ALL');
  const selectedDashboardCategory = selectedCategoryFilter && selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : internalCategoryFilter;
  const setSelectedDashboardCategory = (cat: string) => {
    setInternalCategoryFilter(cat);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(cat);
    }
  };

  const normalizeCategory = (cat?: string): string => {
    if (!cat) return 'SISWA NON IJEF (New Comer)';
    if (cat.includes('Offline')) return 'SISWA IJEF - Offline';
    if (cat.includes('Online')) return 'SISWA IJEF - Online';
    if (cat.includes('Ex-Magang') || cat.includes('Ex-Trainee')) return 'MATCHING JOB - Ex-Magang / Ex-Trainee';
    if (cat.includes('Engineering') || cat.includes('Gijinkoku')) return 'MATCHING JOB - Engineering / Gijinkoku';
    if (cat.includes('MITRA')) return 'SISWA MITRA / NON IJEF';
    if (cat.includes('NON IJEF') || cat.includes('New Comer')) return 'SISWA NON IJEF (New Comer)';
    return cat;
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'LEAD_BARU').length;
  const activeProspek = leads.filter((l) =>
    ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP'].includes(getCanonicalPipelineStage(l.statusLead))
  ).length;
  const dealClosing = leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
  const integratedCount = leads.filter((l) => (l.terintegrasiKeAdmin1 || l.integratedToAdmin1) && (l.siswaId || l.integratedStudentId)).length;
  const closingRate = totalLeads > 0 ? Math.round((dealClosing / totalLeads) * 100) : 0;

  // Category Aggregates
  const ijefLeads = useMemo(() => leads.filter((l) => isIjefCategory(l.kategoriKandidat)), [leads]);
  const nonIjefLeads = useMemo(() => leads.filter((l) => isNonIjefCategory(l.kategoriKandidat)), [leads]);
  const ijefCount = ijefLeads.length;
  const nonIjefCount = nonIjefLeads.length;
  const ijefPct = totalLeads > 0 ? Math.round((ijefCount / totalLeads) * 100) : 0;
  const nonIjefPct = totalLeads > 0 ? Math.round((nonIjefCount / totalLeads) * 100) : 0;

  const ijefDealClosing = ijefLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
  const nonIjefDealClosing = nonIjefLeads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
  const ijefActive = ijefLeads.filter((l) => ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP'].includes(getCanonicalPipelineStage(l.statusLead))).length;
  const nonIjefActive = nonIjefLeads.filter((l) => ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP'].includes(getCanonicalPipelineStage(l.statusLead))).length;
  const ijefIntegrated = ijefLeads.filter((l) => (l.terintegrasiKeAdmin1 || l.integratedToAdmin1) && (l.siswaId || l.integratedStudentId)).length;
  const nonIjefIntegrated = nonIjefLeads.filter((l) => (l.terintegrasiKeAdmin1 || l.integratedToAdmin1) && (l.siswaId || l.integratedStudentId)).length;

  // Specific Sub-Category Counts for gateway summary
  const offlineCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'SISWA IJEF - Offline').length;
  const onlineCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'SISWA IJEF - Online').length;
  const newComerCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'SISWA NON IJEF (New Comer)').length;
  const mitraCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'SISWA MITRA / NON IJEF').length;
  const exMagangCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'MATCHING JOB - Ex-Magang / Ex-Trainee').length;
  const gijinkokuCount = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === 'MATCHING JOB - Engineering / Gijinkoku').length;

  // Canonical 6 Student Categories
  const categoryCards = [
    {
      key: 'SISWA IJEF - Offline',
      label: 'SISWA IJEF - Offline',
      subLabel: bilingual('Asrama Tatap Muka LPK', '対面・入寮研修コース'),
      jaLabel: 'IJEF生 - 入寮・通学 (Offline)',
      isIjef: true,
      targetPortal: 'ADMIN_SISWA' as const,
      targetPortalLabel: 'Portal Admin Siswa (SIM-SB)',
      targetPortalShort: 'Admin Siswa',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      tagColor: 'bg-emerald-500',
      borderAccent: 'border-emerald-200 hover:border-emerald-400',
      cardBg: 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20',
      icon: GraduationCap,
      iconBg: 'bg-emerald-100 text-emerald-700',
      desc: bilingual(
        'Asrama tatap muka 3-6 bulan di LPK IJEF. Pelatihan intensif bahasa Jepang, etika kerja, MCU rutin, DISC, dan ujian psikotes sebelum diteruskan ke wawancara user.',
        'LPK IJEFでの3〜6ヶ月対面入寮コース。日本語・生活指導、定期健康診断、DISC適性検査、心理テストを経て企業面接に進みます。'
      ),
      features: [
        bilingual('Asrama & Kedisiplinan LPK', '入寮研修・生活指導'),
        bilingual('Wajib MCU & Asesmen DISC', '健康診断・適性検査'),
        bilingual('Ujian Psikotes Kelayakan', '心理・適性テスト')
      ]
    },
    {
      key: 'SISWA IJEF - Online',
      label: 'SISWA IJEF - Online',
      subLabel: bilingual('Kelas Daring LMS IJEF', 'オンライン・LMS講義'),
      jaLabel: 'IJEF生 - オンライン (Online)',
      isIjef: true,
      targetPortal: 'ADMIN_SISWA' as const,
      targetPortalLabel: 'Portal Admin Siswa (SIM-SB)',
      targetPortalShort: 'Admin Siswa',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      tagColor: 'bg-blue-500',
      borderAccent: 'border-blue-200 hover:border-blue-400',
      cardBg: 'bg-gradient-to-br from-blue-50/60 via-white to-blue-50/20',
      icon: Laptop,
      iconBg: 'bg-blue-100 text-blue-700',
      desc: bilingual(
        'Kelas daring interaktif fleksibel via LMS & Zoom. Siswa tersinkronisasi ke Admin Siswa dengan monitoring presensi e-learning dan persiapan sertifikasi bahasa.',
        'LMSとZoomによる双方向オンライン授業。生徒台帳で学習進捗と出席率を管理し、特定技能試験および面接準備を実施。'
      ),
      features: [
        bilingual('Kelas Jarak Jauh / LMS', 'Eラーニング・Zoom講義'),
        bilingual('Akses Modul LMS 24/7', 'LMS教材24時間利用可'),
        bilingual('Terintegrasi ke SIM-SB', 'SIM-SB生徒台帳へ連携')
      ]
    },
    {
      key: 'SISWA NON IJEF (New Comer)',
      label: 'SISWA NON IJEF (New Comer)',
      subLabel: bilingual('Pelamar Bebas / Umum', '一般公募・求職者'),
      jaLabel: '一般応募生 (New Comer)',
      isIjef: false,
      targetPortal: 'ADMIN_DOC' as const,
      targetPortalLabel: 'Portal Admin Doc (CV Rirekisho JIS)',
      targetPortalShort: 'Admin Doc',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      tagColor: 'bg-purple-500',
      borderAccent: 'border-purple-200 hover:border-purple-400',
      cardBg: 'bg-gradient-to-br from-purple-50/60 via-white to-purple-50/20',
      icon: UserCheck,
      iconBg: 'bg-purple-100 text-purple-700',
      desc: bilingual(
        'Pelamar umum di luar pelatihan asrama LPK IJEF. Dialokasikan langsung ke pool CV-Portal JIS untuk verifikasi berkas rirekisho & rekomendasi interview.',
        'LPK入寮研修を経ない一般求職者。JIS履歴書ポータルに直接登録され、書類審査後に求人面接へ推薦されます。'
      ),
      features: [
        bilingual('Direct Pool Matching Job', '直接求人マッチング'),
        bilingual('Pembuatan Rirekisho JIS', 'JIS標準履歴書作成'),
        bilingual('Tanpa Beban Asrama LPK', '入寮研修費用なし')
      ]
    },
    {
      key: 'SISWA MITRA / NON IJEF',
      label: 'SISWA MITRA / NON IJEF',
      subLabel: bilingual('Rekomendasi Mitra SMK / LPK', '提携校・パートナー推薦'),
      jaLabel: '提携校・外部生徒 (Mitra)',
      isIjef: false,
      targetPortal: 'ADMIN_DOC' as const,
      targetPortalLabel: 'Portal Admin Doc (CV Rirekisho JIS)',
      targetPortalShort: 'Admin Doc',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      tagColor: 'bg-teal-500',
      borderAccent: 'border-teal-200 hover:border-teal-400',
      cardBg: 'bg-gradient-to-br from-teal-50/60 via-white to-teal-50/20',
      icon: Handshake,
      iconBg: 'bg-teal-100 text-teal-700',
      desc: bilingual(
        'Calon siswa dari SMK mitra atau sending partner daerah dengan perjanjian MOU resmi. Penanganan prioritas dokumen dan alokasi kuota interview kerja.',
        'MOUを締結した提携高校・地方送り出し機関からの推薦生徒。面接枠の優先割当およびJIS書類管理を適用。'
      ),
      features: [
        bilingual('Jalur Kerjasama MOU Resmi', '提携校MOU特別枠'),
        bilingual('Rekomendasi Sending Partner', 'パートナー機関推薦'),
        bilingual('Prioritas Verifikasi Dokumen', '書類審査優先対応')
      ]
    },
    {
      key: 'MATCHING JOB - Ex-Magang / Ex-Trainee',
      label: 'MATCHING JOB - Ex-Magang',
      subLabel: bilingual('Alumni Kenshusei Jepang', '技能実習修了生 (元実習生)'),
      jaLabel: '元実習生 (Ex-Trainee)',
      isIjef: false,
      targetPortal: 'ADMIN_DOC' as const,
      targetPortalLabel: 'Portal Admin Doc (CV Rirekisho JIS)',
      targetPortalShort: 'Admin Doc',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      tagColor: 'bg-amber-500',
      borderAccent: 'border-amber-200 hover:border-amber-400',
      cardBg: 'bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20',
      icon: Award,
      iconBg: 'bg-amber-100 text-amber-700',
      desc: bilingual(
        'Kandidat berpengalaman kerja di Jepang dengan sertifikat Senmonkyu / JITCO. Memenuhi syarat Tokutei Ginou jalur fast-track tanpa ujian skill dasar.',
        '専門級/JITCO修了証を持つ元技能実習生。技能測定試験免除による特定技能移行のスピードマッチング対象。'
      ),
      features: [
        bilingual('Bebas Ujian Skill (Senmonkyu)', '技能評価試験免除'),
        bilingual('Pengalaman Kerja Jepang Nyata', '日本での就労経験あり'),
        bilingual('Fast-Track Rekomendasi TSK', 'TSK登録支援機関へ即時推薦')
      ]
    },
    {
      key: 'MATCHING JOB - Engineering / Gijinkoku',
      label: 'MATCHING JOB - Gijinkoku',
      subLabel: bilingual('Tenaga Kerja Ahli (S1 / D3)', '技術・人文知識・国際業務'),
      jaLabel: '技術・人文・国際 (技人国)',
      isIjef: false,
      targetPortal: 'ADMIN_DOC' as const,
      targetPortalLabel: 'Portal Admin Doc (CV Rirekisho JIS)',
      targetPortalShort: 'Admin Doc',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      tagColor: 'bg-rose-500',
      borderAccent: 'border-rose-200 hover:border-rose-400',
      cardBg: 'bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20',
      icon: Cpu,
      iconBg: 'bg-rose-100 text-rose-700',
      desc: bilingual(
        'Lulusan perguruan tinggi (D3/S1) untuk visa profesional Gijinkoku (IT, Teknik, Mekanikal, Kantor). Status karyawan tetap profesional di perusahaan Jepang.',
        '大学・高専卒業者対象の就労ビザ（技人国）。IT・機械・電気・建築等の正社員枠での直接雇用推薦。'
      ),
      features: [
        bilingual('Visa Kerja Ahli / Gijinkoku', '技人国就労ビザ'),
        bilingual('Syarat Ijazah D3 / S1', '高専・短大・大学卒以上'),
        bilingual('Penempatan Karyawan Tetap', '正社員採用ルート')
      ]
    }
  ];

  // Category stats calculation
  const categoryStats = useMemo(() => {
    return categoryCards.map((cat) => {
      const matched = leads.filter((l) => normalizeCategory(l.kategoriKandidat) === cat.key);
      const count = matched.length;
      const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      const closing = matched.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'DEAL_TERDAFTAR').length;
      const active = matched.filter((l) => ['KONTAK_AWAL', 'KONSULTASI_LPK', 'FOLLOW_UP'].includes(getCanonicalPipelineStage(l.statusLead))).length;
      const newLead = matched.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'LEAD_BARU').length;
      const integrated = matched.filter((l) => (l.terintegrasiKeAdmin1 || l.integratedToAdmin1) && (l.siswaId || l.integratedStudentId)).length;
      return {
        ...cat,
        count,
        pct,
        closing,
        active,
        newLead,
        integrated
      };
    });
  }, [leads, totalLeads]);

  // Filtered Category Cards
  const filteredCategoryCards = useMemo(() => {
    if (selectedDashboardCategory === 'ALL') return categoryStats;
    if (selectedDashboardCategory === 'IJEF') return categoryStats.filter((c) => c.isIjef);
    if (selectedDashboardCategory === 'NON_IJEF') return categoryStats.filter((c) => !c.isIjef);
    return categoryStats.filter((c) => c.key === selectedDashboardCategory);
  }, [categoryStats, selectedDashboardCategory]);

  // Personal Target for regular staff (default 20 target)
  const currentStaffObj = staffList.find((s) => s.nama.toLowerCase() === staffName.toLowerCase() || s.email?.toLowerCase() === accessInfo?.staffEmail?.toLowerCase());
  const targetMonthly = currentStaffObj?.targetBulanan || 20;
  const targetAchievedPct = Math.min(100, Math.round((dealClosing / targetMonthly) * 100));

  // Pipeline Funnel Calculation (Canonical 5-stage progression)
  const stages = [
    {
      label: bilingual('1. Lead Masuk Baru', '1. 新規受付リード'),
      status: 'LEAD_BARU',
      color: 'from-blue-500 to-indigo-600',
      count: leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'LEAD_BARU').length
    },
    {
      label: bilingual('2. Kontak Awal & WA', '2. 初回連絡・WA'),
      status: 'KONTAK_AWAL',
      color: 'from-cyan-500 to-blue-600',
      count: leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'KONTAK_AWAL').length
    },
    {
      label: bilingual('3. Konseling / Edukasi LPK', '3. カウンセリング・相談'),
      status: 'KONSULTASI_LPK',
      color: 'from-amber-500 to-orange-600',
      count: leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'KONSULTASI_LPK').length
    },
    {
      label: bilingual('4. Follow-Up Intensif', '4. 集中フォローアップ'),
      status: 'FOLLOW_UP',
      color: 'from-purple-500 to-indigo-600',
      count: leads.filter((l) => getCanonicalPipelineStage(l.statusLead) === 'FOLLOW_UP').length
    },
    {
      label: bilingual('5. Closing & Terdaftar', '5. 成約・正式登録'),
      status: 'DEAL_TERDAFTAR',
      color: 'from-emerald-500 to-teal-600',
      count: dealClosing
    }
  ];

  // Sektor Minat
  const bidangMap: Record<string, number> = {};
  leads.forEach((l) => {
    const b = l.bidangMinat || 'Lainnya';
    bidangMap[b] = (bidangMap[b] || 0) + 1;
  });
  const bidangList: [string, number][] = Object.entries(bidangMap).sort((a, b) => Number(b[1]) - Number(a[1]));

  // Sumber Lead
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    const s = l.sumberLead || 'Lainnya';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const sourceList: [string, number][] = Object.entries(sourceMap).sort((a, b) => Number(b[1]) - Number(a[1]));

  // Priority Leads (Need Attention)
  const priorityLeads = leads
    .filter((l) => {
      const canonical = getCanonicalPipelineStage(l.statusLead);
      return canonical !== 'DEAL_TERDAFTAR' && canonical !== 'LOST_BATAL';
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 text-white rounded-xl p-3.5 sm:p-4.5 shadow-sm border border-orange-400/30 relative overflow-hidden space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase text-amber-100 border border-white/30">
              {isLeaderOrAdmin ? (
                <>
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>
                    {bilingual(
                      'DASHBOARD ANALITIK AKUISISI CALON SISWA (LEVEL LEADER & ADMIN)',
                      '見込み生徒獲得分析ダッシュボード (リーダー/管理者)'
                    )}
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span>
                    {bilingual(
                      `DASHBOARD KINERJA PROSPEK SAYA (${staffName.toUpperCase()})`,
                      `個人業績ダッシュボード (${staffName})`
                    )}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-white">
              {isLeaderOrAdmin
                ? bilingual('Pusat Kendali Performa Marketing LPK IJEF', 'LPK IJEF マーケティング統轄ダッシュボード')
                : bilingual(`Dashboard Performa Penjualan & Follow-Up: ${staffName}`, `営業＆フォローアップ実績: ${staffName}`)}
            </h1>
            <p className="text-[11px] sm:text-xs text-orange-100/90 leading-normal font-normal">
              {isLeaderOrAdmin
                ? bilingual(
                    'Pantau konversi lead dari berbagai saluran iklan secara real-time. Kelola pipeline prospek seluruh tim, pantau distribusi lead tiap staf, dan integrasikan calon siswa baru langsung ke seluruh portal sistem.',
                    '広告やSNSからのリード獲得状況をリアルタイムで追跡。チーム全体のパイプライン管理、担当者ごとのリード分配、全システムポータルへの生徒即時連携を管理します。'
                  )
                : bilingual(
                    `Menampilkan analisis pipeline, daftar prospek terisolasi (${totalLeads} data terdaftar), corong konversi, dan pencapaian target bulanan khusus untuk akun Anda.`,
                    `パイプライン分析、担当見込み客リスト (${totalLeads}件)、成約ファネル、月次目標達成率を表示しています。`
                  )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('form')}
              className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-900 font-extrabold text-xs rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer border border-orange-200"
            >
              <UserPlus className="w-3.5 h-3.5 text-orange-600" />
              <span>{bilingual('+ Input Calon Siswa Baru', '+ 新規生徒受付')}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('pipeline')}
              className="px-3 py-1.5 bg-orange-800/80 hover:bg-orange-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center space-x-1.5 cursor-pointer border border-orange-500/50"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>{bilingual('Buka Kanban Pipeline', 'カンバン・パイプライン')}</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-3 border-t border-white/20 text-slate-900">
          <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl shadow-2xs border border-white/40 space-y-0.5">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase">
              <span>{bilingual('Total Lead CRM', '総リード数')}</span>
              <Users className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900">{totalLeads}</div>
            <div className="text-[9px] text-slate-500 flex items-center justify-between">
              <span>{bilingual(`${newLeads} Lead Baru`, `${newLeads} 件の新規`)}</span>
              <span className="font-semibold text-slate-600">IJEF: {ijefCount} • Non: {nonIjefCount}</span>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl shadow-2xs border border-white/40 space-y-0.5">
            <div className="flex items-center justify-between text-slate-500 text-[9px] font-bold uppercase">
              <span>{bilingual('Prospek Aktif', '活動中プロスペクト')}</span>
              <Flame className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-amber-600">{activeProspek}</div>
            <div className="text-[9px] text-amber-700">
              {bilingual('Follow-Up & Konseling', 'フォロー＆相談対応中')}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xs border border-white/40 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
              <span>{bilingual('Closing & Deal', '成約・登録完了')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{dealClosing}</div>
            <div className="text-[10px] text-emerald-700">
              {bilingual('Terdaftar Resmi', '正式登録済み')}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xs border border-white/40 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
              <span>{bilingual('Tersinkron Sistem', '全ポータル連携済')}</span>
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700">{integratedCount}</div>
            <div className="text-[10px] text-purple-700">
              {bilingual('Admin Siswa & Admin Doc', '生徒台帳・面接書類')}
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xs border border-white/40 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
              <span>{bilingual('Conversion Rate', '成約率')}</span>
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600">{closingRate}%</div>
            <div className="text-[10px] text-slate-500">
              {bilingual('Rasio Closing Siswa', 'リード成約率')}
            </div>
          </div>
        </div>

        {/* Personal Target Bar (For Regular Staff) or Leader Team Selector */}
        {!isLeaderOrAdmin ? (
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-900">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {bilingual('Target Closing Bulanan Pribadi Anda', '今月の個人成約目標')}
                </div>
                <div className="text-base font-black text-slate-900">
                  {bilingual(
                    `${dealClosing} dari ${targetMonthly} Siswa Terdaftar (${targetAchievedPct}%)`,
                    `${targetMonthly}人中 ${dealClosing}人登録達成 (${targetAchievedPct}%)`
                  )}
                </div>
              </div>
            </div>

            <div className="w-full sm:max-w-xs space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span>{bilingual('Progress Capaian:', '達成進捗:')}</span>
                <span className="text-orange-700">
                  {bilingual(`${targetAchievedPct}% Selesai`, `${targetAchievedPct}% 達成`)}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${targetAchievedPct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          allTeamLeads && onSelectStaffFilter && (
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xs border border-white/40 flex flex-wrap items-center justify-between gap-2 text-slate-900">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <Users className="w-4 h-4 text-orange-600" />
                <span>{bilingual('Filter Pantau Per-Staf:', '担当スタッフ別フィルター:')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectStaffFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedStaffFilter === 'ALL'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {bilingual(`Semua Tim (${allTeamLeads.length})`, `全チーム (${allTeamLeads.length})`)}
                </button>
                {staffList.map((st) => {
                  const cnt = allTeamLeads.filter((l) => l.picMarketingStaff === st.nama || l.assignedStaff === st.nama).length;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectStaffFilter(st.nama)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedStaffFilter === st.nama
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200'
                      }`}
                    >
                      {st.nama.split(' ')[0]} ({cnt})
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      {/* Grid 2 Columns: Pipeline Funnel & Acquisition Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel Pipeline Visualizer */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Corong Konversi Prospek (Pipeline Funnel)', '成約ファネル (Pipeline Funnel)')}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual(
                    'Tahapan proses akuisisi dari calon siswa masuk hingga terdaftar resmi.',
                    '問い合わせから正式登録に至るまでの受講生獲得プロセス。'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('pipeline')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>{bilingual('Lihat Kanban', 'カンバンを見る')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {stages.map((stg, idx) => {
              const percentage = totalLeads > 0 ? Math.round((stg.count / totalLeads) * 100) : 0;
              return (
                <div key={stg.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{stg.label}</span>
                    </span>
                    <div className="flex items-center space-x-2 text-slate-900 font-bold">
                      <span>{bilingual(`${stg.count} Siswa`, `${stg.count} 名`)}</span>
                      <span className="text-[11px] text-slate-400 font-normal">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stg.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(percentage, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-orange-50/70 border border-orange-200 rounded-2xl flex items-center justify-between text-xs text-orange-950">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                {bilingual(
                  `Efisiensi Konversi: Sebanyak ${dealClosing} dari ${totalLeads} prospek telah terdaftar resmi di LPK IJEF.`,
                  `成約実績: 総リード ${totalLeads} 件中 ${dealClosing} 名 がLPK IJEFに正式登録完了。`
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('followup')}
              className="px-3 py-1 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shrink-0 ml-2 cursor-pointer"
            >
              {bilingual('Follow-Up Prospek', 'フォローアップ')}
            </button>
          </div>
        </div>

        {/* Saluran Sumber Lead (Source Breakdown) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Sumber Akuisisi Lead', 'リード獲得チャネル')}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual('Distribusi kanal promosi', 'プロモーションチャネル別分布')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {sourceList.map(([source, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              const displaySource = translateLeadSource(source, lang);
              return (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[170px]" title={displaySource}>
                      {displaySource}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">
                      {count} <span className="text-slate-400 font-normal text-[10px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('campaigns')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>{bilingual('Kelola Kampanye Promosi', 'プロモーション管理')}</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI: KLASIFIKASI & DISTRIBUSI KATEGORI SISWA */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Header Seksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {bilingual('Klasifikasi & Distribusi Kategori Siswa', '生徒カテゴリー分類・ポータル連携マトリクス')}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {bilingual('6 Kategori Terstandar', '6つの標準区分')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {bilingual(
                  'Pemetaan profil calon siswa ke alur pelatihan LPK IJEF (Admin Siswa SIM-SB) atau alur CV Matchmaking JIS (Admin Doc).',
                  '生徒の適性・経歴に応じたIJEF内部研修（SIM-SB）またはJISマッチング（Admin Doc）への自動振り分け状況。'
                )}
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDashboardCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                selectedDashboardCategory === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{bilingual('Semua Kategori', 'すべて')}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {totalLeads}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDashboardCategory('IJEF')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                selectedDashboardCategory === 'IJEF'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>{bilingual('Jalur IJEF (SIM-SB)', 'IJEF生 (SIM-SB)')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDashboardCategory === 'IJEF' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {ijefCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDashboardCategory('NON_IJEF')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                selectedDashboardCategory === 'NON_IJEF'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-800 hover:bg-purple-50'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <span>{bilingual('Jalur Non-IJEF (JIS)', '一般・JIS連携')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedDashboardCategory === 'NON_IJEF' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}`}>
                {nonIjefCount}
              </span>
            </button>
          </div>
        </div>

        {/* Dual Flow Banner: Jalur IJEF vs Jalur Non-IJEF */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Jalur IJEF */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-200/90 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-emerald-950 text-sm">
                      {bilingual('JALUR LPK IJEF CORP', 'LPK IJEF内部研修コース')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-200/80 text-emerald-900">
                      {ijefPct}% Share
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    {bilingual('Sinkronisasi Target: Portal Admin Siswa (SIM-SB)', '連携先: SIM-SB 生徒管理台帳')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-emerald-800">{ijefCount}</div>
                <div className="text-[10px] text-emerald-600">{bilingual('Total Lead', '総リード数')}</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bilingual(
                'Siswa binaan langsung LPK IJEF (Asrama Offline & E-Learning Online). Memerlukan monitoring presensi, MCU bertahap, psikotes DISC, dan evaluasi kelayakan interview.',
                'LPK IJEF直営の研修生（対面入寮およびオンラインLMS）。出席管理、健康診断、DISC適性検査を行いSIM-SB生徒台帳と完全連動。'
              )}
            </p>

            {/* Micro Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-100 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <div className="text-[10px] text-slate-500 font-bold">{bilingual('Offline Asrama', '対面入寮')}</div>
                <div className="text-sm font-extrabold text-emerald-700">{offlineCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <div className="text-[10px] text-slate-500 font-bold">{bilingual('Online LMS', 'オンライン')}</div>
                <div className="text-sm font-extrabold text-blue-700">{onlineCount}</div>
              </div>
              <div className="p-2 rounded-xl bg-white/80 border border-emerald-100">
                <div className="text-[10px] text-slate-500 font-bold">{bilingual('Deal Closing', '成約済')}</div>
                <div className="text-sm font-extrabold text-emerald-800">{ijefDealClosing}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-1">
              <span className="flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{bilingual(`${ijefIntegrated} Siswa Terintegrasi SIM-SB`, `${ijefIntegrated}名がSIM-SB連携済`)}</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('table', 'IJEF')}
                className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <span>{bilingual('Lihat Data IJEF', 'IJEF生一覧')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card Jalur Non-IJEF */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/90 via-indigo-50/40 to-white border border-purple-200/90 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-purple-950 text-sm">
                      {bilingual('JALUR NON-IJEF / MATCHING JOB', '一般・提携・マッチングコース')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-200/80 text-purple-900">
                      {nonIjefPct}% Share
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium">
                    {bilingual('Sinkronisasi Target: Portal Admin Doc (CV Rirekisho JIS)', '連携先: JIS履歴書・求人管理')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-purple-800">{nonIjefCount}</div>
                <div className="text-[10px] text-purple-600">{bilingual('Total Lead', '総リード数')}</div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {bilingual(
                'Kandidat pelamar umum, mitra SMK, ex-magang berpengalaman di Jepang, & sarjana teknik gijinkoku. Diarahkan ke pool JIS untuk pembuatan CV standar & interview.',
                '一般応募、提携校推薦、元技能実習生、および大卒エンジニア（技人国）。JIS履歴書作成と直接求人マッチングへ展開。'
              )}
            </p>

            {/* Micro Breakdown 4 items */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-purple-100 text-center text-xs">
              <div className="p-1.5 rounded-xl bg-white/80 border border-purple-100">
                <div className="text-[9px] text-slate-500 font-bold truncate" title="New Comer">New Comer</div>
                <div className="text-xs font-extrabold text-purple-700">{newComerCount}</div>
              </div>
              <div className="p-1.5 rounded-xl bg-white/80 border border-purple-100">
                <div className="text-[9px] text-slate-500 font-bold truncate" title="Mitra SMK">Mitra SMK</div>
                <div className="text-xs font-extrabold text-teal-700">{mitraCount}</div>
              </div>
              <div className="p-1.5 rounded-xl bg-white/80 border border-purple-100">
                <div className="text-[9px] text-slate-500 font-bold truncate" title="Ex-Magang">Ex-Magang</div>
                <div className="text-xs font-extrabold text-amber-700">{exMagangCount}</div>
              </div>
              <div className="p-1.5 rounded-xl bg-white/80 border border-purple-100">
                <div className="text-[9px] text-slate-500 font-bold truncate" title="Gijinkoku">Gijinkoku</div>
                <div className="text-xs font-extrabold text-rose-700">{gijinkokuCount}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-900 pt-1">
              <span className="flex items-center space-x-1">
                <Check className="w-3.5 h-3.5 text-purple-600" />
                <span>{bilingual(`${nonIjefIntegrated} Terintegrasi Admin Doc JIS`, `${nonIjefIntegrated}名がAdmin Doc連携済`)}</span>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('table', 'NON_IJEF')}
                className="font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <span>{bilingual('Lihat Data Non-IJEF', 'Non-IJEF生一覧')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Visual Proportional Split Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Jalur IJEF Corp: {ijefCount} Siswa ({ijefPct}%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>Jalur Non-IJEF / JIS: {nonIjefCount} Siswa ({nonIjefPct}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-l-full transition-all duration-500"
              style={{ width: `${Math.max(ijefPct, 2)}%` }}
              title={`Jalur IJEF: ${ijefCount} (${ijefPct}%)`}
            />
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-r-full transition-all duration-500"
              style={{ width: `${Math.max(nonIjefPct, 2)}%` }}
              title={`Jalur Non-IJEF: ${nonIjefCount} (${nonIjefPct}%)`}
            />
          </div>
        </div>

        {/* 6 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {filteredCategoryCards.map((cat) => {
            const IconComp = cat.icon;
            return (
              <div
                key={cat.key}
                className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-md ${cat.cardBg} ${cat.borderAccent}`}
              >
                <div className="space-y-3">
                  {/* Top Row: Icon + Badge + Count */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2.5 rounded-xl ${cat.iconBg} shadow-2xs`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cat.badgeColor}`}>
                          {cat.isIjef ? 'JALUR IJEF' : 'JALUR NON-IJEF'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{cat.jaLabel}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">{cat.count}</div>
                      <div className="text-[10px] text-slate-500 font-semibold">{cat.pct}% total</div>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{cat.label}</h4>
                    <p className="text-xs text-slate-600 font-medium">{cat.subLabel}</p>
                  </div>

                  {/* Target System Badge */}
                  <div className="p-2 rounded-xl bg-white/90 border border-slate-200/80 flex items-center space-x-2 text-[11px]">
                    <span className="font-extrabold text-slate-500 uppercase text-[9px] tracking-wider shrink-0">
                      {bilingual('Target:', '同期先:')}
                    </span>
                    <span className={`font-bold truncate ${cat.isIjef ? 'text-emerald-700' : 'text-purple-700'}`}>
                      {cat.targetPortalLabel}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {cat.desc}
                  </p>

                  {/* Feature Checkpoints */}
                  <div className="space-y-1 text-[11px] text-slate-700">
                    {cat.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center space-x-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Stats & Action Buttons */}
                <div className="space-y-3 pt-3 border-t border-slate-200/60">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200/60">
                      <div className="text-[9px] text-slate-500 font-bold">{bilingual('Closing', '成約')}</div>
                      <div className="text-xs font-black text-emerald-600">{cat.closing}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200/60">
                      <div className="text-[9px] text-slate-500 font-bold">{bilingual('Aktif', '進行中')}</div>
                      <div className="text-xs font-black text-amber-600">{cat.active}</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/80 border border-slate-200/60">
                      <div className="text-[9px] text-slate-500 font-bold">{bilingual('Sinkron', '連携済')}</div>
                      <div className="text-xs font-black text-blue-600">{cat.integrated}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('table', cat.key)}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>{bilingual('Lihat Data Siswa', '生徒データ表示')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('pipeline', cat.key)}
                      className="py-1.5 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                      title={bilingual('Buka di Kanban Pipeline', 'カンバンで開く')}
                    >
                      Kanban
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid 2 Columns: Peminatan Bidang Kerja Jepang & Prospek Prioritas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peminatan Sektor Kerja Jepang */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual('Peminatan Sektor Kerja', '希望職種・業種')}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual('Bidang Tokutei Ginou / Magang', '特定技能 / 技能実習分野')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {bidangList.map(([bidang, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              const displayBidang = translateJobSector(bidang, lang);
              return (
                <div key={bidang} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 text-xs truncate max-w-[190px]">{displayBidang}</span>
                    <span className="font-black text-orange-600">
                      {bilingual(`${count} Siswa`, `${count} 名`)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Prospek (Hot Leads requiring Follow Up) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {bilingual(
                    'Prospek Prioritas (Perlu Follow-Up & Tindak Lanjut)',
                    '優先フォロー見込み客 (要対応)'
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {bilingual(
                    'Calon siswa aktif yang menunggu jadwal konsultasi atau respons',
                    '相談日程や返答待ちのアクティブな生徒'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('table')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>{bilingual(`Lihat Semua (${leads.length})`, `すべて表示 (${leads.length})`)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityLeads.map((lead) => {
              const displaySector = translateJobSector(lead.bidangMinat, lang);
              const displayStage = translatePipelineStage(lead.statusLead, lang);

              return (
                <div
                  key={lead.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{lead.namaLengkap}</span>
                      <span className="text-[10px] bg-orange-100 text-orange-900 font-bold px-2 py-0.5 rounded-full">
                        {displayStage}
                      </span>
                      <span className="text-[10px] text-slate-400">{lead.kotaDomisili}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                      <span>{displaySector}</span>
                      <span>•</span>
                      <span className="text-orange-700 font-medium">PIC: {lead.picMarketingStaff || 'Beno Ryan'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(lead)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      title={bilingual('Chat WhatsApp', 'WhatsApp チャットを開く')}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{bilingual('Chat WA', 'WA送信')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenFollowUp(lead)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      title={bilingual('Catat Follow-Up', 'フォローアップを記録')}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{bilingual('Follow-Up', 'フォロー')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDetail(lead)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-xs font-bold cursor-pointer"
                      title={bilingual('Detail Profil', 'プロフィール詳細')}
                    >
                      {bilingual('Detail', '詳細')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
