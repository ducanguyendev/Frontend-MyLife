export type Filter = 'ALL' | 'BIRTH' | 'MARRIAGE' | 'FAMILY' | 'LOCATION' | 'MEMORY' | 'OTHER';
export type CreatableTimelineEventType = 'CUSTOM' | 'MEMORY' | 'ADDRESS_CHANGE' | 'MARRIAGE';
export const DERIVED_ONLY_EVENT_TYPES = ['BIRTH', 'DEATH'] as const;

export function isDerivedOnlyEventType(eventType: string): boolean {
  return DERIVED_ONLY_EVENT_TYPES.includes(eventType as typeof DERIVED_ONLY_EVENT_TYPES[number]);
}

export const FILTER_TYPES: Record<Filter, string[]> = {
  ALL: [],
  BIRTH: ['BIRTH', 'DEATH'],
  MARRIAGE: ['MARRIAGE'],
  // CHILD_BIRTH is legacy-only; new family events use CUSTOM.
  FAMILY: ['CUSTOM', 'CHILD_BIRTH'],
  LOCATION: ['ADDRESS_CHANGE'],
  MEMORY: ['MEMORY', 'ANNIVERSARY'],
  // OTHER is computed as the fallback for any event outside known groups.
  OTHER: [],
};

export const KNOWN_FILTER_EVENT_TYPES = [...new Set(
  Object.entries(FILTER_TYPES)
    .filter(([filter]) => filter !== 'ALL' && filter !== 'OTHER')
    .flatMap(([, eventTypes]) => eventTypes),
)];

export function matchesTimelineFilter(eventType: string, filter: Filter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'OTHER') return !KNOWN_FILTER_EVENT_TYPES.includes(eventType);
  return FILTER_TYPES[filter].includes(eventType);
}

export function getDefaultEventTypeForFilter(filter: Filter): CreatableTimelineEventType | null {
  switch (filter) {
    case 'BIRTH': return null;
    case 'MARRIAGE': return 'MARRIAGE';
    case 'LOCATION': return 'ADDRESS_CHANGE';
    case 'MEMORY': return 'MEMORY';
    case 'OTHER': return null;
    case 'ALL':
    case 'FAMILY':
    default: return 'CUSTOM';
  }
}
