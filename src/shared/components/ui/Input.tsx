import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      disabled,
      id,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

    const currentValue = value !== undefined ? value : internalValue;
    const isFloating = isFocused || (currentValue !== undefined && currentValue !== null && String(currentValue).length > 0);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const leftPadClass = leftIcon ? 'pl-11' : 'pl-4';
    const labelLeftClass = leftIcon ? 'left-11' : 'left-4';

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
          {leftIcon && (
            <div className="absolute left-3.5 text-secondary-text pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFloating ? placeholder : ''}
            className={`
              w-full h-full bg-transparent text-primary-text text-sm font-medium
              pt-5 pb-1.5 ${leftPadClass} ${rightIcon ? 'pr-11' : 'pr-4'}
              outline-none transition-colors
              placeholder:text-secondary-text/40
              disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={`
                absolute ${labelLeftClass} pointer-events-none transition-all duration-200 select-none
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

          {rightIcon && (
            <div className="absolute right-3.5 text-secondary-text flex items-center justify-center">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
