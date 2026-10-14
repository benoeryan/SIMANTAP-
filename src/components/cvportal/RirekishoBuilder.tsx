import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import useSyncCRMLead from '../../hooks/useSyncCRMLead';
import { JapaneseCVSheet } from '../JapaneseCVSheet';
import { CandidateDocumentUploadSection } from './CandidateDocumentUploadSection';
import { calculateAgeFromBirthDate } from '../../utils/candidateUtils';
import {
  CVRirekisho,
  FamilyMemberItem,
  DetailedWorkExperienceItem,
  JLPTLevel,
  CandidateCategory,
  Gender,
  MaritalStatus
} from '../../types';
import {
  FileText,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  Sparkles,
  UserCheck,
  Video,
  Award,
  GraduationCap,
  Briefcase,
  Globe,
  Building2,
  User,
  Users,
  Printer,
  Upload,
  ArrowLeft,
  Calendar,
  Heart,
  Phone,
  Mail,
  MapPin,
  HelpCircle,
  FileCheck
} from 'lucide-react';

export const RirekishoBuilder: React.FC = () => {
  const { user } = useAuth();
  const { leadData } = useSyncCRMLead();
  const { rirekishoRecords, saveRirekishoRecord, students, lang } = useApp();

  const userEmail = user?.email || leadData?.email || 'kandidat@gmail.com';
  const crmCategory: CandidateCategory =
    leadData?.kategoriKandidat || 'SISWA NON IJEF (New Comer)';

  // Find matching student from master student database to ensure no previous documents are lost
  const matchingStudent = React.useMemo(() => {
    return students.find(
      (s) =>
        s.id === user?.uid ||
        (s.email && userEmail && s.email.toLowerCase() === userEmail.toLowerCase()) ||
        (leadData?.namaLengkap && s.namaLengkap && s.namaLengkap.toLowerCase() === leadData.namaLengkap.toLowerCase())
    );
  }, [students, user?.uid, userEmail, leadData?.namaLengkap]);

  // Navigation mode between Form Entry and CV Preview
  const [activeViewMode, setActiveViewMode] = useState<'FORM' | 'CV_PREVIEW'>('FORM');
  const [successNotice, setSuccessNotice] = useState('');

  // Initial family members (4 items)
  const defaultFamilyMembers: FamilyMemberItem[] = [
    { namaLengkap: '', hubungan: 'Ayah', usia: '', pekerjaan: '', gajiPerBulan: '', tinggalBersama: 'YA' },
    { namaLengkap: '', hubungan: 'Ibu', usia: '', pekerjaan: '', gajiPerBulan: '', tinggalBersama: 'YA' },
    { namaLengkap: '', hubungan: 'Kakak', usia: '', pekerjaan: '', gajiPerBulan: '', tinggalBersama: 'YA' },
    { namaLengkap: '', hubungan: 'Adik', usia: '', pekerjaan: '', gajiPerBulan: '', tinggalBersama: 'YA' }
  ];

  // Initial work items (4 items)
  const defaultWorkExperience: DetailedWorkExperienceItem[] = [
    { namaPerusahaan: '', bidangPekerjaan: '', tanggalMasuk: '', tanggalKeluar: '', statusPekerja: 'Kontrak', uraianPekerjaan: '' },
    { namaPerusahaan: '', bidangPekerjaan: '', tanggalMasuk: '', tanggalKeluar: '', statusPekerja: 'Kontrak', uraianPekerjaan: '' },
    { namaPerusahaan: '', bidangPekerjaan: '', tanggalMasuk: '', tanggalKeluar: '', statusPekerja: 'Kontrak', uraianPekerjaan: '' },
    { namaPerusahaan: '', bidangPekerjaan: '', tanggalMasuk: '', tanggalKeluar: '', statusPekerja: 'Kontrak', uraianPekerjaan: '' }
  ];

  // Find existing CV or create default form
  const existingCV = (Object.values(rirekishoRecords) as CVRirekisho[]).find(
    (cv) => cv.email?.toLowerCase() === userEmail.toLowerCase()
  );

  const [formData, setFormData] = useState<CVRirekisho>(() => {
    if (existingCV) {
      return {
        ...existingCV,
        email: userEmail,
        kategoriKandidat: crmCategory,
        dataKeluarga: existingCV.dataKeluarga && existingCV.dataKeluarga.length > 0 ? existingCV.dataKeluarga : defaultFamilyMembers,
        pekerjaanDetail: existingCV.pekerjaanDetail && existingCV.pekerjaanDetail.length > 0 ? existingCV.pekerjaanDetail : defaultWorkExperience,
        pendidikanDetail: existingCV.pendidikanDetail || {
          sd: { namaSekolah: '', tahunMasuk: '', tahunLulus: '' },
          smp: { namaSekolah: '', tahunMasuk: '', tahunLulus: '' },
          sma: { namaSekolah: '', tahunMasuk: '', tahunLulus: '', jurusan: '' },
          universitas: { namaSekolah: '', tahunMasuk: '', tahunLulus: '', jurusan: '' }
        },
        dokumenUpload: {
          ...(matchingStudent?.berkasDokumen || {}),
          ...(existingCV.dokumenUpload || {}),
          pasPhoto3x4: existingCV.dokumenUpload?.pasPhoto3x4 || existingCV.pasFotoUrl || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || user?.photoURL || '',
          videoJikoshoukai: existingCV.dokumenUpload?.videoJikoshoukai || existingCV.videoJikoshoukaiUrl || matchingStudent?.berkasDokumen?.videoJikoshoukai || ''
        }
      };
    }

    return {
      id: `CV-JPN-${Date.now()}`,
      siswaId: user?.uid || `SISWA-${Date.now()}`,
      kodeReferensi: '',
      kodeJob: '',
      kategoriKandidat: crmCategory,
      bidangKerja: 'KAIGO',
      namaLengkap: user?.displayName || leadData?.namaLengkap || '',
      namaKatakana: '',
      namaPanggilan: '',
      email: userEmail,
      noHp: leadData?.whatsapp || '',
      tanggalLahir: '2001-05-20',
      tempatLahir: 'Bandung',
      alamatLengkap: '',
      jenisKelamin: 'Laki-laki',
      agama: 'Islam',
      golonganDarah: 'O',
      tinggiBadan: 165,
      beratBadan: 58,
      dominanTangan: 'Kanan',
      butaWarna: 'TIDAK',
      merokok: 'TIDAK',
      minumAlkohol: 'TIDAK',
      memilikiTato: 'TIDAK',
      penyakitBerat: 'TIDAK',
      alergi: 'TIDAK',
      hobi: 'Membaca, Memasak',
      statusPernikahan: 'Lajang',
      memilikiSim: 'YA',

      pernahKeJepang: 'TIDAK',
      memilikiPaspor: 'YA',
      noPaspor: '',

      dataKeluarga: defaultFamilyMembers,

      pendidikanDetail: {
        sd: { namaSekolah: 'SDN 1 Bandung', tahunMasuk: '2007', tahunLulus: '2013' },
        smp: { namaSekolah: 'SMPN 2 Bandung', tahunMasuk: '2013', tahunLulus: '2016' },
        sma: { namaSekolah: 'SMKN 1 Bandung', tahunMasuk: '2016', tahunLulus: '2019', jurusan: 'Keperawatan' },
        universitas: { namaSekolah: '', tahunMasuk: '', tahunLulus: '', jurusan: '' }
      },
      riwayatPendidikan: [
        { id: '1', namaSekolah: 'SMKN 1 Bandung', jurusan: 'Keperawatan', bulanTahunMasuk: '2016-07', bulanTahunLulus: '2019-06' }
      ],

      pekerjaanDetail: defaultWorkExperience,
      riwayatPekerjaan: [],

      kelebihanAnda: 'Disiplin, bertanggung jawab, bekerja keras, ramah, dan cepat belajar hal baru.',
      kekuranganAnda: 'Kadang terlalu perfeksionis namun selalu berusaha mengatur waktu dengan baik.',
      alasanInginKeJepang: 'Ingin menambah pengalaman kerja internasional, mempelajari teknologi perawatan di Jepang, serta membantu perekonomian keluarga.',
      alasanMelamarBidangIni: 'Memiliki latar belakang pendidikan perawatan dan ingin mendalami profesi caregiver professional.',
      alasanKaigo: 'Memiliki passion membantu lansia dengan penuh kasih sayang dan dedikasi.',
      impianMasaDepan: 'Menjadi praktisi caregiver bersertifikat Kaigofukushishi di Jepang dan membangun usaha fasilitas lansia di Indonesia.',
      lamaTinggalJepang: '5 Tahun',
      lamaBelajarBahasaJepang: '6 Bulan',
      shidouDoki: '日本の高齢者介護技術と文化を深く学び、質の高いサービスを提供したいと考えております。',
      prKeunggulanDiri: 'Tepat waktu, memiliki dedikasi tinggi, dan ramah.',

      kontakDarurat: {
        noHpDarurat: '',
        namaPemilikNoDarurat: '',
        hubunganDenganPelamar: 'Ayah Kandung'
      },

      dokumenUpload: {
        ...(matchingStudent?.berkasDokumen || {}),
        pasPhoto3x4: user?.photoURL || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || '',
        sertifikatBahasaJepang: matchingStudent?.berkasDokumen?.sertifikatJft || '',
        videoScreenRecordingJft: '',
        sertifikatSsw: matchingStudent?.berkasDokumen?.sertifikatSswKaigoSkill || '',
        videoScreenRecordingSsw: '',
        cvRirekishoDoc: matchingStudent?.berkasDokumen?.cv || ''
      },
      pasFotoUrl: user?.photoURL || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || '',

      levelBahasaJepang: 'N4',
      skorJftAtauJlpt: 'JFT-Basic A2 Lulus',
      sertifikatSsw: ['Tokutei Ginou Kaigo (Keperawatan)'],
      statusCV: 'Draft',
      updatedAt: new Date().toISOString()
    };
  });

  // Keep locked fields strictly synced from CRM & merge matching student documents if available
  useEffect(() => {
    if (existingCV) {
      setFormData((prev) => {
        if (
          prev.id === existingCV.id &&
          prev.updatedAt === existingCV.updatedAt &&
          prev.email === userEmail &&
          prev.kategoriKandidat === crmCategory
        ) {
          return prev;
        }
        return {
          ...prev,
          ...existingCV,
          email: userEmail,
          kategoriKandidat: crmCategory,
          dokumenUpload: {
            ...(matchingStudent?.berkasDokumen || {}),
            ...(existingCV.dokumenUpload || {}),
            pasPhoto3x4: existingCV.dokumenUpload?.pasPhoto3x4 || existingCV.pasFotoUrl || matchingStudent?.berkasDokumen?.pasPhoto3x4 || matchingStudent?.berkasDokumen?.pasFoto || prev.dokumenUpload?.pasPhoto3x4 || '',
            videoJikoshoukai: existingCV.dokumenUpload?.videoJikoshoukai || existingCV.videoJikoshoukaiUrl || matchingStudent?.berkasDokumen?.videoJikoshoukai || prev.dokumenUpload?.videoJikoshoukai || ''
          }
        };
      });
    } else if (matchingStudent?.berkasDokumen) {
      setFormData((prev) => {
        if (prev.email === userEmail && prev.kategoriKandidat === crmCategory && prev.dokumenUpload?.pasPhoto3x4) {
          return prev;
        }
        return {
          ...prev,
          email: userEmail,
          kategoriKandidat: crmCategory,
          dokumenUpload: {
            ...matchingStudent.berkasDokumen,
            ...(prev.dokumenUpload || {}),
            pasPhoto3x4: prev.dokumenUpload?.pasPhoto3x4 || matchingStudent.berkasDokumen.pasPhoto3x4 || matchingStudent.berkasDokumen.pasFoto || '',
            videoJikoshoukai: prev.dokumenUpload?.videoJikoshoukai || matchingStudent.berkasDokumen.videoJikoshoukai || ''
          }
        };
      });
    }
  }, [userEmail, crmCategory, existingCV?.id, existingCV?.updatedAt, matchingStudent?.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const computedUmur = calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22);
    const updatedCV: CVRirekisho = {
      ...formData,
      umur: computedUmur,
      tempatTanggalLahir: `${formData.tempatLahir || ''}, ${formData.tanggalLahir || ''}`.trim().replace(/^,/, ''),
      email: userEmail,
      kategoriKandidat: crmCategory,
      statusCV: 'Terverifikasi Admin',
      updatedAt: new Date().toISOString()
    };
    saveRirekishoRecord(updatedCV);
    setSuccessNotice(lang === 'ja' ? '候補生CVデータが正常に保存・同期されました！' : 'Data CV Kandidat berhasil disimpan dan disinkronkan!');
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handlePrintCV = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
              {crmCategory === 'SISWA NON IJEF (New Comer)'
                ? (lang === 'ja' ? '一般新規候補生' : 'SISWA NON IJEF (New Comer)')
                : crmCategory === 'MATCHING JOB - Engineering / Gijinkoku'
                ? (lang === 'ja' ? 'マッチング案件 (技人国)' : 'MATCHING JOB - Engineering / Gijinkoku')
                : crmCategory === 'MATCHING JOB - Ex-Magang / Ex-Trainee'
                ? (lang === 'ja' ? 'マッチング案件 (実習生経験者)' : 'MATCHING JOB - Ex-Magang / Ex-Trainee')
                : crmCategory}
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {formData.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            {lang === 'ja' ? '候補生情報入力フォーム' : 'Form Data Kandidat'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === 'ja'
              ? '日本企業標準のJIS規格履歴書作成のための情報を入力してください'
              : 'Isi data lengkap Anda untuk pembuatan CV Rirekisho Standar Perusahaan Jepang'}
          </p>
        </div>

        {/* View Switch Buttons */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 space-x-1 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => setActiveViewMode('FORM')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeViewMode === 'FORM'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{lang === 'ja' ? 'フォーム入力' : 'Isi Form Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('CV_PREVIEW')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeViewMode === 'CV_PREVIEW'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{lang === 'ja' ? 'JIS履歴書プレビュー' : 'Pratinjau Tampilan CV (JIS)'}</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-emerald-400 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: FORM DATA INPUT (MATCHES REF IMAGES 1 - 8)        */}
      {/* ========================================================= */}
      {activeViewMode === 'FORM' && (
        <form onSubmit={handleSave} className="space-y-6 text-slate-100">
          {/* Real-time Progress Status & Interview Banner */}
          {(formData.statusProgres || formData.detailProgres || formData.namaTSK) && (
            <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                      {lang === 'ja' ? '進捗ステータス・管理ポータル更新' : 'Status Progres & Update Portal Admin'}
                    </span>
                    <h3 className="font-extrabold text-white text-sm">
                      {formData.namaLengkap || (lang === 'ja' ? '候補生' : 'Kandidat')} — {formData.statusProgres || (lang === 'ja' ? '手続き進行中' : 'On Proses')}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                      formData.statusProgres === 'Lolos Interview (Naitei)'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                        : formData.statusProgres === 'Terjadwal Interview'
                        ? 'bg-purple-950 text-purple-200 border-purple-500/60 animate-pulse'
                        : formData.statusProgres?.includes('Visa') || formData.statusProgres?.includes('COE')
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-500/60'
                        : formData.statusProgres === 'Cancel'
                        ? 'bg-rose-950 text-rose-300 border-rose-500/60'
                        : 'bg-blue-950 text-blue-300 border-blue-500/60'
                    }`}
                  >
                    {formData.statusProgres === 'Terjadwal Interview'
                      ? (lang === 'ja' ? '面接日程確定' : 'Terjadwal Interview')
                      : formData.statusProgres === 'Lolos Interview (Naitei)'
                      ? (lang === 'ja' ? '面接合格（内定）' : 'Lolos Interview (Naitei)')
                      : formData.statusProgres === 'On Proses' || !formData.statusProgres
                      ? (lang === 'ja' ? '進行中' : 'On Proses')
                      : formData.statusProgres}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>{lang === 'ja' ? '進捗メモ・登録支援機関(TSK):' : 'Catatan Progres & TSK:'}</span>
                  </div>
                  <p className="text-slate-200 font-medium">
                    {formData.keteranganProgres || formData.detailProgres || formData.namaTSK || (lang === 'ja' ? 'LPK IJEF CORPの管理者による書類審査中です。' : 'Dalam peninjauan kualifikasi berkas Rirekisho oleh Admin LPK IJEF CORP.')}
                  </p>
                  {formData.namaPerusahaanJp && (
                    <div className="pt-1 text-[11px] text-purple-300 font-semibold flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-purple-400" />
                      <span>{formData.namaPerusahaanJp} {formData.lokasiPerusahaanJp ? `(${formData.lokasiPerusahaanJp})` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Check matching application in jobApplications */}
                {(() => {
                  return (
                    <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-amber-400 flex items-center space-x-1.5">
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lang === 'ja' ? '面接日程（Zoom／対面）:' : 'Status Interview Zoom / Offline:'}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">
                          {formData.statusProgres === 'Terjadwal Interview'
                            ? (lang === 'ja' ? '日本企業の面接が設定されています。開始15分前にはご準備ください。' : 'Anda memiliki jadwal interview perusahaan Jepang. Mohon hadir 15 menit sebelum sesi dimulai.')
                            : formData.statusProgres === 'Lolos Interview (Naitei)'
                            ? (lang === 'ja' ? 'おめでとうございます！面接合格（内定）です。ビザ・COE申請手続きをお待ちください。' : 'Selamat! Anda dinyatakan LOLOS Interview (Naitei). Menunggu proses visa/COE.')
                            : (lang === 'ja' ? '現在アクティブな面接日程はありません。書類の更新をお待ちください。' : 'Belum ada jadwal interview aktif. Pantau update berkas Anda.')}
                        </p>
                      </div>

                      <div className="pt-2 text-[10px] text-slate-400 italic">
                        {lang === 'ja' ? 'LPK IJEF CORP管理部門によるリアルタイム更新' : 'Diperbarui real-time oleh Back-Office Admin Doc LPK IJEF CORP.'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Card 1: Data Pribadi */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <User className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '1. 基本情報・個人データ' : '1. Data Pribadi'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Kode Referensi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '紹介元・リファレンスコード' : 'Kode Referensi'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: 事務所名' : 'Contoh: Jimusho'}
                  value={formData.kodeReferensi || ''}
                  onChange={(e) => setFormData({ ...formData, kodeReferensi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Kode Job */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '求人案件コード' : 'Kode Job'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: IJEF076' : 'Contoh: IJEF076'}
                  value={formData.kodeJob || ''}
                  onChange={(e) => setFormData({ ...formData, kodeJob: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Kategori Kandidat (Locked CRM) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{lang === 'ja' ? '候補生区分 *' : 'Kategori Kandidat *'}</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </label>
                <select
                  disabled
                  value={formData.kategoriKandidat}
                  className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none cursor-not-allowed"
                >
                  <option value="SISWA NON IJEF (New Comer)">
                    {lang === 'ja' ? '一般新規候補生 (New Comer)' : 'SISWA NON IJEF (New Comer)'}
                  </option>
                  <option value="MATCHING JOB - Engineering / Gijinkoku">
                    {lang === 'ja' ? 'マッチング案件 - 技人国 (Engineering)' : 'MATCHING JOB - Engineering / Gijinkoku'}
                  </option>
                  <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">
                    {lang === 'ja' ? 'マッチング案件 - 実習生経験者 (Ex-Trainee)' : 'MATCHING JOB - Ex-Magang / Ex-Trainee'}
                  </option>
                </select>
              </div>

              {/* Bidang Kerja */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '希望職種・業種分野 *' : 'Bidang Kerja *'}
                </label>
                <select
                  value={formData.bidangKerja || 'KAIGO'}
                  onChange={(e) => setFormData({ ...formData, bidangKerja: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="KAIGO">{lang === 'ja' ? '介護 (Caregiver)' : 'KAIGO (Caregiver / Keperawatan)'}</option>
                  <option value="Pengolahan Makanan">{lang === 'ja' ? '飲食料品製造業 (Food Processing)' : 'Pengolahan Makanan (Food Processing)'}</option>
                  <option value="Konstruksi">{lang === 'ja' ? '建設業 (Construction)' : 'Konstruksi (Construction)'}</option>
                  <option value="Pertanian">{lang === 'ja' ? '農業 (Agriculture)' : 'Pertanian (Agriculture)'}</option>
                  <option value="Manufaktur & Mesin">{lang === 'ja' ? '素形材・産業機械・製造業' : 'Manufaktur & Pengolahan Mesin'}</option>
                  <option value="IT & Engineering">{lang === 'ja' ? 'IT・エンジニア技術職 (技人国)' : 'IT & Teknik (Gijinkoku)'}</option>
                  <option value="Lainnya">{lang === 'ja' ? 'その他' : 'Lainnya'}</option>
                </select>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '氏名 (ローマ字) *' : 'Nama Lengkap *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Nama Panggilan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? 'ニックネーム・呼び名 *' : 'Nama Panggilan *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ja' ? '例: Budi / Zahra' : 'Contoh: Budi / Zahra'}
                  value={formData.namaPanggilan || ''}
                  onChange={(e) => setFormData({ ...formData, namaPanggilan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* No HP Aktif */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '電話番号 (携帯) *' : 'No. HP Aktif *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+628xxxxxxxxxx"
                  value={formData.noHp}
                  onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Alamat Email (Locked CRM) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>{lang === 'ja' ? 'メールアドレス *' : 'Alamat Email *'}</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full bg-slate-950/80 border border-amber-500/30 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    {lang === 'ja' ? '生年月日 *' : 'Tanggal Lahir *'}
                  </label>
                  {formData.tanggalLahir && (
                    <span className="text-[11px] font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {lang === 'ja'
                        ? `年齢: ${calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22)} 歳`
                        : `Usia: ${calculateAgeFromBirthDate(formData.tanggalLahir, formData.umur || 22)} Thn`}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  required
                  value={formData.tanggalLahir || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newUmur = calculateAgeFromBirthDate(val, formData.umur || 22);
                    setFormData({ ...formData, tanggalLahir: val, umur: newUmur });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '出生地 *' : 'Tempat Lahir *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ja' ? '例: Bandung' : 'Contoh: Bandung'}
                  value={formData.tempatLahir || ''}
                  onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '性別 *' : 'Jenis Kelamin *'}
                </label>
                <select
                  value={formData.jenisKelamin}
                  onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as Gender })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Laki-laki">{lang === 'ja' ? '男性' : 'Laki-laki'}</option>
                  <option value="Perempuan">{lang === 'ja' ? '女性' : 'Perempuan'}</option>
                </select>
              </div>

              {/* Agama */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '宗教 *' : 'Agama *'}
                </label>
                <select
                  value={formData.agama || 'Islam'}
                  onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Islam">{lang === 'ja' ? 'イスラム教' : 'Islam'}</option>
                  <option value="Kristen">{lang === 'ja' ? 'キリスト教 (プロテスタント)' : 'Kristen'}</option>
                  <option value="Katolik">{lang === 'ja' ? 'カトリック' : 'Katolik'}</option>
                  <option value="Hindu">{lang === 'ja' ? 'ヒンドゥー教' : 'Hindu'}</option>
                  <option value="Buddha">{lang === 'ja' ? '仏教' : 'Buddha'}</option>
                  <option value="Konghucu">{lang === 'ja' ? '儒教' : 'Konghucu'}</option>
                  <option value="Lainnya">{lang === 'ja' ? 'その他' : 'Lainnya'}</option>
                </select>
              </div>

              {/* Golongan Darah */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '血液型' : 'Golongan Darah'}
                </label>
                <select
                  value={formData.golonganDarah || 'O'}
                  onChange={(e) => setFormData({ ...formData, golonganDarah: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* Tinggi Badan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '身長 (CM) *' : 'Tinggi Badan (CM) *'}
                </label>
                <input
                  type="number"
                  required
                  placeholder={lang === 'ja' ? '例: 165' : 'Contoh: 165'}
                  value={formData.tinggiBadan || ''}
                  onChange={(e) => setFormData({ ...formData, tinggiBadan: parseInt(e.target.value) || '' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Berat Badan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '体重 (KG) *' : 'Berat Badan (KG) *'}
                </label>
                <input
                  type="number"
                  required
                  placeholder={lang === 'ja' ? '例: 58' : 'Contoh: 58'}
                  value={formData.beratBadan || ''}
                  onChange={(e) => setFormData({ ...formData, beratBadan: parseInt(e.target.value) || '' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Dominan Tangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '利き手' : 'Dominan Tangan'}
                </label>
                <select
                  value={formData.dominanTangan || 'Kanan'}
                  onChange={(e) => setFormData({ ...formData, dominanTangan: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Kanan">{lang === 'ja' ? '右利き' : 'Kanan'}</option>
                  <option value="Kiri">{lang === 'ja' ? '左利き' : 'Kiri'}</option>
                </select>
              </div>

              {/* Status Pernikahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '婚姻状況 *' : 'Status Pernikahan *'}
                </label>
                <select
                  value={formData.statusPernikahan}
                  onChange={(e) => setFormData({ ...formData, statusPernikahan: e.target.value as MaritalStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Lajang">{lang === 'ja' ? '独身 / 未婚' : 'Lajang / Belum Menikah'}</option>
                  <option value="Menikah">{lang === 'ja' ? '既婚' : 'Menikah'}</option>
                  <option value="Cerai">{lang === 'ja' ? '離婚' : 'Cerai'}</option>
                </select>
              </div>

              {/* Memiliki SIM */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '運転免許証の有無' : 'Memiliki SIM?'}
                </label>
                <select
                  value={String(formData.memilikiSim || 'YA')}
                  onChange={(e) => setFormData({ ...formData, memilikiSim: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                </select>
              </div>
            </div>

            {/* Health & Habits Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? '色覚異常' : 'Buta Warna'}
                </label>
                <select
                  value={String(formData.butaWarna || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, butaWarna: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? '喫煙' : 'Merokok'}
                </label>
                <select
                  value={String(formData.merokok || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, merokok: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '吸わない' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '吸う' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? '飲酒' : 'Minum Alkohol'}
                </label>
                <select
                  value={String(formData.minumAlkohol || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, minumAlkohol: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '飲まない' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '飲む' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? 'タトゥー' : 'Memiliki Tato'}
                </label>
                <select
                  value={String(formData.memilikiTato || formData.tato || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, memilikiTato: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? '既往歴・大病' : 'Penyakit Berat'}
                </label>
                <select
                  value={String(formData.penyakitBerat || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, penyakitBerat: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {lang === 'ja' ? 'アレルギー' : 'Alergi'}
                </label>
                <select
                  value={String(formData.alergi || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, alergi: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200"
                >
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                </select>
              </div>
            </div>

            {/* Hobi & Alamat Lengkap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '趣味・特技' : 'Hobi'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: 読書、スポーツ' : 'Contoh: Membaca, Olahraga'}
                  value={formData.hobi || ''}
                  onChange={(e) => setFormData({ ...formData, hobi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '現住所 (詳細) *' : 'Alamat Lengkap *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={lang === 'ja' ? '通り、番地、地区、市区町村、州名' : 'Jl. Nama Jalan No., RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Provinsi'}
                  value={formData.alamatLengkap}
                  onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Paspor & Pengalaman Jepang */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '2. パスポート及び日本滞在歴' : '2. Paspor & Pengalaman Jepang'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '訪日経験・日本滞在歴' : 'Pernah ke Jepang?'}
                </label>
                <select
                  value={String(formData.pernahKeJepang || 'TIDAK')}
                  onChange={(e) => setFormData({ ...formData, pernahKeJepang: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? 'パスポート所持' : 'Memiliki Paspor?'}
                </label>
                <select
                  value={String(formData.memilikiPaspor || 'YA')}
                  onChange={(e) => setFormData({ ...formData, memilikiPaspor: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="YA">{lang === 'ja' ? '有' : 'YA'}</option>
                  <option value="TIDAK">{lang === 'ja' ? '無' : 'TIDAK'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '旅券番号 (パスポート番号)' : 'No. Paspor RI (Jika ada)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'ja' ? '例: E6910421' : 'Contoh: E6910421'}
                  value={formData.noPaspor || ''}
                  onChange={(e) => setFormData({ ...formData, noPaspor: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Data Keluarga */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '3. 家族構成' : '3. Data Keluarga'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.dataKeluarga || defaultFamilyMembers).map((fam, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-blue-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                    <span>{lang === 'ja' ? `家族 #${idx + 1}` : `Keluarga #${idx + 1}`}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {lang === 'ja' ? '住民票/戸籍情報' : 'Isi sesuai KK'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '氏名' : 'Nama Lengkap'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ja' ? '家族の氏名' : 'Nama anggota keluarga'}
                        value={fam.namaLengkap}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].namaLengkap = e.target.value;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '続柄' : 'Hubungan'}
                      </label>
                      <select
                        value={fam.hubungan}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].hubungan = e.target.value;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="Ayah">{lang === 'ja' ? '父' : 'Ayah'}</option>
                        <option value="Ibu">{lang === 'ja' ? '母' : 'Ibu'}</option>
                        <option value="Kakak">{lang === 'ja' ? '兄 / 姉' : 'Kakak'}</option>
                        <option value="Adik">{lang === 'ja' ? '弟 / 妹' : 'Adik'}</option>
                        <option value="Suami">{lang === 'ja' ? '夫' : 'Suami'}</option>
                        <option value="Istri">{lang === 'ja' ? '妻' : 'Istri'}</option>
                        <option value="Anak">{lang === 'ja' ? '子供' : 'Anak'}</option>
                        <option value="Lainnya">{lang === 'ja' ? 'その他' : 'Lainnya'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '年齢' : 'Usia'}
                      </label>
                      <input
                        type="number"
                        placeholder={lang === 'ja' ? '年齢' : 'Usia'}
                        value={fam.usia}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].usia = e.target.value;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '職業' : 'Pekerjaan'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ja' ? '職業' : 'Pekerjaan'}
                        value={fam.pekerjaan}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].pekerjaan = e.target.value;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '月収' : 'Gaji/Bulan'}
                      </label>
                      <input
                        type="text"
                        placeholder="Rp"
                        value={fam.gajiPerBulan}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].gajiPerBulan = e.target.value;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '同居区分' : 'Tinggal Bersama?'}
                      </label>
                      <select
                        value={String(fam.tinggalBersama || 'YA')}
                        onChange={(e) => {
                          const updated = [...(formData.dataKeluarga || defaultFamilyMembers)];
                          updated[idx].tinggalBersama = e.target.value as any;
                          setFormData({ ...formData, dataKeluarga: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="YA">{lang === 'ja' ? '同居' : 'YA'}</option>
                        <option value="TIDAK">{lang === 'ja' ? '別居' : 'TIDAK'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Riwayat Pendidikan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '4. 学歴・教育履歴' : '4. Riwayat Pendidikan'}
              </h2>
            </div>

            <div className="space-y-4">
              {/* SD */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400">
                  {lang === 'ja' ? '小学校 (SD)' : 'Sekolah Dasar (SD)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '小学校名' : 'Nama SD'}
                    value={formData.pendidikanDetail?.sd.namaSekolah || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sd.namaSekolah = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '入学年 (YYYY)' : 'Tahun Masuk (YYYY)'}
                    value={formData.pendidikanDetail?.sd.tahunMasuk || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sd.tahunMasuk = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '卒業年 (YYYY)' : 'Tahun Lulus (YYYY)'}
                    value={formData.pendidikanDetail?.sd.tahunLulus || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sd.tahunLulus = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* SMP */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400">
                  {lang === 'ja' ? '中学校 (SMP / MTs)' : 'SMP / Mts'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '中学校名' : 'Nama SMP'}
                    value={formData.pendidikanDetail?.smp.namaSekolah || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.smp.namaSekolah = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '入学年 (YYYY)' : 'Tahun Masuk (YYYY)'}
                    value={formData.pendidikanDetail?.smp.tahunMasuk || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.smp.tahunMasuk = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '卒業年 (YYYY)' : 'Tahun Lulus (YYYY)'}
                    value={formData.pendidikanDetail?.smp.tahunLulus || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.smp.tahunLulus = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* SMA/K */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400">
                  {lang === 'ja' ? '高等学校 / 職業高校 (SMA / SMK)' : 'SMA / SMK / MA'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '高校名' : 'Nama SMA/SMK'}
                    value={formData.pendidikanDetail?.sma.namaSekolah || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sma.namaSekolah = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '専攻学科' : 'Jurusan'}
                    value={formData.pendidikanDetail?.sma.jurusan || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sma.jurusan = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '入学年 (YYYY)' : 'Tahun Masuk (YYYY)'}
                    value={formData.pendidikanDetail?.sma.tahunMasuk || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sma.tahunMasuk = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '卒業年 (YYYY)' : 'Tahun Lulus (YYYY)'}
                    value={formData.pendidikanDetail?.sma.tahunLulus || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.sma.tahunLulus = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Universitas */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400">
                  {lang === 'ja' ? '大学・短大・専門学校 (任意)' : 'Universitas / Perguruan Tinggi (Opsional)'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '大学・短大名' : 'Nama Universitas'}
                    value={formData.pendidikanDetail?.universitas.namaSekolah || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.universitas.namaSekolah = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '学部・学科' : 'Program Studi / Jurusan'}
                    value={formData.pendidikanDetail?.universitas.jurusan || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.universitas.jurusan = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '入学年 (YYYY)' : 'Tahun Masuk (YYYY)'}
                    value={formData.pendidikanDetail?.universitas.tahunMasuk || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.universitas.tahunMasuk = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '卒業年 (YYYY)' : 'Tahun Lulus (YYYY)'}
                    value={formData.pendidikanDetail?.universitas.tahunLulus || ''}
                    onChange={(e) => {
                      const updated = { ...formData.pendidikanDetail! };
                      updated.universitas.tahunLulus = e.target.value;
                      setFormData({ ...formData, pendidikanDetail: updated });
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Riwayat Pekerjaan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Briefcase className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '5. 職歴・実務経験' : '5. Riwayat Pekerjaan'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(formData.pekerjaanDetail || defaultWorkExperience).map((work, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-amber-400 block border-b border-slate-800 pb-1">
                    {lang === 'ja' ? `職歴 #${idx + 1}` : `Pekerjaan #${idx + 1}`}
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '勤務先・会社名' : 'Nama Perusahaan'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ja' ? '企業名' : 'PT / Company Name'}
                        value={work.namaPerusahaan}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].namaPerusahaan = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '職務内容・役職' : 'Bidang Pekerjaan'}
                      </label>
                      <input
                        type="text"
                        placeholder={lang === 'ja' ? '担当業務 / ポジション' : 'Posisi / Jabatan'}
                        value={work.bidangPekerjaan}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].bidangPekerjaan = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '入社年月' : 'Tanggal Masuk'}
                      </label>
                      <input
                        type="date"
                        value={work.tanggalMasuk}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].tanggalMasuk = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '退社年月' : 'Tanggal Keluar'}
                      </label>
                      <input
                        type="date"
                        value={work.tanggalKeluar}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].tanggalKeluar = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '雇用形態' : 'Status Pekerja'}
                      </label>
                      <select
                        value={work.statusPekerja}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].statusPekerja = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="Kontrak">{lang === 'ja' ? '契約社員' : 'Kontrak'}</option>
                        <option value="Magang">{lang === 'ja' ? '技能実習生' : 'Magang (Ginou Jisshusei)'}</option>
                        <option value="Tetap">{lang === 'ja' ? '正社員' : 'Karyawan Tetap'}</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-1">
                        {lang === 'ja' ? '職務詳細・日常業務' : 'Uraian Pekerjaan'}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={lang === 'ja' ? '日々の具体的な業務内容...' : 'Rincian tugas dan tanggung jawab harian...'}
                        value={work.uraianPekerjaan}
                        onChange={(e) => {
                          const updated = [...(formData.pekerjaanDetail || defaultWorkExperience)];
                          updated[idx].uraianPekerjaan = e.target.value;
                          setFormData({ ...formData, pekerjaanDetail: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Motivasi & Kelebihan/Kekurangan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '6. 志望動機・自己PR・長所/短所' : '6. Motivasi & Kelebihan / Kekurangan'}
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '長所・自己PR *' : 'Kelebihan Anda *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.kelebihanAnda || ''}
                    onChange={(e) => setFormData({ ...formData, kelebihanAnda: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '短所・課題点 *' : 'Kekurangan Anda *'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.kekuranganAnda || ''}
                    onChange={(e) => setFormData({ ...formData, kekuranganAnda: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '日本への志望動機・来日理由 *' : 'Alasan Ingin ke Jepang *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.alasanInginKeJepang || ''}
                  onChange={(e) => setFormData({ ...formData, alasanInginKeJepang: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? 'この職種への志望動機' : 'Alasan Melamar di Bidang Ini'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alasanMelamarBidangIni || ''}
                    onChange={(e) => setFormData({ ...formData, alasanMelamarBidangIni: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '介護福祉士を目指す理由 (介護希望者のみ)' : 'Alasan Ingin Menjadi Kaigofukushishi (Khusus Kaigo)'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alasanKaigo || ''}
                    onChange={(e) => setFormData({ ...formData, alasanKaigo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '将来の夢・目標' : 'Impian di Masa Depan'}
                  </label>
                  <input
                    type="text"
                    value={formData.impianMasaDepan || ''}
                    onChange={(e) => setFormData({ ...formData, impianMasaDepan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '日本での希望滞在期間' : 'Lama Ingin Tinggal di Jepang'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '例: 5年' : 'Contoh: 5 Tahun'}
                    value={formData.lamaTinggalJepang || ''}
                    onChange={(e) => setFormData({ ...formData, lamaTinggalJepang: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'ja' ? '日本語学習歴' : 'Lama Belajar Bahasa Jepang'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'ja' ? '例: 6ヶ月' : 'Contoh: 6 Bulan'}
                    value={formData.lamaBelajarBahasaJepang || ''}
                    onChange={(e) => setFormData({ ...formData, lamaBelajarBahasaJepang: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: Kontak Darurat */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Phone className="w-5 h-5 text-rose-400" />
              <h2 className="font-bold text-white text-base">
                {lang === 'ja' ? '7. 緊急連絡先' : '7. Kontak Darurat'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '緊急連絡先 電話番号 *' : 'No HP Darurat *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+628xxxxxxxxxx"
                  value={formData.kontakDarurat?.noHpDarurat || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kontakDarurat: {
                        noHpDarurat: e.target.value,
                        namaPemilikNoDarurat: formData.kontakDarurat?.namaPemilikNoDarurat || '',
                        hubunganDenganPelamar: formData.kontakDarurat?.hubunganDenganPelamar || ''
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '緊急連絡先 氏名 (保護者/保証人) *' : 'Nama Pemilik No Darurat *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ja' ? '保護者・身元保証人の氏名' : 'Nama wali / penjamin'}
                  value={formData.kontakDarurat?.namaPemilikNoDarurat || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kontakDarurat: {
                        noHpDarurat: formData.kontakDarurat?.noHpDarurat || '',
                        namaPemilikNoDarurat: e.target.value,
                        hubunganDenganPelamar: formData.kontakDarurat?.hubunganDenganPelamar || ''
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'ja' ? '本人との続柄 *' : 'Hubungan dengan Pelamar *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'ja' ? '父 / 母 / 夫 / 妻' : 'Ayah / Ibu / Suami / Istri'}
                  value={formData.kontakDarurat?.hubunganDenganPelamar || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kontakDarurat: {
                        noHpDarurat: formData.kontakDarurat?.noHpDarurat || '',
                        namaPemilikNoDarurat: formData.kontakDarurat?.namaPemilikNoDarurat || '',
                        hubunganDenganPelamar: e.target.value
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Card 8: Upload Dokumen (Exact match with form pattern) */}
          <CandidateDocumentUploadSection
            documents={formData.dokumenUpload || {}}
            onChange={(updatedDocs) => {
              setFormData((prev) => ({
                ...prev,
                dokumenUpload: updatedDocs,
                pasFotoUrl: (updatedDocs as any).pasPhoto3x4 || prev.pasFotoUrl,
                videoJikoshoukaiUrl: (updatedDocs as any).videoJikoshoukai || prev.videoJikoshoukaiUrl
              }));
            }}
            candidateName={formData.namaLengkap}
            className="shadow-xl"
            lang={lang}
          />

          {/* Form Action Submit */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveViewMode('CV_PREVIEW')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-3 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ja' ? 'JIS履歴書プレビュー' : 'Lihat Pratinjau CV JIS'}</span>
            </button>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ja' ? 'データを保存' : 'Simpan Data'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* MODE 2: CV DISPLAY / RIREKISHO PREVIEW (MATCHES IMAGE 9)  */}
      {/* ========================================================= */}
      {activeViewMode === 'CV_PREVIEW' && (
        <div className="space-y-4">
          {/* Top Bar for CV Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>CV - {formData.namaLengkap || (lang === 'ja' ? '候補生氏名' : 'Nama Candidate')}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ja' ? '職種分野: ' : 'Bidang: '}<strong className="text-purple-300">{formData.bidangKerja || 'KAIGO'}</strong> | {lang === 'ja' ? '求人コード: ' : 'Kode Job: '}<strong className="text-slate-200">{formData.kodeJob || '-'}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveViewMode('FORM')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'ja' ? 'フォームに戻る' : 'Kembali ke Form'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintCV}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'ja' ? '印刷 / PDF出力' : 'Print / Cetak PDF'}</span>
              </button>
            </div>
          </div>

          {/* Authentic JIS Resume Sheet Paper Container */}
          <JapaneseCVSheet rirekishoRecord={formData} />
        </div>
      )}
    </div>
  );
};

export default RirekishoBuilder;
