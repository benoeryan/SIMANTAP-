import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useEcosystemTranslation } from '../../hooks/useEcosystemTranslation';
import {
  calculateDepartureFinancing,
  parseBiayaJobToNumber,
  DepartureFinancingScheme,
  DepartureBillingItem,
  DepartureJobInfo,
  DEFAULT_DEPARTURE_BILLING_ITEMS,
  ESTIMATED_KUR_JPY_IDR
} from '../../utils/departureFinancingCalculator';
import { formatRupiah, getApprovalStageInfo } from '../../utils/financingCalculator';
import { generatePdfFromElement, printDocumentElement } from '../../utils/pdfGenerator';
import { getSanitizedCompany } from '../../utils/mitraJobUtils';
import { AplikasiDukunganDana, JobPosting, JobType } from '../../types';
import {
  PlaneTakeoff,
  Banknote,
  Coins,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer,
  Download,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Clock,
  RotateCcw,
  Check,
  Info,
  DollarSign,
  FileCheck2,
  FileSpreadsheet
} from 'lucide-react';

export const BiayaKeberangkatanView: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent,
    jobPostings,
    jobApplications,
    financingRecords,
    saveFinancingRecord
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tBiaya,
    bilingual
  } = useEcosystemTranslation('biayaKeberangkatan');

  const [activeSubTab, setActiveSubTab] = useState<'simulasi' | 'billing' | 'termin' | 'penjamin' | 'approval' | 'dokumen'>('simulasi');

  // Candidate selection
  const candidate = activeStudent || students[0];

  // Matching applications for this candidate
  const candidateApplications = jobApplications.filter(
    (app) => app.siswaId === candidate?.id || app.emailSiswa?.toLowerCase() === candidate?.email?.toLowerCase()
  );

  // Existing financing record
  const existingRecord = candidate ? financingRecords[candidate.id] : undefined;

  // Selected Job for Departure Cost
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    if (existingRecord?.jobId) return existingRecord.jobId;
    if (candidateApplications.length > 0) return candidateApplications[0].jobId;
    return jobPostings[0]?.id || '';
  });

  const selectedJob = jobPostings.find((j) => j.id === selectedJobId) || jobPostings[0];

  // Mechanism: STRICTLY 2 MECHANISMS: 'DANA_TALANG_100' | 'DANA_MANDIRI'
  const [skema, setSkema] = useState<DepartureFinancingScheme>(() => {
    if (existingRecord?.skemaKeberangkatan) return existingRecord.skemaKeberangkatan;
    if (existingRecord?.skemaPilihan === 'MANDIRI') return 'DANA_MANDIRI';
    return 'DANA_TALANG_100';
  });

  // Custom Departure Cost
  const defaultJobCost = selectedJob ? parseBiayaJobToNumber(selectedJob.biayaProses) : 25000000;
  const [departureCost, setDepartureCost] = useState<number>(() => {
    if (existingRecord?.biayaKeberangkatan && existingRecord.biayaKeberangkatan > 0) {
      return existingRecord.biayaKeberangkatan;
    }
    if (existingRecord?.biayaTotal && existingRecord.biayaTotal > 0) {
      return existingRecord.biayaTotal;
    }
    return defaultJobCost;
  });

  // Tenor for Dana Talang 100% (potong gaji saat di Jepang)
  const [tenorBulan, setTenorBulan] = useState<number>(() => {
    return existingRecord?.tenorBulan || existingRecord?.pilihanTenor || 12;
  });

  // Billing items breakdown
  const [billingItems, setBillingItems] = useState<DepartureBillingItem[]>(() => {
    if (existingRecord?.komponenBillingKeberangkatan && existingRecord.komponenBillingKeberangkatan.length > 0) {
      return existingRecord.komponenBillingKeberangkatan;
    }
    return DEFAULT_DEPARTURE_BILLING_ITEMS;
  });

  // Guarantor data
  const [guarantor, setGuarantor] = useState({
    namaPenjamin: existingRecord?.namaPenjamin || candidate?.namaAyah || 'Suharto Sitorus',
    ktpPenjamin: existingRecord?.ktpPenjamin || candidate?.ktpNpwpAyah || '3271040101700003',
    npwpPenjamin: existingRecord?.npwpPenjamin || '12.345.678.9-012.000',
    pekerjaanPenjamin: (existingRecord?.pekerjaanPenjamin || 'Wiraswasta') as JobType,
    hubunganPenjamin: (existingRecord?.hubunganPenjamin || 'Orang Tua') as 'Orang Tua' | 'Wali' | 'Kerabat' | 'Suami/Istri',
    alamatPenjamin: existingRecord?.alamatPenjamin || candidate?.alamatDomisili || candidate?.alamatLengkap || 'Jl. Pemuda No. 45, Jakarta Timur',
    noHpPenjamin: existingRecord?.noHpPenjamin || candidate?.noHp || '081234567890'
  });

  // Approval status
  const [statusPersetujuan, setStatusPersetujuan] = useState<'DRAFT' | 'PENGAJUAN' | 'VERIFIKASI_ADMIN' | 'APPROVAL_MANAGER' | 'DISETUJUI' | 'DITOLAK'>(() => {
    return existingRecord?.statusPersetujuan || 'DRAFT';
  });
  const [catatanApproval, setCatatanApproval] = useState<string>(existingRecord?.catatanApproval || '');

  // Term schedule payment status overrides
  const [termStatusOverrides, setTermStatusOverrides] = useState<Record<number, 'LUNAS' | 'PROSES' | 'BELUM'>>({});

  // Document metadata for printing
  const [docMeta, setDocMeta] = useState({
    nomorRegistrasi: existingRecord?.nomorRegistrasi || `DEPART-LPK/${new Date().getFullYear()}/${candidate?.id || '001'}`,
    kopNamaLpk: 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
    kopSubJudul: 'Divisi Penempatan Kerja Luar Negeri (Sending Organization / SO Disnaker No. 560/LPK-IJEF/2024)',
    kopAlamat: 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Telp: (021) 8899-7766 | Email: departure@ijefcorp.co.id',
    judulForm: 'FORMULIR PENETAPAN BIAYA KEBERANGKATAN JEPANG & PERNYATAAN SKEMA PEMBIAYAAN',
    teksKetentuan: 'Dengan ini menyatakan menyetujui rincian biaya keberangkatan dan skema pembiayaan penempatan kerja di Jepang yang diselenggarakan oleh LPK IJEF CORP. Kandidat dan Penjamin bersedia mematuhi seluruh kewajiban legalitas, kedisiplinan kerja, dan mekanisme penyelesaian pembiayaan sesuai skema yang dipilih.',
    penandatangan1Jabatan: 'Kandidat Tenaga Kerja',
    penandatangan2Jabatan: 'Orang Tua / Penjamin Keluarga',
    penandatangan3Jabatan: 'Manager Penempatan Luar Negeri LPK IJEF'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state when candidate changes
  useEffect(() => {
    if (candidate) {
      const rec = financingRecords[candidate.id];
      if (rec) {
        if (rec.skemaKeberangkatan) setSkema(rec.skemaKeberangkatan);
        else if (rec.skemaPilihan === 'MANDIRI') setSkema('DANA_MANDIRI');
        else setSkema('DANA_TALANG_100');

        if (rec.biayaKeberangkatan && rec.biayaKeberangkatan > 0) setDepartureCost(rec.biayaKeberangkatan);
        else if (rec.biayaTotal && rec.biayaTotal > 0) setDepartureCost(rec.biayaTotal);

        if (rec.tenorBulan) setTenorBulan(rec.tenorBulan);
        if (rec.jobId) setSelectedJobId(rec.jobId);
        if (rec.statusPersetujuan) setStatusPersetujuan(rec.statusPersetujuan);
        if (rec.catatanApproval) setCatatanApproval(rec.catatanApproval);
        if (rec.komponenBillingKeberangkatan && rec.komponenBillingKeberangkatan.length > 0) {
          setBillingItems(rec.komponenBillingKeberangkatan);
        }

        setGuarantor({
          namaPenjamin: rec.namaPenjamin || candidate.namaAyah || 'Suharto Sitorus',
          ktpPenjamin: rec.ktpPenjamin || candidate.ktpNpwpAyah || '3271040101700003',
          npwpPenjamin: rec.npwpPenjamin || '12.345.678.9-012.000',
          pekerjaanPenjamin: (rec.pekerjaanPenjamin || 'Wiraswasta') as JobType,
          hubunganPenjamin: (rec.hubunganPenjamin || 'Orang Tua') as any,
          alamatPenjamin: rec.alamatPenjamin || candidate.alamatDomisili || candidate.alamatLengkap || 'Jl. Pemuda No. 45, Jakarta Timur',
          noHpPenjamin: rec.noHpPenjamin || candidate.noHp || '081234567890'
        });
      } else {
        // Reset defaults
        setGuarantor({
          namaPenjamin: candidate.namaAyah || 'Suharto Sitorus',
          ktpPenjamin: candidate.ktpNpwpAyah || '3271040101700003',
          npwpPenjamin: '12.345.678.9-012.000',
          pekerjaanPenjamin: 'Wiraswasta',
          hubunganPenjamin: 'Orang Tua',
          alamatPenjamin: candidate.alamatDomisili || candidate.alamatLengkap || 'Jl. Pemuda No. 45, Jakarta Timur',
          noHpPenjamin: candidate.noHp || '081234567890'
        });
      }
    }
  }, [candidate?.id]);

  // When job selection changes, auto-update departure cost if not manually locked
  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    const targetJob = jobPostings.find((j) => j.id === jobId);
    if (targetJob) {
      const parsed = parseBiayaJobToNumber(targetJob.biayaProses);
      setDepartureCost(parsed);
    }
  };

  // Compile job information
  const jobInfo: DepartureJobInfo = selectedJob
    ? {
        jobId: selectedJob.id,
        kodeJob: selectedJob.kodeJob || selectedJob.id,
        judulJob: selectedJob.judulPekerjaan,
        perusahaanJepang: selectedJob.perusahaanJepang,
        kumiaiRujukan: selectedJob.kumiaiRujukan,
        lokasiPrefektur: selectedJob.lokasiPrefektur,
        gajiBulananYen: selectedJob.gajiBulananYen,
        gajiEstimasiIdr: selectedJob.gajiEstimasiIdr,
        biayaProses: selectedJob.biayaProses
      }
    : {
        judulJob: 'Penempatan Tokutei Ginou Kaigo / Manufaktur Jepang',
        perusahaanJepang: 'Kousei Medical Association Co., Ltd.',
        lokasiPrefektur: 'Tokyo, Japan',
        gajiBulananYen: 215000,
        biayaProses: 'Rp 25.000.000'
      };

  // Calculate Departure Simulation
  const simulation = calculateDepartureFinancing(
    skema,
    departureCost,
    tenorBulan,
    jobInfo,
    billingItems
  );

  // Apply term payment status overrides
  const effectiveJadwalTermin = simulation.jadwalTermin.map((term) => {
    if (termStatusOverrides[term.terminKe]) {
      return { ...term, statusBayar: termStatusOverrides[term.terminKe] };
    }
    return term;
  });

  const approvalStageInfo = getApprovalStageInfo(statusPersetujuan, lang);

  // Save to AppContext & Firestore
  const handleSaveRecord = () => {
    if (!candidate) return;

    const payload: AplikasiDukunganDana = {
      id: existingRecord?.id || `DEPART-${candidate.id}`,
      siswaId: candidate.id,
      namaSiswa: candidate.namaLengkap,
      jobId: selectedJob?.id,
      kodeJob: selectedJob?.kodeJob || selectedJob?.id,
      judulJob: selectedJob?.judulPekerjaan,
      perusahaanJepang: selectedJob?.perusahaanJepang,
      biayaJobDetail: selectedJob?.biayaProses || formatRupiah(departureCost),
      namaPenjamin: guarantor.namaPenjamin,
      ktpPenjamin: guarantor.ktpPenjamin,
      npwpPenjamin: guarantor.npwpPenjamin,
      pekerjaanPenjamin: guarantor.pekerjaanPenjamin,
      hubunganPenjamin: guarantor.hubunganPenjamin,
      alamatPenjamin: guarantor.alamatPenjamin,
      noHpPenjamin: guarantor.noHpPenjamin,
      programOption: skema === 'DANA_TALANG_100' ? 'DT 100%' : 'MANDIRI',
      biayaTotal: departureCost,
      uangMukaDp: simulation.uangMukaDp,
      plafondPinjaman: simulation.plafondDanaTalang,
      tenorBulan: simulation.tenorBulan,
      angsuranPerBulan: simulation.angsuranPerBulanIdr,
      tanggalPengajuan: existingRecord?.tanggalPengajuan || new Date().toISOString().split('T')[0],
      skemaPilihan: skema === 'DANA_TALANG_100' ? 'DT_100' : 'MANDIRI',
      pilihanTenor: simulation.tenorBulan,
      nominalDP: simulation.uangMukaDp,
      nominalPinjaman: simulation.plafondDanaTalang,
      statusPersetujuan,
      catatanApproval,
      nomorRegistrasi: docMeta.nomorRegistrasi,
      kopNamaLpk: docMeta.kopNamaLpk,
      kopSubJudul: docMeta.kopSubJudul,
      kopAlamat: docMeta.kopAlamat,
      judulForm: docMeta.judulForm,
      teksKetentuan: docMeta.teksKetentuan,
      penandatangan1Jabatan: docMeta.penandatangan1Jabatan,
      penandatangan2Jabatan: docMeta.penandatangan2Jabatan,
      // Specific Departure Financing Fields
      skemaKeberangkatan: skema,
      biayaKeberangkatan: departureCost,
      angsuranPerBulanYen: simulation.angsuranPerBulanYen,
      estimasiGajiYen: simulation.estimasiGajiYen,
      sisaGajiBersihYen: simulation.sisaGajiBersihYen,
      komponenBillingKeberangkatan: billingItems,
      jadwalTerminKeberangkatan: effectiveJadwalTermin,
      rincianCicilanJepang: simulation.rincianCicilanJepang
    };

    saveFinancingRecord(payload);
    setToastMessage(lang === 'ja' ? '渡航費用データが正常に保存・同期されました！' : 'Data Pembiayaan Keberangkatan Berhasil Disimpan & Tersinkron!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrint = (elementId: string, docTitle: string) => {
    printDocumentElement(elementId, docTitle);
  };

  const handleDownloadPdf = (elementId: string, filename: string) => {
    generatePdfFromElement(elementId, filename);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 rounded-3xl shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5">
                <PlaneTakeoff className="w-3.5 h-3.5 text-purple-300" />
                <span>{lang === 'ja' ? '書類管理 (Admin Doc) • 日本ジョブマッチング＆渡航管理' : 'Admin Doc • CV-Portal & Job Matching Jepang'}</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2.5 py-1 rounded-full font-mono">
                {lang === 'ja' ? '2大 渡航費用決済スキーム' : '2 Mekanisme Khusus Keberangkatan'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-3">
              <span>{lang === 'ja' ? '日本渡航・就労初期費用マネジメント' : 'Manajemen Pembiayaan Keberangkatan Jepang'}</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {lang === 'ja' ? (
                <>日本就労配属および渡航にかかる専用費用スキーム（国内研修費とは別管理）。求人マッチング情報およびLPK公式請求明細に連動し、2つの特別オプションを提供します：<strong className="text-emerald-400">100%渡航立替金（日本就労後の給与天引き）</strong> または <strong className="text-amber-400">自己負担資金決済</strong>。</>
              ) : (
                <>Mekanisme khusus biaya penempatan kerja & keberangkatan ke Jepang (berbeda dari biaya pelatihan LPK Admin Siswa). Biaya keberangkatan disesuaikan dengan lowongan job matching terkait dan rincian billing resmi LPK IJEF CORP dengan 2 opsi eksklusif: <strong className="text-emerald-400">DANA TALANG 100%</strong> (potong gaji di Jepang) atau <strong className="text-amber-400">DANA MANDIRI</strong>.</>
              )}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleSaveRecord}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ja' ? '費用設定を保存' : 'Simpan Pembiayaan'}</span>
            </button>
            <button
              onClick={() => handlePrint('printable-departure-doc', `Pembiayaan_Keberangkatan_${candidate?.namaLengkap || 'Siswa'}`)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-purple-600/30 transition flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ja' ? '申請書印刷' : 'Cetak Form'}</span>
            </button>
          </div>
        </div>

        {/* Student & Job Selector Bar */}
        <div className="mt-6 pt-5 border-t border-purple-800/40 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Selector */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-2xl flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center shrink-0 border border-purple-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                {lang === 'ja' ? '対象生徒・渡航候補者を選択:' : 'Pilih Siswa / Kandidat Keberangkatan:'}
              </label>
              <select
                value={selectedStudentId || candidate?.id || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-purple-400 cursor-pointer mt-0.5"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaLengkap} ({s.id}) — {s.kategoriKandidat || (lang === 'ja' ? '生徒' : 'Siswa')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Placement Selector */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3 rounded-2xl flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                {lang === 'ja' ? '連動求人・求人票を同期:' : 'Sinkronkan Lowongan Job Terlampir:'}
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 cursor-pointer mt-0.5"
              >
                {jobPostings.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.judulPekerjaan} ({job.lokasiPrefektur || (lang === 'ja' ? '日本' : 'Jepang')}) — {lang === 'ja' ? '費用:' : 'Biaya:'} {job.biayaProses || (lang === 'ja' ? '標準' : 'Standar')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'simulasi', label: lang === 'ja' ? '1. 渡航費用シミュレーション' : '1. Simulasi Keberangkatan', icon: Banknote, color: 'purple' },
          { id: 'billing', label: lang === 'ja' ? '2. LPK請求明細内訳' : '2. Rincian Billing LPK', icon: Layers, color: 'emerald' },
          { id: 'termin', label: lang === 'ja' ? '3. 支払期日・給与天引き' : '3. Termin & Potong Gaji', icon: Calendar, color: 'amber' },
          { id: 'penjamin', label: lang === 'ja' ? '4. 保証人＆必要書類' : '4. Penjamin & Syarat', icon: ShieldCheck, color: 'blue' },
          { id: 'approval', label: lang === 'ja' ? '5. 多段階承認フロー' : '5. Multi-Tier Approval', icon: FileCheck2, color: 'indigo' },
          { id: 'dokumen', label: lang === 'ja' ? '6. 公式同意書印刷' : '6. Cetak Dokumen Legal', icon: FileText, color: 'slate' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: SIMULASI PEMBIAYAAN KEBERANGKATAN              */}
      {/* ========================================================= */}
      {activeSubTab === 'simulasi' && (
        <div className="space-y-6">
          {/* 2 MECHANISM CARDS SELECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: DANA TALANG 100% */}
            <div
              onClick={() => setSkema('DANA_TALANG_100')}
              className={`p-5 rounded-3xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                skema === 'DANA_TALANG_100'
                  ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-500 shadow-xl shadow-emerald-900/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 shadow-xs'
              }`}
            >
              {skema === 'DANA_TALANG_100' && (
                <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '選択中のスキーム' : 'Mekanisme Terpilih'}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                    skema === 'DANA_TALANG_100' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      skema === 'DANA_TALANG_100' ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {lang === 'ja' ? 'スキーム 1' : 'Mekanisme 1'}
                    </span>
                    <h3 className="text-lg font-black tracking-tight">
                      {lang === 'ja' ? '渡航費用 100%立替金スキーム' : 'DANA TALANG 100%'}
                    </h3>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${
                  skema === 'DANA_TALANG_100' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {lang === 'ja' ? (
                    <>LPK IJEF CORPおよび提携金融パートナーによる渡航費用の100%全額立替。生徒は<strong>出国前の頭金（DP）不要（頭金 Rp 0）</strong>。日本配属後に受給する月給からの分割給与天引きにより返済します。</>
                  ) : (
                    <>Talangan penuh 100% biaya keberangkatan oleh LPK IJEF CORP / Financing Partner. Siswa <strong>tidak perlu membayar DP di awal (DP Rp 0)</strong>. Pembayaran dicicil melalui potong gaji bulanan saat siswa sudah resmi bekerja dan menerima gaji di Jepang.</>
                  )}
                </p>
              </div>

              <div className={`mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-xs ${
                skema === 'DANA_TALANG_100' ? 'border-emerald-800/60' : 'border-slate-100'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === 'ja' ? '事前頭金 (DP):' : 'Uang Muka (DP):'}</span>
                  <span className="text-base font-black text-emerald-400 font-mono">Rp 0 (DP 0%)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === 'ja' ? '返済方法:' : 'Metode Pengembalian:'}</span>
                  <span className="font-bold text-white">{lang === 'ja' ? '日本での給与天引き' : 'Potong Gaji di Jepang'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: DANA MANDIRI */}
            <div
              onClick={() => setSkema('DANA_MANDIRI')}
              className={`p-5 rounded-3xl border-2 transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                skema === 'DANA_MANDIRI'
                  ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900 text-white border-amber-500 shadow-xl shadow-amber-900/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 shadow-xs'
              }`}
            >
              {skema === 'DANA_MANDIRI' && (
                <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '選択中のスキーム' : 'Mekanisme Terpilih'}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                    skema === 'DANA_MANDIRI' ? 'bg-amber-500 text-slate-950' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      skema === 'DANA_MANDIRI' ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      {lang === 'ja' ? 'スキーム 2' : 'Mekanisme 2'}
                    </span>
                    <h3 className="text-lg font-black tracking-tight">
                      {lang === 'ja' ? '自己負担資金決済 (自己調達)' : 'DANA MANDIRI'}
                    </h3>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${
                  skema === 'DANA_MANDIRI' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {lang === 'ja' ? (
                    <>候補者本人またはご家族による100%自己資金での事前銀行振込決済（利息0%、日本就労中の給与天引き一切なし）。出国フライト前に一括または請求書に準じた分割振込にて完納します。</>
                  ) : (
                    <>Pembayaran biaya keberangkatan 100% mandiri oleh kandidat/keluarga via transfer ke rekening resmi LPK IJEF CORP (Bunga 0%, bebas potongan cicilan saat di Jepang). Pembayaran dapat dilunasi sekaligus atau bertahap sesuai invoice billing sebelum jadwal penerbangan.</>
                  )}
                </p>
              </div>

              <div className={`mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-xs ${
                skema === 'DANA_MANDIRI' ? 'border-amber-800/60' : 'border-slate-100'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === 'ja' ? '日本就労中の天引き額:' : 'Potongan Gaji di Jepang:'}</span>
                  <span className="text-base font-black text-amber-400 font-mono">{lang === 'ja' ? 'Rp 0 (天引きなし)' : 'Rp 0 (Bebas Cicilan)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{lang === 'ja' ? '決済方法:' : 'Metode Pembayaran:'}</span>
                  <span className="font-bold text-white">{lang === 'ja' ? 'LPK公式口座への事前振込' : 'Transfer Mandiri LPK IJEF'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* JOB DETAILS & NOMINAL COST INPUTS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-purple-700" />
                  <span>{lang === 'ja' ? '求人・請求明細に基づく渡航初期費用シミュレーション' : 'Kalkulasi Nominal Biaya Berdasarkan Job Terlampir & Billing'}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ja' ? '求人カタログの費用情報から自動同期、またはLPK公式請求明細に合わせて調整可能です。' : 'Nominal dapat disinkronkan otomatis dari data katalog lowongan kerja atau disesuaikan dengan invoice billing LPK.'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedJob) {
                      setDepartureCost(parseBiayaJobToNumber(selectedJob.biayaProses));
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ja' ? '求人費用再同期' : 'Sinkron Ulang Job'}</span>
                </button>
              </div>
            </div>

            {/* Selected Job Card Preview */}
            {selectedJob && (
              <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 border border-purple-200/70 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">{lang === 'ja' ? '求人件名・職種:' : 'Judul Lowongan Kerja:'}</span>
                  <span className="font-bold text-slate-900 block truncate">{selectedJob.judulPekerjaan}</span>
                  <span className="text-[11px] text-slate-500 break-words">{getSanitizedCompany(selectedJob, lang)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">{lang === 'ja' ? '勤務地＆監理団体/登録支援:' : 'Lokasi & Kumiai:'}</span>
                  <span className="font-bold text-slate-900 block flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{selectedJob.lokasiPrefektur || (lang === 'ja' ? '日本' : 'Jepang')}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block">{selectedJob.kumiaiRujukan || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">{lang === 'ja' ? '想定月額基本給:' : 'Estimasi Gaji Pokok:'}</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ¥{selectedJob.gajiBulananYen?.toLocaleString('ja-JP')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    (± {formatRupiah(selectedJob.gajiEstimasiIdr || 0)}/{lang === 'ja' ? '月' : 'bln'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-700 uppercase block">{lang === 'ja' ? '渡航プロセス費用:' : 'Biaya Job Terlampir:'}</span>
                  <span className="font-mono font-black text-emerald-700 text-sm">
                    {selectedJob.biayaProses || formatRupiah(defaultJobCost)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">{lang === 'ja' ? 'システム同期済' : 'Tersinkron di Sistem'}</span>
                </div>
              </div>
            )}

            {/* Inputs: Biaya & Tenor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Departure Cost Input */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-800">
                  {lang === 'ja' ? '総渡航初期費用額 (Rp):' : 'Nominal Total Biaya Keberangkatan (Rp):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={departureCost}
                    onChange={(e) => setDepartureCost(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 font-mono font-black text-slate-900 text-base focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Quick Selection Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: lang === 'ja' ? '求人連動' : 'Job Terlampir', val: defaultJobCost },
                    { label: lang === 'ja' ? '2,000万Rp' : '20 Jt', val: 20000000 },
                    { label: lang === 'ja' ? '2,500万Rp (介護)' : '25 Jt (Kaigo)', val: 25000000 },
                    { label: lang === 'ja' ? '3,000万Rp (食品/製造)' : '30 Jt (Food/Manuf)', val: 30000000 },
                    { label: lang === 'ja' ? '3,500万Rp (建設)' : '35 Jt (Konstruksi)', val: 35000000 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setDepartureCost(p.val)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        departureCost === p.val
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenor Selection (Only relevant for Dana Talang 100%) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '日本就労中の給与天引き分割期間 (回数):' : 'Pilihan Tenor Potong Gaji di Jepang:')
                    : (lang === 'ja' ? '分割規定:' : 'Ketentuan Tenor:')}
                </label>
                {skema === 'DANA_TALANG_100' ? (
                  <select
                    value={tenorBulan}
                    onChange={(e) => setTenorBulan(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value={6}>{lang === 'ja' ? '6ヶ月（短期完納）' : '6 Bulan (Cicilan Cepat)'}</option>
                    <option value={12}>{lang === 'ja' ? '12ヶ月（1年・標準）' : '12 Bulan (1 Tahun - Standar)'}</option>
                    <option value={18}>{lang === 'ja' ? '18ヶ月（1.5年）' : '18 Bulan (1.5 Tahun)'}</option>
                    <option value={24}>{lang === 'ja' ? '24ヶ月（2年）' : '24 Bulan (2 Tahun)'}</option>
                    <option value={36}>{lang === 'ja' ? '36ヶ月（3年・軽負担）' : '36 Bulan (3 Tahun - Ringan)'}</option>
                  </select>
                ) : (
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-500">
                    {lang === 'ja' ? '分割なし（出国前全額自己決済）' : 'Bebas Tenor (Pelunasan Mandiri Pra-Keberangkatan)'}
                  </div>
                )}
                <span className="text-[10px] text-slate-500 block">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? `日本就労先の給与明細より${tenorBulan}ヶ月間分割天引きされます。` : `Cicilan dipotong dari slip gaji Jepang selama ${tenorBulan} bulan.`)
                    : (lang === 'ja' ? '日本就労中の給与天引きは一切発生しません。' : 'Tidak ada pemotongan gaji saat bekerja di Jepang.')}
                </span>
              </div>
            </div>

            {/* LIVE CALCULATION METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">{lang === 'ja' ? '総渡航初期費用' : 'Total Biaya Keberangkatan'}</span>
                <span className="text-base font-black text-slate-900 font-mono">
                  {formatRupiah(simulation.biayaTotal)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{lang === 'ja' ? '求人・LPK請求明細準拠' : 'Sesuai Job & Billing LPK'}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '生徒事前頭金 (DP)' : 'Uang Muka (DP Awal Siswa)')
                    : (lang === 'ja' ? '自己負担決済額' : 'Pelunasan Mandiri')}
                </span>
                <span className={`text-base font-black font-mono ${
                  skema === 'DANA_TALANG_100' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {formatRupiah(simulation.uangMukaDp)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '頭金 0% (出国前負担なし)' : 'DP 0% (Tanpa Biaya Awal)')
                    : (lang === 'ja' ? '自己資金による分割/一括払' : 'Dibayar Mandiri Bertahap')}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '100%立替金融資枠' : 'Plafond Dana Talang 100%')
                    : (lang === 'ja' ? 'LPK立替枠' : 'Talangan LPK')}
                </span>
                <span className={`text-base font-black font-mono ${
                  skema === 'DANA_TALANG_100' ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {formatRupiah(simulation.plafondDanaTalang)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '100% LPK/パートナー立替' : '100% Ditalangi LPK/Partner')
                    : (lang === 'ja' ? 'Rp 0 (立替なし)' : 'Rp 0 (Mandiri)')}
                </span>
              </div>

              <div className={`p-4 rounded-2xl border ${
                skema === 'DANA_TALANG_100'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <span className="text-[10px] font-bold uppercase block opacity-80">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? `月次給与天引き額 (${tenorBulan}ヶ月)` : `Potong Gaji / Bulan (${tenorBulan} Bln)`)
                    : (lang === 'ja' ? '給与天引き残額' : 'Sisa Potongan Gaji')}
                </span>
                <span className="text-base font-black font-mono block">
                  {skema === 'DANA_TALANG_100' ? (
                    <>
                      {formatRupiah(simulation.angsuranPerBulanIdr)}
                      <span className="text-xs font-bold text-emerald-700 ml-1">
                        (± ¥{simulation.angsuranPerBulanYen.toLocaleString('ja-JP')})
                      </span>
                    </>
                  ) : (
                    lang === 'ja' ? 'Rp 0 (天引きなし)' : 'Rp 0 (Bebas Cicilan)'
                  )}
                </span>
                <span className="text-[10px] block opacity-80 mt-0.5">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '日本給与明細より天引き' : 'Dipotong dari slip gaji Jepang')
                    : (lang === 'ja' ? '月給を100%満額受給' : 'Gaji diterima penuh 100%')}
                </span>
              </div>
            </div>

            {/* SALARY PROJECTION BOX FOR DANA TALANG 100% */}
            {skema === 'DANA_TALANG_100' && (
              <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span className="uppercase tracking-wider">
                      {lang === 'ja' ? '日本就労中の手取り月収シミュレーション' : 'Simulasi Gaji Bersih yang Diterima di Jepang'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-200 bg-emerald-800/60 px-2.5 py-0.5 rounded-full">
                    {lang === 'ja' ? '想定為替レート:' : 'Kurs Estimasi:'} 1 JPY ≈ Rp {ESTIMATED_KUR_JPY_IDR}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase block">{lang === 'ja' ? '1. 想定基本給 (額面)' : '1. Estimasi Gaji Pokok'}</span>
                    <span className="text-lg font-black font-mono text-white">
                      ¥{simulation.estimasiGajiYen.toLocaleString('ja-JP')}
                    </span>
                    <span className="text-[11px] text-emerald-200 block">
                      (± {formatRupiah(Math.round(simulation.estimasiGajiYen * ESTIMATED_KUR_JPY_IDR))})
                    </span>
                  </div>

                  <div className="bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-300 uppercase block">{lang === 'ja' ? '2. 渡航立替金返済天引き' : '2. Potong Cicilan Talangan'}</span>
                    <span className="text-lg font-black font-mono text-rose-300">
                      - ¥{simulation.angsuranPerBulanYen.toLocaleString('ja-JP')}
                    </span>
                    <span className="text-[11px] text-rose-200 block">
                      (- {formatRupiah(simulation.angsuranPerBulanIdr)}) / {lang === 'ja' ? '月' : 'bulan'}
                    </span>
                  </div>

                  <div className="bg-emerald-500 text-slate-950 p-3 rounded-xl shadow-md">
                    <span className="text-[10px] font-black text-slate-900 uppercase block">{lang === 'ja' ? '3. 生徒手取り目安給与' : '3. Sisa Gaji Bersih Siswa'}</span>
                    <span className="text-lg font-black font-mono text-slate-950">
                      ¥{simulation.sisaGajiBersihYen.toLocaleString('ja-JP')}
                    </span>
                    <span className="text-[11px] text-slate-900 font-bold block">
                      (± {formatRupiah(Math.round(simulation.sisaGajiBersihYen * ESTIMATED_KUR_JPY_IDR))}/{lang === 'ja' ? '月' : 'bln'})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-200/90 italic pt-1">
                  {lang === 'ja'
                    ? '* 立替金天引き後も十分な手取りが確保され、生活費のほかインドネシア家族への仕送りや貯蓄が可能です。'
                    : '* Siswa tetap dapat menabung dan mengirim uang ke keluarga di Indonesia secara leluasa setiap bulannya setelah dipotong cicilan talangan dana keberangkatan.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: RINCIAN BILLING KOMPONEN BY LPK IJEF           */}
      {/* ========================================================= */}
      {activeSubTab === 'billing' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ja' ? 'LPK IJEF CORP公式 渡航初期費用 明細内訳' : 'Rincian Itemized Billing Keberangkatan by LPK IJEF CORP'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ja' ? '公的渡航手続き、航空券、就労ビザ、海外保険、渡航前オリエンテーション等にかかる公式積算内訳。' : 'Struktur alokasi pembiayaan resmi untuk kebutuhan dokumen, tiket, visa, asuransi, dan pembekalan keberangkatan.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const newItem: DepartureBillingItem = {
                  key: `item_${Date.now()}`,
                  label: lang === 'ja' ? '追加特別手続き費用' : 'Komponen Tambahan Khusus',
                  nominal: 1000000,
                  keterangan: lang === 'ja' ? '渡航プロセスに伴う特別要件' : 'Kebutuhan khusus proses keberangkatan'
                };
                setBillingItems([...billingItems, newItem]);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ja' ? '明細項目を追加' : 'Tambah Komponen Billing'}</span>
            </button>
          </div>

          {/* Billing Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">{lang === 'ja' ? '費用明細項目名' : 'Nama Komponen Billing'}</th>
                  <th className="py-3 px-4">{lang === 'ja' ? '備考 / 資金使途詳細' : 'Keterangan / Detail Alokasi'}</th>
                  <th className="py-3 px-4 text-right w-44">{lang === 'ja' ? '金額 (Rp)' : 'Nominal (Rp)'}</th>
                  <th className="py-3 px-4 text-center w-16">{lang === 'ja' ? '操作' : 'Aksi'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {billingItems.map((item, idx) => (
                  <tr key={item.key} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const updated = [...billingItems];
                          updated[idx].label = e.target.value;
                          setBillingItems(updated);
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 font-bold text-slate-800 outline-none px-1 py-0.5"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.keterangan}
                        onChange={(e) => {
                          const updated = [...billingItems];
                          updated[idx].keterangan = e.target.value;
                          setBillingItems(updated);
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 text-slate-600 text-[11px] outline-none px-1 py-0.5"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={item.nominal}
                        onChange={(e) => {
                          const updated = [...billingItems];
                          updated[idx].nominal = Number(e.target.value);
                          setBillingItems(updated);
                          // Auto calculate total
                          const sum = updated.reduce((acc, curr) => acc + curr.nominal, 0);
                          setDepartureCost(sum);
                        }}
                        className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono font-bold text-slate-900 text-xs outline-none focus:border-purple-500"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = billingItems.filter((_, i) => i !== idx);
                          setBillingItems(updated);
                          const sum = updated.reduce((acc, curr) => acc + curr.nominal, 0);
                          setDepartureCost(sum);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 text-right font-black uppercase text-xs">
                    {lang === 'ja' ? '渡航初期費用 合計総額:' : 'Total Keseluruhan Billing Keberangkatan:'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-purple-900">
                    {formatRupiah(billingItems.reduce((acc, item) => acc + item.nominal, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">{lang === 'ja' ? 'LPK IJEF CORP 送出機関としての透明性保証' : 'Transparansi Penempatan Resmi LPK IJEF CORP'}</strong>
              <span>
                {lang === 'ja'
                  ? '上記すべての請求明細は特定技能・技人国制度における公的渡航手続き（国際線航空券、大使館就労ビザ発給、海外渡航傷害保険、インドネシア労働省SISKOP2MI登録等）に準拠した正当な費用内訳です。'
                  : 'Seluruh rincian billing di atas merupakan pembiayaan resmi penempatan kerja Tokutei Ginou / Gijinkoku ke Jepang, mencakup tiket pesawat resmi maskapai internasional, visa kerja kedutaan, asuransi perlindungan, dan administrasi SISKOP2MI BP2MI.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: TERMIN & POTONG GAJI JEPANG                    */}
      {/* ========================================================= */}
      {activeSubTab === 'termin' && (
        <div className="space-y-6">
          {/* Skenario Termin */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <span>{lang === 'ja' ? '支払期日スケジュール＆納付ステータス' : 'Jadwal Termin & Status Pembayaran'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {skema === 'DANA_TALANG_100'
                    ? (lang === 'ja' ? '日本滞在中の給与天引きによる自動返済スケジュール。' : 'Jadwal cicilan potong gaji otomatis selama berada di Jepang.')
                    : (lang === 'ja' ? '出国フライト前の自己資金分割納付スケジュール。' : 'Jadwal tahapan pelunasan mandiri sebelum jadwal keberangkatan.')}
                </p>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                skema === 'DANA_TALANG_100' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {skema === 'DANA_TALANG_100'
                  ? (lang === 'ja' ? 'スキーム: 100%渡航立替金' : 'Skema: DANA TALANG 100%')
                  : (lang === 'ja' ? 'スキーム: 自己負担決済' : 'Skema: DANA MANDIRI')}
              </span>
            </div>

            {/* Termin Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">{lang === 'ja' ? '回数' : 'Tahap'}</th>
                    <th className="py-3 px-4">{lang === 'ja' ? '期日詳細 / 納付予定時期' : 'Deskripsi Termin / Jadwal Waktu'}</th>
                    <th className="py-3 px-4">{lang === 'ja' ? '備考' : 'Keterangan'}</th>
                    <th className="py-3 px-4 text-center w-24">{lang === 'ja' ? '割合' : 'Persentase'}</th>
                    <th className="py-3 px-4 text-right w-36">{lang === 'ja' ? '金額 (Rp)' : 'Nominal (Rp)'}</th>
                    <th className="py-3 px-4 text-center w-32">{lang === 'ja' ? '納付状況' : 'Status Bayar'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {effectiveJadwalTermin.map((term) => (
                    <tr key={term.terminKe} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{term.terminKe}</td>
                      <td className="py-3 px-4">
                        <strong className="block text-slate-900">{term.labelTermin}</strong>
                        <span className="text-[11px] text-slate-500">{term.jadwalWaktu}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-[11px]">{term.keterangan}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{term.persentase}%</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(term.nominal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={term.statusBayar}
                          onChange={(e) => {
                            setTermStatusOverrides({
                              ...termStatusOverrides,
                              [term.terminKe]: e.target.value as any
                            });
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            term.statusBayar === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : term.statusBayar === 'PROSES'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="BELUM">{lang === 'ja' ? '未納' : 'Belum Bayar'}</option>
                          <option value="PROSES">{lang === 'ja' ? '処理中' : 'Dalam Proses'}</option>
                          <option value="LUNAS">{lang === 'ja' ? '完納' : 'Lunas'}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DETAILED MONTHLY SCHEDULE IN JAPAN (FOR DANA TALANG 100%) */}
            {skema === 'DANA_TALANG_100' && simulation.rincianCicilanJepang && simulation.rincianCicilanJepang.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? `日本就労先給与天引きシミュレーション一覧表 (${tenorBulan}ヶ月)` : `Matriks Tabel Simulasi Potong Gaji Bulanan di Jepang (${tenorBulan} Bulan)`}</span>
                </h4>

                <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-16">{lang === 'ja' ? '月数' : 'Bulan Ke'}</th>
                        <th className="py-2.5 px-3">{lang === 'ja' ? '天引き内容 / 項目' : 'Keterangan Pemotongan'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'ja' ? '天引き額 (ルピア)' : 'Potongan (Rupiah)'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'ja' ? '天引き額 (円 ¥)' : 'Potongan (Yen ¥)'}</th>
                        <th className="py-2.5 px-3 text-right">{lang === 'ja' ? '立替金残高 (Rp)' : 'Sisa Talangan (Rp)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {simulation.rincianCicilanJepang.map((row) => (
                        <tr key={row.bulanKe} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">{lang === 'ja' ? `${row.bulanKe}ヶ月目` : `Bulan #${row.bulanKe}`}</td>
                          <td className="py-2 px-3 text-slate-700">{row.keterangan}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(row.angsuranIdr)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">¥{row.angsuranYen.toLocaleString('ja-JP')}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">{formatRupiah(row.sisaTalanganIdr)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: DATA PENJAMIN & DOKUMEN PERSYARATAN            */}
      {/* ========================================================= */}
      {activeSubTab === 'penjamin' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>{lang === 'ja' ? '家族身元保証人情報＆渡航費用法的保証' : 'Data Penjamin Keluarga & Legalitas Pembiayaan Keberangkatan'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ja' ? '保証人は日本就労プログラムに参加する生徒に対して道義的および法的な連帯責任を負います。' : 'Penjamin bertanggung jawab secara moril dan hukum atas keikutsertaan siswa dalam program kerja ke Jepang.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人氏名 (フルネーム):' : 'Nama Lengkap Penjamin:'}</label>
              <input
                type="text"
                value={guarantor.namaPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, namaPenjamin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '候補者との続柄:' : 'Hubungan dengan Kandidat:'}</label>
              <select
                value={guarantor.hubunganPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, hubunganPenjamin: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Orang Tua">{lang === 'ja' ? '両親 (実父 / 実母)' : 'Orang Tua (Ayah / Ibu Kandung)'}</option>
                <option value="Suami/Istri">{lang === 'ja' ? '配偶者 (夫 / 妻)' : 'Suami / Istri Sah'}</option>
                <option value="Wali">{lang === 'ja' ? '法定後見人' : 'Wali Hukum'}</option>
                <option value="Kerabat">{lang === 'ja' ? '親族 / 実の兄弟姉妹' : 'Kerabat Dekat / Saudara Kandung'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人身分証明番号 (NIK KTP):' : 'Nomor NIK KTP Penjamin:'}</label>
              <input
                type="text"
                value={guarantor.ktpPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, ktpPenjamin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人携帯電話 / WhatsApp:' : 'No. HP / WhatsApp Penjamin:'}</label>
              <input
                type="text"
                value={guarantor.noHpPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, noHpPenjamin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人の職業:' : 'Pekerjaan Penjamin:'}</label>
              <input
                type="text"
                value={guarantor.pekerjaanPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, pekerjaanPenjamin: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人納税番号 NPWP (任意):' : 'NPWP Penjamin (Opsional):'}</label>
              <input
                type="text"
                value={guarantor.npwpPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, npwpPenjamin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人の現住所 (住民票住所):' : 'Alamat Domisili Lengkap Penjamin:'}</label>
              <textarea
                rows={2}
                value={guarantor.alamatPenjamin}
                onChange={(e) => setGuarantor({ ...guarantor, alamatPenjamin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Checklist Dokumen Pendukung */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              {lang === 'ja' ? '保証人適格性書類のステータス (Firestore連携):' : 'Status Berkas Kelayakan Penjamin (Terhubung ke Firestore):'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { label: lang === 'ja' ? '候補者本人身分証 (KTP)' : 'KTP Asli Kandidat', status: lang === 'ja' ? '確認済' : 'Terverifikasi' },
                { label: lang === 'ja' ? '保証人身分証 (KTP)' : 'KTP Penjamin / Orang Tua', status: lang === 'ja' ? '確認済' : 'Terverifikasi' },
                { label: lang === 'ja' ? '家族証明書 (KK)' : 'Kartu Keluarga (KK)', status: lang === 'ja' ? '確認済' : 'Terverifikasi' },
                { label: lang === 'ja' ? '保証人同意書・誓約書' : 'Surat Persetujuan Penjamin', status: lang === 'ja' ? '完備' : 'Lengkap' }
              ].map((doc, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">{doc.label}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{doc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 5: MULTI-TIER APPROVAL HIERARCHY                  */}
      {/* ========================================================= */}
      {activeSubTab === 'approval' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>{lang === 'ja' ? '渡航費用 多段階承認・検証ステータス' : 'Status Verifikasi & Multi-Tier Approval Keberangkatan'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === 'ja' ? '承認ワークフロー: 申請者/生徒 → LPK管理者 → ユーザーマネージャー → 統括本部長 (GM) / 代表。' : 'Alur pengesahan bertingkat: Siswa/Pemohon → Admin LPK → User Manager → General Manager / Direktur.'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${approvalStageInfo.badgeBg}`}>
                {approvalStageInfo.badgeLabel}
              </span>
            </div>
          </div>

          {/* Stepper Progress Visualizer */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { step: 1, title: lang === 'ja' ? '1. 申請提出' : '1. Pengajuan', desc: lang === 'ja' ? '申請者 / 生徒' : 'Pemohon / Siswa', state: 'PENGAJUAN' },
              { step: 2, title: lang === 'ja' ? '2. 書類確認' : '2. Verifikasi Dokumen', desc: lang === 'ja' ? 'LPK管理者' : 'Admin LPK IJEF', state: 'VERIFIKASI_ADMIN' },
              { step: 3, title: lang === 'ja' ? '3. 求人マッチ承認' : '3. Approval Matching', desc: lang === 'ja' ? 'ユーザーマネージャー' : 'User Manager TSK', state: 'APPROVAL_MANAGER' },
              { step: 4, title: lang === 'ja' ? '4. 最終承認 (完了)' : '4. Disetujui Final', desc: lang === 'ja' ? '統括本部長 (GM) 認可' : 'General Manager (Sah)', state: 'DISETUJUI' }
            ].map((st) => {
              const isPassed = approvalStageInfo.step >= st.step;
              const isCurrent = approvalStageInfo.step === st.step;
              return (
                <div
                  key={st.step}
                  className={`p-4 rounded-2xl border transition ${
                    isPassed
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : isCurrent
                      ? 'bg-purple-50 border-purple-300 text-purple-950 ring-2 ring-purple-400'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : st.step}
                    </div>
                    <span className="font-black text-xs">{st.title}</span>
                  </div>
                  <p className="text-[11px] opacity-80 pl-8">{st.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {lang === 'ja' ? '渡航費用承認ステータスの変更:' : 'Ubah Status Persetujuan Pembiayaan Keberangkatan:'}
              </label>
              <select
                value={statusPersetujuan}
                onChange={(e) => setStatusPersetujuan(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="DRAFT">{lang === 'ja' ? '1. ドラフト (未申請)' : '1. DRAFT (Belum Diajukan)'}</option>
                <option value="PENGAJUAN">{lang === 'ja' ? '2. 段階1: 申請者・生徒による申請' : '2. TAHAP 1: Pengajuan Pemohon / Siswa'}</option>
                <option value="VERIFIKASI_ADMIN">{lang === 'ja' ? '3. 段階2: LPK管理者による確認済' : '3. TAHAP 2: Verifikasi Admin LPK'}</option>
                <option value="APPROVAL_MANAGER">{lang === 'ja' ? '4. 段階3: ユーザーマネージャー承認済' : '4. TAHAP 3: Approval User Manager'}</option>
                <option value="DISETUJUI">{lang === 'ja' ? '5. 段階4: 統括本部長最終承認 (法的に完了)' : '5. TAHAP 4: Disetujui Final (General Manager)'}</option>
                <option value="DITOLAK">{lang === 'ja' ? '却下 (要件不備 / 取消)' : 'DITOLAK (Pengajuan Belum Layak / Dibatalkan)'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {lang === 'ja' ? '承認者・審査員コメント / メモ:' : 'Catatan Verifikator / Manager:'}
              </label>
              <textarea
                rows={3}
                value={catatanApproval}
                onChange={(e) => setCatatanApproval(e.target.value)}
                placeholder={lang === 'ja' ? '例: 保証人書類完備、雇用契約および在留資格認定証明書 (CoE) 確認完了。' : 'Contoh: Dokumen penjamin lengkap, kontrak kerja dan CoE Jepang telah terverifikasi sah.'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 6: CETAK DOKUMEN RESMI (PRINT & PDF)              */}
      {/* ========================================================= */}
      {activeSubTab === 'dokumen' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {lang === 'ja' ? '生徒渡航費用 公式決定同意書 プレビュー' : 'Pratinjau Formulir Resmi Pembiayaan Keberangkatan Siswa'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ja' ? 'LPK公式レターヘッド付き文書。即時印刷および高解像度PDFダウンロードに対応しています。' : 'Dokumen resmi ber-kop LPK IJEF CORP siap cetak langsung atau unduh PDF beresolusi tinggi.'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handlePrint('printable-departure-doc', `Pembiayaan_Keberangkatan_${candidate?.namaLengkap || 'Siswa'}`)}
                className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ja' ? '書類を印刷' : 'Cetak Form Sekarang'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf('printable-departure-doc', `Formulir_Keberangkatan_${candidate?.namaLengkap || 'Siswa'}.pdf`)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'ja' ? 'PDFを保存' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>

          {/* PRINTABLE OFFICIAL DOCUMENT */}
          <div
            id="printable-departure-doc"
            className="bg-white border border-slate-300 rounded-2xl p-8 sm:p-12 shadow-md max-w-4xl mx-auto space-y-6 text-slate-900 font-serif leading-relaxed"
          >
            {/* Kop Surat Resmi */}
            <div className="border-b-4 border-double border-slate-900 pb-4 text-center space-y-1">
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-950 font-sans">
                {docMeta.kopNamaLpk}
              </h2>
              <p className="text-[11px] font-bold text-slate-700 font-sans">
                {docMeta.kopSubJudul}
              </p>
              <p className="text-[10px] text-slate-600 font-sans">
                {docMeta.kopAlamat}
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1 pt-2">
              <h3 className="text-base font-black uppercase underline tracking-wide">
                {lang === 'ja' ? '日本渡航費用決定通知書 兼 決済スキーム同意書' : docMeta.judulForm}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-700">
                {lang === 'ja' ? '登録管理番号:' : 'Nomor Registrasi:'} {docMeta.nomorRegistrasi}
              </p>
            </div>

            {/* Section I: Identitas Siswa & Job */}
            <div className="space-y-2 text-xs">
              <h4 className="font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                {lang === 'ja' ? 'I. 候補者身元情報および日本求人情報' : 'I. IDENTITAS KANDIDAT & LOWONGAN KERJA JEPANG'}
              </h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="w-48 py-1 font-bold">{lang === 'ja' ? '生徒氏名 (フルネーム)' : 'Nama Lengkap Siswa'}</td>
                    <td className="w-4 py-1">:</td>
                    <td className="py-1 font-bold">{candidate?.namaLengkap || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">{lang === 'ja' ? '生徒ID / 身分証番号' : 'ID Siswa / NIK KTP'}</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono">{candidate?.id || '-'} / {candidate?.noKtp || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">{lang === 'ja' ? '候補者区分' : 'Kategori Kandidat'}</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{candidate?.kategoriKandidat || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">{lang === 'ja' ? '配属先企業 / 提携TSK' : 'Perusahaan Jepang'}</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-bold">{getSanitizedCompany({ perusahaanJepang: jobInfo.perusahaanJepang }, lang)} ({jobInfo.lokasiPrefektur || (lang === 'ja' ? '日本' : 'Jepang')})</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">{lang === 'ja' ? '職種・職務内容' : 'Bidang & Posisi Pekerjaan'}</td>
                    <td className="py-1">:</td>
                    <td className="py-1">{jobInfo.judulJob || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">{lang === 'ja' ? '推定基本給与 (月給)' : 'Estimasi Gaji Pokok'}</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono font-bold">¥{jobInfo.gajiBulananYen?.toLocaleString('ja-JP')} / {lang === 'ja' ? '月' : 'bulan'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section II: Rincian Biaya & Skema Terpilih */}
            <div className="space-y-2 text-xs">
              <h4 className="font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                {lang === 'ja' ? 'II. 渡航費用明細および選択決済スキーム' : 'II. RINCIAN BIAYA KEBERANGKATAN & SKEMA PEMBIAYAAN'}
              </h4>
              
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{lang === 'ja' ? '選択された決済スキーム:' : 'Mekanisme Pembiayaan Terpilih:'}</span>
                  <span className="font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                    {lang === 'ja'
                      ? (skema === 'DANA_TALANG_100' ? '100% 渡航立替金スキーム (日本就労後給与天引き)' : '自己負担資金決済スキーム (渡航前全額決済)')
                      : simulation.skemaLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{lang === 'ja' ? 'LPK公式 渡航総費用:' : 'Total Biaya Keberangkatan by LPK IJEF:'}</span>
                  <span className="font-mono text-sm">{formatRupiah(simulation.biayaTotal)}</span>
                </div>
                {skema === 'DANA_TALANG_100' ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-emerald-800 font-bold">
                      <span>{lang === 'ja' ? '初期自己負担頭金 (DP):' : 'Uang Muka (DP Awal):'}</span>
                      <span className="font-mono">{lang === 'ja' ? 'Rp 0 (自己負担ゼロ・全額立替)' : 'Rp 0 (DP 0% - Penuh Ditalangi)'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span>{lang === 'ja' ? '100% 渡航立替枠限度額:' : 'Plafond Dana Talang 100%:'}</span>
                      <span className="font-mono">{formatRupiah(simulation.plafondDanaTalang)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-purple-900 font-bold">
                      <span>{lang === 'ja' ? '日本就労後の分割期間＆月額天引き額:' : 'Tenor & Angsuran Potong Gaji di Jepang:'}</span>
                      <span className="font-mono">
                        {tenorBulan} {lang === 'ja' ? 'ヶ月' : 'Bulan'} @ {formatRupiah(simulation.angsuranPerBulanIdr)} (± ¥{simulation.angsuranPerBulanYen.toLocaleString('ja-JP')}/{lang === 'ja' ? '月' : 'bln'})
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs text-amber-800 font-bold">
                      <span>{lang === 'ja' ? '自己負担決済方式:' : 'Metode Pelunasan Mandiri:'}</span>
                      <span>{lang === 'ja' ? '出国前に全額自己決済（金利0％・日本就労後の給与控除なし）' : '100% Dibayar Mandiri Sebelum Terbang (Bunga 0%, Bebas Potongan Gaji)'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section III: Itemized Breakdown */}
            <div className="space-y-2 text-xs">
              <h4 className="font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                {lang === 'ja' ? 'III. 渡航請求明細内訳項目' : 'III. KOMPONEN BILLING BIAYA KEBERANGKATAN'}
              </h4>
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold">
                  <tr>
                    <th className="py-1.5 px-3 border border-slate-300 w-10 text-center">No</th>
                    <th className="py-1.5 px-3 border border-slate-300">{lang === 'ja' ? '項目名' : 'Komponen'}</th>
                    <th className="py-1.5 px-3 border border-slate-300 text-right w-36">{lang === 'ja' ? '金額 (IDR)' : 'Nominal'}</th>
                  </tr>
                </thead>
                <tbody>
                  {billingItems.map((item, idx) => (
                    <tr key={item.key}>
                      <td className="py-1.5 px-3 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="py-1.5 px-3 border border-slate-300">
                        <strong>{item.label}</strong>
                        <span className="text-[10px] text-slate-600 block">{item.keterangan}</span>
                      </td>
                      <td className="py-1.5 px-3 border border-slate-300 text-right font-mono font-bold">
                        {formatRupiah(item.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-bold bg-slate-100">
                  <tr>
                    <td colSpan={2} className="py-2 px-3 border border-slate-300 text-right uppercase">{lang === 'ja' ? '合計:' : 'Total:'}</td>
                    <td className="py-2 px-3 border border-slate-300 text-right font-mono font-black">
                      {formatRupiah(simulation.biayaTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Ketentuan Pernyataan */}
            <div className="text-[11px] text-slate-700 space-y-1 pt-1">
              <p className="font-bold">{lang === 'ja' ? '規約および共同宣誓事項:' : 'Ketentuan & Pernyataan Bersama:'}</p>
              <p className="text-justify leading-relaxed">
                {lang === 'ja' ? '本書をもって、LPK IJEF CORPが主催する日本就労プログラムにおける渡航費用の内訳および選択した決済スキームに同意します。候補者および身元保証人は、選択したスキームに従い、すべての法的手続き、労働規律、および費用の返済義務を誠実に遵守することを誓約します。' : docMeta.teksKetentuan}
              </p>
            </div>

            {/* Tanda Tangan 3 Pihak */}
            <div className="grid grid-cols-3 gap-4 text-center pt-8 text-xs font-sans">
              <div className="space-y-16">
                <p className="font-bold">{lang === 'ja' ? '候補者（本人署名）' : docMeta.penandatangan1Jabatan}</p>
                <div>
                  <p className="font-bold underline uppercase">{candidate?.namaLengkap || (lang === 'ja' ? '生徒' : 'Siswa')}</p>
                  <p className="text-[10px] text-slate-500">{lang === 'ja' ? '就労候補者' : 'Kandidat Tenaga Kerja'}</p>
                </div>
              </div>

              <div className="space-y-16">
                <p className="font-bold">{lang === 'ja' ? '家族身元保証人' : docMeta.penandatangan2Jabatan}</p>
                <div>
                  <p className="font-bold underline uppercase">{guarantor.namaPenjamin || (lang === 'ja' ? '保証人' : 'Penjamin')}</p>
                  <p className="text-[10px] text-slate-500">{lang === 'ja' ? '身元保証人 (親権者/配偶者)' : 'Penjamin Keluarga'}</p>
                </div>
              </div>

              <div className="space-y-16">
                <p className="font-bold">{lang === 'ja' ? 'LPK IJEF CORP 送出機関責任者' : docMeta.penandatangan3Jabatan}</p>
                <div>
                  <p className="font-bold underline uppercase">LPK IJEF CORP</p>
                  <p className="text-[10px] text-slate-500">{lang === 'ja' ? '送出機関 代表 / 財務部' : 'Direktur / Finance SO'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
