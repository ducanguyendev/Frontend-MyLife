import { Image } from 'lucide-react';
import { FormSectionHeader } from '@/shared/components/ui/FormSectionHeader';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useLanguage } from '@/shared/hooks/useLanguage';
import { Input, Textarea, DateInput, Select, validateCalendarDate, type SelectProps } from '@/shared/components/ui';
import { type LibraryPhotoMetadata } from '../../services/libraryService';

// Library metadata uses the same field primitives as the Member form.
const libraryDateErrorKeys = {
  required: 'date_required', format: 'date_format_invalid', month: 'date_month_invalid',
  day: 'date_day_invalid', calendar: 'date_invalid', future: 'date_future',
} as const;

export function libraryDisplayDateError(value: string): string | null {
  const result = validateCalendarDate(value, { allowFuture: false });
  return result.valid ? null : `admin.library_ui.${libraryDateErrorKeys[result.error ?? 'format']}`;
}

export function LibraryTextField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <Input {...props} label={label} floatingLabel/>;
}
export function LibrarySelectField({ label, children, ...props }: SelectProps & { label: string }) {
  return <Select label={label} {...props}>{children}</Select>;
}
export function LibraryTextArea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <Textarea {...props} label={label} floatingLabel/>;
}
export function LibraryPhotoFormFields({ value, onChange, disabled }: {
  value: LibraryPhotoMetadata; onChange: (value: LibraryPhotoMetadata) => void; disabled: boolean;
}) {
  const { t } = useLanguage();
  return <div className="space-y-4">
<FormSectionHeader title={t('admin.library_ui.edit_photo')} icon={<Image size={16} aria-hidden="true"/>}/>
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
