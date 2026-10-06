import { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button, Input, Modal } from '@/shared/components/ui';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { type AlbumMetadata, type LibraryAlbum } from '../../services/libraryService';
import { libraryFieldClass } from './LibraryPhotoFormFields';

export function LibraryAlbumModal({ album, onClose, onSubmit }: {
  album?: LibraryAlbum; onClose: () => void; onSubmit: (metadata: AlbumMetadata) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(album?.name ?? '');
  const [description, setDescription] = useState(album?.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    if (!name.trim()) { setError(t('admin.library_ui.name_required')); return; }
    setIsSaving(true); setError(null);
    try { await onSubmit({ name: name.trim(), description: description.trim() || null }); }
    catch (failure) { setError(getApiErrorMessage(failure, t('admin.library_ui.save_failed'))); }
    finally { setIsSaving(false); }
  };
  return <Modal isOpen onClose={() => { if (!isSaving) onClose(); }} maxWidth="md"
    closeOnBackdropClick={!isSaving} closeOnEsc={!isSaving} title={t(album ? 'admin.library_ui.edit_album' : 'admin.library_ui.create_album')}>
    <form onSubmit={submit} className="space-y-4">
      <Input label={t('admin.library_ui.field_album_name')} required maxLength={150} value={name} disabled={isSaving} onChange={e => setName(e.target.value)} />
      <label className="block text-sm text-secondary-text">{t('admin.library_ui.field_description')}
        <textarea className={`${libraryFieldClass} mt-1.5`} rows={3} maxLength={2000} value={description} disabled={isSaving} onChange={e => setDescription(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>{t('admin.library_ui.cancel')}</Button>
        <Button type="submit" isLoading={isSaving}>{t('admin.library_ui.save')}</Button>
      </div>
    </form>
  </Modal>;
}
