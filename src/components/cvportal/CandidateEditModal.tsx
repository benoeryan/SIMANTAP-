import React, { useState, useEffect } from 'react';
import { CVRirekisho, AplikasiDukunganDana, HasilKesehatan, AsesmenDisc, AsesmenPsikotes } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatRupiah, calculateFinancing } from '../../utils/financingCalculator';
import {
  calculateDepartureFinancing,
  parseBiayaJobToNumber,
  ESTIMATED_KUR_JPY_IDR,
  DepartureFinancingScheme
} from '../../utils/departureFinancingCalculator';
import { autoTranslateCandidateCV, transliterateNameToKatakana, translateIndonesianToJapaneseEYD } from '../../utils/japaneseTranslator';
import { getSanitizedCompany } from '../../utils/mitraJobUtils';
import { calculateAgeFromBirthDate } from '../../utils/candidateUtils';
import { CandidateDocumentUploadSection } from './CandidateDocumentUploadSection';
import {
  User,
  X,
  Save,
  CheckCircle2,
  Sparkles,
  FileText,
  Award,
  Clock,
  ArrowLeft,
  RefreshCw,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Languages,
  Coins,
  Receipt,
  ShieldCheck,
  Check,
  AlertCircle,
  Briefcase,
  Search,
  Link as LinkIcon,
  Stethoscope,
  Brain,
  Activity,
  Heart,
  Scale
} from 'lucide-react';

interface CandidateEditModalProps {
  candidate: CVRirekisho;
  onClose: () => void;
  onSave: (updatedCandidate: CVRirekisho) => void;
  initialTab?: 'data' | 'progres' | 'sertifikat' | 'terjemahan' | 'pembiayaan' | 'mcu-asesmen';
}

export const CandidateEditModal: React.FC<CandidateEditModalProps> = ({
  candidate,
  onClose,
  onSave,
  initialTab = 'data'
}) => {
  const {
    students,
    financingRecords,
    saveFinancingRecord,
    masterSettings,
    jobPostings,
    saveJobApplication,
    jobApplications,
    healthRecords,
    saveHealthRecord,
    discRecords,
    saveDiscRecord,
    psikotesRecords,
    savePsikotesRecord,
    lang
  } = useApp();
  const [activeTab, setActiveTab] = useState<'data' | 'progres' | 'sertifikat' | 'terjemahan' | 'pembiayaan' | 'mcu-asesmen'>(initialTab);

  // Find matching student from master student database to ensure no previous documents are lost
  const matchingStudent = React.useMemo(() => {
    return students.find(
      (s) =>
        s.id === candidate.siswaId ||
        s.id === candidate.id ||
        (s.email && candidate.email && s.email.toLowerCase() === candidate.email.toLowerCase()) ||
        (s.namaLengkap && candidate.namaLengkap && s.namaLengkap.toLowerCase() === candidate.namaLengkap.toLowerCase())
    );
  }, [students, candidate]);

  const [formData, setFormData] = useState<CVRirekisho>(() => ({
    ...candidate,
    dokumenUpload: {
      ...(matchingStudent?.berkasDokumen || {}),
      ...(candidate.dokumenUpload || {}),
      pasPhoto3x4: candidate.dokumenUpload?.pasPhoto3x4 || candidate.pasFotoUrl || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || '',
      videoJikoshoukai: candidate.dokumenUpload?.videoJikoshoukai || candidate.videoJikoshoukaiUrl || matchingStudent?.berkasDokumen?.videoJikoshoukai || ''
    }
  }));
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Job Selection State inside Candidate Progres
  const [jobSearchTerm, setJobSearchTerm] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>(candidate.kodeJob || '');

  // Financing State
  const existingDana = financingRecords[candidate.id];
  const linkedJobForCandidate = jobPostings.find(
    (j) => j.id === candidate.kodeJob || j.kodeJob === candidate.kodeJob || j.id === selectedJobId
  );
  const defaultJobCost = linkedJobForCandidate ? parseBiayaJobToNumber(linkedJobForCandidate.biayaProses) : (masterSettings.baseProgramCost || 25000000);

  const [skemaKeberangkatan, setSkemaKeberangkatan] = useState<DepartureFinancingScheme>(
    existingDana?.skemaKeberangkatan || (existingDana?.skemaPilihan === 'MANDIRI' ? 'DANA_MANDIRI' : 'DANA_TALANG_100')
  );
  const [costKeberangkatan, setCostKeberangkatan] = useState<number>(
    existingDana?.biayaKeberangkatan || existingDana?.biayaTotal || defaultJobCost
  );
  const [pilihanTenor, setPilihanTenor] = useState<number>(existingDana?.tenorBulan || existingDana?.pilihanTenor || 12);
  const [statusPersetujuan, setStatusPersetujuan] = useState<'DRAFT' | 'PENGAJUAN' | 'VERIFIKASI_ADMIN' | 'APPROVAL_MANAGER' | 'DISETUJUI' | 'DITOLAK'>(
    existingDana?.statusPersetujuan || 'DISETUJUI'
  );
  const [catatanApproval, setCatatanApproval] = useState<string>(
    existingDana?.catatanApproval || 'Pembiayaan keberangkatan diverifikasi & disetujui oleh Admin Doc'
  );

  // MCU & Assessment State
  const studentKey = candidate.siswaId || candidate.id || matchingStudent?.id || '';

  const existingHealth =
    healthRecords[studentKey] ||
    healthRecords[candidate.id] ||
    (candidate.siswaId ? healthRecords[candidate.siswaId] : undefined) ||
    (matchingStudent ? healthRecords[matchingStudent.id] : undefined);

  const existingDisc =
    discRecords[studentKey] ||
    discRecords[candidate.id] ||
    (candidate.siswaId ? discRecords[candidate.siswaId] : undefined) ||
    (matchingStudent ? discRecords[matchingStudent.id] : undefined);

  const existingPsikotes =
    psikotesRecords[studentKey] ||
    psikotesRecords[candidate.id] ||
    (candidate.siswaId ? psikotesRecords[candidate.siswaId] : undefined) ||
    (matchingStudent ? psikotesRecords[matchingStudent.id] : undefined);

  const [healthForm, setHealthForm] = useState<HasilKesehatan>(() => ({
    id: existingHealth?.id || `mcu-${studentKey || Date.now()}`,
    siswaId: studentKey,
    namaSiswa: candidate.namaLengkap || matchingStudent?.namaLengkap || '',
    tinggiBadan: existingHealth?.tinggiBadan || (candidate.tinggiBadan ? Number(candidate.tinggiBadan) : 165),
    beratBadan: existingHealth?.beratBadan || (candidate.beratBadan ? Number(candidate.beratBadan) : 55),
    tekananDarah: existingHealth?.tekananDarah || '120/80',
    denyutNadi: existingHealth?.denyutNadi || 76,
    butaWarna: existingHealth?.butaWarna || (candidate.butaWarna === 'Ya' ? 'Ya' : 'Normal'),
    visusMataKiri: existingHealth?.visusMataKiri || '6/6',
    visusMataKanan: existingHealth?.visusMataKanan || '6/6',
    statusFit: existingHealth?.statusFit || 'FIT',
    catatanDokter: existingHealth?.catatanDokter || 'Kondisi fisik prima, memenuhi standar kualifikasi magang & Tokutei Ginou Jepang.',
    dokterPemeriksa: existingHealth?.dokterPemeriksa || existingHealth?.evaluatorName || 'dr. Hendra Kurniawan, Sp.Ok',
    klinikLaboratorium: existingHealth?.klinikLaboratorium || existingHealth?.namaKlinik || 'Klinik Medika Utama IJEF',
    tanggalMCU: existingHealth?.tanggalMCU || existingHealth?.tanggalPemeriksaan || candidate.tanggalSubmit || new Date().toISOString().split('T')[0],
    hasilRontgenParu: existingHealth?.hasilRontgenParu || 'Normal / Jernih',
    hasilHbsAg: existingHealth?.hasilHbsAg || 'Non-Reaktif (Bebas Hep B)',
    hasilTesUrine: existingHealth?.hasilTesUrine || 'Bebas Narkoba (Negatif)',
    riwayatPenyakitSerius: existingHealth?.riwayatPenyakitSerius || candidate.penyakitBerat || 'Tidak Ada',
    tesPushUp: existingHealth?.tesPushUp || 35,
    tesSitUp: existingHealth?.tesSitUp || 35,
    tesAngkatBeban: existingHealth?.tesAngkatBeban || 'Lulus (20kg)'
  }));

  const [discForm, setDiscForm] = useState<AsesmenDisc>(() => ({
    id: existingDisc?.id || `disc-${studentKey || Date.now()}`,
    siswaId: studentKey,
    namaSiswa: candidate.namaLengkap || matchingStudent?.namaLengkap || '',
    dominantType: existingDisc?.dominantType || 'Steadiness',
    dominantTrait: existingDisc?.dominantTrait || 'Stabil, tekun, disiplin, loyalitas tinggi, dan sangat kooperatif dalam tim',
    skorD: existingDisc?.skorD ?? existingDisc?.scoreD ?? 45,
    skorI: existingDisc?.skorI ?? existingDisc?.scoreI ?? 55,
    skorS: existingDisc?.skorS ?? existingDisc?.scoreS ?? 85,
    skorC: existingDisc?.skorC ?? existingDisc?.scoreC ?? 75,
    analisisKarakter: existingDisc?.analisisKarakter || 'Memiliki ketahanan mental prima, patuh terhadap SOP Jepang (Hou-Ren-So & 5S), cocok untuk penempatan kerja jangka panjang.'
  }));

  const [psikotesForm, setPsikotesForm] = useState<AsesmenPsikotes>(() => ({
    id: existingPsikotes?.id || `psiko-${studentKey || Date.now()}`,
    siswaId: studentKey,
    namaSiswa: candidate.namaLengkap || matchingStudent?.namaLengkap || '',
    statusKelulusan: existingPsikotes?.statusKelulusan || 'LULUS',
    scorePercentage: existingPsikotes?.scorePercentage ?? existingPsikotes?.skorTotal ?? 85,
    skorLogika: existingPsikotes?.skorLogika ?? 82,
    skorKuantitatif: existingPsikotes?.skorKuantitatif ?? 80,
    skorVerbal: existingPsikotes?.skorVerbal ?? 86,
    skorKetelitian: existingPsikotes?.skorKetelitian ?? 92
  }));

  const currentHeight = Number(healthForm.tinggiBadan) || 165;
  const currentWeight = Number(healthForm.beratBadan) || 55;
  const currentBmi = Number((currentWeight / Math.pow(currentHeight / 100, 2)).toFixed(1));
  let bmiCategory = { label: 'Ideal (Normal)', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
  if (currentBmi < 18.5) {
    bmiCategory = { label: 'Kurang (Underweight)', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  } else if (currentBmi >= 25 && currentBmi < 30) {
    bmiCategory = { label: 'Berlebih (Overweight)', color: 'text-amber-700 bg-amber-50 border-amber-300' };
  } else if (currentBmi >= 30) {
    bmiCategory = { label: 'Obesitas', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  }

  useEffect(() => {
    setFormData({
      ...candidate,
      dokumenUpload: {
        ...(matchingStudent?.berkasDokumen || {}),
        ...(candidate.dokumenUpload || {}),
        pasPhoto3x4: candidate.dokumenUpload?.pasPhoto3x4 || candidate.pasFotoUrl || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || '',
        videoJikoshoukai: candidate.dokumenUpload?.videoJikoshoukai || candidate.videoJikoshoukaiUrl || matchingStudent?.berkasDokumen?.videoJikoshoukai || ''
      }
    });
    if (candidate.kodeJob) {
      setSelectedJobId(candidate.kodeJob);
    }
    if (existingDana) {
      if (existingDana.skemaKeberangkatan) setSkemaKeberangkatan(existingDana.skemaKeberangkatan);
      else if (existingDana.skemaPilihan === 'MANDIRI') setSkemaKeberangkatan('DANA_MANDIRI');
      else setSkemaKeberangkatan('DANA_TALANG_100');

      if (existingDana.biayaKeberangkatan) setCostKeberangkatan(existingDana.biayaKeberangkatan);
      else if (existingDana.biayaTotal) setCostKeberangkatan(existingDana.biayaTotal);

      setPilihanTenor(existingDana.tenorBulan || existingDana.pilihanTenor || 12);
      setStatusPersetujuan(existingDana.statusPersetujuan);
      setCatatanApproval(existingDana.catatanApproval || '');
    }
  }, [candidate.id, candidate.updatedAt, existingDana?.id, existingDana?.statusPersetujuan, matchingStudent?.id]);

  const handleChange = (field: keyof CVRirekisho, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'tanggalLahir' && value) {
        updated.umur = calculateAgeFromBirthDate(value, prev.umur || 22);
      }
      return updated;
    });
  };

  const handleSelectJobAutoFill = (jobId: string) => {
    setSelectedJobId(jobId);
    if (!jobId) return;
    const job = jobPostings.find((j) => j.id === jobId || j.kodeJob === jobId);
    if (job) {
      const rawKode = job.kodeJob || job.id;
      const detailStr = `Job Code: ${rawKode}\nPosisi: ${job.judulPekerjaan}\nPerusahaan: ${job.perusahaanJepang || '-'}\nLokasi: ${job.lokasiPrefektur || '-'}\nGaji: ${job.gajiString || (job.gajiBulananYen ? job.gajiBulananYen.toLocaleString() + ' Yen' : '-')}\nTSK Partner: ${job.tskSumberJob || '-'}\nKualifikasi: ${job.kualifikasi || job.persyaratanJLPT || '-'}\nFasilitas: ${job.fasilitasAsrama || '-'}`;

      setFormData((prev) => ({
        ...prev,
        kodeJob: rawKode,
        namaPerusahaanJp: job.perusahaanJepang || job.judulPekerjaan,
        lokasiPerusahaanJp: job.lokasiPrefektur || job.domisiliKerja || '',
        namaTSK: job.tskSumberJob || job.kumiaiRujukan || prev.namaTSK || '',
        bidangKerja: job.judulPekerjaan || prev.bidangKerja,
        detailProgres: detailStr,
        keteranganProgres: prev.keteranganProgres || `Terhubung dengan Job [${rawKode}] - ${job.judulPekerjaan}`
      }));
    }
  };

  const filteredJobsForSelection = React.useMemo(() => {
    if (!jobSearchTerm) return jobPostings;
    const term = jobSearchTerm.toLowerCase();
    return jobPostings.filter(
      (j) =>
        (j.judulPekerjaan || '').toLowerCase().includes(term) ||
        (j.kodeJob || '').toLowerCase().includes(term) ||
        (j.perusahaanJepang || '').toLowerCase().includes(term) ||
        (j.lokasiPrefektur || '').toLowerCase().includes(term) ||
        (j.tskSumberJob || '').toLowerCase().includes(term)
    );
  }, [jobPostings, jobSearchTerm]);

  const handleSave = () => {
    const computedUmur = calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22);
    const updatedData: CVRirekisho = {
      ...formData,
      umur: computedUmur,
      tempatTanggalLahir: `${formData.tempatLahir || ''}, ${formData.tanggalLahir || ''}`.trim().replace(/^,/, ''),
    };
    onSave(updatedData);

    // Synchronize or create job application if linked
    if (formData.kodeJob || selectedJobId) {
      const linkedJob = jobPostings.find(
        (j) => j.id === selectedJobId || j.kodeJob === formData.kodeJob || j.id === formData.kodeJob
      );
      if (linkedJob) {
        const existingApp = jobApplications.find(
          (a) => a.siswaId === formData.siswaId || a.siswaId === formData.id
        );
        saveJobApplication({
          id: existingApp ? existingApp.id : `APP-${Date.now()}`,
          jobId: linkedJob.id,
          jobJudul: linkedJob.judulPekerjaan,
          perusahaanJepang: formData.namaPerusahaanJp || linkedJob.perusahaanJepang,
          siswaId: formData.siswaId || formData.id,
          namaSiswa: formData.namaLengkap,
          emailSiswa: formData.email,
          kategoriKandidat: formData.kategoriKandidat,
          tanggalLamar: existingApp ? existingApp.tanggalLamar : new Date().toISOString().split('T')[0],
          statusLamaran: (formData.statusProgres as any) || 'Terjadwal Interview',
          catatanPerusahaan: formData.keteranganProgres || formData.detailProgres
        });
      }
    }

    setSaveSuccessMsg('Data kandidat & status progres berhasil disimpan!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAutoTranslateAI = () => {
    const translated = autoTranslateCandidateCV(formData);
    setFormData(translated);
    setSaveSuccessMsg('Auto-translate ke EYD Bahasa Jepang selesai!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSaveMcuAndAsesmen = () => {
    const key = studentKey || candidate.id;
    const finalHealth: HasilKesehatan = {
      ...healthForm,
      id: healthForm.id || `mcu-${key}`,
      siswaId: key,
      namaSiswa: candidate.namaLengkap,
      tinggiBadan: currentHeight,
      beratBadan: currentWeight,
      bmiIndex: currentBmi,
      updatedAt: new Date().toISOString()
    };
    saveHealthRecord(finalHealth);

    const finalDisc: AsesmenDisc = {
      ...discForm,
      id: discForm.id || `disc-${key}`,
      siswaId: key,
      namaSiswa: candidate.namaLengkap,
      scoreD: discForm.skorD,
      scoreI: discForm.skorI,
      scoreS: discForm.skorS,
      scoreC: discForm.skorC,
      createdAt: discForm.createdAt || new Date().toISOString()
    };
    saveDiscRecord(finalDisc);

    const finalPsikotes: AsesmenPsikotes = {
      ...psikotesForm,
      id: psikotesForm.id || `psiko-${key}`,
      siswaId: key,
      namaSiswa: candidate.namaLengkap,
      skorTotal: psikotesForm.scorePercentage
    };
    savePsikotesRecord(finalPsikotes);

    // Sync physical data into CV Rirekisho
    const updatedCV: CVRirekisho = {
      ...formData,
      tinggiBadan: String(currentHeight),
      beratBadan: String(currentWeight),
      butaWarna: healthForm.butaWarna === 'Normal' || healthForm.butaWarna === 'Tidak' ? 'Tidak' : 'Ya',
      penyakitBerat: healthForm.riwayatPenyakitSerius || formData.penyakitBerat || 'Tidak Ada'
    };
    setFormData(updatedCV);
    onSave(updatedCV);

    setSaveSuccessMsg(
      lang === 'ja'
        ? '健康診断、DISC、および適性検査のデータが正常に保存され、候補者履歴書に同期されました！'
        : 'Data MCU (Kesehatan), DISC & Psikotes berhasil disimpan dan disinkronkan ke CV Kandidat!'
    );
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-white text-slate-900 w-full h-full flex flex-col min-h-0 overflow-hidden">
        {/* Header - Full Screen Mode */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 shrink-0 shadow-xs">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border border-blue-300 mb-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>{lang === 'ja' ? '管理ポータル 2 • 候補者データ & 履歴書編集' : 'PORTAL ADMIN 2 • FULL SCREEN EDIT DATA KANDIDAT & RIREKISHO'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{lang === 'ja' ? `編集: ${formData.namaLengkap || '候補者名'}` : `Edit: ${formData.namaLengkap || 'Nama Kandidat'}`}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">
              {formData.bidangKerja || 'KAIGO'} - {formData.kategoriKandidat || 'EX-MAGANG/EX-TRAINEER'}
            </p>
          </div>
        </div>

        {/* Save success banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </span>
          </div>
        )}

        {/* Tab Bar Navigation (Image 2 & 3) */}
        <div className="border-b border-slate-200 bg-white px-6 pt-3 flex space-x-6 overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'data'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{lang === 'ja' ? '候補者データ' : 'Data Kandidat'}</span>
          </button>

          <button
            onClick={() => setActiveTab('progres')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'progres'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{lang === 'ja' ? '進捗ステータス' : 'Status Progres'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sertifikat')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'sertifikat'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{lang === 'ja' ? '資格・証明書' : 'Sertifikat'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terjemahan')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'terjemahan'
                ? 'border-blue-600 text-blue-600 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>{lang === 'ja' ? '日本語翻訳 (EYD)' : 'Terjemahan Jepang'}</span>
          </button>

          <button
            onClick={() => setActiveTab('pembiayaan')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'pembiayaan'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ja' ? '渡航費用・ローン支援' : 'Pembiayaan & Dana Talang'}</span>
          </button>

          <button
            onClick={() => setActiveTab('mcu-asesmen')}
            className={`pb-3 border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'mcu-asesmen'
                ? 'border-purple-600 text-purple-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-purple-600" />
            <span>{lang === 'ja' ? '健康診断・適性検査' : 'MCU & Asesmen'}</span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase border ${
                healthForm.statusFit === 'FIT'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : healthForm.statusFit === 'NOTE'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}
            >
              {healthForm.statusFit || 'BELUM'}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0 bg-slate-50/50">
          {/* TAB 1: DATA KANDIDAT */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Card 1: Informasi Referensi & Job */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Informasi Referensi & Job
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kode Referensi</label>
                    <input
                      type="text"
                      value={formData.kodeReferensi || ''}
                      onChange={(e) => handleChange('kodeReferensi', e.target.value)}
                      placeholder="e.g. Nanda sensei / IJEF-OFFLINE-2024-008"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kode Job</label>
                    <input
                      type="text"
                      value={formData.kodeJob || ''}
                      onChange={(e) => handleChange('kodeJob', e.target.value)}
                      placeholder="e.g. IJEF076 / Intel 013"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kategori Kandidat</label>
                    <select
                      value={formData.kategoriKandidat || 'SISWA NON IJEF (New Comer)'}
                      onChange={(e) => handleChange('kategoriKandidat', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    >
                      <option value="SISWA MITRA / NON IJEF">SISWA MITRA / NON IJEF</option>
                      <option value="SISWA NON IJEF (New Comer)">NEW COMER / NON IJEF</option>
                      <option value="EX-MAGANG/EX-TRAINEER">EX-MAGANG/EX-TRAINEER</option>
                      <option value="SISWA IJEF - Offline">SISWA IJEF (Offline)</option>
                      <option value="SISWA IJEF - Online">SISWA IJEF (Online)</option>
                      <option value="MATCHING JOB - Engineering / Gijinkoku">Engineering / Gijinkoku</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Domisili</label>
                    <input
                      type="text"
                      value={formData.domisili || formData.alamatLengkap || ''}
                      onChange={(e) => handleChange('domisili', e.target.value)}
                      placeholder="Kabupaten / Kota / Provinsi Domisili"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Bidang Kerja (Sektor Utama)</label>
                    <select
                      value={(() => {
                        const bk = (formData.bidangKerja || '').toUpperCase();
                        if (bk.includes('IRODOR')) return 'Belajar Bahasa Jepang Irodori';
                        if (bk.includes('MINNA')) return 'Belajar Bahasa Jepang Minna no Nihongo';
                        if (bk.includes('REGULER') || bk.includes('BELUM MENENTUKAN') || bk.includes('FOKUS BAHASA')) return 'Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)';
                        if (bk.includes('SSW') || bk.includes('MENYUSUL')) return 'Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)';
                        if (bk.includes('KAIGO') || bk.includes('CARE') || bk.includes('PERAWAT')) return 'KAIGO';
                        if (bk.includes('PM') || bk.includes('MAKANAN') || bk.includes('FOOD')) return 'PM';
                        if (bk.includes('TANI') || bk.includes('TERNAK') || bk.includes('AGRI')) return 'PERTANIAN';
                        if (bk.includes('KIKAI') || bk.includes('MESIN') || bk.includes('MANUFAKTUR')) return 'KIKAI_KAKOU';
                        if (bk.includes('ENGINEER') || bk.includes('GIJINKOKU') || bk.includes('TEKNIK')) return 'ENGINEERING';
                        if (bk.includes('KONSTRUKSI') || bk.includes('BANGUNAN')) return 'KONSTRUKSI';
                        if (bk.includes('CLEANING') || bk.includes('KEBERSIHAN')) return 'BUILDING_CLEANING';
                        return formData.bidangKerja || 'KAIGO';
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange('bidangKerja', val);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <optgroup label="📚 Program Pembelajaran (Universal / Pemula)">
                        <option value="Belajar Bahasa Jepang Irodori">Belajar Bahasa Jepang Irodori (A1/A2)</option>
                        <option value="Belajar Bahasa Jepang Minna no Nihongo">Belajar Bahasa Jepang Minna no Nihongo (N5/N4)</option>
                        <option value="Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)">Kelas Bahasa Reguler (Umum / Belum Menentukan Bidang)</option>
                        <option value="Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)">Persiapan Tokutei Ginou / SSW (Penentuan Menyusul)</option>
                      </optgroup>
                      <optgroup label="🏭 Sektor Kerja Spesifik (Matching Job)">
                        <option value="KAIGO">KAIGO (Caregiver / Keperawatan Lansia)</option>
                        <option value="PM">PM (Pengolahan Makanan / Food Service)</option>
                        <option value="PERTANIAN">PERTANIAN & PETERNAKAN</option>
                        <option value="KIKAI_KAKOU">KIKAI KAKOU (Manufaktur / Mesin)</option>
                        <option value="ENGINEERING">ENGINEERING (Gijinkoku / Teknik)</option>
                        <option value="KONSTRUKSI">KONSTRUKSI (Bangunan)</option>
                        <option value="BUILDING_CLEANING">BUILDING CLEANING</option>
                        <option value="Lainnya">LAINNYA (Tulis Manual)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Bidang Kerja Lainnya (Manual)</label>
                    <input
                      type="text"
                      value={formData.bidangKerjaLainnya || ''}
                      onChange={(e) => handleChange('bidangKerjaLainnya', e.target.value)}
                      placeholder="Jika bidang kerja LAINNYA"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Data Pribadi */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Data Pribadi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.namaLengkap || ''}
                      onChange={(e) => handleChange('namaLengkap', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama (Tulis Tangan - Optional)</label>
                    <input
                      type="text"
                      value={formData.namaTulisTangan || ''}
                      onChange={(e) => handleChange('namaTulisTangan', e.target.value)}
                      placeholder="Nama Tulis Tangan"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Nama Panggilan</label>
                    <input
                      type="text"
                      value={formData.namaPanggilan || ''}
                      onChange={(e) => handleChange('namaPanggilan', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">No HP</label>
                    <input
                      type="text"
                      value={formData.noHp || ''}
                      onChange={(e) => handleChange('noHp', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-semibold">Tanggal Lahir</label>
                      {formData.tanggalLahir && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Usia: {calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22)} Thn
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.tanggalLahir || ''}
                      onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                      placeholder="DD/MM/YYYY e.g. 21/08/2007"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempatLahir || ''}
                      onChange={(e) => handleChange('tempatLahir', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.jenisKelamin || 'Perempuan'}
                      onChange={(e) => handleChange('jenisKelamin', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Agama</label>
                    <input
                      type="text"
                      value={formData.agama || 'ISLAM'}
                      onChange={(e) => handleChange('agama', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Golongan Darah</label>
                    <input
                      type="text"
                      value={formData.golonganDarah || 'TIDAK TAHU'}
                      onChange={(e) => handleChange('golonganDarah', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tinggi Badan (CM)</label>
                    <input
                      type="number"
                      value={formData.tinggiBadan || ''}
                      onChange={(e) => handleChange('tinggiBadan', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Berat Badan (KG)</label>
                    <input
                      type="number"
                      value={formData.beratBadan || ''}
                      onChange={(e) => handleChange('beratBadan', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Status</label>
                    <select
                      value={formData.statusPernikahan || 'Lajang'}
                      onChange={(e) => handleChange('statusPernikahan', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Lajang">Lajang</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Duda/Janda">Duda/Janda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Dominan Tangan</label>
                    <select
                      value={formData.dominanTangan || 'Kanan'}
                      onChange={(e) => handleChange('dominanTangan', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Kanan">Kanan</option>
                      <option value="Kiri">Kiri</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Buta Warna</label>
                    <select
                      value={String(formData.butaWarna || 'TIDAK')}
                      onChange={(e) => handleChange('butaWarna', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Merokok</label>
                    <select
                      value={String(formData.merokok || 'TIDAK')}
                      onChange={(e) => handleChange('merokok', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Minum Alkohol</label>
                    <select
                      value={String(formData.minumAlkohol || 'TIDAK')}
                      onChange={(e) => handleChange('minumAlkohol', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tato</label>
                    <select
                      value={String(formData.memilikiTato || formData.tato || 'TIDAK')}
                      onChange={(e) => handleChange('memilikiTato', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Penyakit Berat</label>
                    <select
                      value={String(formData.penyakitBerat || 'TIDAK')}
                      onChange={(e) => handleChange('penyakitBerat', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Alergi</label>
                    <select
                      value={String(formData.alergi || 'TIDAK')}
                      onChange={(e) => handleChange('alergi', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Hobi</label>
                    <input
                      type="text"
                      value={formData.hobi || ''}
                      onChange={(e) => handleChange('hobi', e.target.value)}
                      placeholder="e.g. Memasak dan menonton film"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Alamat</label>
                    <textarea
                      rows={2}
                      value={formData.alamatLengkap || ''}
                      onChange={(e) => handleChange('alamatLengkap', e.target.value)}
                      placeholder="Alamat lengkap kandidat..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: SIM (Surat Izin Mengemudi) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  SIM (Surat Izin Mengemudi)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Memiliki SIM</label>
                    <select
                      value={String(formData.memilikiSim || 'TIDAK')}
                      onChange={(e) => handleChange('memilikiSim', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 4: Paspor & Pengalaman Jepang */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Paspor & Pengalaman Jepang
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Pernah ke Jepang</label>
                    <select
                      value={String(formData.pernahKeJepang || 'TIDAK')}
                      onChange={(e) => handleChange('pernahKeJepang', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Memiliki Paspor</label>
                    <select
                      value={String(formData.memilikiPaspor || 'TIDAK')}
                      onChange={(e) => handleChange('memilikiPaspor', e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="TIDAK">TIDAK</option>
                      <option value="YA">YA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 5: Data Keluarga (Keluarga 1, 2, 3, 4) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Data Keluarga
                </h3>

                {[0, 1, 2, 3].map((index) => {
                  const currentMember = formData.dataKeluarga?.[index] || {
                    namaLengkap: index === 0 ? 'TARJUKI' : index === 1 ? 'SIDON' : '',
                    hubungan: index === 0 ? 'AYAH' : index === 1 ? 'IBU' : '',
                    usia: '',
                    pekerjaan: '',
                    gajiPerBulan: '',
                    tinggalBersama: 'TINGGAL BERSAMA'
                  };

                  const updateFamilyMember = (field: string, value: any) => {
                    const nextList = [...(formData.dataKeluarga || [])];
                    while (nextList.length <= index) {
                      nextList.push({
                        namaLengkap: '',
                        hubungan: '',
                        usia: '',
                        pekerjaan: '',
                        gajiPerBulan: '',
                        tinggalBersama: 'YA'
                      });
                    }
                    nextList[index] = { ...nextList[index], [field]: value };
                    handleChange('dataKeluarga', nextList);
                  };

                  return (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Keluarga {index + 1}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Nama</label>
                          <input
                            type="text"
                            value={currentMember.namaLengkap || ''}
                            onChange={(e) => updateFamilyMember('namaLengkap', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Hubungan</label>
                          <input
                            type="text"
                            value={currentMember.hubungan || ''}
                            onChange={(e) => updateFamilyMember('hubungan', e.target.value)}
                            placeholder="e.g. AYAH / IBU / Kakak"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Usia</label>
                          <input
                            type="text"
                            value={currentMember.usia || ''}
                            onChange={(e) => updateFamilyMember('usia', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Pekerjaan</label>
                          <input
                            type="text"
                            value={currentMember.pekerjaan || ''}
                            onChange={(e) => updateFamilyMember('pekerjaan', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Gaji</label>
                          <input
                            type="text"
                            value={currentMember.gajiPerBulan || ''}
                            onChange={(e) => updateFamilyMember('gajiPerBulan', e.target.value)}
                            placeholder="e.g. 1.000.000 atau -"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Tinggal Bersama</label>
                          <select
                            value={String(currentMember.tinggalBersama || 'TINGGAL BERSAMA')}
                            onChange={(e) => updateFamilyMember('tinggalBersama', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="TINGGAL BERSAMA">TINGGAL BERSAMA</option>
                            <option value="TINGGAL TERPISAH">TINGGAL TERPISAH</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card 6: Riwayat Pendidikan */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Riwayat Pendidikan
                </h3>

                {(() => {
                  const edu = formData.pendidikanDetail || {
                    sd: { namaSekolah: '', tahunMasuk: '', tahunLulus: '' },
                    smp: { namaSekolah: '', tahunMasuk: '', tahunLulus: '' },
                    sma: { namaSekolah: '', tahunMasuk: '', tahunLulus: '', jurusan: '' },
                    universitas: { namaSekolah: '', tahunMasuk: '', tahunLulus: '', jurusan: '' }
                  };

                  const updateEdu = (level: 'sd' | 'smp' | 'sma' | 'universitas', field: string, val: string) => {
                    const newEdu = {
                      ...edu,
                      [level]: {
                        ...edu[level],
                        [field]: val
                      }
                    };
                    handleChange('pendidikanDetail', newEdu);
                  };

                  return (
                    <div className="space-y-4 text-xs">
                      {/* SD */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="font-bold text-slate-700 block">SD</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Nama Sekolah</label>
                            <input
                              type="text"
                              value={edu.sd?.namaSekolah || ''}
                              onChange={(e) => updateEdu('sd', 'namaSekolah', e.target.value)}
                              placeholder="SD N 2 Pesantren"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Masuk</label>
                            <input
                              type="text"
                              value={edu.sd?.tahunMasuk || ''}
                              onChange={(e) => updateEdu('sd', 'tahunMasuk', e.target.value)}
                              placeholder="15/07/2013"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Lulus</label>
                            <input
                              type="text"
                              value={edu.sd?.tahunLulus || ''}
                              onChange={(e) => updateEdu('sd', 'tahunLulus', e.target.value)}
                              placeholder="15/06/2019"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SMP */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="font-bold text-slate-700 block">SMP</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Nama Sekolah</label>
                            <input
                              type="text"
                              value={edu.smp?.namaSekolah || ''}
                              onChange={(e) => updateEdu('smp', 'namaSekolah', e.target.value)}
                              placeholder="SMPN 2 PETARUKAN"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Masuk</label>
                            <input
                              type="text"
                              value={edu.smp?.tahunMasuk || ''}
                              onChange={(e) => updateEdu('smp', 'tahunMasuk', e.target.value)}
                              placeholder="15/07/2019"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Lulus</label>
                            <input
                              type="text"
                              value={edu.smp?.tahunLulus || ''}
                              onChange={(e) => updateEdu('smp', 'tahunLulus', e.target.value)}
                              placeholder="15/06/2022"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SMA/K */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="font-bold text-slate-700 block">SMA/K</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Nama Sekolah</label>
                            <input
                              type="text"
                              value={edu.sma?.namaSekolah || ''}
                              onChange={(e) => updateEdu('sma', 'namaSekolah', e.target.value)}
                              placeholder="SMK N 1 AMPELGADING"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Masuk</label>
                            <input
                              type="text"
                              value={edu.sma?.tahunMasuk || ''}
                              onChange={(e) => updateEdu('sma', 'tahunMasuk', e.target.value)}
                              placeholder="15/07/2022"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Lulus</label>
                            <input
                              type="text"
                              value={edu.sma?.tahunLulus || ''}
                              onChange={(e) => updateEdu('sma', 'tahunLulus', e.target.value)}
                              placeholder="15/06/2025"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jurusan</label>
                          <input
                            type="text"
                            value={edu.sma?.jurusan || ''}
                            onChange={(e) => updateEdu('sma', 'jurusan', e.target.value)}
                            placeholder="TEKNIK OTOMOTIF"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                          />
                        </div>
                      </div>

                      {/* Universitas */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <span className="font-bold text-slate-700 block">Universitas</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Nama Universitas</label>
                            <input
                              type="text"
                              value={edu.universitas?.namaSekolah || ''}
                              onChange={(e) => updateEdu('universitas', 'namaSekolah', e.target.value)}
                              placeholder="Nama Universitas (jika ada)"
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Masuk</label>
                            <input
                              type="text"
                              value={edu.universitas?.tahunMasuk || ''}
                              onChange={(e) => updateEdu('universitas', 'tahunMasuk', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Tahun Lulus</label>
                            <input
                              type="text"
                              value={edu.universitas?.tahunLulus || ''}
                              onChange={(e) => updateEdu('universitas', 'tahunLulus', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jurusan</label>
                          <input
                            type="text"
                            value={edu.universitas?.jurusan || ''}
                            onChange={(e) => updateEdu('universitas', 'jurusan', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Card 7: Riwayat Pekerjaan (Pekerjaan 1, 2, 3, 4) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Riwayat Pekerjaan
                </h3>

                {[0, 1, 2, 3].map((index) => {
                  const currentJob = formData.pekerjaanDetail?.[index] || {
                    namaPerusahaan: '',
                    tanggalMasuk: '',
                    tanggalKeluar: '',
                    bidangPekerjaan: '',
                    statusPekerja: '',
                    uraianPekerjaan: ''
                  };

                  const updateJob = (field: string, value: any) => {
                    const nextList = [...(formData.pekerjaanDetail || [])];
                    while (nextList.length <= index) {
                      nextList.push({
                        namaPerusahaan: '',
                        tanggalMasuk: '',
                        tanggalKeluar: '',
                        bidangPekerjaan: '',
                        statusPekerja: '',
                        uraianPekerjaan: ''
                      });
                    }
                    nextList[index] = { ...nextList[index], [field]: value };
                    handleChange('pekerjaanDetail', nextList);
                  };

                  return (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <span className="text-xs font-bold text-slate-700 block">Pekerjaan {index + 1}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Perusahaan</label>
                          <input
                            type="text"
                            value={currentJob.namaPerusahaan || ''}
                            onChange={(e) => updateJob('namaPerusahaan', e.target.value)}
                            placeholder="Membantu orang tua / PT..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Masuk</label>
                          <input
                            type="text"
                            value={currentJob.tanggalMasuk || ''}
                            onChange={(e) => updateJob('tanggalMasuk', e.target.value)}
                            placeholder="28/01/2019"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Keluar</label>
                          <input
                            type="text"
                            value={currentJob.tanggalKeluar || ''}
                            onChange={(e) => updateJob('tanggalKeluar', e.target.value)}
                            placeholder="29/06/2026 atau Wiraswasta"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Bidang</label>
                          <input
                            type="text"
                            value={currentJob.bidangPekerjaan || ''}
                            onChange={(e) => updateJob('bidangPekerjaan', e.target.value)}
                            placeholder="Bersih bersih rumah / Jasa..."
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-600 font-semibold mb-1">Status</label>
                          <input
                            type="text"
                            value={currentJob.statusPekerja || ''}
                            onChange={(e) => updateJob('statusPekerja', e.target.value)}
                            placeholder="Membantu Orang Tua / Karyawan"
                            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1 text-xs">Uraian Pekerjaan</label>
                        <textarea
                          rows={2}
                          value={currentJob.uraianPekerjaan || ''}
                          onChange={(e) => updateJob('uraianPekerjaan', e.target.value)}
                          placeholder="Menyapu, mengepel, mencuci..."
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card 8: Tentang Jepang & Bahasa */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Tentang Jepang & Bahasa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Lama Ingin Tinggal di Jepang</label>
                    <input
                      type="text"
                      value={formData.lamaTinggalJepang || ''}
                      onChange={(e) => handleChange('lamaTinggalJepang', e.target.value)}
                      placeholder="e.g. 15 tahun"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Lama Belajar Bahasa Jepang</label>
                    <input
                      type="text"
                      value={formData.lamaBelajarBahasaJepang || ''}
                      onChange={(e) => handleChange('lamaBelajarBahasaJepang', e.target.value)}
                      placeholder="e.g. 3bulan"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 9: Kontak Darurat */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Kontak Darurat
                </h3>
                {(() => {
                  const emergency = formData.kontakDarurat || {
                    noHpDarurat: '',
                    namaPemilikNoDarurat: '',
                    hubunganDenganPelamar: ''
                  };

                  const updateEmergency = (field: string, val: string) => {
                    const nextEmergency = { ...emergency, [field]: val };
                    handleChange('kontakDarurat', nextEmergency);
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Nomor Darurat</label>
                        <input
                          type="text"
                          value={emergency.noHpDarurat || ''}
                          onChange={(e) => updateEmergency('noHpDarurat', e.target.value)}
                          placeholder="0895320375388"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Nama Pemilik Nomor</label>
                        <input
                          type="text"
                          value={emergency.namaPemilikNoDarurat || ''}
                          onChange={(e) => updateEmergency('namaPemilikNoDarurat', e.target.value)}
                          placeholder="Sidon"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Hubungan</label>
                        <input
                          type="text"
                          value={emergency.hubunganDenganPelamar || ''}
                          onChange={(e) => updateEmergency('hubunganDenganPelamar', e.target.value)}
                          placeholder="IBU"
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Card 10: Promosi Diri */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Promosi Diri
                </h3>
                <div className="text-xs">
                  <label className="block text-slate-600 font-semibold mb-1">Promosi Diri</label>
                  <textarea
                    rows={3}
                    value={formData.prKeunggulanDiri || ''}
                    onChange={(e) => handleChange('prKeunggulanDiri', e.target.value)}
                    placeholder="Tuliskan promosi diri atau keunggulan utama..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Card 11: Upload Dokumen (Exact pattern with view file & universal format upload) */}
              <CandidateDocumentUploadSection
                documents={formData.dokumenUpload || {}}
                onChange={(nextDocs) => {
                  handleChange('dokumenUpload', nextDocs);
                  if ((nextDocs as any).pasPhoto3x4) {
                    handleChange('pasFotoUrl', (nextDocs as any).pasPhoto3x4);
                  }
                  if ((nextDocs as any).videoJikoshoukai) {
                    handleChange('videoJikoshoukaiUrl', (nextDocs as any).videoJikoshoukai);
                  }
                }}
                candidateName={formData.namaLengkap}
                showSaveButton={true}
                onSave={handleSave}
                lang={lang}
              />

              {/* Card 12: Motivasi & Kelebihan (Indonesia) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Motivasi & Kelebihan (Indonesia)
                </h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kelebihan</label>
                    <textarea
                      rows={3}
                      value={formData.kelebihanAnda || ''}
                      onChange={(e) => handleChange('kelebihanAnda', e.target.value)}
                      placeholder="Saya punya rasa tanggung jawab tinggi..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Kekurangan</label>
                    <textarea
                      rows={3}
                      value={formData.kekuranganAnda || ''}
                      onChange={(e) => handleChange('kekuranganAnda', e.target.value)}
                      placeholder="Saya orang yang mudah khawatir..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Alasan ke Jepang</label>
                    <textarea
                      rows={3}
                      value={formData.alasanInginKeJepang || ''}
                      onChange={(e) => handleChange('alasanInginKeJepang', e.target.value)}
                      placeholder="Alasan ingin ke jepang karna..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Alasan Melamar Bidang</label>
                    <textarea
                      rows={3}
                      value={formData.alasanMelamarBidangIni || ''}
                      onChange={(e) => handleChange('alasanMelamarBidangIni', e.target.value)}
                      placeholder="Saya tertarik di bidang kaigo karna..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Alasan Kaigofukushishi</label>
                    <textarea
                      rows={3}
                      value={formData.alasanKaigo || ''}
                      onChange={(e) => handleChange('alasanKaigo', e.target.value)}
                      placeholder="Saya ingin menjadi kaigo fukushishi karena..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Impian Masa Depan</label>
                    <textarea
                      rows={3}
                      value={formData.impianMasaDepan || ''}
                      onChange={(e) => handleChange('impianMasaDepan', e.target.value)}
                      placeholder="Saat pulang saya ingin..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Hobi</label>
                    <input
                      type="text"
                      value={formData.hobi || ''}
                      onChange={(e) => handleChange('hobi', e.target.value)}
                      placeholder="Memasak dan menonton film"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Promosi Diri</label>
                    <textarea
                      rows={3}
                      value={formData.prKeunggulanDiri || ''}
                      onChange={(e) => handleChange('prKeunggulanDiri', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Deskripsi Magang</label>
                    <textarea
                      rows={3}
                      value={formData.deskripsiMagang || ''}
                      onChange={(e) => handleChange('deskripsiMagang', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Riwayat Relevan</label>
                    <textarea
                      rows={3}
                      value={formData.riwayatRelevan || ''}
                      onChange={(e) => handleChange('riwayatRelevan', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      value={formData.tempatLahir || ''}
                      onChange={(e) => handleChange('tempatLahir', e.target.value)}
                      placeholder="PEMALANG"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Alamat Lengkap</label>
                    <textarea
                      rows={2}
                      value={formData.alamatLengkap || ''}
                      onChange={(e) => handleChange('alamatLengkap', e.target.value)}
                      placeholder="Dsn Pesadean RT 002/RW 006, Desa Pesantren..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATUS PROGRES */}
          {activeTab === 'progres' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Manajemen Status Progres Kandidat
                  </h3>
                </div>
                {formData.kodeJob && (
                  <span className="bg-blue-100 text-blue-800 text-[11px] font-mono font-extrabold px-3 py-1 rounded-full border border-blue-200">
                    Linked Job: {formData.kodeJob}
                  </span>
                )}
              </div>

              {/* CARD INTEGRASI MANAJEMEN JOB */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>PILIH DARI DAFTAR JOB (MANAJEMEN JOB)</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded border border-blue-200">
                    {jobPostings.length} Lowongan Tersedia
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari Kode Job, Perusahaan, atau Judul..."
                      value={jobSearchTerm}
                      onChange={(e) => setJobSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <select
                    value={selectedJobId}
                    onChange={(e) => handleSelectJobAutoFill(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-semibold flex-1"
                  >
                    <option value="">-- Pilih Job untuk Auto-Fill Data --</option>
                    {filteredJobsForSelection.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.kodeJob ? `[${j.kodeJob}] ` : ''}{j.judulPekerjaan} - {getSanitizedCompany(j)} ({j.lokasiPrefektur || 'JP'})
                      </option>
                    ))}
                  </select>

                  {(selectedJobId || jobSearchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setJobSearchTerm('');
                        setSelectedJobId('');
                      }}
                      className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                      title="Reset Pilih Job"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-blue-700 italic">
                  * Memilih job akan otomatis mengisi Nama Perusahaan, Lokasi, Nama TSK, Bidang, dan Keterangan Detail Job.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Status Progres</label>
                    <select
                      value={formData.statusProgres || 'Belum Ada'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        handleChange('statusProgres', val);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="Belum Ada">-- Pilih Status --</option>
                      <option value="Nihongo check">Nihongo check</option>
                      <option value="Belum Lolos Nihongo check">Belum Lolos Nihongo check</option>
                      <option value="Pending Nunggu Job">Pending Nunggu Job</option>
                      <option value="Penjadwalan Interview">Penjadwalan Interview</option>
                      <option value="On Proses">On Proses</option>
                      <option value="Tidak Lolos Interview">Tidak Lolos Interview</option>
                      <option value="Status On Job (Selesai)">Status On Job (Selesai)</option>
                      <option value="Cancel">Cancel</option>
                      <option value="Terjadwal Interview">Terjadwal Interview</option>
                      <option value="Lolos Interview (Naitei)">Lolos Interview (Naitei)</option>
                      <option value="Proses Visas/COE">Proses Visas/COE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Nama TSK</label>
                    <input
                      type="text"
                      value={formData.namaTSK || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange('namaTSK', val);
                      }}
                      placeholder="Masukkan Nama TSK..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Nama Perusahaan</label>
                    <input
                      type="text"
                      value={formData.namaPerusahaanJp || ''}
                      onChange={(e) => handleChange('namaPerusahaanJp', e.target.value)}
                      placeholder="Masukkan Nama Perusahaan..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Lokasi Perusahaan</label>
                    <input
                      type="text"
                      value={formData.lokasiPerusahaanJp || ''}
                      onChange={(e) => handleChange('lokasiPerusahaanJp', e.target.value)}
                      placeholder="Masukkan lokasi di Jepang..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">Jadwal Keberangkatan</label>
                    <input
                      type="text"
                      value={formData.jadwalKeberangkatan || ''}
                      onChange={(e) => handleChange('jadwalKeberangkatan', e.target.value)}
                      placeholder="Contoh: April 2026 atau tanggal keberangkatan..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1.5">COE Terbit</label>
                    <input
                      type="text"
                      value={formData.coeTerbit || ''}
                      onChange={(e) => handleChange('coeTerbit', e.target.value)}
                      placeholder="Contoh: Terbit / Diproses / Belum Terbit..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Keterangan Progres (Update Harian)</label>
                  <textarea
                    rows={3}
                    value={formData.keteranganProgres || ''}
                    onChange={(e) => handleChange('keteranganProgres', e.target.value)}
                    placeholder="Masukkan catatan perkembangan progres harian kandidat..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Keterangan Tambahan / Detail Job</label>
                  <textarea
                    rows={4}
                    value={formData.detailProgres || ''}
                    onChange={(e) => handleChange('detailProgres', e.target.value)}
                    placeholder="Informasi detail job akan muncul di sini secara otomatis saat job dipilih..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Progres</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SERTIFIKAT */}
          {activeTab === 'sertifikat' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Sertifikat & Bahasa Jepang Kandidat</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSaveSuccessMsg('Ekstraksi sertifikat berhasil!');
                    setTimeout(() => setSaveSuccessMsg(null), 3000);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ekstraksi Sertifikat</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Level Bahasa Jepang (JLPT / JFT)</label>
                  <select
                    value={formData.levelBahasaJepang || 'N4'}
                    onChange={(e) => handleChange('levelBahasaJepang', e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="N1">JLPT N1</option>
                    <option value="N2">JLPT N2</option>
                    <option value="N3">JLPT N3</option>
                    <option value="N4">JLPT N4</option>
                    <option value="N5">JLPT N5</option>
                    <option value="JFT-Basic">JFT-Basic A2</option>
                    <option value="Belum Sertifikasi">Belum Sertifikasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Skor JLPT / JFT</label>
                  <input
                    type="text"
                    value={formData.skorJftAtauJlpt || ''}
                    onChange={(e) => handleChange('skorJftAtauJlpt', e.target.value)}
                    placeholder="Contoh: 215/250 (LULUS)"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Sertifikat SSW Terdaftar</label>
                  <input
                    type="text"
                    value={formData.sertifikatSsw ? formData.sertifikatSsw.join(', ') : ''}
                    onChange={(e) => handleChange('sertifikatSsw', e.target.value.split(',').map(s => s.trim()))}
                    placeholder="Contoh: Kaigo (Keperawatan), Pengolahan Makanan, Manufaktur"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Link Video Jikoshoukai / Perkenalan</label>
                  <input
                    type="text"
                    value={formData.videoJikoshoukaiUrl || ''}
                    onChange={(e) => handleChange('videoJikoshoukaiUrl', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TERJEMAHAN JEPANG (Request 3) */}
          {activeTab === 'terjemahan' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-purple-900 text-sm flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Terjemahan Otomatis ke Bahasa Jepang (EYD Jepang Standard JIS)</span>
                  </h3>
                  <p className="text-xs text-purple-700 mt-1">
                    Setiap terjemahan dapat diedit secara bebas oleh Admin. Klik tombol Auto Translate untuk memperbarui ke EYD Jepang secara otomatis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoTranslateAI}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-purple-600/20 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Auto Translate AI (EYD Jepang)</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Name Katakana */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    氏名フリガナ (Nama Katakana / Transliterasi)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.namaKatakana || ''}
                      onChange={(e) => handleChange('namaKatakana', e.target.value)}
                      placeholder="e.g. シティ・ファティマ・アズ・ザフラ"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('namaKatakana', transliterateNameToKatakana(formData.namaLengkap))}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg font-bold text-[11px] shrink-0"
                    >
                      Katakana Auto
                    </button>
                  </div>
                </div>

                {/* Kelebihan (長所) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    長所 (Kelebihan Diri - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.kelebihanAndaJp || ''}
                    onChange={(e) => handleChange('kelebihanAndaJp', e.target.value)}
                    placeholder="私の長所は..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.kelebihanAnda || '-'}
                  </span>
                </div>

                {/* Kekurangan (短所) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    短所 (Kekurangan Diri - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.kekuranganAndaJp || ''}
                    onChange={(e) => handleChange('kekuranganAndaJp', e.target.value)}
                    placeholder="私の短所は..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.kekuranganAnda || '-'}
                  </span>
                </div>

                {/* Alasan Ingin Ke Jepang (来日理由) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    来日理由 (Alasan Ingin ke Jepang - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.alasanInginKeJepangJp || ''}
                    onChange={(e) => handleChange('alasanInginKeJepangJp', e.target.value)}
                    placeholder="日本の高度な技術..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.alasanInginKeJepang || '-'}
                  </span>
                </div>

                {/* Alasan Melamar Bidang Ini (職業希望理由) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    職業希望理由 (Alasan Melamar Bidang Ini - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.alasanMelamarBidangIniJp || ''}
                    onChange={(e) => handleChange('alasanMelamarBidangIniJp', e.target.value)}
                    placeholder="この専門分野で..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.alasanMelamarBidangIni || '-'}
                  </span>
                </div>

                {/* Alasan Kaigo (介護志望理由) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    介護志望理由 (Alasan Kaigo - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.alasanKaigoJp || ''}
                    onChange={(e) => handleChange('alasanKaigoJp', e.target.value)}
                    placeholder="お年寄りの方々に寄り添い..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.alasanKaigo || '-'}
                  </span>
                </div>

                {/* Self PR (自己PR) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    自己PR (Self PR / Keunggulan Diri - Terjemahan Jepang)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.prKeunggulanDiriJp || ''}
                    onChange={(e) => handleChange('prKeunggulanDiriJp', e.target.value)}
                    placeholder="常に前向きな姿勢で..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none leading-relaxed"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.prKeunggulanDiri || '-'}
                  </span>
                </div>

                {/* Hobi (趣味) */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1">
                    趣味・特技 (Hobi - Terjemahan Jepang)
                  </label>
                  <input
                    type="text"
                    value={formData.hobiJp || ''}
                    onChange={(e) => handleChange('hobiJp', e.target.value)}
                    placeholder="読書、日本語学習、スポーツ"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 italic block mt-0.5">
                    Indonesian: {formData.hobi || '-'}
                  </span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Terjemahan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PEMBIAYAAN KEBERANGKATAN & DANA TALANG (ADMIN 2) */}
          {activeTab === 'pembiayaan' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-2 border border-purple-900/40">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                  <Receipt className="w-4 h-4" />
                  <span className="uppercase tracking-wider">Pembiayaan Keberangkatan & Penempatan Kerja Jepang</span>
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  Khusus Biaya Keberangkatan (Terpisah dari Biaya Pelatihan Diklat LPK Admin Siswa)
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Tersedia hanya 2 mekanisme resmi untuk kandidat <strong className="text-white">{candidate.namaLengkap}</strong>: <strong className="text-emerald-400">DANA TALANG 100%</strong> (DP 0%, cicilan potong gaji di Jepang) atau <strong className="text-amber-400">DANA MANDIRI</strong> (Pembayaran mandiri via billing LPK IJEF).
                </p>
              </div>

              {/* Simulation Calculation Card */}
              {(() => {
                const targetJob = jobPostings.find(
                  (j) => j.id === candidate.kodeJob || j.kodeJob === candidate.kodeJob || j.id === selectedJobId
                );

                const depSim = calculateDepartureFinancing(
                  skemaKeberangkatan,
                  costKeberangkatan,
                  pilihanTenor,
                  targetJob
                    ? {
                        jobId: targetJob.id,
                        kodeJob: targetJob.kodeJob,
                        judulJob: targetJob.judulPekerjaan,
                        perusahaanJepang: targetJob.perusahaanJepang,
                        lokasiPrefektur: targetJob.lokasiPrefektur,
                        gajiBulananYen: targetJob.gajiBulananYen,
                        biayaProses: targetJob.biayaProses
                      }
                    : undefined
                );

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 text-xs">
                    {/* Mechanism Selection (2 Options Only) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        onClick={() => setSkemaKeberangkatan('DANA_TALANG_100')}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start space-x-3 ${
                          skemaKeberangkatan === 'DANA_TALANG_100'
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          skemaKeberangkatan === 'DANA_TALANG_100' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? <Check className="w-4 h-4" /> : '1'}
                        </div>
                        <div>
                          <strong className="block font-black text-xs">DANA TALANG 100%</strong>
                          <span className="text-[11px] text-slate-600">DP 0% • Ditalangi Penuh • Potong Gaji di Jepang</span>
                        </div>
                      </div>

                      <div
                        onClick={() => setSkemaKeberangkatan('DANA_MANDIRI')}
                        className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-start space-x-3 ${
                          skemaKeberangkatan === 'DANA_MANDIRI'
                            ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-amber-300 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          skemaKeberangkatan === 'DANA_MANDIRI' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {skemaKeberangkatan === 'DANA_MANDIRI' ? <Check className="w-4 h-4" /> : '2'}
                        </div>
                        <div>
                          <strong className="block font-black text-xs">DANA MANDIRI</strong>
                          <span className="text-[11px] text-slate-600">Bunga 0% • Bayar Mandiri Sebelum Terbang • Bebas Cicilan</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Nominal Biaya Keberangkatan</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={costKeberangkatan}
                            onChange={(e) => setCostKeberangkatan(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        {targetJob && (
                          <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">
                            Job: {targetJob.judulPekerjaan} ({targetJob.biayaProses || formatRupiah(costKeberangkatan)})
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? 'Pilihan Tenor Potong Gaji (Bulan)' : 'Ketentuan Tenor'}
                        </label>
                        {skemaKeberangkatan === 'DANA_TALANG_100' ? (
                          <select
                            value={pilihanTenor}
                            onChange={(e) => setPilihanTenor(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value={6}>6 Bulan</option>
                            <option value={12}>12 Bulan (Standar)</option>
                            <option value={18}>18 Bulan</option>
                            <option value={24}>24 Bulan</option>
                            <option value={36}>36 Bulan (Ringan)</option>
                          </select>
                        ) : (
                          <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500">
                            Bebas Tenor (Pelunasan Mandiri)
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Status Persetujuan Multi-Tier</label>
                        <select
                          value={statusPersetujuan}
                          onChange={(e: any) => setStatusPersetujuan(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="DRAFT">1. DRAFT (Belum Diajukan)</option>
                          <option value="PENGAJUAN">2. TAHAP 1: Pengajuan Pemohon / Siswa</option>
                          <option value="VERIFIKASI_ADMIN">3. TAHAP 2: Verifikasi Admin LPK</option>
                          <option value="APPROVAL_MANAGER">4. TAHAP 3: Approval User Manager</option>
                          <option value="DISETUJUI">5. TAHAP 4: Disetujui Final (General Manager)</option>
                          <option value="DITOLAK">DITOLAK (Pengajuan Belum Layak)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Penjamin Terdaftar</label>
                        <input
                          type="text"
                          readOnly
                          value={existingDana?.namaPenjamin || candidate.namaAyah || 'Penjamin Keluarga'}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Calculated Output Metrics Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Uang Muka (DP Awal Siswa)</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                          {formatRupiah(depSim.uangMukaDp)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? 'DP 0% (Tanpa DP)' : 'Pelunasan Mandiri'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Plafond Dana Talang 100%</span>
                        <span className="text-sm font-black text-emerald-800 font-mono">
                          {formatRupiah(depSim.plafondDanaTalang)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? '100% Ditalangi LPK' : 'Rp 0'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? `Potong Gaji Bulanan di Jepang` : 'Sisa Cicilan'}
                        </span>
                        <span className="text-sm font-black text-purple-900 font-mono">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? (
                            <>
                              {formatRupiah(depSim.angsuranPerBulanIdr)}
                              <span className="text-xs text-purple-700 ml-1">(± ¥{depSim.angsuranPerBulanYen.toLocaleString('ja-JP')})</span>
                            </>
                          ) : (
                            'Rp 0 (Bebas Cicilan)'
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {skemaKeberangkatan === 'DANA_TALANG_100' ? `Selama ${pilihanTenor} bulan bekerja` : 'Gaji diterima utuh di Jepang'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Catatan Verifikasi / Approval Admin</label>
                      <textarea
                        rows={2}
                        value={catatanApproval}
                        onChange={(e) => setCatatanApproval(e.target.value)}
                        placeholder="Contoh: Berkas persyaratan penjamin lengkap, lowongan dan skema pembiayaan keberangkatan disetujui."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Mekanisme Keberangkatan Tersinkron ke Modul Pembiayaan Admin Doc</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const finRecord: AplikasiDukunganDana = {
                            id: existingDana?.id || `DEPART-${candidate.id}`,
                            siswaId: candidate.id,
                            namaSiswa: candidate.namaLengkap || 'Siswa',
                            jobId: targetJob?.id,
                            kodeJob: targetJob?.kodeJob || candidate.kodeJob,
                            judulJob: targetJob?.judulPekerjaan,
                            perusahaanJepang: targetJob?.perusahaanJepang,
                            biayaJobDetail: targetJob?.biayaProses || formatRupiah(costKeberangkatan),
                            namaPenjamin: existingDana?.namaPenjamin || candidate.namaAyah || 'Penjamin Keluarga',
                            ktpPenjamin: existingDana?.ktpPenjamin || candidate.ktpNpwpAyah || '3271000000000000',
                            npwpPenjamin: existingDana?.npwpPenjamin || '-',
                            pekerjaanPenjamin: (existingDana?.pekerjaanPenjamin || 'Wiraswasta') as any,
                            hubunganPenjamin: (existingDana?.hubunganPenjamin || 'Orang Tua') as any,
                            alamatPenjamin: existingDana?.alamatPenjamin || candidate.alamatDomisili || candidate.alamatLengkap || '-',
                            noHpPenjamin: existingDana?.noHpPenjamin || candidate.noHp || '-',
                            programOption: skemaKeberangkatan === 'DANA_TALANG_100' ? 'DT 100%' : 'MANDIRI',
                            biayaTotal: costKeberangkatan,
                            uangMukaDp: depSim.uangMukaDp,
                            plafondPinjaman: depSim.plafondDanaTalang,
                            tenorBulan: pilihanTenor,
                            angsuranPerBulan: depSim.angsuranPerBulanIdr,
                            tanggalPengajuan: existingDana?.tanggalPengajuan || new Date().toISOString().split('T')[0],
                            skemaPilihan: skemaKeberangkatan === 'DANA_TALANG_100' ? 'DT_100' : 'MANDIRI',
                            nominalDP: depSim.uangMukaDp,
                            nominalPinjaman: depSim.plafondDanaTalang,
                            pilihanTenor,
                            statusPersetujuan,
                            dokumenPendukung: existingDana?.dokumenPendukung || {
                              ktpPemohon: true,
                              ktpPenjamin: true,
                              kkPenjamin: true,
                              slipGajiSuratKeterangan: true
                            },
                            catatanApproval,
                            // Specific Departure Financing Fields
                            skemaKeberangkatan,
                            biayaKeberangkatan: costKeberangkatan,
                            angsuranPerBulanYen: depSim.angsuranPerBulanYen,
                            estimasiGajiYen: depSim.estimasiGajiYen,
                            sisaGajiBersihYen: depSim.sisaGajiBersihYen,
                            komponenBillingKeberangkatan: depSim.komponenBilling,
                            jadwalTerminKeberangkatan: depSim.jadwalTermin,
                            rincianCicilanJepang: depSim.rincianCicilanJepang,
                            createdAt: existingDana?.createdAt || new Date().toISOString()
                          };

                          saveFinancingRecord(finRecord);
                          setSaveSuccessMsg(`Data Pembiayaan Keberangkatan (${skemaKeberangkatan === 'DANA_TALANG_100' ? 'DANA TALANG 100%' : 'DANA MANDIRI'}) berhasil disimpan & disinkronkan!`);
                          setTimeout(() => setSaveSuccessMsg(null), 3500);
                        }}
                        className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-purple-700/20 transition flex items-center space-x-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Simpan Pembiayaan Keberangkatan</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 6: MCU & ASESMEN (MEDICAL CHECK-UP, DISC & PSIKOTES) */}
          {activeTab === 'mcu-asesmen' && (
            <div className="space-y-6">
              {/* Top Overview Banner: Ringkasan Kelayakan & Kesiapan */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      {lang === 'ja' ? '選考適性・健康ステータス' : 'Status Kelayakan & Kesiapan Kerja'}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        healthForm.statusFit === 'FIT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : healthForm.statusFit === 'NOTE'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      MCU: {healthForm.statusFit || 'BELUM'}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        psikotesForm.statusKelulusan === 'LULUS'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      PSIKOTES: {psikotesForm.statusKelulusan || 'LULUS'} ({psikotesForm.scorePercentage}%)
                    </span>
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase border bg-blue-100 text-blue-800 border-blue-300">
                      DISC: {discForm.dominantType || 'Steadiness'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    {lang === 'ja'
                      ? '健康診断、性格診断（DISC）、適性検査の記録を同期し、受入企業・面接向けプロファイルを最新に保ちます。'
                      : 'Kelola dan sinkronkan hasil Medical Check-Up, tes kepribadian DISC, dan skor psikotes untuk keperluan matching & interview perusahaan Jepang.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveMcuAndAsesmen}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{lang === 'ja' ? 'MCU・適性データを保存' : 'Simpan Data MCU & Asesmen'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 1: MEDICAL CHECK-UP (MCU) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {lang === 'ja' ? '1. 健康診断結果 (Medical Check-Up)' : '1. Hasil Medical Check-Up (MCU / Kesehatan)'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'ja' ? '日本就業・特定技能向け身体測定及び検査結果' : 'Parameter fisik, antropometri, dan hasil uji laboratorium'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-slate-600">{lang === 'ja' ? '判定結果:' : 'Status Kelayakan:'}</label>
                    <select
                      value={healthForm.statusFit || 'FIT'}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, statusFit: e.target.value as any }))}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="FIT">FIT (Layak / Sehat Prima)</option>
                      <option value="NOTE">NOTE / CATATAN (Perlu Observasi / Terapi Ringan)</option>
                      <option value="UNFIT">UNFIT (Tidak Memenuhi Syarat Medis)</option>
                      <option value="PENDING">PENDING (Menunggu Hasil Lab)</option>
                    </select>
                  </div>
                </div>

                {/* Form Fields Grid: Medis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tanggal Pemeriksaan MCU</label>
                    <input
                      type="date"
                      value={healthForm.tanggalMCU || ''}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, tanggalMCU: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Klinik / Laboratorium</label>
                    <input
                      type="text"
                      value={healthForm.klinikLaboratorium || ''}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, klinikLaboratorium: e.target.value }))}
                      placeholder="e.g. Klinik Medika Utama IJEF"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Dokter Pemeriksa</label>
                    <input
                      type="text"
                      value={healthForm.dokterPemeriksa || ''}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, dokterPemeriksa: e.target.value }))}
                      placeholder="e.g. dr. Hendra Kurniawan, Sp.Ok"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tekanan Darah & Nadi</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={healthForm.tekananDarah || ''}
                        onChange={(e) => setHealthForm((prev) => ({ ...prev, tekananDarah: e.target.value }))}
                        placeholder="120/80 mmHg"
                        className="bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="number"
                        value={healthForm.denyutNadi || 76}
                        onChange={(e) => setHealthForm((prev) => ({ ...prev, denyutNadi: Number(e.target.value) }))}
                        placeholder="76 bpm"
                        className="bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tinggi Badan (cm)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={healthForm.tinggiBadan || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setHealthForm((prev) => ({ ...prev, tinggiBadan: val === '' ? 0 : Number(val) }));
                      }}
                      placeholder="e.g. 168"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Berat Badan (kg)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={healthForm.beratBadan || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setHealthForm((prev) => ({ ...prev, beratBadan: val === '' ? 0 : Number(val) }));
                      }}
                      placeholder="e.g. 58"
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                    />
                  </div>

                  {/* BMI Visual Badge */}
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Indeks Massa Tubuh (BMI)</label>
                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 flex items-center justify-between">
                      <span className="font-mono font-extrabold text-slate-900">{currentBmi}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${bmiCategory.color}`}>
                        {bmiCategory.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tes Buta Warna</label>
                    <select
                      value={typeof healthForm.butaWarna === 'string' ? healthForm.butaWarna : (healthForm.butaWarna ? 'Ya' : 'Normal')}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, butaWarna: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="Normal">Normal (Bebas Buta Warna)</option>
                      <option value="Parsial">Parsial (Buta Warna Sebagian)</option>
                      <option value="Total">Total (Buta Warna Total)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Visus Mata (Kiri / Kanan)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={healthForm.visusMataKiri || '6/6'}
                        onChange={(e) => setHealthForm((prev) => ({ ...prev, visusMataKiri: e.target.value }))}
                        placeholder="Kiri: 6/6"
                        className="bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        value={healthForm.visusMataKanan || '6/6'}
                        onChange={(e) => setHealthForm((prev) => ({ ...prev, visusMataKanan: e.target.value }))}
                        placeholder="Kanan: 6/6"
                        className="bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Rontgen Paru (Thorax)</label>
                    <select
                      value={healthForm.hasilRontgenParu || 'Normal / Jernih'}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, hasilRontgenParu: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="Normal / Jernih">Normal / Jernih (Bebas TBC)</option>
                      <option value="Bercak / Suspek TBC">Bercak / Suspek TBC (Perlu Observasi)</option>
                      <option value="Belum Tes">Belum Tes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Hepatitis B (HBsAg)</label>
                    <select
                      value={healthForm.hasilHbsAg || 'Non-Reaktif (Bebas Hep B)'}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, hasilHbsAg: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="Non-Reaktif (Bebas Hep B)">Non-Reaktif (Negatif)</option>
                      <option value="Reaktif">Reaktif (Positif)</option>
                      <option value="Belum Tes">Belum Tes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tes Narkoba (Urine)</label>
                    <select
                      value={healthForm.hasilTesUrine || 'Bebas Narkoba (Negatif)'}
                      onChange={(e) => setHealthForm((prev) => ({ ...prev, hasilTesUrine: e.target.value }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="Bebas Narkoba (Negatif)">Bebas Narkoba (Negatif)</option>
                      <option value="Positif">Positif</option>
                      <option value="Belum Tes">Belum Tes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Catatan Dokter Pemeriksa</label>
                  <textarea
                    rows={2}
                    value={healthForm.catatanDokter || ''}
                    onChange={(e) => setHealthForm((prev) => ({ ...prev, catatanDokter: e.target.value }))}
                    placeholder="Catatan hasil evaluasi dokter faskes..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* CARD 2: ASESMEN KEPRIBADIAN (DISC) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {lang === 'ja' ? '2. 性格特性診断 (DISC Profile)' : '2. Asesmen Kepribadian (Profil DISC)'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'ja' ? '職務適合性・協調性・コミュニケーション傾向の分析' : 'Kesesuaian karakter kerja, kedisiplinan, dan orientasi kerja tim'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-slate-600">Tipe Dominan:</label>
                    <select
                      value={discForm.dominantType || 'Steadiness'}
                      onChange={(e) => setDiscForm((prev) => ({ ...prev, dominantType: e.target.value as any }))}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="Dominance">Dominance (Tegas & Orientasi Target)</option>
                      <option value="Influence">Influence (Komunikatif & Antusias)</option>
                      <option value="Steadiness">Steadiness (Stabil, Loyal & Kerja Sama)</option>
                      <option value="Compliance">Compliance (Teliti, Taat SOP & Presisi)</option>
                    </select>
                  </div>
                </div>

                {/* DISC Score Visual Bars & Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* D */}
                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-rose-900">
                      <span>D (Dominance)</span>
                      <span className="font-mono font-black">{discForm.skorD}%</span>
                    </div>
                    <div className="w-full bg-rose-200/60 rounded-full h-2 overflow-hidden">
                      <div className="bg-rose-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, discForm.skorD || 0))}%` }} />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discForm.skorD ?? 45}
                      onChange={(e) => setDiscForm((prev) => ({ ...prev, skorD: Number(e.target.value) }))}
                      className="w-full bg-white border border-rose-300 rounded-lg p-1.5 text-xs text-rose-950 font-bold outline-none"
                    />
                  </div>

                  {/* I */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                      <span>I (Influence)</span>
                      <span className="font-mono font-black">{discForm.skorI}%</span>
                    </div>
                    <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                      <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, discForm.skorI || 0))}%` }} />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discForm.skorI ?? 55}
                      onChange={(e) => setDiscForm((prev) => ({ ...prev, skorI: Number(e.target.value) }))}
                      className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-amber-950 font-bold outline-none"
                    />
                  </div>

                  {/* S */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                      <span>S (Steadiness)</span>
                      <span className="font-mono font-black">{discForm.skorS}%</span>
                    </div>
                    <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, discForm.skorS || 0))}%` }} />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discForm.skorS ?? 85}
                      onChange={(e) => setDiscForm((prev) => ({ ...prev, skorS: Number(e.target.value) }))}
                      className="w-full bg-white border border-emerald-300 rounded-lg p-1.5 text-xs text-emerald-950 font-bold outline-none"
                    />
                  </div>

                  {/* C */}
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                      <span>C (Compliance)</span>
                      <span className="font-mono font-black">{discForm.skorC}%</span>
                    </div>
                    <div className="w-full bg-blue-200/60 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, discForm.skorC || 0))}%` }} />
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discForm.skorC ?? 75}
                      onChange={(e) => setDiscForm((prev) => ({ ...prev, skorC: Number(e.target.value) }))}
                      className="w-full bg-white border border-blue-300 rounded-lg p-1.5 text-xs text-blue-950 font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-xs">
                    Analisis Karakter & Kesesuaian Budaya Kerja Jepang
                  </label>
                  <textarea
                    rows={2}
                    value={discForm.analisisKarakter || ''}
                    onChange={(e) => setDiscForm((prev) => ({ ...prev, analisisKarakter: e.target.value }))}
                    placeholder="Contoh: Sangat kooperatif dalam tim, memiliki tingkat kesabaran tinggi dalam pekerjaan berulang (manufacturing/caregiver)..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* CARD 3: ASESMEN PSIKOTES & KEMAMPUAN KOGNITIF */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {lang === 'ja' ? '3. 適性検査・認知能力 (Psikotes)' : '3. Asesmen Psikotes & Kemampuan Kognitif'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'ja' ? '論理的思考力・計算力・言語力・正確性のスコア' : 'Daya tangkap logika, numerik, ketelitian, dan daya tahan kerja'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold text-slate-600">Status Kelulusan:</label>
                    <select
                      value={psikotesForm.statusKelulusan || 'LULUS'}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, statusKelulusan: e.target.value }))}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-800 focus:ring-2 focus:ring-purple-500 outline-none cursor-pointer"
                    >
                      <option value="LULUS">LULUS (Memenuhi Standar Kualifikasi)</option>
                      <option value="TIDAK LULUS">TIDAK LULUS</option>
                      <option value="REMIDI">REMIDI / TES ULANG</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Skor Total (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesForm.scorePercentage ?? 85}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, scorePercentage: Number(e.target.value) }))}
                      className="w-full bg-purple-50 border border-purple-300 rounded-lg p-2 text-purple-950 font-extrabold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Penalaran Logika</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesForm.skorLogika ?? 82}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, skorLogika: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Aritmetika / Numerik</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesForm.skorKuantitatif ?? 80}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, skorKuantitatif: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Verbal / Instruksi</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesForm.skorVerbal ?? 86}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, skorVerbal: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Ketelitian & Ketahanan</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesForm.skorKetelitian ?? 92}
                      onChange={(e) => setPsikotesForm((prev) => ({ ...prev, skorKetelitian: Number(e.target.value) }))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-3">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Data MCU, DISC, & Psikotes tersinkron otomatis ke database kesehatan & profil calon siswa</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMcuAndAsesmen}
                    className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-purple-700/20 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{lang === 'ja' ? 'MCU・適性検査データを保存' : 'Simpan Data MCU & Asesmen'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Bar - Full Screen Mode */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Tersinkronisasi Otomatis ke Database Admin Siswa & Admin Doc (CV Rirekisho Portal)</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
