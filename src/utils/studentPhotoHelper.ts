import React from 'react';

/**
 * Utility Helper for Standardized Student & Candidate Photo Resolution
 * Ensures consistent, high-definition 4x6 / 3x4 / 2R photo resolution
 * across Portal Admin Siswa, Portal Mitra, and Portal Admin Doc (CV-Rirekisho).
 *
 * NOTE: If no photo is attached in the database/Firebase, it strictly returns empty string ('')
 * so that the UI can clearly display a blank/empty photo frame.
 * Missing photos MUST NOT be replaced with AI-generated or dummy stock images.
 */

/**
 * Normalizes any image URL (Google Drive share links, Firebase Storage, HTTP/S, data URI, blob)
 * into a directly displayable image link.
 * Google Drive share/view/open links are converted to direct high-res image thumbnail links.
 */
export function normalizeDisplayImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (trimmed.length < 5) return '';

  // Data URLs, blobs, or already proxied links
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:') || trimmed.startsWith('/api/proxy-image')) {
    return trimmed;
  }

  // Firebase Storage direct URLs (already return direct images with tokens or public access)
  if (trimmed.includes('firebasestorage.googleapis.com')) {
    return trimmed;
  }

  // Google Drive links handling
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('drive.usercontent.google.com') ||
    trimmed.includes('lh3.googleusercontent.com')
  ) {
    // If it is a Drive folder link (e.g. drive.google.com/drive/folders/...), it cannot be rendered as an img
    if (trimmed.includes('/folders/')) {
      return '';
    }

    // Extract Google Drive File ID from any possible URL format:
    // e.g. /file/d/1MolN3cw8hNnwn4P-gcwynl2vYb6UpM4P/view?usp=drivesdk
    // e.g. /d/1tgIbyoH9meVwM6b_P3pYQ7eNkfubPLZq
    // e.g. ?id=1tgIbyoH9meVwM6b_P3pYQ7eNkfubPLZq
    // e.g. /open?id=...
    // e.g. /uc?id=...
    let fileId = '';
    const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      fileId = fileDMatch[1];
    } else {
      const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (dMatch && dMatch[1]) {
        fileId = dMatch[1];
      } else {
        const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idParamMatch && idParamMatch[1]) {
          fileId = idParamMatch[1];
        }
      }
    }

    if (fileId) {
      // Google Drive direct image CDN URL reliably outputs image without 403 blocks
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}

/**
 * Detects whether a photo URL is an AI-generated portrait, dummy stock photo,
 * or placeholder avatar (e.g. Unsplash models, Pravatar, DiceBear) which
 * must NEVER replace real candidate photos when absent.
 */
export function isAiOrPlaceholderPhoto(url?: string | string[] | null): boolean {
  if (!url) return false;
  const target = Array.isArray(url) ? url[0] : url;
  if (!target || typeof target !== 'string') return false;
  const trimmed = target.trim().toLowerCase();
  if (trimmed.length === 0) return false;
  return (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('unsplash.com') ||
    trimmed.includes('pravatar.cc') ||
    trimmed.includes('ui-avatars.com') ||
    trimmed.includes('dicebear.com') ||
    trimmed.includes('thispersondoesnotexist.com') ||
    trimmed.includes('pollinations.ai') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('avatar.iran.liara.run') ||
    trimmed.includes('robohash.org') ||
    trimmed.includes('dummyimage.com')
  );
}

/**
 * Resolves the photo URL from any Student or Rirekisho object.
 * Returns the valid URL if present, or an empty string '' if not yet uploaded.
 * Any AI-generated or stock placeholder image is filtered out so the photo remains blank.
 */
export function getStudentPhotoUrl(
  student?: any,
  rirekisho?: any
): string {
  if (!student && !rirekisho) return '';

  const candidates: any[] = [
    typeof student === 'string' ? student : null,
    typeof rirekisho === 'string' ? rirekisho : null,

    // Rirekisho direct properties from Firestore / App state
    rirekisho?.pasPhoto,
    rirekisho?.pasFoto,
    rirekisho?.pasFotoUrl,
    rirekisho?.pasPhotoUrl,
    rirekisho?.pas_foto,
    rirekisho?.pas_photo,
    rirekisho?.fotoUrl,
    rirekisho?.photoUrl,
    rirekisho?.foto_url,
    rirekisho?.photo_url,
    rirekisho?.url_foto,
    rirekisho?.avatarUrl,
    rirekisho?.foto,
    rirekisho?.photo,
    rirekisho?.avatar,
    rirekisho?.imageUrl,

    // Rirekisho dokumenUpload
    rirekisho?.dokumenUpload?.pasPhoto,
    rirekisho?.dokumenUpload?.pasFoto,
    rirekisho?.dokumenUpload?.pasPhoto3x4,
    rirekisho?.dokumenUpload?.pasFotoUrl,
    rirekisho?.dokumenUpload?.pasPhotoUrl,
    rirekisho?.dokumenUpload?.foto,
    rirekisho?.dokumenUpload?.fotoUrl,

    // Student berkasDokumen
    student?.berkasDokumen?.pasFoto,
    student?.berkasDokumen?.pasPhoto,
    student?.berkasDokumen?.pasPhoto3x4,
    student?.berkasDokumen?.pasFotoUrl,
    student?.berkasDokumen?.pasPhotoUrl,
    student?.berkasDokumen?.foto,
    student?.berkasDokumen?.fotoUrl,

    // Student direct properties
    student?.pasPhoto,
    student?.pasFoto,
    student?.pasFotoUrl,
    student?.pasPhotoUrl,
    student?.pas_foto,
    student?.pas_photo,
    student?.avatarUrl,
    student?.photoUrl,
    student?.fotoUrl,
    student?.foto_url,
    student?.photo_url,
    student?.url_foto,
    student?.foto,
    student?.photo,
    student?.avatar,
    student?.imageUrl,

    // Student dokumenUpload
    student?.dokumenUpload?.pasPhoto,
    student?.dokumenUpload?.pasFoto,
    student?.dokumenUpload?.pasPhoto3x4,
    student?.dokumenUpload?.pasFotoUrl,
    student?.dokumenUpload?.foto,
    student?.dokumenUpload?.fotoUrl,

    // Nested wrappers (rawStudent, rawCV)
    student?.rawStudent?.berkasDokumen?.pasFoto,
    student?.rawStudent?.pasPhoto,
    student?.rawStudent?.pasFoto,
    student?.rawCV?.pasPhoto,
    student?.rawCV?.pasFotoUrl,
    student?.rawCV?.pasFoto,
    rirekisho?.rawCV?.pasPhoto,
    rirekisho?.rawCV?.pasFotoUrl,
    rirekisho?.rawStudent?.berkasDokumen?.pasFoto,
    rirekisho?.rawStudent?.pasPhoto
  ];

  for (const url of candidates) {
    if (typeof url === 'string') {
      const trimmed = url.trim();
      // Strictly ignore any AI generated image, stock model, or dummy placeholder
      if (isAiOrPlaceholderPhoto(trimmed)) {
        continue;
      }
      if (trimmed.length > 4) {
        const normalized = normalizeDisplayImageUrl(trimmed);
        if (
          normalized &&
          (normalized.startsWith('http://') ||
            normalized.startsWith('https://') ||
            normalized.startsWith('data:image/') ||
            normalized.startsWith('blob:') ||
            normalized.startsWith('/'))
        ) {
          return normalized;
        }
      }
    }
  }

  return '';
}

/**
 * Helper to check if a student has an uploaded photo
 */
export function hasStudentPhoto(student?: any, rirekisho?: any): boolean {
  return Boolean(getStudentPhotoUrl(student, rirekisho));
}

/**
 * Image error handler that cleans up broken image links with resilient backend proxy retry
 */
export function handleStudentImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  _name?: string,
  _gender?: string
) {
  const target = e.currentTarget;
  const currentSrc = target.src;

  // First retry attempt through server-side proxy if remote HTTP(S) URL and not already retried
  if (
    currentSrc &&
    currentSrc.startsWith('http') &&
    !currentSrc.includes('/api/proxy-image') &&
    !target.dataset.retriedProxy
  ) {
    target.dataset.retriedProxy = 'true';
    target.src = `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
    return;
  }

  target.style.display = 'none';
  if (target.parentElement) {
    target.parentElement.classList.add('broken-image-fallback');
  }
}
