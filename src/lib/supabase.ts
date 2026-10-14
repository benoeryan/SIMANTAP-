import { createClient } from '@supabase/supabase-js';
import { CalonSiswa, CVRirekisho } from '../types';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://lvvpgcqzbvvpjshbkavk.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_qQmxthBt0VtKH31I8WnFZg_tZww0nmX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function mapSupabaseSiswaToDomain(data: any[] = []): {
  students: CalonSiswa[];
  cvMap: Record<string, CVRirekisho>;
} {
  const students: CalonSiswa[] = [];
  const cvMap: Record<string, CVRirekisho> = {};

  if (!Array.isArray(data)) return { students, cvMap };

  data.forEach((row, index) => {
    if (!row) return;
    const id = row.id ? String(row.id) : (row.siswa_id || `SP-${index + 1}`);
    const namaLengkap = row.nama || row.nama_lengkap || row.namaLengkap || 'Siswa Supabase';
    const email = row.email || `${id.toLowerCase()}@ijef.com`;
    const noHp = row.no_hp || row.noHp || row.phone || '';
    const photoUrl = row.foto || row.pas_foto || row.pas_photo || row.pasFoto || row.pasPhoto || '';
    const statusProgres = row.job_matching || row.status_progres || row.statusProgres || 'Pending Nunggu Job';
    const levelBahasa = row.status_nihongo || row.level_bahasa || row.levelBahasa || 'Belum Ada';
    const keterangan = row.keterangan || row.detail_progres || '';

    const student: CalonSiswa = {
      id,
      namaLengkap,
      email,
      noHp,
      kategoriKandidat: row.kategori || row.kategori_kandidat || 'SISWA NON IJEF (New Comer)',
      kewarganegaraan: 'WNI',
      noKtp: row.nik || row.no_ktp || '',
      noKk: row.no_kk || '',
      alamatDomisili: row.alamat || row.alamat_domisili || '',
      tempatLahir: row.tempat_lahir || '',
      tanggalLahir: row.tanggal_lahir || '',
      umur: typeof row.umur === 'number' ? row.umur : 22,
      agama: (row.agama || 'Islam') as any,
      jenisKelamin: row.jenis_kelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
      golonganDarah: (row.golongan_darah || 'O') as any,
      statusPerkawinan: (row.status_pernikahan || 'Lajang') as any,
      namaAyah: row.nama_ayah || '',
      pekerjaanAyah: '',
      ktpNpwpAyah: '',
      namaIbu: row.nama_ibu || '',
      pekerjaanIbu: '',
      ktpNpwpIbu: '',
      berkasDokumen: {
        ...(photoUrl ? { pasFoto: photoUrl } : {})
      },
      pasPhoto: photoUrl,
      pasFoto: photoUrl,
      statusPendaftaran: 'Terverifikasi',
      createdAt: row.created_at || new Date().toISOString()
    };

    const cv: CVRirekisho = {
      id,
      siswaId: id,
      kodeReferensi: row.kode_referensi || '',
      kodeJob: row.kode_job || 'DEF',
      kategoriKandidat: student.kategoriKandidat,
      bidangKerja: row.bidang_kerja || 'KAIGO',
      namaLengkap,
      namaKatakana: row.nama_katakana || namaLengkap,
      namaPanggilan: row.nama_panggilan || (namaLengkap ? namaLengkap.split(' ')[0] : ''),
      email,
      noHp,
      jenisKelamin: student.jenisKelamin,
      statusProgres,
      detailProgres: keterangan,
      catatanProgres: keterangan,
      pasFotoUrl: photoUrl,
      pasPhoto: photoUrl,
      pasFoto: photoUrl,
      levelBahasaJepang: levelBahasa,
      statusCV: 'Siap Matching',
      riwayatPendidikan: [],
      riwayatPekerjaan: []
    };

    students.push(student);
    cvMap[id] = cv;
  });

  return { students, cvMap };
}
