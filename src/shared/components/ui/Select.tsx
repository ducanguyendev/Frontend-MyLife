import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string | number>((defaultValue as string | number) ?? '');
    const containerRef = useRef<HTMLDivElement>(null);

    const parsedOptions: SelectOption[] = [];
    if (includeEmptyOption) {
      parsedOptions.push({ value: '', label: placeholder || ' ' });
    }
    
    if (options) {
      parsedOptions.push(...options);
    } else {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const optionChild = child as React.ReactElement<{ value?: string | number; children?: React.ReactNode }>;
          parsedOptions.push({
            value: optionChild.props.value !== undefined ? optionChild.props.value : '',
            label: optionChild.props.children,
          });
        }
      });
    }

    const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
    const currentValue = value !== undefined ? value : internalValue;
    const isFloating = isFocused || isOpen || (currentValue !== undefined && currentValue !== null && String(currentValue).length > 0);

    const currentLabel = parsedOptions.find(opt => String(opt.value) === String(currentValue))?.label || '';

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setIsFocused(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectClick = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setIsFocused(true);
        }
      }
    };

    const handleOptionSelect = (optionValue: string | number) => {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      if (onChange) {
        const mockEvent = {
          target: { value: String(optionValue), name: props.name, id: selectId },
          currentTarget: { value: String(optionValue), name: props.name, id: selectId },
          preventDefault: () => {},
          stopPropagation: () => {}
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(mockEvent);
      }
      setIsOpen(false);
    };

    return (
      <div className={`w-full flex flex-col ${containerClassName}`} ref={containerRef}>
        <div
          onClick={handleSelectClick}
          className={`
            relative w-full rounded-2xl border transition-all duration-200 bg-primary-bg
            min-h-[56px] flex items-center
            ${disabled ? 'opacity-50 cursor-not-allowed bg-secondary-bg/30' : 'cursor-pointer'}
            ${
              error
                ? 'border-error ring-1 ring-error/30'
                : isFocused || isOpen
                ? 'border-accent ring-2 ring-accent/20'
                : 'border-custom-border hover:border-custom-border/80'
            }
          `}
        >
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            value={currentValue}
            onChange={(e) => {
              if (value === undefined) setInternalValue(e.target.value);
              onChange?.(e);
            }}
            onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            {...props}
          >
            {parsedOptions.map((opt, idx) => (
              <option key={idx} value={opt.value}>
                {/* We just need options for form submission/ref, the content isn't visible */}
                {typeof opt.label === 'string' ? opt.label : opt.value}
              </option>
            ))}
          </select>

          <div
            className={`
              w-full h-full bg-transparent text-primary-text text-sm font-medium
              pt-5 pb-1.5 pl-4 pr-10
              outline-none appearance-none flex items-center
              ${className}
            `}
          >
            <span className="truncate block w-full text-left">{currentLabel}</span>
          </div>

          {label && (
            <label
              className={`
                absolute left-4 pointer-events-none transition-all duration-200 select-none
                ${
                  isFloating
                    ? 'top-2 text-[11px] font-semibold ' + (error ? 'text-error' : isFocused || isOpen ? 'text-accent' : 'text-secondary-text')
                    : 'top-1/2 -translate-y-1/2 text-sm text-secondary-text font-normal'
                }
              `}
            >
              {label}
            </label>
          )}

          <div className="absolute right-3.5 pointer-events-none text-secondary-text flex items-center justify-center">
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} />
            </motion.div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+1px)] left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-custom-border bg-primary-bg shadow-lg py-1"
                style={{ scrollbarWidth: 'thin' }}
              >
                {parsedOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionSelect(opt.value);
                    }}
                    className={`
                      px-4 py-2.5 text-sm cursor-pointer transition-colors
                      hover:bg-secondary-bg text-left
                      ${String(opt.value) === String(currentValue) ? 'text-accent font-medium bg-accent/5' : 'text-primary-text'}
                    `}
                  >
                    {opt.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
Select.displayName = 'Select';