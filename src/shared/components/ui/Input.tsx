import React, { useId, useState } from 'react';
import { FormFieldShell, getFormFieldFeedbackId } from './FormFieldShell';
import { FloatingField } from './FloatingField';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string | null; helperText?: string;
  leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; containerClassName?: string;
  density?: 'default' | 'compact'; floatingLabel?: boolean; floatingLabelAlways?: boolean;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label, error, helperText, leftIcon, rightIcon, className = '', containerClassName = '', density = 'default',
  floatingLabel = true, floatingLabelAlways = false, disabled, required, id, placeholder,
  'aria-describedby': ariaDescribedBy, ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(props.defaultValue ?? '');
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const feedbackId = error || helperText ? getFormFieldFeedbackId(inputId, Boolean(error)) : undefined;
  const describedBy = [ariaDescribedBy, feedbackId].filter(Boolean).join(' ') || undefined;
  const currentValue = props.value !== undefined ? props.value : internalValue;
  const hasValue = currentValue !== undefined && currentValue !== null && String(currentValue).length > 0;
  const floating = floatingLabel || floatingLabelAlways;
  return <FormFieldShell label={floating ? undefined : label} fieldId={inputId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
    <FloatingField label={label} fieldId={inputId} floating={floating} alwaysFloating={floatingLabelAlways} active={isFocused} hasValue={hasValue} error={error} required={required} disabled={disabled} density={density} leading={leftIcon} trailing={rightIcon}>
      <input {...props} ref={ref} data-ui-control id={inputId} disabled={disabled} required={required}
        aria-invalid={error ? true : props['aria-invalid']} aria-describedby={describedBy} placeholder={placeholder}
        onFocus={event => { setIsFocused(true); props.onFocus?.(event); }}
        onBlur={event => { setIsFocused(false); props.onBlur?.(event); }}
        onChange={event => { if (props.value === undefined) setInternalValue(event.target.value); props.onChange?.(event); }}
        className={className}/>
    </FloatingField>
  </FormFieldShell>;
});
Input.displayName = 'Input';
