import React, { useId, useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
  options?: SelectOption[];
  includeEmptyOption?: boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      containerClassName = '',
      disabled,
      required,
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      children,
      options,
      placeholder,
      includeEmptyOption = true,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string | number>((defaultValue as string | number) ?? '');
    const currentValue = value !== undefined ? value : internalValue;
    const isControlled = value !== undefined;

    const optionElements = options
      ? options.map((option, index) => (
          <option key={`${String(option.value)}-${index}`} value={option.value}>
            {option.label}
          </option>
        ))
      : children;

    const hasOptions = options ? options.length > 0 : React.Children.count(children) > 0;
    const shouldRenderEmptyOption = includeEmptyOption && (hasOptions || Boolean(placeholder));
    const emptyLabel = placeholder || ' ';
    const currentChild = React.Children.toArray(children).find(
      (child): child is React.ReactElement<{ value?: string | number; children?: React.ReactNode }> =>
        React.isValidElement<{ value?: string | number; children?: React.ReactNode }>(child) &&
        String(child.props.value ?? '') === String(currentValue)
    );
    const currentLabel = options
      ? options.find(option => String(option.value) === String(currentValue))?.label
      : currentChild?.props.children;
    // An explicit empty-value option can act as a placeholder (for example,
    // “No linked member”). Float the label when it has visible selected text.
    const isFloating = isFocused || (currentValue !== undefined && currentValue !== null && String(currentValue).length > 0) || Boolean(currentLabel);

    return (
      <div className={`w-full flex flex-col ${containerClassName}`}>
        <div
          className={`relative w-full min-h-[56px] flex items-center rounded-2xl border bg-primary-bg transition-all duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed bg-secondary-bg/30' : ''
          } ${
            error
              ? 'border-error ring-1 ring-error/30'
              : isFocused
                ? 'border-accent ring-2 ring-accent/20'
                : 'border-custom-border hover:border-custom-border/80'
          }`}
        >
          <select
            {...props}
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            value={isControlled ? value : undefined}
            defaultValue={isControlled ? undefined : defaultValue}
            onChange={event => {
              if (!isControlled) setInternalValue(event.target.value);
              onChange?.(event);
            }}
            onFocus={event => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={event => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            aria-invalid={error ? true : props['aria-invalid']}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none rounded-2xl opacity-0 disabled:cursor-not-allowed"
          >
            {shouldRenderEmptyOption && <option value="">{emptyLabel}</option>}
            {optionElements}
          </select>

          <div
            aria-hidden="true"
            className={`pointer-events-none flex h-full w-full items-center bg-transparent pt-5 pb-1.5 pl-4 pr-10 text-sm font-medium text-primary-text ${className}`}
          >
            <span className="block w-full truncate text-left">{currentLabel || (currentValue ? String(currentValue) : '')}</span>
          </div>

          {label && (
            <label
              htmlFor={selectId}
              className={`pointer-events-none absolute left-4 select-none transition-all duration-200 ${
                isFloating
                  ? `top-2 text-[11px] font-semibold ${error ? 'text-error' : isFocused ? 'text-accent' : 'text-secondary-text'}`
                  : 'top-1/2 -translate-y-1/2 text-sm font-normal text-secondary-text'
              }`}
            >
              {label}
            </label>
          )}

          <div aria-hidden="true" className="pointer-events-none absolute right-3.5 flex items-center justify-center text-secondary-text">
            <ChevronDown size={18} />
          </div>
        </div>

        {error ? (
          <div className="mt-1.5 flex items-center gap-1.5 px-1 text-xs font-medium text-error animate-in fade-in duration-200">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="mt-1 px-1 text-xs text-secondary-text">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
