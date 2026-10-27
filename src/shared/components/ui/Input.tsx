import React, { useId } from 'react';
import { FormFieldShell, getFormFieldFeedbackId } from './FormFieldShell';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  density?: 'default' | 'compact';
  floatingLabelAlways?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className = '',
    containerClassName = '',
    density = 'default',
    floatingLabelAlways = false,
    disabled,
    required,
    id,
    placeholder,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const generatedId = useId();
    const inputId = id ?? (label ? generatedId : undefined);
    const feedbackId = inputId && (error || helperText) ? getFormFieldFeedbackId(inputId, Boolean(error)) : undefined;
    const describedBy = [ariaDescribedBy, feedbackId].filter(Boolean).join(' ') || undefined;
    const floating = floatingLabelAlways && Boolean(label);

    return <FormFieldShell label={floating ? undefined : label} fieldId={inputId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
      <div className={`group relative flex w-full items-center rounded-2xl border bg-[var(--field-bg)] transition-colors duration-150 ${density === 'compact' ? 'min-h-11' : 'min-h-[58px]'} ${disabled ? 'cursor-not-allowed border-[var(--field-border)] bg-[var(--field-disabled-bg)]' : error ? 'border-[var(--field-error)]' : 'border-[var(--field-border)] hover:border-[var(--field-focus-border)]'} ${!disabled && !error ? 'focus-within:border-[var(--field-focus-border)] focus-within:ring-2 focus-within:ring-[var(--field-focus-ring)]' : ''}`}>
        {leftIcon && <span aria-hidden="true" className="pointer-events-none absolute left-4 inline-flex items-center text-secondary-text [&>svg]:size-[18px]">{leftIcon}</span>}
        <input
          {...props}
          ref={ref}
          data-ui-control
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={describedBy}
          placeholder={placeholder}
          className={`min-h-[56px] w-full bg-transparent text-[15px] font-medium text-[var(--field-text)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] disabled:cursor-not-allowed ${leftIcon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'} ${floating ? 'pt-5 pb-1.5' : 'py-3'} ${className}`}
        />
        {floating && <label htmlFor={inputId} className={`pointer-events-none absolute left-4 top-2 select-none text-[11px] font-semibold ${error ? 'text-[var(--field-error)]' : 'text-[var(--field-label)]'}`}>{label}</label>}
        {rightIcon && <span className="absolute right-3.5 inline-flex items-center text-secondary-text [&>svg]:size-[18px]">{rightIcon}</span>}
      </div>
    </FormFieldShell>;
  }
);

Input.displayName = 'Input';
