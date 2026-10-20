import React from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input, type InputProps } from './Input';
import { useLanguage } from '@/shared/hooks/useLanguage';

export interface DateInputProps extends Omit<InputProps, 'type' | 'inputMode'> {
  value: string;
  onValueChange?: (value: string) => void;
  disableFuture?: boolean;
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

export type CalendarDateError = 'required' | 'format' | 'month' | 'day' | 'calendar' | 'future';

export const validateCalendarDate = (
  value: string,
  options: { required?: boolean; allowFuture?: boolean } = {}
): { valid: boolean; error?: CalendarDateError; backendDate?: string; date?: Date } => {
  const normalized = value.trim();
  if (!normalized) return options.required ? { valid: false, error: 'required' } : { valid: true };
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return { valid: false, error: 'format' };

  const [dayText, monthText, yearText] = normalized.split('/');
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  if (year < 1) return { valid: false, error: 'calendar' };
  if (month < 1 || month > 12) return { valid: false, error: 'month' };
  if (day < 1 || day > 31) return { valid: false, error: 'day' };

  // setFullYear avoids JavaScript's special 1900 offset for constructor years 0â€“99.
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { valid: false, error: 'calendar' };
  }

  if (!options.allowFuture) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) return { valid: false, error: 'future' };
  }

  return {
    valid: true,
    backendDate: `${yearText}-${monthText}-${dayText}`,
    date,
  };
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

export const parseDateInput = (value: string): Date | undefined => {
  const result = validateCalendarDate(value, { allowFuture: true });
  return result.valid ? result.date : undefined;
};

const dateToInputValue = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const weekdayLabel = (language: 'vi' | 'en') => (date: Date) =>
  language === 'vi'
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    : format(date, 'EEE', { locale: enUS });

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, onValueChange, leftIcon, rightIcon, placeholder = 'DD/MM/YYYY', maxLength = 10,
    onKeyDown, onPaste, disableFuture = false, disabled, name, ...props }, forwardedRef) => {
    const { language, t } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);
    const [month, setMonth] = React.useState(() => parseDateInput(value) ?? new Date());
    const [popupPosition, setPopupPosition] = React.useState<React.CSSProperties>({});
    const rootRef = React.useRef<HTMLDivElement>(null);
    const popupRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const locale = language === 'vi' ? vi : enUS;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = parseDateInput(value);

    const setInputRef = React.useCallback((node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    }, [forwardedRef]);

    const updatePosition = React.useCallback(() => {
      const anchor = rootRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const width = Math.min(328, window.innerWidth - 24);
      const estimatedHeight = 370;
      const below = window.innerHeight - anchor.bottom;
      const top = below >= estimatedHeight || below >= anchor.top
        ? Math.max(8, Math.min(anchor.bottom + 6, window.innerHeight - estimatedHeight - 8))
        : Math.max(8, anchor.top - estimatedHeight - 6);
      const left = Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12));
      setPopupPosition({ position: 'fixed', top, left, width, maxHeight: window.innerHeight - 16, overflowY: 'auto', zIndex: 60 });
    }, []);

    React.useEffect(() => {
      if (!isOpen) return;
      updatePosition();
      const onPointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (!rootRef.current?.contains(target) && !popupRef.current?.contains(target)) setIsOpen(false);
      };
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      document.addEventListener('pointerdown', onPointerDown);
      const frame = requestAnimationFrame(() => popupRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus());
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        document.removeEventListener('pointerdown', onPointerDown);
      };
    }, [isOpen, updatePosition]);

    const emitValue = (formatted: string) => {
      onValueChange?.(formatted);
      if (onChange) {
        const target = inputRef.current ?? ({ name: name || '', value: formatted } as HTMLInputElement);
        target.name = name || '';
        target.value = formatted;
        onChange({ target, currentTarget: target } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleOpenPicker = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      setMonth(parseDateInput(value) ?? new Date());
      setIsOpen(open => !open);
    };

    const handleSelectDate = (date?: Date) => {
      if (!date) return;
      emitValue(dateToInputValue(date));
      setMonth(date);
      setIsOpen(false);
      requestAnimationFrame(() => buttonRef.current?.focus());
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatDateInput(event.target.value, String(value ?? ''));
      event.target.value = formatted;
      onValueChange?.(formatted);
      onChange?.(event);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const target = event.target as HTMLInputElement;
      target.value = formatDateInput(event.clipboardData.getData('text'), '');
      onValueChange?.(target.value);
      onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLInputElement>);
      onPaste?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key) || event.ctrlKey || event.metaKey) {
        onKeyDown?.(event);
        return;
      }
      if (!/^[0-9/]$/.test(event.key)) event.preventDefault();
      onKeyDown?.(event);
    };

    const handlePopupKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      requestAnimationFrame(() => buttonRef.current?.focus());
    };

    const chooseCalendarLabel = t('common.date_picker.choose_date', {
      defaultValue: language === 'vi' ? 'Chọn ngày từ lịch' : 'Choose date from calendar',
    });
    const previousMonthLabel = t('common.date_picker.previous_month', {
      defaultValue: language === 'vi' ? 'Tháng trước' : 'Previous month',
    });
    const nextMonthLabel = t('common.date_picker.next_month', {
      defaultValue: language === 'vi' ? 'Tháng sau' : 'Next month',
    });

    const calendarButton = rightIcon !== undefined ? rightIcon : (
      <button ref={buttonRef} type="button" onClick={handleOpenPicker} title={chooseCalendarLabel}
        disabled={disabled} aria-label={chooseCalendarLabel} aria-haspopup="dialog" aria-expanded={isOpen}
        className="flex cursor-pointer items-center justify-center rounded-lg p-1 text-secondary-text transition-colors hover:bg-secondary-bg/60 hover:text-accent    disabled:cursor-not-allowed">
        <Calendar size={18} />
      </button>
    );

    return (
      <div ref={rootRef} className="relative w-full">
        <Input ref={setInputRef} type="text" inputMode="numeric" value={value} onChange={handleInputChange}
          onKeyDown={handleKeyDown} onPaste={handlePaste} placeholder={placeholder} maxLength={maxLength}
          leftIcon={leftIcon} rightIcon={calendarButton} disabled={disabled} name={name} {...props} />
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div ref={popupRef} style={popupPosition} role="dialog" aria-label={t('common.date_picker.calendar', {
            defaultValue: language === 'vi' ? 'Lịch chọn ngày' : 'Date picker calendar',
          })} onKeyDown={handlePopupKeyDown}
            className="rounded-2xl border border-custom-border bg-secondary-bg p-3 text-primary-text shadow-[0_8px_24px_rgb(0_0_0/0.12)]">
            <DayPicker
              mode="single" selected={selectedDate} onSelect={handleSelectDate}
              month={month} onMonthChange={setMonth} locale={locale} weekStartsOn={1}
              captionLayout="dropdown" startMonth={new Date(today.getFullYear() - 200, 0)}
              endMonth={disableFuture ? today : new Date(today.getFullYear() + 100, 11)}
              disabled={disableFuture ? { after: today } : undefined}
              formatters={{
                formatCaption: date => language === 'vi'
                  ? `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`
                  : format(date, 'MMMM yyyy', { locale: enUS }),
                formatWeekdayName: weekdayLabel(language),
              }}
              labels={{
                labelNext: () => nextMonthLabel,
                labelPrevious: () => previousMonthLabel,
                labelMonthDropdown: () => t('common.date_picker.month', { defaultValue: language === 'vi' ? 'Tháng' : 'Month' }),
                labelYearDropdown: () => t('common.date_picker.year', { defaultValue: language === 'vi' ? 'Năm' : 'Year' }),
              }}
              components={{
                PreviousMonthButton: buttonProps => <button {...buttonProps} aria-label={previousMonthLabel}><ChevronLeft size={16} /></button>,
                NextMonthButton: buttonProps => <button {...buttonProps} aria-label={nextMonthLabel}><ChevronRight size={16} /></button>,
              }}
              classNames={{
                root: 'w-full', months: 'w-full', month: 'w-full',
                month_caption: 'relative flex h-9 items-center justify-center gap-1', caption_label: 'hidden',
                dropdowns: 'flex items-center justify-center gap-1', dropdown_root: 'relative inline-flex items-center',
                dropdown: 'h-8 appearance-none rounded-lg border border-custom-border bg-primary-bg px-2 text-xs font-semibold text-primary-text outline-none focus-visible:border-[var(--focus-border)]  ',
                nav: 'absolute inset-x-0 top-0 flex h-9 items-center justify-between',
                button_previous: 'z-10 rounded-lg p-1.5 text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text  ',
                button_next: 'z-10 rounded-lg p-1.5 text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text  ',
                month_grid: 'w-full border-collapse', weekdays: '', weekday: 'h-8 text-center text-[10px] font-semibold uppercase text-secondary-text',
                week: '', day: 'h-9 w-9 p-0 text-center',
                day_button: 'mx-auto flex size-9 items-center justify-center rounded-full text-xs text-primary-text transition-colors duration-150 hover:bg-primary-bg   ',
                selected: '[&>button]:bg-accent [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-accent',
                today: '[&>button]:text-accent [&>button]:bg-[var(--focus-surface)] [&>button]:font-semibold',
                outside: 'text-secondary-text/40', disabled: 'cursor-not-allowed text-secondary-text/35 [&>button]:pointer-events-none [&>button]:opacity-40',
                hidden: 'invisible', footer: 'mt-2',
              }}
            />
            <div className="mt-2 flex items-center justify-between border-t border-custom-border pt-2">
              <button type="button" onClick={() => handleSelectDate(today)}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-primary-bg  ">
                {t('common.date_picker.today', { defaultValue: language === 'vi' ? 'Hôm nay' : 'Today' })}
              </button>
              <button type="button" onClick={() => { emitValue(''); setIsOpen(false); requestAnimationFrame(() => buttonRef.current?.focus()); }}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text  ">
                {t('common.date_picker.clear', { defaultValue: language === 'vi' ? 'Xóa' : 'Clear' })}
              </button>
            </div>
          </div>, document.body,
        )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
