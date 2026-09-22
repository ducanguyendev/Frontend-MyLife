import React, { useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
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
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const currentValue = value !== undefined ? value : internalValue;
    const isFloating = isFocused || (currentValue !== undefined && currentValue !== null && String(currentValue).length > 0);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    return (
      <div className={`w-full flex flex-col ${containerClassName}`}>
        <div
          className={`
            relative w-full rounded-2xl border transition-all duration-200 bg-primary-bg
            min-h-[56px] flex items-center
            ${disabled ? 'opacity-50 cursor-not-allowed bg-secondary-bg/30' : ''}
            ${
              error
                ? 'border-error ring-1 ring-error/30'
                : isFocused
                ? 'border-accent ring-2 ring-accent/20'
                : 'border-custom-border hover:border-custom-border/80'
            }
          `}
        >
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`
              w-full h-full bg-transparent text-primary-text text-sm font-medium
              pt-5 pb-1.5 pl-4 pr-10
              outline-none appearance-none cursor-pointer
              disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          >
            {includeEmptyOption && (
              <option value="" className="bg-secondary-bg text-secondary-text">
                {placeholder || ''}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-secondary-bg text-primary-text py-1.5">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {label && (
            <label
              htmlFor={selectId}
              className={`
                absolute left-4 pointer-events-none transition-all duration-200 select-none
                ${
                  isFloating
                    ? 'top-2 text-[11px] font-semibold ' + (error ? 'text-error' : isFocused ? 'text-accent' : 'text-secondary-text')
                    : 'top-1/2 -translate-y-1/2 text-sm text-secondary-text font-normal'
                }
              `}
            >
              {label}
            </label>
          )}

          <div className="absolute right-3.5 pointer-events-none text-secondary-text flex items-center justify-center">
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Error message / Log notification */}
        {error ? (
          <div className="flex items-center gap-1.5 mt-1.5 px-1 text-xs text-error font-medium animate-in fade-in duration-200">
            <AlertCircle size={13} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="text-xs text-secondary-text mt-1 px-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = 'Select';