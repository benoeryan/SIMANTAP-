import firestoreBackupData from '../../firestore_backup.json';
import { CVRirekisho, CalonSiswa, CandidateCategory } from '../types';
import { calculateAgeFromBirthDate } from './candidateUtils';
import { deduplicateAndMergeCandidates } from './duplicateDetector';

export function unwrapFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map((v: any) => unwrapFirestoreValue(v));
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const k of Object.keys(fields)) {
      res[k] = unwrapFirestoreValue(fields[k]);
    }
    return res;
  }
  if ('fields' in val) {
    const fields = val.fields || {};
    const res: Record<string, any> = {};
    for (const k of Object.keys(fields)) {
      res[k] = unwrapFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

export function mapCategory(rawCat?: any): CandidateCategory {
  if (!rawCat) return 'SISWA NON IJEF (New Comer)';
  const catStr = typeof rawCat === 'string' ? rawCat : String(rawCat);
  const upper = catStr.toUpperCase();
  if (upper.includes('EX') || upper.includes('MAGANG') || upper.includes('TRAINEE')) {
    return 'MATCHING JOB - Ex-Magang / Ex-Trainee';
  }
  if (upper.includes('ENGINEER') || upper.includes('GIJINKOKU')) {
    return 'MATCHING JOB - Engineering / Gijinkoku';
  }
  if (upper.includes('OFFLINE')) {
    return 'SISWA IJEF - Offline';
  }
  if (upper.includes('ONLINE')) {
    return 'SISWA IJEF - Online';
  }
  return 'SISWA NON IJEF (New Comer)';
}

export function extractPhotoUrl(raw: any): string {
  if (!raw || typeof raw !== 'object') return '';
  const berkas = raw.berkasDokumen || raw.berkas_dokumen || {};
  const dok = raw.dokumenUpload || raw.dokumen_upload || {};
  const list = [
    raw.pasPhoto,
    raw.pasFoto,
    raw.pasFotoUrl,
    raw.pas_foto,
    raw.pas_photo,
    raw.fotoUrl,
    raw.photoUrl,
    raw.foto_url,
    raw.photo_url,
    raw.url_foto,
    raw.foto,
    raw.photo,
    raw.avatar,
    raw.image_url,
    raw.imageUrl,
    berkas.pasFoto,
    berkas.pasFoto,
    berkas.pas_foto,
    berkas.pas_photo,
    berkas.foto,
    berkas.photo,
    dok.pasPhoto,
    dok.pasFoto,
    dok.pas_foto,
    dok.pas_photo,
    dok.pasPhoto3x4
  ];
  for (const item of list) {
    if (typeof item === 'string' && item.trim().length > 5) {
      return item.trim();
    }
  }
  return '';
}

export function extractNormalizedGender(raw: any): 'Laki-laki' | 'Perempuan' {
  if (!raw) return 'Laki-laki';
  const val = typeof raw === 'string'
    ? raw
    : (raw.jenisKelamin || raw.gender || raw.sex || raw.kelamin || '');
  const str = String(val).trim().toLowerCase();
  if (
    str.includes('perempuan') ||
    str.includes('wanita') ||
    str.includes('female') ||
    str.includes('女性') ||
    str.includes('女') ||
    str === 'p'
  ) {
    return 'Perempuan';
  }
  return 'Laki-laki';
}

export function parseBackupCandidates(): { rirekishoMap: Record<string, CVRirekisho>; calonSiswaList: CalonSiswa[] } {
  const rirekishoMap: Record<string, CVRirekisho> = {};
  const calonSiswaList: CalonSiswa[] = [];
  const seenIds = new Set<string>();

  const rawCandidates = (firestoreBackupData as any).candidates || [];

  for (const item of rawCandidates) {
    const id = item.id || item.siswaId || item.userId;
    if (!id || seenIds.has(id)) continue;
    seenIds.add(id);

    const raw = item.fields ? unwrapFirestoreValue(item.fields) : item;
    const category = mapCategory(raw.kategoriKandidat);
    let rawNameStr = typeof raw.namaLengkap === 'string' ? raw.namaLengkap : (typeof raw.nama === 'string' ? raw.nama : '');
    if (rawNameStr === '[object Object]' || !rawNameStr.trim()) {
      rawNameStr = typeof raw.namaPanggilan === 'string' && raw.namaPanggilan.trim() ? raw.namaPanggilan : (raw.email ? raw.email.split('@')[0] : `Kandidat-${id.substring(0, 6)}`);
    }
    const namaLengkap = rawNameStr.trim() || 'Tanpa Nama';
    const photoUrl = extractPhotoUrl(raw);
    const gender = extractNormalizedGender(raw);

    // Map family list if present
    const dataKeluarga = Array.isArray(raw.keluarga)
      ? raw.keluarga
          .map((k: any) => {
            if (!k || typeof k !== 'object') return null;
            return {
              namaLengkap: typeof k.nama === 'string' ? k.nama : '',
              hubungan: typeof k.hubungan === 'string' ? k.hubungan : '',
              usia: typeof k.usia === 'string' ? k.usia : '',
              pekerjaan: typeof k.pekerjaan === 'string' ? k.pekerjaan : '',
              gajiPerBulan: typeof k.gaji === 'string' ? k.gaji : '',
              tinggalBersama: k.tinggalBersama === 'TINGGAL BERSAMA' ? 'YA' : 'TIDAK'
            };
          })
          .filter(Boolean) as any[]
      : [];

    // Map work experience list if present
    const pekerjaanDetail = Array.isArray(raw.pekerjaan)
      ? raw.pekerjaan
          .map((p: any) => {
            if (!p || typeof p !== 'object') return null;
            return {
              namaPerusahaan: typeof p.perusahaan === 'string' ? p.perusahaan : '',
              bidangPekerjaan: typeof p.bidang === 'string' ? p.bidang : '',
              tanggalMasuk: typeof p.masuk === 'string' ? p.masuk : '',
              tanggalKeluar: typeof p.keluar === 'string' ? p.keluar : '',
              statusPekerja: typeof p.status === 'string' ? p.status : '',
              uraianPekerjaan: typeof p.uraian === 'string' ? p.uraian : ''
            };
          })
          .filter(Boolean) as any[]
      : [];

    const rirekisho: CVRirekisho = {
      id: id,
      siswaId: id,
      kodeReferensi: typeof raw.kodeReferensi === 'string' ? raw.kodeReferensi : '',
      kodeJob: typeof raw.kodeJob === 'string' ? raw.kodeJob : '',
      kategoriKandidat: category,
      bidangKerja: typeof raw.bidangKerja === 'string' ? raw.bidangKerja : '',
      namaLengkap: namaLengkap,
      namaKatakana: typeof raw.namaTangan === 'string' ? raw.namaTangan : (typeof raw.namaPanggilan === 'string' ? raw.namaPanggilan : namaLengkap),
      namaPanggilan: typeof raw.namaPanggilan === 'string' ? raw.namaPanggilan : '',
      email: typeof raw.email === 'string' ? raw.email : '',
      noHp: typeof raw.noHp === 'string' ? raw.noHp : '',
      tanggalLahir: typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '',
      tempatLahir: typeof raw.tempatLahir === 'string' ? raw.tempatLahir : '',
      tempatTanggalLahir: raw.tempatLahir && raw.tanggalLahir ? `${raw.tempatLahir}, ${raw.tanggalLahir}` : '',
      umur: calculateAgeFromBirthDate(typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '', typeof raw.umur === 'number' ? raw.umur : 22),
      alamatLengkap: typeof raw.alamatLengkap === 'string' ? raw.alamatLengkap : '',
      jenisKelamin: gender,
      agama: typeof raw.agama === 'string' ? raw.agama : '',
      golonganDarah: typeof raw.golonganDarah === 'string' ? raw.golonganDarah : '',
      tinggiBadan: typeof raw.tinggiBadan === 'string' ? String(raw.tinggiBadan) : '',
      beratBadan: typeof raw.beratBadan === 'string' ? String(raw.beratBadan) : '',
      dominanTangan: raw.dominanTangan === 'KANAN' ? 'Kanan' : raw.dominanTangan === 'KIRI' ? 'Kiri' : '',
      butaWarna: raw.butaWarna === 'YA' ? 'YA' : 'TIDAK',
      merokok: raw.merokok === 'YA' ? 'YA' : 'TIDAK',
      minumAlkohol: raw.minumAlkohol === 'YA' ? 'YA' : 'TIDAK',
      memilikiTato: raw.tato === 'YA' ? 'YA' : 'TIDAK',
      penyakitBerat: raw.penyakitBerat === 'YA' ? 'YA' : 'TIDAK',
      alergi: raw.alergi === 'YA' ? 'YA' : 'TIDAK',
      hobi: typeof raw.hobi === 'string' ? raw.hobi : '',
      statusPernikahan: raw.statusPernikahan === 'SUDAH MENIKAH' ? 'Menikah' : 'Lajang',
      memilikiSim: raw.memilikiSim === 'YA' ? 'YA' : 'TIDAK',
      pernahKeJepang: raw.pernahKeJepang === 'YA' ? 'YA' : 'TIDAK',
      memilikiPaspor: raw.memilikiPaspor === 'YA' ? 'YA' : 'TIDAK',
      noPaspor: typeof raw.nomorPaspor === 'string' ? raw.nomorPaspor : '',
      dataKeluarga,
      pekerjaanDetail,
      riwayatPendidikan: [],
      riwayatPekerjaan: [],
      pendidikanDetail: {
        sd: { namaSekolah: typeof raw.sdNama === 'string' ? raw.sdNama : '', tahunMasuk: typeof raw.sdMasuk === 'string' ? raw.sdMasuk : '', tahunLulus: typeof raw.sdLulus === 'string' ? raw.sdLulus : '' },
        smp: { namaSekolah: typeof raw.smpNama === 'string' ? raw.smpNama : '', tahunMasuk: typeof raw.smpMasuk === 'string' ? raw.smpMasuk : '', tahunLulus: typeof raw.smpLulus === 'string' ? raw.smpLulus : '' },
        sma: { namaSekolah: typeof raw.smaNama === 'string' ? raw.smaNama : '', tahunMasuk: typeof raw.smaMasuk === 'string' ? raw.smaMasuk : '', tahunLulus: typeof raw.smaLulus === 'string' ? raw.smaLulus : '', jurusan: typeof raw.smaJurusan === 'string' ? raw.smaJurusan : '' },
        universitas: { namaSekolah: typeof raw.univNama === 'string' ? raw.univNama : '', tahunMasuk: typeof raw.univMasuk === 'string' ? raw.univMasuk : '', tahunLulus: typeof raw.univLulus === 'string' ? raw.univLulus : '', jurusan: typeof raw.univJurusan === 'string' ? raw.univJurusan : (typeof raw.jurusanUniv === 'string' ? raw.jurusanUniv : '') }
      },
      statusProgres: typeof raw.statusProgres === 'string' && raw.statusProgres.trim() ? raw.statusProgres.trim() : (typeof raw.progres === 'string' && raw.progres.trim() ? raw.progres.trim() : (typeof raw.status_progres === 'string' && raw.status_progres.trim() ? raw.status_progres.trim() : (typeof raw.statusProgress === 'string' && raw.statusProgress.trim() ? raw.statusProgress.trim() : 'Belum Ada'))),
      namaTSK: typeof raw.namaTsk === 'string' ? raw.namaTsk : (typeof raw.namaTSK === 'string' ? raw.namaTSK : ''),
      detailProgres: typeof raw.namaTsk === 'string' ? raw.namaTsk : (typeof raw.statusProgres === 'string' ? raw.statusProgres : ''),
      namaPerusahaanJp: typeof raw.namaPerusahaanProgres === 'string' ? raw.namaPerusahaanProgres : '',
      lokasiPerusahaanJp: typeof raw.lokasiPerusahaan === 'string' ? raw.lokasiPerusahaan : '',
      pasFotoUrl: photoUrl,
      pasPhoto: photoUrl,
      pasFoto: photoUrl,
      dokumenUpload: {
        pasPhoto: photoUrl,
        pasFoto: photoUrl,
        pasPhoto3x4: photoUrl
      },
      kelebihanAnda: typeof raw.kelebihan === 'string' ? raw.kelebihan : '',
      kelebihanAndaJp: typeof raw.translations?.kelebihan === 'string' ? raw.translations.kelebihan : '',
      kekuranganAnda: typeof raw.kekurangan === 'string' ? raw.kekurangan : '',
      kekuranganAndaJp: typeof raw.translations?.kekurangan === 'string' ? raw.translations.kekurangan : '',
      alasanInginKeJepang: typeof raw.alasanKeJepang === 'string' ? raw.alasanKeJepang : '',
      alasanInginKeJepangJp: typeof raw.translations?.alasanKeJepang === 'string' ? raw.translations.alasanKeJepang : '',
      alasanMelamarBidangIni: typeof raw.alasanMelamarBidang === 'string' ? raw.alasanMelamarBidang : '',
      alasanMelamarBidangIniJp: typeof raw.translations?.alasanMelamarBidang === 'string' ? raw.translations.alasanMelamarBidang : '',
      alasanKaigo: typeof raw.alasanKaigofukushishi === 'string' ? raw.alasanKaigofukushishi : '',
      alasanKaigoJp: typeof raw.translations?.alasanKaigofukushishi === 'string' ? raw.translations.alasanKaigofukushishi : '',
      impianMasaDepan: typeof raw.impianMasaDepan === 'string' ? raw.impianMasaDepan : '',
      lamaTinggalJepang: typeof raw.lamaInginTinggal === 'string' ? raw.lamaInginTinggal : '',
      lamaBelajarBahasaJepang: typeof raw.lamaBelajarBahasaJepang === 'string' ? raw.lamaBelajarBahasaJepang : '',
      levelBahasaJepang: 'N4',
      statusCV: 'Siap Matching',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : (typeof raw.submittedAt === 'string' ? raw.submittedAt : new Date().toISOString())
    };

    rirekishoMap[id] = rirekisho;

    const calonSiswa: CalonSiswa = {
      id: id,
      namaLengkap: namaLengkap,
      noHp: typeof raw.noHp === 'string' ? raw.noHp : '',
      email: typeof raw.email === 'string' && raw.email ? raw.email : `${id}@ijef.com`,
      kategoriKandidat: category,
      kewarganegaraan: 'WNI',
      noKtp: '',
      noKk: '',
      alamatDomisili: typeof raw.alamatLengkap === 'string' ? raw.alamatLengkap : '',
      tempatLahir: typeof raw.tempatLahir === 'string' ? raw.tempatLahir : '',
      tanggalLahir: typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '',
      umur: calculateAgeFromBirthDate(typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '', typeof raw.umur === 'number' ? raw.umur : 22),
      agama: (typeof raw.agama === 'string' && raw.agama ? raw.agama : 'Islam') as any,
      jenisKelamin: gender,
      golonganDarah: (typeof raw.golonganDarah === 'string' && raw.golonganDarah ? raw.golonganDarah : 'O') as any,
      statusPerkawinan: raw.statusPernikahan === 'SUDAH MENIKAH' ? 'Menikah' : 'Lajang',
      namaAyah: '',
      pekerjaanAyah: '',
      ktpNpwpAyah: '',
      namaIbu: '',
      pekerjaanIbu: '',
      ktpNpwpIbu: '',
      berkasDokumen: {
        pasFoto: photoUrl
      },
      pasPhoto: photoUrl,
      pasFoto: photoUrl,
      statusPendaftaran: 'Terverifikasi',
      createdAt: typeof raw.submittedAt === 'string' ? raw.submittedAt : new Date().toISOString()
    };

    calonSiswaList.push(calonSiswa);
  }

  // Build name to rirekisho key map for name-based fallback matching
  const nameToRirekishoKey = new Map<string, string>();
  Object.entries(rirekishoMap).forEach(([key, cv]) => {
    if (cv.namaLengkap) nameToRirekishoKey.set(cv.namaLengkap.trim().toUpperCase(), key);
  });

  // Also parse and merge students list from backup if available
  const rawStudents = (firestoreBackupData as any).students || [];
  for (const s of rawStudents) {
    const sId = s.id || s.siswaId;
    if (!sId) continue;
    const sPhoto = s.berkasDokumen?.pasFoto || s.pasPhoto || s.pasFotoUrl || '';

    const existingIdx = calonSiswaList.findIndex(item => item.id === sId);
    if (existingIdx >= 0) {
      if (sPhoto && !calonSiswaList[existingIdx].berkasDokumen?.pasFoto) {
        calonSiswaList[existingIdx].berkasDokumen = {
          ...(calonSiswaList[existingIdx].berkasDokumen || {}),
          pasFoto: sPhoto
        };
        calonSiswaList[existingIdx].pasPhoto = sPhoto;
        calonSiswaList[existingIdx].pasFoto = sPhoto;
      }
    } else {
      calonSiswaList.push({
        ...s,
        id: sId,
        berkasDokumen: {
          ...(s.berkasDokumen || {}),
          pasFoto: sPhoto
        },
        pasPhoto: sPhoto,
        pasFoto: sPhoto
      });
    }

    if (sPhoto) {
      if (rirekishoMap[sId]) {
        if (!rirekishoMap[sId].pasFotoUrl) {
          rirekishoMap[sId].pasFotoUrl = sPhoto;
          rirekishoMap[sId].pasPhoto = sPhoto;
          rirekishoMap[sId].pasFoto = sPhoto;
        }
      } else if (s.namaLengkap) {
        const rKey = nameToRirekishoKey.get(s.namaLengkap.trim().toUpperCase());
        if (rKey && rirekishoMap[rKey]) {
          if (!rirekishoMap[rKey].pasFotoUrl) {
            rirekishoMap[rKey].pasFotoUrl = sPhoto;
            rirekishoMap[rKey].pasPhoto = sPhoto;
            rirekishoMap[rKey].pasFoto = sPhoto;
          }
        }
      }
    }
  }

  // Final name-based global photo propagation pass for any remaining unlinked items
  const nameToPhotoMap = new Map<string, string>();
  calonSiswaList.forEach(s => {
    const p = s.berkasDokumen?.pasFoto || s.pasPhoto;
    if (p && s.namaLengkap && !p.includes('images.unsplash.com')) {
      nameToPhotoMap.set(s.namaLengkap.trim().toUpperCase(), p);
    }
  });
  Object.values(rirekishoMap).forEach(r => {
    const p = r.pasFotoUrl || r.pasPhoto;
    if (p && r.namaLengkap && !p.includes('images.unsplash.com')) {
      nameToPhotoMap.set(r.namaLengkap.trim().toUpperCase(), p);
    }
  });

  Object.values(rirekishoMap).forEach(r => {
    const currentPhoto = r.pasFotoUrl || r.pasPhoto;
    if ((!currentPhoto || currentPhoto.includes('images.unsplash.com')) && r.namaLengkap) {
      const matchPhoto = nameToPhotoMap.get(r.namaLengkap.trim().toUpperCase());
      if (matchPhoto) {
        r.pasFotoUrl = matchPhoto;
        r.pasPhoto = matchPhoto;
        r.pasFoto = matchPhoto;
      }
    }
  });

  // Master deduplication pass down to 169 unique candidates
  const cleanCalonSiswaList = deduplicateAndMergeCandidates(calonSiswaList);
  const cleanRirekishoList = deduplicateAndMergeCandidates(Object.values(rirekishoMap));

  const cleanRirekishoMap: Record<string, CVRirekisho> = {};
  cleanRirekishoList.forEach((cv) => {
    const key = cv.siswaId || cv.id;
    if (key) cleanRirekishoMap[key] = cv;
  });

  return { rirekishoMap: cleanRirekishoMap, calonSiswaList: cleanCalonSiswaList };
}

export function parseCandidateFromFirestore(id: string, rawDocData: any): CVRirekisho {
  if (!rawDocData) return null as any;
  const raw = rawDocData.fields ? unwrapFirestoreValue(rawDocData.fields) : rawDocData;
  const category = mapCategory(raw.kategoriKandidat || raw.kategori);
  const rawNameStr = typeof raw.namaLengkap === 'string' ? raw.namaLengkap : (raw.namaLengkap ? String(raw.namaLengkap) : 'Tanpa Nama');
  const namaLengkap = rawNameStr.trim() || 'Tanpa Nama';

  let dataKeluarga = [];
  if (Array.isArray(raw.dataKeluarga)) {
    dataKeluarga = raw.dataKeluarga;
  } else if (Array.isArray(raw.keluarga)) {
    dataKeluarga = raw.keluarga.map((k: any) => {
      if (!k || typeof k !== 'object') return null;
      return {
        namaLengkap: typeof k.nama === 'string' ? k.nama : (k.namaLengkap || ''),
        hubungan: typeof k.hubungan === 'string' ? k.hubungan : '',
        usia: typeof k.usia === 'string' ? k.usia : '',
        pekerjaan: typeof k.pekerjaan === 'string' ? k.pekerjaan : '',
        gajiPerBulan: typeof k.gaji === 'string' ? k.gaji : (k.gajiPerBulan || ''),
        tinggalBersama: k.tinggalBersama === 'TINGGAL BERSAMA' || k.tinggalBersama === 'YA' ? 'YA' : 'TIDAK'
      };
    }).filter(Boolean);
  }

  let pekerjaanDetail = [];
  if (Array.isArray(raw.pekerjaanDetail)) {
    pekerjaanDetail = raw.pekerjaanDetail;
  } else if (Array.isArray(raw.pekerjaan)) {
    pekerjaanDetail = raw.pekerjaan.map((p: any) => {
      if (!p || typeof p !== 'object') return null;
      return {
        namaPerusahaan: typeof p.perusahaan === 'string' ? p.perusahaan : (p.namaPerusahaan || ''),
        bidangPekerjaan: typeof p.bidang === 'string' ? p.bidang : (p.bidangPekerjaan || ''),
        tanggalMasuk: typeof p.masuk === 'string' ? p.masuk : (p.tanggalMasuk || ''),
        tanggalKeluar: typeof p.keluar === 'string' ? p.keluar : (p.tanggalKeluar || ''),
        statusPekerja: typeof p.status === 'string' ? p.status : (p.statusPekerja || ''),
        uraianPekerjaan: typeof p.uraian === 'string' ? p.uraian : (p.uraianPekerjaan || '')
      };
    }).filter(Boolean);
  }

  return {
    id: id,
    siswaId: id,
    kodeReferensi: typeof raw.kodeReferensi === 'string' ? raw.kodeReferensi : '',
    kodeJob: typeof raw.kodeJob === 'string' ? raw.kodeJob : '',
    kategoriKandidat: category,
    bidangKerja: typeof raw.bidangKerja === 'string' ? raw.bidangKerja : '',
    namaLengkap: namaLengkap,
    namaKatakana: typeof raw.namaKatakana === 'string' ? raw.namaKatakana : (typeof raw.namaTangan === 'string' ? raw.namaTangan : (typeof raw.namaPanggilan === 'string' ? raw.namaPanggilan : namaLengkap)),
    namaPanggilan: typeof raw.namaPanggilan === 'string' ? raw.namaPanggilan : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    noHp: typeof raw.noHp === 'string' ? raw.noHp : '',
    tanggalLahir: typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '',
    tempatLahir: typeof raw.tempatLahir === 'string' ? raw.tempatLahir : '',
    tempatTanggalLahir: raw.tempatTanggalLahir || (raw.tempatLahir && raw.tanggalLahir ? `${raw.tempatLahir}, ${raw.tanggalLahir}` : ''),
    umur: calculateAgeFromBirthDate(typeof raw.tanggalLahir === 'string' ? raw.tanggalLahir : '', typeof raw.umur === 'number' ? raw.umur : 22),
    alamatLengkap: typeof raw.alamatLengkap === 'string' ? raw.alamatLengkap : '',
    jenisKelamin: extractNormalizedGender(raw),
    agama: typeof raw.agama === 'string' ? raw.agama : '',
    golonganDarah: typeof raw.golonganDarah === 'string' ? raw.golonganDarah : '',
    tinggiBadan: raw.tinggiBadan ? String(raw.tinggiBadan) : '',
    beratBadan: raw.beratBadan ? String(raw.beratBadan) : '',
    dominanTangan: raw.dominanTangan === 'KANAN' || raw.dominanTangan === 'Kanan' ? 'Kanan' : raw.dominanTangan === 'KIRI' || raw.dominanTangan === 'Kiri' ? 'Kiri' : '',
    butaWarna: raw.butaWarna === 'YA' ? 'YA' : 'TIDAK',
    merokok: raw.merokok === 'YA' ? 'YA' : 'TIDAK',
    minumAlkohol: raw.minumAlkohol === 'YA' ? 'YA' : 'TIDAK',
    memilikiTato: raw.memilikiTato === 'YA' || raw.tato === 'YA' ? 'YA' : 'TIDAK',
    penyakitBerat: raw.penyakitBerat === 'YA' ? 'YA' : 'TIDAK',
    alergi: raw.alergi === 'YA' ? 'YA' : 'TIDAK',
    hobi: typeof raw.hobi === 'string' ? raw.hobi : '',
    statusPernikahan: raw.statusPernikahan === 'SUDAH MENIKAH' || raw.statusPernikahan === 'Menikah' ? 'Menikah' : 'Lajang',
    memilikiSim: raw.memilikiSim === 'YA' ? 'YA' : 'TIDAK',
    pernahKeJepang: raw.pernahKeJepang === 'YA' ? 'YA' : 'TIDAK',
    memilikiPaspor: raw.memilikiPaspor === 'YA' ? 'YA' : 'TIDAK',
    noPaspor: typeof raw.noPaspor === 'string' ? raw.noPaspor : (typeof raw.nomorPaspor === 'string' ? raw.nomorPaspor : ''),
    dataKeluarga,
    pekerjaanDetail,
    riwayatPendidikan: raw.riwayatPendidikan || [],
    riwayatPekerjaan: raw.riwayatPekerjaan || [],
    pendidikanDetail: raw.pendidikanDetail || {
      sd: { namaSekolah: typeof raw.sdNama === 'string' ? raw.sdNama : '', tahunMasuk: typeof raw.sdMasuk === 'string' ? raw.sdMasuk : '', tahunLulus: typeof raw.sdLulus === 'string' ? raw.sdLulus : '' },
      smp: { namaSekolah: typeof raw.smpNama === 'string' ? raw.smpNama : '', tahunMasuk: typeof raw.smpMasuk === 'string' ? raw.smpMasuk : '', tahunLulus: typeof raw.smpLulus === 'string' ? raw.smpLulus : '' },
      sma: { namaSekolah: typeof raw.smaNama === 'string' ? raw.smaNama : '', tahunMasuk: typeof raw.smaMasuk === 'string' ? raw.smaMasuk : '', tahunLulus: typeof raw.smaLulus === 'string' ? raw.smaLulus : '', jurusan: typeof raw.smaJurusan === 'string' ? raw.smaJurusan : '' },
      universitas: { namaSekolah: typeof raw.univNama === 'string' ? raw.univNama : '', tahunMasuk: typeof raw.univMasuk === 'string' ? raw.univMasuk : '', tahunLulus: typeof raw.univLulus === 'string' ? raw.univLulus : '', jurusan: typeof raw.univJurusan === 'string' ? raw.univJurusan : (typeof raw.jurusanUniv === 'string' ? raw.jurusanUniv : '') }
    },
    statusProgres: typeof raw.statusProgres === 'string' && raw.statusProgres.trim() ? raw.statusProgres.trim() : (typeof raw.progres === 'string' && raw.progres.trim() ? raw.progres.trim() : (typeof raw.status_progres === 'string' && raw.status_progres.trim() ? raw.status_progres.trim() : (typeof raw.statusProgress === 'string' && raw.statusProgress.trim() ? raw.statusProgress.trim() : 'Belum Ada'))),
    namaTSK: typeof raw.namaTSK === 'string' ? raw.namaTSK : (typeof raw.namaTsk === 'string' ? raw.namaTsk : ''),
    detailProgres: typeof raw.detailProgres === 'string' ? raw.detailProgres : (typeof raw.keteranganProgres === 'string' ? raw.keteranganProgres : (typeof raw.namaTsk === 'string' ? raw.namaTsk : '')),
    keteranganProgres: typeof raw.keteranganProgres === 'string' ? raw.keteranganProgres : (typeof raw.keterangan === 'string' ? raw.keterangan : ''),
    keteranganTambahan: typeof raw.keteranganTambahan === 'string' ? raw.keteranganTambahan : '',
    jadwalKeberangkatan: typeof raw.jadwalKeberangkatan === 'string' ? raw.jadwalKeberangkatan : (typeof raw.jadwalTerbang === 'string' ? raw.jadwalTerbang : ''),
    coeTerbit: typeof raw.coeTerbit === 'string' ? raw.coeTerbit : '',
    namaPerusahaanJp: typeof raw.namaPerusahaanJp === 'string' ? raw.namaPerusahaanJp : (typeof raw.namaPerusahaanProgres === 'string' ? raw.namaPerusahaanProgres : ''),
    lokasiPerusahaanJp: typeof raw.lokasiPerusahaanJp === 'string' ? raw.lokasiPerusahaanJp : (typeof raw.lokasiPerusahaan === 'string' ? raw.lokasiPerusahaan : ''),
    pasFotoUrl: extractPhotoUrl(raw),
    pasPhoto: extractPhotoUrl(raw),
    pasFoto: extractPhotoUrl(raw),
    dokumenUpload: {
      ...(raw.dokumenUpload || {}),
      pasPhoto: raw.pasPhoto || raw.pasFoto || raw.pasFotoUrl || raw.dokumenUpload?.pasPhoto || '',
      pasFoto: raw.pasFoto || raw.pasPhoto || raw.pasFotoUrl || raw.dokumenUpload?.pasFoto || '',
      pasPhoto3x4: raw.dokumenUpload?.pasPhoto3x4 || raw.pasPhoto || raw.pasFoto || raw.pasFotoUrl || ''
    },
    kelebihanAnda: typeof raw.kelebihanAnda === 'string' ? raw.kelebihanAnda : (typeof raw.kelebihan === 'string' ? raw.kelebihan : ''),
    kelebihanAndaJp: typeof raw.kelebihanAndaJp === 'string' ? raw.kelebihanAndaJp : (typeof raw.translations?.kelebihan === 'string' ? raw.translations.kelebihan : ''),
    kekuranganAnda: typeof raw.kekuranganAnda === 'string' ? raw.kekuranganAnda : (typeof raw.kekurangan === 'string' ? raw.kekurangan : ''),
    kekuranganAndaJp: typeof raw.kekuranganAndaJp === 'string' ? raw.kekuranganAndaJp : (typeof raw.translations?.kekurangan === 'string' ? raw.translations.kekurangan : ''),
    alasanInginKeJepang: typeof raw.alasanInginKeJepang === 'string' ? raw.alasanInginKeJepang : (typeof raw.alasanKeJepang === 'string' ? raw.alasanKeJepang : ''),
    alasanInginKeJepangJp: typeof raw.alasanInginKeJepangJp === 'string' ? raw.alasanInginKeJepangJp : (typeof raw.translations?.alasanKeJepang === 'string' ? raw.translations.alasanKeJepang : ''),
    alasanMelamarBidangIni: typeof raw.alasanMelamarBidangIni === 'string' ? raw.alasanMelamarBidangIni : (typeof raw.alasanMelamarBidang === 'string' ? raw.alasanMelamarBidang : ''),
    alasanMelamarBidangIniJp: typeof raw.alasanMelamarBidangIniJp === 'string' ? raw.alasanMelamarBidangIniJp : (typeof raw.translations?.alasanMelamarBidang === 'string' ? raw.translations.alasanMelamarBidang : ''),
    alasanKaigo: typeof raw.alasanKaigo === 'string' ? raw.alasanKaigo : (typeof raw.alasanKaigofukushishi === 'string' ? raw.alasanKaigofukushishi : ''),
    alasanKaigoJp: typeof raw.alasanKaigoJp === 'string' ? raw.alasanKaigoJp : (typeof raw.translations?.alasanKaigofukushishi === 'string' ? raw.translations.alasanKaigofukushishi : ''),
    impianMasaDepan: typeof raw.impianMasaDepan === 'string' ? raw.impianMasaDepan : '',
    lamaTinggalJepang: typeof raw.lamaTinggalJepang === 'string' ? raw.lamaTinggalJepang : (typeof raw.lamaInginTinggal === 'string' ? raw.lamaInginTinggal : ''),
    lamaBelajarBahasaJepang: typeof raw.lamaBelajarBahasaJepang === 'string' ? raw.lamaBelajarBahasaJepang : '',
    levelBahasaJepang: raw.levelBahasaJepang || 'N4',
    statusCV: raw.statusCV || 'Siap Matching',
    translations: raw.translations || undefined,
    keluarga: raw.keluarga || undefined,
    pekerjaan: raw.pekerjaan || undefined,
    sertifikatBahasaJepang: raw.sertifikatBahasaJepang || undefined,
    sertifikatSSW: raw.sertifikatSSW || raw.sertifikatSsw || undefined,
    sertifikatSenmonkyuu: raw.sertifikatSenmonkyuu || undefined,
    sertifikatSelesaiMagang: raw.sertifikatSelesaiMagang || undefined,
    tanggalJFT: raw.tanggalJFT || undefined,
    tanggalSSW: raw.tanggalSSW || undefined,
    tanggalSSWKaigo: raw.tanggalSSWKaigo || undefined,
    tanggalJLPT: raw.tanggalJLPT || undefined,
    tanggalShuryoShomei: raw.tanggalShuryoShomei || undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : (typeof raw.submittedAt === 'string' ? raw.submittedAt : new Date().toISOString())
  };
}

