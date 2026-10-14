import { JobPosting } from '../types';

/**
 * Checks whether a job posting is active and open for Mitra applications.
 */
export function isJobActiveAndAvailable(job: Partial<JobPosting> | null | undefined): boolean {
  if (!job) return false;

  // If statusAktif is explicitly false, it is not available
  if (job.statusAktif === false) return false;

  const status = (job.statusJob || '').trim().toLowerCase();
  if (
    status === 'tutup' ||
    status === 'closed' ||
    status === 'close' ||
    status === 'nonaktif' ||
    status === 'habis' ||
    status === 'selesai' ||
    status === 'クローズ' ||
    status.includes('tutup') ||
    status.includes('closed') ||
    status.includes('close') ||
    status.includes('クローズ')
  ) {
    return false;
  }

  return true;
}

/**
 * Checks whether a candidate / student is active and ready for job matching in Japan.
 * Strictly excludes:
 * - Candidates who have not passed Nihongo check / "Belum Lolos Nihongo check"
 * - Candidates with incomplete/empty status / "Belum Ada"
 * - Canceled, disqualified, or already finished placement candidates ("Cancel", "Tidak Lolos Interview", "Status On Job (Selesai)")
 */
export function isCandidateReadyForMatching(candidate: {
  statusProgres?: string;
  statusCV?: string;
  statusPendaftaran?: string;
  namaLengkap?: string;
  kategoriKandidat?: string;
}): boolean {
  if (!candidate) return false;

  const prog = (candidate.statusProgres || '').trim().toLowerCase();
  const cv = (candidate.statusCV || '').trim().toLowerCase();
  const pendaftaran = (candidate.statusPendaftaran || '').trim().toLowerCase();

  // Explicitly disqualified or inactive statuses:
  if (
    prog === 'belum lolos nihongo check' ||
    prog.includes('belum lolos') ||
    prog.includes('tidak lolos') ||
    prog === 'cancel' ||
    prog === 'batal' ||
    prog === 'belum ada' ||
    prog === 'status on job (selesai)' ||
    prog === 'selesai' ||
    prog === 'nonaktif' ||
    prog === 'draft'
  ) {
    return false;
  }

  // Explicitly matching-ready pipeline statuses:
  if (
    prog === 'pending nunggu job' ||
    prog === 'siap matching' ||
    prog.includes('siap') ||
    prog === 'on proses' ||
    prog.includes('interview') ||
    prog.includes('penjadwalan') ||
    prog.includes('terjadwal') ||
    prog.includes('naitei') ||
    prog.includes('visa') ||
    prog.includes('coe') ||
    prog === 'nihongo check' ||
    prog === 'terdaftar admin 1' ||
    prog === 'terverifikasi' ||
    cv === 'siap matching' ||
    cv === 'terverifikasi admin' ||
    pendaftaran.includes('matching') ||
    pendaftaran.includes('terverifikasi')
  ) {
    return true;
  }

  // Fallback for valid candidates with active records
  if (candidate.namaLengkap && prog !== 'belum ada') {
    return true;
  }

  return false;
}

/**
 * Differentiates whether a job strictly requires previous experience (ex-magang / ex-trainee)
 * or allows newcomers (new comer / non-pengalaman / pemula).
 */
export function getJobExperienceCategory(job: any): 'EX_MAGANG' | 'NEW_COMER' {
  if (!job) return 'NEW_COMER';
  const text = (
    (job.judulPekerjaan || '') + ' ' +
    (job.kualifikasi || '') + ' ' +
    (job.deskripsiPekerjaan || '') + ' ' +
    (job.persyaratanJLPT || '') + ' ' +
    (job.keteranganTambahan || '')
  ).toLowerCase();

  const allowsNewComer = 
    text.includes('new comer ataupun ex-magang diperbolehkan') ||
    text.includes('new comer diperbolehkan') ||
    text.includes('new comer bisa') ||
    text.includes('pemula bisa') ||
    text.includes('bisa pemula') ||
    text.includes('non-pengalaman') ||
    text.includes('non pengalaman') ||
    text.includes('tanpa pengalaman') ||
    text.includes('fresh graduate') ||
    text.includes('new comer') ||
    (job.kategoriTarget && job.kategoriTarget.toLowerCase().includes('new comer') && !text.includes('khusus ex-magang') && !text.includes('wajib ex-magang'));

  const requiresExMagang =
    text.includes('khusus ex-magang') ||
    text.includes('wajib ex-magang') ||
    text.includes('hanya ex-magang') ||
    text.includes('wajib berpengalaman') ||
    text.includes('harus berpengalaman') ||
    text.includes('pengalaman kaigo minimal 1 tahun') ||
    text.includes('pengalaman minimal 1 tahun') ||
    text.includes('minimal pengalaman') ||
    (text.includes('senmonkyuu') && !allowsNewComer) ||
    (text.includes('ex-magang') && !allowsNewComer);

  if (requiresExMagang && !text.includes('new comer ataupun ex-magang diperbolehkan')) {
    return 'EX_MAGANG';
  }
  return 'NEW_COMER';
}

// Known TSK/Agency terms that should not be displayed as job titles or leaked in UI
const TSK_BLACKLIST_REGEX =
  /^(lpk\s+)?(aqnesia|agenesia|agensia|yurinoki|yrnk|ijef\s*corp|lpk\s*ijef|marta|hibiki|onodera|hsi|lilin|shaco|shacio|viet|misumi|amr|bagus|enlink|sakura|tcj|hlc|om\s*bro|gn|bw|ipps|kyodai|ags)(\s+.*)?$/i;

/**
 * Detects the sector of a job posting based on title and description.
 */
export function detectJobSector(job: Partial<JobPosting>): string {
  const title = (job.judulPekerjaan || '').toLowerCase();
  const desc = (job.deskripsiPekerjaan || '').toLowerCase();
  const qual = (job.kualifikasi || '').toLowerCase();
  const req = (job.persyaratanJLPT || '').toLowerCase();
  const full = `${title} ${desc} ${qual} ${req}`;

  if (full.includes('kaigo') || full.includes('caregiver') || full.includes('lansia') || full.includes('介護') || full.includes('perawat')) {
    return 'KAIGO';
  }
  if (full.includes('makanan') || full.includes('food') || full.includes('bento') || full.includes('pangan') || full.includes('食品') || full.includes('olahan') || full.includes('飲食')) {
    return 'PM';
  }
  if (full.includes('tani') || full.includes('agri') || full.includes('kebun') || full.includes('pertanian') || full.includes('農業') || full.includes('sayur') || full.includes('buah') || full.includes('ternak') || full.includes('peternakan') || full.includes('畜産')) {
    return 'PERTANIAN';
  }
  if (full.includes('kikai') || full.includes('mesin') || full.includes('manufaktur') || full.includes('machining') || full.includes('pabrik') || full.includes('機械') || full.includes('bubut') || full.includes('operator') || full.includes('lathe') || full.includes('nc ')) {
    return 'KIKAI KAKOU';
  }
  if (full.includes('engineer') || full.includes('cad') || full.includes('gijinkoku') || full.includes('it ') || full.includes('insinyur') || full.includes('s1') || full.includes('d3') || full.includes('gijutsu') || full.includes('hp ') || full.includes('toko hp') || full.includes('携帯')) {
    return 'ENGINEERING';
  }
  if (full.includes('konstruksi') || full.includes('tobi') || full.includes('tekkin') || full.includes('pembesian') || full.includes('cat') || full.includes('bangunan') || full.includes('建設') || full.includes('鉄筋') || full.includes('型枠') || full.includes('doboku') || full.includes('土木') || full.includes('tile') || full.includes('タイル')) {
    return 'KONSTRUKSI';
  }
  if (full.includes('las') || full.includes('welding') || full.includes('yousetsu') || full.includes('溶接')) {
    return 'PENGELASAN';
  }
  if (full.includes('cat') || full.includes('tosou') || full.includes('painting') || full.includes('塗装')) {
    return 'PENGECATAN';
  }
  if (full.includes('ikan') || full.includes('perikanan') || full.includes('fishery') || full.includes('漁業')) {
    return 'PERIKANAN';
  }
  if (full.includes('elektronik') || full.includes('denshikiki') || full.includes('denshi') || full.includes('電子') || full.includes('perakitan') || full.includes('kumitate')) {
    return 'ELEKTRONIKA';
  }
  if (full.includes('kapal') || full.includes('zousen') || full.includes('shipbuilding') || full.includes('造船')) {
    return 'PERKAPALAN';
  }
  if (full.includes('driver') || full.includes('sopir') || full.includes('truk') || full.includes('logistik') || full.includes('運送') || full.includes('自動車運送')) {
    return 'LOGISTIK';
  }
  if (full.includes('listrik') || full.includes('electrical') || full.includes('lifeline') || full.includes('電気')) {
    return 'LISTRIK';
  }
  if (full.includes('otomotif') || full.includes('seibi') || full.includes('mobil') || full.includes('motor') || full.includes('整備') || full.includes('自動車整備')) {
    return 'OTOMOTIF';
  }
  if (full.includes('terjemah') || full.includes('tsuyaku') || full.includes('interpreter') || full.includes('通訳')) {
    return 'INTERPRETER';
  }

  return 'MANUFAKTUR';
}

/**
 * Returns a clean, professional, partner-ready Job Title without TSK/Agency names.
 * Supports both Indonesian and Japanese language modes.
 */
export function getSanitizedJobTitle(job: Partial<JobPosting>, lang: 'id' | 'ja' = 'id'): string {
  const original = (job.judulPekerjaan || '').trim();
  const sector = detectJobSector(job);
  const desc = `${job.deskripsiPekerjaan || ''} ${job.kualifikasi || ''}`.toLowerCase();

  // If the title is empty, numeric, currency, status code, or a recognized TSK/Agency name
  const isInvalidTitle =
    !original ||
    original === '-' ||
    original === '0' ||
    original.toLowerCase() === 'list job' ||
    original.toLowerCase() === 'judul pekerjaan' ||
    original.toLowerCase() === 'semua non-ijef' ||
    original.toLowerCase().startsWith('rp ') ||
    /^\d+$/.test(original.replace(/[.,\s]/g, '')) ||
    original.startsWith('IND') ||
    original.includes('IJEF') ||
    original.startsWith('女') ||
    original.startsWith('男') ||
    TSK_BLACKLIST_REGEX.test(original);

  if (isInvalidTitle) {
    if (lang === 'ja') {
      if (sector === 'KAIGO') return '介護スタッフ（施設介護・高齢者ケア）';
      if (sector === 'PM') return '食品製造・惣菜加工スタッフ（飲食料品製造業）';
      if (sector === 'PERTANIAN') return '農業・施設園芸・畜産業管理スタッフ';
      if (sector === 'KIKAI KAKOU') return '機械加工・旋盤・マシニングオペレーター';
      if (sector === 'ENGINEERING') return '技術・エンジニア（技人国 / CAD・IT設計）';
      if (sector === 'KONSTRUKSI') {
        if (desc.includes('tekkin') || desc.includes('鉄筋')) return '鉄筋施工・配筋工事スタッフ';
        if (desc.includes('katawaku') || desc.includes('型枠')) return '型枠大工・コンクリート型枠工事';
        if (desc.includes('tobi') || desc.includes('とび')) return 'とび・足場組立・解体工事';
        if (desc.includes('doboku') || desc.includes('土木')) return '土木施工・インフラ工事スタッフ';
        if (desc.includes('tile') || desc.includes('タイル')) return 'タイル張り・内装仕上げ工事';
        return '建設・建築躯体工事スタッフ';
      }
      if (sector === 'PENGELASAN') return '溶接・製缶加工（TIG・半自動溶接）';
      if (sector === 'PENGECATAN') return '塗装・工業製品コーティング工';
      if (sector === 'ELEKTRONIKA') return '電気電子機器組立て・基板製造';
      if (sector === 'PERKAPALAN') return '造船・舶用機械組立て・艤装工';
      if (sector === 'PERIKANAN') return '漁業・水産養殖作業員';
      if (sector === 'LOGISTIK') return '物流・自動車運送ドライバー';
      if (sector === 'LISTRIK') return '電気工事・ライフライン設備工';
      if (sector === 'OTOMOTIF') return '自動車整備士・車両点検整備';
      if (sector === 'INTERPRETER') return '通訳・翻訳（日本語・インドネシア語）';
      return '製造・生産ラインオペレーター';
    }

    if (sector === 'KAIGO') return 'Kaigo (Caregiver / Perawat Lansia)';
    if (sector === 'PM') return 'Pengolahan Makanan (Food Processing)';
    if (sector === 'PERTANIAN') return 'Pertanian & Peternakan (Agriculture & Farming)';
    if (sector === 'KIKAI KAKOU') return 'Manufaktur & Pengoperasian Mesin (Machining)';
    if (sector === 'ENGINEERING') return 'Engineering Gijinkoku (Technical Specialist)';
    if (sector === 'KONSTRUKSI') {
      if (desc.includes('tekkin') || desc.includes('鉄筋')) return 'Konstruksi Pembesian (Tekkin Sekou)';
      if (desc.includes('katawaku') || desc.includes('型枠')) return 'Konstruksi Cetakan Beton (Katawaku)';
      if (desc.includes('tobi') || desc.includes('とび')) return 'Konstruksi Perancah Scaffolding (Tobi)';
      if (desc.includes('doboku') || desc.includes('土木')) return 'Konstruksi Sipil & Jalan (Doboku)';
      if (desc.includes('tile') || desc.includes('タイル')) return 'Pemasangan Keramik & Ubin (Tile)';
      return 'Konstruksi & Struktur Bangunan (Construction)';
    }
    if (sector === 'PENGELASAN') return 'Pengelasan Logam (Welding Yousetsu)';
    if (sector === 'PENGECATAN') return 'Pengecatan & Coating Industri (Tosou)';
    if (sector === 'ELEKTRONIKA') return 'Perakitan Alat Listrik & Elektronik (Denshikiki)';
    if (sector === 'PERKAPALAN') return 'Pembuatan & Perakitan Kapal (Zousen)';
    if (sector === 'PERIKANAN') return 'Budidaya Perikanan & Kelautan (Fisheries)';
    if (sector === 'LOGISTIK') return 'Driver Truk & Logistik (Transport Service)';
    if (sector === 'LISTRIK') return 'Instalasi Listrik & Mekanikal (Electrical)';
    if (sector === 'OTOMOTIF') return 'Jidousha Seibi (Perawatan Kendaraan Otomotif)';
    if (sector === 'INTERPRETER') return 'Penerjemah Bahasa Jepang (Interpreter)';

    return 'Operator Produksi & Manufaktur Jepang';
  }

  // If Japanese language is selected and title has Indonesian keywords, make it clean Japanese
  if (lang === 'ja') {
    if (original.includes('JIDOUSHASEIBI') || original.includes('自動車整備') || original.includes('seibi')) {
      return '自動車整備士（Jidousha Seibi）';
    }
    if (original.includes('Tekkin') || original.includes('鉄筋')) {
      return '鉄筋施工・配筋工事';
    }
    if (original.includes('Katawaku') || original.includes('型枠')) {
      return '型枠大工・コンクリート型枠施工';
    }
    if (original.includes('Kaigo') || original.includes('介護') || original.includes('CAREGIVER')) {
      return '介護スタッフ（施設介護）';
    }
    if (original.includes('Makanan') || original.includes('食品') || original.includes('PENGOLAHAN MAKANAN') || original.includes('飲食')) {
      return '飲食料品製造・惣菜加工スタッフ';
    }
    if (original.includes('PETERNAKAN') || original.includes('畜産')) {
      return '畜産業・牛飼育管理スタッフ';
    }
    if (original.includes('Pertanian') || original.includes('農業')) {
      return '農業・施設園芸栽培管理';
    }
    if (original.includes('PENGELASAN') || original.includes('溶接')) {
      return '溶接工・金属接合作業';
    }
    if (original.includes('TOSOU') || original.includes('PENGECATAN') || original.includes('塗装')) {
      return '塗装工・工業塗装作業';
    }
    if (original.includes('KIKAI KAKOU') || original.includes('機械加工') || original.includes('NC Lathe')) {
      return '機械加工・NC旋盤オペレーター';
    }
    if (original.includes('DENSHIKIKI') || original.includes('電気電子機器')) {
      return '電気電子機器組立てスタッフ';
    }
    if (original.includes('PEMBUATAN KAPAL') || original.includes('造船')) {
      return '造船・舶用機械組立て工';
    }
    if (original.includes('TOKO HP') || original.includes('携帯ショップ') || original.includes('ENGINEERING')) {
      return '技術・店舗エンジニア（技人国）';
    }
    if (original.includes('KONSTRUKSI') || original.includes('建設')) {
      return '建設躯体工事スタッフ';
    }
    if (original.includes('通訳') || original.includes('Interpreter')) {
      return '通訳・翻訳スタッフ（日イ語）';
    }
  }

  // If Japanese characters are present without Indonesian context, add nice label
  if (lang === 'id' && /^[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\s\(\)\/]+$/.test(original)) {
    if (original.includes('鉄筋')) return 'Tekkin (Pembesian Konstruksi 鉄筋)';
    if (original.includes('型枠')) return 'Katawaku (Bekisting Beton 型枠)';
    if (original.includes('介護')) return 'Kaigo (Perawat Lansia 介護)';
    if (original.includes('食品') || original.includes('飲食')) return 'Pengolahan Makanan (食品製造)';
    if (original.includes('通訳')) return 'Penerjemah Bahasa Jepang (通訳)';
    if (original.includes('農業')) return 'Pertanian & Perkebunan (農業)';
    if (original.includes('畜産')) return 'Peternakan (畜産業)';
    if (original.includes('溶接')) return 'Pengelasan Logam (溶接)';
    if (original.includes('塗装')) return 'Pengecatan Industri (塗装)';
    if (original.includes('機械')) return 'Pengoperasian Mesin (機械加工)';
    if (original.includes('自動車整備')) return 'Perawatan Otomotif (自動車整備)';
    if (original.includes('建設')) return 'Konstruksi Bangunan (建設)';
    if (original.includes('とび')) return 'Perancah Scaffolding (とび)';
    if (original.includes('土木')) return 'Konstruksi Sipil (土木)';
    if (original.includes('タイル')) return 'Pemasangan Ubin (タイル張り)';
  }

  // Strip accidental "TSK: ..." or "LPK ..." prefix from title if attached
  let cleanTitle = original.replace(/^(TSK\s*\/?[^:]*:\s*|LPK\s+[A-Z0-9\s]+-\s*)/i, '').trim();
  return cleanTitle || (lang === 'ja' ? '日本企業求人' : 'Lowongan Kerja Jepang');
}

/**
 * Returns a sanitized company name for the portal, hiding any TSK/Agency names in parentheses.
 */
export function getSanitizedCompany(job: Partial<JobPosting> | null | undefined, lang: 'id' | 'ja' = 'id'): string {
  const original = (job?.perusahaanJepang || '').trim();
  const defaultLabel = lang === 'ja' ? '日本受入企業（提携TSK）' : 'Mitra Perusahaan Jepang (TSK Partner)';

  if (!original || original === '-' || original.includes('(-)') || original === '0') {
    return defaultLabel;
  }

  // Normalize any explicit "Kumiai Partner" mentions to "TSK Partner"
  if (/kumiai\s*partner/i.test(original) || /tsk\s*partner/i.test(original)) {
    return defaultLabel;
  }

  // If it contains "Mitra Perusahaan (TSK_NAME)" or similar, clean it up
  const cleaned = original.replace(/\s*\([^)]*\)/g, '').trim();

  // If the result is just "Mitra Perusahaan", "Mitra Perusahaan Jepang", etc., provide the standardized label
  const lowerClean = cleaned.toLowerCase();
  if (
    lowerClean === 'mitra perusahaan' ||
    lowerClean === 'mitra perusahaan jepang' ||
    lowerClean === 'perusahaan jepang' ||
    lowerClean === 'kaisha' ||
    lowerClean.includes('kumiai partner') ||
    lowerClean.includes('tsk partner')
  ) {
    return defaultLabel;
  }

  // If company itself is a TSK name like "LPK Aqnesia" or "Yurinoki" or matches blacklist
  if (TSK_BLACKLIST_REGEX.test(cleaned)) {
    return defaultLabel;
  }

  if (lang === 'ja') {
    return `受入先企業 (${cleaned})`;
  }

  return cleaned || defaultLabel;
}

/**
 * Japanese prefecture dictionary and helper
 */
const PREFECTURE_MAP: Record<string, { ja: string; id: string }> = {
  tokyo: { ja: '東京都（Tokyo）', id: 'Tokyo (東京都)' },
  kanagawa: { ja: '神奈川県（Kanagawa）', id: 'Kanagawa (神奈川県)' },
  osaka: { ja: '大阪府（Osaka）', id: 'Osaka (大阪府)' },
  aichi: { ja: '愛知県（Aichi）', id: 'Aichi (愛知県)' },
  saitama: { ja: '埼玉県（Saitama）', id: 'Saitama (埼玉県)' },
  chiba: { ja: '千葉県（Chiba）', id: 'Chiba (千葉県)' },
  hyogo: { ja: '兵庫県（Hyogo）', id: 'Hyogo (兵庫県)' },
  hiroshima: { ja: '広島県（Hiroshima）', id: 'Hiroshima (広島県)' },
  kagawa: { ja: '香川県（Kagawa）', id: 'Kagawa (香川県)' },
  shizuoka: { ja: '静岡県（Shizuoka）', id: 'Shizuoka (静岡県)' },
  niigata: { ja: '新潟県（Niigata）', id: 'Niigata (新潟県)' },
  fukuoka: { ja: '福岡県（Fukuoka）', id: 'Fukuoka (福岡県)' },
  yamaguchi: { ja: '山口県（Yamaguchi）', id: 'Yamaguchi (山口県)' },
  nagasaki: { ja: '長崎県（Nagasaki）', id: 'Nagasaki (長崎県)' },
  kumamoto: { ja: '熊本県（Kumamoto）', id: 'Kumamoto (熊本県)' },
  gunma: { ja: '群馬県（Gunma）', id: 'Gunma (群馬県)' },
  tochigi: { ja: '栃木県（Tochigi）', id: 'Tochigi (栃木県)' },
  ibaraki: { ja: '茨城県（Ibaraki）', id: 'Ibaraki (茨城県)' },
  hokkaido: { ja: '北海道（Hokkaido）', id: 'Hokkaido (北海道)' },
  mie: { ja: '三重県（Mie）', id: 'Mie (三重県)' },
  gifu: { ja: '岐阜県（Gifu）', id: 'Gifu (岐阜県)' },
  kyoto: { ja: '京都府（Kyoto）', id: 'Kyoto (京都府)' },
  okayama: { ja: '岡山県（Okayama）', id: 'Okayama (岡山県)' },
  ehime: { ja: '愛媛県（Ehime）', id: 'Ehime (愛媛県)' },
  miyazaki: { ja: '宮崎県（Miyazaki）', id: 'Miyazaki (宮崎県)' },
  kagoshima: { ja: '鹿児島県（Kagoshima）', id: 'Kagoshima (鹿児島県)' },
  okinawa: { ja: '沖縄県（Okinawa）', id: 'Okinawa (沖縄県)' },
};

/**
 * Formats location/prefecture properly according to selected language.
 */
export function formatPrefecture(pref: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!pref || pref === '-' || pref === '0' || pref.toLowerCase().includes('berbagai prefektur') || pref.includes('全国')) {
    return lang === 'ja' ? '日本全国（配属先による）' : 'Berbagai Prefektur di Jepang';
  }

  const lower = pref.toLowerCase();
  if (lower.includes('kanto') || lower.includes('kansai') || pref.includes('関東') || pref.includes('関西')) {
    return lang === 'ja' ? '関東・関西エリア（配属先による）' : 'Kanto & Kansai (Tokyo, Osaka, dsb)';
  }

  for (const [key, mapping] of Object.entries(PREFECTURE_MAP)) {
    if (lower.includes(key) || pref.includes(mapping.ja.slice(0, 2))) {
      return lang === 'ja' ? mapping.ja : mapping.id;
    }
  }

  return pref;
}

/**
 * Cleans qualification text and formats it properly according to language.
 */
export function formatQualification(qual: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!qual || qual === '-' || qual === '0' || qual.trim().startsWith('Rp') || /^\d+$/.test(qual.replace(/[.,\s]/g, ''))) {
    return lang === 'ja' ? 'JFT-Basic A2 または JLPT N4 相当' : 'Min. JFT-Basic A2 / JLPT N4';
  }

  if (lang === 'ja') {
    const lower = qual.toLowerCase();
    
    // Direct matches / common multi-requirement phrases
    if (lower.includes('libur sabtu minggu') || lower.includes('sabtu minggu libur')) {
      return '完全週休2日制（土日祝休み）';
    }
    if (lower.includes('sehat jasmani') && (lower.includes('n4') || lower.includes('jft'))) {
      return 'JLPT N4 / JFT-Basic A2以上、心身ともに健康で意欲的な方';
    }
    if (lower.includes('perawatan') && lower.includes('mobil') || lower.includes('jidousha') || lower.includes('seibi')) {
      return '自動車整備・点検経験者、日本在住（特定技能・技人国）';
    }
    if (lower.includes('n1')) return 'JLPT N1（ビジネス・ネイティブレベル対応、通訳可）';
    if (lower.includes('n2')) return 'JLPT N2以上（ビジネス日本語、大卒・技術者優遇）';
    if (lower.includes('n3')) return 'JLPT N3以上（日常会話・業務指示が円滑に理解できること）';
    if (lower.includes('n4') || lower.includes('jft') || lower.includes('a2')) {
      if (lower.includes('ssw') || lower.includes('tokutei') || lower.includes('keahlian') || lower.includes('bidang')) {
        return 'JLPT N4 / JFT-Basic A2以上 + 各分野の特定技能評価試験合格';
      }
      return 'JFT-Basic A2 または JLPT N4 相当';
    }
    if (lower.includes('senmonkyu') || lower.includes('hyoukachosho') || lower.includes('hyokachosho') || lower.includes('ex-magang') || lower.includes('ex magang')) {
      return '技能実習修了者（専門級合格証書・評価調書 所持者）';
    }
    if (lower.includes('kaigo') || lower.includes('caregiver') || lower.includes('lansia')) {
      return '特定技能 介護評価試験合格者 + 日本語JFT-Basic A2 / JLPT N4';
    }
    if (lower.includes('makanan') || lower.includes('food') || lower.includes('olahan')) {
      return '特定技能 飲食料品製造業試験合格者';
    }
    if (lower.includes('pertanian') || lower.includes('tani') || lower.includes('peternakan')) {
      return '特定技能 農業・畜産業技能測定試験合格者';
    }
    if (lower.includes('mesin') || lower.includes('kikai') || lower.includes('bubut') || lower.includes('manufaktur')) {
      return '特定技能 素形材・産業機械・製造業技能試験合格者';
    }
    if (lower.includes('konstruksi') || lower.includes('tekkin') || lower.includes('katawaku') || lower.includes('tobi') || lower.includes('bangunan')) {
      return '特定技能 建設分野技能測定試験合格者';
    }
    if (lower.includes('las') || lower.includes('welding') || lower.includes('yousetsu')) {
      return '特定技能 溶接・金属加工技能試験合格者';
    }
    if (lower.includes('s1') || lower.includes('d3') || lower.includes('sarjana') || lower.includes('diploma') || lower.includes('engineer')) {
      return '大学卒業（学士 S1）または短大・高専卒（D3）関連専攻';
    }
    if (lower.includes('usia') || lower.includes('umur')) {
      return '年齢要件を満たし、就労意欲の高い方';
    }
    if (lower.includes('tidak buta warna')) {
      return '色覚異常のない方（正常な色識別能力）';
    }
    if (lower.includes('tidak bertato')) {
      return 'タトゥーのない方';
    }
    if (lower.includes('motivasi') || lower.includes('semangat') || lower.includes('disiplin')) {
      return '高い学習意欲、規律正しさ、良好な勤務態度';
    }

    return '日本語能力（JFT-Basic A2 / JLPT N4）および各分野の特定技能評価試験合格';
  }

  return qual;
}

/**
 * Translates candidate category to Japanese or keeps Indonesian.
 */
export function translateCandidateCategory(cat: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!cat) return lang === 'ja' ? '一般候補生' : 'Kandidat Umum';
  if (lang !== 'ja') return cat;

  const lower = cat.toLowerCase();
  if (lower.includes('engineering') || lower.includes('gijinkoku')) {
    return '技術・人文知識・国際業務（技人国 / Engineering）';
  }
  if (lower.includes('non-ijef') || lower.includes('mitra') || lower.includes('non ijef') || lower.includes('semua non')) {
    return '提携校・外部推薦候補生（Non-IJEF）';
  }
  if (lower.includes('ex-magang') || lower.includes('ex magang')) {
    return '元技能実習生（特定技能移行 / Ex-Magang）';
  }
  if (lower.includes('new comer') || lower.includes('newcomer')) {
    return '新規渡航希望者（New Comer / 一般）';
  }
  if (lower.includes('siap matching')) {
    return 'マッチング待機生（即戦力）';
  }
  if (lower.includes('offline') || lower.includes('reguler')) {
    return 'IJEF正規訓練生（対面合宿生）';
  }
  if (lower.includes('online')) {
    return 'IJEF正規訓練生（オンライン生）';
  }
  if (lower.includes('ijef')) {
    return 'IJEF正規訓練生';
  }

  return cat;
}

/**
 * Translates facility text to Japanese cleanly
 */
export function translateFacilityText(text: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!text || text === '-' || text === '0') {
    return lang === 'ja'
      ? '社員寮・住居手当補助完備、社会保険完備（健康保険・厚生年金・雇用保険・労災保険）、残業手当・賞与支給。'
      : 'Subsidi tempat tinggal / asrama, Asuransi Kesehatan (Shakai Hoken), Tunjangan Lembur & Bonus.';
  }

  if (lang === 'ja') {
    const lower = text.toLowerCase();
    if (lower.includes('asrama') || lower.includes('mess') || lower.includes('tempat tinggal') || lower.includes('subsidi')) {
      if (lower.includes('asuransi') || lower.includes('shakai hoken') || lower.includes('bpjs')) {
        return '社員寮・住居補助完備、社会保険完備（健康保険・厚生年金・雇用保険・労災保険）、残業手当支給。';
      }
      return '社員寮・住居手当補助完備（家電・生活備品付き）、近隣サポート体制あり。';
    }
    if (lower.includes('makan') || lower.includes('konsumsi')) {
      return '社員寮完備、食事手当支給（まかない・社食補助あり）。';
    }
    if (lower.includes('seragam') || lower.includes('pakaian kerja')) {
      return '作業着・制服無償貸与、安全装備支給。';
    }
    if (lower.includes('wifi') || lower.includes('internet')) {
      return '家具家電・Wi-Fi完備の社員寮（個室または2人部屋）。';
    }
    return '社員寮・住居手当補助完備、社会保険完備（健康保険・厚生年金・雇用保険・労災保険）、残業手当・賞与支給（企業就業規則に基づく）。';
  }

  return text;
}

/**
 * Translates fee / process cost text cleanly
 */
export function translateFeeText(text: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!text || text === '-' || text === '0' || text.toLowerCase().includes('gratis') || text.toLowerCase().includes('tanggungan perusahaan') || text.toLowerCase().includes('perusahaan')) {
    return lang === 'ja' ? '無料 / 受入企業全額負担' : 'Gratis / Tanggungan Perusahaan';
  }

  if (lang === 'ja') {
    const lower = text.toLowerCase();
    if (text.includes('20.000.000') || text === 'Rp 20' || text === '20' || lower.includes('20 juta') || lower.includes('20jt')) {
      return '自己負担概算: 約20万円相当（就労ビザ・渡航費用サポート含む）';
    }
    if (text.includes('30.000.000') || text === 'Rp 30' || text === '30' || lower.includes('30 juta') || lower.includes('30jt')) {
      return '自己負担概算: 約30万円相当（健康診断・就労ビザ・航空券含む）';
    }
    if (text.includes('25.000.000') || text === 'Rp 25' || text === '25' || lower.includes('25 juta') || lower.includes('25jt')) {
      return '自己負担概算: 約25万円相当（就労ビザおよび航空券含む）';
    }
    if (text.includes('5.000.000') || text === 'Rp 5' || text === '5' || lower.includes('5 juta') || lower.includes('5jt')) {
      return '自己負担概算: 約5万円相当（本人手続き費用のみ）';
    }
    if (text.includes('10.000.000') || text === 'Rp 10' || text === '10' || lower.includes('10 juta') || lower.includes('10jt')) {
      return '自己負担概算: 約10万円相当（手配支援費用）';
    }
    if (text.includes('15.000.000') || text === 'Rp 15' || text === '15' || lower.includes('15 juta') || lower.includes('15jt')) {
      return '自己負担概算: 約15万円相当（手配支援費用）';
    }
    if (lower.includes('mandiri') || lower.includes('sendiri')) {
      return '渡航手続き費用: 本人負担スキーム（分割・融資相談可）';
    }
    if (lower.includes('potong gaji') || lower.includes('cicil')) {
      return '渡航費用立替・来日後給与天引き分割制度あり';
    }
    return `渡航手配費用規定: ${text}`;
  }

  // If Indonesian and looks like short number 'Rp 20' or '20'
  if (/^rp\s*\d{1,2}$/i.test(text.trim()) || /^\d{1,2}$/.test(text.trim())) {
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    return `Rp ${num}.000.000 (${num} Juta)`;
  }

  return text;
}

/**
 * Translates notes text cleanly
 */
export function translateNotesText(text: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!text || text === '-' || text === '0') return '';

  if (lang === 'ja') {
    const lower = text.toLowerCase();
    if (lower.includes('mandiri') && lower.includes('tiket')) {
      return '渡航用航空券代および諸手続き費用は自己負担となります。';
    }
    if (lower.includes('mcu') && lower.includes('visa') && lower.includes('tiket')) {
      return '健康診断、就労ビザ申請、航空券手配、E-KTKLN支援が含まれます。';
    }
    if (lower.includes('mcu') && lower.includes('visa')) {
      return '健康診断および就労ビザ申請費用は支援対象に含まれます。';
    }
    if (lower.includes('belum dikonfirmasi') || lower.includes('kemungkinan ditanggung')) {
      return '航空券支給の有無は最終面接結果および内定受諾条件により決定されます。';
    }
    if (lower.includes('urgent') || lower.includes('segera') || lower.includes('cepat') || lower.includes('butuh')) {
      return '至急募集案件（内定後、速やかに在留資格申請手続きを開始します）。';
    }
    if (lower.includes('zoom') || lower.includes('online') || lower.includes('daring')) {
      return 'オンライン（Zoom/Meet）面接対応案件。';
    }
    if (lower.includes('shift') || lower.includes('lembur')) {
      return 'シフト制勤務あり、所定外労働手当別途全額支給。';
    }
    if (lower.includes('bonus') || lower.includes('thr')) {
      return '業績連動賞与・特別手当支給制度あり。';
    }
    if (lower.includes('pengalaman') || lower.includes('senmonkyu')) {
      return '関連業務の実務経験者または実習修了者を歓迎します。';
    }
  }

  return text;
}

/**
 * Sanitizes a JobPosting object specifically for display on the Mitra Portal.
 * Removes all internal TSK/Agency references and provides clean partner metadata.
 */
export function sanitizeJobForMitra(job: JobPosting): JobPosting {
  const cleanTitle = getSanitizedJobTitle(job);
  const cleanCompany = getSanitizedCompany(job);

  return {
    ...job,
    judulPekerjaan: cleanTitle,
    perusahaanJepang: cleanCompany,
    // Hide confidential back-office TSK reference from Mitra
    kumiaiRujukan: '',
    tskSumberJob: 'IJEF Partner'
  };
}

/**
 * Translates candidate progress stage into Japanese or Indonesian.
 */
export function translateProgressStatus(status: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!status) return lang === 'ja' ? 'マッチング待機中' : 'Siap Matching';
  if (lang !== 'ja') return status;

  const lower = status.toLowerCase();
  if (lower.includes('lolos') || lower.includes('naitei') || lower.includes('kontrak')) {
    return '内定獲得（契約締結）';
  }
  if (lower.includes('coe') || lower.includes('visa') || lower.includes('terbang') || lower.includes('berangkat')) {
    return 'COE・ビザ申請・出国準備';
  }
  if (lower.includes('interview') || lower.includes('wawancara')) {
    return '面接選考中';
  }
  if (lower.includes('berkas') || lower.includes('seleksi')) {
    return '書類選考中';
  }
  if (lower.includes('siap') || lower.includes('matching') || lower.includes('menunggu')) {
    return 'マッチング待機中';
  }
  if (lower.includes('gagal') || lower.includes('review') || lower.includes('tolak')) {
    return '不合格・再選考';
  }

  return status;
}

/**
 * Translates job sector name to Japanese or Indonesian.
 */
export function translateSector(sector: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!sector) return lang === 'ja' ? '特定技能一般' : 'Umum';

  const lower = sector.toLowerCase().trim();
  if (lower === 'all' || lower === 'semua') {
    return lang === 'ja' ? '全業種・全分野' : 'Semua Bidang Kerja';
  }
  if (lower.includes('kaigo') || lower.includes('caregiver') || lower.includes('perawat') || lower.includes('nursing') || lower.includes('lansia') || lower.includes('介護')) {
    return lang === 'ja' ? '介護 (Kaigo)' : 'Kaigo (Caregiver)';
  }
  if (lower === 'pm' || lower.includes('makanan') || lower.includes('food') || lower.includes('pengolahan') || lower.includes('bento') || lower.includes('食品') || lower.includes('飲食')) {
    return lang === 'ja' ? '飲食料品製造業 (PM)' : 'Pengolahan Makanan (PM)';
  }
  if (lower.includes('tani') || lower.includes('pertanian') || lower.includes('agri') || lower.includes('peternakan') || lower.includes('ternak') || lower.includes('農業') || lower.includes('畜産')) {
    return lang === 'ja' ? '農業・畜産業' : 'Pertanian & Peternakan';
  }
  if (lower.includes('kikai') || lower.includes('kakou') || lower.includes('manufaktur') || lower.includes('pabrik') || lower.includes('mesin') || lower.includes('bubut') || lower.includes('機械')) {
    return lang === 'ja' ? '素形材・産業機械製造業' : 'Manufaktur & Mesin (Kikai Kakou)';
  }
  if (lower.includes('engineer') || lower.includes('gijinkoku') || lower.includes('it') || lower.includes('teknik') || lower.includes('cad') || lower.includes('技術')) {
    return lang === 'ja' ? '技術・人文知識・国際業務 (技人国)' : 'Engineering (Gijinkoku)';
  }
  if (lower.includes('konstruksi') || lower.includes('bangunan') || lower.includes('scaffolding') || lower.includes('tobi') || lower.includes('tekkin') || lower.includes('doboku') || lower.includes('建設')) {
    return lang === 'ja' ? '建設業 (Construction)' : 'Konstruksi & Bangunan';
  }
  if (lower.includes('pembersihan') || lower.includes('cleaning') || lower.includes('ビルクリーニング')) {
    return lang === 'ja' ? 'ビルクリーニング' : 'Building Cleaning';
  }
  if (lower.includes('las') || lower.includes('welder') || lower.includes('welding') || lower.includes('yousetsu') || lower.includes('溶接')) {
    return lang === 'ja' ? '溶接業 (Welding)' : 'Pengelasan (Welding)';
  }
  if (lower.includes('jahit') || lower.includes('housei') || lower.includes('tekstil')) {
    return lang === 'ja' ? '縫製業 (Sewing)' : 'Tekstil & Jahit (Housei)';
  }
  if (lower.includes('perikanan') || lower.includes('ikan') || lower.includes('fishery') || lower.includes('漁業')) {
    return lang === 'ja' ? '漁業・養殖業' : 'Perikanan & Kelautan';
  }
  if (lower.includes('restoran') || lower.includes('resto') || lower.includes('food service') || lower.includes('外食')) {
    return lang === 'ja' ? '外食業 (Food Service)' : 'Restoran & Food Service';
  }
  if (lower.includes('hotel') || lower.includes('akomodasi') || lower.includes('宿泊')) {
    return lang === 'ja' ? '宿泊業 (Hospitality)' : 'Perhotelan (Hospitality)';
  }
  if (lower.includes('otomotif') || lower.includes('mobil') || lower.includes('motor') || lower.includes('整備')) {
    return lang === 'ja' ? '自動車整備業' : 'Otomotif & Servis Kendaraan';
  }
  if (lower.includes('lainnya') || lower.includes('lain') || lower.includes('other') || lower.includes('その他')) {
    return lang === 'ja' ? 'その他業種' : 'Sektor Lainnya';
  }

  return sector;
}

export type StandardSectorKey =
  | 'KAIGO'
  | 'PM'
  | 'PERTANIAN'
  | 'KIKAI_KAKOU'
  | 'ENGINEERING'
  | 'KONSTRUKSI'
  | 'BUILDING_CLEANING'
  | 'LAINNYA';

/**
 * Standard candidate job sector normalizer shared across Admin Doc and Mitra Portal.
 * Maps any raw sector/bidang kerja string into one of 8 standardized sector keys.
 */
export function normalizeCandidateSector(sectorRaw?: string | null): StandardSectorKey {
  const s = (sectorRaw || '').toUpperCase().trim();
  if (!s) return 'LAINNYA';

  // 1. Kaigo / Caregiver
  if (
    s.includes('KAIGO') ||
    s.includes('CARE') ||
    s.includes('LANSIA') ||
    s.includes('PERAWAT') ||
    s.includes('NURSING') ||
    s.includes('介護')
  ) {
    return 'KAIGO';
  }

  // 2. Pengolahan Makanan (PM) / Food Processing
  if (
    s.includes('PENGOLAHAN MAKANAN') ||
    s.includes('MAKANAN') ||
    s.includes('FOOD') ||
    s.includes('BENTO') ||
    s.includes('PANGAN') ||
    s === 'PM' ||
    s.includes('PM ') ||
    s.includes(' PM') ||
    s.includes('(PM)') ||
    s.includes('食品') ||
    s.includes('飲食')
  ) {
    return 'PM';
  }

  // 3. Pertanian & Peternakan / Agriculture & Livestock
  if (
    s.includes('PERTANIAN') ||
    s.includes('PETERNAKAN') ||
    s.includes('AGRICULTURE') ||
    s.includes('FARMING') ||
    s.includes('TERNAK') ||
    s.includes('TANI') ||
    s.includes('KEBUN') ||
    s.includes('AGRI') ||
    s.includes('農業') ||
    s.includes('畜産')
  ) {
    return 'PERTANIAN';
  }

  // 4. Manufaktur & Pengolahan Logam / Mesin (Kikai Kakou)
  if (
    s.includes('KIKAI') ||
    s.includes('KAKOU') ||
    s.includes('MESIN') ||
    s.includes('MANUFAKTUR') ||
    s.includes('PABRIK') ||
    s.includes('BUBUT') ||
    s.includes('CNC') ||
    s.includes('LATHE') ||
    s.includes('MACHINING') ||
    s.includes('機械') ||
    s.includes('製造')
  ) {
    return 'KIKAI_KAKOU';
  }

  // 5. Engineering & IT (Gijinkoku)
  if (
    s.includes('ENGINEER') ||
    s.includes('GIJIN') ||
    s.includes('GIJINKOKU') ||
    s.includes('TEKNIK MESIN & TEKNIK INDUSTRI') ||
    s.includes('TEKNIK INDUSTRI') ||
    s.includes('TEKNIK') ||
    s.includes('CAD') ||
    s.includes('IT') ||
    s.includes('SOFTWARE') ||
    s.includes('INSINYUR') ||
    s.includes('技術')
  ) {
    return 'ENGINEERING';
  }

  // 6. Konstruksi & Bangunan / Construction
  if (
    s.includes('KONSTRUKSI') ||
    s.includes('TOBI') ||
    s.includes('DOBOKU') ||
    s.includes('TEKKIN') ||
    s.includes('KATAWAKU') ||
    s.includes('BANGUNAN') ||
    s.includes('SCAFFOLDING') ||
    s.includes('PEMBESIAN') ||
    s.includes('建設') ||
    s.includes('土木') ||
    s.includes('鉄筋')
  ) {
    return 'KONSTRUKSI';
  }

  // 7. Building Cleaning / Pembersihan Gedung
  if (
    s.includes('BUILDING') ||
    s.includes('CLEANING') ||
    s.includes('PEMBERSIHAN') ||
    s.includes('ビルクリーニング')
  ) {
    return 'BUILDING_CLEANING';
  }

  // 8. Lainnya (Lain-lain, Pengelasan, Jahit/Housei, Perikanan, dll)
  return 'LAINNYA';
}

/**
 * Translates submission type into Japanese.
 */
export function translateSubmissionType(type: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!type) return '';
  if (lang !== 'ja') {
    if (type === 'REGISTRASI_SISWA') return 'Registrasi Siswa';
    if (type === 'TAMBAH_JOB_MITRA') return 'Tambah Job Sendiri';
    return 'Pilih Job & Lamar Siswa';
  }

  if (type === 'REGISTRASI_SISWA') return '新規候補生登録';
  if (type === 'TAMBAH_JOB_MITRA') return '自社求人登録';
  return '求人応募・推薦';
}

/**
 * Translates submission status into Japanese.
 */
export function translateSubmissionStatus(status: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!status) return '';
  if (lang !== 'ja') {
    if (status === 'APPROVED' || status === 'DISETUJUI') return 'Disetujui Admin Doc';
    if (status === 'REJECTED' || status === 'DITOLAK') return 'Ditolak Admin Doc';
    if (status === 'PERLU_REVISI') return 'Perlu Revisi Admin Doc';
    return 'Menunggu Approval';
  }

  if (status === 'APPROVED' || status === 'DISETUJUI') return '本部承認済 (Admin Doc)';
  if (status === 'REJECTED' || status === 'DITOLAK') return '差戻し・却下';
  if (status === 'PERLU_REVISI') return '要修正';
  return '承認待ち';
}

/**
 * Translates application status into Japanese or Indonesian.
 */
export function translateApplicationStatus(status: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!status) return lang === 'ja' ? '選考中' : 'Dalam Proses';
  if (lang !== 'ja') return status;

  const lower = status.toLowerCase();
  if (lower.includes('lolos') || lower.includes('naitei') || lower.includes('kontrak')) {
    return '内定獲得（雇用契約締結）';
  }
  if (lower.includes('interview') || lower.includes('wawancara') || lower.includes('terjadwal')) {
    return '面接選考中（日程確定）';
  }
  if (lower.includes('berkas') || lower.includes('seleksi') || lower.includes('rirekisho')) {
    return '書類選考中（履歴書審査）';
  }
  if (lower.includes('gagal') || lower.includes('review') || lower.includes('tolak')) {
    return '選考見送り・再検討';
  }
  if (lower.includes('coe') || lower.includes('visa')) {
    return 'COE・ビザ申請手続中';
  }

  return status;
}

/**
 * Formats salary according to language (Yen/month or Japanese 円/月).
 */
export function formatSalary(job: Partial<JobPosting> | null | undefined, lang: 'id' | 'ja' = 'id'): string {
  if (!job) return lang === 'ja' ? '200,000 円 / 月' : '200,000 Yen';
  if (job.gajiString && job.gajiString.trim() !== '' && job.gajiString !== '-') {
    if (lang === 'ja') {
      let str = job.gajiString;
      str = str.replace(/yen/gi, '円').replace(/bulan/gi, '月').replace(/per\s*bulan/gi, '月額');
      return str;
    }
    return job.gajiString;
  }
  const yen = job.gajiBulananYen ? job.gajiBulananYen.toLocaleString() : '200,000';
  return lang === 'ja' ? `${yen} 円 / 月` : `${yen} Yen`;
}

/**
 * Formats gender requirement according to language.
 */
export function formatGender(gender: string | undefined | null, lang: 'id' | 'ja' = 'id'): string {
  if (!gender || gender === '-' || gender === '0') return lang === 'ja' ? '不問（男女問わず）' : 'Bebas';
  if (lang !== 'ja') return gender;

  const lower = gender.toLowerCase();
  if (lower.includes('男') || lower.includes('pria') || lower.includes('laki')) {
    if (lower.includes('perempuan') || lower.includes('wanita') || lower.includes('bebas')) {
      return '不問（男女問わず）';
    }
    return '男性';
  }
  if (lower.includes('女') || lower.includes('perempuan') || lower.includes('wanita')) {
    return '女性';
  }
  return '不問（男女問わず）';
}



