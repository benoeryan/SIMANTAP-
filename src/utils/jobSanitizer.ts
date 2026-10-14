import { JobPosting } from '../types';

export function sanitizeJobPosting(job: Partial<JobPosting>, index: number): JobPosting {
  let kodeJob = (job.kodeJob || '').trim();
  let tskSumberJob = (job.tskSumberJob || '').trim();
  let biayaProses = (job.biayaProses || '').trim();
  let id = (job.id || '').trim();

  const isCurrency = (str?: string) =>
    !!str && (/^rp\s*/i.test(str.trim()) || /^\d{1,3}(\.\d{3}){2,}/.test(str.trim()));

  if (isCurrency(kodeJob)) {
    if (!biayaProses || biayaProses === 'Sesuai Ketentuan Standard' || biayaProses === 'Sesuai Ketentuan') {
      biayaProses = kodeJob;
    }
    kodeJob = '';
  }

  if (isCurrency(tskSumberJob)) {
    if (!biayaProses || biayaProses === 'Sesuai Ketentuan Standard' || biayaProses === 'Sesuai Ketentuan') {
      biayaProses = tskSumberJob;
    }
    tskSumberJob = 'Internal IJEF';
  }

  if (!kodeJob) {
    kodeJob = `JOB-${String(index + 1).padStart(3, '0')}`;
  }

  if (isCurrency(id) || !id) {
    id = `${kodeJob}-${index + 1}`;
  }

  const judulPekerjaan = job.judulPekerjaan || 'Lowongan Kerja Jepang';
  const lokasiPrefektur = job.lokasiPrefektur || 'Berbagai Prefektur di Jepang';
  
  const cleanSalaryDigits = (job.gajiString || '').replace(/[^0-9]/g, '');
  let gajiBulananYen = job.gajiBulananYen || parseInt(cleanSalaryDigits, 10);
  if (isNaN(gajiBulananYen) || gajiBulananYen <= 0) {
    gajiBulananYen = 200000;
  }

  let gajiString = job.gajiString || '';
  if (!gajiString || /^\d+$/.test(gajiString)) {
    gajiString = `${gajiBulananYen.toLocaleString()} yen/bulan`;
  }

  const gajiEstimasiIdr = job.gajiEstimasiIdr || Math.round(gajiBulananYen * 105);

  const kualifikasi = job.kualifikasi || job.persyaratanJLPT || 'Sertifikat Bahasa & Skill Sesuai Bidang';
  
  // Extract and migrate Kategori Domisili Job Siswa ('Domestik (Jepang)' vs 'Lokal (Indonesia)')
  let kategoriDomisili: 'Domestik (Jepang)' | 'Lokal (Indonesia)' = 'Lokal (Indonesia)';
  if (
    job.kategoriDomisili === 'Domestik (Jepang)' ||
    job.statusJob === 'Lokal/Domestik (Jepang)' ||
    /domestik|国内/i.test(job.kategoriDomisili || '') ||
    /berdomisili di jepang|domisili jepang/i.test(job.kualifikasi || '') ||
    /berdomisili di jepang|domisili jepang/i.test(job.deskripsiPekerjaan || '')
  ) {
    kategoriDomisili = 'Domestik (Jepang)';
  } else if (job.kategoriDomisili === 'Lokal (Indonesia)') {
    kategoriDomisili = 'Lokal (Indonesia)';
  }

  // Clean status: 'Aktif' or 'Tutup'
  const isClosed =
    job.statusJob === 'Tutup' ||
    job.statusJob === 'CLOSED' ||
    job.statusJob === 'closed' ||
    job.statusAktif === false;
  const statusJob = isClosed ? 'Tutup' : 'Aktif';

  // Urgensi Job (URGENT / STANDART / SLOW)
  let urgensiJob: 'URGENT' | 'STANDART' | 'SLOW' = 'STANDART';
  const rawUrgency = (job.urgensiJob || '').toUpperCase().trim();
  if (rawUrgency === 'URGENT' || /urgent|mendesak|cepat|asap|darurat/i.test(job.urgensiJob || '')) {
    urgensiJob = 'URGENT';
  } else if (rawUrgency === 'SLOW' || /slow|santai|panjang|lama/i.test(job.urgensiJob || '')) {
    urgensiJob = 'SLOW';
  } else if (rawUrgency === 'STANDART' || rawUrgency === 'STANDARD' || /standar/i.test(job.urgensiJob || '')) {
    urgensiJob = 'STANDART';
  }

  return {
    id,
    kodeJob,
    judulPekerjaan,
    kategoriTarget: job.kategoriTarget || 'Semua Non-IJEF',
    kategoriDomisili,
    urgensiJob,
    perusahaanJepang: job.perusahaanJepang || 'Mitra Perusahaan Jepang',
    kumiaiRujukan: job.kumiaiRujukan || 'Mitra Asosiasi / TSK Resmi Jepang',
    lokasiPrefektur,
    domisiliKerja: job.domisiliKerja || (kategoriDomisili === 'Domestik (Jepang)' ? 'Jepang (Domestik)' : 'Indonesia (Lokal)'),
    jenisKelamin: job.jenisKelamin || '男 (Laki-laki)',
    gajiBulananYen,
    gajiString,
    gajiEstimasiIdr,
    persyaratanJLPT: kualifikasi.length > 120 ? kualifikasi.slice(0, 120) : kualifikasi,
    kualifikasi,
    biayaProses: biayaProses || 'Sesuai Ketentuan Standard',
    keteranganTambahan: job.keteranganTambahan || '',
    tskSumberJob: tskSumberJob || 'Internal IJEF',
    deskripsiPekerjaan: job.deskripsiPekerjaan || `Lowongan ${judulPekerjaan} - Kode ${kodeJob} (${lokasiPrefektur}). Gaji: ${gajiString}. Kuota: ${job.kuotaSiswa || 1} orang.`,
    fasilitasAsrama: job.fasilitasAsrama || 'Subsidi tempat tinggal / asrama, Asuransi Kesehatan (Shakai Hoken), Tunjangan Lembur & Bonus.',
    kuotaSiswa: job.kuotaSiswa || 1,
    statusJob,
    statusAktif: statusJob === 'Aktif'
  };
}
