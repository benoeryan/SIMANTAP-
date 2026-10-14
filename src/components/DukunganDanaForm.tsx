import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateTrainingFinancing,
  formatRupiah,
  TRAINING_PACKAGES_LPK,
  PAYMENT_SCHEMES_LPK,
  TrainingProgramPackage,
  TrainingComponentCost,
  TrainingTermScheduleItem
} from '../utils/financingCalculator';
import { AplikasiDukunganDana, JobType } from '../types';
import { generatePdfFromElement, printDocumentElement } from '../utils/pdfGenerator';
import {
  FINANCING_TRANSLATIONS,
  PACKAGE_TRANSLATIONS,
  SCHEME_TRANSLATIONS,
  COMPONENT_TRANSLATIONS
} from '../i18n/financingAndContractI18n';
import {
  Coins,
  Save,
  CheckCircle2,
  Printer,
  Download,
  Calculator,
  UserCheck,
  Building2,
  FileText,
  CreditCard,
  ShieldCheck,
  User,
  Check,
  Clock,
  XCircle,
  Edit3,
  Layout,
  ListOrdered,
  Eye,
  Plus,
  Trash2,
  FileCheck2,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Calendar,
  Sparkles,
  RotateCcw,
  BadgePercent,
  CheckCircle,
  Building,
  HelpCircle,
  Percent
} from 'lucide-react';

export const DukunganDanaForm: React.FC = () => {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    activeStudent,
    financingRecords,
    saveFinancingRecord,
    lang
  } = useApp();

  const isJa = lang === 'ja';
  const tr = FINANCING_TRANSLATIONS[isJa ? 'ja' : 'id'];

  const [activeTabPanel, setActiveTabPanel] = useState<'simulasi' | 'termin' | 'kop' | 'identitas' | 'ketentuan'>('simulasi');
  const [directEditMode, setDirectEditMode] = useState<boolean>(false);

  // LPK Training Program State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('REGULER_OFFLINE');
  const [customCost, setCustomCost] = useState<number>(10000000);
  const [skemaPembayaran, setSkemaPembayaran] = useState<string>('CASH_LUNAS');
  const [tenorPilihan, setTenorPilihan] = useState<number>(6);
  const [metodePembayaranLpk, setMetodePembayaranLpk] = useState<'TRANSFER_LPK' | 'VA_SISWA' | 'KASIR_LPK'>('TRANSFER_LPK');
  const [rekeningTujuan, setRekeningTujuan] = useState<string>('Bank Mandiri: 123-00-998877-1 a.n. LPK IJEF CORP');

  // Term schedule overrides / payment status
  const [termStatusList, setTermStatusList] = useState<Record<number, 'LUNAS' | 'PROSES' | 'BELUM'>>({});

  // Participant Name & Finance Name
  const [namaPeserta, setNamaPeserta] = useState<string>(activeStudent?.namaLengkap || 'Pia purianti');
  const [namaFinance, setNamaFinance] = useState<string>('Finance LPK IJEF CORP');

  // Guarantor Data
  const [guarantorData, setGuarantorData] = useState({
    namaPenjamin: activeStudent?.namaAyah || 'Suharto Sitorus',
    ktpPenjamin: activeStudent?.ktpNpwpAyah || '3271040101700003',
    npwpPenjamin: '12.345.678.9-012.000',
    pekerjaanPenjamin: 'Wiraswasta' as JobType,
    hubunganPenjamin: 'Orang Tua' as 'Orang Tua' | 'Wali' | 'Kerabat' | 'Suami/Istri',
    alamatPenjamin: activeStudent?.alamatDomisili || 'Jl. Pemuda No. 45, Jakarta Timur',
    noHpPenjamin: activeStudent?.noHp || '081234567890'
  });

  // Custom Document Header & Metadata
  const [docMeta, setDocMeta] = useState({
    nomorRegistrasi: activeStudent ? `BIAYA-LPK/${new Date().getFullYear()}/${activeStudent.id}` : `BIAYA-LPK/${new Date().getFullYear()}/REG-001`,
    kopNamaLpk: 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
    kopSubJudul: 'Lembaga Pelatihan Kerja Terakreditasi & Pusat Pengembangan SDM Jepang (Disnaker No. 560/LPK-IJEF/2024)',
    kopAlamat: 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Telp: (021) 8899-7766 | Email: info@ijefcorp.co.id',
    judulForm: 'FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK',
    teksKetentuan: 'Dengan ini menyatakan mendaftar dan menyetujui rincian biaya pelatihan pendidikan Bahasa Jepang dan Keterampilan Kerja di LPK IJEF CORP. Calon siswa dan Penjamin berjanji mematuhi jadwal termin pembayaran, tata tertib asrama/pendidikan, serta kewajiban kedisiplinan selama mengikuti seluruh tahapan pelatihan.',
    penandatangan1Jabatan: 'Calon Siswa Pelatihan',
    penandatangan2Jabatan: 'Orang Tua / Penjamin Biaya',
    penandatangan3Jabatan: 'Bagian Keuangan / Finance LPK'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync data when activeStudent or financingRecords change
  useEffect(() => {
    if (activeStudent) {
      const existing = financingRecords[activeStudent.id];
      if (existing) {
        if (existing.paketPelatihanId) {
          setSelectedPackageId(existing.paketPelatihanId);
        } else {
          setSelectedPackageId('REGULER_OFFLINE');
        }

        if (existing.biayaTotal > 0) {
          setCustomCost(existing.biayaTotal);
        } else {
          const pkg = TRAINING_PACKAGES_LPK.find((p) => p.id === (existing.paketPelatihanId || 'REGULER_OFFLINE'));
          setCustomCost(pkg?.biayaStandar || 10000000);
        }

        if (existing.skemaPembayaranPelatihan) {
          setSkemaPembayaran(existing.skemaPembayaranPelatihan);
        } else if (existing.programOption) {
          if (existing.programOption === 'Reguler 100%' || existing.programOption === 'CASH_LUNAS') setSkemaPembayaran('CASH_LUNAS');
          else if (existing.programOption === 'DT 100%' || existing.programOption === 'DT_100_6B') setSkemaPembayaran('DT_100_6B');
          else if (existing.programOption === 'DT 50%' || existing.programOption === 'DT_50_5B') setSkemaPembayaran('DT_50_5B');
          else if (existing.programOption === 'DP 50%' || existing.programOption === 'BERTAHAP_50_3B') setSkemaPembayaran('BERTAHAP_50_3B');
          else if (existing.programOption === 'DP 30%' || existing.programOption === 'BERTAHAP_30_6B') setSkemaPembayaran('BERTAHAP_30_6B');
          else setSkemaPembayaran('CASH_LUNAS');
        }

        if (existing.tenorBulan) {
          setTenorPilihan(existing.tenorBulan);
        }

        if (existing.metodePembayaranLpk) {
          setMetodePembayaranLpk(existing.metodePembayaranLpk);
        }

        if (existing.rekeningTujuanLpk) {
          setRekeningTujuan(existing.rekeningTujuanLpk);
        }

        setGuarantorData({
          namaPenjamin: existing.namaPenjamin || activeStudent.namaAyah || 'Suharto Sitorus',
          ktpPenjamin: existing.ktpPenjamin || activeStudent.ktpNpwpAyah || '3271040101700003',
          npwpPenjamin: existing.npwpPenjamin || '12.345.678.9-012.000',
          pekerjaanPenjamin: existing.pekerjaanPenjamin || 'Wiraswasta',
          hubunganPenjamin: existing.hubunganPenjamin || 'Orang Tua',
          alamatPenjamin: existing.alamatPenjamin || activeStudent.alamatDomisili,
          noHpPenjamin: existing.noHpPenjamin || activeStudent.noHp
        });
        setNamaPeserta(existing.namaSiswa || activeStudent.namaLengkap);
        setNamaFinance(existing.namaFinance || 'Finance LPK IJEF CORP');

        setDocMeta({
          nomorRegistrasi: existing.nomorRegistrasi || `BIAYA-LPK/${new Date().getFullYear()}/${activeStudent.id}`,
          kopNamaLpk: existing.kopNamaLpk || 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
          kopSubJudul: existing.kopSubJudul || 'Lembaga Pelatihan Kerja Terakreditasi & Pusat Pengembangan SDM Jepang (Disnaker No. 560/LPK-IJEF/2024)',
          kopAlamat: existing.kopAlamat || 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Telp: (021) 8899-7766 | Email: info@ijefcorp.co.id',
          judulForm: existing.judulForm || 'FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK',
          teksKetentuan: existing.teksKetentuan || 'Dengan ini menyatakan mendaftar dan menyetujui rincian biaya pelatihan pendidikan Bahasa Jepang dan Keterampilan Kerja di LPK IJEF CORP. Calon siswa dan Penjamin berjanji mematuhi jadwal termin pembayaran, tata tertib asrama/pendidikan, serta kewajiban kedisiplinan selama mengikuti seluruh tahapan pelatihan.',
          penandatangan1Jabatan: existing.penandatangan1Jabatan || 'Calon Siswa Pelatihan',
          penandatangan2Jabatan: existing.penandatangan2Jabatan || 'Orang Tua / Penjamin Biaya',
          penandatangan3Jabatan: 'Bagian Keuangan / Finance LPK'
        });

        // Restore term statuses
        if (existing.jadwalTerminPelatihan && Array.isArray(existing.jadwalTerminPelatihan)) {
          const statuses: Record<number, 'LUNAS' | 'PROSES' | 'BELUM'> = {};
          existing.jadwalTerminPelatihan.forEach((t) => {
            statuses[t.terminKe] = t.statusBayar;
          });
          setTermStatusList(statuses);
        }
      } else {
        // Defaults for new active student
        const defaultPkg = TRAINING_PACKAGES_LPK[0];
        setSelectedPackageId(defaultPkg.id);
        setCustomCost(defaultPkg.biayaStandar);
        setSkemaPembayaran('CASH_LUNAS');
        setTenorPilihan(defaultPkg.durasiBulan);

        setGuarantorData({
          namaPenjamin: activeStudent.namaAyah || 'Suharto Sitorus',
          ktpPenjamin: activeStudent.ktpNpwpAyah || '3271040101700003',
          npwpPenjamin: '12.345.678.9-012.000',
          pekerjaanPenjamin: (activeStudent.pekerjaanAyah?.includes('Wiraswasta') ? 'Wiraswasta' : 'Karyawan Tetap') as JobType,
          hubunganPenjamin: 'Orang Tua',
          alamatPenjamin: activeStudent.alamatDomisili,
          noHpPenjamin: activeStudent.noHp
        });
        setNamaPeserta(activeStudent.namaLengkap);
        setNamaFinance('Finance LPK IJEF CORP');

        setDocMeta({
          nomorRegistrasi: `BIAYA-LPK/${new Date().getFullYear()}/${activeStudent.id}`,
          kopNamaLpk: 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
          kopSubJudul: 'Lembaga Pelatihan Kerja Terakreditasi & Pusat Pengembangan SDM Jepang (Disnaker No. 560/LPK-IJEF/2024)',
          kopAlamat: 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Telp: (021) 8899-7766 | Email: info@ijefcorp.co.id',
          judulForm: 'FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK',
          teksKetentuan: 'Dengan ini menyatakan mendaftar dan menyetujui rincian biaya pelatihan pendidikan Bahasa Jepang dan Keterampilan Kerja di LPK IJEF CORP. Calon siswa dan Penjamin berjanji mematuhi jadwal termin pembayaran, tata tertib asrama/pendidikan, serta kewajiban kedisiplinan selama mengikuti seluruh tahapan pelatihan.',
          penandatangan1Jabatan: 'Calon Siswa Pelatihan',
          penandatangan2Jabatan: 'Orang Tua / Penjamin Biaya',
          penandatangan3Jabatan: 'Bagian Keuangan / Finance LPK'
        });
      }
    }
  }, [
    activeStudent?.id,
    financingRecords[activeStudent?.id || '']?.id,
    (financingRecords[activeStudent?.id || ''] as any)?.updatedAt,
    financingRecords[activeStudent?.id || '']?.statusPersetujuan
  ]);

  const handleFormTitleChange = (newTitle: string) => {
    let newKetentuan = docMeta.teksKetentuan;
    if (newTitle.includes('DANA TALANGAN')) {
      newKetentuan = 'Menyatakan memilih skema Pembiayaan Dana Talangan 100% untuk biaya keberangkatan dan pelatihan. Siswa dan Penjamin menyetujui pemotongan gaji secara bertahap saat bekerja di perusahaan Jepang sesuai ketentuan LPK IJEF CORP.';
    } else if (newTitle.includes('ANGGARAN') || newTitle.includes('ESTIMASI')) {
      newKetentuan = 'Rincian anggaran biaya pendidikan, asrama, sertifikasi, dan dokumen keberangkatan Jepang yang telah diverifikasi dan disetujui oleh manajemen keuangan LPK IJEF CORP dan pihak keluarga peserta.';
    } else if (newTitle.includes('MANDIRI') || newTitle.includes('CASH')) {
      newKetentuan = 'Menyatakan kesanggupan untuk melunasi seluruh biaya pelatihan dan pemberangkatan secara mandiri (Cash / Tunai) sesuai dengan jadwal termin pembayaran yang ditetapkan oleh bagian keuangan LPK IJEF CORP.';
    } else {
      newKetentuan = 'Dengan ini menyatakan mendaftar dan menyetujui rincian biaya pelatihan pendidikan Bahasa Jepang dan Keterampilan Kerja di LPK IJEF CORP. Calon siswa dan Penjamin berjanji mematuhi jadwal termin pembayaran, tata tertib asrama/pendidikan, serta kewajiban kedisiplinan selama mengikuti seluruh tahapan pelatihan.';
    }

    setDocMeta({
      ...docMeta,
      judulForm: newTitle,
      teksKetentuan: newKetentuan
    });
  };

  // Handle Package Selection
  const handleSelectPackage = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    const target = TRAINING_PACKAGES_LPK.find((p) => p.id === pkgId);
    if (target) {
      setCustomCost(target.biayaStandar);
      setToastMessage(`Paket Pelatihan diubah ke: ${target.namaPaket} (Biaya: ${formatRupiah(target.biayaStandar)})`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Perform Calculation
  const trainingSim = calculateTrainingFinancing(customCost, skemaPembayaran, tenorPilihan, selectedPackageId);
  const activePackage = trainingSim.packageInfo || TRAINING_PACKAGES_LPK[0];

  // Apply manual term status overrides
  const enrichedTermSchedule: TrainingTermScheduleItem[] = trainingSim.jadwalTermin.map((term) => ({
    ...term,
    statusBayar: termStatusList[term.terminKe] || term.statusBayar
  }));

  // Toggle Term Status
  const handleToggleTermStatus = (terminKe: number) => {
    const current = termStatusList[terminKe] || 'BELUM';
    const next: 'LUNAS' | 'PROSES' | 'BELUM' = current === 'BELUM' ? 'PROSES' : current === 'PROSES' ? 'LUNAS' : 'BELUM';
    setTermStatusList((prev) => ({
      ...prev,
      [terminKe]: next
    }));
    setToastMessage(`Status Termin ${terminKe} diperbarui menjadi: ${next}`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Save handler
  const handleSave = () => {
    if (!activeStudent) {
      alert('Silakan pilih calon siswa terlebih dahulu!');
      return;
    }

    // Map skema to legacy programOption for compatibility
    let legacyProgramOption = 'Reguler 100%';
    if (skemaPembayaran === 'CASH_LUNAS') legacyProgramOption = 'Reguler 100%';
    else if (skemaPembayaran === 'DT_100_6B') legacyProgramOption = 'DT 100%';
    else if (skemaPembayaran === 'DT_50_5B') legacyProgramOption = 'DT 50%';
    else if (skemaPembayaran === 'BERTAHAP_50_3B') legacyProgramOption = 'DP 50%';
    else if (skemaPembayaran === 'BERTAHAP_30_6B') legacyProgramOption = 'DP 30%';

    const newRecord: AplikasiDukunganDana = {
      id: financingRecords[activeStudent.id]?.id || `DANA-LPK-${Date.now()}`,
      siswaId: activeStudent.id,
      namaSiswa: namaPeserta,

      // Penjamin
      namaPenjamin: guarantorData.namaPenjamin,
      ktpPenjamin: guarantorData.ktpPenjamin,
      npwpPenjamin: guarantorData.npwpPenjamin,
      pekerjaanPenjamin: guarantorData.pekerjaanPenjamin,
      hubunganPenjamin: guarantorData.hubunganPenjamin,
      alamatPenjamin: guarantorData.alamatPenjamin,
      noHpPenjamin: guarantorData.noHpPenjamin,

      // Standard / Legacy compatibility
      programOption: legacyProgramOption,
      biayaTotal: trainingSim.biayaTotal,
      uangMukaDp: trainingSim.uangMukaDp,
      plafondPinjaman: trainingSim.totalKewajibanCicilan,
      tenorBulan: trainingSim.tenorBulan,
      angsuranPerBulan: trainingSim.angsuranPerBulan,
      tanggalPengajuan: new Date().toISOString().split('T')[0],

      statusPersetujuan: financingRecords[activeStudent.id]?.statusPersetujuan || 'VERIFIKASI_ADMIN',
      currentApprovalStage: 'ADMIN',

      // Document formatting
      nomorRegistrasi: docMeta.nomorRegistrasi,
      kopNamaLpk: docMeta.kopNamaLpk,
      kopSubJudul: docMeta.kopSubJudul,
      kopAlamat: docMeta.kopAlamat,
      judulForm: docMeta.judulForm,
      teksKetentuan: docMeta.teksKetentuan,
      penandatangan1Jabatan: docMeta.penandatangan1Jabatan,
      penandatangan2Jabatan: docMeta.penandatangan2Jabatan,

      // LPK Training Specific
      paketPelatihanId: selectedPackageId,
      namaPaketPelatihan: activePackage.namaPaket,
      durasiPelatihanBulan: activePackage.durasiBulan,
      skemaPembayaranPelatihan: skemaPembayaran,
      skemaLabel: trainingSim.skemaLabel,
      pokokCicilan: trainingSim.pokokCicilan,
      persentaseBunga: trainingSim.persentaseBunga,
      nominalBunga: trainingSim.nominalBunga,
      totalKewajibanCicilan: trainingSim.totalKewajibanCicilan,
      totalBiayaDanBunga: trainingSim.totalBiayaDanBunga,
      diskonPelatihan: trainingSim.diskonPotongan,
      komponenBiayaPelatihan: trainingSim.komponenBiaya,
      jadwalTerminPelatihan: enrichedTermSchedule,
      metodePembayaranLpk: metodePembayaranLpk,
      rekeningTujuanLpk: rekeningTujuan,
      namaFinance: namaFinance
    };

    saveFinancingRecord(newRecord);
    setToastMessage(`✓ Biaya Pelatihan LPK untuk ${activeStudent.namaLengkap} berhasil disimpan & disinkronkan!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!activeStudent) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-500 space-y-4">
        <GraduationCap className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-700">{tr.noStudentSelectedTitle}</h3>
        <p className="text-xs">{tr.noStudentSelectedDesc}</p>
      </div>
    );
  }

  const activePackageDisplay = isJa && PACKAGE_TRANSLATIONS[activePackage.id]
    ? {
        ...activePackage,
        namaPaket: PACKAGE_TRANSLATIONS[activePackage.id].nama,
        deskripsi: PACKAGE_TRANSLATIONS[activePackage.id].deskripsi
      }
    : activePackage;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Unified Single Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 font-sans">
        {/* Main Row: Header Info, Candidate Selector, Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Title & Icon */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center border border-indigo-300 shrink-0">
              <GraduationCap className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {tr.title}
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-300 font-mono">
                  {tr.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {tr.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Candidate Selector Dropdown */}
            <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
              <User className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-slate-700 shrink-0">{tr.studentLabel}</span>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
              >
                <option value="" disabled>{tr.selectStudentPlaceholder}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.namaLengkap} ({s.id}) [{s.kategoriKandidat || 'SISWA IJEF'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDirectEditMode(!directEditMode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
                  directEditMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 ring-2 ring-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title="Toggle Direct Edit Mode"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{directEditMode ? tr.editModeActive : tr.editModeInactive}</span>
              </button>

              <button
                onClick={() => printDocumentElement('pdf-dukungan-dana')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{tr.printBtn}</span>
              </button>

              <button
                onClick={() =>
                  generatePdfFromElement(
                    'pdf-dukungan-dana',
                    `Form_Biaya_Pelatihan_LPK_${activeStudent.namaLengkap}`
                  )
                }
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr.downloadPdfBtn}</span>
              </button>

              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr.saveBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Training Package & Status Ribbon */}
        <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">{activeStudent.namaLengkap}</span>
            <span className="font-mono text-[10px] bg-indigo-200/80 text-indigo-900 font-bold px-1.5 py-0.5 rounded">
              {activeStudent.id}
            </span>
            <span className="text-slate-600 text-[11px] bg-white border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              {activeStudent.kategoriKandidat || 'SISWA IJEF - Offline'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-indigo-900">
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{tr.programLabel}</span>
              <strong className="font-bold text-slate-900">{activePackageDisplay.namaPaket}</strong>
            </div>
            <span className="font-mono text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
              {tr.totalCost}: {formatRupiah(trainingSim.biayaTotal)}
            </span>
            <span className="font-mono text-indigo-800 font-semibold bg-indigo-100/90 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
              {trainingSim.jadwalTermin.length} {tr.paymentStages}
            </span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Control Panel vs Right Printable Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Structured Control Editor Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            {/* Tab Navigation */}
            <div className="grid grid-cols-5 bg-slate-100 border-b border-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-600">
              <button
                onClick={() => setActiveTabPanel('simulasi')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeTabPanel === 'simulasi'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{tr.tabSimulasi}</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('termin')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeTabPanel === 'termin'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{tr.tabTermin}</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('identitas')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeTabPanel === 'identitas'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{tr.tabPenjamin}</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('kop')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 border-r border-slate-200 cursor-pointer ${
                  activeTabPanel === 'kop'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>{tr.tabKop}</span>
              </button>

              <button
                onClick={() => setActiveTabPanel('ketentuan')}
                className={`py-2.5 px-1 text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeTabPanel === 'ketentuan'
                    ? 'bg-white text-indigo-700 border-b-2 border-b-indigo-600 font-black'
                    : 'hover:bg-slate-200/70'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{tr.tabKetentuan}</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* TAB 1: SIMULASI BIAYA PELATIHAN LPK */}
              {activeTabPanel === 'simulasi' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>{tr.packageHeader}</span>
                    </div>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      {tr.badge}
                    </span>
                  </div>

                  {/* Program Package Cards */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold text-xs">{tr.packageSelectLabel}</label>
                    <div className="grid grid-cols-1 gap-2">
                      {TRAINING_PACKAGES_LPK.map((pkg) => {
                        const isSelected = selectedPackageId === pkg.id;
                        const pkgTrans = isJa && PACKAGE_TRANSLATIONS[pkg.id] ? PACKAGE_TRANSLATIONS[pkg.id] : null;
                        const pkgTitle = pkgTrans ? pkgTrans.nama : pkg.namaPaket;
                        const pkgDesc = pkgTrans ? pkgTrans.deskripsi : pkg.deskripsi;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => handleSelectPackage(pkg.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                                  <h4 className="font-bold text-slate-900 text-xs">{pkgTitle}</h4>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug pl-3.5">{pkgDesc}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-indigo-900 font-mono block">
                                  {formatRupiah(pkg.biayaStandar)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {pkg.durasiBulan} {isJa ? 'ヶ月' : 'Bulan'} ({pkg.jamPelajaran} {isJa ? '時間' : 'Jam'})
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Cost Input & Preset */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-bold text-xs flex items-center space-x-1">
                        <Coins className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{tr.totalCostLabel}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const target = TRAINING_PACKAGES_LPK.find((p) => p.id === selectedPackageId);
                          if (target) setCustomCost(target.biayaStandar);
                        }}
                        className="text-[10px] text-indigo-600 hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{tr.resetToStandard}</span>
                      </button>
                    </div>

                    <input
                      type="number"
                      step={500000}
                      value={customCost}
                      onChange={(e) => setCustomCost(Number(e.target.value))}
                      className="w-full bg-white text-slate-900 px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[1000000, 2500000, 3000000, 10000000].map((nominal) => (
                        <button
                          key={nominal}
                          type="button"
                          onClick={() => setCustomCost(nominal)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer ${
                            customCost === nominal
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {nominal === 1000000 ? (isJa ? '100万 (面接突破)' : '1 Jt (Mensetsu)') : nominal === 2500000 ? (isJa ? '250万 (特定技能)' : '2.5 Jt (SSW)') : nominal === 3000000 ? (isJa ? '300万 (オンライン)' : '3 Jt (Online)') : (isJa ? '1,000万 (通常対面)' : '10 Jt (Reguler)')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method / Scheme Selection */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold text-xs flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{tr.paymentSchemeLabel}</span>
                    </label>
                    <select
                      value={skemaPembayaran}
                      onChange={(e) => setSkemaPembayaran(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 font-bold px-3 py-2 rounded-lg border border-slate-300 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {PAYMENT_SCHEMES_LPK.map((sch) => {
                        const schLabel = isJa && SCHEME_TRANSLATIONS[sch.id] ? SCHEME_TRANSLATIONS[sch.id].label : sch.label;
                        return (
                          <option key={sch.id} value={sch.id}>
                            {schLabel} {sch.bungaPersen > 0 ? `— [${isJa ? '金利' : 'Bunga'} ${sch.bungaPersen}%]` : `— [${isJa ? '無金利 0%' : 'Bunga 0%'}]`}
                          </option>
                        );
                      })}
                    </select>

                    {/* Scheme Highlight Detail Badge */}
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-indigo-950 font-bold">
                        <span className="flex items-center space-x-1">
                          <Percent className="w-3 h-3 text-indigo-600" />
                          <span>{tr.schemeInterestRate}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-black ${
                          trainingSim.persentaseBunga > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {trainingSim.persentaseBunga}% {trainingSim.persentaseBunga > 0 ? `(+ ${formatRupiah(trainingSim.nominalBunga)})` : tr.interestFree}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1 border-t border-indigo-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">{tr.downPaymentDp}</span>
                          <strong className="text-emerald-700 font-mono">{formatRupiah(trainingSim.uangMukaDp)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">{tr.installmentPrincipal}</span>
                          <strong className="text-indigo-900 font-mono">{formatRupiah(trainingSim.pokokCicilan)}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">{tr.tenorAndInstallment}</span>
                          <strong className="text-slate-900 font-mono">
                            {trainingSim.tenorBulan > 0 ? `${trainingSim.tenorBulan} ${isJa ? 'ヶ月' : 'Bln'} (${formatRupiah(trainingSim.angsuranPerBulan)}/${isJa ? '月' : 'bln'})` : tr.earlySettlement}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">{tr.totalInstallmentObligation}</span>
                          <strong className="text-amber-800 font-mono font-black">{formatRupiah(trainingSim.totalKewajibanCicilan)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Card */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5 font-sans border border-slate-800 shadow-md">
                    <div className="flex justify-between items-center text-slate-300 text-[11px]">
                      <span>{tr.summaryStandardCost}</span>
                      <span className="font-mono font-bold text-white">{formatRupiah(trainingSim.biayaTotal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5 text-[11px]">
                      <span>{tr.summaryDownPayment}</span>
                      <span className="font-mono font-bold text-emerald-400">{formatRupiah(trainingSim.uangMukaDp)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5 text-[11px]">
                      <span>{tr.summaryFinancingPrincipal}</span>
                      <span className="font-mono font-bold text-slate-200">{formatRupiah(trainingSim.pokokCicilan)}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-1.5 text-[11px]">
                      <span>{tr.summaryInterestCalculation} ({trainingSim.persentaseBunga}%):</span>
                      <span className={`font-mono font-bold ${trainingSim.nominalBunga > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {trainingSim.nominalBunga > 0 ? `+ ${formatRupiah(trainingSim.nominalBunga)}` : `Rp 0 (${isJa ? '無金利 0%' : '0%'})`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-1.5 text-[11px]">
                      <span>{tr.totalInstallmentObligation} ({trainingSim.tenorBulan}x):</span>
                      <span className="font-mono font-bold text-amber-300">{formatRupiah(trainingSim.totalKewajibanCicilan)}</span>
                    </div>

                    {trainingSim.angsuranPerBulan > 0 && (
                      <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-1.5 text-[11px]">
                        <span>{tr.summaryMonthlyInstallment} ({trainingSim.tenorBulan} {isJa ? 'ヶ月' : 'Bulan'}):</span>
                        <span className="font-mono font-bold text-indigo-300">{formatRupiah(trainingSim.angsuranPerBulan)} / {isJa ? '月' : 'bulan'}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-100 border-t-2 border-slate-700 pt-2 text-xs">
                      <span className="font-bold">{tr.summaryGrandTotal}</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {formatRupiah(trainingSim.totalBiayaDanBunga)}
                      </span>
                    </div>
                  </div>

                  {/* Rekening Tujuan LPK */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-slate-700 font-bold text-xs flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{tr.officialAccountLabel}</span>
                    </label>
                    <select
                      value={rekeningTujuan}
                      onChange={(e) => setRekeningTujuan(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 font-medium px-3 py-1.5 rounded border border-slate-300 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="Bank Mandiri: 123-00-998877-1 a.n. LPK IJEF CORP">Bank Mandiri: 123-00-998877-1 a.n. LPK IJEF CORP</option>
                      <option value="Bank BCA: 887-019283-0 a.n. LPK IJEF CORP">Bank BCA: 887-019283-0 a.n. LPK IJEF CORP</option>
                      <option value="Bank BNI: 098-765432-1 a.n. LPK IJEF CORP">Bank BNI: 098-765432-1 a.n. LPK IJEF CORP</option>
                      <option value="Kasir LPK: Pembayaran Tunai di Kantor Graha IJEF">Kasir LPK: Pembayaran Tunai di Kantor Graha IJEF</option>
                      <option value="Virtual Account: 88001 + NIK Siswa">Virtual Account Otomatis (VA Siswa)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 2: TERMIN & JADWAL ANGSURAN */}
              {activeTabPanel === 'termin' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>{tr.termScheduleHeader}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      {enrichedTermSchedule.length} {tr.paymentStages}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {tr.termScheduleDesc}
                  </p>

                  <div className="space-y-2.5">
                    {enrichedTermSchedule.map((term) => {
                      const isLunas = term.statusBayar === 'LUNAS';
                      const isProses = term.statusBayar === 'PROSES';

                      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
                      if (isLunas) badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                      if (isProses) badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';

                      const displayStatus = isJa
                        ? (term.statusBayar === 'LUNAS' ? '完納 (Lunas)' : term.statusBayar === 'PROSES' ? '処理中 (Proses)' : '未納 (Belum)')
                        : term.statusBayar;

                      const termLabel = isJa
                        ? (term.terminKe === 1 ? '第1期 (頭金・登録時)' : term.terminKe === 2 ? '第2期 (研修第2期分)' : term.terminKe === 3 ? '第3期 (研修第3期分)' : `第${term.terminKe}期分割分`)
                        : term.labelTermin;

                      const termSchedule = isJa
                        ? (term.jadwalWaktu.includes('Pendaftaran') || term.jadwalWaktu.includes('Bulan 1') ? '登録時 / 第1ヶ月目' : term.jadwalWaktu.includes('Bulan 2') ? '第2ヶ月目' : term.jadwalWaktu.includes('Bulan 3') ? '第3ヶ月目' : term.jadwalWaktu.includes('Bulan 4') ? '第4ヶ月目' : term.jadwalWaktu.includes('Bulan 5') ? '第5ヶ月目' : term.jadwalWaktu.includes('Bulan 6') ? '第6ヶ月目' : term.jadwalWaktu.includes('Setelah Kerja') || term.jadwalWaktu.includes('Potong Gaji') ? '就労後給与控除' : term.jadwalWaktu)
                        : term.jadwalWaktu;

                      const termDesc = isJa
                        ? (term.keterangan.includes('DP') || term.keterangan.includes('pendaftaran') ? '登録時頭金および初期教材費用' : term.keterangan.includes('pelunasan') ? '最終修了時完納分' : term.keterangan.includes('Potong gaji') ? '日本での就業後給与より控除' : '期中分割納入分')
                        : term.keterangan;

                      return (
                        <div
                          key={term.terminKe}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                                {term.terminKe}
                              </span>
                              <strong className="text-slate-900 font-bold">{termLabel}</strong>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleTermStatus(term.terminKe)}
                              className={`text-[10px] px-2.5 py-1 rounded-md border transition cursor-pointer flex items-center space-x-1 ${badgeColor}`}
                              title="Toggle status"
                            >
                              {isLunas && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                              {isProses && <Clock className="w-3 h-3 text-amber-600" />}
                              <span>{tr.termStatus} {displayStatus}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                            <div>
                              <span className="text-slate-500 block text-[10px]">{tr.termDueDate}</span>
                              <span className="font-semibold text-slate-800">{termSchedule}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 block text-[10px]">{tr.termAmount} ({term.persentase}%):</span>
                              <span className="font-mono font-bold text-indigo-700">{formatRupiah(term.nominal)}</span>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-500 italic">{termDesc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: DATA PENJAMIN (GUARANTOR) */}
              {activeTabPanel === 'identitas' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>{tr.guarantorHeader}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorName}</label>
                    <input
                      type="text"
                      value={guarantorData.namaPenjamin}
                      onChange={(e) => setGuarantorData({ ...guarantorData, namaPenjamin: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorKtp}</label>
                      <input
                        type="text"
                        value={guarantorData.ktpPenjamin}
                        onChange={(e) => setGuarantorData({ ...guarantorData, ktpPenjamin: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-mono focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorNpwp}</label>
                      <input
                        type="text"
                        value={guarantorData.npwpPenjamin}
                        onChange={(e) => setGuarantorData({ ...guarantorData, npwpPenjamin: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-mono focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorJob}</label>
                      <select
                        value={guarantorData.pekerjaanPenjamin}
                        onChange={(e) => setGuarantorData({ ...guarantorData, pekerjaanPenjamin: e.target.value as JobType })}
                        className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white"
                      >
                        <option value="Wiraswasta">{isJa ? '自営業 / 商業' : 'Wiraswasta / Pedagang'}</option>
                        <option value="Karyawan Tetap">{isJa ? '会社員 (正社員)' : 'Karyawan Swasta'}</option>
                        <option value="Pensiunan">{isJa ? '年金受給者 / 退職者' : 'Pensiunan'}</option>
                        <option value="PNS">{isJa ? '公務員 (PNS/ASN)' : 'PNS / ASN'}</option>
                        <option value="Petani/Nelayan">{isJa ? '農業 / 漁業' : 'Petani / Nelayan'}</option>
                        <option value="Lainnya">{isJa ? 'その他' : 'Lainnya'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorRelation}</label>
                      <select
                        value={guarantorData.hubunganPenjamin}
                        onChange={(e) => setGuarantorData({ ...guarantorData, hubunganPenjamin: e.target.value as any })}
                        className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white"
                      >
                        <option value="Orang Tua">{isJa ? '実親 / 両親' : 'Orang Tua Kandung'}</option>
                        <option value="Wali">{isJa ? '法定後見人 / 保証人' : 'Wali Legal'}</option>
                        <option value="Kerabat">{isJa ? '近親者 / 親戚' : 'Kerabat Dekat'}</option>
                        <option value="Suami/Istri">{isJa ? '配偶者 (夫/妻)' : 'Suami / Istri'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorAddress}</label>
                    <textarea
                      rows={2}
                      value={guarantorData.alamatPenjamin}
                      onChange={(e) => setGuarantorData({ ...guarantorData, alamatPenjamin: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.guarantorPhone}</label>
                    <input
                      type="text"
                      value={guarantorData.noHpPenjamin}
                      onChange={(e) => setGuarantorData({ ...guarantorData, noHpPenjamin: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-mono focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: KOP SURAT & FORMAT HEADER */}
              {activeTabPanel === 'kop' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <Layout className="w-4 h-4 text-indigo-600" />
                    <span>{tr.kopHeader}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.kopRegNumber}</label>
                    <input
                      type="text"
                      value={docMeta.nomorRegistrasi}
                      onChange={(e) => setDocMeta({ ...docMeta, nomorRegistrasi: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.kopLpkName}</label>
                    <input
                      type="text"
                      value={docMeta.kopNamaLpk}
                      onChange={(e) => setDocMeta({ ...docMeta, kopNamaLpk: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.kopSubTitle}</label>
                    <input
                      type="text"
                      value={docMeta.kopSubJudul}
                      onChange={(e) => setDocMeta({ ...docMeta, kopSubJudul: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.kopAddress}</label>
                    <textarea
                      rows={2}
                      value={docMeta.kopAlamat}
                      onChange={(e) => setDocMeta({ ...docMeta, kopAlamat: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">{tr.kopFormTitle} (Pilih Template)</label>
                      <button
                        type="button"
                        onClick={() => setDocMeta({ ...docMeta, judulForm: '' })}
                        className="text-[10px] text-red-600 hover:text-red-700 underline font-medium cursor-pointer"
                      >
                        Hapus Judul
                      </button>
                    </div>
                    <select
                      value={docMeta.judulForm || ''}
                      onChange={(e) => handleFormTitleChange(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-2 rounded border border-slate-300 font-bold focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer mb-2"
                    >
                      <option value="FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK">FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK</option>
                      <option value="FORMULIR KESEPAKATAN PEMBIAYAAN DANA TALANGAN & CICILAN LPK">FORMULIR KESEPAKATAN PEMBIAYAAN DANA TALANGAN & CICILAN LPK</option>
                      <option value="SURAT PERNYATAAN ANGGARAN & ESTIMASI BIAYA PENDIDIKAN JEPANG">SURAT PERNYATAAN ANGGARAN & ESTIMASI BIAYA PENDIDIKAN JEPANG</option>
                      <option value="FORMULIR KESANGGUPAN PELUNASAN BIAYA MANDIRI (CASH / TUNAI)">FORMULIR KESANGGUPAN PELUNASAN BIAYA MANDIRI (CASH / TUNAI)</option>
                    </select>

                    <label className="block text-xs font-semibold text-slate-600 mb-1">Atau Edit / Ketik Judul Baru Kustom:</label>
                    <input
                      type="text"
                      value={docMeta.judulForm || ''}
                      onChange={(e) => setDocMeta({ ...docMeta, judulForm: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 font-bold text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                      placeholder="Ketik judul formulir baru di sini..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: KETENTUAN & TANDA TANGAN */}
              {activeTabPanel === 'ketentuan' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center space-x-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    <span>{tr.termsHeader}</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.termsTextLabel}</label>
                    <textarea
                      rows={4}
                      value={docMeta.teksKetentuan}
                      onChange={(e) => setDocMeta({ ...docMeta, teksKetentuan: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.signer1Label}</label>
                    <input
                      type="text"
                      value={docMeta.penandatangan1Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan1Jabatan: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.signer2Label}</label>
                    <input
                      type="text"
                      value={docMeta.penandatangan2Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan2Jabatan: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{tr.signer3Label}</label>
                    <input
                      type="text"
                      value={docMeta.penandatangan3Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan3Jabatan: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 px-3 py-1.5 rounded border border-slate-300 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 7 cols: Interactive Printable Paper Document Preview */}
        <div className="lg:col-span-7">
          <div className="bg-slate-200 p-3 sm:p-5 rounded-xl border border-slate-300 shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
              <span className="flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-indigo-700" />
                <span>{tr.previewTitle}</span>
              </span>
              {directEditMode && (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 text-[10px] font-bold font-mono">
                  {tr.editModeDocActive}
                </span>
              )}
            </div>

            {/* PRINTABLE PDF CONTAINER */}
            <div
              id="pdf-dukungan-dana"
              className="bg-white text-slate-900 p-6 sm:p-8 rounded shadow-lg border border-slate-300 max-w-full font-serif text-[12px] leading-relaxed space-y-5"
            >
              {/* Kop Surat / Header Resmi LPK */}
              <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-11 h-11 bg-slate-900 text-white rounded font-sans font-bold flex items-center justify-center text-base shrink-0">
                    IJEF
                  </div>
                  <div className="flex-grow">
                    {directEditMode ? (
                      <input
                        type="text"
                        value={docMeta.kopNamaLpk}
                        onChange={(e) => setDocMeta({ ...docMeta, kopNamaLpk: e.target.value })}
                        className="w-full text-center font-sans font-bold text-base uppercase tracking-wider text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                      />
                    ) : (
                      <h1 className="font-sans font-bold text-base uppercase tracking-wider text-slate-900">
                        {docMeta.kopNamaLpk}
                      </h1>
                    )}

                    {directEditMode ? (
                      <input
                        type="text"
                        value={docMeta.kopSubJudul}
                        onChange={(e) => setDocMeta({ ...docMeta, kopSubJudul: e.target.value })}
                        className="w-full text-center font-sans text-[10px] text-slate-600 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mt-0.5"
                      />
                    ) : (
                      <p className="font-sans text-[10px] text-slate-600 font-semibold">
                        {docMeta.kopSubJudul}
                      </p>
                    )}
                  </div>
                </div>

                {directEditMode ? (
                  <input
                    type="text"
                    value={docMeta.kopAlamat}
                    onChange={(e) => setDocMeta({ ...docMeta, kopAlamat: e.target.value })}
                    className="w-full text-center font-sans text-[9px] text-slate-500 border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mt-1"
                  />
                ) : (
                  <p className="font-sans text-[9px] text-slate-500">
                    {docMeta.kopAlamat}
                  </p>
                )}
              </div>

              {/* Title Form */}
              <div className="text-center font-sans space-y-1">
                {directEditMode ? (
                  <div className="space-y-1.5">
                    <select
                      value={docMeta.judulForm || ''}
                      onChange={(e) => handleFormTitleChange(e.target.value)}
                      className="w-full text-center font-bold text-xs uppercase tracking-wide border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded cursor-pointer"
                    >
                      <option value="FORMULIR PERNYATAAN & RINCIAN BIAYA PELATIHAN SISWA LPK">Template: Biaya Pelatihan</option>
                      <option value="FORMULIR KESEPAKATAN PEMBIAYAAN DANA TALANGAN & CICILAN LPK">Template: Dana Talangan</option>
                      <option value="SURAT PERNYATAAN ANGGARAN & ESTIMASI BIAYA PENDIDIKAN JEPANG">Template: Estimasi Biaya</option>
                      <option value="FORMULIR KESANGGUPAN PELUNASAN BIAYA MANDIRI (CASH / TUNAI)">Template: Biaya Mandiri</option>
                    </select>
                    <input
                      type="text"
                      value={docMeta.judulForm || ''}
                      onChange={(e) => setDocMeta({ ...docMeta, judulForm: e.target.value })}
                      className="w-full text-center font-bold text-sm uppercase underline tracking-wide border border-dashed border-amber-400 bg-amber-50/50 p-1.5 rounded"
                      placeholder="Atau ketik judul formulir baru..."
                    />
                  </div>
                ) : (
                  <h2 className="font-bold text-sm uppercase tracking-wide underline">
                    {docMeta.judulForm}
                  </h2>
                )}

                <div className="text-[10px] font-mono text-slate-700 flex items-center justify-center space-x-1">
                  <span>{tr.docRegNo}</span>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={docMeta.nomorRegistrasi}
                      onChange={(e) => setDocMeta({ ...docMeta, nomorRegistrasi: e.target.value })}
                      className="font-mono font-bold text-slate-900 border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                    />
                  ) : (
                    <span className="font-bold">{docMeta.nomorRegistrasi}</span>
                  )}
                </div>
              </div>

              {/* Section 1: Data Calon Siswa */}
              <div className="font-sans space-y-1">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-slate-800">
                  {tr.sec1Title}
                </div>
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="w-40 font-semibold py-0.5">{tr.sec1StudentName}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={namaPeserta}
                            onChange={(e) => setNamaPeserta(e.target.value)}
                            className="font-bold border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded w-full"
                          />
                        ) : (
                          <span>: <strong className="font-bold text-slate-900">{namaPeserta}</strong></span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec1StudentId}</td>
                      <td className="font-mono">: {activeStudent.noKtp}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec1RegCategory}</td>
                      <td>: <span className="font-bold text-indigo-900">{activeStudent.kategoriKandidat || 'SISWA IJEF - Offline'}</span></td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec1JobInterest}</td>
                      <td>: {activeStudent.programMinat || 'Kaigo / Tokutei Ginou'}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec1Address}</td>
                      <td>: {activeStudent.alamatDomisili}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec1Phone}</td>
                      <td>: {activeStudent.noHp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 2: Data Orang Tua / Penjamin */}
              <div className="font-sans space-y-1">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-slate-800">
                  {tr.sec2Title}
                </div>
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="w-40 font-semibold py-0.5">{tr.sec2GuarantorName}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={guarantorData.namaPenjamin}
                            onChange={(e) => setGuarantorData({ ...guarantorData, namaPenjamin: e.target.value })}
                            className="font-bold border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span>: <strong className="font-bold text-slate-900">{guarantorData.namaPenjamin}</strong></span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec2GuarantorKtp}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={guarantorData.ktpPenjamin}
                            onChange={(e) => setGuarantorData({ ...guarantorData, ktpPenjamin: e.target.value })}
                            className="font-mono border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span className="font-mono">: {guarantorData.ktpPenjamin}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec2GuarantorNpwp}</td>
                      <td>
                        {directEditMode ? (
                          <input
                            type="text"
                            value={guarantorData.npwpPenjamin}
                            onChange={(e) => setGuarantorData({ ...guarantorData, npwpPenjamin: e.target.value })}
                            className="font-mono border border-dashed border-amber-400 bg-amber-50/50 px-1 rounded"
                          />
                        ) : (
                          <span className="font-mono">: {guarantorData.npwpPenjamin}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec2GuarantorJob}</td>
                      <td>: {guarantorData.pekerjaanPenjamin}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec2GuarantorRelation}</td>
                      <td>: {guarantorData.hubunganPenjamin}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold py-0.5">{tr.sec2GuarantorContact}</td>
                      <td>: {guarantorData.noHpPenjamin}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Paket Program & Rincian Komponen Biaya Pelatihan LPK */}
              <div className="font-sans space-y-2">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-indigo-700 flex items-center justify-between">
                  <span>{tr.sec3Title}</span>
                  <span className="font-mono text-[10px] text-indigo-800 font-bold">{tr.codeLabel}: {activePackage.id}</span>
                </div>

                <div className="bg-indigo-50/60 p-2 rounded border border-indigo-100 text-[11px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span>{tr.programLabel}: <strong className="text-slate-900">{activePackageDisplay.namaPaket}</strong></span>
                    <span className="font-mono text-indigo-900 font-bold bg-indigo-100 px-2 py-0.5 rounded text-[10px]">
                      {activePackage.durasiBulan} {isJa ? 'ヶ月' : 'Bulan'} ({activePackage.jamPelajaran} {isJa ? '時間' : 'Jam Belajar'})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600">{activePackageDisplay.deskripsi}</p>
                </div>

                {/* Table Komponen Biaya Pelatihan */}
                <table className="w-full text-[10px] border-collapse border border-slate-300 font-sans mt-1">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="border border-slate-400 p-1 text-center w-8">{tr.docThNo}</th>
                      <th className="border border-slate-400 p-1 text-left">{tr.docThCostComponent}</th>
                      <th className="border border-slate-400 p-1 text-left">{tr.docThRemarks}</th>
                      <th className="border border-slate-400 p-1 text-right w-24">{tr.docThNominal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingSim.komponenBiaya.map((item, idx) => {
                      const compTrans = isJa && COMPONENT_TRANSLATIONS[item.key];
                      const compLabel = compTrans ? compTrans.label : item.label;
                      const compDesc = compTrans ? compTrans.keterangan : item.keterangan;
                      return (
                        <tr key={item.key} className="even:bg-slate-50">
                          <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-300 p-1 font-semibold text-slate-900">{compLabel}</td>
                          <td className="border border-slate-300 p-1 text-slate-600">{compDesc}</td>
                          <td className="border border-slate-300 p-1 text-right font-mono font-semibold">
                            {formatRupiah(item.nominal)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-indigo-50/80 font-bold border-t-2 border-slate-800">
                      <td colSpan={3} className="border border-slate-300 p-1.5 text-right uppercase text-slate-900">
                        {tr.docTotalCostLPK}
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-indigo-900 text-xs font-black">
                        {formatRupiah(trainingSim.biayaTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 4: Skema & Jadwal Termin Pembayaran */}
              <div className="font-sans space-y-2">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-slate-800 flex items-center justify-between">
                  <span>{tr.docSec4}</span>
                  <span className="font-mono text-[10px] text-slate-700 font-bold">
                    {trainingSim.persentaseBunga > 0 ? `${isJa ? '金利' : 'Bunga LPK'}: ${trainingSim.persentaseBunga}%` : `${isJa ? '金利' : 'Bunga LPK'}: 0%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] bg-slate-50 p-2.5 border border-slate-200 rounded">
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[9px]">{tr.paymentSchemeLabel}</span>
                    <strong className="text-slate-900 text-[11px]">{trainingSim.skemaLabel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.summaryStandardCost}</span>
                    <strong className="text-slate-900 font-mono">{formatRupiah(trainingSim.biayaTotal)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.downPaymentDp}</span>
                    <strong className="text-emerald-700 font-mono">{formatRupiah(trainingSim.uangMukaDp)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.installmentPrincipal}</span>
                    <strong className="text-indigo-800 font-mono">{formatRupiah(trainingSim.pokokCicilan)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.schemeInterestRate} ({trainingSim.persentaseBunga}%):</span>
                    <strong className={`font-mono ${trainingSim.nominalBunga > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
                      {formatRupiah(trainingSim.nominalBunga)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.totalInstallmentObligation}</span>
                    <strong className="text-amber-900 font-mono">{formatRupiah(trainingSim.totalKewajibanCicilan)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">{tr.summaryGrandTotal}</span>
                    <strong className="text-emerald-800 font-mono font-black">{formatRupiah(trainingSim.totalBiayaDanBunga)}</strong>
                  </div>
                </div>

                {/* TABLE RENCANA TERMIN / ANGSURAN */}
                <table className="w-full text-[10px] border-collapse border border-slate-300 font-sans mt-2">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="border border-slate-400 p-1.5 text-center w-16">{tr.docThStage}</th>
                      <th className="border border-slate-400 p-1.5 text-left">{tr.docThSchedule}</th>
                      <th className="border border-slate-400 p-1.5 text-center w-16">{tr.docThPortion}</th>
                      <th className="border border-slate-400 p-1.5 text-right w-24">{tr.docThBilling}</th>
                      <th className="border border-slate-400 p-1.5 text-center w-20">{tr.docThPaymentStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedTermSchedule.map((row) => {
                      const displayStatus = isJa
                        ? (row.statusBayar === 'LUNAS' ? '完納' : row.statusBayar === 'PROSES' ? '処理中' : '未納')
                        : row.statusBayar;
                      const displayLabel = isJa
                        ? (row.terminKe === 1 ? '第1期 (頭金・登録時)' : row.terminKe === 2 ? '第2期 (研修第2期分)' : row.terminKe === 3 ? '第3期 (研修第3期分)' : `第${row.terminKe}期分割分`)
                        : row.labelTermin;
                      const displaySchedule = isJa
                        ? (row.jadwalWaktu.includes('Pendaftaran') || row.jadwalWaktu.includes('Bulan 1') ? '登録時 / 第1ヶ月目' : row.jadwalWaktu.includes('Bulan 2') ? '第2ヶ月目' : row.jadwalWaktu.includes('Bulan 3') ? '第3ヶ月目' : row.jadwalWaktu.includes('Bulan 4') ? '第4ヶ月目' : row.jadwalWaktu.includes('Bulan 5') ? '第5ヶ月目' : row.jadwalWaktu.includes('Bulan 6') ? '第6ヶ月目' : row.jadwalWaktu.includes('Setelah Kerja') || row.jadwalWaktu.includes('Potong Gaji') ? '就労後給与控除' : row.jadwalWaktu)
                        : row.jadwalWaktu;
                      return (
                        <tr key={row.terminKe} className="even:bg-slate-50">
                          <td className="border border-slate-300 p-1 text-center font-bold">
                            {isJa ? `第${row.terminKe}期` : `Termin ${row.terminKe}`}
                          </td>
                          <td className="border border-slate-300 p-1">
                            <strong className="font-bold text-slate-900">{displayLabel}</strong> — {displaySchedule}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-mono font-bold">
                            {row.persentase}%
                          </td>
                          <td className="border border-slate-300 p-1 text-right font-mono font-bold text-indigo-900">
                            {formatRupiah(row.nominal)}
                          </td>
                          <td className="border border-slate-300 p-1 text-center font-bold text-[9px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                row.statusBayar === 'LUNAS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : row.statusBayar === 'PROSES'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {displayStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Section 5: Rekening Pembayaran Resmi LPK */}
              <div className="font-sans space-y-1">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-slate-800">
                  {tr.docSec5}
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[10px] space-y-1">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-semibold text-slate-700">{tr.docPaymentTarget}</span>
                    <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">{rekeningTujuan}</strong>
                  </div>
                  <p className="text-[9px] text-slate-500">
                    {tr.docOfficialNote}
                  </p>
                </div>
              </div>

              {/* Section 6: Ketentuan & Pernyataan */}
              <div className="font-sans space-y-1.5">
                <div className="font-bold bg-slate-100 px-2 py-1 text-[11px] border-l-4 border-slate-800">
                  {tr.docSec6}
                </div>
                {directEditMode ? (
                  <textarea
                    rows={3}
                    value={docMeta.teksKetentuan}
                    onChange={(e) => setDocMeta({ ...docMeta, teksKetentuan: e.target.value })}
                    className="w-full text-[10px] font-sans border border-dashed border-amber-400 bg-amber-50/50 p-1.5 rounded"
                  />
                ) : (
                  <p className="text-[10px] text-slate-700 italic leading-relaxed">
                    "{docMeta.teksKetentuan}"
                  </p>
                )}
              </div>

              {/* Tanda Tangan Boxes */}
              <div className="font-sans pt-6 grid grid-cols-3 gap-4 text-[11px] text-center">
                <div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={docMeta.penandatangan1Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan1Jabatan: e.target.value })}
                      className="text-center font-semibold text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-semibold">{docMeta.penandatangan1Jabatan}</p>
                  )}
                  <div className="h-16"></div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={namaPeserta}
                      onChange={(e) => setNamaPeserta(e.target.value)}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-bold underline">{namaPeserta}</p>
                  )}
                  <p className="text-[9px] text-slate-500">{isJa ? '登録訓練生 (受講者)' : 'Siswa Pelatihan LPK'}</p>
                </div>

                <div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={docMeta.penandatangan2Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan2Jabatan: e.target.value })}
                      className="text-center font-semibold text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-semibold">{docMeta.penandatangan2Jabatan}</p>
                  )}
                  <div className="h-16"></div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={guarantorData.namaPenjamin}
                      onChange={(e) => setGuarantorData({ ...guarantorData, namaPenjamin: e.target.value })}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-bold underline">{guarantorData.namaPenjamin}</p>
                  )}
                  <p className="text-[9px] text-slate-500">{isJa ? '保護者 / 法的保証人' : 'Orang Tua / Penjamin Legal'}</p>
                </div>

                <div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={docMeta.penandatangan3Jabatan}
                      onChange={(e) => setDocMeta({ ...docMeta, penandatangan3Jabatan: e.target.value })}
                      className="text-center font-semibold text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded mb-1"
                    />
                  ) : (
                    <p className="font-semibold">{docMeta.penandatangan3Jabatan}</p>
                  )}
                  <div className="h-16"></div>
                  {directEditMode ? (
                    <input
                      type="text"
                      value={namaFinance}
                      onChange={(e) => setNamaFinance(e.target.value)}
                      className="text-center font-bold underline text-xs w-full border border-dashed border-amber-400 bg-amber-50/50 p-1 rounded"
                    />
                  ) : (
                    <p className="font-bold underline">{namaFinance}</p>
                  )}
                  <p className="text-[9px] text-slate-500">{isJa ? '財務会計部 / レジ' : 'Bagian Keuangan & Kasir'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
