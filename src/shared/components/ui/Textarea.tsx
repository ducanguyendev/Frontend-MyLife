import React, { useId, useState } from 'react';
import { FormFieldShell, getFormFieldFeedbackId } from './FormFieldShell';
import { FloatingField } from './FloatingField';
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string | null; helperText?: string; containerClassName?: string;
  floatingLabel?: boolean; floatingLabelAlways?: boolean;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, helperText, className = '', containerClassName = '', floatingLabel = true, floatingLabelAlways = false,
  disabled, required, id, 'aria-describedby': ariaDescribedBy, rows = 4, ...props
}, ref) => {
  const generatedId = useId(); const textareaId = id ?? generatedId;
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(props.defaultValue ?? '');
  const value = props.value !== undefined ? props.value : internalValue;
  const feedbackId = error || helperText ? getFormFieldFeedbackId(textareaId, Boolean(error)) : undefined;
  const floating = floatingLabel || floatingLabelAlways;
  return <FormFieldShell label={floating ? undefined : label} fieldId={textareaId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
    <FloatingField label={label} fieldId={textareaId} floating={floating} active={focused} hasValue={String(value ?? '').length > 0} alwaysFloating={floatingLabelAlways} multiline required={required} error={error} disabled={disabled}>
      <textarea {...props} ref={ref} data-ui-control id={textareaId} rows={rows} disabled={disabled} required={required}
        aria-invalid={error ? true : props['aria-invalid']} aria-describedby={[ariaDescribedBy, feedbackId].filter(Boolean).join(' ') || undefined}
        onFocus={event => { setFocused(true); props.onFocus?.(event); }}
        onBlur={event => { setFocused(false); props.onBlur?.(event); }}
        onChange={event => { if (props.value === undefined) setInternalValue(event.target.value); props.onChange?.(event); }} className={className}/>
    </FloatingField>
  </FormFieldShell>;
});
Textarea.displayName = 'Textarea';
