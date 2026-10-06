import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button, Modal } from '@/shared/components/ui';
import { getFeatureErrorKey } from '../../services/featureMessages';
import { type LibraryAlbum, type LibraryCategory, type LibraryPhotoMetadata } from '../../services/libraryService';
import { LibraryPhotoFormFields, libraryFieldClass, LibrarySelectField } from './LibraryPhotoFormFields';

export function LibraryUploadModal({ albums, categories, initialAlbumId, initialCategory, onClose, onSubmit }: {
  albums: LibraryAlbum[]; categories: LibraryCategory[]; initialAlbumId?: number; initialCategory: string;
  onClose: () => void; onSubmit: (albumId: number, files: File[], metadata: LibraryPhotoMetadata) => Promise<void>;
}) {
  const { t, language } = useLanguage();
  const [albumId, setAlbumId] = useState(initialAlbumId ? String(initialAlbumId) : '');
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<LibraryPhotoMetadata>({ category: categories.some(c => c.slug === initialCategory)
    ? initialCategory : categories.find(c => c.slug === 'photos')?.slug ?? categories[0]?.slug ?? '' });
  const [previews, setPreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const selected = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPreviews(selected);
    return () => selected.forEach(preview => URL.revokeObjectURL(preview.previewUrl));
  }, [files]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isUploading) return;
    if (!albumId || !albums.some(album => album.id === Number(albumId))) { setError('admin.library_ui.album_required'); return; }
    if (!categories.some(category => category.slug === metadata.category)) { setError('admin.library_ui.category_required'); return; }
    if (files.length === 0) { setError('admin.library_ui.images_required'); return; }
    if (files.length > 20) { setError('admin.library_ui.file_count'); return; }
    if (files.some(file => file.size === 0 || file.size > 5 * 1024 * 1024)) { setError('admin.library_ui.file_size'); return; }
    if (files.some(file => !['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type.toLowerCase()))) { setError('admin.library_ui.file_invalid'); return; }
    setIsUploading(true); setError(null);
    try { await onSubmit(Number(albumId), files, metadata); }
    catch (failure) { setError(getFeatureErrorKey(failure, 'photo_upload')); }
    finally { if (input.current) input.current.value = ''; setIsUploading(false); }
  };
  return <Modal isOpen onClose={() => { if (!isUploading) onClose(); }} title={t('admin.library_ui.upload')}
    description={t('admin.library_ui.upload_hint')} maxWidth="lg" closeOnBackdropClick={!isUploading} closeOnEsc={!isUploading}>
    <form onSubmit={submit} noValidate className="space-y-4">
      <LibrarySelectField label={t('admin.library_ui.field_album')} value={albumId} disabled={isUploading} onChange={e => setAlbumId(e.target.value)}>
          <option value="">{t('admin.library_ui.choose_album')}</option>
          {albums.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}
      </LibrarySelectField>
      <label className="block text-sm text-secondary-text">{t('admin.library_ui.field_images')}
        <input ref={input} className={`${libraryFieldClass} mt-1.5`} type="file" multiple
          accept="image/jpeg,image/png,image/webp,image/gif" disabled={isUploading}
          onChange={e => { setFiles(Array.from(e.target.files ?? [])); setError(null); e.target.value = ''; }} />
      </label>
      {previews.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" aria-label={t('admin.library_ui.preview')}>
        {previews.map((preview, index) => <div key={preview.previewUrl} className="relative rounded-2xl border border-custom-border overflow-hidden bg-primary-bg">
          <img src={preview.previewUrl} alt={preview.file.name} className="w-full aspect-video object-cover" />
          <button type="button" disabled={isUploading} aria-label={t('admin.library_ui.remove_image', { name: preview.file.name })}
            className="absolute top-1 right-1 p-1.5 rounded-full bg-black/70 text-white cursor-pointer disabled:opacity-50"
            onClick={() => setFiles(current => current.filter((_, position) => position !== index))}><X size={14} /></button>
          <div className="p-2"><p className="text-xs text-primary-text truncate" title={preview.file.name}>{preview.file.name}</p>
            <p className="text-[11px] text-secondary-text">{new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(preview.file.size / (preview.file.size >= 1024 * 1024 ? 1024 * 1024 : 1024))} {preview.file.size >= 1024 * 1024 ? 'MB' : 'KB'}</p></div>
        </div>)}
      </div>}
      <LibraryPhotoFormFields value={metadata} onChange={setMetadata} disabled={isUploading} categories={categories} />
      {error && <p role="alert" className="text-sm text-error">{t(error)}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" disabled={isUploading} onClick={onClose}>{t('admin.library_ui.cancel')}</Button>
        <Button type="submit" isLoading={isUploading}>{t('admin.library_ui.upload')}</Button>
      </div>
    </form>
  </Modal>;
}
