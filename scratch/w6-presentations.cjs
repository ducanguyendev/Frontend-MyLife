const fs=require('node:fs');
const edit=(file,fn)=>{const source=fs.readFileSync(file,'utf8');const next=fn(source);if(next===source)throw Error('No edit: '+file);fs.writeFileSync(file,next);};
edit('src/features/admin/components/family-tree/FamilyExperience.css',s=>s.replace('grid-template-columns:repeat(auto-fill,minmax(220px,1fr))','grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr))'));
for(const name of ['AnniversariesPage','LibraryPage'])edit(`src/features/my-life/pages/${name}.tsx`,s=>s.replace('contentScroll="hidden"','contentScroll="auto"').replace('flex h-full min-h-0 flex-1 flex-col','flex min-h-0 flex-1 flex-col').replace('flex min-h-0 flex-1 flex-col overflow-hidden','flex min-h-0 flex-1 flex-col'));
edit('src/features/my-life/components/TimelineEventModal.tsx',s=>s.replace('maxWidth="2xl" className="!max-h-[min(88vh,780px)]"','maxWidth="full" className="memory-form memory-form--timeline"').replace('className="flex flex-col gap-4">','className="timeline-event-form">').replace('{approximateField}','{approximateField}<p className="memory-form__hint">{t(\'memories.approximateHelp\')}</p>'));
edit('src/features/admin/components/family-tree/AnniversaryTab.tsx',s=>{
 s=s.replace('Chip, Loading, ErrorState','Chip, ErrorState');
 s=s.replace("import { SearchBar }", "import { MemorySkeleton } from '@/features/my-life/components/memories/MemorySkeleton';\nimport { MemoryActions } from '@/features/my-life/components/memories/MemoryActions';\nimport { AnniversaryDateTile } from '@/features/my-life/components/memories/AnniversaryDateTile';\nimport '@/features/my-life/components/memories/Memories.css';\nimport { SearchBar }");
 s=s.replace('className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain custom-scrollbar xl:overflow-hidden"','className="memory-page memory-page--calendar"');
 s=s.replace("<PageHeader title={t('myLife.modules.anniversaries.title')} description={t('myLife.modules.anniversaries.description')}","<PageHeader eyebrow={t('appShell.memories')} title={t('appShell.calendar')} description={t('memories.calendarDescription')}");
 s=s.replace('className="flex min-h-0 flex-1 flex-col gap-3 xl:grid xl:grid-cols-[minmax(300px,0.4fr)_minmax(0,0.6fr)]"','className={`memory-calendar-layout ${loading ? \'is-loading\' : \'\'}`}');
 s=s.replace("<section aria-label={t('admin.anniversary_ui.calendar')} className=\"shrink-0 rounded-2xl border border-custom-border bg-secondary-bg p-3 sm:p-4 xl:flex xl:min-h-0 xl:flex-col\">", "{loading && <MemorySkeleton module=\"calendar\"/>}\n      <section aria-label={t('admin.anniversary_ui.calendar')} className=\"memory-calendar\">");
 const palette=s.indexOf('            const eventTone =');const endPalette=s.indexOf('            return <button',palette);
 s=s.slice(0,palette)+"            const dayState = `memory-calendar__day ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${dayEvents.length ? 'has-events' : ''} ${inMonth ? '' : 'is-outside'}`;\n"+s.slice(endPalette);
 s=s.replace('className={`relative flex aspect-square min-h-9 cursor-pointer flex-col items-center justify-center rounded-lg border text-sm transition-colors duration-200 motion-reduce:transition-none sm:min-h-10 ${inMonth || isSelected ? \'\' : \'text-secondary-text/50\'} ${dayState}`}','data-event-type={dayVisual.type} className={dayState}');
 s=s.replace('className="grid grid-cols-7 gap-1" role="grid"','className="memory-calendar__grid" role="grid" onKeyDown={event => {\n          const offsets: Record<string,number> = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-7, ArrowDown:7 };\n          const days = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(\'[role=gridcell]\'));\n          const index = days.indexOf(event.target as HTMLButtonElement);\n          if (index < 0) return;\n          const next = event.key === \'Home\' ? index - index % 7 : event.key === \'End\' ? index + 6 - index % 7 : index + (offsets[event.key] ?? 0);\n          if (event.key in offsets || event.key === \'Home\' || event.key === \'End\') { event.preventDefault(); days[Math.max(0,Math.min(days.length - 1,next))]?.focus(); }\n        }}');
 s=s.replace('className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-2xl border border-custom-border bg-primary-bg xl:min-h-0"','className="memory-upcoming"');
 s=s.replace('className="flex shrink-0 flex-col gap-3 border-b border-custom-border px-4 py-3"','className="memory-upcoming__header"');
 s=s.replace('className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 custom-scrollbar sm:p-4"','className="memory-upcoming__list"');
 s=s.replace('<Loading label={t(\'admin.anniversary_ui.loading\')}/>','<MemorySkeleton module="calendar"/>');
 s=s.replace("t('admin.anniversary_ui.empty')", "t('memories.emptyCalendar')");
 s=s.replace('className="w-full sm:w-[20rem] sm:max-w-[40vw] sm:shrink"','className="memory-upcoming__search" clearLabel={t(\'family.clearSearch\')}');
 s=s.replace('className="flex w-max min-w-full flex-nowrap items-center gap-1 overflow-x-auto sm:w-auto sm:min-w-0 sm:shrink-0"','className="memory-type-filters"');
 s=s.replace('className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"','className="memory-upcoming__filters"');
 s=s.replace('className={`cursor-pointer rounded-xl border p-3 shadow-sm transition-colors duration-200 motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:p-4 ${selectedEventId === item.id ? \'border-accent bg-accent/5 shadow-md\' : \'border-custom-border bg-secondary-bg hover:border-accent/30\'}`}','className={`anniversary-event ${selectedEventId === item.id ? \'is-selected\' : \'\'}`}');
 s=s.replace('<div className="flex items-start justify-between gap-3">\n                    <div', '<div className="anniversary-event__summary"><AnniversaryDateTile date={item.nextSolarDate}/>\n                    <div');
 const actionStart=s.indexOf('                  <div className="mt-2 flex justify-end gap-1 border-t');
 const actionEnd=s.indexOf('                  </div>',actionStart)+24;
 if(actionStart<0||actionEnd<24)throw Error('Anniversary action block');
 s=s.slice(0,actionStart)+`                  <div className="anniversary-event__actions"><MemoryActions label={t('memories.eventActions')} actions={[
                    { label:t('admin.anniversary_ui.edit'), icon:<Pencil size={14}/>, disabled:membersLoading, onClick:() => void openEditor(item) },
                    { label:t('admin.anniversary_ui.delete'), icon:<Trash2 size={14}/>, danger:true, onClick:() => setDeleting(item) },
                  ]}/></div>`+s.slice(actionEnd);
 return s;
});
edit('src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx',s=>{
 s=s.replace('showTitle={false} ariaLabel={ariaLabel}','title={ariaLabel} ariaLabel={ariaLabel}');
 s=s.replace('maxWidth="2xl"','maxWidth="full" className="memory-form memory-form--calendar"');
 s=s.replace('noValidate className="space-y-3"','noValidate className="anniversary-form-grid"');
 const blocks=[...s.matchAll(/      <section className=[\s\S]*?      <\/section>/g)];
 if(blocks.length!==3)throw Error('Expected three anniversary form sections');
 const a=blocks[0].index,b=blocks[2].index+blocks[2][0].length;
 return s.slice(0,a)+'<div className="memory-form-column">'+blocks[0][0]+blocks[2][0]+'</div><div className="memory-form-column">'+blocks[1][0]+'</div>'+s.slice(b);
});
for(const file of ['LibraryAlbumModal','LibraryPhotoEditModal'])edit(`src/features/admin/components/family-tree/${file}.tsx`,s=>s.replace('return <Modal isOpen','return <Modal className="memory-form memory-form--library" isOpen'));
