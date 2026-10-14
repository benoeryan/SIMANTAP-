export type DepartureFinancingScheme = 'DANA_TALANG_100' | 'DANA_MANDIRI';

export interface DepartureBillingItem {
  key: string;
  label: string;
  nominal: number;
  keterangan: string;
  isOptional?: boolean;
}

export interface DeparturePaymentTerm {
  terminKe: number;
  labelTermin: string;
  jadwalWaktu: string;
  persentase: number;
  nominal: number;
  sisaBiaya: number;
  statusBayar: 'LUNAS' | 'PROSES' | 'BELUM';
  keterangan: string;
}

export interface DepartureJobInfo {
  jobId?: string;
  kodeJob?: string;
  judulJob?: string;
  perusahaanJepang?: string;
  kumiaiRujukan?: string;
  lokasiPrefektur?: string;
  gajiBulananYen?: number;
  gajiEstimasiIdr?: number;
  biayaProses?: string;
}

export interface DepartureFinancingSimulation {
  skema: DepartureFinancingScheme;
  skemaLabel: string;
  jobInfo: DepartureJobInfo;
  biayaTotal: number;
  uangMukaDp: number;
  persentaseDp: number;
  plafondDanaTalang: number;
  persentaseBunga: number;
  nominalBunga: number;
  totalKewajibanTalangan: number;
  tenorBulan: number;
  angsuranPerBulanIdr: number;
  angsuranPerBulanYen: number;
  kursJpyIdr: number;
  estimasiGajiYen: number;
  sisaGajiBersihYen: number;
  komponenBilling: DepartureBillingItem[];
  jadwalTermin: DeparturePaymentTerm[];
  rincianCicilanJepang?: {
    bulanKe: number;
    angsuranIdr: number;
    angsuranYen: number;
    sisaTalanganIdr: number;
    keterangan: string;
  }[];
}

export const DEFAULT_DEPARTURE_BILLING_ITEMS: DepartureBillingItem[] = [
  {
    key: 'visa_coe',
    label: 'Pengurusan Visa Kerja & Certificate of Eligibility (CoE)',
    nominal: 4500000,
    keterangan: 'Penerjemahan dokumen legal, verifikasi imigrasi Jepang & permohonan visa di Kedubes'
  },
  {
    key: 'tiket_pesawat',
    label: 'Tiket Pesawat Internasional ke Jepang (One-Way Flight)',
    nominal: 8500000,
    keterangan: 'Penerbangan maskapai resmi (Garuda / ANA / Japan Airlines / Batik) menuju bandara tujuan Jepang'
  },
  {
    key: 'asuransi_perlindungan',
    label: 'Asuransi Perjalanan Internasional & Perlindungan Kerja SSW',
    nominal: 2000000,
    keterangan: 'Proteksi keselamatan perjalanan udara, asuransi kecelakaan & perlindungan tenaga kerja luar negeri'
  },
  {
    key: 'mcu_final',
    label: 'Medical Check Up (MCU) Final Pra-Keberangkatan & Vaksin',
    nominal: 1500000,
    keterangan: 'Pemeriksaan kesehatan komprehensif standar RS Imigrasi Jepang & booster vaksin'
  },
  {
    key: 'legalitas_epmi',
    label: 'Dokumen Imigrasi, E-PMI / KTKLN & Penanganan BP2MI',
    nominal: 5000000,
    keterangan: 'Registrasi SISKOP2MI, E-PMI resmi Disnaker/BP2MI, legalisir notaris & materai'
  },
  {
    key: 'orientasi_lpk',
    label: 'Handling LPK, Airport Assistance & Pembekalan Akhir (PAP)',
    nominal: 3500000,
    keterangan: 'Bimbingan tata krama bandara Jepang, penjemputan pihak Kumiai/TSK & handling keberangkatan'
  }
];

export const ESTIMATED_KUR_JPY_IDR = 108; // 1 JPY ≈ Rp 108

export function parseBiayaJobToNumber(biayaStr?: string): number {
  if (!biayaStr) return 25000000;
  const clean = biayaStr.toLowerCase().trim();
  if (clean.includes('gratis') || clean.includes('free') || clean.includes('tanggungan')) {
    return 0;
  }
  const numOnly = clean.replace(/[^0-9]/g, '');
  if (!numOnly) return 25000000;
  const val = parseInt(numOnly, 10);
  if (val > 0 && val <= 100) {
    return val * 1000000;
  }
  return val;
}

export function calculateDepartureFinancing(
  skema: DepartureFinancingScheme,
  biayaKeberangkatan: number = 25000000,
  tenorBulanChoice: number = 12,
  jobInfo: DepartureJobInfo = {},
  customBillingItems?: DepartureBillingItem[],
  kurs: number = ESTIMATED_KUR_JPY_IDR
): DepartureFinancingSimulation {
  const biayaTotal = Math.max(0, biayaKeberangkatan);
  const gajiYen = jobInfo.gajiBulananYen || 205000;
  const komponenBilling = customBillingItems && customBillingItems.length > 0
    ? customBillingItems
    : DEFAULT_DEPARTURE_BILLING_ITEMS.map(item => {
        // Adjust ratio if total differs from default sum (25.000.000)
        const defaultSum = 25000000;
        const ratio = defaultSum > 0 ? biayaTotal / defaultSum : 1;
        return {
          ...item,
          nominal: Math.round(item.nominal * ratio)
        };
      });

  if (skema === 'DANA_MANDIRI') {
    // 100% Pembayaran Mandiri oleh siswa/keluarga (Bunga 0%, DP 100% / termin bertahap sebelum terbang)
    const uangMukaDp = biayaTotal;
    const plafondDanaTalang = 0;
    const tenorBulan = 0;
    const angsuranPerBulanIdr = 0;
    const angsuranPerBulanYen = 0;

    // 3 Tahapan Termin Pembayaran Mandiri sebelum berangkat
    const termin1 = Math.round(biayaTotal * 0.4); // 40% Saat Terbit CoE & Kontrak
    const termin2 = Math.round(biayaTotal * 0.35); // 35% Saat Pengajuan & Terbit Visa
    const termin3 = Math.max(0, biayaTotal - termin1 - termin2); // 25% Saat Tiket & Final Briefing

    const jadwalTermin: DeparturePaymentTerm[] = [
      {
        terminKe: 1,
        labelTermin: 'Termin 1: Terbit CoE (Certificate of Eligibility)',
        jadwalWaktu: 'Saat Dokumen CoE Resmi Diterima dari Imigrasi Jepang',
        persentase: 40,
        nominal: termin1,
        sisaBiaya: biayaTotal - termin1,
        statusBayar: 'BELUM',
        keterangan: 'Pembayaran awal pengurusan CoE, legalitas dokumen imigrasi & kontrak kerja Jepang'
      },
      {
        terminKe: 2,
        labelTermin: 'Termin 2: Pengajuan & Penerbitan Visa Kerja SSW',
        jadwalWaktu: 'Saat Paspor & Visa Kerja Tokutei Ginou / Gijinkoku Terbit',
        persentase: 35,
        nominal: termin2,
        sisaBiaya: termin3,
        statusBayar: 'BELUM',
        keterangan: 'Pelunasan biaya visa, asuransi perlindungan tenaga kerja luar negeri & medical final'
      },
      {
        terminKe: 3,
        labelTermin: 'Termin 3: Penerbitan Tiket Pesawat & Keberangkatan',
        jadwalWaktu: 'Maksimal H-7 Sebelum Tanggal Penerbangan ke Bandara Jepang',
        persentase: 25,
        nominal: termin3,
        sisaBiaya: 0,
        statusBayar: 'BELUM',
        keterangan: 'Pelunasan final tiket pesawat internasional, e-PMI BP2MI & airport handling'
      }
    ];

    return {
      skema: 'DANA_MANDIRI',
      skemaLabel: 'DANA MANDIRI (Pembayaran Mandiri 100% - Bebas Potongan Gaji)',
      jobInfo,
      biayaTotal,
      uangMukaDp,
      persentaseDp: 100,
      plafondDanaTalang,
      persentaseBunga: 0,
      nominalBunga: 0,
      totalKewajibanTalangan: 0,
      tenorBulan,
      angsuranPerBulanIdr,
      angsuranPerBulanYen,
      kursJpyIdr: kurs,
      estimasiGajiYen: gajiYen,
      sisaGajiBersihYen: gajiYen,
      komponenBilling,
      jadwalTermin,
      rincianCicilanJepang: []
    };
  } else {
    // DANA TALANG 100% (Penuh ditalangi LPK / Financing Partner, DP Rp 0, cicilan via potong gaji saat bekerja di Jepang)
    const uangMukaDp = 0;
    const plafondDanaTalang = biayaTotal;
    const tenor = tenorBulanChoice > 0 ? tenorBulanChoice : 12;
    const angsuranPerBulanIdr = Math.round(plafondDanaTalang / tenor);
    const angsuranPerBulanYen = Math.round(angsuranPerBulanIdr / kurs);
    const sisaGajiBersihYen = Math.max(0, gajiYen - angsuranPerBulanYen);

    // Jadwal simulasi cicilan potong gaji di Jepang
    const rincianCicilanJepang = [];
    let sisaTalangan = plafondDanaTalang;
    for (let i = 1; i <= tenor; i++) {
      const angsuran = i === tenor ? sisaTalangan : angsuranPerBulanIdr;
      sisaTalangan = Math.max(0, sisaTalangan - angsuran);
      rincianCicilanJepang.push({
        bulanKe: i,
        angsuranIdr: angsuran,
        angsuranYen: Math.round(angsuran / kurs),
        sisaTalanganIdr: sisaTalangan,
        keterangan: `Potong Gaji Slip Kumiai / Perusahaan Jepang Bulan ke-${i}`
      });
    }

    const jadwalTermin: DeparturePaymentTerm[] = [
      {
        terminKe: 1,
        labelTermin: 'Tahap 1: Pra-Keberangkatan (DP Rp 0)',
        jadwalWaktu: 'Saat Proses CoE, Visa, & Tiket Pesawat ke Jepang',
        persentase: 0,
        nominal: 0,
        sisaBiaya: plafondDanaTalang,
        statusBayar: 'LUNAS',
        keterangan: 'Siswa berangkat tanpa beban biaya di awal (Talangan Penuh 100% oleh LPK IJEF)'
      },
      {
        terminKe: 2,
        labelTermin: `Tahap 2: Cicilan Potong Gaji di Jepang (${tenor} Bulan)`,
        jadwalWaktu: `Mulai Bulan ke-1 Bekerja di Jepang selama ${tenor} Bulan`,
        persentase: 100,
        nominal: plafondDanaTalang,
        sisaBiaya: 0,
        statusBayar: 'PROSES',
        keterangan: `Angsuran Rp ${angsuranPerBulanIdr.toLocaleString('id-ID')} (± ¥${angsuranPerBulanYen.toLocaleString('ja-JP')})/bulan dipotong otomatis dari slip gaji di Jepang`
      }
    ];

    return {
      skema: 'DANA_TALANG_100',
      skemaLabel: 'DANA TALANG 100% (Penuh Ditalangi - DP 0% / Potong Gaji di Jepang)',
      jobInfo,
      biayaTotal,
      uangMukaDp,
      persentaseDp: 0,
      plafondDanaTalang,
      persentaseBunga: 0,
      nominalBunga: 0,
      totalKewajibanTalangan: plafondDanaTalang,
      tenorBulan: tenor,
      angsuranPerBulanIdr,
      angsuranPerBulanYen,
      kursJpyIdr: kurs,
      estimasiGajiYen: gajiYen,
      sisaGajiBersihYen,
      komponenBilling,
      jadwalTermin,
      rincianCicilanJepang
    };
  }
}
