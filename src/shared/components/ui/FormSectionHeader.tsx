import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** The approved Member section header, also usable for non-collapsible groups. */
export function FormSectionHeader({ title, icon, expanded, onToggle, id }: {
  title: ReactNode; icon?: ReactNode; expanded?: boolean; onToggle?: () => void; id?: string;
}) {
  const content = <><span className="flex items-center gap-2.5">
    {icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent">{icon}</span>}
    <span className="text-sm font-semibold text-primary-text">{title}</span>
  </span>{onToggle && <ChevronDown size={16} aria-hidden="true" className={`text-secondary-text transition-transform duration-[170ms] ${expanded ? 'rotate-180' : ''}`}/>}</>;
  const className = 'ds-form-section-header flex w-full items-center justify-between border-b border-custom-border/50 p-3.5 text-left';
  return onToggle ? <button id={id} type="button" aria-expanded={expanded} onClick={onToggle} className={`${className} cursor-pointer transition-colors hover:bg-secondary-bg/60`}>{content}</button>
    : <h2 id={id} className={`${className} m-0`}>{content}</h2>;
}
