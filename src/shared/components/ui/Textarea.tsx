import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue ?? '');

    const textareaId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

    const currentValue = value !== undefined ? value : internalValue;
    const isFloating = isFocused || (currentValue !== undefined && currentValue !== null && String(currentValue).length > 0);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            rows={rows}
            className={`
              w-full bg-transparent text-primary-text text-sm font-medium
              pt-6 pb-3 px-4 resize-none
              outline-none transition-colors
              placeholder:text-secondary-text/40
              disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {label && (
            <label
              htmlFor={textareaId}
              className={`
                absolute left-4 pointer-events-none transition-all duration-200 select-none
                ${
                  isFloating
                    ? 'top-2 text-[11px] font-semibold ' + (error ? 'text-error' : isFocused ? 'text-accent' : 'text-secondary-text')
                    : 'top-4 text-sm text-secondary-text font-normal'
                }
              `}
            >
              {label}
            </label>
          )}
        </div>

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

Textarea.displayName = 'Textarea';
