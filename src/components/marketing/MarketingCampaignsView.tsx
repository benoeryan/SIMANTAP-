import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useEcosystemTranslation } from '../../i18n/ecosystem-i18n';
import { MarketingLead, LeadStatus, MarketingStaff } from '../../types';
import { INITIAL_MARKETING_STAFF } from '../../data/crmSeedData';
import {
  translateCampaignName,
  translateTargetAudience,
  translateCampaignNotes,
  translateCampaignLocation,
  translateCampaignChannel,
  translateCampaignStatus,
  translateInstitutionType,
  formatMarketingDateRange
} from '../../utils/marketingTranslations';
import {
  Megaphone,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  MapPin,
  Globe,
  Share2,
  X,
  School,
  GraduationCap,
  Building2,
  Handshake,
  MessageSquare,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  Briefcase,
  Layers,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  UserPlus,
  Edit3,
  Trash2,
  BarChart3
} from 'lucide-react';

export type CampaignCategory =
  | 'ALL'
  | 'SOSIALISASI_SEKOLAH'
  | 'ROADSHOW_KAMPUS'
  | 'MEETING_LEMBAGA'
  | 'APPOINTMENT_B2B'
  | 'DIGITAL_ADS'
  | 'WEBINAR_JOBFAIR';

export interface CampaignItem {
  id: string;
  namaKampanye: string;
  kategoriKegiatan: 'SOSIALISASI_SEKOLAH' | 'ROADSHOW_KAMPUS' | 'MEETING_LEMBAGA' | 'APPOINTMENT_B2B' | 'DIGITAL_ADS' | 'WEBINAR_ONLINE' | 'JOB_FAIR' | 'BROSUR_OFFLINE';
  kanal:
    | 'Sosialisasi SMK / SMA'
    | 'Audiensi & Roadshow Kampus'
    | 'Meeting & Kemitraan Lembaga / BLK'
    | 'Meeting Appointment B2B / Kemitraan'
    | 'Instagram Ads'
    | 'TikTok Ads'
    | 'Webinar Online'
    | 'Job Fair'
    | 'Brosur & Spanduk'
    | 'Event SMK/Kampus';
  targetAudience: string;
  anggaranBiaya: number;
  totalLeads: number;
  totalClosing: number;
  status: 'BERJALAN' | 'TERJADWAL' | 'SELESAI' | 'MOU_SEPAKAT' | 'SOSIALISASI_SUKSES' | 'PERLU_FOLLOW_UP' | 'DITUNDA';
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi?: string;
  catatan?: string;

  // Detail Institusi & Appointment (Untuk Sekolah, Kampus, Lembaga, Kemitraan B2B)
  namaInstitusi?: string;
  jenisInstitusi?: 'SMK/SMA' | 'Kampus/Universitas' | 'Lembaga/BLK/Disnaker' | 'Yayasan/Komunitas' | 'Perusahaan Mitra' | 'Lainnya';
  picInstitusi?: string;
  jabatanPIC?: string;
  kontakPIC?: string;
  emailInstitusi?: string;
  agendaMeeting?: string;
  waktuMeeting?: string;
  estimasiPesertaLeads?: number;
  picStaffLPK?: string;
  hasilKesepakatan?: string;
  createdAt?: string;
  updatedAt?: string;
}

const INITIAL_CAMPAIGNS: CampaignItem[] = [
  {
    id: 'CMP-2026-003',
    namaKampanye: 'Sosialisasi Tatap Muka & Kemitraan BKK SMK Negeri 1 Katapang',
    kategoriKegiatan: 'SOSIALISASI_SEKOLAH',
    kanal: 'Sosialisasi SMK / SMA',
    targetAudience: 'Siswa Kelas XII Jurusan Teknik Otomotif, Listrik & Mesin',
    anggaranBiaya: 2500000,
    totalLeads: 42,
    totalClosing: 14,
    status: 'SOSIALISASI_SUKSES',
    tanggalMulai: '2026-02-15',
    tanggalSelesai: '2026-02-15',
    lokasi: 'Auditorium Utama SMKN 1 Katapang, Kab. Bandung',
    namaInstitusi: 'SMK Negeri 1 Katapang',
    jenisInstitusi: 'SMK/SMA',
    picInstitusi: 'Drs. H. Mulyadi, M.Pd',
    jabatanPIC: 'Kepala Sekolah & Pembina BKK',
    kontakPIC: '081223456789',
    agendaMeeting: 'Sosialisasi Peluang Kerja Tokutei Ginou Kaigo & Manufaktur Jepang serta Penandatanganan MOU BKK Penyaluran Lulusan 2026.',
    waktuMeeting: '09:00 - 12:30 WIB',
    estimasiPesertaLeads: 180,
    picStaffLPK: 'Bagas Pratama (Field Acquisition)',
    hasilKesepakatan: 'MOU Kemitraan disepakati untuk 3 tahun. BKK sekolah siap memfasilitasi seleksi berkala.',
    catatan: 'Antusiasme siswa sangat tinggi untuk bidang Pengolahan Makanan & Manufaktur.'
  },
  {
    id: 'CMP-2026-006',
    namaKampanye: 'Audiensi & Roadshow Kampus: Peluang Kerja Engineering Gijinkoku di Politeknik Manufaktur (POLMAN) Bandung',
    kategoriKegiatan: 'ROADSHOW_KAMPUS',
    kanal: 'Audiensi & Roadshow Kampus',
    targetAudience: 'Mahasiswa Tingkat Akhir & Alumni D3/D4 Teknik Mesin, Desain & Otomasi',
    anggaranBiaya: 1800000,
    totalLeads: 28,
    totalClosing: 9,
    status: 'TERJADWAL',
    tanggalMulai: '2026-03-18',
    tanggalSelesai: '2026-03-18',
    lokasi: 'Ruang Seminar Gedung Utama Polman Bandung, Kanayakan',
    namaInstitusi: 'Politeknik Manufaktur Bandung (POLMAN)',
    jenisInstitusi: 'Kampus/Universitas',
    picInstitusi: 'Dr. Ir. Hendra Gunawan, M.T.',
    jabatanPIC: 'Ketua Career Development Center (CDC) & Kemitraan Industri',
    kontakPIC: '081398765432',
    agendaMeeting: 'Presentasi Program Kerja Gijinkoku (Visa Engineer) & Skema Penempatan Desainer CAD/CAM di Industri Otomotif Jepang.',
    waktuMeeting: '13:30 - 16:00 WIB',
    estimasiPesertaLeads: 65,
    picStaffLPK: 'Salma Putri (Academic & Campus Counselor)',
    hasilKesepakatan: 'Jadwal audiensi telah dikonfirmasi dan draf MOU sedang ditelaah bagian hukum kampus.',
    catatan: 'Fokus pada kandidat fresh graduate yang sudah menguasai software SolidWorks / AutoCAD.'
  },
  {
    id: 'CMP-2026-007',
    namaKampanye: 'Meeting Appointment Kerjasama Pelatihan & Penyaluran Tenaga Kerja UPTD BLK Disnaker Kab. Bandung',
    kategoriKegiatan: 'MEETING_LEMBAGA',
    kanal: 'Meeting & Kemitraan Lembaga / BLK',
    targetAudience: 'Peserta Pelatihan Vokasi Kejuruan Las, Listrik & Perhotelan BLK',
    anggaranBiaya: 1200000,
    totalLeads: 35,
    totalClosing: 11,
    status: 'MOU_SEPAKAT',
    tanggalMulai: '2026-03-08',
    tanggalSelesai: '2026-03-08',
    lokasi: 'Kantor UPTD BLK Disnaker Kab. Bandung, Manggahang Baleendah',
    namaInstitusi: 'UPTD BLK Dinas Tenaga Kerja Kab. Bandung',
    jenisInstitusi: 'Lembaga/BLK/Disnaker',
    picInstitusi: 'Ibu Hj. Ratna Juwita, S.Sos, M.Si',
    jabatanPIC: 'Kepala UPTD Balai Latihan Kerja & Kerjasama Antar Lembaga',
    kontakPIC: '081122334455',
    agendaMeeting: 'Meeting Pembahasan Sinergi Kurikulum Bahasa Jepang N4 bagi Lulusan Vokasi BLK & Skema Rekrutmen Tokutei Ginou.',
    waktuMeeting: '10:00 - 12:00 WIB',
    estimasiPesertaLeads: 80,
    picStaffLPK: 'Beno Ryan (Marketing Manager)',
    hasilKesepakatan: 'Disnaker menyambut baik dan siap membuka kelas khusus persiapan bahasa Jepang di aula BLK.',
    catatan: 'Disetujui jadwal seleksi perdana angkatan I pada minggu pertama bulan April.'
  },
  {
    id: 'CMP-2026-008',
    namaKampanye: 'Meeting Appointment B2B Kemitraan Penyaluran Siswa Yayasan Pendidikan Bina Bangsa',
    kategoriKegiatan: 'APPOINTMENT_B2B',
    kanal: 'Meeting Appointment B2B / Kemitraan',
    targetAudience: 'Alumni 4 SMK Binaan Yayasan Wilayah Garut & Tasikmalaya',
    anggaranBiaya: 1500000,
    totalLeads: 19,
    totalClosing: 7,
    status: 'PERLU_FOLLOW_UP',
    tanggalMulai: '2026-03-12',
    tanggalSelesai: '2026-03-12',
    lokasi: 'Meeting Room Lt. 2 Yayasan Bina Bangsa, Tarogong Garut',
    namaInstitusi: 'Yayasan Pendidikan Bina Bangsa Mandiri',
    jenisInstitusi: 'Yayasan/Komunitas',
    picInstitusi: 'K.H. Drs. Zaenal Abidin',
    jabatanPIC: 'Ketua Dewan Pembina Yayasan & Direktur Pendidikan',
    kontakPIC: '081299887766',
    agendaMeeting: 'Pertemuan Penjajakan Kemitraan Program Dana Talangan & Asrama Pelatihan Jepang LPK IJEF.',
    waktuMeeting: '14:00 - 16:30 WIB',
    estimasiPesertaLeads: 90,
    picStaffLPK: 'Irsan Nurul (Senior Counselor)',
    hasilKesepakatan: 'Pihak yayasan meminta proposal pembiayaan dana talangan lebih rinci untuk disosialisasikan ke wali murid.',
    catatan: 'Perlu follow up pengiriman dokumen resmi & brosur cetak via kurir.'
  },
  {
    id: 'CMP-2026-001',
    namaKampanye: 'Instagram Ads: Pendaftaran Kelas Kaigo & Pengolahan Makanan Batch 18',
    kategoriKegiatan: 'DIGITAL_ADS',
    kanal: 'Instagram Ads',
    targetAudience: 'Usia 18-28 Thn se-Jawa Barat & Jawa Tengah',
    anggaranBiaya: 3500000,
    totalLeads: 48,
    totalClosing: 14,
    status: 'BERJALAN',
    tanggalMulai: '2026-02-01',
    tanggalSelesai: '2026-02-28',
    catatan: 'Konversi tertinggi dari target alumni SMK Keperawatan & Boga.'
  },
  {
    id: 'CMP-2026-002',
    namaKampanye: 'TikTok Live Edukasi & Konsultasi Kerja Jepang Setiap Malam Minggu',
    kategoriKegiatan: 'DIGITAL_ADS',
    kanal: 'TikTok Ads',
    targetAudience: 'Followers TikTok Official LPK IJEF & FYP Organik',
    anggaranBiaya: 1200000,
    totalLeads: 32,
    totalClosing: 9,
    status: 'BERJALAN',
    tanggalMulai: '2026-01-15',
    tanggalSelesai: '2026-03-31',
    catatan: 'Live interaktif tanya jawab gaji & simulasi dana talangan.'
  },
  {
    id: 'CMP-2026-004',
    namaKampanye: 'Job Fair Karir Tokutei Ginou & Magang Jepang Bandung Raya',
    kategoriKegiatan: 'JOB_FAIR',
    kanal: 'Job Fair',
    targetAudience: 'Pencari Kerja Usia Produktif',
    anggaranBiaya: 5000000,
    totalLeads: 55,
    totalClosing: 16,
    status: 'TERJADWAL',
    tanggalMulai: '2026-03-25',
    tanggalSelesai: '2026-03-26',
    lokasi: 'Graha Tirta Siliwangi Bandung',
    catatan: 'Booth utama LPK IJEF dengan presentasi video alumni di Jepang.'
  },
  {
    id: 'CMP-2026-005',
    namaKampanye: 'Webinar Nasional: Kupas Tuntas Peluang Kerja Gaji 20-30 Juta di Jepang',
    kategoriKegiatan: 'WEBINAR_ONLINE',
    kanal: 'Webinar Online',
    targetAudience: 'Peserta Seluruh Indonesia via Zoom & YouTube',
    anggaranBiaya: 800000,
    totalLeads: 41,
    totalClosing: 10,
    status: 'TERJADWAL',
    tanggalMulai: '2026-03-22',
    tanggalSelesai: '2026-03-22',
    catatan: 'Pemateri Sensei native & Alumni LPK IJEF yang sedang bekerja di Osaka.'
  }
];

interface MarketingCampaignsViewProps {
  staffList?: MarketingStaff[];
}

export const MarketingCampaignsView: React.FC<MarketingCampaignsViewProps> = ({ staffList: propStaffList }) => {
  const { lang, saveLead, campaigns: appCampaigns, saveCampaign, deleteCampaign, updateCampaignStatus } = useApp();
  const { user } = useAuth();
  const { bilingual } = useEcosystemTranslation();

  const staffList = propStaffList && propStaffList.length > 0 ? propStaffList : INITIAL_MARKETING_STAFF;
  const campaigns = appCampaigns && appCampaigns.length > 0 ? appCampaigns : INITIAL_CAMPAIGNS;

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [quickLeadModalOpen, setQuickLeadModalOpen] = useState(false);
  const [activeTargetCampaign, setActiveTargetCampaign] = useState<CampaignItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Mode State
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Campaign / Roadshow / Appointment
  const [formNama, setFormNama] = useState('');
  const [formKategori, setFormKategori] = useState<CampaignItem['kategoriKegiatan']>('SOSIALISASI_SEKOLAH');
  const [formKanal, setFormKanal] = useState<CampaignItem['kanal']>('Sosialisasi SMK / SMA');
  const [formTarget, setFormTarget] = useState('');
  const [formAnggaran, setFormAnggaran] = useState<number>(2000000);
  const [formStatus, setFormStatus] = useState<CampaignItem['status']>('TERJADWAL');
  const [formMulai, setFormMulai] = useState('2026-03-15');
  const [formSelesai, setFormSelesai] = useState('2026-03-15');
  const [formLokasi, setFormLokasi] = useState('');
  const [formCatatan, setFormCatatan] = useState('');

  // Institutional & Appointment specific fields
  const [formNamaInstitusi, setFormNamaInstitusi] = useState('');
  const [formJenisInstitusi, setFormJenisInstitusi] = useState<CampaignItem['jenisInstitusi']>('SMK/SMA');
  const [formPicInstitusi, setFormPicInstitusi] = useState('');
  const [formJabatanPIC, setFormJabatanPIC] = useState('');
  const [formKontakPIC, setFormKontakPIC] = useState('');
  const [formEmailInstitusi, setFormEmailInstitusi] = useState('');
  const [formAgendaMeeting, setFormAgendaMeeting] = useState('');
  const [formWaktuMeeting, setFormWaktuMeeting] = useState('09:00 - 12:00 WIB');
  const [formEstimasiPeserta, setFormEstimasiPeserta] = useState<number>(100);
  const [formPicStaffLPK, setFormPicStaffLPK] = useState(user?.displayName || 'Bagas Pratama');
  const [formTotalLeads, setFormTotalLeads] = useState<number>(0);
  const [formTotalClosing, setFormTotalClosing] = useState<number>(0);

  // Quick Lead Capture Form State
  const [leadNama, setLeadNama] = useState('');
  const [leadNoWhatsapp, setLeadNoWhatsapp] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadKota, setLeadKota] = useState('Bandung');
  const [leadBidangMinat, setLeadBidangMinat] = useState('Kaigo (Caregiver / Perawat Lansia)');
  const [leadProgram, setLeadProgram] = useState('SISWA IJEF - Offline');
  const [leadCatatan, setLeadCatatan] = useState('');

  // Preset Auto-fills for Quick Demo (Target audiens & estimasi peserta tetap bisa diedit manual)
  const handleApplyPreset = (presetType: 'smk' | 'kampus' | 'blk' | 'b2b' | 'ads') => {
    if (presetType === 'smk') {
      setFormKategori('SOSIALISASI_SEKOLAH');
      setFormKanal('Sosialisasi SMK / SMA');
      setFormNama('Sosialisasi Tatap Muka & Seleksi Siswa SMK Bina Warga Bandung');
      setFormNamaInstitusi('SMK Bina Warga Bandung');
      setFormJenisInstitusi('SMK/SMA');
      setFormPicInstitusi('Drs. Dadang Suryana');
      setFormJabatanPIC('Kepala Sekolah & Penanggung Jawab BKK');
      setFormKontakPIC('081220123456');
      setFormEmailInstitusi('bkk@smkbinawarga.sch.id');
      setFormTarget('Siswa Kelas XII Jurusan Otomotif & Keperawatan');
      setFormAgendaMeeting('Sosialisasi Program Kerja Tokutei Ginou Kaigo & Industri Manufaktur Jepang serta Seleksi Fisik Awal.');
      setFormWaktuMeeting('08:30 - 12:00 WIB');
      setFormLokasi('Aula Utama SMK Bina Warga, Buah Batu Bandung');
      setFormEstimasiPeserta(150);
      setFormAnggaran(2000000);
      setFormStatus('TERJADWAL');
      setFormMulai('2026-03-20');
      setFormSelesai('2026-03-20');
      setFormCatatan('Pihak BKK sudah menyiapkan proyektor dan 150 kursi peserta.');
    } else if (presetType === 'kampus') {
      setFormKategori('ROADSHOW_KAMPUS');
      setFormKanal('Audiensi & Roadshow Kampus');
      setFormNama('Audiensi & Roadshow Kampus: Peluang Karir Gijinkoku di Universitas Telkom');
      setFormNamaInstitusi('Telkom University (Tel-U)');
      setFormJenisInstitusi('Kampus/Universitas');
      setFormPicInstitusi('Dr. Ir. Arif Budiman, M.Kom');
      setFormJabatanPIC('Direktur Karir, Alumni & Kerjasama Industri');
      setFormKontakPIC('081321654987');
      setFormEmailInstitusi('cdc@telkomuniversity.ac.id');
      setFormTarget('Mahasiswa Tingkat Akhir & Fresh Graduate S1 Informatika / Elektro');
      setFormAgendaMeeting('Audiensi Kerjasama Penempatan Engineer IT & Software Developer ke Perusahaan Teknologi di Tokyo.');
      setFormWaktuMeeting('13:00 - 15:30 WIB');
      setFormLokasi('Gedung Damar Lt. 2 Telkom University Bandung');
      setFormEstimasiPeserta(80);
      setFormAnggaran(1500000);
      setFormStatus('TERJADWAL');
      setFormMulai('2026-03-24');
      setFormSelesai('2026-03-24');
      setFormCatatan('Audiensi mencakup pembahasan draf kerjasama penyaluran dan magang internasional.');
    } else if (presetType === 'blk') {
      setFormKategori('MEETING_LEMBAGA');
      setFormKanal('Meeting & Kemitraan Lembaga / BLK');
      setFormNama('Meeting Kerjasama Program Pelatihan Bahasa & Rekrutmen BLK Komunitas Jawa Barat');
      setFormNamaInstitusi('BLK Komunitas Bina Insan Mandiri Jabar');
      setFormJenisInstitusi('Lembaga/BLK/Disnaker');
      setFormPicInstitusi('H. Asep Saepuloh, S.T.');
      setFormJabatanPIC('Kepala Balai Latihan Kerja & Hubungan Kelembagaan');
      setFormKontakPIC('085223344556');
      setFormEmailInstitusi('blkk.binainsan@gmail.com');
      setFormTarget('Peserta Pelatihan Vokasi Kejuruan Teknik Las & Otomotif');
      setFormAgendaMeeting('Meeting Penyelarasan Kurikulum Vokasi dengan Standar JFT A2 & Tokutei Ginou Skill Test.');
      setFormWaktuMeeting('10:00 - 12:30 WIB');
      setFormLokasi('Ruang Rapat BLK Komunitas, Soreang Kab. Bandung');
      setFormEstimasiPeserta(50);
      setFormAnggaran(1000000);
      setFormStatus('TERJADWAL');
      setFormMulai('2026-03-28');
      setFormSelesai('2026-03-28');
      setFormCatatan('Fasilitas BLK siap digunakan untuk pemusatan pelatihan bahasa Jepang daerah.');
    } else if (presetType === 'b2b') {
      setFormKategori('APPOINTMENT_B2B');
      setFormKanal('Meeting Appointment B2B / Kemitraan');
      setFormNama('Meeting Appointment Kemitraan Penyaluran Tenaga Kerja PT Mitra Insan Berkarya');
      setFormNamaInstitusi('PT Mitra Insan Berkarya');
      setFormJenisInstitusi('Perusahaan Mitra');
      setFormPicInstitusi('Bpk. Hendro Wicaksono');
      setFormJabatanPIC('HR & Corporate Partnership Director');
      setFormKontakPIC('08119876543');
      setFormEmailInstitusi('partnership@mitrainsankarya.co.id');
      setFormTarget('Lulusan SMA/SMK Jaringan Penyaluran Ketenagakerjaan Swasta');
      setFormAgendaMeeting('Diskusi Kerjasama B2B Rekrutmen Kandidat Ex-Magang & Fresh Graduate untuk Program Matching Tokutei Ginou.');
      setFormWaktuMeeting('14:00 - 16:00 WIB');
      setFormLokasi('Kantor Pusat PT Mitra Insan, Gatot Subroto Bandung');
      setFormEstimasiPeserta(40);
      setFormAnggaran(1200000);
      setFormStatus('TERJADWAL');
      setFormMulai('2026-03-30');
      setFormSelesai('2026-03-30');
      setFormCatatan('Membahas pembagian skema rekrutmen & fee kemitraan institusi.');
    } else if (presetType === 'ads') {
      setFormKategori('DIGITAL_ADS');
      setFormKanal('Instagram Ads');
      setFormNama('Instagram Ads Gelombang 19: Pelatihan & Kerja Jepang Gaji 25 Juta');
      setFormTarget('Usia 18-28 Thn se-Jabar & Jateng');
      setFormEstimasiPeserta(200);
      setFormAnggaran(3000000);
      setFormStatus('BERJALAN');
      setFormMulai('2026-03-01');
      setFormSelesai('2026-03-31');
      setFormCatatan('Menggunakan materi video testimoni alumni LPK IJEF yang sedang kerja di Osaka & Tokyo.');
      setFormNamaInstitusi('');
      setFormPicInstitusi('');
      setFormKontakPIC('');
    }
  };

  const handleOpenCreateCampaign = () => {
    setEditingCampaign(null);
    setFormNama('');
    setFormKategori('SOSIALISASI_SEKOLAH');
    setFormKanal('Sosialisasi SMK / SMA');
    setFormTarget('Siswa Kelas XII SMK / Mahasiswa Akhir');
    setFormAnggaran(2000000);
    setFormStatus('TERJADWAL');
    setFormMulai(new Date().toISOString().split('T')[0]);
    setFormSelesai(new Date().toISOString().split('T')[0]);
    setFormLokasi('');
    setFormCatatan('');
    setFormNamaInstitusi('');
    setFormJenisInstitusi('SMK/SMA');
    setFormPicInstitusi('');
    setFormJabatanPIC('');
    setFormKontakPIC('');
    setFormEmailInstitusi('');
    setFormAgendaMeeting('');
    setFormWaktuMeeting('09:00 - 12:00 WIB');
    setFormEstimasiPeserta(100);
    setFormPicStaffLPK(user?.displayName || 'Bagas Pratama');
    setFormTotalLeads(0);
    setFormTotalClosing(0);
    setModalOpen(true);
  };

  const handleOpenEditCampaign = (cmp: CampaignItem) => {
    setEditingCampaign(cmp);
    setFormNama(cmp.namaKampanye || '');
    setFormKategori(cmp.kategoriKegiatan || 'SOSIALISASI_SEKOLAH');
    setFormKanal(cmp.kanal || 'Sosialisasi SMK / SMA');
    setFormTarget(cmp.targetAudience || '');
    setFormAnggaran(cmp.anggaranBiaya || 0);
    setFormStatus(cmp.status || 'TERJADWAL');
    setFormMulai(cmp.tanggalMulai || new Date().toISOString().split('T')[0]);
    setFormSelesai(cmp.tanggalSelesai || cmp.tanggalMulai || new Date().toISOString().split('T')[0]);
    setFormLokasi(cmp.lokasi || '');
    setFormCatatan(cmp.catatan || '');
    setFormNamaInstitusi(cmp.namaInstitusi || '');
    setFormJenisInstitusi(cmp.jenisInstitusi || 'SMK/SMA');
    setFormPicInstitusi(cmp.picInstitusi || '');
    setFormJabatanPIC(cmp.jabatanPIC || '');
    setFormKontakPIC(cmp.kontakPIC || '');
    setFormEmailInstitusi(cmp.emailInstitusi || '');
    setFormAgendaMeeting(cmp.agendaMeeting || '');
    setFormWaktuMeeting(cmp.waktuMeeting || '09:00 - 12:00 WIB');
    setFormEstimasiPeserta(cmp.estimasiPesertaLeads || 100);
    setFormPicStaffLPK(cmp.picStaffLPK || user?.displayName || 'Bagas Pratama');
    setFormTotalLeads(cmp.totalLeads || 0);
    setFormTotalClosing(cmp.totalClosing || 0);
    setModalOpen(true);
  };

  const handleDeleteCampaign = async (cmp: CampaignItem) => {
    if (!window.confirm(bilingual(`Yakin ingin menghapus kegiatan/kampanye "${cmp.namaKampanye}" dari database Firebase?`, `キャンペーン「${cmp.namaKampanye}」を削除してもよろしいですか？`))) {
      return;
    }
    await deleteCampaign(cmp.id);
    setToastMessage(bilingual(`Kampanye "${cmp.namaKampanye}" berhasil dihapus dari Firebase Firestore.`, `キャンペーンを削除しました。`));
  };

  const handleSaveCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) return;

    setIsSaving(true);
    try {
      const cmpData: CampaignItem = {
        id: editingCampaign ? editingCampaign.id : `CMP-${Date.now().toString().slice(-6)}`,
        namaKampanye: formNama.trim(),
        kategoriKegiatan: formKategori,
        kanal: formKanal,
        targetAudience: formTarget.trim() || (lang === 'ja' ? '潜在的な見込み生徒' : 'Calon Siswa Potensial'),
        anggaranBiaya: Number(formAnggaran) || 0,
        totalLeads: editingCampaign ? Number(formTotalLeads ?? editingCampaign.totalLeads ?? 0) : 0,
        totalClosing: editingCampaign ? Number(formTotalClosing ?? editingCampaign.totalClosing ?? 0) : 0,
        status: formStatus,
        tanggalMulai: formMulai || new Date().toISOString().split('T')[0],
        tanggalSelesai: formSelesai || formMulai || new Date().toISOString().split('T')[0],
        lokasi: formLokasi.trim(),
        catatan: formCatatan.trim(),
        namaInstitusi: formNamaInstitusi.trim() || undefined,
        jenisInstitusi: formJenisInstitusi,
        picInstitusi: formPicInstitusi.trim() || undefined,
        jabatanPIC: formJabatanPIC.trim() || undefined,
        kontakPIC: formKontakPIC.trim() || undefined,
        emailInstitusi: formEmailInstitusi.trim() || undefined,
        agendaMeeting: formAgendaMeeting.trim() || undefined,
        waktuMeeting: formWaktuMeeting.trim() || undefined,
        estimasiPesertaLeads: Number(formEstimasiPeserta) || 100,
        picStaffLPK: formPicStaffLPK.trim() || undefined,
        createdAt: editingCampaign?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await saveCampaign(cmpData);
      setModalOpen(false);
      setEditingCampaign(null);
      setToastMessage(
        editingCampaign
          ? bilingual(`✨ Kampanye "${formNama}" berhasil diperbarui & disimpan ke Firestore!`, `✨ キャンペーン「${formNama}」が正常に更新されました！`)
          : bilingual(`✨ Berhasil menambahkan kegiatan: "${formNama}" ke Firestore!`, `✨ 新規イベント・キャンペーン「${formNama}」を追加しました！`)
      );
    } catch (err: any) {
      alert(`Gagal menyimpan kampanye: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct WhatsApp Trigger to Institutional PIC
  const handleOpenPICWhatsApp = (cmp: CampaignItem) => {
    if (!cmp.kontakPIC) {
      alert(bilingual('Nomor WhatsApp PIC belum terdaftar.', '担当者のWhatsApp番号が登録されていません。'));
      return;
    }
    let cleanPhone = cmp.kontakPIC.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const picGreeting = cmp.picInstitusi || 'Bapak/Ibu Pimpinan';
    const institutionName = cmp.namaInstitusi || 'Institusi Mitra';
    const meetingAgenda = cmp.agendaMeeting || cmp.namaKampanye;
    const meetingTime = cmp.waktuMeeting ? ` pada ${cmp.tanggalMulai} (${cmp.waktuMeeting})` : ` pada tanggal ${cmp.tanggalMulai}`;
    const staffName = cmp.picStaffLPK || user?.displayName || 'Tim Kemitraan & Sosialisasi';

    const message = bilingual(
      `Yth. ${picGreeting}\n${cmp.jabatanPIC ? `(${cmp.jabatanPIC} - ${institutionName})` : institutionName}\n\nSalam hormat, saya ${staffName} dari LPK IJEF CORP Bandung.\n\nKami ingin mengonfirmasi terkait agenda: "${meetingAgenda}" yang direncanakan${meetingTime} bertempat di ${cmp.lokasi || institutionName}.\n\nApakah ada dokumen atau perlengkapan pendukung dari tim kami yang perlu dipersiapkan sebelumnya? Terima kasih banyak atas kerjasama dan sambutan baik Bapak/Ibu. 🙏🇮🇩🇯🇵`,
      `拝啓 ${picGreeting}様\n${institutionName}\n\nお世話になっております。LPK IJEF CORPの${staffName}です。\n\n予定しております「${meetingAgenda}」（日程: ${cmp.tanggalMulai} / 場所: ${cmp.lokasi || institutionName}）についてご連絡いたしました。事前にご準備すべき資料や機材等がございましたらお知らせください。今後ともよろしくお願い申し上げます。`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Quick Lead Capture directly linked to Campaign / Event
  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTargetCampaign || !leadNama.trim() || !leadNoWhatsapp.trim()) return;

    const newLead: MarketingLead = {
      id: `LEAD-${Date.now().toString().slice(-5)}`,
      namaLengkap: leadNama.trim(),
      namaPanggilan: leadNama.trim().split(' ')[0],
      noWhatsapp: leadNoWhatsapp.trim(),
      email: leadEmail.trim() || `${leadNama.trim().toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      kotaDomisili: leadKota.trim() || 'Bandung',
      jenisKelamin: 'Laki-laki',
      kategoriKandidat: (leadProgram === 'SISWA IJEF - Offline' || leadProgram === 'SISWA IJEF - Online' ? 'SISWA IJEF - Offline' : 'SISWA NON IJEF (New Comer)') as any,
      programMinat: leadProgram,
      bidangMinat: leadBidangMinat,
      sumberLead: activeTargetCampaign.kanal as any,
      statusLead: 'KONTAK_AWAL',
      assignedStaff: activeTargetCampaign.picStaffLPK || user?.displayName || 'Bagas Pratama',
      picMarketingStaff: activeTargetCampaign.picStaffLPK || user?.displayName || 'Bagas Pratama',
      tanggalMasukLead: new Date().toISOString().split('T')[0],
      catatanKonsultasi: `Lead didapatkan langsung dari acara: [${activeTargetCampaign.namaKampanye}] (${activeTargetCampaign.namaInstitusi || activeTargetCampaign.lokasi || 'Event'}). ${leadCatatan}`,
      riwayatFollowUp: [
        {
          id: `FL-${Date.now()}`,
          tanggal: new Date().toLocaleString('id-ID'),
          petugas: activeTargetCampaign.picStaffLPK || user?.displayName || 'Tim Marketing',
          metode: 'Tatap Muka / Visit',
          hasil: `Data kontak diterima saat sosialisasi / event [${activeTargetCampaign.namaKampanye}]. Peminat serius program ${leadBidangMinat}.`
        }
      ]
    };

    saveLead(newLead);

    // Update campaign counter in Firestore
    const updatedCmp: CampaignItem = {
      ...activeTargetCampaign,
      totalLeads: (activeTargetCampaign.totalLeads || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    await saveCampaign(updatedCmp);

    setQuickLeadModalOpen(false);
    setToastMessage(
      bilingual(
        `🎉 Calon Siswa "${newLead.namaLengkap}" berhasil dicatat dari [${activeTargetCampaign.namaInstitusi || activeTargetCampaign.namaKampanye}] dan masuk ke CRM Leads & Firestore!`,
        `🎉 「${newLead.namaLengkap}」をCRMリードとして正常に登録しました！（獲得元: ${activeTargetCampaign.namaInstitusi || activeTargetCampaign.namaKampanye}）`
      )
    );

    // Reset form
    setLeadNama('');
    setLeadNoWhatsapp('');
    setLeadEmail('');
    setLeadCatatan('');
  };

  // Quick Status Update with Firebase sync
  const handleUpdateStatus = async (campaignId: string, newStatus: CampaignItem['status']) => {
    await updateCampaignStatus(campaignId, newStatus);
    setToastMessage(
      bilingual('Status kegiatan berhasil diperbarui & disimpan ke Firestore.', 'ステータスが更新され、Firestoreに保存されました。')
    );
  };

  // Filtered Campaigns
  const filteredCampaigns = campaigns.filter((cmp) => {
    if (selectedCategory === 'SOSIALISASI_SEKOLAH') {
      if (cmp.kategoriKegiatan !== 'SOSIALISASI_SEKOLAH' && cmp.kanal !== 'Sosialisasi SMK / SMA') return false;
    } else if (selectedCategory === 'ROADSHOW_KAMPUS') {
      if (cmp.kategoriKegiatan !== 'ROADSHOW_KAMPUS' && cmp.kanal !== 'Audiensi & Roadshow Kampus') return false;
    } else if (selectedCategory === 'MEETING_LEMBAGA') {
      if (cmp.kategoriKegiatan !== 'MEETING_LEMBAGA' && cmp.kanal !== 'Meeting & Kemitraan Lembaga / BLK') return false;
    } else if (selectedCategory === 'APPOINTMENT_B2B') {
      if (cmp.kategoriKegiatan !== 'APPOINTMENT_B2B' && cmp.kanal !== 'Meeting Appointment B2B / Kemitraan') return false;
    } else if (selectedCategory === 'DIGITAL_ADS') {
      if (cmp.kategoriKegiatan !== 'DIGITAL_ADS' && cmp.kanal !== 'Instagram Ads' && cmp.kanal !== 'TikTok Ads') return false;
    } else if (selectedCategory === 'WEBINAR_JOBFAIR') {
      if (cmp.kategoriKegiatan !== 'WEBINAR_ONLINE' && cmp.kategoriKegiatan !== 'JOB_FAIR' && cmp.kanal !== 'Webinar Online' && cmp.kanal !== 'Job Fair') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cmp.namaKampanye.toLowerCase().includes(q);
      const matchInst = (cmp.namaInstitusi || '').toLowerCase().includes(q);
      const matchPic = (cmp.picInstitusi || '').toLowerCase().includes(q);
      const matchTarget = (cmp.targetAudience || '').toLowerCase().includes(q);
      const matchLoc = (cmp.lokasi || '').toLowerCase().includes(q);
      return matchName || matchInst || matchPic || matchTarget || matchLoc;
    }

    return true;
  });

  // Upcoming meetings & appointments widget list
  const upcomingAppointments = campaigns
    .filter((c) => c.status === 'TERJADWAL' || c.status === 'BERJALAN' || c.status === 'PERLU_FOLLOW_UP')
    .slice(0, 3);

  // Metrics
  const totalAnggaran = campaigns.reduce((acc, c) => acc + c.anggaranBiaya, 0);
  const totalLeadsCampaign = campaigns.reduce((acc, c) => acc + c.totalLeads, 0);
  const totalClosingCampaign = campaigns.reduce((acc, c) => acc + c.totalClosing, 0);
  const avgCostPerLead = totalLeadsCampaign > 0 ? Math.round(totalAnggaran / totalLeadsCampaign) : 0;
  const totalInstitusiMitra = campaigns.filter((c) => c.namaInstitusi).length;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-bold">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-orange-600 font-extrabold text-xs tracking-wider uppercase">
            <Megaphone className="w-4 h-4" />
            <span>{bilingual('KAMPANYE, SOSIALISASI & MEETING APPOINTMENT', '広告・学校説明会・提携ミーティング')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {bilingual('Sosialisasi Sekolah, Kampus, Lembaga & Kampanye Iklan', '学校・大学・公的機関訪問説明会＆プロモーション管理')}
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl">
            {bilingual(
              'Manajemen terpadu jadwal sosialisasi SMK/SMA, audiensi kampus, meeting kemitraan BLK/lembaga, appointment B2B, serta evaluasi ROI kampanye digital LPK IJEF.',
              '高校・大学・公的訓練校（BLK）等への訪問説明会、提携面談アポイントメント、およびデジタル広告の費用対効果（CPL）を一元管理します。'
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateCampaign}
          className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{bilingual('+ Tambah Kampanye / Event / Sosialisasi', '+ 新規イベント・説明会・アポ登録')}</span>
        </button>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center justify-between">
            <span>{bilingual('Total Anggaran Promosi', '総プロモーション予算')}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">Rp {totalAnggaran.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
            <span>{campaigns.length} {bilingual('Kegiatan & Event', '件のイベント・広告')}</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center justify-between">
            <span>{bilingual('Total Lead & Peserta Terdata', '獲得総リード数')}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-700">
            {totalLeadsCampaign} {bilingual('Lead', '件')}
          </div>
          <div className="text-[10px] text-slate-500">
            {bilingual(`Dari ${totalInstitusiMitra} Institusi & Iklan`, `${totalInstitusiMitra}提携先＆広告合算`)}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center justify-between">
            <span>{bilingual('Closing Siswa & MOU', '成約生徒＆MOU締結')}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">
            {totalClosingCampaign} {bilingual('Siswa', '名')}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold">{bilingual('Telah Terdaftar Resmi', '正式登録完了')}</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-400 text-[10px] font-bold uppercase flex items-center justify-between">
            <span>{bilingual('Rata-Rata Cost Per Lead', '平均獲得単価 (CPL)')}</span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-black text-orange-600">Rp {avgCostPerLead.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500">
            {bilingual('Biaya per 1 Calon Siswa', '生徒1名あたりの獲得コスト')}
          </div>
        </div>
      </div>

      {/* UPCOMING APPOINTMENTS & ROADSHOW SCHEDULE BANNER */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-indigo-500/10 border border-orange-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  {bilingual('Agenda Sosialisasi & Meeting Appointment Terdekat', '直近の訪問説明会＆アポイントメント一覧')}
                </h3>
                <p className="text-[11px] text-slate-600">
                  {bilingual(
                    'Hubungi PIC atau konfirmasi persiapan materi presentasi sebelum tanggal kunjungan.',
                    '訪問日前に各担当者へのリマインドおよび配布資料のご準備をご確認ください。'
                  )}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-orange-800 bg-white/90 px-3 py-1 rounded-xl border border-orange-200 self-start sm:self-auto">
              {upcomingAppointments.length} {bilingual('Agenda Terjadwal', '件の予定')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {upcomingAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white/90 backdrop-blur-xs border border-orange-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs hover:shadow-xs transition"
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                    {app.namaInstitusi ? (app.jenisInstitusi || 'Institusi') : app.kanal}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-700">
                    <Clock className="w-3 h-3 text-orange-600" />
                    <span>{app.tanggalMulai}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                    {app.namaInstitusi || app.namaKampanye}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {app.picInstitusi ? `PIC: ${app.picInstitusi} (${app.jabatanPIC || 'Pimpinan'})` : app.targetAudience}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-500 truncate">
                    📍 {app.lokasi ? app.lokasi.split(',')[0] : 'Tatap Muka'}
                  </div>
                  {app.kontakPIC ? (
                    <button
                      type="button"
                      onClick={() => handleOpenPICWhatsApp(app)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg border border-emerald-200 flex items-center space-x-1 transition cursor-pointer shrink-0"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>{bilingual('WA PIC', '連絡')}</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{bilingual('Semua Kegiatan', '全活動')}</span>
              <span className="text-[10px] opacity-75 font-mono">({campaigns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('SOSIALISASI_SEKOLAH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'SOSIALISASI_SEKOLAH'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>{bilingual('Sosialisasi SMK/SMA', '高校訪問説明会')}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({campaigns.filter((c) => c.kategoriKegiatan === 'SOSIALISASI_SEKOLAH' || c.kanal === 'Sosialisasi SMK / SMA').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('ROADSHOW_KAMPUS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'ROADSHOW_KAMPUS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{bilingual('Audiensi Kampus / Poltek', '大学・高専訪問')}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({campaigns.filter((c) => c.kategoriKegiatan === 'ROADSHOW_KAMPUS' || c.kanal === 'Audiensi & Roadshow Kampus').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('MEETING_LEMBAGA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'MEETING_LEMBAGA'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{bilingual('Meeting BLK / Disnaker', '公的訓練校・労働局')}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({campaigns.filter((c) => c.kategoriKegiatan === 'MEETING_LEMBAGA' || c.kanal === 'Meeting & Kemitraan Lembaga / BLK').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('APPOINTMENT_B2B')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'APPOINTMENT_B2B'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>{bilingual('Appointment B2B / Mitra', '提携・B2B面談')}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({campaigns.filter((c) => c.kategoriKegiatan === 'APPOINTMENT_B2B' || c.kanal === 'Meeting Appointment B2B / Kemitraan').length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCategory('DIGITAL_ADS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                selectedCategory === 'DIGITAL_ADS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{bilingual('Iklan Digital (Ads)', 'デジタル広告')}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({campaigns.filter((c) => c.kategoriKegiatan === 'DIGITAL_ADS' || c.kanal === 'Instagram Ads' || c.kanal === 'TikTok Ads').length})
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={bilingual('Cari sekolah, kampus, PIC, event...', '学校名、担当者、イベント名で検索...')}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Campaigns & Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <School className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-extrabold text-slate-700 text-sm">
              {bilingual('Tidak ada kegiatan / kampanye yang cocok dengan filter', '該当するイベント・説明会が見つかりません')}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {bilingual(
                'Coba ubah kata kunci pencarian atau klik tombol Tambah Kampanye / Event Baru.',
                '検索キーワードを変更するか、新規登録ボタンから追加してください。'
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {bilingual('Reset Filter', 'フィルターリセット')}
            </button>
          </div>
        ) : (
          filteredCampaigns.map((cmp) => {
            const costPerLead = cmp.totalLeads > 0 ? Math.round(cmp.anggaranBiaya / cmp.totalLeads) : 0;
            const displayTitle = translateCampaignName(cmp.namaKampanye, lang);
            const displayTarget = translateTargetAudience(cmp.targetAudience, lang);
            const displayChannel = translateCampaignChannel(cmp.kanal, lang);
            const displayStatus = translateCampaignStatus(cmp.status, lang);
            const dateRangeFormatted = formatMarketingDateRange(cmp.tanggalMulai, cmp.tanggalSelesai, lang);
            const displayLocation = translateCampaignLocation(cmp.lokasi, lang);

            const isInstitutional =
              cmp.kategoriKegiatan === 'SOSIALISASI_SEKOLAH' ||
              cmp.kategoriKegiatan === 'ROADSHOW_KAMPUS' ||
              cmp.kategoriKegiatan === 'MEETING_LEMBAGA' ||
              cmp.kategoriKegiatan === 'APPOINTMENT_B2B' ||
              !!cmp.namaInstitusi;

            return (
              <div
                key={cmp.id}
                className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Status & Badge Header */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        cmp.status === 'BERJALAN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : cmp.status === 'TERJADWAL'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : cmp.status === 'MOU_SEPAKAT'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : cmp.status === 'SOSIALISASI_SUKSES'
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : cmp.status === 'PERLU_FOLLOW_UP'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {displayStatus}
                    </span>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {displayChannel}
                    </span>
                  </div>

                  {/* Title & Target */}
                  <div>
                    <h4 className="font-black text-slate-900 text-sm leading-snug">{displayTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1">{displayTarget}</p>
                  </div>

                  {/* INSTITUTIONAL / MEETING APPOINTMENT BOX */}
                  {isInstitutional && (
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
                      {cmp.namaInstitusi && (
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                            {cmp.jenisInstitusi === 'Kampus/Universitas' ? (
                              <GraduationCap className="w-3.5 h-3.5" />
                            ) : cmp.jenisInstitusi === 'Lembaga/BLK/Disnaker' ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : cmp.jenisInstitusi === 'Perusahaan Mitra' || cmp.jenisInstitusi === 'Yayasan/Komunitas' ? (
                              <Handshake className="w-3.5 h-3.5" />
                            ) : (
                              <School className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="truncate">
                            <span className="font-extrabold text-slate-900 block truncate">{cmp.namaInstitusi}</span>
                            <span className="text-[10px] text-slate-500">{translateInstitutionType(cmp.jenisInstitusi, lang)}</span>
                          </div>
                        </div>
                      )}

                      {cmp.picInstitusi && (
                        <div className="flex items-start justify-between gap-1 text-[11px] pt-1 border-t border-slate-200/60">
                          <div>
                            <span className="text-slate-500 block text-[10px]">{bilingual('PIC / Pejabat:', '担当者・役職:')}</span>
                            <span className="font-bold text-slate-800">{cmp.picInstitusi}</span>
                            {cmp.jabatanPIC && <span className="text-[10px] text-slate-500 block">{cmp.jabatanPIC}</span>}
                          </div>
                          {cmp.kontakPIC && (
                            <button
                              type="button"
                              onClick={() => handleOpenPICWhatsApp(cmp)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs flex items-center space-x-1 transition cursor-pointer shrink-0 mt-1"
                              title={bilingual('Kirim WhatsApp Konfirmasi ke PIC', '担当者へWhatsApp連絡')}
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{bilingual('Chat PIC', '連絡')}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {cmp.agendaMeeting && (
                        <div className="text-[11px] bg-white p-2 rounded-xl border border-slate-200/60 space-y-0.5">
                          <span className="text-[10px] font-bold text-orange-700 flex items-center space-x-1">
                            <CalendarCheck className="w-3 h-3" />
                            <span>{bilingual('Agenda Pertemuan / Sosialisasi:', 'アジェンダ・目的:')}</span>
                          </span>
                          <p className="text-[11px] text-slate-700 leading-tight">{cmp.agendaMeeting}</p>
                          {cmp.waktuMeeting && (
                            <span className="text-[10px] font-bold text-slate-500 block pt-0.5">
                              🕒 {cmp.waktuMeeting}
                            </span>
                          )}
                        </div>
                      )}

                      {cmp.hasilKesepakatan && (
                        <div className="text-[10px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200 font-medium">
                          ✨ <strong>{bilingual('Hasil:', '結果:')}</strong> {cmp.hasilKesepakatan}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Location Info */}
                  {displayLocation && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">{displayLocation}</span>
                    </div>
                  )}
                </div>

                {/* Progress Tracking Bar & Targets */}
                <div className="space-y-2.5 text-xs pt-3 border-t border-slate-100">
                  <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                        <BarChart3 className="w-3.5 h-3.5 text-orange-600" />
                        <span>{bilingual('Progres Capaian Target:', '目標達成進捗:')}</span>
                      </div>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        {cmp.totalLeads || 0} / {cmp.estimasiPesertaLeads || 50} {bilingual('Leads', '件')} ({Math.min(100, Math.round(((cmp.totalLeads || 0) / (cmp.estimasiPesertaLeads || 50)) * 100))}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ((cmp.totalLeads || 0) / (cmp.estimasiPesertaLeads || 50)) >= 1
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : ((cmp.totalLeads || 0) / (cmp.estimasiPesertaLeads || 50)) >= 0.5
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-orange-400 to-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round(((cmp.totalLeads || 0) / (cmp.estimasiPesertaLeads || 50)) * 100))}%`
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[150px]">
                        🎯 <strong className="text-slate-700">{displayTarget}</strong>
                      </span>
                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✨ {cmp.totalClosing || 0} {bilingual('Closing Deal', '成約入校')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-slate-500 text-[10px] block">{bilingual('Anggaran Biaya:', '予算:')}</span>
                      <span className="font-bold text-slate-900">Rp {cmp.anggaranBiaya.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-orange-50/60 p-2 rounded-xl">
                      <span className="text-orange-700 text-[10px] block font-semibold">{bilingual('Leads & Closing:', '成果:')}</span>
                      <span className="font-black text-orange-700">
                        {cmp.totalLeads} {bilingual('Lead', '件')} ({cmp.totalClosing} {bilingual('Closing', '成約')})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateRangeFormatted}</span>
                    </div>
                    {cmp.picStaffLPK && (
                      <span className="font-semibold text-slate-600 truncate max-w-[120px]">
                        PIC: {cmp.picStaffLPK.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* ACTION BUTTONS: Edit, Hapus, Catat Lead, Quick Status */}
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTargetCampaign(cmp);
                        setQuickLeadModalOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-orange-600 text-white font-extrabold text-[11px] rounded-xl shadow-2xs transition flex items-center justify-center space-x-1 cursor-pointer min-w-[100px]"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-300" />
                      <span>{bilingual('Catat Lead', 'リード登録')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCampaign(cmp)}
                      className="py-1.5 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-[11px] rounded-xl transition flex items-center space-x-1 cursor-pointer"
                      title={bilingual('Edit Data Kampanye & Target', 'キャンペーン編集')}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                      <span>{bilingual('Edit', '編集')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(cmp)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-700 border border-slate-200 rounded-xl transition cursor-pointer"
                      title={bilingual('Hapus dari Firebase', 'Firebaseから削除')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Status Selector */}
                    <select
                      value={cmp.status}
                      onChange={(e) => handleUpdateStatus(cmp.id, e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer w-full sm:w-auto"
                    >
                      <option value="TERJADWAL">{bilingual('Terjadwal', '予定')}</option>
                      <option value="BERJALAN">{bilingual('Berjalan', '実施中')}</option>
                      <option value="MOU_SEPAKAT">{bilingual('MOU Sepakat', 'MOU合意')}</option>
                      <option value="SOSIALISASI_SUKSES">{bilingual('Sosialisasi Sukses', '説明会完了')}</option>
                      <option value="PERLU_FOLLOW_UP">{bilingual('Follow-Up', '要フォロー')}</option>
                      <option value="SELESAI">{bilingual('Selesai', '完了')}</option>
                      <option value="DITUNDA">{bilingual('Ditunda', '延期')}</option>
                    </select>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD NEW CAMPAIGN / ROADSHOW / APPOINTMENT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 via-rose-600 to-indigo-700 text-white p-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {editingCampaign
                      ? bilingual('Edit Kegiatan & Target Kampanye', 'キャンペーン・目標編集')
                      : bilingual('Tambah Kampanye, Sosialisasi & Meeting Baru', '新規キャンペーン・説明会・提携面談作成')}
                  </h3>
                  <p className="text-[10px] text-orange-100">
                    {editingCampaign
                      ? bilingual(`ID: ${editingCampaign.id} • Perubahan tersinkronisasi otomatis ke Firebase Firestore`, `ID: ${editingCampaign.id} • Firestore直接同期`)
                      : bilingual('Daftarkan acara promosi, roadshow sekolah/kampus, atau pertemuan appointment B2B', 'プロモーション活動・訪問説明会・提携面談を登録')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets Bar or Edit Banner */}
            {!editingCampaign ? (
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500 text-[11px] mr-1">{bilingual('Preset Cepat Demo:', 'クイック入力:')}</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('smk')}
                  className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 border border-orange-300 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  {bilingual('🏫 + Sosialisasi SMK Bandung', '🏫 + 高校説明会デモ')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('kampus')}
                  className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  {bilingual('🎓 + Audiensi Kampus Tel-U', '🎓 + 大学訪問デモ')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('blk')}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  {bilingual('🏛️ + Meeting BLK Disnaker', '🏛️ + 公的訓練校デモ')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('b2b')}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  {bilingual('🤝 + Appointment B2B Mitra', '🤝 + 提携面談デモ')}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ads')}
                  className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  {bilingual('📢 + Ads Instagram', '📢 + 広告デモ')}
                </button>
              </div>
            ) : (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
                <span className="font-bold flex items-center space-x-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>{bilingual('Mode Edit: Anda dapat memperbarui data target audiens, estimasi siswa, dan realisasi hasil', '編集モード: ターゲット層や予想人数、実績を直接更新できます')}</span>
                </span>
                <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">Firestore Sync</span>
              </div>
            )}

            <form onSubmit={handleSaveCampaignSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              {/* Jenis & Kategori Kegiatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kategori Kegiatan', '活動カテゴリー')}
                  </label>
                  <select
                    value={formKategori}
                    onChange={(e) => {
                      const kat = e.target.value as any;
                      setFormKategori(kat);
                      if (kat === 'SOSIALISASI_SEKOLAH') setFormKanal('Sosialisasi SMK / SMA');
                      else if (kat === 'ROADSHOW_KAMPUS') setFormKanal('Audiensi & Roadshow Kampus');
                      else if (kat === 'MEETING_LEMBAGA') setFormKanal('Meeting & Kemitraan Lembaga / BLK');
                      else if (kat === 'APPOINTMENT_B2B') setFormKanal('Meeting Appointment B2B / Kemitraan');
                      else if (kat === 'DIGITAL_ADS') setFormKanal('Instagram Ads');
                      else if (kat === 'WEBINAR_ONLINE') setFormKanal('Webinar Online');
                      else if (kat === 'JOB_FAIR') setFormKanal('Job Fair');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="SOSIALISASI_SEKOLAH">🏫 {bilingual('Sosialisasi Sekolah (SMK / SMA / MA)', '高校・専門高校訪問説明会')}</option>
                    <option value="ROADSHOW_KAMPUS">🎓 {bilingual('Audiensi & Roadshow Kampus / Poltek', '大学・短期大学・高専訪問')}</option>
                    <option value="MEETING_LEMBAGA">🏛️ {bilingual('Meeting Lembaga / BLK / Disnaker', '公的訓練校・労働局提携面談')}</option>
                    <option value="APPOINTMENT_B2B">🤝 {bilingual('Meeting Appointment B2B / Kemitraan', '法人・B2Bアポイントメント')}</option>
                    <option value="DIGITAL_ADS">📢 {bilingual('Iklan Digital (Instagram / TikTok Ads)', 'デジタル広告 (Instagram/TikTok)')}</option>
                    <option value="WEBINAR_ONLINE">🌐 {bilingual('Webinar Online (Zoom Gathering)', 'オンラインウェビナー')}</option>
                    <option value="JOB_FAIR">🎪 {bilingual('Job Fair / Expo Karir & Ketenagakerjaan', '合同就職説明会 (Job Fair)')}</option>
                    <option value="BROSUR_OFFLINE">📄 {bilingual('Brosur, Spanduk & Baliho Offline', 'チラシ・横断幕')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kanal Promosi / Format Acara', 'チャネル / 形式')}
                  </label>
                  <select
                    value={formKanal}
                    onChange={(e) => setFormKanal(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="Sosialisasi SMK / SMA">{bilingual('Sosialisasi SMK / SMA', '高校訪問説明会')}</option>
                    <option value="Audiensi & Roadshow Kampus">{bilingual('Audiensi & Roadshow Kampus', '大学訪問＆説明会')}</option>
                    <option value="Meeting & Kemitraan Lembaga / BLK">{bilingual('Meeting & Kemitraan Lembaga / BLK', '公的訓練校・提携面談')}</option>
                    <option value="Meeting Appointment B2B / Kemitraan">{bilingual('Meeting Appointment B2B / Kemitraan', 'B2Bミーティング面談')}</option>
                    <option value="Instagram Ads">Instagram Ads</option>
                    <option value="TikTok Ads">TikTok Ads</option>
                    <option value="Webinar Online">{bilingual('Webinar Online (Zoom)', 'オンライン説明会')}</option>
                    <option value="Job Fair">{bilingual('Job Fair / Expo', '就職フェア')}</option>
                    <option value="Brosur & Spanduk">{bilingual('Brosur & Spanduk', 'チラシ・看板')}</option>
                  </select>
                </div>
              </div>

              {/* Nama Kegiatan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Nama Kampanye / Kegiatan / Agenda Meeting', 'キャンペーン・イベント・会議名')}
                </label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder={bilingual('Contoh: Sosialisasi Tatap Muka & Kemitraan BKK SMKN 1 Katapang', '例: SMKN 1 カタパン対面説明会＆BKK提携')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              {/* SPECIAL INSTITUTIONAL & APPOINTMENT FIELDS */}
              {(formKategori === 'SOSIALISASI_SEKOLAH' ||
                formKategori === 'ROADSHOW_KAMPUS' ||
                formKategori === 'MEETING_LEMBAGA' ||
                formKategori === 'APPOINTMENT_B2B' ||
                formKanal === 'Sosialisasi SMK / SMA' ||
                formKanal === 'Audiensi & Roadshow Kampus' ||
                formKanal === 'Meeting & Kemitraan Lembaga / BLK' ||
                formKanal === 'Meeting Appointment B2B / Kemitraan') && (
                <div className="p-4 bg-orange-50/50 border border-orange-200 rounded-2xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-orange-900 font-extrabold text-xs">
                    <School className="w-4 h-4 text-orange-600" />
                    <span>{bilingual('Data Institusi, PIC & Jadwal Appointment Pertemuan', '訪問先機関・担当者・アポイント詳細')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Nama Sekolah / Kampus / Lembaga / Mitra', '学校・大学・機関・企業名')}
                      </label>
                      <input
                        type="text"
                        value={formNamaInstitusi}
                        onChange={(e) => setFormNamaInstitusi(e.target.value)}
                        placeholder={bilingual('Contoh: SMK Negeri 1 Katapang / Polman Bandung', '例: SMKN 1 カタパン / ポルマン・バンドン')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Jenis Institusi', '機関の種類')}
                      </label>
                      <select
                        value={formJenisInstitusi}
                        onChange={(e) => setFormJenisInstitusi(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      >
                        <option value="SMK/SMA">{bilingual('SMK / SMA / MA (Sekolah)', '高校・専門高校 (SMK/SMA)')}</option>
                        <option value="Kampus/Universitas">{bilingual('Kampus / Universitas / Politeknik', '大学・短期大学・高専')}</option>
                        <option value="Lembaga/BLK/Disnaker">{bilingual('Balai Latihan Kerja (BLK) / Disnaker', '公的訓練校・労働局')}</option>
                        <option value="Yayasan/Komunitas">{bilingual('Yayasan Pendidikan / Komunitas', '教育財団・団体')}</option>
                        <option value="Perusahaan Mitra">{bilingual('Perusahaan Mitra / B2B Partner', '提携企業・パートナー')}</option>
                        <option value="Lainnya">{bilingual('Lainnya', 'その他')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Nama PIC / Pejabat', '担当者・役職者氏名')}
                      </label>
                      <input
                        type="text"
                        value={formPicInstitusi}
                        onChange={(e) => setFormPicInstitusi(e.target.value)}
                        placeholder={bilingual('Drs. H. Mulyadi / Dr. Hendra', '例: ムリャディ校長')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Jabatan PIC', '役職')}
                      </label>
                      <input
                        type="text"
                        value={formJabatanPIC}
                        onChange={(e) => setFormJabatanPIC(e.target.value)}
                        placeholder={bilingual('Kepala Sekolah / Ketua BKK / CDC', '例: 校長 / BKK責任者')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('No WhatsApp PIC', '担当者WhatsApp番号')}
                      </label>
                      <input
                        type="tel"
                        value={formKontakPIC}
                        onChange={(e) => setFormKontakPIC(e.target.value)}
                        placeholder={bilingual('081223456789', '081223456789')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Agenda Pertemuan / Topik Sosialisasi', '面談アジェンダ・説明内容')}
                      </label>
                      <input
                        type="text"
                        value={formAgendaMeeting}
                        onChange={(e) => setFormAgendaMeeting(e.target.value)}
                        placeholder={bilingual('Sosialisasi Karir Kaigo & Penandatanganan Draf MOU Penyaluran', '例: 介護就労説明会＆MOU締結')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Waktu Pertemuan (Jam/Sesi)', '面談予定時間')}
                      </label>
                      <input
                        type="text"
                        value={formWaktuMeeting}
                        onChange={(e) => setFormWaktuMeeting(e.target.value)}
                        placeholder={bilingual('09:00 - 12:30 WIB', '09:00 - 12:30')}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Estimasi Peserta / Potensi Siswa', '参加予想人数')}
                      </label>
                      <input
                        type="number"
                        value={formEstimasiPeserta}
                        onChange={(e) => setFormEstimasiPeserta(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {bilingual('Staff LPK IJEF yang Bertugas (PIC Tim)', '担当LPKスタッフ')}
                      </label>
                      <select
                        value={formPicStaffLPK}
                        onChange={(e) => setFormPicStaffLPK(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                      >
                        {(staffList || []).map((staff) => (
                          <option key={staff.id} value={staff.nama}>
                            {staff.nama} ({staff.roleMarketing})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET AUDIENS & PROYEKSI PESERTA (DEDICATED MANUAL EDITABLE SECTION) */}
              <div className="p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-2 border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-950 font-extrabold text-xs">
                    <Target className="w-4 h-4 text-amber-600" />
                    <span>{bilingual('🎯 Target Audiens & Proyeksi Siswa (Bisa Diisi Manual)', '🎯 ターゲット層・参加目標（自由直接入力可能）')}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    {bilingual('Bebas Ketik', '直接入力OK')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {bilingual('Target Audiens / Segmen Kriteria Peserta', '対象層 / 参加資格・学科')}
                      <span className="text-amber-700 font-semibold ml-1">({bilingual('Manual', '自由記入')})</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTarget}
                      onChange={(e) => setFormTarget(e.target.value)}
                      placeholder={bilingual('Contoh: Siswa Kelas XII SMK Otomotif & Keperawatan se-Bandung', '例: バンドン地域高校3年生')}
                      className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {bilingual('Ketik target audiens secara bebas tanpa dibatasi oleh preset.', 'プリセットに制限されず自由に文字を入力・編集できます。')}
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {bilingual('Target Estimasi Peserta / Leads (Orang)', '参加予想・目標人数 (名)')}
                      <span className="text-amber-700 font-semibold ml-1">({bilingual('Angka', '数値')})</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formEstimasiPeserta}
                      onChange={(e) => setFormEstimasiPeserta(Number(e.target.value))}
                      className="w-full bg-white border border-amber-400 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {bilingual('Menjadi target pembanding progress capaian (%) pada kartu kampanye.', 'カードの目標達成率（％）プログレスバーの基準になります。')}
                    </p>
                  </div>
                </div>

                {/* If in edit mode, allow updating Realization of Leads & Closing directly */}
                {editingCampaign && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-300/80">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        {bilingual('Realisasi Total Leads Didapat Saat Ini', '現在の獲得リード実績数')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formTotalLeads}
                        onChange={(e) => setFormTotalLeads(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-emerald-800 mb-1">
                        {bilingual('Realisasi Closing / Siswa Terdaftar (Deal)', '成約・本入校実績数')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formTotalClosing}
                        onChange={(e) => setFormTotalClosing(Number(e.target.value))}
                        className="w-full bg-white border border-emerald-400 rounded-xl p-2.5 text-xs text-emerald-900 font-black focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Kegiatan */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Status Kegiatan', 'ステータス')}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <option value="TERJADWAL">📅 {bilingual('TERJADWAL (Akan Datang / Terjadwal)', '予定 (TERJADWAL)')}</option>
                    <option value="BERJALAN">⚡ {bilingual('BERJALAN (Sedang Berlangsung)', '実施中 (BERJALAN)')}</option>
                    <option value="MOU_SEPAKAT">🤝 {bilingual('MOU SEPAKAT (Kemitraan Disepakati)', 'MOU合意・締結')}</option>
                    <option value="SOSIALISASI_SUKSES">✨ {bilingual('SOSIALISASI SUKSES (Tuntas Terlaksana)', '説明会成功完了')}</option>
                    <option value="PERLU_FOLLOW_UP">⏳ {bilingual('PERLU FOLLOW UP (Menunggu Konfirmasi)', '要フォローアップ')}</option>
                    <option value="SELESAI">✅ {bilingual('SELESAI (Selesai Sepenuhnya)', '完了 (SELESAI)')}</option>
                    <option value="DITUNDA">⏸️ {bilingual('DITUNDA (Reschedule Jadwal)', '延期 / 日程調整中')}</option>
                  </select>
                </div>
              </div>

              {/* Anggaran & Lokasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Anggaran Biaya (Rp)', '予算金額 (Rp)')}
                  </label>
                  <input
                    type="number"
                    value={formAnggaran}
                    onChange={(e) => setFormAnggaran(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Lokasi Acara / Ruangan', '開催場所 / 会場')}
                  </label>
                  <input
                    type="text"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    placeholder={bilingual('Aula Utama SMKN 1 Katapang / Gedung Polman', '例: SMKN 1 講堂 / オンライン')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tanggal Mulai / Hari-H', '開始日・開催日')}</label>
                  <input
                    type="date"
                    value={formMulai}
                    onChange={(e) => setFormMulai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{bilingual('Tanggal Selesai', '終了日')}</label>
                  <input
                    type="date"
                    value={formSelesai}
                    onChange={(e) => setFormSelesai(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Catatan Operasional / Kebutuhan Materi', '特記事項・必要機材等')}
                </label>
                <textarea
                  rows={2}
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder={bilingual('Contoh: Bawa 200 lembar brosur Kaigo, formulir pendaftaran fisik, proyektor, dan roll banner LPK IJEF.', '例: パンフレット200部、申込用紙、プロジェクター持参')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {bilingual('Batal', 'キャンセル')}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? bilingual('Menyimpan ke Firebase...', 'Firestoreに保存中...')
                      : editingCampaign
                      ? bilingual('Simpan Perubahan Kampanye', '変更を保存')
                      : bilingual('Simpan Kegiatan & Jadwal', '保存して登録')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK INTAKE LEAD FROM CAMPAIGN / ROADSHOW */}
      {quickLeadModalOpen && activeTargetCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    {bilingual('Catat Calon Siswa (Lead Baru)', '新規生徒リード登録')}
                  </h3>
                  <p className="text-[10px] text-slate-300 line-clamp-1">
                    {bilingual('Sumber Event:', '獲得元:')} {activeTargetCampaign.namaInstitusi || activeTargetCampaign.namaKampanye}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickLeadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickLeadSubmit} className="p-6 space-y-3.5 text-xs text-slate-800">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900 text-[11px] flex items-center space-x-2">
                <School className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {activeTargetCampaign.namaInstitusi || activeTargetCampaign.namaKampanye}
                  </span>
                  <span className="text-[10px] opacity-80">
                    Kanal: {activeTargetCampaign.kanal} • PIC: {activeTargetCampaign.picStaffLPK || 'Marketing Staff'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Nama Lengkap Calon Siswa *', '生徒氏名 (必須) *')}
                </label>
                <input
                  type="text"
                  required
                  value={leadNama}
                  onChange={(e) => setLeadNama(e.target.value)}
                  placeholder={bilingual('Contoh: Rizky Febriansyah', '例: リズキー・フェブリアンシャー')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('No WhatsApp / HP *', 'WhatsApp番号 (必須) *')}
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadNoWhatsapp}
                    onChange={(e) => setLeadNoWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Kota Domisili', '居住都市')}
                  </label>
                  <input
                    type="text"
                    value={leadKota}
                    onChange={(e) => setLeadKota(e.target.value)}
                    placeholder="Bandung / Garut / Cimahi"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Bidang Minat Kerja', '希望職種')}
                  </label>
                  <select
                    value={leadBidangMinat}
                    onChange={(e) => setLeadBidangMinat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold"
                  >
                    <optgroup label="📚 Universal / Bahasa Jepang">
                      <option value="Belajar Bahasa Jepang Irodori">Belajar Bahasa Jepang Irodori (A1/A2)</option>
                      <option value="Belajar Bahasa Jepang Minna no Nihongo">Belajar Bahasa Jepang Minna no Nihongo (N5/N4)</option>
                      <option value="Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)">Kelas Bahasa Reguler (Umum / Belum Menentukan Bidang)</option>
                      <option value="Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)">Persiapan Tokutei Ginou (Penentuan Menyusul)</option>
                    </optgroup>
                    <optgroup label="🏭 Sektor Kerja Spesifik">
                      <option value="Kaigo (Caregiver / Perawat Lansia)">Kaigo (Caregiver)</option>
                      <option value="Pengolahan Makanan (Food Processing)">Pengolahan Makanan</option>
                      <option value="Pertanian (Agriculture)">Pertanian</option>
                      <option value="Manufaktur & Pabrik (Manufacturing)">Manufaktur & Pabrik</option>
                      <option value="Gijinkoku (IT / Engineering / Office)">Engineering / Gijinkoku</option>
                      <option value="Konstruksi (Building Construction)">Konstruksi</option>
                      <option value="Perhotelan (Hospitality / Accommodation)">Perhotelan</option>
                      <option value="Lainnya">Lainnya</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {bilingual('Program Kelas', '受講コース')}
                  </label>
                  <select
                    value={leadProgram}
                    onChange={(e) => setLeadProgram(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                  >
                    <option value="SISWA IJEF - Offline">SISWA IJEF (Offline & Asrama)</option>
                    <option value="SISWA IJEF - Online">SISWA IJEF (Online Class)</option>
                    <option value="MATCHING JOB - Engineering / Gijinkoku">Matching Job (Gijinkoku)</option>
                    <option value="SISWA NON IJEF (New Comer)">Siswa Non IJEF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {bilingual('Catatan Saat Sosialisasi / Minat Khusus', '説明会でのメモ・特記事項')}
                </label>
                <input
                  type="text"
                  value={leadCatatan}
                  onChange={(e) => setLeadCatatan(e.target.value)}
                  placeholder={bilingual('Tertarik dana talangan, minta dikabari jadwal tes fisik', '例: 立替金制度に関心あり、適性検査日程案内希望')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setQuickLeadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {bilingual('Batal', 'キャンセル')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{bilingual('Simpan ke CRM Leads', 'CRMリードとして保存')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
