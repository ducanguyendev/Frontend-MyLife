import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { type LibraryPhotoMetadata, type LibraryCategory } from '../../services/libraryService';

// Library-only floating labels and matching text/select sizing.
export const libraryFieldClass = 'w-full min-h-[56px] rounded-2xl border border-custom-border bg-primary-bg px-4 pt-5 pb-1.5 text-sm text-primary-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50';
const labelClass = 'absolute top-2 left-4 right-4 text-[11px] font-semibold text-secondary-text pointer-events-none truncate';

export function LibraryTextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="relative block min-h-[56px]"><span className={labelClass}>{label}</span><input {...props} className={libraryFieldClass} /></label>;
}
export function LibrarySelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return <label className="relative block min-h-[56px]"><span className={labelClass}>{label}</span><select {...props} className={libraryFieldClass}>{children}</select></label>;
}
export function LibraryTextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="relative block"><span className={labelClass}>{label}</span><textarea {...props} className={`${libraryFieldClass} min-h-28 pb-3`} /></label>;
}
export function libraryCategoryLabel(category: LibraryCategory, t: (key: string) => string) {
  return category.isDefault ? t(`admin.cat_${category.slug}`) : category.name;
}

export function LibraryPhotoFormFields({ value, onChange, disabled, categories }: {
  value: LibraryPhotoMetadata; onChange: (value: LibraryPhotoMetadata) => void; disabled: boolean; categories: LibraryCategory[];
}) {
  const { t } = useLanguage();
  return <div className="space-y-4">
    <LibraryTextField label={t('admin.library_ui.field_title')} maxLength={200} value={value.title ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, title: e.target.value })} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <LibrarySelectField label={t('admin.library_ui.field_category')} value={value.category} disabled={disabled}
        onChange={e => onChange({ ...value, category: e.target.value })}>
        {!categories.some(category => category.slug === value.category) && <option value="">{t('admin.library_ui.choose_category')}</option>}
        {categories.map(category => <option key={category.id} value={category.slug}>{libraryCategoryLabel(category, t)}</option>)}
      </LibrarySelectField>
      <LibraryTextField label={t('admin.library_ui.field_date')} maxLength={100} value={value.displayDate ?? ''}
        disabled={disabled} onChange={e => onChange({ ...value, displayDate: e.target.value })} />
    </div>
    <LibraryTextArea label={t('admin.library_ui.field_description')} rows={3} maxLength={2000} disabled={disabled}
      value={value.description ?? ''} onChange={e => onChange({ ...value, description: e.target.value })} />
    <LibraryTextField label={t('admin.library_ui.field_author')} maxLength={200} value={value.author ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, author: e.target.value })} />
  </div>;
}
