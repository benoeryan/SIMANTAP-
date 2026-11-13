/**
 * Easy-Edit UI Showcase & Banner Configuration for SIMANTAP IJEF CORP
 * Centralizes editable banners, cover photos, hero texts, and sector image maps.
 */

export interface SectorCoverImage {
  id: string;
  name: string;
  jpName: string;
  imageUrl: string;
  jobCount: number;
  description: string;
}

export interface TrainingBannerItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  buttonText: string;
  imageUrl: string;
  linkUrl?: string;
  accentColor: string;
}

export interface UiShowcaseConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroTagline: string;
  defaultJobPhotoUrl: string;
  defaultCandidatePhotoUrl: string;
  sectorCovers: SectorCoverImage[];
  trainingBanners: TrainingBannerItem[];
}

export const DEFAULT_UI_SHOWCASE_CONFIG: UiShowcaseConfig = {
  heroTitle: 'PUSAT MANAJEMEN KANDIDAT & JOB MATCHING JEPANG',
  heroSubtitle: 'Sistem Terpadu Verifikasi Berkas, Otomatisasi Terjemahan Rirekisho JIS, dan Pengawasan LPK IJEF CORP',
  heroTagline: 'Menghubungkan Perusahaan Jepang, Kumiai, TSK, dan LPK Mitra dengan Kandidat Terlatih',
  defaultJobPhotoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=800&auto=format&fit=crop',
  defaultCandidatePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
  sectorCovers: [
    {
      id: 'kaigo',
      name: 'KAIGO (Perawat Lansia)',
      jpName: '介護 (Nursing Care)',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop',
      jobCount: 42,
      description: 'Layanan keperawatan profesional di panti lansia & rumah sakit Jepang.'
    },
    {
      id: 'food',
      name: 'Pengolahan Makanan',
      jpName: '食品製造 (Food Processing)',
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
      jobCount: 38,
      description: 'Pabrik makanan instan, bento, pengalengan, dan kue di Jepang.'
    },
    {
      id: 'welder',
      name: 'Konstruksi & Welder',
      jpName: '建設・溶接 (Welding & Construction)',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop',
      jobCount: 29,
      description: 'Pengelasan, fabrikasi baja, pengecoran, dan instalasi konstruksi.'
    },
    {
      id: 'agriculture',
      name: 'Pertanian & Peternakan',
      jpName: '農業・畜産 (Agriculture)',
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop',
      jobCount: 25,
      description: 'Budidaya sayur hidroponik, buah-buahan, dan peternakan sapi/ayam.'
    },
    {
      id: 'manufacture',
      name: 'Manufaktur & Otomotif',
      jpName: '製造業 (Manufacturing)',
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop',
      jobCount: 31,
      description: 'Perakitan komponen mesin, sparepart mobil, dan plastik molding.'
    },
    {
      id: 'hotel',
      name: 'Perhotelan & Hospitality',
      jpName: '宿泊・ホテル (Hotel Services)',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop',
      jobCount: 18,
      description: 'Layanan resepsionis hotel, Ryokan tradisional, dan room maid.'
    }
  ],
  trainingBanners: [
    {
      id: 'jft-prep',
      title: 'Program Intensif JFT-Basic A2 & JLPT N4',
      subtitle: 'Simulasi ujian online berbasis komputer + Kunci Kosakata Khusus Kaigo & Industri.',
      badge: 'PROMO PELATIHAN',
      buttonText: 'Daftar Kelas Baru',
      imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-red-700 to-rose-900'
    },
    {
      id: 'coe-guide',
      title: 'Panduan Pengurusan COE & Visa SSW 2026',
      subtitle: 'Prosedur penerbitan dokumen Naitei dari Kumiai & TSK hingga terbang ke Jepang.',
      badge: 'ALUR DOKUMEN',
      buttonText: 'Pelajari Panduan',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop',
      accentColor: 'from-zinc-900 to-zinc-950'
    }
  ]
};

const UI_CONFIG_STORAGE_KEY = 'simantap_ui_showcase_config';

/**
 * Retrieves the current active UI showcase config (from localStorage if edited, or defaults)
 */
export function getStoredUiShowcaseConfig(): UiShowcaseConfig {
  try {
    const raw = localStorage.getItem(UI_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_UI_SHOWCASE_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse stored UI config:', err);
  }
  return DEFAULT_UI_SHOWCASE_CONFIG;
}

/**
 * Saves updated UI showcase config to localStorage
 */
export function saveUiShowcaseConfig(config: UiShowcaseConfig): boolean {
  try {
    localStorage.setItem(UI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (err) {
    console.error('Failed to save UI config:', err);
    return false;
  }
}
