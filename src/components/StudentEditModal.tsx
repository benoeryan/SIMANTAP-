import React, { useState, useEffect } from 'react';
import { CandidateDocumentUploadSection } from './cvportal/CandidateDocumentUploadSection';
import {
  CalonSiswa,
  HasilKesehatan,
  AsesmenDisc,
  AsesmenPsikotes,
  AplikasiDukunganDana,
  SuratPerjanjian,
  CandidateCategory,
  Gender,
  Religion,
  BloodType,
  MaritalStatus,
  JobType
} from '../types';
import { useApp } from '../context/AppContext';
import { formatRupiah } from '../utils/financingCalculator';
import { calculateAgeFromBirthDate } from '../utils/candidateUtils';
import {
  User,
  X,
  Save,
  CheckCircle2,
  Stethoscope,
  Brain,
  FileCheck,
  Coins,
  FileText,
  Clock,
  ArrowLeft,
  Building2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Award,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  UserPlus
} from 'lucide-react';

interface StudentEditModalProps {
  student: CalonSiswa;
  onClose: () => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, onClose }) => {
  const {
    setSelectedStudentId,
    setActiveTab: setAppActiveTab,
    saveStudentRegistration,
    healthRecords,
    saveHealthRecord,
    discRecords,
    saveDiscRecord,
    psikotesRecords,
    savePsikotesRecord,
    financingRecords,
    saveFinancingRecord,
    contractRecords,
    saveContractRecord,
    forwardStudentToAdmin2,
    rirekishoRecords,
    lang
  } = useApp();

  const [modalTab, setModalTab] = useState<'data' | 'dokumen' | 'kesehatan' | 'psikotes' | 'pembiayaan' | 'kontrak' | 'ringkasan'>('data');
  const [formData, setFormData] = useState<CalonSiswa>(student);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Health State
  const existingHealth = healthRecords[student.id];
  const [healthStatusFit, setHealthStatusFit] = useState<'FIT' | 'UNFIT' | 'PENDING'>(
    (existingHealth?.statusFit as 'FIT' | 'UNFIT' | 'PENDING') || 'FIT'
  );
  const [healthCatatan, setHealthCatatan] = useState<string>(
    existingHealth?.catatanDokter || 'Hasil MCU RSU Paru/Lab Rujukan: Kondisi fisik sehat, Bebas penyakit menular.'
  );

  // DISC State
  const existingDisc = discRecords[student.id];
  const [discDominant, setDiscDominant] = useState<'Dominance' | 'Influence' | 'Steadiness' | 'Compliance'>(
    (existingDisc?.dominantType as 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance') || 'Steadiness'
  );

  // Psikotes State
  const existingPsikotes = psikotesRecords[student.id];
  const [psikotesScore, setPsikotesScore] = useState<number>(
    existingPsikotes?.scorePercentage || 85
  );
  const [psikotesStatus, setPsikotesStatus] = useState<'LULUS' | 'TIDAK LULUS'>(
    (existingPsikotes?.statusKelulusan as 'LULUS' | 'TIDAK LULUS') || 'LULUS'
  );

  // Financing State
  const existingDana = financingRecords[student.id];
  const [skemaDana, setSkemaDana] = useState<string>(
    existingDana?.skemaPilihan || (student?.kategoriKandidat && student.kategoriKandidat.includes('Offline') ? 'DT 100%' : 'Reguler 100%')
  );
  const [statusDana, setStatusDana] = useState<string>(
    existingDana?.statusPersetujuan || 'DISETUJUI'
  );

  // Contract State
  const existingContract = contractRecords[student.id];
  const [nomorKontrak, setNomorKontrak] = useState<string>(
    existingContract?.nomorSurat || `088/SPKP/IJEF-CORP/${new Date().getFullYear()}`
  );
  const [statusKontrak, setStatusKontrak] = useState<string>(
    existingContract?.statusPersetujuan || 'SAH'
  );

  // Progress Note
  const [catatanPerkembangan, setCatatanPerkembangan] = useState<string>(
    existingHealth?.catatanDokter || 'Siswa aktif mengikuti pelatihan bahasa Jepang, hafalan hiragana/katakana tuntas, persiapan modul Kaigo & MCU Ulang.'
  );

  useEffect(() => {
    setFormData(student);
  }, [student]);

  const handleChange = (field: keyof CalonSiswa, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'tanggalLahir' && value) {
        updated.umur = calculateAgeFromBirthDate(value, prev.umur || 22);
      }
      return updated;
    });
  };

  // Direct Jump Handler to open dedicated module in main app sidebar
  const handleOpenSidebarModule = (navId: 'portal' | 'kesehatan' | 'disc' | 'psikotes' | 'dana' | 'kontrak') => {
    setSelectedStudentId(student.id);
    setAppActiveTab(navId);
    onClose();
  };

  const handleSaveAll = () => {
    // Set active student
    setSelectedStudentId(student.id);

    // 1. Save CalonSiswa with synchronized age
    const calculatedUmur = calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22);
    const updatedStudentData: CalonSiswa = {
      ...formData,
      umur: calculatedUmur,
    };
    saveStudentRegistration(updatedStudentData);

    // 2. Save Health Record
    const updatedHealth: HasilKesehatan = {
      id: existingHealth?.id || `mcu_${student.id}`,
      siswaId: student.id,
      namaSiswa: formData.namaLengkap,
      statusFit: healthStatusFit,
      tekananDarah: existingHealth?.tekananDarah || '120/80 mmHg',
      tinggiBadan: existingHealth?.tinggiBadan || 168,
      beratBadan: existingHealth?.beratBadan || 62,
      butaWarna: existingHealth?.butaWarna || 'Normal',
      riwayatPenyakitSerius: existingHealth?.riwayatPenyakitSerius || 'Tidak ada',
      pengobatanRutin: existingHealth?.pengobatanRutin || 'Tidak ada',
      riwayatOperasi: existingHealth?.riwayatOperasi || 'Tidak ada',
      riwayatTbc: existingHealth?.riwayatTbc || 'Tidak ada',
      riwayatHepatitis: existingHealth?.riwayatHepatitis || 'Tidak ada',
      penyakitAsma: existingHealth?.penyakitAsma || 'Tidak ada',
      penyakitOrganDalam: existingHealth?.penyakitOrganDalam || 'Tidak ada',
      kecelakaanParah: existingHealth?.kecelakaanParah || 'Tidak ada',
      perokokAktif: existingHealth?.perokokAktif || 'Tidak ada',
      pecanduAlkohol: existingHealth?.pecanduAlkohol || 'Tidak ada',
      obatObatanTerlarang: existingHealth?.obatObatanTerlarang || 'Tidak ada',
      gangguanJiwaStress: existingHealth?.gangguanJiwaStress || 'Tidak ada',
      masalahTulangSendi: existingHealth?.masalahTulangSendi || 'Tidak ada',
      kepemilikanTato: existingHealth?.kepemilikanTato || 'Tidak ada',
      catatanDokter: healthCatatan || catatanPerkembangan,
      evaluatorName: existingHealth?.evaluatorName || 'Tim Dokter MCU LPK IJEF',
      updatedAt: new Date().toISOString()
    };
    saveHealthRecord(updatedHealth);

    // 3. Save DISC Record
    const updatedDisc: AsesmenDisc = {
      id: existingDisc?.id || `disc_${student.id}`,
      siswaId: student.id,
      namaSiswa: formData.namaLengkap,
      dominantType: discDominant,
      scoreD: existingDisc?.scoreD || 12,
      scoreI: existingDisc?.scoreI || 15,
      scoreS: existingDisc?.scoreS || 22,
      scoreC: existingDisc?.scoreC || 18,
      description: existingDisc?.description || 'Memiliki ketenangan tinggi, patuh aturan, cocok untuk Kaigo & Manufaktur.',
      userAnswers: existingDisc?.userAnswers || {},
      createdAt: existingDisc?.createdAt || new Date().toISOString()
    };
    saveDiscRecord(updatedDisc);

    // 4. Save Psikotes Record
    const updatedPsikotes: AsesmenPsikotes = {
      id: existingPsikotes?.id || `psi_${student.id}`,
      siswaId: student.id,
      namaSiswa: formData.namaLengkap,
      totalCorrect: Math.round((psikotesScore / 100) * 50),
      totalQuestions: 50,
      scorePercentage: psikotesScore,
      statusKelulusan: psikotesStatus,
      categoryBreakdown: existingPsikotes?.categoryBreakdown || {
        analogiKata: Math.round((psikotesScore / 100) * 12),
        logikaMatematika: Math.round((psikotesScore / 100) * 13),
        penalaranSpasial: Math.round((psikotesScore / 100) * 12),
        penalaranVerbal: Math.round((psikotesScore / 100) * 13)
      },
      userAnswers: existingPsikotes?.userAnswers || {},
      createdAt: existingPsikotes?.createdAt || new Date().toISOString()
    };
    savePsikotesRecord(updatedPsikotes);

    // 5. Save Financing Record
    const updatedFinancing: AplikasiDukunganDana = {
      id: existingDana?.id || `DANA-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: student.id,
      namaSiswa: formData.namaLengkap,
      programOption: (skemaDana as any) || 'DT 100%',
      tenorBulan: existingDana?.tenorBulan || 6,
      biayaTotal: existingDana?.biayaTotal || 15000000,
      uangMukaDp: existingDana?.uangMukaDp || 0,
      plafondPinjaman: existingDana?.plafondPinjaman || 15000000,
      angsuranPerBulan: existingDana?.angsuranPerBulan || 2500000,
      namaPenjamin: existingDana?.namaPenjamin || formData.namaAyah || 'Penjamin Orang Tua',
      ktpPenjamin: existingDana?.ktpPenjamin || formData.ktpNpwpAyah || '3271040101700003',
      npwpPenjamin: existingDana?.npwpPenjamin || '12.345.678.9-012.000',
      pekerjaanPenjamin: (existingDana?.pekerjaanPenjamin as JobType) || 'Wiraswasta',
      hubunganPenjamin: existingDana?.hubunganPenjamin || 'Orang Tua',
      alamatPenjamin: existingDana?.alamatPenjamin || formData.alamatDomisili,
      noHpPenjamin: existingDana?.noHpPenjamin || formData.noHp,
      statusPersetujuan: statusDana as any,
      tanggalPengajuan: existingDana?.tanggalPengajuan || new Date().toISOString().split('T')[0]
    };
    saveFinancingRecord(updatedFinancing);

    // 6. Save Contract Record
    const updatedContract: SuratPerjanjian = {
      id: existingContract?.id || `KONTRAK-${Math.floor(100 + Math.random() * 900)}`,
      siswaId: student.id,
      nomorSurat: nomorKontrak,
      tanggalSurat: existingContract?.tanggalSurat || new Date().toISOString().split('T')[0],
      pihakPertamaNama: existingContract?.pihakPertamaNama || 'Drs. Bambang Wijaya, M.M.',
      pihakPertamaJabatan: existingContract?.pihakPertamaJabatan || 'Direktur Utama LPK IJEF CORP',
      pihakPertamaInstansi: existingContract?.pihakPertamaInstansi || 'LPK IJEF CORP INDONESIA',
      pihakKeduaNama: formData.namaLengkap,
      pihakKeduaKtp: formData.noKtp,
      pihakKeduaAlamat: formData.alamatDomisili,
      pihakKeduaNoHp: formData.noHp,
      pihakKeduaEmail: formData.email,
      penjaminNama: existingContract?.penjaminNama || formData.namaAyah || 'Penjamin Orang Tua',
      penjaminKtp: existingContract?.penjaminKtp || formData.ktpNpwpAyah || '3271040101700003',
      programPelatihan: existingContract?.programPelatihan || 'Program Pendidikan & Pelatihan Keahlian / Magang Kerja Japan',
      durasiPelatihanBulan: existingContract?.durasiPelatihanBulan || 6,
      garansiJobMatching: true,
      statusPersetujuan: statusKontrak as any,
      kopNamaLpk: existingContract?.kopNamaLpk || 'LEMBAGA PELATIHAN KERJA (LPK) IJEF CORP',
      kopSubJudul: existingContract?.kopSubJudul || 'Keputusan Kepolisian & Dinas Tenaga Kerja No: Disnaker/LPK/IJEF/2025',
      kopAlamat: existingContract?.kopAlamat || 'Gedung Graha IJEF, Jl. Pemuda No. 45 Jakarta Timur | Website: www.ijefcorp.co.id',
      judulSurat: existingContract?.judulSurat || 'SURAT PERJANJIAN KEIKUTSERTAAN PENDIDIKAN & PELATIHAN KERJA',
      teksPembuka: existingContract?.teksPembuka || 'Pada hari ini, bertempat di Kantor LPK IJEF CORP Jakarta, kami yang bertanda tangan di bawah ini:',
      teksKesepakatan: existingContract?.teksKesepakatan || 'Para Pihak dengan ini sepakat dan mengikatkan diri dalam Perjanjian Keikutsertaan Pendidikan & Pelatihan Kerja dengan ketentuan klausul sebagai berikut:',
      pasalList: existingContract?.pasalList || [
        {
          id: 'pasal-1',
          judul: 'PASAL 1: HAK DAN KEWAJIBAN PELATIHAN',
          isi: '1. PIHAK PERTAMA berkewajiban menyediakan materi pelatihan standar kompetensi industri selama durasi yang disepakati.\n2. PIHAK KEDUA wajib mengikuti jadwal pembelajaran dan disiplin kehadiran minimal 90%.'
        },
        {
          id: 'pasal-2',
          judul: 'PASAL 2: GARANSI PROGRAM JOB MATCHING & PENYALURAN KERJA',
          isi: '1. PIHAK PERTAMA memberikan layanan garansi Job Matching dan penyaluran wawancara kerja dengan perusahaan mitra dalam & luar negeri.\n2. PIHAK KEDUA bersedia ditempatkan kerja sesuai kualifikasi hasil evaluasi kompetensi dan tes kesehatan.'
        },
        {
          id: 'pasal-3',
          judul: 'PASAL 3: TATA TERTIB & PERSETUJUAN ORANG TUA / PENJAMIN',
          isi: '1. Penjamin (Orang Tua/Wali) menyatakan memberikan izin penuh dan persetujuan legal atas keikutsertaan PIHAK KEDUA.\n2. Segala bentuk pelanggaran hukum atau pengunduran diri secara sepihak akan diproses sesuai ketentuan biaya operasional LPK.'
        }
      ]
    };
    saveContractRecord(updatedContract);

    setSaveSuccessMsg(
      lang === 'ja'
        ? '生徒データおよび6つの連携手順が正常に更新・同期されました！'
        : 'Data Siswa & Integrasi 6 Modul Prosedur Berhasil Diperbarui & Disinkronkan!'
    );
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 3500);
  };

  // Integrated Pipeline Status Items
  const isForwardedToAdmin2 = formData.statusPendaftaran === 'Diterima' || !!rirekishoRecords[student.id];

  const pipelineSteps = [
    {
      id: 'portal' as const,
      num: 1,
      title: lang === 'ja' ? '1. 登録ポータル' : '1. Portal Pendaftaran',
      statusText: formData.statusPendaftaran || (lang === 'ja' ? '登録済' : 'Terdaftar'),
      isComplete: formData.statusPendaftaran === 'Terdaftar' || formData.statusPendaftaran === 'Terverifikasi' || formData.statusPendaftaran === 'Diterima',
      color: 'indigo'
    },
    {
      id: 'kesehatan' as const,
      num: 2,
      title: lang === 'ja' ? '2. 健康診断 (MCU)' : '2. MCU Medis',
      statusText: healthStatusFit,
      isComplete: healthStatusFit === 'FIT',
      color: healthStatusFit === 'FIT' ? 'emerald' : healthStatusFit === 'PENDING' ? 'amber' : 'rose'
    },
    {
      id: 'disc' as const,
      num: 3,
      title: lang === 'ja' ? '3. DISC適性診断' : '3. Asesmen DISC',
      statusText: discDominant || (lang === 'ja' ? '未受検' : 'Belum Tes'),
      isComplete: !!discDominant,
      color: 'purple'
    },
    {
      id: 'psikotes' as const,
      num: 4,
      title: lang === 'ja' ? '4. 心理適性テスト' : '4. Psikotes 50 Soal',
      statusText: `${psikotesScore}% (${psikotesStatus === 'LULUS' ? (lang === 'ja' ? '合格' : 'LULUS') : (lang === 'ja' ? '不合格' : 'TIDAK LULUS')})`,
      isComplete: psikotesStatus === 'LULUS',
      color: psikotesStatus === 'LULUS' ? 'emerald' : 'rose'
    },
    {
      id: 'dana' as const,
      num: 5,
      title: lang === 'ja' ? '5. 学費支援・立替金' : '5. Dukungan Dana',
      statusText: `${skemaDana} (${statusDana})`,
      isComplete: statusDana === 'DISETUJUI',
      color: statusDana === 'DISETUJUI' ? 'emerald' : 'amber'
    },
    {
      id: 'kontrak' as const,
      num: 6,
      title: lang === 'ja' ? '6. 研修就業契約書' : '6. Perjanjian SPK',
      statusText: statusKontrak || 'Draft',
      isComplete: statusKontrak === 'SAH' || statusKontrak === 'DISETUJUI',
      color: 'emerald'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      <div className="bg-white text-slate-900 w-full h-full flex flex-col min-h-0 overflow-hidden">
        
        {/* Header Modal - Full Screen Mode */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 shrink-0 shadow-xs">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border border-emerald-300 mb-1">
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>{lang === 'ja' ? '生徒管理ポータル • フルスクリーン編集＆ワークフロー統合' : 'PORTAL ADMIN SISWA • FULL SCREEN EDIT & INTEGRASI WORKFLOW DATA'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'ja' ? `生徒データ編集: ${formData.namaLengkap || '生徒氏名'}` : `Edit Data: ${formData.namaLengkap || 'Nama Siswa'}`}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'ja' ? '身分証番号:' : 'NIK:'} {formData.noKtp} | ID: {formData.id} | {lang === 'ja' ? '区分:' : 'Kategori:'} <strong className="text-emerald-700">{formData.kategoriKandidat}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleSaveAll}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ja' ? '変更を保存' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 font-bold flex items-center justify-between animate-fadeIn">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </span>
          </div>
        )}

        {/* TOP INTEGRATED PROCEDURE PIPELINE BAR (6 STEPS SIDEBAR MENU) */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'ja' ? 'サイドバーモジュール統合手順 (6段階ワークフロー)' : 'Prosedur Integrasi Modul Sidebar (6 Langkah Workflow)'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              {lang === 'ja' ? '「モジュールを開く」をクリックして該当機能へ直接移動' : 'Klik "Buka Modul" untuk navigasi langsung ke menu sidebar terkait'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {pipelineSteps.map((step) => (
              <div
                key={step.id}
                className={`p-2 rounded-xl border flex flex-col justify-between transition ${
                  step.isComplete
                    ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-100'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="font-bold text-slate-300">{step.title}</span>
                    {step.isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] font-extrabold truncate">
                    {step.statusText}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenSidebarModule(step.id)}
                  className="mt-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-between bg-emerald-950/40 hover:bg-emerald-900/60 px-2 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                >
                  <span>{lang === 'ja' ? 'モジュールを開く' : 'Buka Modul'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="border-b border-slate-200 bg-white px-4 sm:px-6 pt-2.5 flex space-x-4 sm:space-x-6 overflow-x-auto text-xs font-bold text-slate-600 shrink-0">
          <button
            type="button"
            onClick={() => setModalTab('data')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'data'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ja' ? '1. プロフィール＆基本台帳' : '1. Profil & Portal'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('dokumen')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'dokumen'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ja' ? '2. 書類アップロード・提出書類' : '2. Upload & Berkas Dokumen'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('kesehatan')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'kesehatan'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ja' ? '3. 健康診断 (MCU)' : '3. MCU Medis'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('psikotes')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'psikotes'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-600" />
            <span>{lang === 'ja' ? '4 & 5. DISC適性＆心理テスト' : '4 & 5. DISC & Psikotes'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('pembiayaan')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'pembiayaan'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-600" />
            <span>{lang === 'ja' ? '6. 学費支援・立替金' : '6. Dukungan Dana'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('kontrak')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'kontrak'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ja' ? '7. 研修就業契約書 (SPK)' : '7. Perjanjian SPK'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('ringkasan')}
            className={`pb-2.5 border-b-2 transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              modalTab === 'ringkasan'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'ja' ? '要約＆書類管理引継ぎ' : 'Ringkasan & Admin Doc'}</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0 bg-slate-50/50">
          
          {/* TAB 1: DATA SISWA & PROFIL */}
          {modalTab === 'data' && (
            <div className="space-y-6">
              {/* Shortcut Banner to Sidebar Module 1 */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? 'モジュール1: 生徒登録ポータル＆提出書類' : 'Modul 1: Portal Pendaftaran & Kelengkapan Berkas Siswa'}</span>
                  </div>
                  <p className="text-emerald-700 mt-0.5">
                    {lang === 'ja' ? '個人プロフィール、身分証番号、家族・保証人情報、書類確認状況を更新します。' : 'Perbarui profil pribadi, NIK KTP, KK, data keluarga penjamin, dan status verifikasi berkas pendaftaran.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSidebarModule('portal')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{lang === 'ja' ? 'サイドバーの登録ポータルを開く' : 'Buka Modul Portal di Sidebar'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Pendaftaran SIM */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? '登録ステータス＆合格判定' : 'Status Pendaftaran & Kelulusan Admin Siswa'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '登録ステータス' : 'Status Pendaftaran SIM'}</label>
                    <select
                      value={formData.statusPendaftaran || 'Terdaftar'}
                      onChange={(e) => handleChange('statusPendaftaran', e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Draft">{lang === 'ja' ? 'ドラフト（入力中）' : 'Draft (Mengisi Formulir)'}</option>
                      <option value="Terdaftar">{lang === 'ja' ? '登録済（確認待ち）' : 'Terdaftar (Menunggu Verifikasi)'}</option>
                      <option value="Terverifikasi">{lang === 'ja' ? '確認済（書類完備）' : 'Terverifikasi (Berkas Lengkap)'}</option>
                      <option value="Diterima">{lang === 'ja' ? '合格・受入済（管理引継ぎへ）' : 'Diterima (LULUS → Forward Ke Admin Doc)'}</option>
                      <option value="Ditolak">{lang === 'ja' ? '不合格・辞退' : 'Ditolak / Gugur'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '候補者区分' : 'Kategori Candidate'}</label>
                    <select
                      value={formData.kategoriKandidat || 'SISWA IJEF - Offline'}
                      onChange={(e) => handleChange('kategoriKandidat', e.target.value as CandidateCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="SISWA IJEF - Offline">SISWA IJEF - Offline</option>
                      <option value="SISWA IJEF - Online">SISWA IJEF - Online</option>
                      <option value="SISWA MITRA / NON IJEF">SISWA MITRA / NON IJEF</option>
                      <option value="SISWA NON IJEF (New Comer)">SISWA NON IJEF (New Comer)</option>
                      <option value="MATCHING JOB - Engineering / Gijinkoku">MATCHING JOB - Engineering / Gijinkoku</option>
                      <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">MATCHING JOB - Ex-Magang / Ex-Trainee</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal Info Box */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? '生徒の個人情報' : 'Identitas Pribadi Siswa'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '氏名（身分証・旅券表記）' : 'Nama Lengkap (Sesuai KTP/Paspor)'}</label>
                    <input
                      type="text"
                      value={formData.namaLengkap || ''}
                      onChange={(e) => handleChange('namaLengkap', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '身分証番号 (NIK)' : 'Nomor KTP (NIK)'}</label>
                    <input
                      type="text"
                      value={formData.noKtp || ''}
                      onChange={(e) => handleChange('noKtp', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '家族カード番号 (KK)' : 'Nomor Kartu Keluarga (KK)'}</label>
                    <input
                      type="text"
                      value={formData.noKk || ''}
                      onChange={(e) => handleChange('noKk', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? 'メールアドレス' : 'Email Siswa'}</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '電話番号 / WhatsApp' : 'Nomor HP / WhatsApp'}</label>
                    <input
                      type="text"
                      value={formData.noHp || ''}
                      onChange={(e) => handleChange('noHp', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '出生地' : 'Tempat Lahir'}</label>
                    <input
                      type="text"
                      value={formData.tempatLahir || ''}
                      onChange={(e) => handleChange('tempatLahir', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-bold">{lang === 'ja' ? '生年月日' : 'Tanggal Lahir'}</label>
                      {formData.tanggalLahir && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {lang === 'ja'
                            ? `年齢: ${calculateAgeFromBirthDate(formData.tanggalLahir)} 歳`
                            : `Usia: ${calculateAgeFromBirthDate(formData.tanggalLahir)} Tahun`}
                        </span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={formData.tanggalLahir || ''}
                      onChange={(e) => handleChange('tanggalLahir', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '性別' : 'Jenis Kelamin'}</label>
                    <select
                      value={formData.jenisKelamin || 'Laki-laki'}
                      onChange={(e) => handleChange('jenisKelamin', e.target.value as Gender)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Laki-laki">{lang === 'ja' ? '男性 (Laki-laki)' : 'Laki-laki'}</option>
                      <option value="Perempuan">{lang === 'ja' ? '女性 (Perempuan)' : 'Perempuan'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '宗教' : 'Agama'}</label>
                    <select
                      value={formData.agama || 'Islam'}
                      onChange={(e) => handleChange('agama', e.target.value as Religion)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Islam">{lang === 'ja' ? 'イスラム教 (Islam)' : 'Islam'}</option>
                      <option value="Kristen">{lang === 'ja' ? 'キリスト教 (Kristen)' : 'Kristen'}</option>
                      <option value="Katolik">{lang === 'ja' ? 'カトリック (Katolik)' : 'Katolik'}</option>
                      <option value="Hindu">{lang === 'ja' ? 'ヒンドゥー教 (Hindu)' : 'Hindu'}</option>
                      <option value="Buddha">{lang === 'ja' ? '仏教 (Buddha)' : 'Buddha'}</option>
                      <option value="Khonghucu">{lang === 'ja' ? '儒教 (Khonghucu)' : 'Khonghucu'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '血液型' : 'Golongan Darah'}</label>
                    <select
                      value={formData.golonganDarah || 'O'}
                      onChange={(e) => handleChange('golonganDarah', e.target.value as BloodType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '婚姻状況' : 'Status Perkawinan'}</label>
                    <select
                      value={formData.statusPerkawinan || 'Lajang'}
                      onChange={(e) => handleChange('statusPerkawinan', e.target.value as MaritalStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Lajang">{lang === 'ja' ? '独身 (Lajang)' : 'Lajang'}</option>
                      <option value="Menikah">{lang === 'ja' ? '既婚 (Menikah)' : 'Menikah'}</option>
                      <option value="Duda/Janda">{lang === 'ja' ? '死別・離別 (Duda/Janda)' : 'Duda/Janda'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '現住所' : 'Alamat Domisili Lengkap'}</label>
                  <textarea
                    rows={2}
                    value={formData.alamatDomisili || ''}
                    onChange={(e) => handleChange('alamatDomisili', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? '家族・保証人情報' : 'Data Keluarga & Penjamin Orang Tua'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '父の氏名' : 'Nama Ayah Kandung'}</label>
                    <input
                      type="text"
                      value={formData.namaAyah || ''}
                      onChange={(e) => handleChange('namaAyah', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '父の職業' : 'Pekerjaan Ayah'}</label>
                    <input
                      type="text"
                      value={formData.pekerjaanAyah || ''}
                      onChange={(e) => handleChange('pekerjaanAyah', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '母の氏名' : 'Nama Ibu Kandung'}</label>
                    <input
                      type="text"
                      value={formData.namaIbu || ''}
                      onChange={(e) => handleChange('namaIbu', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '母の職業' : 'Pekerjaan Ibu'}</label>
                    <input
                      type="text"
                      value={formData.pekerjaanIbu || ''}
                      onChange={(e) => handleChange('pekerjaanIbu', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: UPLOAD DOKUMEN & BERKAS */}
          {modalTab === 'dokumen' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? '必要書類・証明書アップロード' : 'Upload & Berkas Dokumen Persyaratan Siswa'}</span>
                  </div>
                  <p className="text-emerald-700 mt-0.5">
                    {lang === 'ja' ? 'PDF、JPG、PNG、DOCX、MP4などの各フォーマットまたはGoogle Driveリンクの添付に対応。' : 'Mendukung upload file bebas format (PDF, JPG, PNG, DOCX, MP4, dll) atau lampirkan link Google Drive/URL.'}
                  </p>
                </div>
              </div>

              <CandidateDocumentUploadSection
                documents={{
                  ...(formData.berkasDokumen || {}),
                  ...(rirekishoRecords[student.id]?.dokumenUpload || {}),
                  pasPhoto3x4: formData.berkasDokumen?.pasPhoto3x4 || formData.berkasDokumen?.pasFoto || (formData as any).pasPhoto || (formData as any).pasFoto || rirekishoRecords[student.id]?.pasPhoto || rirekishoRecords[student.id]?.pasFotoUrl || rirekishoRecords[student.id]?.dokumenUpload?.pasPhoto3x4 || '',
                  videoJikoshoukai: formData.berkasDokumen?.videoJikoshoukai || rirekishoRecords[student.id]?.dokumenUpload?.videoJikoshoukai || rirekishoRecords[student.id]?.videoJikoshoukaiUrl || ''
                }}
                onChange={(updatedDocs) => {
                  setFormData(((prev: any) => ({
                    ...prev,
                    pasPhoto: (updatedDocs as any).pasPhoto3x4 || prev.berkasDokumen?.pasFoto || (prev as any).pasPhoto,
                    pasFoto: (updatedDocs as any).pasPhoto3x4 || prev.berkasDokumen?.pasFoto || (prev as any).pasPhoto,
                    berkasDokumen: {
                      ...(prev.berkasDokumen || {}),
                      ...updatedDocs,
                      pasFoto: (updatedDocs as any).pasPhoto3x4 || prev.berkasDokumen?.pasFoto,
                      videoJikoshoukai: (updatedDocs as any).videoJikoshoukai || prev.berkasDokumen?.videoJikoshoukai
                    }
                  })) as any);
                }}
                candidateName={formData.namaLengkap}
                showSaveButton={true}
                onSave={handleSaveAll}
                lang={lang}
              />
            </div>
          )}

          {/* TAB 2: MCU KESEHATAN */}
          {modalTab === 'kesehatan' && (
            <div className="space-y-6">
              {/* Shortcut Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center space-x-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? 'モジュール2: 健康診断スクリーニング＆就業適性判定 (MCU)' : 'Modul 2: Skrining MCU Medis & Fit To Work'}</span>
                  </div>
                  <p className="text-emerald-700 mt-0.5">
                    {lang === 'ja' ? '医師による診断結果、体力テスト、レントゲン検査結果等の記録。' : 'Hasil tes kesehatan medis, diagnosa dokter, uji fisik push-up/sit-up, dan radiologi paru RSU.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSidebarModule('kesehatan')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{lang === 'ja' ? 'サイドバーの健康診断を開く' : 'Buka Modul MCU di Sidebar'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* MCU Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ja' ? '健康評価＆検査結果' : 'Hasil Evaluasi Kebugaran Fisik & Lab Medis'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '健康診断ステータス (MCU)' : 'Status Kebugaran Fisik (MCU)'}</label>
                    <select
                      value={healthStatusFit}
                      onChange={(e) => setHealthStatusFit(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="FIT">{lang === 'ja' ? '合格・健康 (FIT)' : 'FIT (Lulus Medis / Bebas Penyakit)'}</option>
                      <option value="PENDING">{lang === 'ja' ? '保留・再検査要 (PENDING)' : 'PENDING (Perlu Treatment / MCU Ulang)'}</option>
                      <option value="UNFIT">{lang === 'ja' ? '不合格 (UNFIT)' : 'UNFIT (Tidak Lulus Medis)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '検査医療機関 / クリニック' : 'Faskes / Klinik Pemeriksa'}</label>
                    <input
                      type="text"
                      value={existingHealth?.faskesPemeriksa || (lang === 'ja' ? '提携病院 / 検査クリニック' : 'RSU / Klinik Lab Rujukan LPK')}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '医師の診断特記事項・レントゲン結果' : 'Catatan Diagnosa Dokter & Hasil Lab Radiologi'}</label>
                  <textarea
                    rows={3}
                    value={healthCatatan}
                    onChange={(e) => setHealthCatatan(e.target.value)}
                    placeholder={lang === 'ja' ? '例: 血圧正常 120/80、肺レントゲン異常なし、肝炎・薬物陰性。' : 'Contoh: Tekanan darah normal 120/80, paru-paru jernih, bebas Hepatitis & Narkoba.'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISC & PSIKOTES */}
          {modalTab === 'psikotes' && (
            <div className="space-y-6">
              {/* Shortcut Banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-purple-900 flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    <span>{lang === 'ja' ? 'モジュール3 & 4: DISC性格適性＆心理テスト50問' : 'Modul 3 & 4: Asesmen Kepribadian DISC & Psikotes 50 Soal'}</span>
                  </div>
                  <p className="text-purple-700 mt-0.5">
                    {lang === 'ja' ? '日本企業での勤務適性、思考論理、推奨職種の診断。' : 'Karakter kerja calon pekerja Jepang, logika berpikir, dan rekomendasi bidang penempatan.'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenSidebarModule('disc')}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{lang === 'ja' ? 'DISCを開く' : 'Buka DISC'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenSidebarModule('psikotes')}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xs transition text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <span>{lang === 'ja' ? '心理テストを開く' : 'Buka Psikotes'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Form DISC & Psikotes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span>{lang === 'ja' ? '心理診断・適性評価結果' : 'Progres & Hasil Asesmen Psikologi'}</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '主要タイプ (DISC)' : 'Tipe Karakter Dominan (DISC)'}</label>
                    <select
                      value={discDominant}
                      onChange={(e) => setDiscDominant(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Dominance">{lang === 'ja' ? 'Dominance (D) - 主導型 / 決断力' : 'Dominance (D) - Pemimpin / Tegas'}</option>
                      <option value="Influence">{lang === 'ja' ? 'Influence (I) - 社交型 / コミュニケーション' : 'Influence (I) - Komunikatif / Antusias'}</option>
                      <option value="Steadiness">{lang === 'ja' ? 'Steadiness (S) - 安定型 / 丁寧（介護向き）' : 'Steadiness (S) - Ketenangan / Telaten (Kaigo)'}</option>
                      <option value="Compliance">{lang === 'ja' ? 'Compliance (C) - 規律型 / 几帳面（製造向き）' : 'Compliance (C) - Patuh / Teliti (Manufaktur)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? 'テスト得点 (%)' : 'Skor Psikotes (%)'}</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={psikotesScore}
                      onChange={(e) => setPsikotesScore(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '合否ステータス' : 'Status Kelulusan Psikotes'}</label>
                    <select
                      value={psikotesStatus}
                      onChange={(e) => setPsikotesStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="LULUS">{lang === 'ja' ? '合格（マッチング推薦可能）' : 'LULUS (Siap Penempatan)'}</option>
                      <option value="TIDAK LULUS">{lang === 'ja' ? '不合格（再評価要）' : 'TIDAK LULUS (Perlu Evaluasi)'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DUKUNGAN DANA */}
          {modalTab === 'pembiayaan' && (
            <div className="space-y-6">
              {/* Shortcut Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-amber-900 flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ja' ? 'モジュール5: 学費・立替金支援申請' : 'Modul 5: Aplikasi Dukungan Dana Pelatihan & Dana Talang'}</span>
                  </div>
                  <p className="text-amber-800 mt-0.5">
                    {lang === 'ja' ? '資金計画申請、保証人確認、財務部門承認プロセスの管理。' : 'Pengajuan pembiayaan, verifikasi KTP/KK penjamin orang tua, dan tahapan persetujuan Finance.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSidebarModule('dana')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{lang === 'ja' ? 'サイドバーの学費支援を開く' : 'Buka Modul Dukungan Dana di Sidebar'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '支払・支援スキーム' : 'Skema Program Pembiayaan'}</label>
                    <select
                      value={skemaDana}
                      onChange={(e) => setSkemaDana(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="DT 100%">{lang === 'ja' ? '立替金 100% (就業後給与控除)' : 'Dana Talang 100% (Bayar Setelah Kerja/Potong Gaji)'}</option>
                      <option value="DT 50%">{lang === 'ja' ? '立替金 50% + 頭金 50%' : 'Dana Talang 50% + DP 50%'}</option>
                      <option value="DP 30%">{lang === 'ja' ? '頭金 30% + 立替金 70%' : 'DP 30% + Dana Talang 70%'}</option>
                      <option value="Reguler 100%">{lang === 'ja' ? '自己負担 / 一括納入 100%' : 'Mandiri / Reguler 100% (Lunas di Awal)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '保証人確認・承認ステータス' : 'Status Approval Verifikasi Penjamin'}</label>
                    <select
                      value={statusDana}
                      onChange={(e) => setStatusDana(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="DISETUJUI">{lang === 'ja' ? '承認済（保証人確認完了）' : 'DISETUJUI (Persyaratan Penjamin Valid)'}</option>
                      <option value="PENGAJUAN">{lang === 'ja' ? '審査中（書類確認待ち）' : 'PENGAJUAN (Menunggu Verifikasi KTP/KK/Slip Gaji)'}</option>
                      <option value="DRAFT">{lang === 'ja' ? '下書き (DRAFT)' : 'DRAFT'}</option>
                      <option value="DITOLAK">{lang === 'ja' ? '却下 (DITOLAK)' : 'DITOLAK'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SURAT PERJANJIAN SPK */}
          {modalTab === 'kontrak' && (
            <div className="space-y-6">
              {/* Shortcut Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'ja' ? 'モジュール6: LPK研修就業契約書 (SPK)' : 'Modul 6: Surat Perjanjian SPK Keikutsertaan Pelatihan LPK'}</span>
                  </div>
                  <p className="text-emerald-800 mt-0.5">
                    {lang === 'ja' ? '公式契約番号、権利義務関係、LPK代表および生徒・保護者署名。' : 'Nomor surat perjanjian resmi, legalitas hak dan kewajiban, serta penandatanganan Pihak LPK dan Wali/Orang Tua.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenSidebarModule('kontrak')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{lang === 'ja' ? 'サイドバーの契約書を開く' : 'Buka Modul Surat Perjanjian di Sidebar'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '契約番号 (SPK)' : 'Nomor Surat Perjanjian (SPK)'}</label>
                    <input
                      type="text"
                      value={nomorKontrak}
                      onChange={(e) => setNomorKontrak(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">{lang === 'ja' ? '契約法的効力ステータス' : 'Status Legalitas SPK'}</label>
                    <select
                      value={statusKontrak}
                      onChange={(e) => setStatusKontrak(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="SAH">{lang === 'ja' ? '有効・締結済 (SAH)' : 'SAH (Telah Ditandatangani & Disetujui)'}</option>
                      <option value="DRAFT">{lang === 'ja' ? '下書き・審査中 (DRAFT)' : 'DRAFT (Dalam Peninjauan)'}</option>
                      <option value="DITOLAK">{lang === 'ja' ? '却下 (DITOLAK)' : 'DITOLAK'}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: RINGKASAN INTEGRASI WORKFLOW & FORWARD ADMIN DOC */}
          {modalTab === 'ringkasan' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-6 border border-emerald-800 space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold font-mono text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>{lang === 'ja' ? '生徒管理 → 書類管理 連携手順ステータス' : 'Status Kelengkapan Prosedur Integrasi Admin Siswa → Admin Doc'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {lang === 'ja' ? `生徒適格性評価: ${formData.namaLengkap}` : `Evaluasi Kelayakan Siswa ${formData.namaLengkap}`}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {lang === 'ja' ? '日本企業マッチングポータル（書類管理）への引き継ぎ前に、生徒管理の全6手順の完了を確認します。' : 'Memastikan seluruh 6 tahapan prosedur di Admin Siswa telah selesai sebelum diteruskan ke Portal CV-Rirekisho & Job Matching Japan (Admin Doc).'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px]">{lang === 'ja' ? '書類管理への連携状況' : 'Status LULUS & Forward Admin Doc'}</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {isForwardedToAdmin2 ? (lang === 'ja' ? '✓ 書類管理に同期済' : '✓ Tersinkron di Admin Doc') : (lang === 'ja' ? '未連携' : 'Belum Diteruskan')}
                    </span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px]">{lang === 'ja' ? '指導評価特記事項' : 'Catatan Perkembangan (Admin Siswa)'}</span>
                    <span className="font-medium text-slate-200 truncate block">
                      {catatanPerkembangan || (lang === 'ja' ? 'マッチング準備完了' : 'Siap mengikuti proses matching')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  {isForwardedToAdmin2 ? (
                    <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'ja' ? '書類管理ポータルで有効化済（マッチング準備完了）' : 'Siswa Sudah Aktif di Portal Admin Doc (Siap Job Matching)'}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveAll();
                        forwardStudentToAdmin2(student.id);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer text-xs"
                    >
                      <Award className="w-4 h-4" />
                      <span>{lang === 'ja' ? '合格認定＆書類管理へ即時引き継ぎ' : 'Luluskan & Teruskan Data Ke Admin Doc Sekarang'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Catatan Perkembangan Textarea */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold text-xs uppercase font-mono tracking-wider">
                  {lang === 'ja' ? '生徒研修進捗評価メモ (管理メモ)' : 'Catatan Evaluasi Perkembangan Pelatihan Siswa (Admin Note)'}
                </label>
                <textarea
                  rows={3}
                  value={catatanPerkembangan}
                  onChange={(e) => setCatatanPerkembangan(e.target.value)}
                  placeholder={lang === 'ja' ? '規律、日本語の習得度、または生徒の成長に関する特記事項を記入してください...' : 'Tuliskan catatan khusus terkait kedisiplinan, hafalan bahasa Jepang, atau perkembangan siswa...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{lang === 'ja' ? '生徒管理＆書類管理データベースに自動同期中' : 'Tersinkronisasi Otomatis ke Database Admin Siswa & Doc'}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border border-slate-300 shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'ja' ? '戻る' : 'Kembali'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ja' ? '変更を保存・適用' : 'Simpan & Terapkan Perubahan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
