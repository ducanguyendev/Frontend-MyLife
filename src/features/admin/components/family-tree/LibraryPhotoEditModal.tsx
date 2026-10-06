import { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button, Modal } from '@/shared/components/ui';
import { getApiErrorMessage } from '@/shared/api/apiClient';
import { type LibraryPhotoMetadata } from '../../services/libraryService';
import { type LibraryPhoto } from './types';
import { LibraryPhotoFormFields } from './LibraryPhotoFormFields';

export function LibraryPhotoEditModal({ photo, onClose, onSubmit }: {
  photo: LibraryPhoto; onClose: () => void; onSubmit: (metadata: LibraryPhotoMetadata) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [metadata, setMetadata] = useState<LibraryPhotoMetadata>({ title: photo.title, category: photo.category,
    displayDate: photo.year, description: photo.desc, author: photo.author });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true); setError(null);
    try { await onSubmit(metadata); }
    catch (failure) { setError(getApiErrorMessage(failure, t('admin.library_ui.save_failed'))); }
    finally { setIsSaving(false); }
  };
  return <Modal isOpen onClose={() => { if (!isSaving) onClose(); }} title={t('admin.library_ui.edit_photo')} maxWidth="lg"
    closeOnBackdropClick={!isSaving} closeOnEsc={!isSaving}>
    <form onSubmit={submit} className="space-y-4">
      <LibraryPhotoFormFields value={metadata} onChange={setMetadata} disabled={isSaving} />
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>{t('admin.library_ui.cancel')}</Button>
        <Button type="submit" isLoading={isSaving}>{t('admin.library_ui.save')}</Button>
      </div>
    </form>
  </Modal>;
}
