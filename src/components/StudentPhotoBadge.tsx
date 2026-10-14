import React, { useState } from 'react';
import { CameraOff, ZoomIn, User } from 'lucide-react';
import { getStudentPhotoUrl, isAiOrPlaceholderPhoto } from '../utils/studentPhotoHelper';

export interface StudentPhotoBadgeProps {
  photoUrl?: string;
  student?: any;
  rirekisho?: any;
  namaLengkap?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  aspectRatio?: '2/3' | '3/4' | '1/1';
  ratioLabel?: string; // e.g. '4×6' or '3×4'
  onZoomClick?: () => void;
  showZoomButton?: boolean;
  isNew?: boolean;
  lang?: 'id' | 'ja';
  bordered?: boolean;
  theme?: 'emerald' | 'indigo' | 'purple' | 'slate' | 'amber';
}

export const StudentPhotoBadge: React.FC<StudentPhotoBadgeProps> = ({
  photoUrl,
  student,
  rirekisho,
  namaLengkap = '',
  size = 'md',
  className = '',
  aspectRatio = '2/3',
  ratioLabel = '4×6',
  onZoomClick,
  showZoomButton = true,
  isNew = false,
  lang = 'id',
  bordered = true,
  theme = 'slate'
}) => {
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const resolvedName = namaLengkap || student?.namaLengkap || rirekisho?.namaLengkap || 'Siswa';
  const rawUrl = typeof photoUrl === 'string' && photoUrl.trim().length > 0
    ? photoUrl.trim()
    : getStudentPhotoUrl(student, rirekisho);

  React.useEffect(() => {
    setImageError(false);
    setUseProxy(false);
  }, [rawUrl, student?.id, rirekisho?.id]);

  const cleanPhoto = !imageError && rawUrl && !isAiOrPlaceholderPhoto(rawUrl) ? rawUrl.trim() : '';
  const currentSrc = useProxy && cleanPhoto.startsWith('http') && !cleanPhoto.includes('/api/proxy-image')
    ? `/api/proxy-image?url=${encodeURIComponent(cleanPhoto)}`
    : cleanPhoto;
  const hasPhoto = Boolean(cleanPhoto && cleanPhoto.length > 0);

  // Determine size classes
  let sizeClass = '';
  switch (size) {
    case 'xs':
      sizeClass = 'w-9 sm:w-10';
      break;
    case 'sm':
      sizeClass = 'w-10 sm:w-12';
      break;
    case 'md':
      sizeClass = 'w-14 sm:w-16';
      break;
    case 'lg':
      sizeClass = 'w-20 sm:w-24';
      break;
    case 'xl':
      sizeClass = 'w-32 sm:w-36';
      break;
    case '2xl':
      sizeClass = 'w-48 sm:w-56';
      break;
    case 'custom':
    default:
      sizeClass = '';
      break;
  }

  // Aspect ratio class
  let aspectClass = 'aspect-[2/3]';
  if (aspectRatio === '3/4') aspectClass = 'aspect-[3/4]';
  if (aspectRatio === '1/1') aspectClass = 'aspect-square';

  // Border theme
  let borderTheme = 'border-slate-200';
  if (theme === 'emerald') borderTheme = 'border-emerald-200 hover:border-emerald-400';
  if (theme === 'purple') borderTheme = 'border-purple-200 hover:border-purple-400';
  if (theme === 'indigo') borderTheme = 'border-indigo-200 hover:border-indigo-400';
  if (theme === 'amber') borderTheme = 'border-amber-200 hover:border-amber-400';

  if (hasPhoto) {
    return (
      <div
        onClick={onZoomClick}
        className={`relative flex-shrink-0 ${aspectClass} rounded-xl overflow-hidden bg-slate-100 ${
          bordered ? `border-2 ${borderTheme}` : ''
        } shadow-xs transition-all duration-200 ${
          onZoomClick ? 'cursor-pointer group/foto ring-2 ring-slate-100 hover:ring-indigo-100' : ''
        } ${sizeClass} ${className}`}
        title={onZoomClick ? `Klik untuk melihat Pas Foto ${ratioLabel} ${resolvedName}` : `Pas Foto ${ratioLabel} ${resolvedName}`}
      >
        <img
          src={currentSrc}
          alt={resolvedName}
          referrerPolicy="no-referrer"
          onError={() => {
            if (!useProxy && cleanPhoto.startsWith('http') && !cleanPhoto.includes('/api/proxy-image')) {
              setUseProxy(true);
            } else {
              setImageError(true);
            }
          }}
          className={`w-full h-full object-cover object-top ${
            onZoomClick ? 'group-hover/foto:scale-105 transition-transform duration-300' : ''
          }`}
        />

        {onZoomClick && showZoomButton && (
          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/foto:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[0.5px]">
            <ZoomIn className="w-4 h-4 text-amber-300 drop-shadow" />
          </div>
        )}

        <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[6.5px] sm:text-[7px] text-white text-center font-bold font-mono tracking-tight py-0.5 select-none pointer-events-none">
          {ratioLabel}
        </span>

        {isNew && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[7.5px] px-1 py-0.2 rounded font-black tracking-tight shadow-xs">
            BARU
          </span>
        )}
      </div>
    );
  }

  // EMPTY STATE: Clean neutral blank placeholder (NOT replaced with AI image)
  const isCompact = size === 'xs' || size === 'sm';

  return (
    <div
      className={`relative flex-shrink-0 ${aspectClass} rounded-xl overflow-hidden bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-1 select-none ${sizeClass} ${className}`}
      title={lang === 'ja' ? '写真未登録 (Foto Kosong / Belum Ada)' : 'Foto belum di-upload (kosong)'}
    >
      <div className="flex flex-col items-center justify-center flex-1 w-full px-0.5">
        <User
          className={`${
            isCompact ? 'w-3.5 h-3.5' : size === 'lg' || size === 'xl' || size === '2xl' ? 'w-6 h-6' : 'w-4 h-4'
          } text-slate-400 mb-0.5 shrink-0`}
        />
        {isCompact ? (
          <span className="text-[6.5px] font-bold text-slate-500 leading-[8px] tracking-tight block max-w-full truncate">
            {lang === 'ja' ? '未登録' : 'Kosong'}
          </span>
        ) : (
          <div className="space-y-0.5">
            <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 leading-tight block">
              {lang === 'ja' ? '写真未登録' : 'Foto Kosong'}
            </span>
            <span className="text-[6.5px] sm:text-[7px] text-slate-400 font-medium block">
              {lang === 'ja' ? '未添付' : 'Belum Ada Foto'}
            </span>
          </div>
        )}
      </div>

      <span className="w-full bg-slate-200 text-[6px] sm:text-[6.5px] text-slate-600 text-center font-bold font-mono tracking-tight py-0.2 select-none">
        {ratioLabel} {lang === 'ja' ? '空' : 'KOSONG'}
      </span>

      {isNew && (
        <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[7.5px] px-1 py-0.2 rounded font-black tracking-tight shadow-xs">
          BARU
        </span>
      )}
    </div>
  );
};
