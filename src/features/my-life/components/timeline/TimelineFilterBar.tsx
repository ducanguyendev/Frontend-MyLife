import type { Filter } from './types';
import { FILTER_TYPES } from './types';
import { Chip } from '@/design-system/components/Controls';

export function TimelineFilterBar({ value, onChange, label, translate }: { value: Filter; onChange: (value: Filter) => void; label: string; translate: (key: string) => string }) {
  return <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
    {(Object.keys(FILTER_TYPES) as Filter[]).map(key => <Chip key={key} onClick={() => onChange(key)} selected={value === key}>{translate(`admin.family_v2.filter_${key.toLowerCase()}`)}</Chip>)}
  </div>;
}
