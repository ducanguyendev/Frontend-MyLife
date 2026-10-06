import { useLanguage } from '@/shared/hooks/useLanguage';
import { Input } from '@/shared/components/ui';
import { LIBRARY_CATEGORIES, type LibraryPhotoMetadata, type LibraryCategory } from '../../services/libraryService';

export const libraryFieldClass = 'w-full rounded-xl border border-custom-border bg-primary-bg px-3 py-2.5 text-sm text-primary-text outline-none focus:border-accent disabled:opacity-50';

export function LibraryPhotoFormFields({ value, onChange, disabled }: {
  value: LibraryPhotoMetadata; onChange: (value: LibraryPhotoMetadata) => void; disabled: boolean;
}) {
  const { t } = useLanguage();
  return <div className="space-y-4">
    <Input label={t('admin.library_ui.field_title')} maxLength={200} value={value.title ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, title: e.target.value })} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className="block text-sm text-secondary-text">
        {t('admin.library_ui.field_category')}
        <select className={`${libraryFieldClass} mt-1.5`} value={value.category} disabled={disabled}
          onChange={e => onChange({ ...value, category: e.target.value as LibraryCategory })}>
          {LIBRARY_CATEGORIES.map(category => <option key={category} value={category}>{t(`admin.cat_${category}`)}</option>)}
        </select>
      </label>
      <Input label={t('admin.library_ui.field_date')} maxLength={100} value={value.displayDate ?? ''}
        disabled={disabled} onChange={e => onChange({ ...value, displayDate: e.target.value })} />
    </div>
    <label className="block text-sm text-secondary-text">
      {t('admin.library_ui.field_description')}
      <textarea className={`${libraryFieldClass} mt-1.5`} rows={3} maxLength={2000} disabled={disabled}
        value={value.description ?? ''} onChange={e => onChange({ ...value, description: e.target.value })} />
    </label>
    <Input label={t('admin.library_ui.field_author')} maxLength={200} value={value.author ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, author: e.target.value })} />
  </div>;
}
