import { Gender, MaritalStatus, Religion, BloodType, CandidateCategory } from './index';

export type LeadStatus =
  | 'LEAD_BARU'
  | 'KONTAK_AWAL'
  | 'DIHUBUNGI'
  | 'FOLLOW_UP'
  | 'KONSULTASI_VISIT'
  | 'KONSULTASI_LPK'
  | 'DEAL_TERDAFTAR'
  | 'BATAL_REJECT'
  | 'LOST_BATAL';

export type LeadSource =
  | 'Instagram Ads'
  | 'TikTok / Reels'
  | 'TikTok Ads'
  | 'Facebook Ads / Meta'
  | 'Website Resmi IJEF'
  | 'WhatsApp Blast / Organik'
  | 'Brosur / Event Offline'
  | 'Brosur & Spanduk'
  | 'Referral Alumni / Siswa'
  | 'Mitra LPK Daerah'
  | 'Walk-in Kantor LPK'
  | 'Job Fair Kampus/SMK'
  | 'Job Fair'
  | 'Sosialisasi SMK / SMA'
  | 'Event SMK/Kampus'
  | 'Audiensi & Roadshow Kampus'
  | 'Meeting & Kemitraan Lembaga / BLK'
  | 'Meeting Appointment B2B / Kemitraan'
  | 'Webinar Online'
  | 'Lainnya'
  | string;

export type LeadInterestProgram =
  | 'SISWA IJEF - Offline'
  | 'SISWA IJEF - Online'
  | 'SISWA NON IJEF (New Comer)'
  | 'SISWA MITRA / NON IJEF'
  | 'MATCHING JOB - Engineering / Gijinkoku'
  | 'MATCHING JOB - Ex-Magang / Ex-Trainee';

export type LeadBidangKerja =
  | 'Belajar Bahasa Jepang Irodori'
  | 'Belajar Bahasa Jepang Irodori (Dasar & Komunikasi A1/A2)'
  | 'Belajar Bahasa Jepang Minna no Nihongo (Dasar N5/N4)'
  | 'Kelas Bahasa Jepang Reguler (Umum / Belum Menentukan Bidang)'
  | 'Persiapan Tokutei Ginou / SSW (Penentuan Bidang Menyusul)'
  | 'Program Bahasa Jepang Intensif (Asrama Offline)'
  | 'Program Bahasa Jepang Online (Reguler / Pemula)'
  | 'Belum Menentukan Bidang (Fokus Bahasa Jepang)'
  | 'Kaigo (Caregiver / Perawat Lansia)'
  | 'Pengolahan Makanan (Food Processing)'
  | 'Pertanian (Agriculture)'
  | 'Pertanian (Nogyo / Greenhouse)'
  | 'Manufaktur & Pabrik (Manufacturing)'
  | 'Manufaktur & Permesinan (Machining)'
  | 'Konstruksi (Building Construction)'
  | 'Konstruksi (Building & Civil)'
  | 'Restoran / Food Service'
  | 'Restoran & Jasa Makanan (Food Service)'
  | 'Perhotelan (Hospitality / Accommodation)'
  | 'Gijinkoku (IT / Engineering / Office)'
  | 'Engineering & Konstruksi / IT'
  | 'Pengelasan (Welding)'
  | 'Peternakan (Livestock)'
  | 'Pembersihan Gedung (Building Cleaning)'
  | 'Lainnya'
  | string;

export interface FollowUpLogItem {
  id: string;
  tanggal?: string;
  timestamp?: string;
  petugas?: string;
  actorName?: string;
  metode?: 'WhatsApp' | 'Telepon' | 'Tatap Muka / Visit' | 'Email' | 'Zoom Konsultasi' | string;
  channel?: string;
  hasil?: string;
  ringkasanPembahasan?: string;
  tindakLanjut?: string;
  tindakLanjutBerikutnya?: string;
  jadwalFollowUpBerikutnya?: string;
  statusLeadSetelahnya?: LeadStatus | string;
  [key: string]: any;
}

export interface MarketingLead {
  id: string; // e.g. LEAD-2026-001
  namaLengkap: string;
  namaPanggilan?: string;
  noWhatsapp: string;
  email: string;
  kotaDomisili: string;
  provinsiDomisili?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  usia?: number;
  jenisKelamin: Gender;
  agama?: Religion;
  golonganDarah?: BloodType;
  statusPernikahan?: MaritalStatus;
  nikKtp?: string;
  noKk?: string;
  alamatLengkap?: string;
  
  // Klasifikasi & Minat
  kategoriKandidat: CandidateCategory;
  programMinat?: LeadInterestProgram | string;
  bidangMinat: LeadBidangKerja | string;
  sumberLead: LeadSource;
  
  // Kondisi Fisik & Kualifikasi Awal
  tinggiBadan?: number;
  beratBadan?: number;
  pendidikanTerakhir?: 'SMK' | 'SMA' | 'D3' | 'S1' | 'SMP' | string;
  jurusanPendidikan?: string;
  riwayatBahasaJepang?: 'Belum Pernah' | 'Pernah Belajar Mandiri' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'JFT-Basic' | string;
  riwayatPaspor?: 'ADA' | 'BELUM' | 'PROSES' | string;
  memilikiSim?: 'TIDAK' | 'SIM A' | 'SIM C' | 'SIM A & C' | string;
  kondisiFisikKhusus?: {
    tato?: 'TIDAK' | 'YA' | string;
    merokok?: 'TIDAK' | 'YA' | string;
    butaWarna?: 'TIDAK' | 'YA' | string;
    patahTulang?: 'TIDAK' | 'YA' | string;
    [key: string]: any;
  };

  // Staff Penanggung Jawab (PIC) & Status Funnel
  assignedStaff?: string; // e.g. "Beno Ryan"
  assignedStaffEmail?: string;
  picMarketingStaff?: string;
  statusLead: LeadStatus;
  tahapFollowUp?: string;
  tanggalMasukLead?: string;
  
  // Pembayaran Booking / DP Registrasi
  statusPembayaranBooking?: 'LUNAS' | 'DP' | 'BELUM' | string;
  nominalBookingFee?: number;
  metodePembayaran?: 'Transfer BCA' | 'Transfer Mandiri' | 'QRIS' | 'Tunai di Kantor' | string;
  buktiTransferUrl?: string;

  // Data Orang Tua & Konseling
  namaAyah?: string;
  namaIbu?: string;
  noHpOrangTua?: string;
  pekerjaanOrangTua?: string;
  alamatOrangTua?: string;
  catatanKonsultasi?: string;
  catatanKonselingAwal?: string;
  riwayatFollowUp?: FollowUpLogItem[];
  followUpLogs?: FollowUpLogItem[];
  
  // Status Integrasi ke Seluruh Sistem
  integratedToAdmin1?: boolean;
  integratedToAdmin2?: boolean;
  terintegrasiKeAdmin1?: boolean;
  integratedStudentId?: string;
  siswaId?: string;
  targetPortal?: 'ADMIN_SISWA' | 'ADMIN_DOC';
  integratedAt?: string;
  tanggalIntegrasi?: string;
  
  createdAt?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface MarketingStaff {
  id: string;
  nama: string;
  email: string;
  noHp: string;
  roleMarketing: 'Marketing Manager / Head' | 'Digital Marketer' | 'Telemarketer' | 'Field Acquisition' | 'Counselor';
  targetBulanan: number;
  totalClosing: number;
  totalLeadsHandled: number;
  status: 'AKTIF' | 'NONAKTIF';
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface MarketingDashboardStats {
  totalLeads: number;
  totalDihubungi: number;
  totalKonsultasi: number;
  totalDealIntegrated: number;
  totalBatal: number;
  totalOmzetBookingFee: number;
  closingRatePercent: number;
  channelBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
}

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

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
