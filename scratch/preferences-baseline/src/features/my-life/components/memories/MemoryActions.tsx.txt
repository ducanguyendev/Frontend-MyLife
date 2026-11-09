import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { IconButton } from '@/shared/components/ui';

export interface MemoryAction { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }

/** Shared contextual actions for moments, anniversaries, albums and photographs. */
export function MemoryActions({ label, actions }: { label: string; actions: MemoryAction[] }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = (restore = false) => { setOpen(false); if (restore) root.current?.querySelector<HTMLButtonElement>('button')?.focus(); };
  const toggle = () => {
    const rect = root.current?.getBoundingClientRect();
    setAbove(Boolean(rect && rect.bottom + actions.length * 42 + 24 > window.innerHeight));
    setOpen(value => !value);
  };
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); root.current?.querySelector<HTMLButtonElement>('button')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div ref={root} className="memory-actions" onClick={event => event.stopPropagation()}>
    <IconButton label={label} variant="ghost" size="sm" aria-haspopup="menu" aria-expanded={open} onClick={toggle}
      onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) toggle(); requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>('[role=menuitem]:not(:disabled)')?.focus()); } }}><MoreHorizontal size={18}/></IconButton>
    {open && <div role="menu" aria-label={label} className={`memory-actions__menu ${above ? 'is-above' : ''}`} onKeyDown={event => {
      if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      event.preventDefault(); items[next]?.focus();
    }}>{actions.map(action => <button key={action.label} type="button" role="menuitem" disabled={action.disabled} className={action.danger ? 'is-danger' : ''} onClick={() => { close(true); action.onClick(); }}>{action.icon}{action.label}</button>)}</div>}
  </div>;
}
