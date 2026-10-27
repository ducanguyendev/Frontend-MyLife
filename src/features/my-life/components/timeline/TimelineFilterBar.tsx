import type { Filter } from './types';
import { FILTER_TYPES } from './types';

export function TimelineFilterBar({ value, onChange, label, translate }: { value: Filter; onChange: (value: Filter) => void; label: string; translate: (key: string) => string }) {
  return <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
    {(Object.keys(FILTER_TYPES) as Filter[]).map(key => <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${value === key ? 'border-accent bg-accent/10 text-accent' : 'border-custom-border text-secondary-text hover:text-primary-text'}`}>{translate(`admin.family_v2.filter_${key.toLowerCase()}`)}</button>)}
  </div>;
}
