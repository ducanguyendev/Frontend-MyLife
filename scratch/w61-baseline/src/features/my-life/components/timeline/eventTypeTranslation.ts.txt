export const EVENT_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  BIRTH: 'admin.family_v2.type_birth',
  DEATH: 'admin.family_v2.type_death',
  MARRIAGE: 'admin.family_v2.type_marriage',
  CHILD_BIRTH: 'admin.family_v2.type_child_birth',
  ADDRESS_CHANGE: 'admin.family_v2.type_address_change',
  ANNIVERSARY: 'admin.family_v2.type_anniversary',
  MEMORY: 'admin.family_v2.type_memory',
  CUSTOM: 'admin.family_v2.type_custom',
};

export function getTimelineEventTypeTranslationKey(eventType: string): string {
  return EVENT_TYPE_TRANSLATION_KEYS[eventType] ?? 'admin.family_v2.type_event';
}
