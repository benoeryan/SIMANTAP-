import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Video,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileCheck,
  AlertCircle,
  Play
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  candidateName?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileName,
  fileType,
  candidateName
}) => {
  const { lang } = useApp();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen || !fileUrl || !fileUrl.trim()) return null;

  const url = fileUrl.trim();
  const lowerUrl = url.toLowerCase();

  // Helper to determine media type
  const isDataUrl = url.startsWith('data:');
  const isImage =
    lowerUrl.includes('.jpg') ||
    lowerUrl.includes('.jpeg') ||
    lowerUrl.includes('.png') ||
    lowerUrl.includes('.webp') ||
    lowerUrl.includes('.gif') ||
    lowerUrl.includes('.svg') ||
    lowerUrl.startsWith('data:image/');

  const isVideo =
    lowerUrl.includes('.mp4') ||
    lowerUrl.includes('.webm') ||
    lowerUrl.includes('.mov') ||
    lowerUrl.includes('.mkv') ||
    lowerUrl.includes('.avi') ||
    lowerUrl.includes('youtube.com') ||
    lowerUrl.includes('youtu.be') ||
    lowerUrl.includes('loom.com') ||
    lowerUrl.startsWith('data:video/');

  const isPdf = lowerUrl.includes('.pdf') || lowerUrl.startsWith('data:application/pdf');

  const isGoogleDrive = lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com');

  // Format Google Drive embed URL
  let embedUrl = url;
  if (isGoogleDrive) {
    if (url.includes('/view')) {
      embedUrl = url.replace(/\/view.*$/, '/preview');
    } else if (url.includes('/edit')) {
      embedUrl = url.replace(/\/edit.*$/, '/preview');
    } else if (url.includes('id=')) {
      const match = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    } else if (!url.includes('/preview')) {
      embedUrl = `${url.replace(/\/$/, '')}/preview`;
    }
  }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (isDataUrl || !isGoogleDrive) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `${title.replace(/\s+/g, '_')}_${candidateName || 'file'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              {isImage ? (
                <ImageIcon className="w-4 h-4 text-white" />
              ) : isVideo ? (
                <Video className="w-4 h-4 text-white" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white truncate">{title}</h3>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono shrink-0">
                  {isImage ? 'IMAGE' : isVideo ? 'VIDEO' : isPdf ? 'PDF' : isGoogleDrive ? 'G-DRIVE' : 'DOCUMENT'}
                </span>
              </div>
              {candidateName && (
                <p className="text-[11px] text-slate-400 truncate">{lang === 'ja' ? '候補者:' : 'Kandidat:'} {candidateName}</p>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title={lang === 'ja' ? '拡大' : 'Zoom In'}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title={lang === 'ja' ? '縮小' : 'Zoom Out'}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title={lang === 'ja' ? '回転' : 'Rotate'}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleDownload}
              title={lang === 'ja' ? 'ダウンロード / ファイルを開く' : 'Unduh / Buka File'}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ja' ? 'ダウンロード' : 'Unduh'}</span>
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={lang === 'ja' ? '新しいタブで開く' : 'Buka di Tab Baru'}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center transition"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-rose-900/80 text-slate-400 hover:text-white rounded-lg transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center min-h-[360px] max-h-[72vh] relative">
          {/* 1. Image Viewer */}
          {isImage && (
            <div className="flex items-center justify-center w-full h-full overflow-hidden">
              <img
                src={url}
                alt={title}
                referrerPolicy="no-referrer"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md select-none"
              />
            </div>
          )}

          {/* 2. Video Player */}
          {isVideo && !isGoogleDrive && (
            <div className="w-full h-full max-h-[65vh] flex items-center justify-center">
              {lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') ? (
                <iframe
                  src={url.replace('watch?v=', 'embed/')}
                  title={title}
                  className="w-full h-[60vh] max-w-3xl rounded-xl border border-slate-800 shadow-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : lowerUrl.includes('loom.com') ? (
                <iframe
                  src={url.replace('/share/', '/embed/')}
                  title={title}
                  className="w-full h-[60vh] max-w-3xl rounded-xl border border-slate-800 shadow-lg"
                  allowFullScreen
                />
              ) : (
                <video
                  src={url}
                  controls
                  autoPlay
                  className="max-h-[65vh] max-w-full rounded-xl shadow-lg border border-slate-800"
                >
                  {lang === 'ja' ? 'お使いのブラウザはHTML5動画再生をサポートしていません。' : 'Browser Anda tidak mendukung pemutar video HTML5.'}
                </video>
              )}
            </div>
          )}

          {/* 3. Google Drive / Docs / Video Embed */}
          {isGoogleDrive && (
            <div className="w-full h-full min-h-[55vh] flex flex-col">
              <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-t-xl border border-slate-800 text-xs text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>{lang === 'ja' ? 'Google ドライブ ドキュメントビューアー' : 'Google Drive Document Viewer'}</span>
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-semibold underline"
                >
                  {lang === 'ja' ? 'Google ドライブで直接開く →' : 'Buka langsung di Google Drive →'}
                </a>
              </div>
              <iframe
                src={embedUrl}
                title={title}
                className="w-full flex-1 min-h-[50vh] rounded-b-xl border border-t-0 border-slate-800 bg-white"
                allow="autoplay"
              />
            </div>
          )}

          {/* 4. PDF Viewer */}
          {isPdf && !isGoogleDrive && (
            <div className="w-full h-full min-h-[58vh]">
              <iframe
                src={url}
                title={title}
                className="w-full h-full min-h-[58vh] rounded-xl border border-slate-800 bg-white"
              />
            </div>
          )}

          {/* 5. Generic Document / Download Card Fallback */}
          {!isImage && !isVideo && !isPdf && !isGoogleDrive && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">{title}</h4>
                <p className="text-xs text-slate-400 break-all font-mono">
                  {fileName || url}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ja' ? 'ドキュメントをダウンロード' : 'Unduh Dokumen'}</span>
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{lang === 'ja' ? '新しいタブで開く' : 'Buka di Tab Baru'}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">{lang === 'ja' ? 'リンク / ソース:' : 'Tautan / Sumber:'}</span>
            <span className="font-mono text-slate-500 truncate max-w-xs sm:max-w-md block">
              {url}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition cursor-pointer"
          >
            {lang === 'ja' ? 'プレビューを閉じる' : 'Tutup Pratinjau'}
          </button>
        </div>
      </div>
    </div>
  );
};
