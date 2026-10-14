import { ProgramOption } from '../types';

export interface FinancingSimulation {
  programOption: ProgramOption;
  biayaTotal: number;
  uangMukaDp: number;
  pokokPinjaman?: number;
  persentaseBunga?: number;
  nominalBunga?: number;
  totalKewajibanCicilan?: number;
  totalBiayaDanBunga?: number;
  plafondPinjaman: number;
  tenorBulan: number;
  angsuranPerBulan: number;
  rincianTenorTable: {
    bulanKe: number;
    angsuranPokok: number;
    bungaAdmin: number;
    totalAngsuran: number;
    sisaPlafond: number;
  }[];
}

export const BASE_PROGRAM_COST = 10000000; // Rp 10.000.000 standard LPK training cost

export interface TrainingComponentCost {
  key: string;
  label: string;
  nominal: number;
  persentase?: number;
  keterangan: string;
}

export interface TrainingProgramPackage {
  id: string;
  namaPaket: string;
  kategori: string;
  durasiBulan: number;
  jamPelajaran: number;
  biayaStandar: number;
  deskripsi: string;
  fasilitas: string[];
  komponenBiaya: TrainingComponentCost[];
}

export const TRAINING_PACKAGES_LPK: TrainingProgramPackage[] = [
  {
    id: 'REGULER_OFFLINE',
    namaPaket: 'Program Reguler Siswa Offline (Bahasa Jepang N5-N4 & Asrama)',
    kategori: 'Reguler Offline',
    durasiBulan: 5,
    jamPelajaran: 480,
    biayaStandar: 10000000,
    deskripsi: 'Pendidikan Bahasa Jepang intensif tatap muka (N5-N4), fasilitas asrama/mess, pembinaan fisik, mental, disiplin (FMD) & etika kerja Jepang.',
    fasilitas: [
      'Kelas Tatap Muka 480 Jam bersama Sensei Berpengalaman',
      'Fasilitas Asrama / Mess Pelatihan & Utilitas Selama Pendidikan',
      'Buku Modul Minna no Nihongo I & II, Buku Kanji, & Kamus Praktis',
      'Kaos Seragam & Atribut Diklat LPK IJEF CORP',
      'Tryout Evaluasi JFT-Basic A2 & JLPT Rutin Setiap Bulan',
      'Bimbingan Mental, Fisik, Disiplin (FMD) & Budaya Kerja Hou-Ren-So'
    ],
    komponenBiaya: [
      { key: 'pendaftaran', label: 'Biaya Registrasi & Administrasi Siswa', nominal: 500000, keterangan: 'Pendaftaran, ID Card Siswa, & Berkas Diklat' },
      { key: 'pendidikan', label: 'Biaya Pendidikan & Honor Sensei Pengajar', nominal: 5000000, keterangan: '480 Jam Tatap Muka & Bimbingan Bahasa' },
      { key: 'asrama', label: 'Akomodasi Asrama / Mess Pelatihan LPK', nominal: 2500000, keterangan: 'Fasilitas Kamar, Listrik, Air & Kebersihan' },
      { key: 'modul_seragam', label: 'Buku Modul, Kamus & Seragam Diklat', nominal: 800000, keterangan: 'Buku Minna no Nihongo, Kanji, & Kaos Diklat' },
      { key: 'tryout_sertifikat', label: 'Simulasi Tryout JFT-Basic & Ujian', nominal: 600000, keterangan: 'Simulasi CBT & Sertifikat Kelulusan LPK' },
      { key: 'pembinaan_fmd', label: 'Pembinaan Fisik, Mental & Disiplin (FMD)', nominal: 600000, keterangan: 'Instruktur Kedisiplinan & Etika Industri' }
    ]
  },
  {
    id: 'ONLINE_ELEARNING',
    namaPaket: 'Program Kelas Online / Daring E-Learning LPK (JFT-Basic A2)',
    kategori: 'Kelas Daring',
    durasiBulan: 3,
    jamPelajaran: 200,
    biayaStandar: 3000000,
    deskripsi: 'Pembelajaran jarak jauh interaktif via Live Zoom & LMS Portal Siswa, persiapan ujian JFT-Basic A2 fleksibel untuk calon siswa di luar kota.',
    fasilitas: [
      'Live Zoom Interaktif bersama Sensei LPK',
      'Akses Penuh Portal E-Learning LMS & Video Rekaman 24/7',
      'Pengiriman Paket Buku Modul & Materi ke Alamat Siswa',
      'Tryout Simulasi JFT-Basic A2 Online Terjadwal',
      'Sertifikat Resmi Pelatihan Bahasa Jepang dari LPK'
    ],
    komponenBiaya: [
      { key: 'pendaftaran', label: 'Biaya Registrasi & Akun LMS Siswa', nominal: 300000, keterangan: 'Akses User LMS & Registrasi Diklat' },
      { key: 'pendidikan', label: 'Biaya Pengajaran Daring / Live Class', nominal: 1800000, keterangan: 'Live Zoom & Bimbingan Pembelajaran' },
      { key: 'modul_seragam', label: 'Modul Fisik + Ongkos Kirim Buku', nominal: 500000, keterangan: 'Modul Bahasa, Flashcard, & Kamus' },
      { key: 'tryout_sertifikat', label: 'Simulasi Tryout Online & Sertifikat', nominal: 400000, keterangan: 'Platform CBT & Sertifikat Resmi' }
    ]
  },
  {
    id: 'PEMANTAPAN_SSW',
    namaPaket: 'Kelas Pemantapan SSW',
    kategori: 'Pemantapan Skill',
    durasiBulan: 2,
    jamPelajaran: 120,
    biayaStandar: 2500000,
    deskripsi: 'Bimbingan dan pendalaman materi teknis ujian keahlian spesifik Tokutei Ginou (Kaigo, Pengolahan Makanan, Pertanian, Manufaktur, dll.) serta simulasi soal Prometric.',
    fasilitas: [
      'Materi Khusus Bidang Keahlian Tokutei Ginou (SSW)',
      'Bank Soal Prometric & Pembahasan Soal Teknis Ujian Skill',
      'Bimbingan Praktik & Istilah Teknis Kerja Bidang SSW',
      'Pendampingan Registrasi Ujian Prometric di Indonesia',
      'Simulasi Tryout CBT Berbasis Komputer'
    ],
    komponenBiaya: [
      { key: 'pendaftaran', label: 'Biaya Pendaftaran & Administrasi', nominal: 300000, keterangan: 'Registrasi & Pendataan Bidang SSW' },
      { key: 'pendidikan', label: 'Biaya Bimbingan Teori & Teknis SSW', nominal: 1400000, keterangan: '120 Jam Pembahasan Materi & Praktik' },
      { key: 'modul_seragam', label: 'Modul Keahlian Spesifik & Bank Soal', nominal: 500000, keterangan: 'Buku Materi Bidang Kerja & Istilah Jepang' },
      { key: 'tryout_sertifikat', label: 'Simulasi Tryout CBT & Sertifikat', nominal: 300000, keterangan: 'Mock Exam Prometric & Evaluasi Kelulusan' }
    ]
  },
  {
    id: 'PEMANTAPAN_MENSETSU',
    namaPaket: 'Kelas Pemantapan Mensetsu',
    kategori: 'Interview Prep',
    durasiBulan: 1,
    jamPelajaran: 60,
    biayaStandar: 1000000,
    deskripsi: 'Pelatihan intensif simulasi wawancara kerja (Mensetsu) dengan User/Kumiai Jepang, pembuatan Jikoshoukai video, etika wawancara, dan revisi Rirekisho JIS.',
    fasilitas: [
      'Simulasi Wawancara (Mock Interview) dengan Native/Sensei',
      'Penyusunan Jikoshoukai & Video Pengenalan Diri Profesional',
      'Bedah Rirekisho JIS & Penyesuaian Pengalaman Kerja',
      'Pelatihan Etika & Tata Krama Wawancara Budaya Jepang',
      'Konsultasi Tanya-Jawab Khas User Perusahaan Jepang'
    ],
    komponenBiaya: [
      { key: 'pendaftaran', label: 'Biaya Pendaftaran & Validasi Berkas', nominal: 200000, keterangan: 'Registrasi & Review Profil Siswa' },
      { key: 'pendidikan', label: 'Pelatihan Interview Intensif & Kaiwa Bisnis', nominal: 500000, keterangan: 'Simulasi Tanya-Jawab & Bimbingan Mental' },
      { key: 'modul_seragam', label: 'Modul Panduan Wawancara & Video Profil', nominal: 200000, keterangan: 'Panduan Mensetsu & Recording Jikoshoukai' },
      { key: 'tryout_sertifikat', label: 'Simulasi Mock Interview User & Evaluasi', nominal: 100000, keterangan: 'Feedback Penilaian dari Tim Ahli' }
    ]
  }
];

export interface LpkPaymentSchemeConfig {
  id: string;
  label: string;
  deskripsi: string;
  dpPersen: number;
  bungaPersen: number;
  tenorDefaultBulan: number;
  isDanaTalang: boolean;
}

export const PAYMENT_SCHEMES_LPK: LpkPaymentSchemeConfig[] = [
  {
    id: 'CASH_LUNAS',
    label: '1. Lunas di Awal (Cash 100%)',
    deskripsi: 'Pembayaran lunas 100% saat registrasi awal tanpa bunga (Bunga 0%)',
    dpPersen: 100,
    bungaPersen: 0,
    tenorDefaultBulan: 0,
    isDanaTalang: false
  },
  {
    id: 'DT_100_6B',
    label: '2. Dana Talang 100% (DP Rp 0 - Cicilan LPK 6 Bulan)',
    deskripsi: 'Talangan penuh 100% tanpa uang muka, dicicil 6 bulan dengan bunga 16%',
    dpPersen: 0,
    bungaPersen: 16,
    tenorDefaultBulan: 6,
    isDanaTalang: true
  },
  {
    id: 'DT_50_5B',
    label: '3. Dana Talang 50% (DP 50% - Cicilan 50% 5 Bulan)',
    deskripsi: 'Uang Muka (DP) 50%, sisa talangan 50% dicicil 5 bulan dengan bunga 23%',
    dpPersen: 50,
    bungaPersen: 23,
    tenorDefaultBulan: 5,
    isDanaTalang: true
  },
  {
    id: 'BERTAHAP_50_3B',
    label: '4. Pembayaran Bertahap (DP 50% - Cicilan 50% LPK 3 Bulan)',
    deskripsi: 'Uang Muka (DP) 50%, sisa dicicil 3 bulan tanpa bunga (Bunga 0%)',
    dpPersen: 50,
    bungaPersen: 0,
    tenorDefaultBulan: 3,
    isDanaTalang: false
  },
  {
    id: 'BERTAHAP_30_6B',
    label: '5. Pembayaran Bertahap (DP 30% - Cicilan 70% LPK 6 Bulan)',
    deskripsi: 'Uang Muka (DP) 30%, sisa 70% dicicil 6 bulan dengan bunga 30%',
    dpPersen: 30,
    bungaPersen: 30,
    tenorDefaultBulan: 6,
    isDanaTalang: false
  }
];

export interface TrainingTermScheduleItem {
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
}

export interface TrainingFinancingCalculation {
  packageInfo: TrainingProgramPackage | null;
  biayaTotal: number;
  skemaPembayaran: string;
  skemaLabel: string;
  uangMukaDp: number;
  pokokCicilan: number;
  persentaseBunga: number;
  nominalBunga: number;
  totalKewajibanCicilan: number;
  totalBiayaDanBunga: number;
  sisaBiaya: number;
  diskonPotongan: number;
  tenorBulan: number;
  angsuranPerBulan: number;
  jadwalTermin: TrainingTermScheduleItem[];
  komponenBiaya: TrainingComponentCost[];
}

export function calculateTrainingFinancing(
  biayaTotalInput: number,
  skemaPembayaran: string,
  tenorPilihan?: number,
  packageId?: string
): TrainingFinancingCalculation {
  // 1. Resolve selected package
  let selectedPkg = TRAINING_PACKAGES_LPK.find((p) => p.id === packageId) || null;
  if (!selectedPkg && packageId) {
    if (packageId === 'REGULER_LPK') selectedPkg = TRAINING_PACKAGES_LPK[0];
    else if (packageId === 'INTENSIF_SSW') selectedPkg = TRAINING_PACKAGES_LPK[2];
    else if (packageId === 'FAST_TRACK') selectedPkg = TRAINING_PACKAGES_LPK[3];
  }
  if (!selectedPkg) {
    selectedPkg = TRAINING_PACKAGES_LPK[0];
  }

  const biayaTotal = biayaTotalInput > 0 ? biayaTotalInput : selectedPkg.biayaStandar;

  // 2. Proportional calculation for cost components
  const baseKomponen = selectedPkg.komponenBiaya;
  const baseTotal = baseKomponen.reduce((acc, k) => acc + k.nominal, 0) || 1;
  const komponenBiaya: TrainingComponentCost[] = baseKomponen.map((k) => {
    const ratio = k.nominal / baseTotal;
    const computedNominal = Math.round((biayaTotal * ratio) / 10000) * 10000;
    return {
      ...k,
      nominal: computedNominal,
      persentase: Math.round(ratio * 100)
    };
  });

  // 3. Resolve Scheme Parameters
  let skemaKey = skemaPembayaran;
  // Aliases normalization
  if (skemaPembayaran === 'Reguler 100%' || skemaPembayaran.includes('1.') || skemaPembayaran.includes('Cash 100%')) {
    skemaKey = 'CASH_LUNAS';
  } else if (skemaPembayaran === 'DT 100%' || skemaPembayaran === 'DT_PELATIHAN_100' || skemaPembayaran.includes('2.') || skemaPembayaran.includes('Dana Talang 100%')) {
    skemaKey = 'DT_100_6B';
  } else if (skemaPembayaran === 'DT 50%' || skemaPembayaran.includes('3.') || skemaPembayaran.includes('Dana Talang 50%')) {
    skemaKey = 'DT_50_5B';
  } else if (skemaPembayaran === 'TERMIN_2' || skemaPembayaran === 'DP 50%' || skemaPembayaran.includes('4.') || (skemaPembayaran.includes('Bertahap') && skemaPembayaran.includes('3 Bulan'))) {
    skemaKey = 'BERTAHAP_50_3B';
  } else if (skemaPembayaran === 'TERMIN_3' || skemaPembayaran === 'DT_PELATIHAN_30' || skemaPembayaran === 'DP 30%' || skemaPembayaran.includes('5.') || (skemaPembayaran.includes('Bertahap') && skemaPembayaran.includes('6 Bulan'))) {
    skemaKey = 'BERTAHAP_30_6B';
  }

  let skemaLabel = '1. Lunas di Awal (Cash 100%)';
  let uangMukaDp = 0;
  let pokokCicilan = 0;
  let persentaseBunga = 0;
  let nominalBunga = 0;
  let totalKewajibanCicilan = 0;
  let totalBiayaDanBunga = biayaTotal;
  let tenorBulan = 0;
  let angsuranPerBulan = 0;
  let diskonPotongan = 0;
  let jadwalTermin: TrainingTermScheduleItem[] = [];

  switch (skemaKey) {
    case 'CASH_LUNAS': {
      skemaLabel = '1. Lunas di Awal (Cash 100%) [Bunga 0%]';
      uangMukaDp = biayaTotal;
      pokokCicilan = 0;
      persentaseBunga = 0;
      nominalBunga = 0;
      totalKewajibanCicilan = 0;
      totalBiayaDanBunga = biayaTotal;
      tenorBulan = 0;
      angsuranPerBulan = 0;
      jadwalTermin = [
        {
          terminKe: 1,
          labelTermin: 'Pelunasan Penuh (100%)',
          jadwalWaktu: 'Saat Pendaftaran / Masuk Kelas',
          persentase: 100,
          pokokNominal: biayaTotal,
          bungaNominal: 0,
          nominal: biayaTotal,
          sisaBiaya: 0,
          keterangan: 'Pembayaran Lunas Sekaligus di Awal (Tanpa Bunga / Bunga 0%)',
          statusBayar: 'BELUM'
        }
      ];
      break;
    }

    case 'DT_100_6B': {
      // 2. Dana Talang 100% (DP Rp 0 - Cicilan LPK 6 Bulan) = bunga 16%
      skemaLabel = '2. Dana Talang 100% (DP Rp 0 - Cicilan LPK 6 Bulan) [Bunga 16%]';
      uangMukaDp = 0;
      pokokCicilan = biayaTotal;
      persentaseBunga = 16;
      nominalBunga = Math.round(pokokCicilan * 0.16);
      totalKewajibanCicilan = pokokCicilan + nominalBunga;
      totalBiayaDanBunga = uangMukaDp + totalKewajibanCicilan;
      tenorBulan = tenorPilihan && tenorPilihan > 0 ? tenorPilihan : 6;
      angsuranPerBulan = Math.round(totalKewajibanCicilan / tenorBulan);

      const pokokPerBulan = Math.round(pokokCicilan / tenorBulan);
      const bungaPerBulan = Math.round(nominalBunga / tenorBulan);

      jadwalTermin = [];
      let sisaKewajiban = totalKewajibanCicilan;

      for (let i = 1; i <= tenorBulan; i++) {
        const nominalBulanIni = i === tenorBulan ? sisaKewajiban : angsuranPerBulan;
        sisaKewajiban -= nominalBulanIni;
        jadwalTermin.push({
          terminKe: i,
          labelTermin: `Angsuran Bulan ke-${i}`,
          jadwalWaktu: `Bulan ke-${i} Masa Pembelajaran / Akad LPK`,
          persentase: Math.round((1 / tenorBulan) * 100),
          pokokNominal: i === tenorBulan ? pokokCicilan - pokokPerBulan * (tenorBulan - 1) : pokokPerBulan,
          bungaNominal: i === tenorBulan ? nominalBunga - bungaPerBulan * (tenorBulan - 1) : bungaPerBulan,
          nominal: nominalBulanIni,
          sisaBiaya: Math.max(0, sisaKewajiban),
          keterangan: `Cicilan Dana Talang 100% + Bunga 16% (Bulan ${i}/${tenorBulan})`,
          statusBayar: 'BELUM'
        });
      }
      break;
    }

    case 'DT_50_5B': {
      // 3. Dana Talang 50% (DP 50% - Cicilan 50% 5 Bulan) = bunga 23%
      skemaLabel = '3. Dana Talang 50% (DP 50% - Cicilan 50% 5 Bulan) [Bunga 23%]';
      uangMukaDp = Math.round(biayaTotal * 0.5);
      pokokCicilan = biayaTotal - uangMukaDp;
      persentaseBunga = 23;
      nominalBunga = Math.round(pokokCicilan * 0.23);
      totalKewajibanCicilan = pokokCicilan + nominalBunga;
      totalBiayaDanBunga = uangMukaDp + totalKewajibanCicilan;
      tenorBulan = tenorPilihan && tenorPilihan > 0 ? tenorPilihan : 5;
      angsuranPerBulan = Math.round(totalKewajibanCicilan / tenorBulan);

      const pokokPerBulan = Math.round(pokokCicilan / tenorBulan);
      const bungaPerBulan = Math.round(nominalBunga / tenorBulan);

      jadwalTermin = [
        {
          terminKe: 0,
          labelTermin: 'Uang Muka (DP 50%)',
          jadwalWaktu: 'Saat Pendaftaran / Masuk Asrama',
          persentase: 50,
          pokokNominal: uangMukaDp,
          bungaNominal: 0,
          nominal: uangMukaDp,
          sisaBiaya: totalKewajibanCicilan,
          keterangan: 'Pembayaran DP Awal 50% Masuk Pelatihan LPK',
          statusBayar: 'BELUM'
        }
      ];

      let sisaKewajiban = totalKewajibanCicilan;
      for (let i = 1; i <= tenorBulan; i++) {
        const nominalBulanIni = i === tenorBulan ? sisaKewajiban : angsuranPerBulan;
        sisaKewajiban -= nominalBulanIni;
        jadwalTermin.push({
          terminKe: i,
          labelTermin: `Angsuran Bulan ke-${i}`,
          jadwalWaktu: `Bulan ke-${i} Masa Pembelajaran`,
          persentase: Math.round((0.5 / tenorBulan) * 100),
          pokokNominal: i === tenorBulan ? pokokCicilan - pokokPerBulan * (tenorBulan - 1) : pokokPerBulan,
          bungaNominal: i === tenorBulan ? nominalBunga - bungaPerBulan * (tenorBulan - 1) : bungaPerBulan,
          nominal: nominalBulanIni,
          sisaBiaya: Math.max(0, sisaKewajiban),
          keterangan: `Cicilan Dana Talang 50% + Bunga 23% (Bulan ${i}/${tenorBulan})`,
          statusBayar: 'BELUM'
        });
      }
      break;
    }

    case 'BERTAHAP_50_3B': {
      // 4. Pembayaran bertahap (DP 50% - Cicilan 50% LPK 3 Bulan) = bunga 0%
      skemaLabel = '4. Pembayaran Bertahap (DP 50% - Cicilan 50% LPK 3 Bulan) [Bunga 0%]';
      uangMukaDp = Math.round(biayaTotal * 0.5);
      pokokCicilan = biayaTotal - uangMukaDp;
      persentaseBunga = 0;
      nominalBunga = 0;
      totalKewajibanCicilan = pokokCicilan;
      totalBiayaDanBunga = uangMukaDp + totalKewajibanCicilan;
      tenorBulan = tenorPilihan && tenorPilihan > 0 ? tenorPilihan : 3;
      angsuranPerBulan = Math.round(totalKewajibanCicilan / tenorBulan);

      const pokokPerBulan = Math.round(pokokCicilan / tenorBulan);

      jadwalTermin = [
        {
          terminKe: 0,
          labelTermin: 'Uang Muka (DP 50%)',
          jadwalWaktu: 'Saat Pendaftaran / Masuk Asrama',
          persentase: 50,
          pokokNominal: uangMukaDp,
          bungaNominal: 0,
          nominal: uangMukaDp,
          sisaBiaya: totalKewajibanCicilan,
          keterangan: 'Pembayaran DP Awal 50% Masuk Pelatihan (Bunga 0%)',
          statusBayar: 'BELUM'
        }
      ];

      let sisaKewajiban = totalKewajibanCicilan;
      for (let i = 1; i <= tenorBulan; i++) {
        const nominalBulanIni = i === tenorBulan ? sisaKewajiban : angsuranPerBulan;
        sisaKewajiban -= nominalBulanIni;
        jadwalTermin.push({
          terminKe: i,
          labelTermin: `Angsuran Bulan ke-${i}`,
          jadwalWaktu: `Bulan ke-${i} Masa Pembelajaran`,
          persentase: Math.round((0.5 / tenorBulan) * 100),
          pokokNominal: nominalBulanIni,
          bungaNominal: 0,
          nominal: nominalBulanIni,
          sisaBiaya: Math.max(0, sisaKewajiban),
          keterangan: `Cicilan Bertahap Sisa 50% (Bulan ${i}/${tenorBulan} - Bunga 0%)`,
          statusBayar: 'BELUM'
        });
      }
      break;
    }

    case 'BERTAHAP_30_6B':
    default: {
      // 5. Pembayaran bertahap (DP 30% - Cicilan 70% LPK 6 Bulan) = bunga 30%
      skemaLabel = '5. Pembayaran Bertahap (DP 30% - Cicilan 70% LPK 6 Bulan) [Bunga 30%]';
      uangMukaDp = Math.round(biayaTotal * 0.3);
      pokokCicilan = biayaTotal - uangMukaDp;
      persentaseBunga = 30;
      nominalBunga = Math.round(pokokCicilan * 0.30);
      totalKewajibanCicilan = pokokCicilan + nominalBunga;
      totalBiayaDanBunga = uangMukaDp + totalKewajibanCicilan;
      tenorBulan = tenorPilihan && tenorPilihan > 0 ? tenorPilihan : 6;
      angsuranPerBulan = Math.round(totalKewajibanCicilan / tenorBulan);

      const pokokPerBulan = Math.round(pokokCicilan / tenorBulan);
      const bungaPerBulan = Math.round(nominalBunga / tenorBulan);

      jadwalTermin = [
        {
          terminKe: 0,
          labelTermin: 'Uang Muka (DP 30%)',
          jadwalWaktu: 'Saat Pendaftaran / Masuk Asrama',
          persentase: 30,
          pokokNominal: uangMukaDp,
          bungaNominal: 0,
          nominal: uangMukaDp,
          sisaBiaya: totalKewajibanCicilan,
          keterangan: 'Pembayaran Uang Muka (DP 30%) Masuk Pelatihan LPK',
          statusBayar: 'BELUM'
        }
      ];

      let sisaKewajiban = totalKewajibanCicilan;
      for (let i = 1; i <= tenorBulan; i++) {
        const nominalBulanIni = i === tenorBulan ? sisaKewajiban : angsuranPerBulan;
        sisaKewajiban -= nominalBulanIni;
        jadwalTermin.push({
          terminKe: i,
          labelTermin: `Angsuran Bulan ke-${i}`,
          jadwalWaktu: `Bulan ke-${i} Masa Pembelajaran`,
          persentase: Math.round((0.7 / tenorBulan) * 100),
          pokokNominal: i === tenorBulan ? pokokCicilan - pokokPerBulan * (tenorBulan - 1) : pokokPerBulan,
          bungaNominal: i === tenorBulan ? nominalBunga - bungaPerBulan * (tenorBulan - 1) : bungaPerBulan,
          nominal: nominalBulanIni,
          sisaBiaya: Math.max(0, sisaKewajiban),
          keterangan: `Cicilan Sisa 70% + Bunga 30% (Bulan ${i}/${tenorBulan})`,
          statusBayar: 'BELUM'
        });
      }
      break;
    }
  }

  return {
    packageInfo: selectedPkg,
    biayaTotal,
    skemaPembayaran: skemaKey,
    skemaLabel,
    uangMukaDp,
    pokokCicilan,
    persentaseBunga,
    nominalBunga,
    totalKewajibanCicilan,
    totalBiayaDanBunga,
    sisaBiaya: totalKewajibanCicilan,
    diskonPotongan,
    tenorBulan,
    angsuranPerBulan,
    jadwalTermin,
    komponenBiaya
  };
}

export function calculateFinancing(
  programOption: ProgramOption,
  customCost: number = BASE_PROGRAM_COST,
  tenorBulanChoice: number = 6
): FinancingSimulation {
  let dpPercentage = 0;
  let bungaRate = 0;
  let tenor = tenorBulanChoice;

  switch (programOption) {
    case 'Reguler 100%':
    case 'CASH_LUNAS':
      dpPercentage = 1.0;
      bungaRate = 0;
      tenor = 0;
      break;
    case 'DT 100%':
    case 'DT_100_6B':
      dpPercentage = 0;
      bungaRate = 0.16; // 16%
      tenor = 6;
      break;
    case 'DT 50%':
    case 'DT_50_5B':
      dpPercentage = 0.5;
      bungaRate = 0.23; // 23%
      tenor = 5;
      break;
    case 'DP 50%':
    case 'BERTAHAP_50_3B':
      dpPercentage = 0.5;
      bungaRate = 0; // 0%
      tenor = 3;
      break;
    case 'DP 30%':
    case 'BERTAHAP_30_6B':
    default:
      dpPercentage = 0.3;
      bungaRate = 0.30; // 30%
      tenor = 6;
      break;
  }

  const uangMukaDp = Math.round(customCost * dpPercentage);
  const pokokPinjaman = customCost - uangMukaDp;
  const nominalBunga = Math.round(pokokPinjaman * bungaRate);
  const totalKewajibanCicilan = pokokPinjaman + nominalBunga;
  const totalBiayaDanBunga = uangMukaDp + totalKewajibanCicilan;
  const angsuranPerBulan = tenor > 0 ? Math.round(totalKewajibanCicilan / tenor) : 0;

  const rincianTenorTable = [];
  let sisaPlafond = totalKewajibanCicilan;
  const bungaPerBulan = tenor > 0 ? Math.round(nominalBunga / tenor) : 0;
  const pokokPerBulan = tenor > 0 ? Math.round(pokokPinjaman / tenor) : 0;

  for (let i = 1; i <= tenor; i++) {
    const angsuran = i === tenor ? sisaPlafond : angsuranPerBulan;
    sisaPlafond -= angsuran;
    rincianTenorTable.push({
      bulanKe: i,
      angsuranPokok: i === tenor ? pokokPinjaman - pokokPerBulan * (tenor - 1) : pokokPerBulan,
      bungaAdmin: i === tenor ? nominalBunga - bungaPerBulan * (tenor - 1) : bungaPerBulan,
      totalAngsuran: angsuran,
      sisaPlafond: Math.max(0, sisaPlafond)
    });
  }

  return {
    programOption,
    biayaTotal: customCost,
    uangMukaDp,
    pokokPinjaman,
    persentaseBunga: Math.round(bungaRate * 100),
    nominalBunga,
    totalKewajibanCicilan,
    totalBiayaDanBunga,
    plafondPinjaman: totalKewajibanCicilan,
    tenorBulan: tenor,
    angsuranPerBulan,
    rincianTenorTable
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

export interface ApprovalStageInfo {
  step: number; // 1 to 4
  title: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  nextActor: string;
  progressPercent: number; // 25, 50, 75, 100
}

export function getApprovalStageInfo(status: string | undefined, lang: 'id' | 'ja' = 'id'): ApprovalStageInfo {
  switch (status) {
    case 'PENGAJUAN':
      return {
        step: 1,
        title: lang === 'ja' ? '生徒・申請者による申請' : 'Pengajuan Pemohon / Siswa',
        badgeLabel: lang === 'ja' ? '段階 1/4: 生徒/申請者' : 'Tahap 1/4: Siswa / Pemohon',
        badgeBg: 'bg-amber-100 border-amber-300 text-amber-900',
        badgeText: lang === 'ja' ? 'LPK管理者による書類確認待ち' : 'Menunggu Verifikasi Admin LPK',
        nextActor: lang === 'ja' ? 'LPK管理者' : 'Admin LPK',
        progressPercent: 25
      };
    case 'VERIFIKASI_ADMIN':
      return {
        step: 2,
        title: lang === 'ja' ? 'LPK管理者確認済' : 'Terverifikasi Admin LPK',
        badgeLabel: lang === 'ja' ? '段階 2/4: LPK管理者' : 'Tahap 2/4: Admin LPK',
        badgeBg: 'bg-blue-100 border-blue-300 text-blue-900',
        badgeText: lang === 'ja' ? 'ユーザーマネージャー承認待ち' : 'Menunggu Approval User Manager',
        nextActor: lang === 'ja' ? 'ユーザーマネージャー' : 'User Manager',
        progressPercent: 50
      };
    case 'APPROVAL_MANAGER':
      return {
        step: 3,
        title: lang === 'ja' ? 'ユーザーマネージャー承認済' : 'Disetujui User Manager',
        badgeLabel: lang === 'ja' ? '段階 3/4: マネージャー' : 'Tahap 3/4: User Manager',
        badgeBg: 'bg-purple-100 border-purple-300 text-purple-900',
        badgeText: lang === 'ja' ? '統括本部長（GM）最終承認待ち' : 'Menunggu Approval General Manager',
        nextActor: lang === 'ja' ? '統括本部長 (GM)' : 'General Manager',
        progressPercent: 75
      };
    case 'DISETUJUI':
      return {
        step: 4,
        title: lang === 'ja' ? '最終承認済（法的に発効）' : 'Disetujui Final (General Manager)',
        badgeLabel: lang === 'ja' ? '段階 4/4: 統括本部長承認済 (完了)' : 'Tahap 4/4: General Manager (Final)',
        badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-900',
        badgeText: lang === 'ja' ? '立替金実行・公的法務承認済' : 'Dana Talang Cair & Legalisasi Sah',
        nextActor: lang === 'ja' ? '完了 / 実行済' : 'Selesai / Pencairan',
        progressPercent: 100
      };
    case 'DITOLAK':
      return {
        step: 0,
        title: lang === 'ja' ? '申請却下・差戻し' : 'Pengajuan Ditolak',
        badgeLabel: lang === 'ja' ? '却下' : 'Ditolak',
        badgeBg: 'bg-rose-100 border-rose-300 text-rose-900',
        badgeText: lang === 'ja' ? '申請要件不備または差戻し' : 'Pengajuan Tidak Layak / Ditolak',
        nextActor: '-',
        progressPercent: 0
      };
    case 'DRAFT':
    default:
      return {
        step: 0,
        title: lang === 'ja' ? '下書き (ドラフト)' : 'Draft Pengajuan',
        badgeLabel: lang === 'ja' ? 'ドラフト' : 'Draft',
        badgeBg: 'bg-slate-100 border-slate-300 text-slate-700',
        badgeText: lang === 'ja' ? '未申請' : 'Belum Diajukan',
        nextActor: lang === 'ja' ? '申請者 / 生徒' : 'Pemohon / Siswa',
        progressPercent: 10
      };
  }
}


