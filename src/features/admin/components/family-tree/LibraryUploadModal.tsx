import { useRef, useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button, Modal } from '@/shared/components/ui';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { type LibraryAlbum, type LibraryCategory, type LibraryPhotoMetadata } from '../../services/libraryService';
import { LibraryPhotoFormFields, libraryFieldClass } from './LibraryPhotoFormFields';

export function LibraryUploadModal({ albums, initialAlbumId, initialCategory, onClose, onSubmit }: {
  albums: LibraryAlbum[]; initialAlbumId?: number; initialCategory: LibraryCategory;
  onClose: () => void; onSubmit: (albumId: number, files: File[], metadata: LibraryPhotoMetadata) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [albumId, setAlbumId] = useState(initialAlbumId ? String(initialAlbumId) : '');
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<LibraryPhotoMetadata>({ category: initialCategory });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isUploading) return;
    if (!albumId || !albums.some(album => album.id === Number(albumId))) { setError(t('admin.library_ui.album_required')); return; }
    if (files.length < 1 || files.length > 20) { setError(t('admin.library_ui.file_count')); return; }
    if (files.some(file => !['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type.toLowerCase()) || file.size === 0 || file.size > 5 * 1024 * 1024)) {
      setError(t('admin.library_ui.file_invalid')); return;
    }
    setIsUploading(true); setError(null);
    try { await onSubmit(Number(albumId), files, metadata); }
    catch (failure) { setError(getApiErrorMessage(failure, t('admin.library_ui.upload_failed'))); }
    finally { if (input.current) input.current.value = ''; setIsUploading(false); }
  };
  return <Modal isOpen onClose={() => { if (!isUploading) onClose(); }} title={t('admin.library_ui.upload')}
    description={t('admin.library_ui.upload_hint')} maxWidth="lg" closeOnBackdropClick={!isUploading} closeOnEsc={!isUploading}>
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm text-secondary-text">{t('admin.library_ui.field_album')}
        <select className={`${libraryFieldClass} mt-1.5`} required value={albumId} disabled={isUploading} onChange={e => setAlbumId(e.target.value)}>
          <option value="">{t('admin.library_ui.choose_album')}</option>
          {albums.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}
        </select>
      </label>
      <label className="block text-sm text-secondary-text">{t('admin.library_ui.field_images')}
        <input ref={input} className={`${libraryFieldClass} mt-1.5`} type="file" multiple
          accept="image/jpeg,image/png,image/webp,image/gif" disabled={isUploading}
          onChange={e => { setFiles(Array.from(e.target.files ?? [])); setError(null); e.target.value = ''; }} />
      </label>
      {files.length > 0 && <p className="text-xs text-secondary-text break-words">{files.map(file => file.name).join(', ')}</p>}
      <LibraryPhotoFormFields value={metadata} onChange={setMetadata} disabled={isUploading} />
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" disabled={isUploading} onClick={onClose}>{t('admin.library_ui.cancel')}</Button>
        <Button type="submit" isLoading={isUploading}>{t('admin.library_ui.upload')}</Button>
      </div>
    </form>
  </Modal>;
}
