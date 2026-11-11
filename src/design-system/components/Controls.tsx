import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Button, type ButtonProps } from '@/shared/components/ui/Button';
import { Input, type InputProps } from '@/shared/components/ui/Input';

export function IconButton({ label, children, size = 'md', ...props }: Omit<ButtonProps, 'children'> & { label: string; children: ReactNode }) {
  return <Button {...props} size={size} aria-label={label} title={label} className={`ds-icon-button ds-icon-button--${size} ${props.className ?? ''}`}>{children}</Button>;
}

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'leftIcon'>>(function SearchInput(props, ref) {
  return <Input {...props} ref={ref} type="search" density="compact" leftIcon={<Search size={17} />} />;
});

export interface SegmentOption<T extends string> { value: T; label: string; icon?: ReactNode; disabled?: boolean }

/** A group of mutually exclusive view/filter buttons. Arrow keys move focus and selection. */
export function SegmentedControl<T extends string>({ label, value, onChange, options, iconOnly = false, className = '' }: {
  label: string; value: T; onChange: (value: T) => void; options: readonly SegmentOption<T>[]; iconOnly?: boolean; className?: string;
}) {
  const group = useRef<HTMLDivElement>(null);
  return <div ref={group} role="group" aria-label={label} className={`ds-segments ${className}`} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const enabled = options.filter(option => !option.disabled);
    const index = enabled.findIndex(option => option.value === value);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    if (!enabled[next]) return;
    event.preventDefault(); onChange(enabled[next].value);
    group.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')[next]?.focus();
  }}>{options.map(option => <button type="button" key={option.value} disabled={option.disabled} aria-pressed={value === option.value} aria-label={iconOnly ? option.label : undefined} title={option.label} onClick={() => onChange(option.value)} className="ds-segments__item">{option.icon}{!iconOnly && <span>{option.label}</span>}</button>)}</div>;
}

export function Chip({ selected = false, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return <button {...props} type="button" aria-pressed={selected} className={`ds-chip ${selected ? 'is-selected' : ''} ${className}`}>{children}</button>;
}
