import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { DateInput, Select, validateCalendarDate, type SelectProps } from '@/shared/components/ui';
import { type LibraryPhotoMetadata } from '../../services/libraryService';

// Library-only floating labels and matching text/select sizing.
export const libraryFieldClass = 'w-full min-h-[56px] rounded-2xl border border-custom-border bg-primary-bg px-4 pt-5 pb-1.5 text-sm text-primary-text outline-none focus:border-[var(--focus-border)]   disabled:opacity-50';
const labelClass = 'absolute top-2 left-4 right-4 text-[11px] font-semibold text-secondary-text pointer-events-none truncate';
const libraryDateErrorKeys = {
  required: 'date_required', format: 'date_format_invalid', month: 'date_month_invalid',
  day: 'date_day_invalid', calendar: 'date_invalid', future: 'date_future',
} as const;

export function libraryDisplayDateError(value: string): string | null {
  const result = validateCalendarDate(value, { allowFuture: false });
  return result.valid ? null : `admin.library_ui.${libraryDateErrorKeys[result.error ?? 'format']}`;
}

export function LibraryTextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="relative block min-h-[56px]"><span className={labelClass}>{label}</span><input {...props} className={libraryFieldClass} /></label>;
}
export function LibrarySelectField({ label, children, ...props }: SelectProps & { label: string }) {
  return <Select label={label} {...props} className="border-0">{children}</Select>;
}
export function LibraryTextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="relative block"><span className={labelClass}>{label}</span><textarea {...props} className={`${libraryFieldClass} min-h-28 pb-3`} /></label>;
}
export function LibraryPhotoFormFields({ value, onChange, disabled }: {
  value: LibraryPhotoMetadata; onChange: (value: LibraryPhotoMetadata) => void; disabled: boolean;
}) {
  const { t } = useLanguage();
  return <div className="space-y-4">
    <LibraryTextField label={t('admin.library_ui.field_title')} maxLength={200} value={value.title ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, title: e.target.value })} />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <DateInput disableFuture label={t('admin.library_ui.field_date')} value={value.displayDate ?? ''} disabled={disabled}
        placeholder="DD/MM/YYYY" onValueChange={displayDate => onChange({ ...value, displayDate })} />
    </div>
    <LibraryTextArea label={t('admin.library_ui.field_description')} rows={3} maxLength={2000} disabled={disabled}
      value={value.description ?? ''} onChange={e => onChange({ ...value, description: e.target.value })} />
    <LibraryTextField label={t('admin.library_ui.field_author')} maxLength={200} value={value.author ?? ''}
      disabled={disabled} onChange={e => onChange({ ...value, author: e.target.value })} />
  </div>;
}
