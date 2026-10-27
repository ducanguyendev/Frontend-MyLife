import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { apiClient } from '@/shared/api/apiClient';

interface LibraryImageProps {
  photoId?: number;
  url?: string | null;
  driveFileId?: string | null;
  alt: string;
  className?: string;
  variant?: 'thumbnail' | 'lightbox';
}

export function libraryOriginalUrl(url: string, driveFileId?: string | null) {
  return driveFileId?.trim() ? `https://drive.google.com/file/d/${encodeURIComponent(driveFileId.trim())}/view` : url;
}

export function LibraryImage({ photoId, variant = 'lightbox', ...props }: LibraryImageProps) {
  const { url: legacyUrl, driveFileId: legacyDriveFileId, ...displayProps } = props;
  void legacyUrl; void legacyDriveFileId;
  const source = photoId && photoId > 0 ? apiClient.url(`/api/library/photos/${photoId}/image`) : '';
  return <LibraryImageDisplay key={`${photoId ?? 'missing'}:${variant}`} {...displayProps} variant={variant} source={source} />;
}

function LibraryImageDisplay({ source, alt, className, variant }: LibraryImageProps & { source: string }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (!source || failed) return <div role="img" aria-label={`${alt}: ${t('admin.library_ui.image_failed')}`}
    className={`flex flex-col items-center justify-center gap-2 min-h-24 bg-secondary-bg text-secondary-text ${className ?? ''}`}>
    <ImageOff size={28} /><span className="text-xs">{t('admin.library_ui.image_failed')}</span>
  </div>;
  return <img loading={variant === 'thumbnail' ? 'lazy' : 'eager'} decoding="async" src={source} alt={alt} className={className}
    onError={() => setFailed(true)} />;
}
