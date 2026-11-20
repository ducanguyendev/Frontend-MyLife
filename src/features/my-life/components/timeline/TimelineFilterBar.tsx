import type { Filter } from './types';
import { FILTER_TYPES } from './types';
import { Chip } from '@/design-system/components/Controls';
import { SearchBar } from '@/shared/components/SearchBar';
import { Select } from '@/shared/components/ui';

export function TimelineFilterBar({ value, onChange, label, translate, search, onSearchChange, year, onYearChange, years }: {
  value: Filter; onChange: (value: Filter) => void; label: string; translate: (key: string) => string;
  search: string; onSearchChange: (value: string) => void; year: string; onYearChange: (value: string) => void; years: (number | null)[];
}) {
  return <div className="grid min-w-0 gap-3">
    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
      <SearchBar value={search} onChange={onSearchChange} placeholder={translate('memories.searchTimeline')} ariaLabel={translate('memories.searchTimeline')} clearLabel={translate('family.clearSearch')} className="min-w-0" />
      <Select label={translate('memories.years')} value={year} onValueChange={onYearChange} options={[
        { value: 'all', label: translate('memories.allYears') },
        ...years.map(value => ({ value: value?.toString() ?? 'unknown', label: value?.toString() ?? translate('admin.family_v2.unknown_date') })),
      ]} />
    </div>
    <p className="m-0 text-xs text-secondary-text">{translate('memories.timelineSearchHint')}</p>
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={label}>
    {(Object.keys(FILTER_TYPES) as Filter[]).map(key => <Chip key={key} onClick={() => onChange(key)} selected={value === key}>{translate(`admin.family_v2.filter_${key.toLowerCase()}`)}</Chip>)}
    </div>
  </div>;
}
