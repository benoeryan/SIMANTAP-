export interface HealthQuestionConfig {
  key: string;
  label: string;
  category: string;
  options: string[];
}

export interface HealthProcedureStage {
  stageNumber: number;
  title: string;
  code: string;
  description: string;
  methodSummary: string;
  requiredFor: string;
  items: string[];
}

export const HEALTH_PROCEDURE_STAGES: HealthProcedureStage[] = [
  {
    stageNumber: 1,
    title: 'Pengukuran Fisik & Antropometri',
    code: 'STAGE-1-ANTROPOMETRI',
    description: 'Pemeriksaan dimensi postur tubuh, Indeks Massa Tubuh (IMT), dan tanda vital awal.',
    methodSummary: 'Pengukuran tinggi minimal 158cm (pria) / 150cm (wanita), tekanan darah 110-130/70-80 mmHg, dan perhitungan BMI ideal (18.5 - 24.9).',
    requiredFor: 'Syarat Standar LPK IJEF & Industri Jepang (Kaigo & Manufaktur)',
    items: ['Tinggi & Berat Badan', 'Kalkulasi IMT / BMI Index', 'Tekanan Darah & Denyut Nadi', 'Pemeriksaan Postur Tulang Belakang']
  },
  {
    stageNumber: 2,
    title: 'Tes Penglihatan & Ketahanan Fisik Luar',
    code: 'STAGE-2-SENSORY-FITNESS',
    description: 'Pengujian tajam penglihatan, Ishihara buta warna, serta tes stamina fisik dasar.',
    methodSummary: 'Tes Ishihara 14 Plat, Visus Mata Kanan-Kiri min 6/6 (boleh kacamata tipis), Push-up 1 Menit (min 25x), Sit-up 1 Menit (min 25x), & Angkat Beban 20kg.',
    requiredFor: 'Kualifikasi Kerja Fisik LPK & Industri Luar Negeri',
    items: ['Tes Buta Warna Ishihara', 'Tes Visus Mata Kiri/Kanan', 'Push-Up 1 Menit', 'Sit-Up 1 Menit', 'Tes Angkat Beban 20kg', 'Tes Keseimbangan']
  },
  {
    stageNumber: 3,
    title: 'Anamnesis 14 Indikator Medis',
    code: 'STAGE-3-ANAMNESIS-14P',
    description: 'Skrining mandiri & wawancara 14 riwayat medis kritis calon peserta.',
    methodSummary: 'Pengisian 14 indikator penyakit kronis, riwayat TBC, Hepatitis, Asma, Operasi, Narkoba, Tato, dan HNP.',
    requiredFor: 'Syarat Mutlak Bebas Penyakit Menular & Kronis',
    items: ['Riwayat TBC & Paru', 'Riwayat Hepatitis B/C', 'Pengobatan & Operasi', 'Pemeriksaan Bebas Tato & Bekas Hapus']
  },
  {
    stageNumber: 4,
    title: 'Pemeriksaan Laboratorium & Radiologi',
    code: 'STAGE-4-LAB-RADIOLOGY',
    description: 'Pemeriksaan radiologi Rontgen Thorax, Serologi HBsAg, dan Skrining Urine 5 Parameter.',
    methodSummary: 'Foto Thorax Rontgen Paru, Tes Darah Serologi Anti-HBs/HBsAg, dan Urine Screen Narkoba (AMP, MET, THC, MOP, BZO).',
    requiredFor: 'Rekam Medis Klinik / Rumah Sakit Rujukan',
    items: ['Rontgen Thorax Paru-Paru', 'Skrining Serologi HBsAg', 'Tes Urine Narkoba 5 Param']
  },
  {
    stageNumber: 5,
    title: 'Keputusan Evaluasi Dokter & Sertifikat Fit-To-Work',
    code: 'STAGE-5-CLINICAL-VERDICT',
    description: 'Verifikasi akhir oleh Dokter Okupasi (Sp.OK) / Tim Dokter Rujukan IJEF CORP.',
    methodSummary: 'Penerbitan Surat Keterangan Sehat & Kelaikan Medis (FIT TO WORK / UNFIT) yang tersinkronisasi ke database Firestore & CRM.',
    requiredFor: 'Penetapan Kelulusan Seleksi Tahap Medis',
    items: ['Evaluasi Diagnosa Klinis', 'Catatan Rekomendasi Dokter', 'Penerbitan Sertifikat FIT TO WORK']
  }
];

export const HEALTH_QUESTIONS: HealthQuestionConfig[] = [
  {
    key: 'riwayatPenyakitSerius',
    label: 'Riwayat Penyakit Serius',
    category: 'Riwayat Medis',
    options: ['Tidak Ada', 'Ada (Pernah dirawat/kronis)', 'Dalam Penanganan']
  },
  {
    key: 'pengobatanRutin',
    label: 'Pengobatan Rutin saat Ini',
    category: 'Medikasi',
    options: ['Tidak Ada', 'Ada Konsumsi Obat Rutin']
  },
  {
    key: 'riwayatOperasi',
    label: 'Riwayat Operasi / Tindakan Bedah',
    category: 'Tindakan Medis',
    options: ['Belum Pernah', 'Pernah Operasi Kecil', 'Pernah Operasi Besar (Mayor)']
  },
  {
    key: 'riwayatTbc',
    label: 'Riwayat TBC / Paru-paru',
    category: 'Penyakit Menular / Paru',
    options: ['Tidak Ada', 'Pernah (Sudah Sembuh Total)', 'Sedang Pengobatan']
  },
  {
    key: 'riwayatHepatitis',
    label: 'Riwayat Hepatitis A / B / C',
    category: 'Penyakit Menular / Hati',
    options: ['Bebas Hepatitis', 'Pernah Hepatitis A', 'Hepatitis B Reaktif', 'Hepatitis C']
  },
  {
    key: 'penyakitAsma',
    label: 'Penyakit Asma / Sesak Napas',
    category: 'Sistem Pernapasan',
    options: ['Tidak Ada', 'Asma Ringan (Kambuh Cuaca)', 'Asma Berat / Rutin Inhaler']
  },
  {
    key: 'penyakitOrganDalam',
    label: 'Penyakit Organ Dalam (Jantung, Ginjal, Lambung, Liver)',
    category: 'Organ Dalam',
    options: ['Tidak Ada', 'Maag/Asam Lambung', 'Kelainan Jantung/Ginjal']
  },
  {
    key: 'kecelakaanParah',
    label: 'Kecelakaan Parah / Patah Tulang',
    category: 'Trauma & Fisik',
    options: ['Tidak Pernah', 'Pernah (Sembuh Tanpa Pen)', 'Pernah (Menggunakan Pen / Cacat)']
  },
  {
    key: 'perokokAktif',
    label: 'Perokok Aktif',
    category: 'Gaya Hidup',
    options: ['Bukan Perokok', 'Perokok Ringan (<10 batang/hari)', 'Perokok Berat (>1 bungkus/hari)']
  },
  {
    key: 'pecanduAlkohol',
    label: 'Konsumsi Alkohol / Pecandu',
    category: 'Gaya Hidup',
    options: ['Tidak Pernah', 'Kadang-kadang', 'Rutin / Pernah Ketergantungan']
  },
  {
    key: 'obatObatanTerlarang',
    label: 'Penggunaan Narkoba / Obat-obatan Terlarang',
    category: 'Gaya Hidup',
    options: ['Bebas Narkoba (Sama Sekali Tidak)', 'Pernah Menggunakan di Masa Lalu']
  },
  {
    key: 'gangguanJiwaStress',
    label: 'Riwayat Gangguan Jiwa / Depresi / Stress Berat',
    category: 'Kesehatan Mental',
    options: ['Tidak Ada', 'Pernah Stress / Depresi Ringan', 'Dalam Perawatan Psikiater']
  },
  {
    key: 'masalahTulangSendi',
    label: 'Masalah Tulang / Sendi / Saraf Terjepit (HNP)',
    category: 'Muskuloskeletal',
    options: ['Normal / Sehat', 'Nyeri Ringan Kadang Kambuh', 'HNP / Masalah Tulang Belakang']
  },
  {
    key: 'kepemilikanTato',
    label: 'Kepemilikan Tato / Bekas Tato di Tubuh',
    category: 'Pemeriksaan Fisik Luar',
    options: ['Tidak Ada Tato', 'Tato Tersembunyi (Tertutup Baju)', 'Tato Terlihat (Tangan/Leher/Wajah)', 'Bekas Hapus Tato']
  }
];
