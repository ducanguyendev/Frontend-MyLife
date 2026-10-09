import { useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface LibraryImageProps {
  photoId?: number;
  url?: string | null;
  driveFileId?: string | null;
  alt: string;
  className?: string;
  variant?: 'thumbnail' | 'lightbox';
}

function sizedPrimary(url: string | undefined, width: number): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.origin === 'https://drive.google.com' && parsed.pathname === '/thumbnail' && parsed.searchParams.get('id')) {
      // Canonical order/size prevents an equivalent stored thumbnail being retried.
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(parsed.searchParams.get('id')!)}&sz=w${width}`;
    }
    if (parsed.origin === 'https://lh3.googleusercontent.com' && /^\/d\/[^/]+$/.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.replace(/=w\d+(?:-h\d+)?$/, '') + `=w${width}`;
      return parsed.toString();
    }
  } catch { /* Keep legacy/custom URLs as the primary candidate. */ }
  return url;
}

export function libraryImageCandidates(url?: string | null, driveFileId?: string | null, variant: 'thumbnail' | 'lightbox' = 'lightbox'): string[] {
  const id = driveFileId?.trim();
  const width = variant === 'thumbnail' ? 640 : 1600;
  const primary = sizedPrimary(url?.trim() || undefined, width);
  // The alternate Google delivery endpoint is one fallback, never a retry loop.
  return [...new Set([primary, id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${width}` : undefined]
    .filter((candidate): candidate is string => Boolean(candidate)))];
}

export function libraryOriginalUrl(url: string, driveFileId?: string | null) {
  return driveFileId?.trim() ? `https://drive.google.com/file/d/${encodeURIComponent(driveFileId.trim())}/view` : url;
}

export function LibraryImage({ photoId, url, driveFileId, variant = 'lightbox', ...props }: LibraryImageProps) {
  const primaryUrl = url?.trim() || '';
  const fileId = driveFileId?.trim() || '';
  const candidates = useMemo(() => libraryImageCandidates(primaryUrl, fileId, variant), [primaryUrl, fileId, variant]);
  // Only a real photo identity change starts a fresh attempt sequence.
  const identity = JSON.stringify([photoId ?? null, fileId, primaryUrl, variant]);
  return <LibraryImageAttempts key={identity} {...props} variant={variant} candidates={candidates} />;
}

function LibraryImageAttempts({ candidates, alt, className, variant }: LibraryImageProps & { candidates: string[] }) {
  const { t } = useLanguage();
  const [candidateIndex, setCandidateIndex] = useState(0);
  if (candidateIndex >= candidates.length) return <div role="img" aria-label={`${alt}: ${t('admin.library_ui.image_failed')}`}
    className={`flex flex-col items-center justify-center gap-2 min-h-24 bg-secondary-bg text-secondary-text ${className ?? ''}`}>
    <ImageOff size={28} /><span className="text-xs">{t('admin.library_ui.image_failed')}</span>
  </div>;
  return <img loading={variant === 'thumbnail' ? 'lazy' : 'eager'} decoding="async" src={candidates[candidateIndex]} alt={alt} className={className}
    onError={() => setCandidateIndex(current => current === candidateIndex ? Math.min(current + 1, candidates.length) : current)} />;
}
