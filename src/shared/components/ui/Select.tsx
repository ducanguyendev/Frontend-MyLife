import React, { useId, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FormFieldShell, getFormFieldFeedbackId } from './FormFieldShell';
import { FloatingField } from './FloatingField';
import { useLanguage } from '@/shared/hooks/useLanguage';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export type SelectProps = Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, 'children' | 'value' | 'defaultValue' | 'onFocus' | 'onBlur'> & {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  options?: SelectOption[];
  placeholder?: string;
  variant?: 'default' | 'compact';
  appearance?: 'default' | 'simple';
  floatingLabel?: boolean;
  value?: string | null;
  defaultValue?: string | null;
  children?: React.ReactNode;
  required?: boolean;
  id?: string;
  name?: string;
  'aria-label'?: string;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
};

export function SelectItem({ children, className = '', ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      {...props}
      className={`ds-field-option relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-xl border border-transparent py-2 pl-3 pr-9 text-sm text-primary-text outline-none ring-0 ring-offset-0 data-[highlighted]:bg-accent/10 data-[highlighted]:text-primary-text data-[state=checked]:bg-primary-bg data-[state=checked]:data-[highlighted]:bg-accent/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_[data-radix-select-item-text]]:truncate ${className}`}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center text-accent">
        <Check size={16} aria-hidden="true" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export const Select = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectProps>(
  ({
    label, error, helperText, className = '', triggerClassName = '', contentClassName = '', containerClassName = '',
    disabled, required, id, value, defaultValue, onValueChange, children, options, placeholder,
    variant = 'default', appearance = 'default', floatingLabel = true, name, open: controlledOpen, onOpenChange,
    onFocus, onBlur, 'aria-label': ariaLabel, ...props
  }, ref) => {
    const generatedId = useId();
    const { t } = useLanguage();
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue || undefined);
    const [internalOpen, setInternalOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value ?? undefined : internalValue;
    const isOpen = controlledOpen ?? internalOpen;
    const triggerId = id ?? generatedId;
    const feedbackId = error || helperText ? getFormFieldFeedbackId(triggerId, Boolean(error)) : undefined;
    const describedBy = feedbackId;
    const usesFloatingLabel = floatingLabel && Boolean(label);
    void appearance;
    const items = options?.map(option => (
      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>
    ));

    return (
      <FormFieldShell label={usesFloatingLabel ? undefined : label} fieldId={triggerId} required={required} error={error} helperText={helperText} containerClassName={containerClassName}>
        <SelectPrimitive.Root
          {...props}
          value={currentValue ?? ''}
          open={isOpen}
          onOpenChange={next => { setInternalOpen(next); onOpenChange?.(next); }}
          onValueChange={next => { if (!isControlled) setInternalValue(next); onValueChange?.(next); }}
          disabled={disabled}
          name={name}
          required={required}
        >
          <FloatingField label={label} fieldId={triggerId} floating={usesFloatingLabel} active={isOpen || isFocused} hasValue={Boolean(currentValue)} required={required} error={error} disabled={disabled} density={variant} trailing={<ChevronDown size={18} aria-hidden="true"/>}>
            <SelectPrimitive.Trigger
              ref={ref}
              data-ui-control
              id={triggerId}
              aria-label={ariaLabel}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              onFocus={event => { setIsFocused(true); onFocus?.(event); }}
              onBlur={event => { setIsFocused(false); onBlur?.(event); }}
              className={`${className} ${triggerClassName}`}
            >
              <SelectPrimitive.Value
                placeholder={usesFloatingLabel ? '' : placeholder ?? t('appShell.chooseOption')}
                className={`min-w-0 flex-1 truncate ${className}`}
              />
            </SelectPrimitive.Trigger>
          </FloatingField>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={6}
              collisionPadding={8}
              className={`ds-field-menu max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] ${contentClassName}`}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 cursor-default items-center justify-center text-secondary-text"><ChevronUp size={16} /></SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="max-h-[var(--radix-select-content-available-height)]">
                {options ? items : children}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 cursor-default items-center justify-center text-secondary-text"><ChevronDown size={16} /></SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </FormFieldShell>
    );
  }
);

Select.displayName = 'Select';
