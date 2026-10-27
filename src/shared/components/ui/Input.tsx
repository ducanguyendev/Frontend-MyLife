import React, { useId, useState } from 'react';
import { FormFieldShell, getFormFieldFeedbackId, normalizeRequiredLabel } from './FormFieldShell';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  density?: 'default' | 'compact';
  floatingLabel?: boolean;
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
    floatingLabel = false,
    floatingLabelAlways = false,
    disabled,
    required,
    id,
    placeholder,
    'aria-describedby': ariaDescribedBy,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(props.defaultValue ?? '');
    const generatedId = useId();
    const inputId = id ?? (label ? generatedId : undefined);
    const feedbackId = inputId && (error || helperText) ? getFormFieldFeedbackId(inputId, Boolean(error)) : undefined;
    const describedBy = [ariaDescribedBy, feedbackId].filter(Boolean).join(' ') || undefined;
    const currentValue = props.value !== undefined ? props.value : internalValue;
    const hasValue = currentValue !== undefined && currentValue !== null && String(currentValue).length > 0;
    const shouldFloat = floatingLabelAlways || (floatingLabel && (isFocused || hasValue || Boolean(error)));
    const usesFloatingLabel = (floatingLabel || floatingLabelAlways) && Boolean(label);
    const normalizedLabel = normalizeRequiredLabel(label, Boolean(required));

    return <FormFieldShell label={usesFloatingLabel ? undefined : normalizedLabel} fieldId={inputId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
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
          placeholder={floatingLabel && !shouldFloat ? '' : placeholder}
          onFocus={event => { setIsFocused(true); props.onFocus?.(event); }}
          onBlur={event => { setIsFocused(false); props.onBlur?.(event); }}
          onChange={event => { if (props.value === undefined) setInternalValue(event.target.value); props.onChange?.(event); }}
          className={`min-h-[56px] w-full bg-transparent text-[15px] font-medium text-[var(--field-text)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] disabled:cursor-not-allowed ${leftIcon ? 'pl-12' : 'pl-4'} ${rightIcon ? 'pr-12' : 'pr-4'} ${usesFloatingLabel && shouldFloat ? 'pt-5 pb-1.5' : 'py-3'} ${className}`}
        />
        {usesFloatingLabel && <label htmlFor={inputId} className={`pointer-events-none absolute left-4 select-none transition-all duration-200 ${shouldFloat ? `top-2 text-[11px] font-semibold ${error ? 'text-[var(--field-error)]' : 'text-[var(--field-label)]'}` : 'top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--field-placeholder)]'}`}>{normalizedLabel}{required && <span aria-hidden="true" className="ml-1 text-[var(--field-error)]">*</span>}</label>}
        {rightIcon && <span className="absolute right-3.5 inline-flex items-center text-secondary-text [&>svg]:size-[18px]">{rightIcon}</span>}
      </div>
    </FormFieldShell>;
  }
);

Input.displayName = 'Input';
