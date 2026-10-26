import { MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import type { FamilyTimelineEvent } from '@/features/admin/services/familyV2Service';

export function TimelineEventCard({ event, date, onEdit, onDelete, translate }: { event: FamilyTimelineEvent; date: string; onEdit: (event: FamilyTimelineEvent) => void; onDelete: (event: FamilyTimelineEvent) => void; translate: (key: string) => string }) {
 return <li className="relative list-none rounded-2xl border border-custom-border bg-secondary-bg p-4 sm:p-5">
  <span aria-hidden="true" className="absolute -left-[1.83rem] top-5 h-3 w-3 rounded-full border-2 border-primary-bg bg-accent sm:-left-[2.33rem]" />
  <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0">
   <p className="m-0 text-xs font-semibold text-accent">{date}</p>
   <span className="mt-2 inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">{translate(`admin.family_v2.type_${event.eventType.toLowerCase()}`)}</span>
   <h3 className="mb-1 mt-2 break-words text-base font-bold text-primary-text">{event.title}</h3>
   {event.memberName && <p className="m-0 text-sm text-secondary-text">{event.memberName}</p>}
   {event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-secondary-text">{event.description}</p>}
   {event.location && <p className="mt-2 inline-flex items-center gap-1 text-sm text-secondary-text"><MapPin size={14} aria-hidden="true" />{event.location}{event.latitude !== null && event.longitude !== null && <a className="ml-2 text-accent underline" href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=14/${event.latitude}/${event.longitude}`} target="_blank" rel="noreferrer">{translate('admin.family_v2.view_on_map')}</a>}</p>}
  </div>{!event.isDerived && <div className="flex shrink-0 gap-2"><Button variant="secondary" size="sm" onClick={() => onEdit(event)}>{translate('admin.family_v2.edit_event')}</Button><button type="button" onClick={() => onDelete(event)} aria-label={translate('admin.family_v2.delete_event')} className="rounded-lg border border-custom-border p-2 text-secondary-text hover:text-error"><Trash2 size={16} /></button></div>}</div>
 </li>;
}
