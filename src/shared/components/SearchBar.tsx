import React from 'react';
import { Search } from 'lucide-react';

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
  <div className={`relative w-full ${className}`.trim()}>
    <Search
      aria-hidden="true"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text"
      size={16}
    />
    <input
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className="w-full rounded-xl border border-custom-border bg-secondary-bg py-2 pl-9 pr-4 text-sm text-primary-text shadow-sm transition-colors placeholder:text-secondary-text/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
);
