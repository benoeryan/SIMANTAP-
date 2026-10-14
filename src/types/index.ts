export type Gender = 'Laki-laki' | 'Perempuan';
export type Religion = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu' | string;
export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'TIDAK TAHU' | string;
export type MaritalStatus = 'Lajang' | 'Menikah' | 'Duda/Janda' | string;
export type HealthStatus = 'FIT' | 'UNFIT' | 'PENDING' | string;
export type JobType = 'Wiraswasta' | 'Karyawan Tetap' | 'Pensiunan' | 'PNS' | 'Lainnya' | string;
export type ProgramOption = 'Reguler 100%' | 'DT 100%' | 'DT 50%' | 'DP 50%' | 'DP 30%' | string;

// Kategori Candidate Classification (Standardized for CRM & Portal Routing)
export type CandidateCategory =
  | 'SISWA IJEF - Offline'
  | 'SISWA IJEF - Online'
  | 'SISWA NON IJEF'
  | 'SISWA NON IJEF (New Comer)'
  | 'SISWA MITRA / NON IJEF'
  | 'MATCHING JOB - Engineering / Gijinkoku'
  | 'MATCHING JOB - Ex-Magang / Ex-Trainee'
  | string;

export type AdminPortalCategoryMode = 'MARKETING_PORTAL' | 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL';

export interface MitraOrganization {
  id: string;
  namaMitra: string;
  kodeMitra: string;
  kategoriMitra: 'LPK Daerah / Sending Partner' | 'TSK / Kumiai Partner (Jepang)' | 'TSK Partner (Jepang)' | 'Sub-Agency / Penyalur' | 'Perusahaan Penerima (Jepang)';
  penanggungJawab: string;
  email: string;
  noHp: string;
  kotaDomisili: string;
  alamatLengkap: string;
  statusKemitraan: 'Aktif' | 'Verifikasi' | 'Nonaktif';
  totalSiswaBinaan?: number;
  catatanKemitraan?: string;
}

export interface StudentDocuments {
  pasFoto?: string;
  cv?: string;
  ijazah?: string;
  skck?: string;
  ktpSiswa?: string;
  sim?: string;
  ktpOrangTua?: string;
  kartuKeluarga?: string;
  npwp?: string;
  paspor?: string;
  pasPhoto3x4?: string;
  sertifikatBahasaJepang?: string;
  sertifikatJft?: string;
  videoScreenRecordingJft?: string;
  sertifikatSsw?: string;
  videoScreenRecordingSsw?: string;
  sertifikatSsw2Kaigo?: string;
  videoScreenRecordingSsw2Kaigo?: string;
  videoJikoshoukai?: string;
  cvRirekishoDoc?: string;
  sertifikatSswKaigoBahasa?: string;
  sertifikatSswKaigoSkill?: string;
  sertifikatSswOtaff?: string;
  ktp?: any;
  kk?: any;
  pasfoto?: any;
  sertifikat?: any;
  sertifikatNihongo?: any;
  [key: string]: any;
}

export interface CalonSiswa {
  id: string;
  namaLengkap: string;
  noHp: string;
  email: string; // Locked from CRM
  kategoriKandidat: CandidateCategory; // Locked from CRM
  kewarganegaraan: string;
  noKtp: string;
  noKk: string;
  alamatDomisili: string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Religion;
  jenisKelamin: Gender;
  golonganDarah: BloodType;
  statusPerkawinan: MaritalStatus;
  umur?: number;
  
  // Data Keluarga
  namaAyah?: string;
  pekerjaanAyah?: string;
  ktpNpwpAyah?: string;
  namaIbu?: string;
  pekerjaanIbu?: string;
  ktpNpwpIbu?: string;

  // Optional profile compatibility fields
  programMinat?: string;
  namaKatakana?: string;
  namaPanggilan?: string;
  tempatTanggalLahir?: string;
  tinggiBadan?: number;
  beratBadan?: number;
  whatsapp?: string;
  alamatKtp?: string;
  memilikiPaspor?: string;
  tato?: 'TIDAK' | 'YA' | boolean | string;
  hobiMinat?: string | string[] | any;
  kelebihan?: string | string[] | any;
  kekurangan?: string | string[] | any;
  butaWarna?: 'TIDAK' | 'YA' | boolean | string;
  merokok?: 'TIDAK' | 'YA' | boolean | string;
  minumAlkohol?: 'TIDAK' | 'YA' | boolean | string;
  memilikiTato?: 'TIDAK' | 'YA' | boolean | string;
  memilikiSim?: 'TIDAK' | 'YA' | boolean | string;
  pernahKeJepang?: 'TIDAK' | 'YA' | boolean | string;
  riwayatPendidikan?: EducationHistory[];
  dataKeluarga?: FamilyMemberItem[];

  // File Upload Status
  berkasDokumen?: StudentDocuments;
  statusPendaftaran: 'Draft' | 'Terdaftar' | 'Terverifikasi' | 'Diterima' | 'Ditolak' | string;
  createdAt: string;

  // Data Source & Status Flags
  isDummy?: boolean;
  isFirestoreDoc?: boolean;
  source?: 'firebase' | 'dummy' | string;

  [key: string]: any;
}

// ==========================================
// CV-PORTAL & RIREKISHO (JAPANESE CV) TYPES
// ==========================================

export interface EducationHistory {
  id?: string;
  jenjang?: string;
  namaSekolah?: string;
  namaInstitusi?: string;
  jurusan?: string;
  bulanTahunMasuk?: string; // e.g. "2018-06"
  bulanTahunLulus?: string; // e.g. "2021-05"
  tahunMasuk?: string;
  tahunLulus?: string;
  [key: string]: any;
}

export interface WorkExperience {
  id?: string;
  namaPerusahaan?: string;
  posisiJabatan?: string;
  lokasi?: string; // Indonesia / Jepang (Prefektur)
  bulanTahunMasuk?: string;
  bulanTahunLulus?: string;
  tahunMasuk?: string;
  tahunLulus?: string;
  deskripsiTugas?: string;
  bidangPekerjaan?: string;
  [key: string]: any;
}

export type JLPTLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'JFT-Basic' | 'Belum Sertifikasi';

export interface FamilyMemberItem {
  id?: string;
  namaLengkap?: string;
  hubungan?: string;
  usia?: string | number;
  pekerjaan?: string;
  gajiPerBulan?: string;
  tinggalBersama?: 'YA' | 'TIDAK' | '' | boolean;
  [key: string]: any;
}

export interface DetailedWorkExperienceItem {
  id?: string;
  namaPerusahaan?: string;
  bidangPekerjaan?: string;
  tanggalMasuk?: string;
  tanggalKeluar?: string;
  statusPekerja?: string;
  uraianPekerjaan?: string;
  [key: string]: any;
}

export interface CandidateDocumentsUpload {
  pasPhoto3x4?: string | string[];
  sertifikatBahasaJepang?: string | string[];
  videoScreenRecordingJft?: string | string[];
  sertifikatSsw?: string | string[];
  videoScreenRecordingSsw?: string | string[];
  sertifikatSsw2Kaigo?: string | string[];
  videoScreenRecordingSsw2Kaigo?: string | string[];
  videoJikoshoukai?: string | string[];
  cvRirekishoDoc?: string | string[];
  ijazah?: string | string[];
  sertifikatSenmonkyuu?: string | string[];
  sertifikatSelesaiMagang?: string | string[];
  dokumenSim?: string | string[];
  [key: string]: any;
}

export interface CVRirekisho {
  id: string;
  siswaId: string;
  kodeReferensi?: string;
  kodeJob?: string;
  kategoriKandidat: CandidateCategory; // Locked from CRM
  bidangKerja?: string;
  namaLengkap: string;
  namaKatakana?: string;
  namaPanggilan?: string;
  email: string; // Locked from CRM
  noHp: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  tempatTanggalLahir?: string;
  umur?: number;
  alamatLengkap?: string;
  alamatDomisili?: string;
  jenisKelamin: Gender;
  agama?: string;
  golonganDarah?: string;
  tinggiBadan?: number | string;
  beratBadan?: number | string;
  dominanTangan?: 'Kanan' | 'Kiri' | '';
  butaWarna?: 'TIDAK' | 'YA' | boolean | string;
  merokok?: 'TIDAK' | 'YA' | boolean | string;
  minumAlkohol?: 'TIDAK' | 'YA' | boolean | string;
  memilikiTato?: 'TIDAK' | 'YA' | boolean | string;
  tato?: 'TIDAK' | 'YA' | boolean | string;
  penyakitBerat?: 'TIDAK' | 'YA' | boolean | string;
  alergi?: 'TIDAK' | 'YA' | boolean | string;
  hobi?: string | string[] | any;
  hobiMinat?: string | string[] | any;
  kelebihan?: string | string[] | any;
  kekurangan?: string | string[] | any;
  statusPernikahan?: MaritalStatus | string;
  memilikiSim?: 'TIDAK' | 'YA' | boolean | string;

  // Paspor & Pengalaman Jepang
  pernahKeJepang?: 'TIDAK' | 'YA' | boolean | string;
  memilikiPaspor?: 'TIDAK' | 'YA' | boolean | string;
  noPaspor?: string;
  pasFotoUrl?: string;
  fotoUrl?: string;

  // Data Keluarga
  dataKeluarga?: FamilyMemberItem[];

  // Riwayat Pendidikan
  pendidikanDetail?: {
    sd?: { namaSekolah?: string; tahunMasuk?: string; tahunLulus?: string; [key: string]: any };
    smp?: { namaSekolah?: string; tahunMasuk?: string; tahunLulus?: string; [key: string]: any };
    sma?: { namaSekolah?: string; tahunMasuk?: string; tahunLulus?: string; jurusan?: string; [key: string]: any };
    universitas?: { namaSekolah?: string; tahunMasuk?: string; tahunLulus?: string; jurusan?: string; [key: string]: any };
    [key: string]: any;
  };
  riwayatPendidikan: EducationHistory[];

  // Riwayat Pekerjaan
  pekerjaanDetail?: DetailedWorkExperienceItem[];
  riwayatPekerjaan: WorkExperience[];

  // Candidate Progress Status
  statusProgres?:
    | 'Nihongo check'
    | 'Belum Lolos Nihongo check'
    | 'Pending Nunggu Job'
    | 'Penjadwalan Interview'
    | 'On Proses'
    | 'Tidak Lolos Interview'
    | 'Status On Job (Selesai)'
    | 'Cancel'
    | 'Belum Ada'
    | 'Terjadwal Interview'
    | 'Lolos Interview (Naitei)'
    | 'Proses Visas/COE'
    | 'Proses Visa / COE';
  namaTSK?: string;
  detailProgres?: string;
  keteranganProgres?: string;
  namaPerusahaanJp?: string;
  lokasiPerusahaanJp?: string;
  jadwalKeberangkatan?: string;
  coeTerbit?: string;
  domisili?: string;
  bidangKerjaLainnya?: string;
  namaTulisTangan?: string;
  tanggalSubmit?: string;
  isBaru?: boolean;

  // Motivasi & PR (Indonesian & Custom Japanese Translation)
  kelebihanAnda?: string;
  kelebihanAndaJp?: string;
  kekuranganAnda?: string;
  kekuranganAndaJp?: string;
  alasanInginKeJepang?: string;
  alasanInginKeJepangJp?: string;
  alasanMelamarBidangIni?: string;
  alasanMelamarBidangIniJp?: string;
  alasanKaigo?: string;
  alasanKaigoJp?: string;
  impianMasaDepan?: string;
  lamaTinggalJepang?: string;
  lamaBelajarBahasaJepang?: string;
  shidouDoki?: string; // Alasan Melamar / Motivasi ke Jepang (Katakana/Kanji/Indo)
  prKeunggulanDiri?: string;
  prKeunggulanDiriJp?: string;
  hobiJp?: string;
  deskripsiMagang?: string;
  riwayatRelevan?: string;

  // Kontak Darurat
  kontakDarurat?: {
    noHpDarurat?: string;
    namaPemilikNoDarurat?: string;
    hubunganDenganPelamar?: string;
    [key: string]: any;
  };

  // Upload Dokumen
  dokumenUpload?: CandidateDocumentsUpload;

  // Japanese Skills & Certifications
  levelBahasaJepang?: JLPTLevel | string;
  skorJftAtauJlpt?: string;
  sertifikatSsw?: string[]; // e.g. ["Kaigo (Keperawatan)", "Pengolahan Makanan", "Manufaktur"]
  videoJikoshoukaiUrl?: string; // Link Video Perkenalan Diri YouTube/Drive

  statusCV?: 'Draft' | 'Terverifikasi Admin' | 'Siap Matching' | string;
  catatanPerusahaan?: string;
  updatedAt?: string;

  [key: string]: any;
}

export type KategoriDomisiliJob = 'Domestik (Jepang)' | 'Lokal (Indonesia)';
export type TingkatUrgensiJob = 'URGENT' | 'STANDART' | 'SLOW';

export interface JobPosting {
  id: string;
  kodeJob?: string;
  judulPekerjaan: string;
  posisiPekerjaan?: string;
  kategoriTarget: 'SISWA NON IJEF (New Comer)' | 'MATCHING JOB - Engineering / Gijinkoku' | 'MATCHING JOB - Ex-Magang / Ex-Trainee' | 'Semua Non-IJEF';
  kategoriDomisili?: KategoriDomisiliJob;
  urgensiJob?: TingkatUrgensiJob | string;
  perusahaanJepang: string;
  kumiaiRujukan: string;
  lokasiPrefektur: string; // e.g., "Tokyo", "Aichi", "Osaka", "Kanagawa"
  domisiliKerja?: string;
  jenisKelamin?: string; // e.g., "男 (Laki-laki)", "女 (Perempuan)", "男女 (Laki-laki & Perempuan)"
  gajiBulananYen: number;
  gajiString?: string;
  gajiEstimasiIdr: number;
  persyaratanJLPT: string;
  kualifikasi?: string;
  biayaProses?: string;
  keteranganTambahan?: string;
  tskSumberJob?: string;
  deskripsiPekerjaan: string;
  fasilitasAsrama: string;
  kuotaSiswa: number;
  statusJob: 'Aktif' | 'Tutup' | 'Lokal/Domestik (Jepang)' | string;
  statusAktif?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobJudul: string;
  perusahaanJepang: string;
  siswaId: string;
  studentId?: string;
  namaSiswa: string;
  emailSiswa: string;
  kategoriKandidat: CandidateCategory;
  tanggalLamar: string;
  statusLamaran: 'Seleksi Berkas Rirekisho' | 'Terjadwal Interview' | 'Terjadwal Interview Zoom' | 'Lolos Interview (Naitei)' | 'Lolos Naitei' | 'Ditolak' | 'Proses Visas/COE' | 'Proses Visa / COE' | 'Proses Matching Perusahaan' | 'Nihongo Check Admin Doc' | 'Nihongo Check Admin 2' | string;
  jadwalInterview?: string;
  linkZoomInterview?: string;
  metodeInterview?: 'ONLINE' | 'OFFLINE';
  tanggalInterview?: string;
  waktuInterview?: string;
  lokasiInterview?: string;
  linkInterviewZoom?: string;
  catatanPerusahaan?: string;
  namaMitra?: string;
  mitraId?: string;
  catatanMitra?: string;
  rekomendasiMitra?: string;
}

export interface HasilKesehatan {
  id: string;
  siswaId: string;
  namaSiswa?: string;

  // Tahapan 1: Pengukuran Fisik & Antropometri
  tinggiBadan?: number; // cm
  beratBadan?: number; // kg
  bmiIndex?: number;
  tekananDarah?: string; // mmHg e.g. "120/80"
  denyutNadi?: number; // bpm
  butaWarna?: string | boolean;
  visusMataKiri?: string; // e.g. "6/6"
  visusMataKanan?: string; // e.g. "6/6"

  // Tahapan 2: Tes Ketahanan & Fisik Luar
  tesPushUp?: number; // reps / menit
  tesSitUp?: number; // reps / menit
  tesAngkatBeban?: 'Lulus (20kg)' | 'Tidak Lulus' | 'Belum Tes' | string;
  tesKeseimbangan?: 'Normal' | 'Kurang Seimbang' | 'Belum Tes' | string;

  // Tahapan 3: Anamnesis 14 Indikator Medis
  riwayatPenyakitSerius?: string | boolean;
  pengobatanRutin?: string;
  riwayatOperasi?: string;
  riwayatTbc?: string;
  riwayatHepatitis?: string;
  penyakitAsma?: string;
  penyakitOrganDalam?: string;
  kecelakaanParah?: string;
  perokokAktif?: string;
  pecanduAlkohol?: string;
  obatObatanTerlarang?: string;
  gangguanJiwaStress?: string;
  masalahTulangSendi?: string;
  kepemilikanTato?: string;

  // Tahapan 4: Pemeriksaan Laboratorium & Radiologi
  hasilRontgenParu?: 'Normal / Jernih' | 'Bercak / Suspek TBC' | 'Belum Tes' | string;
  hasilHbsAg?: 'Non-Reaktif (Bebas Hep B)' | 'Reaktif' | 'Belum Tes' | string;
  hasilTesUrine?: 'Bebas Narkoba (Negatif)' | 'Positif' | 'Belum Tes' | string;
  metodeProsedurTest?: string;

  // Optional legacy fields
  namaKlinik?: string;
  tanggalMCU?: string;
  catatanMedis?: string;
  faskesPemeriksa?: string;

  // Tahapan 5: Keputusan Evaluasi Klinis Dokter
  statusFit?: HealthStatus;
  catatanDokter?: string;
  evaluatorName?: string;
  updatedAt?: string;

  [key: string]: any;
}

export interface DiscQuestionChoice {
  id: string;
  text: string;
  mostTrait: 'D' | 'I' | 'S' | 'C' | 'N'; // N = Neutral
  leastTrait: 'D' | 'I' | 'S' | 'C' | 'N';
}

export interface DiscQuestionSet {
  setNumber: number;
  choices: DiscQuestionChoice[];
}

export interface DiscUserAnswer {
  setNumber: number;
  mostChoiceId: string;
  leastChoiceId: string;
}

export interface AsesmenDisc {
  id: string;
  siswaId: string;
  namaSiswa?: string;
  scoreD?: number;
  scoreI?: number;
  scoreS?: number;
  scoreC?: number;
  skorD?: number;
  skorI?: number;
  skorS?: number;
  skorC?: number;
  dominantType?: 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance' | string;
  dominantTrait?: string;
  analisisKarakter?: string;
  secondaryType?: string;
  description?: string;
  userAnswers?: Record<number, { most: string; least: string }> | any;
  createdAt?: string;

  [key: string]: any;
}

export interface PsikotesQuestion {
  id: number;
  category: 'Analogi Kata' | 'Logika Matematika' | 'Penalaran Spasial & Abstrak' | 'Penalaran Verbal';
  question: string;
  options: { key: 'A' | 'B' | 'C' | 'D' | 'E'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation?: string;
}

export interface AsesmenPsikotes {
  id: string;
  siswaId: string;
  namaSiswa?: string;
  totalCorrect?: number;
  totalQuestions?: number;
  scorePercentage?: number;
  skorTotal?: number;
  skorLogika?: number;
  skorKuantitatif?: number;
  skorVerbal?: number;
  skorKetelitian?: number;
  skorKecermatan?: number;
  skorKepribadian?: number;
  statusKelulusan?: 'LULUS' | 'TIDAK LULUS' | string;
  categoryBreakdown?: {
    analogiKata?: number;
    logikaMatematika?: number;
    penalaranSpasial?: number;
    penalaranVerbal?: number;
    [key: string]: any;
  };
  userAnswers?: Record<number, string> | any;
  createdAt?: string;

  [key: string]: any;
}

export interface ApprovalStepLog {
  stage: 'PEMOHON' | 'ADMIN' | 'USER_MANAGER' | 'GENERAL_MANAGER';
  actorName: string;
  role: string;
  date: string;
  status: 'DISETUJUI' | 'DITOLAK' | 'MENUNGGU';
  notes?: string;
}

export interface AplikasiDukunganDana {
  id: string;
  siswaId: string;
  namaSiswa: string;

  // Integrated Job Selection Details
  jobId?: string;
  kodeJob?: string;
  judulJob?: string;
  perusahaanJepang?: string;
  biayaJobDetail?: string;

  // Data Penjamin (Guarantor)
  namaPenjamin: string;
  ktpPenjamin: string;
  npwpPenjamin: string;
  pekerjaanPenjamin: JobType;
  hubunganPenjamin: 'Orang Tua' | 'Wali' | 'Kerabat' | 'Suami/Istri';
  alamatPenjamin: string;
  noHpPenjamin: string;

  // Skema & Simulasi
  programOption: ProgramOption;
  biayaTotal: number;
  uangMukaDp: number;
  plafondPinjaman: number;
  tenorBulan: number;
  angsuranPerBulan: number;
  tanggalPengajuan: string;
  
  // Legacy / Aliased skema fields
  skemaPilihan?: any;
  pilihanTenor?: number;
  nominalDP?: number;
  nominalPinjaman?: number;
  dokumenPendukung?: any;
  createdAt?: string;

  // Multi-Level Approval Hierarchy: Siswa/Pemohon -> Admin -> User Manager -> General Manager
  statusPersetujuan: 'DRAFT' | 'PENGAJUAN' | 'VERIFIKASI_ADMIN' | 'APPROVAL_MANAGER' | 'DISETUJUI' | 'DITOLAK';
  currentApprovalStage?: 'PEMOHON' | 'ADMIN' | 'USER_MANAGER' | 'GENERAL_MANAGER' | 'COMPLETED' | 'REJECTED';
  catatanApproval?: string;
  approvalHistory?: ApprovalStepLog[];

  // Optional Document Editing & Formatting Fields
  nomorRegistrasi?: string;
  kopNamaLpk?: string;
  kopSubJudul?: string;
  kopAlamat?: string;
  judulForm?: string;
  teksKetentuan?: string;
  penandatangan1Jabatan?: string;
  penandatangan2Jabatan?: string;
  namaFinance?: string;

  // LPK Training Financing Specific Fields (Admin 1 Mekanisme LPK)
  paketPelatihanId?: string;
  namaPaketPelatihan?: string;
  durasiPelatihanBulan?: number;
  skemaPembayaranPelatihan?: string;
  skemaLabel?: string;
  diskonPelatihan?: number;
  pokokCicilan?: number;
  persentaseBunga?: number;
  nominalBunga?: number;
  totalKewajibanCicilan?: number;
  totalBiayaDanBunga?: number;
  komponenBiayaPelatihan?: {
    key: string;
    label: string;
    nominal: number;
    persentase?: number;
    keterangan: string;
  }[];
  jadwalTerminPelatihan?: {
    terminKe: number;
    labelTermin: string;
    jadwalWaktu: string;
    persentase: number;
    pokokNominal?: number;
    bungaNominal?: number;
    nominal: number;
    sisaBiaya: number;
    keterangan: string;
    statusBayar: 'LUNAS' | 'PROSES' | 'BELUM';
  }[];
  metodePembayaranLpk?: 'TRANSFER_LPK' | 'VA_SISWA' | 'KASIR_LPK';
  rekeningTujuanLpk?: string;

  // Departure Financing Specific Fields (Admin 2 Mekanisme Keberangkatan: DANA TALANG 100% / DANA MANDIRI)
  skemaKeberangkatan?: 'DANA_TALANG_100' | 'DANA_MANDIRI';
  biayaKeberangkatan?: number;
  angsuranPerBulanYen?: number;
  estimasiGajiYen?: number;
  sisaGajiBersihYen?: number;
  komponenBillingKeberangkatan?: {
    key: string;
    label: string;
    nominal: number;
    keterangan: string;
  }[];
  jadwalTerminKeberangkatan?: {
    terminKe: number;
    labelTermin: string;
    jadwalWaktu: string;
    persentase: number;
    nominal: number;
    sisaBiaya: number;
    statusBayar: 'LUNAS' | 'PROSES' | 'BELUM';
    keterangan: string;
  }[];
  rincianCicilanJepang?: {
    bulanKe: number;
    angsuranIdr: number;
    angsuranYen: number;
    sisaTalanganIdr: number;
    keterangan: string;
  }[];
}

export interface PasalItem {
  id: string;
  judul: string;
  isi: string;
}

export interface SuratPerjanjian {
  id: string;
  siswaId: string;
  nomorSurat: string;
  tanggalSurat: string;
  pihakPertamaNama: string;
  pihakPertamaJabatan: string;
  pihakPertamaInstansi?: string;
  pihakKeduaNama: string;
  pihakKeduaKtp: string;
  pihakKeduaAlamat: string;
  pihakKeduaNoHp: string;
  pihakKeduaEmail: string;
  penjaminNama: string;
  penjaminKtp: string;
  programPelatihan: string;
  durasiPelatihanBulan: number;
  garansiJobMatching: boolean;
  statusPersetujuan: 'DRAFT' | 'DITANDATANGANI' | 'SAH';
  // Additional Draft Document Editing Fields
  kopNamaLpk?: string;
  kopSubJudul?: string;
  kopAlamat?: string;
  judulSurat?: string;
  teksPembuka?: string;
  teksKesepakatan?: string;
  pasalList?: PasalItem[];
}

export interface BatchRegistration {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  quota: number;
  registeredCount: number;
  status: 'OPEN' | 'CLOSED' | 'FULL';
}

export type AdminRole =
  | 'SuperAdmin'
  | 'Admin Doc (CV Portal & Matching)'
  | 'Admin Siswa (SIM-SB IJEF)'
  | 'Admin 2 (CV Portal & Matching)'
  | 'Admin 1 (SIM-SB IJEF)'
  | 'Marketing Manager'
  | 'Staff Marketing & Konselor'
  | 'Digital Marketer & Ads'
  | 'Telemarketing & CS'
  | 'Field Acquisition & Referral'
  | 'Content Creator & Media Promosi'
  | 'HR Legal'
  | 'Dokter'
  | 'Finance'
  | 'Admin Matching'
  | 'Verifikator CV JIS'
  | 'Sensei / Instruktur'
  | 'Koordinator Interview'
  | 'TSK Partner'
  | 'Kumiai Partner'
  | 'Mitra LPK'
  | 'Siswa'
  | string;

export interface RoleAuditLog {
  id: string;
  action: 'APPOINT_SUPER_ADMIN' | 'CREATE_ADMIN' | 'UPDATE_ROLE' | 'TOGGLE_STATUS' | 'RESET_PASSWORD' | 'DELETE_ACCOUNT';
  actorName: string;
  actorRole: string;
  targetUserName: string;
  targetUserEmail: string;
  assignedRole: string;
  timestamp: string;
  notes?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  department?: string;
  portalAccess?: 'ADMIN_1_IJEF' | 'ADMIN_2_CV_PORTAL' | 'ALL_PORTALS' | 'MITRA_PORTAL' | 'STUDENT_PORTAL' | 'MARKETING_PORTAL';
  status: 'AKTIF' | 'NONAKTIF' | 'Aktif' | 'Nonaktif' | 'SUSPENDED';
  lastLogin?: string;
  phone?: string;
  isSuperAdmin?: boolean;
  passwordHint?: string;
  password?: string;
  picName?: string;
  mitraType?: string;
  address?: string;
  kota?: string;
  kuotaSiswa?: number;
  totalSiswaBinaan?: number;
  createdAt?: string;
  permissions?: string[];
}

export interface ApprovalRule {
  id: string;
  targetWorkflow: 'Pencairan Dana Talang' | 'Pengesahan Kontrak';
  stageName: string;
  requiredRole: AdminRole;
  order: number;
  autoNotify: boolean;
}

// ==========================================
// MITRA APPROVAL SUBMISSION & AUDIT TYPES
// ==========================================
export type MitraSubmissionType = 'REGISTRASI_SISWA' | 'TAMBAH_JOB_MITRA' | 'LAMAR_JOB_SISWA';
export type MitraApprovalStatus = 'MENUNGGU_APPROVAL' | 'DISETUJUI' | 'DITOLAK' | 'PERLU_REVISI';

export interface MitraApprovalStepLog {
  stage: string;
  actorName: string;
  actorRole: string;
  date: string;
  status: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'PERLU_REVISI';
  notes?: string;
}

export interface MitraApprovalSubmission {
  id?: string;
  submissionType: MitraSubmissionType;
  mitraId: string;
  mitraName: string;
  mitraEmail?: string;
  mitraPhone?: string;
  email?: string;
  payload?: any;
  targetId: string; // ID Siswa / ID Job / ID JobApplication
  targetTitle: string; // e.g. Nama Siswa / Judul Lowongan Kerja / Nama Siswa + Judul Job
  title?: string;
  createdAt?: string;
  description?: string;
  approvalNotes?: string;
  targetCategory?: string;
  targetDetails?: any;
  submittedAt?: string;
  status: MitraApprovalStatus | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reviewedBy?: string;
  reviewerRole?: string;
  reviewedAt?: string;
  catatanApproval?: string;
  catatanRevisi?: string;
  approvalHistory?: MitraApprovalStepLog[];
}

export interface DiscRoleMapping {
  id: string;
  jobSector: string;
  idealDisc: 'Dominance' | 'Influence' | 'Steadiness' | 'Compliance';
  minScorePercent: number;
}

export interface FirebaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string;
  activeDomain: 'all' | 'mitra' | 'students' | 'admins' | 'jobs' | null;
  counts: {
    mitra: number;
    students: number;
    admins: number;
    jobs: number;
    leads: number;
  };
  lastMessage: string | null;
}

export * from './crm';
import { MarketingStaff } from './crm';

export interface MasterSettings {
  baseProgramCost: number;
  dt100DpPercent: number;
  dt50DpPercent: number;
  dp30DpPercent: number;
  adminFeePercent: number;
  tenorOptions: number[];
  psikotesPassingThresholdPercent: number;
  psikotesPassingScore: number;
  defaultEvaluatorName: string;
  discRoleMappings: DiscRoleMapping[];
  batches: BatchRegistration[];
  approvalRules: ApprovalRule[];
  adminUsers: AdminUser[];
  marketingStaff?: MarketingStaff[];
  roleAuditLogs?: RoleAuditLog[];
  updatedAt?: string;
}
