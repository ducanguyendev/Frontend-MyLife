const fs=require('node:fs');
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('tests/anniversary.test.cjs',s=>{
 s=s.replace('assert.match(source, /overflow-y-auto overscroll-contain/);','assert.match(source, /memory-calendar-layout/);').replace('assert.match(source, /xl:grid-cols-\\[minmax\\(300px,0\\.4fr\\)_minmax\\(0,0\\.6fr\\)\\]/);','assert.match(source, /memory-upcoming/);');
 const a=s.indexOf("test('calendar day cells distinguish"),b=s.indexOf("\ntest(",a+6);
 s=s.slice(0,a)+`test('calendar keeps event types and counts while selected and today states have non-color semantics', () => {
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/AnniversaryTab.tsx'), 'utf8');
  const css = readFileSync(join(__dirname, '../src/features/my-life/components/memories/Memories.css'), 'utf8');
  assert.ok(source.includes('data-event-type={dayVisual.type}'));
  assert.ok(source.includes('dayVisual.count > 1'));
  assert.ok(source.includes("aria-current={isToday ? 'date' : undefined}"));
  assert.ok(source.includes('aria-pressed={isSelected}'));
  assert.ok(source.includes('memory-calendar__day'));
  assert.ok(css.includes('.memory-calendar__day.is-today'));
  assert.ok(css.includes('.memory-calendar__day.is-selected'));
  assert.ok(css.includes('outline:1px solid var(--memory-accent)'));
});
`+s.slice(b);
 s=s.replace('assert.match(source, /onClick=\\{event => \\{ event\\.stopPropagation\\(\\); void openEditor\\(item\\); \\}\\}/);',"assert.ok(source.includes('onClick:() => void openEditor(item)'));");
 s=s.replace('assert.match(source, /onClick=\\{event => \\{ event\\.stopPropagation\\(\\); setDeleting\\(item\\); \\}\\}/);',"assert.ok(source.includes('onClick:() => setDeleting(item)'));");
 s=s.replace('showTitle=\\{false\\}', 'title=\\{ariaLabel\\}');
 return s;
});
edit('tests/family-v2.test.cjs',s=>{
 s=s.replace('onDelete=\\{event => void remove\\(event\\)\\}', 'onDelete=\\{setPendingDelete\\}');
 s=s.replace('family timeline uses the shared floating add button and shared modal for create and edit','family timeline uses a page-header action and shared modal for create and edit');
 s=s.replace('assert.match(page, /FloatingAddButton ariaLabel=\\{t\\(\'admin\\.family_v2\\.add_event\'\\)\\} tooltip=\\{t\\(defaultEventType/);',"assert.match(page, /PageHeader/); assert.match(page, /defaultEventType &&/);");
 s=s.replace('assert.match(card, /!event\\.isDerived/);','assert.match(card, /event\\.isDerived \\|\\| isDerivedOnlyEventType/);');
 s=s.replace('assert.match(modal, /maxWidth="2xl"/);','assert.match(modal, /maxWidth="full"/);').replace('assert.match(modal, /!max-h-\\[min\\(88vh,780px\\)\\]/);','assert.match(modal, /memory-form--timeline/);');
 s=s.replace("assert.match(read('src/features/my-life/components/timeline/TimelineFilterBar.tsx'), /getTimelinePillClass/);","assert.match(read('src/features/my-life/components/timeline/TimelineFilterBar.tsx'), /<Chip/);");
 return s;
});
edit('tests/library-ui.test.cjs',s=>{
 s=s.replace("assert.ok(find(text, 'input').className.includes('rounded-2xl'));","assert.equal(find(text, 'Input').floatingLabelAlways, true);");
 s=s.replaceAll('assert.match(source, /variant="primary"[\\s\\S]*?onClick=\\{\\(\\) => setUploadOpen\\(true\\)\\}/);',"assert.match(source, /onClick=\\{\\(\\) => setUploadOpen\\(true\\)\\}/);");
 const a=s.indexOf("test('Library is a single-title"),b=s.indexOf('\ntest(',a+6);
 s=s.slice(0,a)+`test('Library uses the page scroll area with visual albums, photos and contextual loading/error states', () => {
  const page = readFileSync(join(__dirname, '../src/features/my-life/pages/LibraryPage.tsx'), 'utf8');
  const source = readFileSync(join(__dirname, '../src/features/admin/components/family-tree/LibraryTab.tsx'), 'utf8');
  assert.ok(page.includes('contentScroll="auto"'));
  for (const token of ['<PageHeader', '<AlbumCard', '<PhotoCard', '<MemorySkeleton', '<ErrorState', '<EmptyState', 'no_albums', 'no_matches']) assert.ok(source.includes(token), token);
  assert.doesNotMatch(source, /categoryDialog|LibraryCategoryModal/);
});
`+s.slice(b);
 s=s.replace("const { PhotoLightboxModal } = load('PhotoLightboxModal.tsx', h.mocks, { document, window });",`h.mocks['@/features/admin/components/family-tree/LibraryImage'] = h.mocks['./LibraryImage'];
  h.mocks['./Memories.css'] = {};
  const { LibraryLightbox: PhotoLightboxModal } = load('../../../my-life/components/memories/LibraryLightbox.tsx', h.mocks, { document, window });`);
 return s;
});
