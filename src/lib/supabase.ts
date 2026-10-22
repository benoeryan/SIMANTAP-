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
    const namaLengkap = (row.nama || row.nama_lengkap || row.namaLengkap || 'Siswa Supabase').trim();
    const keterangan = row.keterangan || row.detail_progres || '';

    // Extract Kontak / Phone
    let noHp = row.no_hp || row.noHp || row.phone || '';
    if (!noHp && keterangan) {
      const phoneMatch = keterangan.match(/Kontak:\s*(\d[\d\s-]{7,})/i);
      if (phoneMatch && phoneMatch[1]) {
        noHp = phoneMatch[1].replace(/\s+/g, '').trim();
      }
    }

    const email = row.email || (noHp ? `${noHp}@ijef.com` : `${id.toLowerCase()}@ijef.com`);
    const photoUrl = row.foto || row.pas_foto || row.pas_photo || row.pasFoto || row.pasPhoto || '';

    // 1. Extract Category from keterangan or row fields
    let category = 'SISWA NON IJEF (New Comer)';
    let rawCat = '';
    const catMatch = keterangan.match(/Kategori:\s*([^|]+)/i);
    if (catMatch && catMatch[1]) {
      rawCat = catMatch[1].trim().toUpperCase();
    } else if (row.kategori || row.kategori_kandidat || row.kategoriKandidat) {
      rawCat = String(row.kategori || row.kategori_kandidat || row.kategoriKandidat).toUpperCase();
    }

    if (rawCat.includes('OFFLINE')) {
      category = 'SISWA IJEF - Offline';
    } else if (rawCat.includes('ONLINE')) {
      category = 'SISWA IJEF - Online';
    } else if (rawCat.includes('EX-MAGANG') || rawCat.includes('EX MAGANG') || rawCat.includes('TRAINEE')) {
      category = 'MATCHING JOB - Ex-Magang / Ex-Trainee';
    } else if (rawCat.includes('ENGINEER') || rawCat.includes('GIJINKOKU')) {
      category = 'MATCHING JOB - Engineering / Gijinkoku';
    } else if (rawCat.includes('MITRA')) {
      category = 'SISWA MITRA';
    } else {
      category = 'SISWA NON IJEF (New Comer)';
    }

    // 2. Extract Gender from row fields, keterangan, or name heuristic
    let gender: 'Laki-laki' | 'Perempuan' = 'Laki-laki';
    let rawGender = String(row.jenis_kelamin || row.jenisKelamin || row.gender || row.sex || '').toLowerCase();
    const genderMatch = keterangan.match(/Jenis Kelamin:\s*([^|]+)/i) || keterangan.match(/Gender:\s*([^|]+)/i);
    if (genderMatch && genderMatch[1]) {
      rawGender = genderMatch[1].trim().toLowerCase();
    }

    if (
      rawGender.includes('perempuan') ||
      rawGender.includes('wanita') ||
      rawGender.includes('female') ||
      rawGender.includes('女性') ||
      rawGender.includes('女') ||
      rawGender === 'p'
    ) {
      gender = 'Perempuan';
    } else {
      const uNama = namaLengkap.toUpperCase();
      if (
        ['INTAN', 'LISA', 'SHALSA', 'TRI', 'PURI', 'YUNIKA', 'ANNISA', 'SITI', 'NUR', 'DEWI', 'PUTRI', 'INDARWATI', 'KASIH', 'RETNO', 'RITA', 'MEGA', 'KARTIKA', 'EKA', 'SUSI', 'TIA', 'FITRI', 'WULAN', 'MELI', 'SARAH', 'LELA', 'SELI'].some(
          (word) => uNama.includes(word)
        )
      ) {
        gender = 'Perempuan';
      }
    }

    // 3. Extract Bidang Kerja
    let bidangKerja = row.bidang_kerja || row.bidangKerja || 'KAIGO';
    const bidangMatch = keterangan.match(/Bidang:\s*([^|]+)/i);
    if (bidangMatch && bidangMatch[1]) {
      bidangKerja = bidangMatch[1].trim();
    }

    // 4. Extract Status Progres & Level Bahasa
    const jm = String(row.job_matching || row.status_progres || row.statusProgres || '').trim();
    const sn = String(row.status_nihongo || row.level_bahasa || row.levelBahasa || '').trim();
    const levelBahasa = sn || 'Belum Ada';

    let statusProgres = 'Pending Nunggu Job';
    const sLow = (jm || sn).toLowerCase();
    if (sLow.includes('belum lolos') || sLow.includes('tidak lolos nihongo')) {
      statusProgres = 'Belum Lolos Nihongo Check';
    } else if (sLow.includes('nihongo') || ['n3', 'n4', 'jft basic a2', 'disc', 'disc test done'].includes(sLow)) {
      statusProgres = 'Nihongo Check';
    } else if (sLow.includes('tidak lolos') || sLow.includes('gagal') || sLow.includes('rejected')) {
      statusProgres = 'Tidak Lolos Interview';
    } else if (sLow.includes('penjadwalan') || sLow.includes('terjadwal')) {
      statusProgres = 'Penjadwalan Interview';
    } else if (sLow.includes('lolos interview') || sLow.includes('naitei') || sLow.includes('hired')) {
      statusProgres = 'Lolos Interview (Naitei)';
    } else if (sLow.includes('on job') || sLow.includes('selesai')) {
      statusProgres = 'Status On Job (Selesai)';
    } else if (sLow.includes('cancel') || sLow.includes('batal')) {
      statusProgres = 'Cancel';
    } else if (sLow.includes('proses') || sLow.includes('applied')) {
      statusProgres = 'On Proses';
    } else if (sLow.includes('pending') || sLow.includes('nunggu') || sLow.includes('melamar') || sLow.includes('siap matching')) {
      statusProgres = 'Pending Nunggu Job';
    } else {
      statusProgres = 'Belum Ada Status';
    }

    const student: CalonSiswa = {
      id,
      namaLengkap,
      email,
      noHp,
      kategoriKandidat: category as any,
      kewarganegaraan: 'WNI',
      noKtp: row.nik || row.no_ktp || '',
      noKk: row.no_kk || '',
      alamatDomisili: row.alamat || row.alamat_domisili || '',
      tempatLahir: row.tempat_lahir || '',
      tanggalLahir: row.tanggal_lahir || '',
      umur: typeof row.umur === 'number' ? row.umur : 22,
      agama: (row.agama || 'Islam') as any,
      jenisKelamin: gender,
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
      bidangKerja,
      namaLengkap,
      namaKatakana: row.nama_katakana || namaLengkap,
      namaPanggilan: row.nama_panggilan || (namaLengkap ? namaLengkap.split(' ')[0] : ''),
      email,
      noHp,
      jenisKelamin: gender,
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

export async function fetchSiswaFromSupabase() {
  try {
    const { data, error } = await supabase.from('siswa').select('*');
    if (error) {
      console.warn('Supabase fetch error:', error);
      return { success: false, data: [], error: error.message };
    }
    const { students, cvMap } = mapSupabaseSiswaToDomain(data || []);
    return { success: true, count: data?.length || 0, data, students, cvMap };
  } catch (err: any) {
    console.warn('Supabase fetch exception:', err);
    return { success: false, data: [], error: err?.message };
  }
}

export async function saveSiswaToSupabase(cvData: any) {
  try {
    if (!cvData || (!cvData.namaLengkap && !cvData.nama)) {
      return { success: false, error: 'Missing candidate name' };
    }
    const nama = (cvData.namaLengkap || cvData.nama || 'Siswa').trim();
    const status_nihongo = cvData.levelBahasaJepang || cvData.levelBahasa || 'Belum Ada';
    const job_matching = cvData.statusProgres || 'Pending Nunggu Job';
    const keterangan = cvData.detailProgres || cvData.catatanProgres || `Bidang: ${cvData.bidangKerja || 'KAIGO'} | Kategori: ${cvData.kategoriKandidat || 'SISWA NON IJEF (New Comer)'}`;

    const { data, error } = await supabase.from('siswa').upsert({
      nama,
      status_nihongo,
      job_matching,
      keterangan
    });

    if (error) {
      console.warn('Supabase upsert note:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase upsert exception:', err);
    return { success: false, error: err?.message };
  }
}
