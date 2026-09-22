import React from 'react';
import { Calendar } from 'lucide-react';
import { Input, type InputProps } from './Input';

export interface DateInputProps extends Omit<InputProps, 'type' | 'inputMode'> {
  value: string;
  onValueChange?: (value: string) => void;
}

/**
 * Format string as user types into DD/MM/YYYY
 * Automatically appends '/' after typing 2 digits (day) and 4 digits (month)
 */
export const formatDateInput = (val: string, prevVal: string = ''): string => {
  const isDeleting = val.length < prevVal.length;

  // Handle explicit slash typing after single digit (e.g. "5/" -> "05/")
  if (!isDeleting && val.endsWith('/') && !prevVal.endsWith('/')) {
    const parts = val.split('/');
    if (parts.length === 2 && parts[0].length === 1) {
      val = '0' + parts[0] + '/';
    } else if (parts.length === 3 && parts[1].length === 1) {
      val = parts[0] + '/0' + parts[1] + '/';
    }
  }

  // Extract digits only (max 8 digits: 2 day, 2 month, 4 year)
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (!digits) return '';

  if (isDeleting) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // When typing forward:
  if (digits.length < 2) {
    return digits;
  } else if (digits.length === 2) {
    return `${digits}/`;
  } else if (digits.length < 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else if (digits.length === 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}/`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
};

/**
 * Convert DD/MM/YYYY into YYYY-MM-DD for backend APIs
 */
export const formatDobToBackend = (dobStr: string): string | null => {
  if (!dobStr) return null;
  const parts = dobStr.split('/');
  if (parts.length !== 3) return null;
  const day = parts[0].padStart(2, '0');
  const month = parts[1].padStart(2, '0');
  const year = parts[2];
  if (year.length !== 4) return null;
  return `${year}-${month}-${day}`;
};

/**
 * Convert YYYY-MM-DD from backend to DD/MM/YYYY for display
 */
export const formatBackendToDob = (isoDate: string): string => {
  if (!isoDate) return '';
  const clean = isoDate.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
};

export interface DobValidationMessages {
  required?: string;
  format?: string;
  invalid?: string;
  invalidMonth?: string;
  invalidDay?: string;
  dayNotExist?: (month: number, day: number) => string;
  futureDate?: string;
  minAge?: (minAge: number) => string;
  maxAge?: (maxAge: number) => string;
}

/**
 * Validate full calendar date correctness (leap years, 30/31 days, etc.)
 */
export const validateDob = (
  dobStr: string,
  minAge: number = 6,
  maxAge: number = 120,
  messages?: DobValidationMessages
): { valid: boolean; error?: string; backendDate?: string; date?: Date } => {
  if (!dobStr || !dobStr.trim()) {
    return { valid: false, error: messages?.required || 'Vui lòng nhập ngày sinh.' };
  }

  const parts = dobStr.split('/');
  if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
    return { valid: false, error: messages?.format || 'Vui lòng nhập đầy đủ ngày/tháng/năm theo định dạng DD/MM/YYYY (ví dụ: 16/12/2005).' };
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { valid: false, error: messages?.invalid || 'Ngày sinh không hợp lệ.' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: messages?.invalidMonth || 'Tháng sinh không hợp lệ (từ 01 đến 12).' };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: messages?.invalidDay || 'Ngày sinh không hợp lệ (từ 01 đến 31).' };
  }

  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return {
      valid: false,
      error: messages?.dayNotExist
        ? messages.dayNotExist(month, day)
        : `Tháng ${month} không có ngày ${day}. Vui lòng kiểm tra lại.`
    };
  }

  const today = new Date();
  if (dateObj > today) {
    return { valid: false, error: messages?.futureDate || 'Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).' };
  }

  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      valid: false,
      error: messages?.minAge
        ? messages.minAge(minAge)
        : `Bạn phải từ đủ ${minAge} tuổi trở lên để đăng ký tài khoản.`
    };
  }

  if (age > maxAge) {
    return {
      valid: false,
      error: messages?.maxAge
        ? messages.maxAge(maxAge)
        : `Ngày sinh không hợp lệ (độ tuổi vượt quá ${maxAge} tuổi).`
    };
  }

  const backendDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { valid: true, backendDate, date: dateObj };
};

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      onValueChange,
      leftIcon,
      rightIcon,
      placeholder = 'DD/MM/YYYY',
      maxLength = 10,
      onKeyDown,
      onPaste,
      ...props
    },
    ref
  ) => {
    const hiddenPickerRef = React.useRef<HTMLInputElement>(null);

    const handleOpenPicker = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (hiddenPickerRef.current) {
        if ('showPicker' in hiddenPickerRef.current) {
          try {
            hiddenPickerRef.current.showPicker();
            return;
          } catch {
            // Fallback to click
          }
        }
        hiddenPickerRef.current.focus();
        hiddenPickerRef.current.click();
      }
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoVal = e.target.value; // "YYYY-MM-DD"
      if (isoVal) {
        const formatted = formatBackendToDob(isoVal);
        onValueChange?.(formatted);

        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, name: props.name || '', value: formatted },
            currentTarget: { ...e.currentTarget, name: props.name || '', value: formatted },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const formatted = formatDateInput(raw, String(value ?? ''));
      e.target.value = formatted;

      onValueChange?.(formatted);
      onChange?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'Tab' ||
        e.key === 'Enter' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.ctrlKey ||
        e.metaKey
      ) {
        onKeyDown?.(e);
        return;
      }

      if (!/^[0-9/]$/.test(e.key)) {
        e.preventDefault();
        return;
      }

      onKeyDown?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const formatted = formatDateInput(pasted, '');

      const target = e.target as HTMLInputElement;
      target.value = formatted;
      const syntheticEvent = {
        ...e,
        target,
        currentTarget: target,
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      onValueChange?.(formatted);
      onChange?.(syntheticEvent);
      onPaste?.(e);
    };

    const defaultPickerButton = (
      <button
        type="button"
        onClick={handleOpenPicker}
        title="Chọn từ lịch"
        className="p-1 rounded-lg text-secondary-text hover:text-accent hover:bg-secondary-bg/60 transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
        tabIndex={-1}
        aria-label="Open date picker"
      >
        <Calendar size={18} />
      </button>
    );

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          maxLength={maxLength}
          leftIcon={leftIcon}
          rightIcon={rightIcon !== undefined ? rightIcon : defaultPickerButton}
          {...props}
        />
        <input
          ref={hiddenPickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={formatDobToBackend(String(value ?? '')) || ''}
          onChange={handlePickerChange}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
            border: 0,
            padding: 0,
            margin: 0,
          }}
        />
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
