import React from 'react';
import { SearchInput } from '@/design-system/components/Controls';

export interface SearchBarProps {
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
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  ariaLabel,
  id,
  name,
  autoFocus = false,
}) => (
    <SearchInput
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
