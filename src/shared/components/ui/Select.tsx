import React, { useId, useState } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';

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
      className={`relative flex min-h-10 w-full cursor-pointer select-none items-center rounded-xl py-2 pl-3 pr-9 text-sm text-primary-text outline-none data-[highlighted]:bg-accent/10 data-[highlighted]:text-primary-text data-[disabled]:pointer-events-none data-[disabled]:opacity-40 [&_[data-radix-select-item-text]]:truncate ${className}`}
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
    variant = 'default', floatingLabel = false, name, open: controlledOpen, onOpenChange,
    onFocus, onBlur, 'aria-label': ariaLabel, ...props
  }, ref) => {
    const generatedId = useId();
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue || undefined);
    const [internalOpen, setInternalOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value ?? undefined : internalValue;
    const isOpen = controlledOpen ?? internalOpen;
    const triggerId = id ?? generatedId;
    const describedBy = error ? `${triggerId}-error` : helperText ? `${triggerId}-helper` : undefined;
    const isFloating = floatingLabel && (isOpen || isFocused || Boolean(currentValue));
    const items = options?.map(option => (
      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>{option.label}</SelectItem>
    ));

    return (
      <div className={`flex w-full flex-col ${containerClassName}`}>
        {!floatingLabel && label && <label htmlFor={triggerId} className="mb-1.5 px-1 text-xs font-semibold text-secondary-text">{label}{required ? ' *' : ''}</label>}
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
          <div className="relative w-full">
            <SelectPrimitive.Trigger
              ref={ref}
              id={triggerId}
              aria-label={ariaLabel}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              onFocus={event => { setIsFocused(true); onFocus?.(event); }}
              onBlur={event => { setIsFocused(false); onBlur?.(event); }}
              className={`flex w-full rounded-2xl border bg-primary-bg text-left font-medium text-primary-text outline-none transition-all duration-200 data-[placeholder]:text-secondary-text focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 ${
                variant === 'compact'
                  ? 'h-10 items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm'
                  : floatingLabel
                    ? 'min-h-[56px] items-end justify-between gap-2 px-4 pt-5 pb-1.5 text-sm'
                    : 'min-h-[56px] items-center justify-between gap-2 px-4 py-3 text-sm'
              } ${error ? 'border-error focus:border-error focus:ring-error/20' : 'border-custom-border hover:border-custom-border/80'} ${className} ${triggerClassName}`}
            >
              <SelectPrimitive.Value
                placeholder={floatingLabel ? '' : placeholder ?? (label ? `Chọn ${label.toLocaleLowerCase()}` : 'Chọn một giá trị')}
                className={`min-w-0 flex-1 truncate ${className}`}
              />
              {!floatingLabel && (
                <SelectPrimitive.Icon className="shrink-0 text-secondary-text transition-transform data-[state=open]:rotate-180">
                  <ChevronDown size={18} aria-hidden="true" />
                </SelectPrimitive.Icon>
              )}
            </SelectPrimitive.Trigger>
            {floatingLabel && label && <>
              <label
                htmlFor={triggerId}
                className={`pointer-events-none absolute left-4 select-none transition-all duration-200 ${
                  isFloating
                    ? `top-2 text-[11px] font-semibold ${error ? 'text-error' : isFocused || isOpen ? 'text-accent' : 'text-secondary-text'}`
                    : 'top-1/2 -translate-y-1/2 text-sm font-normal text-secondary-text'
                }`}
              >{label}{required ? ' *' : ''}</label>
              <SelectPrimitive.Icon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary-text transition-transform data-[state=open]:rotate-180">
                <ChevronDown size={18} aria-hidden="true" />
              </SelectPrimitive.Icon>
            </>}
          </div>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={6}
              collisionPadding={8}
              className={`z-[100] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg p-1.5 text-primary-text shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${contentClassName}`}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-7 cursor-default items-center justify-center text-secondary-text"><ChevronUp size={16} /></SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport className="max-h-[var(--radix-select-content-available-height)]">
                {options ? items : children}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-7 cursor-default items-center justify-center text-secondary-text"><ChevronDown size={16} /></SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {error ? <p id={`${triggerId}-error`} className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-error"><AlertCircle size={13} />{error}</p>
          : helperText ? <p id={`${triggerId}-helper`} className="mt-1 px-1 text-xs text-secondary-text">{helperText}</p> : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
