import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';

interface LibraryImageProps { url?: string | null; driveFileId?: string | null; alt: string; className?: string }
export function libraryImageCandidates(url?: string | null, driveFileId?: string | null): string[] {
  const id = driveFileId?.trim();
  return [...new Set([url?.trim(), id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600` : undefined]
    .filter((candidate): candidate is string => Boolean(candidate)))];
}
export function libraryOriginalUrl(url: string, driveFileId?: string | null) {
  return driveFileId?.trim() ? `https://drive.google.com/file/d/${encodeURIComponent(driveFileId.trim())}/view` : url;
}
export function LibraryImage(props: LibraryImageProps) {
  const candidates = libraryImageCandidates(props.url, props.driveFileId);
  return <LibraryImageAttempts key={JSON.stringify(candidates)} {...props} candidates={candidates} />;
}
function LibraryImageAttempts({ candidates, alt, className }: LibraryImageProps & { candidates: string[] }) {
  const { t } = useLanguage();
  const [candidateIndex, setCandidateIndex] = useState(0);
  if (candidateIndex >= candidates.length) return <div role="img" aria-label={`${alt}: ${t('admin.library_ui.image_failed')}`}
    className={`flex flex-col items-center justify-center gap-2 min-h-24 bg-secondary-bg text-secondary-text ${className ?? ''}`}>
    <ImageOff size={28} /><span className="text-xs">{t('admin.library_ui.image_failed')}</span>
  </div>;
  return <img key={candidates[candidateIndex]} src={candidates[candidateIndex]} alt={alt} className={className}
    onError={() => setCandidateIndex(current => current === candidateIndex ? current + 1 : current)} />;
}
