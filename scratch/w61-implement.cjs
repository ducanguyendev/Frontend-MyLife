const fs=require('fs');const ui='src/shared/components/ui/';
fs.writeFileSync(ui+'Input.tsx',`import React, { useId, useState } from 'react';
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
`);
fs.writeFileSync(ui+'Textarea.tsx',`import React, { useId, useState } from 'react';
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
`);
let s=fs.readFileSync(ui+'Select.tsx','utf8');s=s.replace("import { useLanguage", "import { FloatingField } from './FloatingField';\nimport { useLanguage");s=s.replace('floatingLabel = false','floatingLabel = true');s=s.replace("    const isFloating = floatingLabel && (isOpen || isFocused || Boolean(currentValue));\n    const isSimple = appearance === 'simple';", "    const usesFloatingLabel = floatingLabel && Boolean(label);\n    void appearance;");s=s.replace('label={floatingLabel ? undefined : label}','label={usesFloatingLabel ? undefined : label}');s=s.replace('<div className="relative w-full">','<FloatingField label={label} fieldId={triggerId} floating={usesFloatingLabel} active={isOpen || isFocused} hasValue={Boolean(currentValue)} required={required} error={error} disabled={disabled} density={variant} trailing={<ChevronDown size={18} aria-hidden="true"/>}>');
const a=s.indexOf('              className={`flex w-full border');const b=s.indexOf('\n            >',a);s=s.slice(0,a)+'              className={'+"`${className} ${triggerClassName}`"+'}'+s.slice(b);
s=s.replace("placeholder={floatingLabel ? '' : placeholder ?? t('appShell.chooseOption')}","placeholder={usesFloatingLabel ? '' : placeholder ?? t('appShell.chooseOption')}");
const c=s.indexOf('              {!floatingLabel && (');const d=s.indexOf('          <SelectPrimitive.Portal>',c);s=s.slice(0,c)+'            </SelectPrimitive.Trigger>\n          </FloatingField>\n'+s.slice(d);
const e=s.indexOf('              className={`z-[100]');const f=s.indexOf('\n            >',e);s=s.slice(0,e)+'              className={`ds-field-menu max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] ${contentClassName}`}'+s.slice(f);
s=s.replace('className={`relative flex min-h-10','className={`ds-field-option relative flex min-h-10');fs.writeFileSync(ui+'Select.tsx',s);
// Keep date parser, keyboard, and validation code identical; only hold the shared label while its portal is open.
s=fs.readFileSync(ui+'DateInput.tsx','utf8').replace('Boolean(props.floatingLabelAlways || (props.floatingLabel && isOpen))','Boolean(props.floatingLabelAlways || (props.floatingLabel !== false && isOpen))');fs.writeFileSync(ui+'DateInput.tsx',s);
for(const f of ['src/features/my-life/components/TimelineEventModal.tsx','src/features/admin/components/family-tree/LibraryPhotoFormFields.tsx']){s=fs.readFileSync(f,'utf8').replaceAll('floatingLabelAlways','floatingLabel');fs.writeFileSync(f,s)}
// Font delivery uses full variable files, with no Latin-only unicode-range restriction.
const css='src/index.css';s=fs.readFileSync(css,'utf8').replace("family=Inter:wght@300;400;500;600;700;800;900&family=",'family=');s=s.replace('@custom-variant', '@import "./design-system/forms.css";\n\n@font-face { font-family:Inter; src:url("/assets/fonts/InterVariable.woff2") format("woff2"); font-style:normal; font-weight:100 900; font-display:swap; }\n@font-face { font-family:Inter; src:url("/assets/fonts/InterVariable-Italic.woff2") format("woff2"); font-style:italic; font-weight:100 900; font-display:swap; }\n@font-face { font-family:"Noto Serif"; src:url("/assets/fonts/NotoSerif-Variable.ttf") format("truetype"); font-style:normal; font-weight:100 900; font-display:swap; }\n\n@custom-variant');s=s.replaceAll("'Inter', sans-serif", "'Inter', 'Segoe UI', system-ui, -apple-system, 'Noto Sans', Arial, sans-serif");fs.writeFileSync(css,s);
for(const f of ['src/features/admin/components/family-tree/FamilyExperience.css','src/features/my-life/components/memories/Memories.css']){s=fs.readFileSync(f,'utf8').replace(/Georgia,(?:"Times New Roman",)?serif/g,'var(--font-sans)');fs.writeFileSync(f,s)}
fs.appendFileSync('src/features/landing/pages/MyLifeLandingPage.css','\n/* Editorial type is reserved for the public brand statement. */\n.landing-hero h1 { font-family:"Noto Serif",var(--font-sans); font-synthesis:none; letter-spacing:-.035em; }\n');
s=fs.readFileSync('index.html','utf8').replace('    <meta name="viewport"','    <link rel="preload" href="/assets/fonts/InterVariable.woff2" as="font" type="font/woff2" crossorigin />\n    <meta name="viewport"');fs.writeFileSync('index.html',s);
