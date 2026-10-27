import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface FormFieldShellProps {
  label?: string;
  fieldId?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

export function normalizeRequiredLabel(label: string | undefined, required: boolean) {
  return required && typeof label === 'string' ? label.replace(/\s*\*+\s*$/, '') : label;
}

export function FormFieldShell({
  label,
  fieldId,
  required = false,
  error,
  helperText,
  containerClassName = '',
  labelClassName = '',
  children,
}: FormFieldShellProps) {
  const generatedId = useId();
  const feedbackId = fieldId ? `${fieldId}-${error ? 'error' : 'helper'}` : `${generatedId}-${error ? 'error' : 'helper'}`;
  const normalizedLabel = normalizeRequiredLabel(label, required);

  return <div className={`flex w-full flex-col ${containerClassName}`}>
    {normalizedLabel && <label htmlFor={fieldId} className={`mb-1.5 px-1 text-xs font-semibold text-[var(--field-label)] ${labelClassName}`}>
      {normalizedLabel}{required && <span aria-hidden="true" className="ml-1 text-[var(--field-error)]">*</span>}
    </label>}
    {children}
    {error ? <p id={feedbackId} className="mt-1.5 flex items-start gap-1.5 px-1 text-xs font-medium text-[var(--field-error)]" role="alert">
      <AlertCircle size={14} className="mt-0.5 shrink-0" /><span>{error}</span>
    </p> : helperText ? <p id={feedbackId} className="mt-1.5 px-1 text-xs text-secondary-text">{helperText}</p> : null}
  </div>;
}

export const getFormFieldFeedbackId = (fieldId: string, hasError: boolean) => `${fieldId}-${hasError ? 'error' : 'helper'}`;
