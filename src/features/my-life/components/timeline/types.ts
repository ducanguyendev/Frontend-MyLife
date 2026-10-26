export type Filter = 'ALL' | 'BIRTH' | 'MARRIAGE' | 'FAMILY' | 'LOCATION' | 'MEMORY' | 'OTHER';
export const FILTER_TYPES: Record<Filter, string[]> = { ALL: [], BIRTH: ['BIRTH', 'DEATH'], MARRIAGE: ['MARRIAGE'], FAMILY: ['CHILD_BIRTH', 'CUSTOM'], LOCATION: ['ADDRESS_CHANGE'], MEMORY: ['MEMORY', 'ANNIVERSARY'], OTHER: [] };
