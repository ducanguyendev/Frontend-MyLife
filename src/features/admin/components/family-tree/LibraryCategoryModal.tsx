import { useState } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Button, Modal } from '@/shared/components/ui';
import { getFeatureErrorKey } from '../../services/featureMessages';
import type { LibraryCategory } from '../../services/libraryService';
import { LibraryTextField } from './LibraryPhotoFormFields';

export function LibraryCategoryModal({ category, onClose, onSubmit }: { category?: LibraryCategory; onClose: () => void; onSubmit: (name: string) => Promise<void> }) {
  const { t } = useLanguage();
  const [name, setName] = useState(category?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    if (!name.trim()) { setError('admin.library_ui.category_name_required'); return; }
    setIsSaving(true); setError(null);
    try { await onSubmit(name.trim()); }
    catch (failure) { setError(getFeatureErrorKey(failure, 'category_save')); }
    finally { setIsSaving(false); }
  };
  return <Modal isOpen title={t(category ? 'admin.library_ui.edit_category' : 'admin.library_ui.create_category')} maxWidth="sm"
    onClose={() => { if (!isSaving) onClose(); }} closeOnEsc={!isSaving} closeOnBackdropClick={!isSaving}>
    <form noValidate onSubmit={submit} className="space-y-4">
      <LibraryTextField label={t('admin.library_ui.field_category_name')} maxLength={100} value={name} disabled={isSaving} onChange={e => setName(e.target.value)} />
      {error && <p role="alert" className="text-sm text-error">{t(error)}</p>}
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={isSaving} onClick={onClose}>{t('admin.library_ui.cancel')}</Button>
        <Button type="submit" isLoading={isSaving}>{t(category ? 'admin.library_ui.save' : 'admin.library_ui.create')}</Button></div>
    </form>
  </Modal>;
}
