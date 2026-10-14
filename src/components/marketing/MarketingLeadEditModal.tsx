import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MarketingLead,
  MarketingStaff,
  Gender,
  Religion,
  BloodType,
  MaritalStatus,
  CandidateCategory,
  LeadStatus,
  LeadSource,
  LeadBidangKerja
} from '../../types';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { isIjefCategory } from '../../utils/candidateUtils';
import {
  translatePipelineStage,
  translateLeadSource,
  translateJobSector,
  translateMarketingRole,
  translateCandidateCategory,
  translateReligion,
  translateGender,
  translateJapaneseLevel
} from '../../utils/marketingTranslations';
import {
  X,
  Check,
  Edit,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Save,
  Clock,
  HeartHandshake
} from 'lucide-react';

interface MarketingLeadEditModalProps {
  isOpen: boolean;
  lead: MarketingLead | null;
  onClose: () => void;
  onSave: (updatedLead: MarketingLead) => void;
  staffList: MarketingStaff[];
  isLeaderOrAdmin: boolean;
}

export const MarketingLeadEditModal: React.FC<MarketingLeadEditModalProps> = ({
  isOpen,
  lead,
  onClose,
  onSave,
  staffList,
  isLeaderOrAdmin
}) => {
  const { bilingual, lang } = useEcosystemTranslation();
  const { students } = useApp();

  const isActuallyIntegrated = Boolean(
    lead &&
      ((lead.terintegrasiKeAdmin1 || lead.integratedToAdmin1) && (lead.siswaId || lead.integratedStudentId))
  ) || Boolean(
    lead &&
      students.some(
        (s) =>
          (lead.siswaId && s.id === lead.siswaId) ||
          (lead.integratedStudentId && s.id === lead.integratedStudentId) ||
          (s.namaLengkap && lead.namaLengkap && s.namaLengkap.toLowerCase().trim() === lead.namaLengkap.toLowerCase().trim()) ||
          (s.noHp && lead.noWhatsapp && s.noHp.replace(/\D/g, '') === lead.noWhatsapp.replace(/\D/g, ''))
      )
  );

  const effectiveStudentId =
    lead?.siswaId ||
    lead?.integratedStudentId ||
    (lead &&
      students.find(
        (s) =>
          (s.namaLengkap && lead.namaLengkap && s.namaLengkap.toLowerCase().trim() === lead.namaLengkap.toLowerCase().trim()) ||
          (s.noHp && lead.noWhatsapp && s.noHp.replace(/\D/g, '') === lead.noWhatsapp.replace(/\D/g, ''))
      )?.id) ||
    '';

  // Active sub-tab inside edit modal
  const [modalTab, setModalTab] = useState<'profile' | 'program' | 'qualification' | 'family'>('profile');

  // Form states initialized from lead
  const [namaLengkap, setNamaLengkap] = useState('');
  const [namaPanggilan, setNamaPanggilan] = useState('');
  const [noWhatsapp, setNoWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [nikKtp, setNikKtp] = useState('');
  const [noKk, setNoKk] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('2003-06-15');
  const [usia, setUsia] = useState<number>(22);
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('Laki-laki');
  const [agama, setAgama] = useState<Religion>('Islam');
  const [golonganDarah, setGolonganDarah] = useState<BloodType>('O');
  const [statusPernikahan, setStatusPernikahan] = useState<MaritalStatus>('Lajang');

  // Domisili
  const [kotaDomisili, setKotaDomisili] = useState('');
  const [provinsiDomisili, setProvinsiDomisili] = useState('Jawa Barat');
  const [alamatLengkap, setAlamatLengkap] = useState('');

  // Program, Funnel & PIC
  const [kategoriKandidat, setKategoriKandidat] = useState<CandidateCategory>('SISWA IJEF - Offline');
  const [bidangMinat, setBidangMinat] = useState<LeadBidangKerja | string>('Kaigo (Caregiver / Perawat Lansia)');
  const [sumberLead, setSumberLead] = useState<LeadSource>('Instagram Ads');
  const [picMarketingStaff, setPicMarketingStaff] = useState<string>('');
  const [statusLead, setStatusLead] = useState<LeadStatus>('LEAD_BARU');
  const [catatanKonselingAwal, setCatatanKonselingAwal] = useState('');

  // Booking / DP
  const [statusPembayaranBooking, setStatusPembayaranBooking] = useState<'BELUM' | 'DP' | 'LUNAS' | string>('BELUM');
  const [nominalBookingFee, setNominalBookingFee] = useState<number>(0);
  const [metodePembayaran, setMetodePembayaran] = useState<string>('Transfer BCA');

  // Fisik, Pendidikan & Dokumen
  const [tinggiBadan, setTinggiBadan] = useState<number | ''>(168);
  const [beratBadan, setBeratBadan] = useState<number | ''>(60);
  const [pendidikanTerakhir, setPendidikanTerakhir] = useState<string>('SMK / SMA');
  const [jurusanPendidikan, setJurusanPendidikan] = useState<string>('');
  const [riwayatBahasaJepang, setRiwayatBahasaJepang] = useState<string>('Belum Pernah (Pemula N5)');
  const [riwayatPaspor, setRiwayatPaspor] = useState<string>('BELUM');
  const [memilikiSim, setMemilikiSim] = useState<string>('SIM C');
  const [tato, setTato] = useState<'TIDAK' | 'YA'>('TIDAK');
  const [merokok, setMerokok] = useState<'TIDAK' | 'YA'>('TIDAK');
  const [butaWarna, setButaWarna] = useState<'TIDAK' | 'YA'>('TIDAK');
  const [patahTulang, setPatahTulang] = useState<'TIDAK' | 'YA'>('TIDAK');

  // Orang Tua
  const [namaAyah, setNamaAyah] = useState('');
  const [namaIbu, setNamaIbu] = useState('');
  const [noHpOrangTua, setNoHpOrangTua] = useState('');
  const [pekerjaanOrangTua, setPekerjaanOrangTua] = useState('');

  // Populate when lead changes
  useEffect(() => {
    if (lead) {
      setNamaLengkap(lead.namaLengkap || '');
      setNamaPanggilan(lead.namaPanggilan || '');
      setNoWhatsapp(lead.noWhatsapp || '');
      setEmail(lead.email || '');
      setNikKtp(lead.nikKtp || '');
      setNoKk(lead.noKk || '');
      setTempatLahir(lead.tempatLahir || '');
      setTanggalLahir(lead.tanggalLahir || '2003-06-15');
      setUsia(lead.usia || 22);
      setJenisKelamin(lead.jenisKelamin || 'Laki-laki');
      setAgama(lead.agama || 'Islam');
      setGolonganDarah(lead.golonganDarah || 'O');
      setStatusPernikahan(lead.statusPernikahan || 'Lajang');

      setKotaDomisili(lead.kotaDomisili || '');
      setProvinsiDomisili(lead.provinsiDomisili || 'Jawa Barat');
      setAlamatLengkap(lead.alamatLengkap || '');

      setKategoriKandidat(lead.kategoriKandidat || 'SISWA IJEF - Offline');
      setBidangMinat(lead.bidangMinat || lead.programMinat || 'Kaigo (Caregiver / Perawat Lansia)');
      setSumberLead(lead.sumberLead || 'Instagram Ads');
      setPicMarketingStaff(lead.picMarketingStaff || lead.assignedStaff || (staffList[0]?.nama || 'Beno Ryan'));
      setStatusLead(lead.statusLead || 'LEAD_BARU');
      setCatatanKonselingAwal(lead.catatanKonselingAwal || lead.catatanKonsultasi || '');

      setStatusPembayaranBooking(lead.statusPembayaranBooking || 'BELUM');
      setNominalBookingFee(lead.nominalBookingFee || 0);
      setMetodePembayaran(lead.metodePembayaran || 'Transfer BCA');

      setTinggiBadan(lead.tinggiBadan || 168);
      setBeratBadan(lead.beratBadan || 60);
      setPendidikanTerakhir(lead.pendidikanTerakhir || 'SMK / SMA');
      setJurusanPendidikan(lead.jurusanPendidikan || '');
      setRiwayatBahasaJepang(lead.riwayatBahasaJepang || 'Belum Pernah (Pemula N5)');
      setRiwayatPaspor(lead.riwayatPaspor || 'BELUM');
      setMemilikiSim(lead.memilikiSim || 'SIM C');

      setTato(lead.kondisiFisikKhusus?.tato === 'YA' ? 'YA' : 'TIDAK');
      setMerokok(lead.kondisiFisikKhusus?.merokok === 'YA' ? 'YA' : 'TIDAK');
      setButaWarna(lead.kondisiFisikKhusus?.butaWarna === 'YA' ? 'YA' : 'TIDAK');
      setPatahTulang(lead.kondisiFisikKhusus?.patahTulang === 'YA' ? 'YA' : 'TIDAK');

      setNamaAyah(lead.namaAyah || '');
      setNamaIbu(lead.namaIbu || '');
      setNoHpOrangTua(lead.noHpOrangTua || '');
      setPekerjaanOrangTua(lead.pekerjaanOrangTua || '');
    }
  }, [lead, staffList]);

  // Recalculate usia when tanggalLahir changes
  const handleDateOfBirthChange = (val: string) => {
    setTanggalLahir(val);
    const birthYear = new Date(val).getFullYear();
    const currentYear = new Date().getFullYear();
    if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
      setUsia(Math.max(16, currentYear - birthYear));
    }
  };

  if (!isOpen || !lead) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaLengkap.trim()) {
      alert(bilingual('Nama lengkap calon siswa wajib diisi.', '生徒の氏名を入力してください。'));
      return;
    }

    if (!noWhatsapp.trim()) {
      alert(bilingual('Nomor WhatsApp wajib diisi.', 'WhatsApp番号を入力してください。'));
      return;
    }

    const updatedLead: MarketingLead = {
      ...lead,
      namaLengkap: namaLengkap.trim(),
      namaPanggilan: namaPanggilan.trim() || namaLengkap.split(' ')[0],
      noWhatsapp: noWhatsapp.trim(),
      email: email.trim(),
      nikKtp: nikKtp.trim(),
      noKk: noKk.trim(),
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      usia: Number(usia) || 21,
      jenisKelamin,
      agama,
      golonganDarah,
      statusPernikahan,
      kotaDomisili: kotaDomisili.trim(),
      provinsiDomisili,
      alamatLengkap: alamatLengkap.trim(),
      kategoriKandidat,
      programMinat: kategoriKandidat,
      bidangMinat,
      sumberLead,
      picMarketingStaff,
      assignedStaff: picMarketingStaff,
      statusLead,
      tinggiBadan: Number(tinggiBadan) || 165,
      beratBadan: Number(beratBadan) || 58,
      pendidikanTerakhir,
      jurusanPendidikan: jurusanPendidikan.trim(),
      riwayatBahasaJepang,
      riwayatPaspor,
      memilikiSim,
      kondisiFisikKhusus: {
        ...(lead.kondisiFisikKhusus || {}),
        tato,
        merokok,
        butaWarna,
        patahTulang
      },
      namaAyah: namaAyah.trim(),
      namaIbu: namaIbu.trim(),
      noHpOrangTua: noHpOrangTua.trim(),
      pekerjaanOrangTua: pekerjaanOrangTua.trim(),
      catatanKonselingAwal: catatanKonselingAwal.trim(),
      catatanKonsultasi: catatanKonselingAwal.trim(),
      statusPembayaranBooking,
      nominalBookingFee: Number(nominalBookingFee) || 0,
      metodePembayaran,
      terintegrasiKeAdmin1: lead.terintegrasiKeAdmin1 || isActuallyIntegrated || statusLead === 'DEAL_TERDAFTAR',
      integratedToAdmin1: lead.integratedToAdmin1 || isActuallyIntegrated || statusLead === 'DEAL_TERDAFTAR',
      siswaId: effectiveStudentId || lead.siswaId || lead.integratedStudentId || undefined,
      integratedStudentId: effectiveStudentId || lead.integratedStudentId || lead.siswaId || undefined,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedLead);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  {bilingual('Edit Data Master Lead Prospek', 'マスターリード情報の編集')}
                </h3>
                <span className="text-[11px] bg-white/20 font-mono px-2 py-0.5 rounded-full">
                  {lead.id}
                </span>
              </div>
              <p className="text-xs text-orange-100 flex items-center space-x-2">
                <span>{bilingual('Calon Siswa:', '生徒名:')} <strong>{lead.namaLengkap}</strong></span>
                <span>•</span>
                <span>{bilingual('PIC:', '担当:')} <strong>{lead.picMarketingStaff || lead.assignedStaff || '-'}</strong></span>
                {isActuallyIntegrated && (
                  <>
                    <span>•</span>
                    <span className="bg-emerald-500/80 text-white font-bold px-1.5 py-0.2 rounded text-[10px]">
                      {bilingual(`Tersinkron: ${effectiveStudentId || lead.id}`, `連携ID: ${effectiveStudentId || lead.id}`)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/20 transition cursor-pointer"
            title={bilingual('Tutup', '閉じる')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 pt-2 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setModalTab('profile')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              modalTab === 'profile'
                ? 'bg-white text-orange-600 border-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{bilingual('Identitas & Kontak', '1. 基本情報・連絡先')}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('program')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              modalTab === 'program'
                ? 'bg-white text-orange-600 border-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{bilingual('Program, Sektor & Funnel', '2. プログラム・進捗')}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('qualification')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              modalTab === 'qualification'
                ? 'bg-white text-orange-600 border-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{bilingual('Pendidikan & Fisik', '3. 学歴・身体資格')}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('family')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center space-x-1.5 border-b-2 cursor-pointer ${
              modalTab === 'family'
                ? 'bg-white text-orange-600 border-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>{bilingual('Orang Tua & Catatan', '4. 保護者・相談メモ')}</span>
          </button>
        </div>

        {/* Form Body */}
        <form id="edit-lead-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-800">
          
          {/* TAB 1: IDENTITAS & KONTAK */}
          {modalTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nama Lengkap Sesuai KTP', '氏名 (KTP準拠)')} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nama Panggilan', '呼び名・愛称')}
                  </label>
                  <input
                    type="text"
                    value={namaPanggilan}
                    onChange={(e) => setNamaPanggilan(e.target.value)}
                    placeholder={namaLengkap.split(' ')[0]}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nomor WhatsApp', 'WhatsApp 番号')} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={noWhatsapp}
                    onChange={(e) => setNoWhatsapp(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Alamat Email', 'メールアドレス')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('NIK KTP (16 Digit)', '国民身分番号 (NIK)')}
                  </label>
                  <input
                    type="text"
                    value={nikKtp}
                    onChange={(e) => setNikKtp(e.target.value)}
                    maxLength={16}
                    placeholder="3201..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nomor Kartu Keluarga (KK)', '家族カード番号 (No KK)')}
                  </label>
                  <input
                    type="text"
                    value={noKk}
                    onChange={(e) => setNoKk(e.target.value)}
                    maxLength={16}
                    placeholder="3201..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Tempat Lahir', '出生地')}
                  </label>
                  <input
                    type="text"
                    value={tempatLahir}
                    onChange={(e) => setTempatLahir(e.target.value)}
                    placeholder="Bandung / Surabaya / dll"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Tanggal Lahir', '生年月日')}
                  </label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Usia (Tahun)', '年齢 (歳)')}
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={usia}
                    onChange={(e) => setUsia(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Jenis Kelamin', '性別')}
                  </label>
                  <select
                    value={jenisKelamin}
                    onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Laki-laki">{translateGender('Laki-laki', lang)}</option>
                    <option value="Perempuan">{translateGender('Perempuan', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Agama', '宗教')}
                  </label>
                  <select
                    value={agama}
                    onChange={(e) => setAgama(e.target.value as Religion)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Islam">{translateReligion('Islam', lang)}</option>
                    <option value="Kristen">{translateReligion('Kristen', lang)}</option>
                    <option value="Katolik">{translateReligion('Katolik', lang)}</option>
                    <option value="Hindu">{translateReligion('Hindu', lang)}</option>
                    <option value="Buddha">{translateReligion('Buddha', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Golongan Darah', '血液型')}
                  </label>
                  <select
                    value={golonganDarah}
                    onChange={(e) => setGolonganDarah(e.target.value as BloodType)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                    <option value="TIDAK TAHU">{bilingual('TIDAK TAHU', '不明')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Status Pernikahan', '婚姻状況')}
                  </label>
                  <select
                    value={statusPernikahan}
                    onChange={(e) => setStatusPernikahan(e.target.value as MaritalStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Lajang">{bilingual('Lajang / Belum Menikah', '独身')}</option>
                    <option value="Menikah">{bilingual('Menikah', '既婚')}</option>
                    <option value="Cerai">{bilingual('Cerai', '離婚')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kota / Kabupaten Domisili', '現住所の都市 / 地域')}
                  </label>
                  <input
                    type="text"
                    value={kotaDomisili}
                    onChange={(e) => setKotaDomisili(e.target.value)}
                    placeholder="Bandung / Semarang / Cirebon / dll"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Provinsi Domisili', '州・県 (Provinsi)')}
                  </label>
                  <input
                    type="text"
                    value={provinsiDomisili}
                    onChange={(e) => setProvinsiDomisili(e.target.value)}
                    placeholder="Jawa Barat / Jawa Tengah / dll"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Alamat Lengkap Domisili', '現住所の詳細')}
                </label>
                <textarea
                  rows={2}
                  value={alamatLengkap}
                  onChange={(e) => setAlamatLengkap(e.target.value)}
                  placeholder="Jl. Raya No. XX, RT/RW, Kelurahan, Kecamatan..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROGRAM, MINAT, STATUS PIPELINE & PIC */}
          {modalTab === 'program' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Status Pipeline Lead', '進捗ステータス')}
                  </label>
                  <select
                    value={statusLead}
                    onChange={(e) => setStatusLead(e.target.value as LeadStatus)}
                    className="w-full bg-white border-2 border-orange-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="LEAD_BARU">{bilingual('1. Lead Baru', '1. 新規リード')}</option>
                    <option value="KONTAK_AWAL">{bilingual('2. Kontak Awal', '2. 初回コンタクト')}</option>
                    <option value="KONSULTASI_LPK">{bilingual('3. Konsultasi LPK', '3. 相談・カウンセリング')}</option>
                    <option value="FOLLOW_UP">{bilingual('4. Follow Up Intensif', '4. フォローアップ')}</option>
                    <option value="DEAL_TERDAFTAR">{bilingual('5. Deal (Terdaftar / Closing)', '5. 成約・生徒登録完了')}</option>
                    <option value="LOST_BATAL">{bilingual('6. Batal / Tertunda', '6. 辞退・保留')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('PIC Staf Marketing Pengampu', '担当スタッフ (PIC)')}
                  </label>
                  {isLeaderOrAdmin ? (
                    <select
                      value={picMarketingStaff}
                      onChange={(e) => setPicMarketingStaff(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {staffList.map((st) => (
                        <option key={st.id} value={st.nama}>
                          {st.nama} ({translateMarketingRole(st.roleMarketing, lang)})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800">
                      {picMarketingStaff || 'Beno Ryan'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Sumber Perolehan Lead', '獲得元ソース')}
                  </label>
                  <select
                    value={sumberLead}
                    onChange={(e) => setSumberLead(e.target.value as LeadSource)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="Instagram Ads">{translateLeadSource('Instagram Ads', lang)}</option>
                    <option value="TikTok / Reels">{translateLeadSource('TikTok / Reels', lang)}</option>
                    <option value="TikTok Official IJEF">{translateLeadSource('TikTok Official IJEF', lang)}</option>
                    <option value="Website Resmi IJEF">{translateLeadSource('Website Resmi IJEF', lang)}</option>
                    <option value="Job Fair">{translateLeadSource('Job Fair', lang)}</option>
                    <option value="Job Fair Kampus/SMK">{translateLeadSource('Job Fair Kampus/SMK', lang)}</option>
                    <option value="Sosialisasi SMK / SMA">{translateLeadSource('Sosialisasi SMK / SMA', lang)}</option>
                    <option value="Audiensi & Roadshow Kampus">{translateLeadSource('Audiensi & Roadshow Kampus', lang)}</option>
                    <option value="Meeting & Kemitraan Lembaga / BLK">{translateLeadSource('Meeting & Kemitraan Lembaga / BLK', lang)}</option>
                    <option value="Referral Alumni / Siswa">{translateLeadSource('Referral Alumni / Siswa', lang)}</option>
                    <option value="Mitra LPK Daerah">{translateLeadSource('Mitra LPK Daerah', lang)}</option>
                    <option value="Brosur & Spanduk">{translateLeadSource('Brosur & Spanduk', lang)}</option>
                    <option value="Walk-in Kantor LPK">{translateLeadSource('Walk-in Kantor LPK', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kategori / Jalur Siswa', '希望プログラム区分')}
                  </label>
                  <select
                    value={kategoriKandidat}
                    onChange={(e) => setKategoriKandidat(e.target.value as CandidateCategory)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="SISWA IJEF - Offline">{translateCandidateCategory('SISWA IJEF - Offline', lang)} (Asrama)</option>
                    <option value="SISWA IJEF - Online">{translateCandidateCategory('SISWA IJEF - Online', lang)}</option>
                    <option value="MATCHING JOB - Engineering / Gijinkoku">{translateCandidateCategory('MATCHING JOB - Engineering / Gijinkoku', lang)}</option>
                    <option value="MATCHING JOB - Ex-Magang / Ex-Trainee">{translateCandidateCategory('MATCHING JOB - Ex-Magang / Ex-Trainee', lang)}</option>
                    <option value="SISWA NON IJEF (New Comer)">{translateCandidateCategory('SISWA NON IJEF (New Comer)', lang)}</option>
                    <option value="SISWA MITRA / NON IJEF">{translateCandidateCategory('SISWA MITRA / NON IJEF', lang)}</option>
                  </select>
                  <div className={`mt-1 p-2 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 border ${
                    isIjefCategory(kategoriKandidat)
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-blue-50 text-blue-900 border-blue-200'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isIjefCategory(kategoriKandidat)
                        ? bilingual('🎯 Portal Tujuan: Admin Siswa (SIM-SB) & Skrining MCU', '🎯 連携先: 生徒台帳 (SIM-SB)')
                        : bilingual('🎯 Portal Tujuan: Admin Doc (JIS Rirekisho & Matching)', '🎯 連携先: 管理書類ポータル (JIS)')}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      {bilingual('Bidang / Sektor Minat Kerja di Jepang', '希望職種・業種 (日本)')}
                    </label>
                    {isIjefCategory(kategoriKandidat) && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        {bilingual('Tersedia Pilihan Universal', '共通コース対応')}
                      </span>
                    )}
                  </div>
                  <select
                    value={bidangMinat}
                    onChange={(e) => setBidangMinat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                    <optgroup label={bilingual('🏭 Sektor Kerja Spesifik (Siap Matching Job / Pilihan Sektor)', '🏭 特定技能・職種別（求人マッチング）')}>
                      <option value="Kaigo (Caregiver / Perawat Lansia)">{translateJobSector('Kaigo (Caregiver / Perawat Lansia)', lang)}</option>
                      <option value="Pengolahan Makanan (Food Processing)">{translateJobSector('Pengolahan Makanan (Food Processing)', lang)}</option>
                      <option value="Pertanian (Agriculture)">{translateJobSector('Pertanian (Agriculture)', lang)}</option>
                      <option value="Manufaktur & Pabrik (Manufacturing)">{translateJobSector('Manufaktur & Pabrik (Manufacturing)', lang)}</option>
                      <option value="Konstruksi (Building Construction)">{translateJobSector('Konstruksi (Building Construction)', lang)}</option>
                      <option value="Pengelasan (Welding)">{translateJobSector('Pengelasan (Welding)', lang)}</option>
                      <option value="Restoran / Food Service">{translateJobSector('Restoran / Food Service', lang)}</option>
                      <option value="Perhotelan (Hospitality / Accommodation)">{translateJobSector('Perhotelan (Hospitality / Accommodation)', lang)}</option>
                      <option value="Gijinkoku (IT / Engineering / Office)">{translateJobSector('Gijinkoku (IT / Engineering / Office)', lang)}</option>
                      <option value="Engineering & Konstruksi / IT">{translateJobSector('Engineering & Konstruksi / IT', lang)}</option>
                      <option value="Peternakan (Livestock)">{translateJobSector('Peternakan (Livestock)', lang)}</option>
                      <option value="Pembersihan Gedung (Building Cleaning)">{translateJobSector('Pembersihan Gedung (Building Cleaning)', lang)}</option>
                      <option value="Lainnya">{translateJobSector('Lainnya', lang)}</option>
                    </optgroup>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-start space-x-1.5 leading-tight">
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span>
                      {bilingual(
                        'Saat siswa sudah banyak dan mulai siap masuk tahap matching job, Anda dapat mengupdate bidang dari opsi universal (seperti Irodori) ke sektor kerja spesifik (Kaigo, Pengolahan Makanan, Pertanian, dll.) di sini.',
                        '生徒が学習を進め求人マッチング段階に入った際、いろどり等の共通学習から具体的な希望業種へいつでも更新可能です。'
                      )}
                    </span>
                  </p>
                </div>
              </div>

              {/* Booking Fee / DP Section */}
              <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-3">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{bilingual('Status Booking Fee & Registrasi Awal', '申込金・登録費用ステータス')}</span>
                  <span className="text-[10px] text-orange-800 font-normal">
                    {bilingual('Dapat dicatat saat calon siswa membayar DP / tanda jadi', '内定時や申込時の手付金記録')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {bilingual('Status Bayar', '支払ステータス')}
                    </label>
                    <select
                      value={statusPembayaranBooking}
                      onChange={(e) => setStatusPembayaranBooking(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900"
                    >
                      <option value="BELUM">{bilingual('Belum Membayar', '未払い')}</option>
                      <option value="DP">{bilingual('Sudah DP / Tanda Jadi', '内金 / 手付金済')}</option>
                      <option value="LUNAS">{bilingual('Lunas Penuh', '完納')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {bilingual('Nominal Booking Fee (Rp)', '支払金額 (Rp)')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={nominalBookingFee === 0 ? '' : nominalBookingFee}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                        setNominalBookingFee(val === '' ? 0 : Number(val));
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {bilingual('Metode Pembayaran', '支払方法')}
                    </label>
                    <select
                      value={metodePembayaran}
                      onChange={(e) => setMetodePembayaran(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium text-slate-900"
                    >
                      <option value="Transfer BCA">Transfer BCA</option>
                      <option value="Transfer Mandiri">Transfer Mandiri</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Tunai di Kantor">Tunai di Kantor LPK</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENDIDIKAN, BAHASA & FISIK */}
          {modalTab === 'qualification' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Pendidikan Terakhir', '最終学歴')}
                  </label>
                  <select
                    value={pendidikanTerakhir}
                    onChange={(e) => setPendidikanTerakhir(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="SMK / SMA">SMK / SMA</option>
                    <option value="SMK">SMK (Kejuruan)</option>
                    <option value="SMA">SMA</option>
                    <option value="D3">D3 (Diploma 3)</option>
                    <option value="S1 / D4">S1 / D4 (Sarjana)</option>
                    <option value="SMP">SMP</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Jurusan Pendidikan', '専攻・学科')}
                  </label>
                  <input
                    type="text"
                    value={jurusanPendidikan}
                    onChange={(e) => setJurusanPendidikan(e.target.value)}
                    placeholder="Keperawatan / Otomotif / IPA / Mesin..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Riwayat Bahasa Jepang', '日本語レベル / 資格')}
                  </label>
                  <select
                    value={riwayatBahasaJepang}
                    onChange={(e) => setRiwayatBahasaJepang(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Tinggi Badan (cm)', '身長 (cm)')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="168"
                    value={tinggiBadan === '' ? '' : tinggiBadan}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setTinggiBadan(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Berat Badan (kg)', '体重 (kg)')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="60"
                    value={beratBadan === '' ? '' : beratBadan}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
                      setBeratBadan(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Status Paspor', 'パスポート状況')}
                  </label>
                  <select
                    value={riwayatPaspor}
                    onChange={(e) => setRiwayatPaspor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="BELUM">{bilingual('Belum Ada Paspor', '未所持')}</option>
                    <option value="SUDAH">{bilingual('Sudah Ada Paspor Aktif', '有効な旅券あり')}</option>
                    <option value="KEDALUWARSA">{bilingual('Paspor Kedaluwarsa', '期限切れ')}</option>
                    <option value="PROSES">{bilingual('Sedang Proses Pengajuan', '申請中')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kepemilikan SIM', '運転免許証')}
                  </label>
                  <select
                    value={memilikiSim}
                    onChange={(e) => setMemilikiSim(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="SIM C">SIM C (Motor)</option>
                    <option value="SIM A">SIM A (Mobil)</option>
                    <option value="SIM A & SIM C">SIM A & SIM C</option>
                    <option value="TIDAK ADA">{bilingual('Tidak Ada SIM', 'なし')}</option>
                  </select>
                </div>
              </div>

              {/* Skrining Fisik Checklist */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 text-xs">
                  {bilingual('Skrining Kondisi Fisik Khusus (Persyaratan Kerja Jepang):', '身体検査特記事項（日本就業基準）:')}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-orange-50/50">
                    <input
                      type="checkbox"
                      checked={tato === 'YA'}
                      onChange={(e) => setTato(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">{bilingual('Memiliki Tato', 'タトゥーあり')}</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-orange-50/50">
                    <input
                      type="checkbox"
                      checked={merokok === 'YA'}
                      onChange={(e) => setMerokok(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">{bilingual('Merokok', '喫煙者')}</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-orange-50/50">
                    <input
                      type="checkbox"
                      checked={butaWarna === 'YA'}
                      onChange={(e) => setButaWarna(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">{bilingual('Buta Warna', '色覚異常')}</span>
                  </label>

                  <label className="flex items-center space-x-2 bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-orange-50/50">
                    <input
                      type="checkbox"
                      checked={patahTulang === 'YA'}
                      onChange={(e) => setPatahTulang(e.target.checked ? 'YA' : 'TIDAK')}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">{bilingual('Riwayat Patah Tulang', '骨折歴あり')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORANG TUA & CATATAN */}
          {modalTab === 'family' && (
            <div className="space-y-4 animate-in fade-in duration-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nama Ayah Kandung', '実父の氏名')}
                  </label>
                  <input
                    type="text"
                    value={namaAyah}
                    onChange={(e) => setNamaAyah(e.target.value)}
                    placeholder="Nama Ayah"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nama Ibu Kandung', '実母の氏名')}
                  </label>
                  <input
                    type="text"
                    value={namaIbu}
                    onChange={(e) => setNamaIbu(e.target.value)}
                    placeholder="Nama Ibu"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Nomor HP / WhatsApp Orang Tua', '保護者の電話/WA番号')}
                  </label>
                  <input
                    type="tel"
                    value={noHpOrangTua}
                    onChange={(e) => setNoHpOrangTua(e.target.value)}
                    placeholder="0812..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Pekerjaan Orang Tua', '保護者の職業')}
                  </label>
                  <input
                    type="text"
                    value={pekerjaanOrangTua}
                    onChange={(e) => setPekerjaanOrangTua(e.target.value)}
                    placeholder="Wiraswasta / Petani / PNS / Karyawan"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Catatan Konseling & Riwayat Prospek Marketing', 'カウンセリング記録・備考')}
                </label>
                <textarea
                  rows={4}
                  value={catatanKonselingAwal}
                  onChange={(e) => setCatatanKonselingAwal(e.target.value)}
                  placeholder={bilingual(
                    'Catatan hasil konsultasi, kesiapan keluarga, rencana keberangkatan, program yang diminati, dll.',
                    '相談内容、家族の同意状況、渡航希望時期、特記事項など'
                  )}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-slate-500 text-[11px] flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {bilingual(
                'Perubahan data akan disimpan permanen ke database CRM & Firestore.',
                '変更はCRMデータベースおよびFirestoreへ即座に保存されます。'
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              {bilingual('Batal', 'キャンセル')}
            </button>

            <button
              type="submit"
              form="edit-lead-form"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl font-extrabold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{bilingual('Simpan Perubahan Lead', '変更を保存する')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
