import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { SearchInput } from '@/design-system/components/Controls';

export interface SearchBarProps {
  clearLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}

/** Shared keyword search field. Layout width is controlled by its parent. */
export const SearchBar: React.FC<SearchBarProps> = ({
  value, clearLabel,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  ariaLabel,
  id,
  name,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <SearchInput
      ref={inputRef}
      rightIcon={value && clearLabel ? <button type="button" disabled={disabled} aria-label={clearLabel} title={clearLabel} className="family-search-clear" onClick={() => { onChange(''); inputRef.current?.focus(); }}><X size={16}/></button> : undefined}
      id={id}
      name={name}
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      containerClassName={className}
    />
);
};
