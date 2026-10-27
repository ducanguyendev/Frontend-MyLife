import React, { useId } from 'react';
import { FormFieldShell, getFormFieldFeedbackId } from './FormFieldShell';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
  floatingLabelAlways?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', containerClassName = '', floatingLabelAlways = false, disabled, required, id, 'aria-describedby': ariaDescribedBy, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? (label ? generatedId : undefined);
    const feedbackId = textareaId && (error || helperText) ? getFormFieldFeedbackId(textareaId, Boolean(error)) : undefined;
    const describedBy = [ariaDescribedBy, feedbackId].filter(Boolean).join(' ') || undefined;
    const floating = floatingLabelAlways && Boolean(label);

    return <FormFieldShell label={floating ? undefined : label} fieldId={textareaId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
      <div className={`group relative w-full rounded-2xl border bg-[var(--field-bg)] transition-colors duration-150 ${disabled ? 'cursor-not-allowed border-[var(--field-border)] bg-[var(--field-disabled-bg)]' : error ? 'border-[var(--field-error)]' : 'border-[var(--field-border)] hover:border-[var(--field-focus-border)]'} ${!disabled && !error ? 'focus-within:border-[var(--field-focus-border)] focus-within:ring-2 focus-within:ring-[var(--field-focus-ring)]' : ''}`}>
        <textarea
          {...props}
          ref={ref}
          data-ui-control
          id={textareaId}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
          className={`min-h-[112px] w-full resize-y bg-transparent px-4 text-[15px] font-medium text-[var(--field-text)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] disabled:cursor-not-allowed ${floating ? 'pt-7 pb-3' : 'py-3'} ${className}`}
        />
        {floating && <label htmlFor={textareaId} className={`pointer-events-none absolute left-4 top-2 select-none text-[11px] font-semibold ${error ? 'text-[var(--field-error)]' : 'text-[var(--field-label)]'}`}>{label}</label>}
      </div>
    </FormFieldShell>;
  }
);

Textarea.displayName = 'Textarea';
