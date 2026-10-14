import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useEcosystemTranslation } from '../hooks/useEcosystemTranslation';
import { useSyncCRMLead } from '../hooks/useSyncCRMLead';
import { MedicalCheckup } from './MedicalCheckup';
import {
  CalonSiswa,
  CandidateCategory,
  Gender,
  Religion,
  BloodType,
  MaritalStatus,
  HasilKesehatan,
  AsesmenPsikotes,
  AsesmenDisc
} from '../types';
import { PSIKOTES_QUESTIONS } from '../data/psikotesQuestions';
import { DISC_QUESTIONS } from '../data/discQuestions';
import { gradePsikotes } from '../utils/psikotesGrader';
import { calculateDiscResult } from '../utils/discCalculator';
import {
  saveCalonSiswaToFirestore,
  savePsikotesToFirestore,
  saveDiscToFirestore,
  saveHealthToFirestore,
  uploadDocumentToFirebaseStorage
} from '../lib/firebase';
import { isIjefCategory, CANDIDATE_CATEGORY_OPTIONS, calculateAgeFromBirthDate } from '../utils/candidateUtils';
import { translateCandidateCategory } from '../utils/mitraJobUtils';
import { CandidateDocumentUploadSection } from './cvportal/CandidateDocumentUploadSection';
import {
  User,
  UserPlus,
  FileText,
  CheckCircle2,
  UploadCloud,
  Brain,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  Award,
  Sparkles,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  HeartPulse,
  Activity,
  Check,
  Loader2,
  Lock,
  XCircle,
  RotateCcw,
  Info,
  Users,
  Building,
  CheckSquare,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Globe,
  Building2,
  Video,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Layers,
  Eye,
  Zap,
  Maximize2,
  Minimize2,
  ArrowLeft
} from 'lucide-react';

export interface CandidatePortalProps {
  activePortalSubTab?: 'pendaftaran' | 'kesehatan' | 'disc' | 'psikotes' | 'status';
  setActivePortalSubTab?: (tab: 'pendaftaran' | 'kesehatan' | 'disc' | 'psikotes' | 'status') => void;
  formStep?: number;
  setFormStep?: (step: number) => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  activePortalSubTab: propSubTab,
  setActivePortalSubTab: propSetSubTab,
  formStep: propFormStep,
  setFormStep: propSetFormStep
}) => {
  const { user } = useAuth();
  const {
    students,
    activeStudent,
    saveStudentRegistration,
    saveHealthRecord,
    savePsikotesRecord,
    saveDiscRecord,
    healthRecords,
    psikotesRecords,
    discRecords,
    rirekishoRecords,
    saveRirekishoRecord
  } = useApp();

  const {
    lang,
    isJapanese,
    setLang,
    scoped: tCandidate,
    bilingual
  } = useEcosystemTranslation('candidatePortal');

  // Active Student Tab within Candidate Portal (strictly student view)
  const [internalSubTab, setInternalSubTab] = useState<
    'pendaftaran' | 'kesehatan' | 'disc' | 'psikotes' | 'status'
  >('pendaftaran');

  // Step state for Multi-Step Form (1: Demographics, 2: Family Data, 3: Self Health Screening, 4: Document Upload)
  const [internalFormStep, setInternalFormStep] = useState<number>(1);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);

  const activePortalSubTab = propSubTab !== undefined ? propSubTab : internalSubTab;
  const setActivePortalSubTab = propSetSubTab || setInternalSubTab;

  const formStep = propFormStep !== undefined ? propFormStep : internalFormStep;
  const setFormStep = propSetFormStep || setInternalFormStep;

  // Execute Email-Based Data Sync & Auto-Fill from 'crm_leads' collection
  const { leadData, isSynced: crmIsSynced, loading: crmSyncLoading } = useSyncCRMLead();

  // Candidate Registration Form State
  const [formData, setFormData] = useState<CalonSiswa>(() => {
    const existingByEmail = user?.email
      ? students.find((s) => s.email?.toLowerCase().trim() === user.email?.toLowerCase().trim())
      : undefined;
    if (existingByEmail) return existingByEmail;
    if (activeStudent) return activeStudent;

    return {
      id: `SISWA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      namaLengkap: user?.displayName || '',
      noHp: '',
      email: user?.email || '',
      kategoriKandidat: leadData?.kategoriKandidat || 'SISWA MITRA / NON IJEF',
      kewarganegaraan: 'WNI',
      noKtp: '',
      noKk: '',
      alamatDomisili: '',
      tempatLahir: '',
      tanggalLahir: '2002-05-15',
      agama: 'Islam',
      jenisKelamin: 'Laki-laki',
      golonganDarah: 'O',
      statusPerkawinan: 'Lajang',
      namaAyah: '',
      pekerjaanAyah: 'Wiraswasta',
      ktpNpwpAyah: '',
      namaIbu: '',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      ktpNpwpIbu: '',
      berkasDokumen: {},
      statusPendaftaran: 'Draft',
      createdAt: new Date().toISOString()
    };
  });

  // Check candidate category: strictly "SISWA IJEF - Offline" or "SISWA IJEF - Online" required for MCU, DISC & Psikotes
  const isIjef = isIjefCategory(formData.kategoriKandidat);
  const isNonIjefMatching = !isIjef;

  // Sync email & category from CRM lead without auto-overwriting user manual inputs for Nama & WhatsApp
  useEffect(() => {
    if (leadData && crmIsSynced) {
      setFormData((prev) => {
        const nextEmail = leadData.email || prev.email;
        const nextCat = prev.kategoriKandidat || leadData.kategoriKandidat || 'SISWA NON IJEF';
        if (prev.email === nextEmail && prev.kategoriKandidat === nextCat) {
          return prev;
        }
        return {
          ...prev,
          email: nextEmail,
          kategoriKandidat: nextCat
        };
      });
    }
  }, [leadData?.email, leadData?.kategoriKandidat, crmIsSynced]);

  // Health Screening Self-Declaration State
  const [healthData, setHealthData] = useState({
    riwayatPenyakitSerius: 'Tidak Ada',
    riwayatTbc: 'Tidak',
    riwayatHepatitis: 'Tidak',
    penyakitAsma: 'Tidak',
    riwayatOperasi: 'Tidak',
    kecelakaanParah: 'Tidak',
    perokokAktif: 'Tidak',
    pecanduAlkohol: 'Tidak',
    kepemilikanTato: 'Tidak'
  });

  // File Uploading & Firebase Storage State
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Psikotes 50 Soal Answers & Pagination State
  const [psikotesAnswers, setPsikotesAnswers] = useState<Record<number, string>>(() => {
    if (activeStudent && psikotesRecords[activeStudent.id]?.userAnswers) {
      return psikotesRecords[activeStudent.id].userAnswers;
    }
    return {};
  });
  const [psikotesPage, setPsikotesPage] = useState<number>(1); // 10 pages x 5 questions
  const QUESTIONS_PER_PAGE = 5;

  // DISC Test Answers State
  const [discAnswers, setDiscAnswers] = useState<Record<number, { most: string; least: string }>>(() => {
    if (activeStudent && discRecords[activeStudent.id]?.userAnswers) {
      return discRecords[activeStudent.id].userAnswers;
    }
    return {};
  });

  // UI Feedback Toast & Loading states
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when activeStudent changes
  useEffect(() => {
    const currentStudent = activeStudent || (user?.email
      ? students.find((s) => s.email?.toLowerCase().trim() === user.email?.toLowerCase().trim())
      : null);

    if (currentStudent) {
      setFormData(currentStudent);
      if (psikotesRecords[currentStudent.id]?.userAnswers) {
        setPsikotesAnswers(psikotesRecords[currentStudent.id].userAnswers);
      } else {
        setPsikotesAnswers({});
      }
      if (discRecords[currentStudent.id]?.userAnswers) {
        setDiscAnswers(discRecords[currentStudent.id].userAnswers);
      } else {
        setDiscAnswers({});
      }
      if (healthRecords[currentStudent.id]) {
        const h = healthRecords[currentStudent.id];
        setHealthData({
          riwayatPenyakitSerius: h.riwayatPenyakitSerius || 'Tidak Ada',
          riwayatTbc: h.riwayatTbc || 'Tidak',
          riwayatHepatitis: h.riwayatHepatitis || 'Tidak',
          penyakitAsma: h.penyakitAsma || 'Tidak',
          riwayatOperasi: h.riwayatOperasi || 'Tidak',
          kecelakaanParah: h.kecelakaanParah || 'Tidak',
          perokokAktif: h.perokokAktif || 'Tidak',
          pecanduAlkohol: h.pecanduAlkohol || 'Tidak',
          kepemilikanTato: h.kepemilikanTato || 'Tidak'
        } as any);
      }
    }
  }, [activeStudent?.id, user?.email]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleInputChange = (field: keyof CalonSiswa, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'tanggalLahir' && value) {
        updated.umur = calculateAgeFromBirthDate(value, prev.umur || 22);
      }
      if (field === 'kategoriKandidat') {
        saveStudentRegistration(updated);
      }
      return updated;
    });
  };

  // Handle Firebase Storage File Upload
  const handleFileUpload = async (docKey: string, file: File) => {
    if (!file) return;

    setUploadingFiles((prev) => ({ ...prev, [docKey]: true }));
    setUploadProgress((prev) => ({ ...prev, [docKey]: 10 }));

    try {
      const downloadUrl = await uploadDocumentToFirebaseStorage(
        formData.id,
        docKey,
        file,
        (progress) => {
          setUploadProgress((prev) => ({ ...prev, [docKey]: progress }));
        }
      );

      setFormData((prev) => ({
        ...prev,
        berkasDokumen: {
          ...prev.berkasDokumen,
          [docKey]: downloadUrl
        }
      }));

      showToast(`Dokumen [${docKey.toUpperCase()}] berhasil diunggah ke Firebase Storage!`);
    } catch (err) {
      showToast(`Gagal mengunggah dokumen ${docKey}. Menggunakan tautan lokal sementara.`, 'error');
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  // Save Registration Form to Firestore ('calon_siswa' & 'hasil_kesehatan')
  const handleSaveRegistration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.namaLengkap || !formData.noKtp || !formData.noHp) {
      showToast('Mohon isi minimal Nama Lengkap, No KTP, dan No HP.', 'error');
      return;
    }

    setIsSubmitting(true);
    const updatedCandidate: CalonSiswa = {
      ...formData,
      statusPendaftaran: 'Terdaftar'
    };

    // Save candidate to local context & Firestore
    saveStudentRegistration(updatedCandidate);
    const firestoreResult = await saveCalonSiswaToFirestore(updatedCandidate);

    // Sync to Rirekisho CV record if exists
    const existingCV = rirekishoRecords[updatedCandidate.id];
    if (existingCV) {
      saveRirekishoRecord({
        ...existingCV,
        pasFotoUrl: updatedCandidate.berkasDokumen?.pasPhoto3x4 || updatedCandidate.berkasDokumen?.pasFoto || existingCV.pasFotoUrl,
        dokumenUpload: {
          ...(existingCV.dokumenUpload || {}),
          ...(updatedCandidate.berkasDokumen || {})
        }
      });
    }

    // Save health screening declaration
    const healthPayload: HasilKesehatan = {
      id: `HLT-${updatedCandidate.id}`,
      siswaId: updatedCandidate.id,
      namaSiswa: updatedCandidate.namaLengkap,
      riwayatPenyakitSerius: healthData.riwayatPenyakitSerius,
      pengobatanRutin: 'Tidak Ada',
      riwayatOperasi: healthData.riwayatOperasi,
      riwayatTbc: healthData.riwayatTbc,
      riwayatHepatitis: healthData.riwayatHepatitis,
      penyakitAsma: healthData.penyakitAsma,
      penyakitOrganDalam: 'Tidak Ada',
      kecelakaanParah: healthData.kecelakaanParah,
      perokokAktif: healthData.perokokAktif,
      pecanduAlkohol: healthData.pecanduAlkohol,
      obatObatanTerlarang: 'Tidak',
      gangguanJiwaStress: 'Tidak',
      masalahTulangSendi: 'Tidak',
      kepemilikanTato: healthData.kepemilikanTato,
      statusFit: healthData.riwayatPenyakitSerius === 'Ada' || healthData.riwayatTbc === 'Ya' ? 'UNFIT' : 'FIT',
      catatanDokter: 'Penilaian mandiri dari formulir calon siswa',
      evaluatorName: 'Self Declaration System',
      updatedAt: new Date().toISOString()
    };

    saveHealthRecord(healthPayload);
    await saveHealthToFirestore(healthPayload);

    setIsSubmitting(false);

    if (firestoreResult.success) {
      showToast('Data Pendaftaran & Skrining Kesehatan berhasil disimpan langsung ke koleksi Firestore [calon_siswa]!');
    } else {
      showToast('Data berhasil disimpan secara lokal ke sistem!', 'info');
    }
  };

  // Submit Psikotes 50 Soal & Save to Firestore ('asesmen_psikotes')
  const handleSubmitPsikotes = async () => {
    const answeredCount = Object.keys(psikotesAnswers).length;
    if (answeredCount < 50) {
      const confirmSubmit = window.confirm(
        `Anda baru menjawab ${answeredCount} dari 50 soal Psikotes. Yakin ingin mengumpulkan jawaban sekarang?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    const result = gradePsikotes(psikotesAnswers);

    const recordPayload: AsesmenPsikotes = {
      id: `PSI-${formData.id}`,
      siswaId: formData.id,
      namaSiswa: formData.namaLengkap || 'Calon Siswa',
      totalCorrect: result.totalCorrect,
      totalQuestions: result.totalQuestions,
      scorePercentage: result.scorePercentage,
      statusKelulusan: result.statusKelulusan,
      categoryBreakdown: result.categoryBreakdown,
      userAnswers: psikotesAnswers,
      createdAt: new Date().toISOString()
    };

    savePsikotesRecord(recordPayload);
    const firestoreResult = await savePsikotesToFirestore(recordPayload);
    setIsSubmitting(false);

    showToast(
      `Hasil Psikotes berhasil dikirim: ${result.totalCorrect}/50 (${result.scorePercentage}%) - STATUS: ${result.statusKelulusan}`,
      result.statusKelulusan === 'LULUS' ? 'success' : 'info'
    );
  };

  // Submit DISC Assessment & Save to Firestore ('asesmen_disc')
  const handleSubmitDisc = async () => {
    const answeredCount = Object.keys(discAnswers).filter(
      (k) => discAnswers[Number(k)]?.most && discAnswers[Number(k)]?.least
    ).length;

    if (answeredCount < 24) {
      const confirmSubmit = window.confirm(
        `Anda baru menyelesaikan ${answeredCount} dari 24 set soalan DISC. Tetap simpan hasil asesmen sementara?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    const calculated = calculateDiscResult(discAnswers);

    const discPayload: AsesmenDisc = {
      id: `DISC-${formData.id}`,
      siswaId: formData.id,
      namaSiswa: formData.namaLengkap || 'Calon Siswa',
      scoreD: calculated.scoreD,
      scoreI: calculated.scoreI,
      scoreS: calculated.scoreS,
      scoreC: calculated.scoreC,
      dominantType: calculated.dominantType,
      secondaryType: calculated.secondaryType !== 'None' ? calculated.secondaryType : undefined,
      description: calculated.description,
      userAnswers: discAnswers,
      createdAt: new Date().toISOString()
    };

    saveDiscRecord(discPayload);
    const firestoreResult = await saveDiscToFirestore(discPayload);
    setIsSubmitting(false);

    showToast(
      `Profil Kepribadian DISC berhasil disimpan: Tipe Utama [${calculated.dominantType}]`,
      'success'
    );
  };

  // Documents Config
  const documentConfigs = [
    { key: 'pasFoto', label: 'Pas Foto 3x4 (Latar Merah/Biru)', desc: 'Format JPG/PNG (Maks. 2MB)' },
    { key: 'cv', label: 'Curriculum Vitae (CV Terbaru)', desc: 'Format PDF' },
    { key: 'ijazah', label: 'Ijazah Terakhir / SKL', desc: 'SMA/SMK/D3/S1' },
    { key: 'skck', label: 'SKCK dari Kepolisian', desc: 'Masa berlaku aktif' },
    { key: 'ktpSiswa', label: 'KTP Calon Siswa (E-KTP)', desc: 'Scan/Foto Jelas' },
    { key: 'ktpOrangTua', label: 'KTP Ayah / Ibu / Penjamin', desc: 'Scan/Foto Jelas' },
    { key: 'kartuKeluarga', label: 'Kartu Keluarga (KK)', desc: 'Scan Legalisir' },
    { key: 'paspor', label: 'Paspor (Persiapan Kerja Luar Negeri)', desc: 'Aktif (Jika Ada)' }
  ];

  return (
    <div className={isFullScreenMode ? 'fixed inset-0 z-50 bg-slate-900 overflow-y-auto p-4 sm:p-8 space-y-6' : 'w-full space-y-6'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-lg border shadow-md flex items-center justify-between text-xs font-semibold animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Student Welcome Header Card */}
      <div className={`${isFullScreenMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-900 border-slate-200'} rounded-xl p-6 shadow-sm border flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center space-x-2 text-emerald-500 font-mono text-xs uppercase tracking-wider font-bold">
            <User className="w-4 h-4" />
            <span>{lang === 'ja' ? '候補者・受講生 公式ポータル' : 'PORTAL RESMI CALON KANDIDAT & SISWA'}</span>
            {isNonIjefMatching && (
              <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-200">
                {bilingual('MATCHING JOB DIRECT', 'ダイレクト求人マッチング')}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold mt-1">
            {formData.namaLengkap
              ? bilingual(`Selamat Datang, ${formData.namaLengkap}`, `ようこそ、${formData.namaLengkap} 様`)
              : bilingual('Formulir Pendaftaran Siswa & Matching Job IJEF', '生徒登録・日本就職マッチング申請フォーム')}
          </h2>
          <p className={`text-xs ${isFullScreenMode ? 'text-slate-300' : 'text-slate-600'} mt-1`}>
            {bilingual('ID Pendaftaran: ', '登録ID: ')}<span className="font-mono font-semibold">{formData.id}</span> •
            {bilingual(' Kategori: ', ' 区分: ')}<span className="font-bold text-amber-500">{translateCandidateCategory(formData.kategoriKandidat, lang)}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setIsFullScreenMode(!isFullScreenMode)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-emerald-600/20"
            title={isFullScreenMode ? bilingual('Keluar Full Screen', '全画面を解除') : bilingual('Tampilan Full Screen', '全画面表示')}
          >
            {isFullScreenMode ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>{bilingual('Keluar Full Screen', '全画面解除')}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>{bilingual('Buka Full Screen', '全画面表示')}</span>
              </>
            )}
          </button>
          <div className={`${isFullScreenMode ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-200'} px-3 py-1.5 rounded-md border text-right shadow-xs`}>
            <span className="text-[10px] text-slate-400 block font-mono uppercase font-semibold">
              {bilingual('Status Berkas', '書類ステータス')}
            </span>
            <span className="text-xs font-bold text-emerald-500">
              {bilingual(
                formData.statusPendaftaran,
                formData.statusPendaftaran === 'Terdaftar' ? '登録完了' : formData.statusPendaftaran === 'Draft' ? '下書き' : formData.statusPendaftaran
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Student Sub Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5">
        <div className={`grid gap-1.5 ${isIjef ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <button
            onClick={() => {
              setActivePortalSubTab('pendaftaran');
              if (formStep === 4) setFormStep(1);
            }}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              activePortalSubTab === 'pendaftaran' && formStep !== 4
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {isIjef
                ? bilingual('1. Form Pendaftaran', '1. 登録フォーム')
                : bilingual('1. Formulir Biodata', '1. 基本情報フォーム')}
            </span>
          </button>

          {isIjef ? (
            <>
              <button
                onClick={() => setActivePortalSubTab('kesehatan')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePortalSubTab === 'kesehatan'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{bilingual('2. Tes MCU', '2. 健康診断 (MCU)')}</span>
              </button>

              <button
                onClick={() => setActivePortalSubTab('disc')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePortalSubTab === 'disc'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Brain className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{bilingual('3. Asesmen DISC', '3. DISC適性検査')}</span>
              </button>

              <button
                onClick={() => setActivePortalSubTab('psikotes')}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                  activePortalSubTab === 'psikotes'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{bilingual('4. Psikotes', '4. 心理適性テスト')}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setActivePortalSubTab('pendaftaran');
                setFormStep(4);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                activePortalSubTab === 'pendaftaran' && formStep === 4
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{bilingual('2. Unggah Berkas Dokumen', '2. 必要書類アップロード')}</span>
            </button>
          )}

          <button
            onClick={() => setActivePortalSubTab('status')}
            className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${
              activePortalSubTab === 'status'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isIjef
                ? bilingual('5. Status & Dokumen', '5. 状況・提出書類')
                : bilingual('3. Status Berkas', '3. 提出書類状況')}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================================== */}
      {/* MODULE 1: MULTI-STEP REGISTRATION FORM                                 */}
      {/* ======================================================================== */}
      {activePortalSubTab === 'pendaftaran' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Step Progress Bar */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                {!isIjef ? (
                  <>
                    {(bilingual as any)(
                      <>
                        Tahap {formStep === 4 ? '2' : formStep === 2 ? 'Opsional' : '1'} dari 2:{' '}
                        {formStep === 1 && 'Biodata Siswa (Wajib)'}
                        {formStep === 2 && 'Data Keluarga & Kontak Darurat (Opsional)'}
                        {formStep === 4 && 'Unggah Dokumen Persyaratan (Tanpa Tes MCU & Psikotes)'}
                      </>,
                      <>
                        ステップ {formStep === 4 ? '2' : formStep === 2 ? '任意' : '1'} / 2:{' '}
                        {formStep === 1 && '候補者基本情報（必須）'}
                        {formStep === 2 && '家族情報・緊急連絡先（任意）'}
                        {formStep === 4 && '必要書類アップロード（MCU・適性検査免除）'}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {(bilingual as any)(
                      <>
                        Langkah {formStep} dari 4:{' '}
                        {formStep === 1 && 'Biodata & Demografi Siswa'}
                        {formStep === 2 && 'Data Orang Tua / Penjamin'}
                        {formStep === 3 && 'Skrining Kesehatan Mandiri'}
                        {formStep === 4 && 'Unggah Dokumen Persyaratan'}
                      </>,
                      <>
                        ステップ {formStep} / 4:{' '}
                        {formStep === 1 && '生徒基本情報・属性データ'}
                        {formStep === 2 && '保護者・保証人情報'}
                        {formStep === 3 && '健康自己診断スクリーニング'}
                        {formStep === 4 && '必要書類アップロード'}
                      </>
                    )}
                  </>
                )}
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">
                {!isIjef ? (formStep === 4 ? '100%' : formStep === 2 ? '60%' : '30%') : `${formStep * 25}%`}{' '}
                {bilingual('Selesai', '完了')}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{
                  width: !isIjef
                    ? formStep === 4
                      ? '100%'
                      : formStep === 2
                      ? '60%'
                      : '30%'
                    : `${formStep * 25}%`
                }}
              ></div>
            </div>

            {/* Step Indicators */}
            <div className={`grid gap-2 mt-4 text-center ${isIjef ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
              {isIjef ? (
                [
                  { step: 1, label: bilingual('1. Biodata Siswa', '1. 基本情報') },
                  { step: 2, label: bilingual('2. Data Orang Tua', '2. 保護者情報') },
                  { step: 3, label: bilingual('3. Skrining MCU', '3. 健康スクリーニング') },
                  { step: 4, label: bilingual('4. Unggah Dokumen', '4. 書類アップロード') }
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setFormStep(s.step)}
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition ${
                      formStep === s.step
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                        : formStep > s.step
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))
              ) : (
                [
                  { step: 1, label: bilingual('1. Biodata Siswa (Wajib)', '1. 基本情報（必須）') },
                  { step: 2, label: bilingual('2. Data Keluarga (Opsional)', '2. 家族情報（任意）') },
                  { step: 4, label: bilingual('3. Unggah Dokumen (Wajib)', '3. 書類提出（必須）') }
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setFormStep(s.step)}
                    className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition ${
                      formStep === s.step
                        ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                        : formStep > s.step
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSaveRegistration} className="space-y-6">
            {/* STEP 1: DEMOGRAPHICS */}
            {formStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>{bilingual('Step 1: Demografi & Informasi Pribadi Siswa', 'ステップ 1: 生徒基本情報＆個人属性')}</span>
                  </h3>
                  {crmIsSynced && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{bilingual('Data CRM Tersinkron', 'CRM同期済')}</span>
                    </span>
                  )}
                </div>

                {/* Non-IJEF Fast Track Notification Banner */}
                {isNonIjefMatching && (
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
                    <div className="flex items-start space-x-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-emerald-900">
                          {bilingual(
                            `Alur Pendaftaran Cepat: Kategori ${formData.kategoriKandidat} (Matching Job)`,
                            `高速エントリー区分: ${translateCandidateCategory(formData.kategoriKandidat, lang)}（直接求人マッチング）`
                          )}
                        </span>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          {bilingual(
                            'Anda diarahkan untuk langsung mengisi Biodata & Data Diri, lalu langsung ke Unggah Dokumen tanpa perlu mengisi Test Kesehatan & MCU, Asesmen DISC, dan Psikotes.',
                            '基本情報入力後、健康診断・DISC・心理テストを受けることなく、直接必要書類アップロードに進めます。'
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormStep(4)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center space-x-1 transition shadow-xs cursor-pointer"
                    >
                      <span>{bilingual('Langsung ke Dokumen', '書類提出へ直接進む')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* CRM Auto-Fill Sync Status Notification Banner */}
                {crmSyncLoading ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-xs text-amber-800">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-600" />
                    <span>{bilingual('Memeriksa sinkronisasi data lead pemasaran CRM berdasarkan email login...', 'ログインEmailに基づくCRMマーケティングリード情報の同期確認中...')}</span>
                  </div>
                ) : crmIsSynced && leadData ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">{bilingual('Email Terhubung dengan Database CRM!', 'EmailがCRMデータベースと同期されました！')}</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {bilingual(
                          'Alamat Email terhubung ke koleksi crm_leads. Anda dapat mengedit Nama Lengkap, Kategori Kandidat, dan data lainnya di bawah ini.',
                          'メールアドレスがcrm_leadsコレクションに正常に接続されています。以下の氏名や候補者区分などのデータを自由に編集できます。'
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-xs text-slate-600">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{bilingual('Silakan lengkapi biodata & informasi pribadi di bawah ini. Kategori kandidat dapat diedit secara bebas.', '以下の基本情報・個人属性をご入力ください。候補者区分は任意に変更可能です。')}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {bilingual('Nama Lengkap (Sesuai KTP) *', '氏名（身分証明書通り） *')}
                      </label>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {bilingual('Bisa Diedit', '編集可能')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.namaLengkap}
                      onChange={(e) => handleInputChange('namaLengkap', e.target.value)}
                      placeholder={bilingual('Masukkan nama lengkap Anda...', 'フルネームを入力...')}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {bilingual('Nomor WhatsApp / HP Aktif *', '電話番号 / WhatsApp *')}
                      </label>
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {bilingual('Bisa Diedit', '編集可能')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.noHp}
                      onChange={(e) => handleInputChange('noHp', e.target.value)}
                      placeholder={bilingual('Contoh: 081234567890', '例: 081234567890')}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">{bilingual('Alamat Email *', 'メールアドレス *')}</label>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{bilingual('Bisa Diedit Manual', '手動編集可能')}</span>
                      </span>
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">{bilingual('Kategori Kandidat *', '候補者区分 *')}</label>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{bilingual('Dapat Diedit Bebas', '変更可能')}</span>
                      </span>
                    </div>
                    <select
                      value={formData.kategoriKandidat || 'SISWA NON IJEF'}
                      onChange={(e) => handleInputChange('kategoriKandidat', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-emerald-500 bg-emerald-50/50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="SISWA MITRA / NON IJEF">{bilingual('SISWA MITRA / NON IJEF (Siswa Mitra - Tanpa Tes MCU & DISC)', '提携校生徒 / 外部生（テスト免除）')}</option>
                      <option value="SISWA NON IJEF">{bilingual('SISWA NON IJEF (Matching Job Tanpa Tes MCU & Psikotes)', '非IJEF生（直接求人マッチング）')}</option>
                      <option value="SISWA NON IJEF (New Comer)">{bilingual('NEW COMER / NON IJEF', '新規外部生 (New Comer)')}</option>
                      <option value="SISWA IJEF - Offline">{bilingual('SISWA IJEF - Offline (Asrama Tatap Muka LPK)', 'IJEF 対面研修生（合宿・寮）')}</option>
                      <option value="SISWA IJEF - Online">{bilingual('SISWA IJEF - Online (Kelas Daring E-Learning)', 'IJEF オンライン研修生')}</option>
                      <option value="CANDIDATE EX-MAGANG">{bilingual('CANDIDATE EX-MAGANG (Tokutei Ginou Jepang)', '技能実習修了者・特定技能 (Ex-Magang)')}</option>
                      <option value="CANDIDATE GIJINKOKU">{bilingual('CANDIDATE GIJINKOKU (Tenaga Kerja Ahli/Engineer)', '技人国・専門職・エンジニア')}</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isNonIjefMatching
                        ? bilingual('⚡ Siswa Non-IJEF / Matching Job langsung diarahkan ke Unggah Dokumen tanpa tes MCU, DISC, & Psikotes.', '⚡ 外部生・マッチング候補者は健康診断や適性検査なしで直接書類提出へ進めます。')
                        : bilingual('Siswa IJEF mengikuti pelatihan internal dan modul MCU, DISC, serta Psikotes.', 'IJEF生は内部研修および健康診断、DISC、適性テストの受検が必要です。')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Kewarganegaraan', '国籍')}</label>
                    <select
                      value={formData.kewarganegaraan}
                      onChange={(e) => handleInputChange('kewarganegaraan', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="WNI">{bilingual('WNI (Warga Negara Indonesia)', 'インドネシア国籍 (WNI)')}</option>
                      <option value="WNA">{bilingual('WNA (Warga Negara Asing)', '外国籍 (WNA)')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {bilingual('No. KTP (NIK 16 Digit) *', '身分証明書番号 (KTP/NIK 16桁) *')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={formData.noKtp}
                      onChange={(e) => handleInputChange('noKtp', e.target.value)}
                      placeholder="3271234505020001"
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {bilingual('No. Kartu Keluarga (KK) *', '家族カード番号 (KK 16桁) *')}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={formData.noKk}
                      onChange={(e) => handleInputChange('noKk', e.target.value)}
                      placeholder="3271234500001122"
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Tempat Lahir', '出生地')}</label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => handleInputChange('tempatLahir', e.target.value)}
                      placeholder={bilingual('Bandung', '例: バンドン')}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">{bilingual('Tanggal Lahir', '生年月日')}</label>
                      {formData.tanggalLahir && (
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {bilingual(`Usia: ${calculateAgeFromBirthDate(formData.tanggalLahir)} Thn`, `年齢: ${calculateAgeFromBirthDate(formData.tanggalLahir)} 歳`)}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => handleInputChange('tanggalLahir', e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Agama', '宗教')}</label>
                    <select
                      value={formData.agama}
                      onChange={(e) => handleInputChange('agama', e.target.value as Religion)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Jenis Kelamin', '性別')}</label>
                    <select
                      value={formData.jenisKelamin}
                      onChange={(e) => handleInputChange('jenisKelamin', e.target.value as Gender)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Laki-laki">{bilingual('Laki-laki', '男性')}</option>
                      <option value="Perempuan">{bilingual('Perempuan', '女性')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Golongan Darah', '血液型')}</label>
                    <select
                      value={formData.golonganDarah}
                      onChange={(e) => handleInputChange('golonganDarah', e.target.value as BloodType)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">{bilingual('Status Perkawinan', '婚姻状況')}</label>
                    <select
                      value={formData.statusPerkawinan}
                      onChange={(e) => handleInputChange('statusPerkawinan', e.target.value as MaritalStatus)}
                      className="w-full text-xs px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Lajang">{bilingual('Lajang (Belum Menikah)', '未婚・独身')}</option>
                      <option value="Menikah">{bilingual('Menikah', '既婚')}</option>
                      <option value="Duda/Janda">{bilingual('Duda/Janda', '死別・離婚')}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {bilingual('Alamat Domisili Lengkap (Sesuai KTP)', '現住所・住民票住所（身分証通り）')}
                    </label>
                    <textarea
                      rows={2}
                      value={formData.alamatDomisili}
                      onChange={(e) => handleInputChange('alamatDomisili', e.target.value)}
                      placeholder={bilingual('Jl. Sukajadi No. 123, RT 02/RW 05, Kel. Pasteur, Kec. Sukajadi, Kota Bandung', '住所を入力してください（番地、地区、市区町村）...')}
                      className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: FAMILY DATA */}
            {formStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{bilingual('Step 2: Data Orang Tua & Penjamin Finansial', 'ステップ 2: 保護者・身元保証人情報')}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Data Ayah */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>{bilingual('Informasi Ayah / Penjamin Utama', '父親・第一身元保証人情報')}</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">{bilingual('Nama Ayah Lengkap', '父親氏名（フルネーム）')}</label>
                      <input
                        type="text"
                        value={formData.namaAyah}
                        onChange={(e) => handleInputChange('namaAyah', e.target.value)}
                        placeholder="Supriadi Sukarno"
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">{bilingual('Pekerjaan Ayah', '父親の職業')}</label>
                      <input
                        type="text"
                        value={formData.pekerjaanAyah}
                        onChange={(e) => handleInputChange('pekerjaanAyah', e.target.value)}
                        placeholder={bilingual('Wiraswasta / PNS / Karyawan', '会社員 / 自営業 / 公務員 / 農業')}
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {bilingual('No KTP / NPWP Ayah', '父親の身分証番号 / 納税者番号')}
                      </label>
                      <input
                        type="text"
                        value={formData.ktpNpwpAyah}
                        onChange={(e) => handleInputChange('ktpNpwpAyah', e.target.value)}
                        placeholder="3271234500001234"
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Data Ibu */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-pink-600" />
                      <span>{bilingual('Informasi Ibu Kandung', '母親情報')}</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">{bilingual('Nama Ibu Lengkap', '母親氏名（フルネーム）')}</label>
                      <input
                        type="text"
                        value={formData.namaIbu}
                        onChange={(e) => handleInputChange('namaIbu', e.target.value)}
                        placeholder="Siti Aminah"
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">{bilingual('Pekerjaan Ibu', '母親の職業')}</label>
                      <input
                        type="text"
                        value={formData.pekerjaanIbu}
                        onChange={(e) => handleInputChange('pekerjaanIbu', e.target.value)}
                        placeholder={bilingual('Ibu Rumah Tangga / PNS', '主婦 / 会社員 / 公務員')}
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {bilingual('No KTP / NPWP Ibu', '母親の身分証番号 / 納税者番号')}
                      </label>
                      <input
                        type="text"
                        value={formData.ktpNpwpIbu}
                        onChange={(e) => handleInputChange('ktpNpwpIbu', e.target.value)}
                        placeholder="3271234500005678"
                        className="w-full text-xs px-3 py-2 rounded bg-white border border-slate-300 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: HEALTH SELF-DECLARATION */}
            {formStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>{bilingual('Step 3: Pernyataan Skrining Kesehatan Mandiri', 'ステップ 3: 健康自己問診スクリーニング')}</span>
                  </h3>
                  {isNonIjefMatching && (
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">
                      {bilingual('Bypass untuk Matching Job', '求人マッチング免除対象')}
                    </span>
                  )}
                </div>

                {isNonIjefMatching && (
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900 shadow-xs">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">
                          {bilingual(`Kategori ${formData.kategoriKandidat} Tidak Diwajibkan Tes MCU`, `区分 ${formData.kategoriKandidat} は健康診断免除対象です`)}
                        </span>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          {bilingual(
                            'Anda dapat melewati formulir kesehatan ini dan langsung melanjutkan ke Step 4 (Unggah Dokumen).',
                            'この健康問診をスキップして、直接ステップ4（書類提出）に進むことができます。'
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormStep(4)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shrink-0 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{bilingual('Lanjut ke Step 4 (Dokumen)', 'ステップ4（書類提出）へ進む')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  {bilingual(
                    'Isilah pernyataan kesehatan mandiri ini secara jujur untuk memastikan kesiapan fisik selama pelatihan.',
                    '研修・就労中の健康管理のため、健康状態の自己問診に正確にご回答ください。'
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {[
                    { key: 'riwayatPenyakitSerius', label: bilingual('Riwayat Penyakit Serius', '重度疾患の既往歴') },
                    { key: 'riwayatTbc', label: bilingual('Pernah / Sedang Menderita TBC', '結核（TBC）の罹患歴') },
                    { key: 'riwayatHepatitis', label: bilingual('Pernah / Sedang Menderita Hepatitis (A/B/C)', '肝炎（A/B/C型）の罹患歴') },
                    { key: 'penyakitAsma', label: bilingual('Memiliki Penyakit Asma / Sesak Nafas', '喘息・呼吸器系疾患の有無') },
                    { key: 'riwayatOperasi', label: bilingual('Pernah Menjalani Operasi Besar', '大手術・外科手術の経験') },
                    { key: 'kecelakaanParah', label: bilingual('Pernah Mengalami Kecelakaan Parah / Patah Tulang', '大事故・骨折の既往歴') },
                    { key: 'perokokAktif', label: bilingual('Perokok Aktif', '喫煙の習慣（喫煙者）') },
                    { key: 'pecanduAlkohol', label: bilingual('Mengkonsumsi Minuman Beralkohol', '飲酒の習慣') },
                    { key: 'kepemilikanTato', label: bilingual('Memiliki Tato / Bekas Tindik', 'タトゥー・入れ墨・過度なピアスの有無') }
                  ].map((item) => (
                    <div key={item.key} className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      <div className="flex items-center space-x-3 text-xs">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={item.key}
                            checked={(healthData as any)[item.key] === 'Ya' || (healthData as any)[item.key] === 'Ada'}
                            onChange={() =>
                              setHealthData((prev) => ({
                                ...prev,
                                [item.key]: item.key === 'riwayatPenyakitSerius' ? 'Ada' : 'Ya'
                              }))
                            }
                            className="text-indigo-600"
                          />
                          <span>{bilingual('Ya / Ada', 'あり')}</span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={item.key}
                            checked={(healthData as any)[item.key] === 'Tidak' || (healthData as any)[item.key] === 'Tidak Ada'}
                            onChange={() =>
                              setHealthData((prev) => ({
                                ...prev,
                                [item.key]: item.key === 'riwayatPenyakitSerius' ? 'Tidak Ada' : 'Tidak'
                              }))
                            }
                            className="text-indigo-600"
                          />
                          <span>{bilingual('Tidak / Tidak Ada', 'なし')}</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: DOCUMENT UPLOADS */}
            {formStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                {isNonIjefMatching && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {bilingual(
                        'Kandidat Matching Job (Non-IJEF): Unggah dokumen utama (KTP, CV, Ijazah, sertifikat & video) untuk langsung diproses ke katalog lowongan kerja Jepang.',
                        '求人マッチング候補者（外部生）: 主要書類（身分証、履歴書、卒業証明書、資格証明書、自己紹介動画）を提出し、日本企業求人へエントリー可能にします。'
                      )}
                    </span>
                  </div>
                )}

                <CandidateDocumentUploadSection
                  documents={{
                    ...(formData.berkasDokumen || {}),
                    ...(rirekishoRecords[formData.id]?.dokumenUpload || {}),
                    pasPhoto3x4: formData.berkasDokumen?.pasPhoto3x4 || formData.berkasDokumen?.pasFoto || rirekishoRecords[formData.id]?.dokumenUpload?.pasPhoto3x4 || '',
                    videoJikoshoukai: formData.berkasDokumen?.videoJikoshoukai || rirekishoRecords[formData.id]?.dokumenUpload?.videoJikoshoukai || rirekishoRecords[formData.id]?.videoJikoshoukaiUrl || ''
                  }}
                  onChange={(updatedDocs) => {
                    setFormData(((prev: any) => ({
                      ...prev,
                      berkasDokumen: {
                        ...prev.berkasDokumen,
                        ...updatedDocs,
                        pasFoto: (updatedDocs as any).pasPhoto3x4 || prev.berkasDokumen?.pasFoto,
                        videoJikoshoukai: (updatedDocs as any).videoJikoshoukai || prev.berkasDokumen?.videoJikoshoukai
                      }
                    })) as any);
                  }}
                  candidateName={formData.namaLengkap}
                  lang={lang}
                />
              </div>
            )}

            {/* Navigation Buttons between Steps */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              {formStep > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isNonIjefMatching && formStep === 4) {
                      setFormStep(1);
                    } else {
                      setFormStep((prev) => prev - 1);
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{bilingual('Kembali', '戻る')}</span>
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{bilingual('Simpan Ke Firestore', 'データを保存')}</span>
                </button>

                {isNonIjefMatching ? (
                  formStep === 1 ? (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
                      >
                        <span>{bilingual('Keluarga (Opsional)', '家族情報（任意）')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStep(4)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                      >
                        <span>{bilingual('Langsung ke Dokumen', '書類提出へ直接進む')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : formStep === 2 ? (
                    <button
                      type="button"
                      onClick={() => setFormStep(4)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
                    >
                      <span>{bilingual('Lanjut ke Dokumen (Bypass MCU)', '書類提出へ進む（MCU免除）')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null
                ) : (
                  formStep < 4 && (
                    <button
                      type="button"
                      onClick={() => setFormStep((prev) => prev + 1)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center space-x-1 shadow-sm transition cursor-pointer"
                    >
                      <span>{bilingual(`Lanjut Step ${formStep + 1}`, `ステップ ${formStep + 1} へ進む`)}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODULE 2: TES KESEHATAN & MCU (STANDAR LPK IJEF CORP)                  */}
      {/* ======================================================================== */}
      {activePortalSubTab === 'kesehatan' && (
        <div className="space-y-4 animate-fade-in">
          {!isIjef ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center space-y-4 text-xs text-purple-950 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-base text-purple-900">
                  {bilingual(`Modul MCU Tidak Diperlukan untuk Kategori ${formData.kategoriKandidat}`, `区分 ${formData.kategoriKandidat} は健康診断（MCU）免除対象です`)}
                </h3>
                <p className="text-xs text-purple-800">
                  {bilingual(
                    'Prosedur Skrining MCU, DISC, dan Psikotes hanya berlaku untuk siswa resmi SISWA IJEF - Offline dan SISWA IJEF - Online.',
                    '健康診断、DISC適性検査、心理テストはIJEF公式研修生（対面・オンライン）のみが対象となります。'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePortalSubTab('pendaftaran');
                  setFormStep(4);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs inline-flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <span>{bilingual('Buka Formulir Pendaftaran & Unggah Berkas', '登録フォーム＆書類提出を開く')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <MedicalCheckup />
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODULE 3: DISC PERSONALITY TEST                                        */}
      {/* ======================================================================== */}
      {activePortalSubTab === 'disc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {!isIjef ? (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center space-y-4 text-xs text-purple-950 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-base text-purple-900">
                  {bilingual(`Asesmen DISC Tidak Diperlukan untuk Kategori ${formData.kategoriKandidat}`, `区分 ${formData.kategoriKandidat} はDISC適性検査免除対象です`)}
                </h3>
                <p className="text-xs text-purple-800">
                  {bilingual(
                    'Prosedur Asesmen Kepribadian DISC hanya dijalankan untuk peserta SISWA IJEF - Offline dan SISWA IJEF - Online.',
                    'DISCパーソナリティ適性検査はIJEF公式研修生（対面・オンライン）のみが対象となります。'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePortalSubTab('pendaftaran');
                  setFormStep(4);
                }}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs inline-flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <span>{bilingual('Buka Formulir Pendaftaran & Unggah Berkas', '登録フォーム＆書類提出を開く')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span>{bilingual('Asesmen Kepribadian DISC (24 Set Pernyataan)', 'DISC性格適性検査（全24問・4択式）')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {bilingual(
                    'Pilih satu pilihan yang Paling Menggambarkan (Most / P) dan satu pilihan yang Paling Tidak Menggambarkan (Least / K) dalam setiap set.',
                    '各設問の中で、自分に最も当てはまる項目（Most）を1つ、最も当てはまらない項目（Least）を1つ選択してください。'
                  )}
                </p>
              </div>

              <div className="space-y-4">
                {DISC_QUESTIONS.map((qSet) => {
                  const currentAns = discAnswers[qSet.setNumber] || { most: '', least: '' };
                  return (
                    <div key={qSet.setNumber} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {bilingual(`SET ${qSet.setNumber} dari 24`, `第 ${qSet.setNumber} 問 / 全24問`)}
                        </span>
                        {currentAns.most && currentAns.least && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                            {bilingual('✓ Terisi', '✓ 回答済')}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {qSet.choices.map((choice) => {
                          const isMost = currentAns.most === choice.id;
                          const isLeast = currentAns.least === choice.id;

                          return (
                            <div
                              key={choice.id}
                              className={`p-3 rounded border text-xs flex items-center justify-between transition ${
                                isMost
                                  ? 'bg-purple-50 border-purple-300'
                                  : isLeast
                                  ? 'bg-amber-50 border-amber-300'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <span className="text-slate-800 font-medium flex-1 pr-4">{choice.text}</span>
                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDiscAnswers((prev) => {
                                      const c = prev[qSet.setNumber] || { most: '', least: '' };
                                      return {
                                        ...prev,
                                        [qSet.setNumber]: {
                                          most: c.most === choice.id ? '' : choice.id,
                                          least: c.least === choice.id ? '' : c.least
                                        }
                                      };
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                    isMost
                                      ? 'bg-purple-600 text-white border-purple-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {bilingual('Paling (Most)', '最高 (Most)')}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDiscAnswers((prev) => {
                                      const c = prev[qSet.setNumber] || { most: '', least: '' };
                                      return {
                                        ...prev,
                                        [qSet.setNumber]: {
                                          most: c.most === choice.id ? '' : choice.id,
                                          least: c.least === choice.id ? '' : choice.id
                                        }
                                      };
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                    isLeast
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {bilingual('Tidak (Least)', '最低 (Least)')}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  onClick={handleSubmitDisc}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{bilingual('Hitung & Simpan Profil DISC Ke Firestore', 'DISC診断結果を集計して保存')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODULE 4: COGNITIVE TEST (PSIKOTES 50 SOAL)                           */}
      {/* ======================================================================== */}
      {activePortalSubTab === 'psikotes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {!isIjef ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center space-y-4 text-xs text-indigo-950 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-base text-indigo-900">
                  {bilingual(`Ujian Psikotes Tidak Diperlukan untuk Kategori ${formData.kategoriKandidat}`, `区分 ${formData.kategoriKandidat} は適性心理テスト免除対象です`)}
                </h3>
                <p className="text-xs text-indigo-800">
                  {bilingual(
                    'Ujian Psikotes 50 Soal hanya dijalankan untuk siswa SISWA IJEF - Offline dan SISWA IJEF - Online.',
                    '心理適性テスト（全50問）はIJEF公式研修生（対面・オンライン）のみが対象となります。'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePortalSubTab('pendaftaran');
                  setFormStep(4);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs inline-flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <span>{bilingual('Buka Formulir Pendaftaran & Unggah Berkas', '登録フォーム＆書類提出を開く')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                    <FileCheck className="w-5 h-5 text-indigo-600" />
                    <span>{bilingual('Tes Kognitif & Logika (Psikotes 50 Soal)', '認知・論理適性テスト（全50問）')}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {bilingual(
                      'Ujian Logika Matematika, Analogi Kata, Penalaran Verbal, & Spasial. Nilai minimum kelulusan: 60%.',
                      '数学論理、類推語彙、言語推論、空間認識テスト。合格基準点: 60%以上。'
                    )}
                  </p>
                </div>

                <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700">
                  {bilingual(`Terjawab: ${Object.keys(psikotesAnswers).length} / 50`, `回答済: ${Object.keys(psikotesAnswers).length} / 50`)}
                </div>
              </div>

          {/* Question List (5 per Page) */}
          <div className="space-y-4">
            {PSIKOTES_QUESTIONS.slice(
              (psikotesPage - 1) * QUESTIONS_PER_PAGE,
              psikotesPage * QUESTIONS_PER_PAGE
            ).map((q) => {
              const selectedOpt = psikotesAnswers[q.id];

              return (
                <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {bilingual(`Soal #${q.id} (${q.category})`, `第 ${q.id} 問 (${q.category})`)}
                    </span>
                    {selectedOpt && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                        {bilingual(`Jawaban: ${selectedOpt}`, `回答: ${selectedOpt}`)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">{q.question}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = selectedOpt === opt.key;

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            setPsikotesAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.key
                            }))
                          }
                          className={`p-2.5 rounded text-left text-xs transition border flex items-center space-x-2 ${
                            isChosen
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono shrink-0 ${
                            isChosen ? 'bg-white text-indigo-700 font-bold' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="flex-1">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 gap-3">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const pNum = idx + 1;
                return (
                  <button
                    key={pNum}
                    onClick={() => setPsikotesPage(pNum)}
                    className={`w-7 h-7 rounded text-xs font-bold font-mono transition ${
                      psikotesPage === pNum
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmitPsikotes}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{bilingual('Kirim & Nilai Psikotes Ke Firestore', '適性テスト結果を採点して保存')}</span>
            </button>
          </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* MODULE 4: CATEGORY-TAILORED CANDIDATE MONITORING & STATUS DASHBOARD     */}
      {/* ======================================================================== */}
      {activePortalSubTab === 'status' && (() => {
        const currentCategory: CandidateCategory =
          leadData?.kategoriKandidat ||
          activeStudent?.kategoriKandidat ||
          formData.kategoriKandidat ||
          'SISWA IJEF - Offline';

        const isIjef = isIjefCategory(currentCategory);
        const isIjefOnline = isIjef && (currentCategory.toLowerCase().includes('online') || currentCategory.toLowerCase().includes('daring'));
        const isIjefOffline = isIjef && !isIjefOnline;
        const isMitra = currentCategory.toUpperCase().includes('MITRA');
        const isExMagang = currentCategory.includes('Ex-Magang') || currentCategory.includes('EX-MAGANG');
        const isEngineering = currentCategory.includes('Engineering') || currentCategory.includes('Gijinkoku');
        const isNonIjef = !isIjef;

        // Dynamic banner gradient & badges per category
        let bannerBg = 'from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/40';
        let categoryBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        let CategoryIcon = GraduationCap;
        let badgeLabel = bilingual('SISWA IJEF (OFFLINE) • PROGRAM ASRAMA & TATAP MUKA LPK IJEF CORP', 'IJEF公式生（対面・寮生）• LPK IJEF CORP 集中研修プログラム');
        let dashboardTitle = bilingual('Dashboard Monitoring Progres Siswa Asrama IJEF', 'IJEF寮生 総合進捗モニタリングダッシュボード');
        let dashboardSubtitle = bilingual(
          'Pantau progres 6 modul pelatihan internal, kehadiran asrama, status kesehatan MCU, hasil asesmen, dan kesiapan CV Rirekisho JIS untuk Job Matching Japan.',
          '6段階研修モジュール進捗、寮生活出席状況、健康診断結果、適性診断、および日本求人マッチング用JIS規格履歴書の準備状況を管理します。'
        );

        if (isIjefOnline) {
          bannerBg = 'from-sky-950 via-slate-900 to-indigo-950 border-sky-800/40';
          categoryBadgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
          CategoryIcon = Globe;
          badgeLabel = bilingual('SISWA IJEF (ONLINE) • PROGRAM E-LEARNING & KELAS DARING LPK IJEF CORP', 'IJEFオンライン生 • Eラーニング＆オンラインLIVE授業');
          dashboardTitle = bilingual('Dashboard Monitoring LMS & Kelas Daring IJEF', 'IJEF オンラインLMS・受講進捗ダッシュボード');
          dashboardSubtitle = bilingual(
            'Pantau aktivitas e-learning, kehadiran Zoom live class, skor quiz & tugas mandiri, serta kelengkapan dokumen digital untuk kelulusan daring.',
            'Eラーニング学習状況、Zoom LIVE授業出席率、小テスト・課題スコア、およびオンライン修了用デジタル書類の進捗を管理します。'
          );
        } else if (isMitra) {
          bannerBg = 'from-teal-950 via-slate-900 to-slate-950 border-teal-800/40';
          categoryBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
          CategoryIcon = Building2;
          badgeLabel = bilingual('SISWA MITRA / NON IJEF • DIRECT JOB MATCHING JEPANG', '提携校・外部生 • 日本就職ダイレクトマッチング');
          dashboardTitle = bilingual('Dashboard Monitoring Kandidat Siswa Mitra', '提携校・外部生 就職進捗モニタリング');
          dashboardSubtitle = bilingual(
            'Pantau status kelengkapan biodata, dokumen mitra, pengisian Rirekisho Standard JIS, dan status matching perusahaan Jepang.',
            '基本情報、提携校推薦書類、JIS規格履歴書の作成状況、および日本受入企業とのマッチング選考状況を管理します。'
          );
        } else if (isExMagang) {
          bannerBg = 'from-amber-950 via-slate-900 to-orange-950 border-amber-800/40';
          categoryBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
          CategoryIcon = Briefcase;
          badgeLabel = bilingual('CANDIDATE EX-MAGANG • TOKUTEI GINOU JAPAN MATCHING', '元技能実習生（帰国生）• 特定技能マッチング');
          dashboardTitle = bilingual('Dashboard Monitoring Kandidat Ex-Magang Tokutei Ginou', '元実習生・特定技能選考モニタリング');
          dashboardSubtitle = bilingual(
            'Pantau verifikasi Sertifikat Senmonkyuu / Jitshusei, Hyouka Chousho, Paspor, Rirekisho JIS, dan matching pekerjaan Tokutei Ginou.',
            '専門級・実習修了証、評価調書、旧パスポート、JIS履歴書、および特定技能求人マッチング状況を管理します。'
          );
        } else if (isEngineering) {
          bannerBg = 'from-indigo-950 via-slate-900 to-purple-950 border-indigo-800/40';
          categoryBadgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
          CategoryIcon = Zap;
          badgeLabel = bilingual('CANDIDATE GIJINKOKU • TENAGA AHLI & ENGINEERING JAPAN', '技人国候補者 • 技術・人文知識・国際業務');
          dashboardTitle = bilingual('Dashboard Monitoring Kandidat Tenaga Kerja Ahli (Gijinkoku)', '高度外国人材（技人国）進捗モニタリング');
          dashboardSubtitle = bilingual(
            'Pantau verifikasi Ijazah D3/S1/S2, Sertifikat Bahasa JLPT N3/N2/N1, Portofolio Teknis, Rirekisho JIS, dan jadwal wawancara perusahaan Jepang.',
            '高等教育学位記・成績証明書、JLPT資格証、技術ポートフォリオ、JIS履歴書、および企業面接日程を管理します。'
          );
        } else if (!isIjefOffline) {
          bannerBg = 'from-purple-950 via-slate-900 to-slate-950 border-purple-800/40';
          categoryBadgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
          CategoryIcon = Sparkles;
          badgeLabel = bilingual('CANDIDATE CV-PORTAL • DIRECT JOB MATCHING JEPANG', '求人ポータル候補者 • 日本就職ダイレクトマッチング');
          dashboardTitle = bilingual('Dashboard Monitoring Kesiapan CV & Matching Perusahaan Jepang', '履歴書完成度・日本求人マッチング状況');
          dashboardSubtitle = bilingual(
            'Pantau status pengisian Rirekisho Standard JIS, verifikasi dokumen legalitas kerja Jepang, review Tim Placement, dan status lamaran perusahaan Jepang.',
            'JIS規格履歴書の入力進捗、就労資格書類確認、就職チームによるレビュー、および応募選考ステータスを管理します。'
          );
        }

        // Expanded document list based on category
        const categoryDocuments = [
          ...documentConfigs,
          ...(isExMagang
            ? [
                { key: 'sertifikatJitshusei', label: bilingual('Sertifikat Senmonkyuu / Jitshusei / Hyouka Chousho', '専門級合格証書 / 実習修了証 / 評価調書'), desc: bilingual('Bukti Lulus Magang Jepang 3 Tahun', '技能実習3年修了証明') },
                { key: 'pasporLama', label: bilingual('Scan Paspor Lama & Visa Trainee Jepang', '旧パスポート＆技能実習ビザのスキャン'), desc: bilingual('Riwayat Tinggal di Jepang', '日本在留歴・渡航歴の確認') }
              ]
            : []),
          ...(isEngineering
            ? [
                { key: 'ijazahPerguruanTinggi', label: bilingual('Ijazah Original D3/S1/S2 & Transkrip Akademik', '大学・短大・高専 卒業証明書＆成績証明書'), desc: bilingual('Legalisir Asli untuk Visa Gijinkoku', '技人国ビザ申請用証明原本') },
                { key: 'portofolioProject', label: bilingual('Portofolio Teknis / Sertifikat Keahlian Engineer', '技術ポートフォリオ / エンジニア資格証書'), desc: bilingual('Bukti Kualifikasi Professional', '専門技術・実務実績の証明') }
              ]
            : []),
          ...(!isExMagang && !isEngineering
            ? [
                { key: 'sertifikatBahasa', label: bilingual('Sertifikat Kemampuan Bahasa (JLPT / JFT-Basic A2)', '日本語能力認定書（JLPT / JFT-Basic A2）'), desc: bilingual('Scan Asli JLPT N5-N1 atau JFT-Basic', 'JLPT N5〜N1またはJFT-Basic合格原本') },
                { key: 'sertifikatSSW', label: bilingual('Sertifikat Keterampilan SSW Tokutei Ginou', '特定技能1号 技能評価試験合格証'), desc: bilingual('Sertifikat Tes Keterampilan Bidang Kerja', '職種別技能試験合格証') }
              ]
            : [])
        ];

        const getCandidateDoc = (key: string): string => {
          const bd = formData.berkasDokumen as Record<string, string> | undefined;
          const cvd = rirekishoRecords[formData.id]?.dokumenUpload as Record<string, string> | undefined;
          
          if (bd && bd[key]) return bd[key];
          if (cvd && cvd[key]) return cvd[key];

          if (key === 'pasFoto' || key === 'pasPhoto3x4') {
            return bd?.pasPhoto3x4 || bd?.pasFoto || cvd?.pasPhoto3x4 || (rirekishoRecords[formData.id]?.pasFotoUrl) || '';
          }
          if (key === 'cv' || key === 'cvRirekishoDoc') {
            return bd?.cvRirekishoDoc || bd?.cv || cvd?.cvRirekishoDoc || '';
          }
          if (key === 'sertifikatJft' || key === 'sertifikatBahasa' || key === 'sertifikatBahasaJepang') {
            return bd?.sertifikatBahasaJepang || bd?.sertifikatJft || bd?.sertifikatBahasa || cvd?.sertifikatBahasaJepang || '';
          }
          if (key === 'sertifikatSSW' || key === 'sertifikatSsw' || key === 'sertifikatSswKaigoSkill') {
            return bd?.sertifikatSsw || bd?.sertifikatSswKaigoSkill || bd?.sertifikatSSW || cvd?.sertifikatSsw || '';
          }
          return '';
        };

        const uploadedDocCount = categoryDocuments.filter(d => !!getCandidateDoc(d.key)).length;

        return (
          <div className="w-full space-y-6 animate-fade-in">
            {/* Header Banner Customized per Category */}
            <div className={`bg-gradient-to-r ${bannerBg} text-white rounded-2xl p-6 border shadow-xl`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold border ${categoryBadgeBg}`}>
                    <CategoryIcon className="w-4 h-4" />
                    <span>{badgeLabel}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                    {dashboardTitle}
                  </h1>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {dashboardSubtitle}
                  </p>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 text-xs space-y-1 self-start md:self-auto min-w-[220px]">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                    {bilingual('Profil Kandidat', '候補者プロフィール')}
                  </div>
                  <div className="font-bold text-white text-sm truncate">{formData.namaLengkap || bilingual('Calon Siswa Baru', '新規登録生')}</div>
                  <div className="text-[11px] text-slate-300 font-mono">NIK: {formData.noKtp || '-'}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">ID: {formData.id || 'AUTO-ID'}</div>
                </div>
              </div>
            </div>

            {/* 4 KPI Metrics Grid - Screen width responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Status Pendaftaran / LMS / Program */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                    1. {isIjefOffline ? bilingual('Registrasi & Asrama', '登録・入寮') : isIjefOnline ? bilingual('Akses Kelas LMS', 'LMS受講アクセス') : bilingual('Program Placement', '就職プログラム')}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-sm font-black text-slate-800">
                  {formData.statusPendaftaran === 'Terdaftar' ? bilingual('Terdaftar', '登録完了') : formData.statusPendaftaran === 'Draft' ? bilingual('Draft', '下書き') : (formData.statusPendaftaran || bilingual('Diterima', '受付済'))}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isIjefOffline
                    ? bilingual('Terdaftar di LPK IJEF (Asrama Tatap Muka)', 'LPK IJEF 対面・入寮プログラム登録済')
                    : isIjefOnline
                    ? bilingual('Akses Platform E-Learning Active', 'Eラーニングプラットフォーム有効')
                    : `${bilingual('Kategori', '区分')}: ${translateCandidateCategory(currentCategory, lang)}`}
                </p>
              </div>

              {/* Stat 2: Asesmen DISC / Karakter */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-purple-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                    2. {bilingual('Asesmen DISC Kepribadian', 'DISC性格適性検査')}
                  </span>
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-sm font-black text-slate-800">
                  {discRecords[formData.id] ? discRecords[formData.id].dominantType : bilingual('Belum Selesai', '未受検')}
                </div>
                <p className="text-[11px] text-slate-500">
                  {discRecords[formData.id] ? bilingual('Hasil Evaluasi DISC Tersimpan', 'DISC診断結果集計完了') : bilingual('Selesaikan 24 set DISC', '全24問のDISCを完了してください')}
                </p>
              </div>

              {/* Stat 3: Psikotes 50 Soal */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                    3. {bilingual('Ujian Psikotes', '適性心理テスト')}
                  </span>
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-sm font-black text-slate-800">
                  {psikotesRecords[formData.id]
                    ? `${psikotesRecords[formData.id].totalCorrect}/50 (${psikotesRecords[formData.id].scorePercentage}%)`
                    : bilingual('Belum Selesai', '未受検')}
                </div>
                <p className="text-[11px] text-slate-500">
                  {psikotesRecords[formData.id]
                    ? `${bilingual('Status', '合否判定')}: ${psikotesRecords[formData.id].statusKelulusan === 'LULUS' ? bilingual('LULUS', '合格') : bilingual('TIDAK LULUS', '不合格')}`
                    : bilingual('Selesaikan Ujian Psikotes', '適性テストを完了してください')}
                </p>
              </div>

              {/* Stat 4: Sync Rirekisho JIS */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-amber-300 transition">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                    4. {bilingual('CV & Job Matching', 'JIS履歴書＆求人マッチング')}
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-sm font-black text-slate-800">
                  {isIjefOffline || isIjefOnline
                    ? (psikotesRecords[formData.id]?.statusKelulusan === 'LULUS' ? bilingual('Siap Job Matching', 'マッチング準備完了') : bilingual('Dalam Evaluasi', '評価審査中'))
                    : bilingual('Rirekisho Standard JIS', 'JIS規格履歴書')}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isIjefOffline || isIjefOnline
                    ? bilingual('Verifikasi kualifikasi LPK IJEF CORP', 'LPK IJEF CORP 推薦資格確認')
                    : bilingual('Akses Katalog Job Matching Japan', '日本就職求人カタログへのアクセス')}
                </p>
              </div>
            </div>

            {/* Category-Tailored Modul & Roadmap Timeline Tracker */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-800">
                    {bilingual(`Roadmap & Modul Alur Proses (${currentCategory})`, `工程ロードマップ＆研修モジュール (${translateCandidateCategory(currentCategory, lang)})`)}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {bilingual('Modul Terstruktur Sesuai Kategori', '区分別最適化カリキュラム')}
                </span>
              </div>

              {/* Timeline Grid (6 Cards Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {isIjefOffline && [
                  { step: bilingual('Modul 1', 'モジュール 1'), title: bilingual('Bahasa Jepang Dasar (N5 & Hiragana/Katakana)', '基礎日本語（N5・ひらがな・カタカナ）'), desc: bilingual('Penguasaan huruf dasar, tata bahasa awal, kosakata asrama, dan Aisatsu harian.', '文字習得、基礎文法、寮生活語彙、日常挨拶の徹底習得。'), status: bilingual('LULUS', '修了'), color: 'emerald' },
                  { step: bilingual('Modul 2', 'モジュール 2'), title: bilingual('Kaiwa & Tata Krama Kedisiplinan Asrama', '実践会話・寮内規律・日本のビジネスマナー'), desc: bilingual('Latihan percakapan intensif, etika kerja Jepang (HouRenSo), dan kedisiplinan fisik.', '集中会話トレーニング、報連相の徹底、体力・時間厳守の指導。'), status: bilingual('BERLANGSUNG', '受講中'), color: 'indigo' },
                  { step: bilingual('Modul 3', 'モジュール 3'), title: bilingual('Persiapan Ujian N4 & JFT-Basic A2', 'N4対策・JFT-Basic A2 公式試験対策'), desc: bilingual('Pendalaman tata bahasa N4, latihan soal JFT-Basic A2 resmi, dan pendaftaran tes.', 'N4文法演習、JFT公式模擬試験演習、試験申込サポート。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul 4', 'モジュール 4'), title: bilingual('Keterampilan Teknis SSW Tokutei Ginou', '特定技能 専門実務スキル演習'), desc: bilingual('Pelatihan praktek keahlian bidang Kaigo, Kensetsu, Food Processing, atau Pertanian.', '介護・建設・外食・食品製造・農業等の専門技能実技講習。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul 5', 'モジュール 5'), title: bilingual('Fisik, Mental, Character Building Asrama', '体力強化・メンタル・人間形成'), desc: bilingual('Pembentukan fisik tahan banting, ketahanan mental, dan kemandirian hidup asrama.', '強靭な体力づくり、困難に負けない精神力、集団生活の自立。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul 6', 'モジュール 6'), title: bilingual('Simulasi Interview Mensetsu & Job Matching', '面接シミュレーション・企業マッチング'), desc: bilingual('Simulasi wawancara dengan User Jepang, pengayaan Rirekisho, dan sinkronisasi data.', '日本受入企業との面接特訓、JIS履歴書ブラッシュアップ。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.step}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'LULUS' || item.status === '修了' || item.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'BERLANGSUNG' || item.status === '受講中' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}

                {isIjefOnline && [
                  { step: bilingual('Modul LMS 1', 'LMSモジュール 1'), title: bilingual('Orientasi E-Learning & Fondasi N5 Online', 'オンライン受講ガイダンス＆N5基礎講座'), desc: bilingual('Akses platform LMS, video materi N5, e-book kosakata, dan quiz modul 1.', 'LMSアクセス、N5動画教材、語彙Eブック、第1回確認テスト。'), status: bilingual('LULUS', '修了'), color: 'emerald' },
                  { step: bilingual('Modul LMS 2', 'LMSモジュール 2'), title: bilingual('Live Zoom Class Kaiwa Interaktif', 'ネイティブ・専任講師によるZoom LIVE会話授業'), desc: bilingual('Pertemuan daring terjadwal bersama Sensei native/lokal untuk latihan Kaiwa.', '定期オンラインLIVE授業での発話トレーニング・実践会話。'), status: bilingual('BERLANGSUNG', '受講中'), color: 'sky' },
                  { step: bilingual('Modul LMS 3', 'LMSモジュール 3'), title: bilingual('Modul E-Learning N4 & Bank Soal JFT', 'N4オンライン講座＆JFT過去問・演習問題集'), desc: bilingual('Akses bank soal JFT-Basic A2 online, pembahasan video, dan tryout daring.', 'JFT問題演習、解説動画、オンライン模擬試験。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul LMS 4', 'LMSモジュール 4'), title: bilingual('Video Simulasi Keterampilan SSW Online', '特定技能 専門動画教材＆解説クイズ'), desc: bilingual('Akses modul video keahlian khusus SSW Tokutei Ginou dan kuis teknis.', '分野別専門技能の動画レクチャーと技術理解度テスト。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul LMS 5', 'LMSモジュール 5'), title: bilingual('Quiz Online & Evaluasi Mandiri DISC / Psikotes', 'オンライン心理適性テスト＆DISC性格診断'), desc: bilingual('Pelaksanaan asesmen psikotes 50 soal dan tes DISC kepribadian via portal.', 'ポータル上での適性検査・性格診断の受検と自己分析。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Modul LMS 6', 'LMSモジュール 6'), title: bilingual('Final Assessment & Penerbitan CV JIS', '最終修了判定＆JIS規格履歴書プロファイル発行'), desc: bilingual('Penerbitan sertifikat kelulusan daring dan pembuatan profil CV-Portal.', 'オンライン修了証の発行、求人マッチングポータル連携。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                        {item.step}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'LULUS' || item.status === '修了' || item.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'BERLANGSUNG' || item.status === '受講中' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}

                {isNonIjef && [
                  { step: bilingual('Step 1', 'ステップ 1'), title: bilingual('Registrasi & Pengisian Profile Demografi', '登録＆基本情報・属性入力'), desc: bilingual('Pengisian data diri, kontak darurat, latar belakang pendidikan & pekerjaan.', '本人基本情報、緊急連絡先、学歴・職歴の入力。'), status: bilingual('SELESAI', '完了'), color: 'emerald' },
                  { step: bilingual('Step 2', 'ステップ 2'), title: bilingual('Pengisian Rirekisho Standard JIS', 'JIS規格履歴書の作成・志望動機'), desc: bilingual('Penyusunan CV format Jepang (JIS Standard), Jikoshoukai, dan Self-PR.', '日本標準JIS履歴書の作成、自己PR、志望動機の記載。'), status: bilingual('BERLANGSUNG', '進行中'), color: 'purple' },
                  { step: bilingual('Step 3', 'ステップ 3'), title: bilingual('Verifikasi Dokumen Legalitas Kerja', '就労資格・必要書類の提出・審査'), desc: isExMagang ? bilingual('Upload Senmonkyuu, Hyouka Chousho, Paspor Trainee.', '専門級合格証、評価調書、旧実習生パスポートのアップロード。') : isEngineering ? bilingual('Upload Ijazah D3/S1 Original & Transkrip Akademik.', '大学・短大卒業証明原本および学業成績証明書のアップロード。') : bilingual('Upload Paspor, Sertifikat JLPT/JFT, dan SSW.', 'パスポート、日本語資格証（JLPT/JFT）、特定技能評価試験証のアップロード。'), status: bilingual('BERLANGSUNG', '進行中'), color: 'amber' },
                  { step: bilingual('Step 4', 'ステップ 4'), title: bilingual('Review & Optimasi Profil CV JIS', '就職チームによる履歴書審査・最適化'), desc: bilingual('Tim Placement memeriksa & mengoptimalkan profil untuk perusahaan Jepang.', '日本受入企業に向けた推薦プロフィールの最適化と翻訳確認。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Step 5', 'ステップ 5'), title: bilingual('Pengajuan Lamaran Job Japan Catalog', '日本求人カタログへのエントリー応募'), desc: bilingual('Pilih lowongan kerja sesuai kualifikasi dan ajukan lamaran resmi.', '希望条件に合致する求人案件への正式応募エントリー。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' },
                  { step: bilingual('Step 6', 'ステップ 6'), title: bilingual('Wawancara Mensetsu & Process Visa/COE', '面接選考・内定獲得・在留資格(COE)申請'), desc: bilingual('Pelaksanaan wawancara User Jepang, penerbitan Naitei, dan pengurusan COE.', '日本企業面接、内定通知書受領、COE在留資格認定証明書手続き。'), status: bilingual('SEGERA', '次回予定'), color: 'slate' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {item.step}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'SELESAI' || item.status === '完了' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'BERLANGSUNG' || item.status === '進行中' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Checklist & Verification Matrix */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>
                      {bilingual(
                        `Matriks Monitoring Dokumen (${uploadedDocCount} dari ${categoryDocuments.length} Diunggah)`,
                        `書類提出進捗マトリクス (${categoryDocuments.length}点中 ${uploadedDocCount}点 提出済)`
                      )}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {bilingual(
                      'Unggah dokumen berformat PDF atau JPG/PNG langsung melalui tombol di bawah ini.',
                      'PDFまたは画像（JPG/PNG）形式の書類を下のボタンから直接アップロードしてください。'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {categoryDocuments.map((doc) => {
                  const url = getCandidateDoc(doc.key);
                  return (
                    <div
                      key={doc.key}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition hover:bg-white hover:border-slate-300"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-800 truncate">{doc.label}</span>
                          {url ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{bilingual('Uploaded', '提出済')}</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded shrink-0 flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>{bilingual('Belum Upload', '未提出')}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{doc.desc}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center space-x-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{bilingual('Lihat', '確認')}</span>
                          </a>
                        )}

                        <label className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer transition shadow-xs">
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          <span>{url ? bilingual('Ganti', '変更') : bilingual('Unggah', '提出')}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(doc.key as any, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{bilingual('Aksi Cepat Penyelesaian Syarat', '必須手続き・クイックアクション')}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {bilingual(
                    'Lengkapi data registrasi, ikuti asesmen DISC & psikotes, atau perbarui Rirekisho JIS Anda.',
                    '登録情報の完成、DISC適性検査・心理テストの受検、またはJIS規格履歴書の更新を行ってください。'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setActivePortalSubTab('pendaftaran');
                    setFormStep(1);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition"
                >
                  {bilingual('Form Pendaftaran', '登録フォーム')}
                </button>
                <button
                  onClick={() => setActivePortalSubTab('disc')}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition"
                >
                  {bilingual('Asesmen DISC', 'DISC適性検査')}
                </button>
                <button
                  onClick={() => setActivePortalSubTab('psikotes')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                >
                  {bilingual('Ujian Psikotes', '適性心理テスト')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
