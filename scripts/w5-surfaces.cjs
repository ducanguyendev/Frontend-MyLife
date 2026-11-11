const fs=require('node:fs');
function edit(file,fn){const s=fs.readFileSync(file,'utf8'); const next=fn(s);if(next===s)throw Error(file);fs.writeFileSync(file,next);}
edit('src/features/admin/components/family-tree/FamilyExperience.css',s=>s.replaceAll('--surface-hover','--brand-primary-soft').replaceAll('--text-accent','--brand-primary').replaceAll('--status-error','--state-danger').replaceAll('--status-warning','--state-warning').replaceAll('font-family:var(--font-editorial)','font-family:Georgia,"Times New Roman",serif'));
edit('src/features/admin/components/family-tree/MemberTable.tsx',s=>s
 .replace('getGenerationColors, ', '')
 .replace('import { TableShell }', 'import { Button } from "@/shared/components/ui";\nimport { TableShell }')
 .replace('    <TableShell>', `    <>
      <div className="family-member-mobile">{members.map(member => <article key={member.id}>
        <button type="button" className="family-member-mobile__identity" onClick={() => onView(member)}><MemberAvatarImage member={member} alt=""/><strong>{displayName(member.fullName)}</strong></button>
        <dl>{[
          [t('admin.col_generation'), member.generation], [t('admin.col_gender'), genderLabel(member.gender)],
          [t('admin.col_role'), roleLabel(member.role)], [t('admin.col_dob'), member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB') : missingValue],
          [t('admin.col_phone'), member.phoneNumber], [t('admin.col_address'), member.address],
        ].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || missingValue}</dd></div>)}</dl>
        <div className="family-member-mobile__actions"><Button size="sm" variant="secondary" onClick={() => onView(member)}>{t('admin.view_detail')}</Button><Button size="sm" variant="ghost" onClick={() => onEdit(member)}>{t('admin.edit')}</Button><Button size="sm" variant="ghost" onClick={() => onDelete(member)}>{t('admin.delete')}</Button></div>
      </article>)}</div>
      <div className="family-member-table-wrap"><TableShell>`)
 .replace('className="w-full min-w-[760px] table-auto border-collapse text-left"', 'className="family-member-table w-full table-auto border-collapse text-left"')
 .replace(/hidden (px-[^\"]+) (?:sm|md|lg|xl):table-cell/g,'$1')
 .replace('              const colors = getGenerationColors(member.generation);\n','')
 .replace('inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border}', 'family-generation inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold')
 .replace('</TableShell>', '</TableShell></div></>'));
edit('src/features/admin/components/family-tree/RelationshipExplorer.tsx',s=>s
 .replace("import type { FamilyMember }", "import { MemberAvatarImage } from './MemberAvatarImage';\nimport type { FamilyMember }")
 .replace('const selectedFrom = members.find(item => item.id === Number(fromId));','const selectedFrom = members.find(item => item.id === (result?.fromMemberId ?? Number(fromId)));')
 .replace('const selectedTo = members.find(item => item.id === Number(toId));','const selectedTo = members.find(item => item.id === (result?.toMemberId ?? Number(toId)));')
 .replace('className="space-y-4 rounded-2xl border border-custom-border bg-primary-bg/45 p-4"', 'className="family-explorer space-y-4"')
 .replace("{t('admin.family_v2.relationship')}</h2></div>", "{t('admin.family_v2.relationship')}</h2></div><p className=\"family-explorer__description\">{t('family.exploreHint')}</p>")
 .replace('onValueChange={setFromId}', 'onValueChange={value => { setFromId(value); setResult(null); }}').replace('onValueChange={setToId}', 'onValueChange={value => { setToId(value); setResult(null); }}')
 .replace('className="m-0 flex flex-wrap items-center justify-center gap-2 p-0 text-sm"', 'className="family-explorer__path"')
 .replace('className="rounded-lg px-1 font-semibold text-primary-text hover:text-accent"', 'className="family-explorer__step"')
 .replace('>{node.fullName}</button>', '><MemberAvatarImage member={members.find(item => item.id === node.memberId) ?? { id: node.memberId, fullName: node.fullName } as FamilyMember} alt=""/>{node.fullName}</button>'));
edit('src/features/my-life/pages/FamilyMemberProfilePage.tsx',s=>{
 s=s.replace('ArrowLeft, BookOpen, CalendarDays, Edit3, MapPin, UsersRound', 'BookOpen, CalendarDays, Edit3, MapPin, Phone, ExternalLink, UsersRound');
 s=s.replace("import { RelationshipExplorer }", "import '@/features/admin/components/family-tree/FamilyExperience.css';\nimport { RelationshipExplorer }");
 s=s.replace('  const [error, setError] = useState(false);','  const [error, setError] = useState(false);\n  const [retry, setRetry] = useState(0);').replace('}, [memberId]);','}, [memberId, retry]);');
 const start=s.indexOf('  const relationGroup =');
 s=s.slice(0,start)+`  const relationGroup = (label: string, list: FamilyMember[]) => <div key={label} className="grid gap-3 border-b border-custom-border/60 py-4 last:border-0 sm:grid-cols-[8rem_minmax(0,1fr)]">
    <h3 className="m-0 pt-2 text-xs font-semibold text-secondary-text">{label}</h3>
    <ul className="m-0 flex flex-wrap gap-2 p-0">{list.length ? list.map(item => <li key={item.id} className="list-none"><Link className="family-profile__relation" to={\`/mylife/family/member/\${item.id}\`}><MemberAvatarImage member={item} alt=""/><span>{item.fullName}</span></Link></li>) : <li className="list-none pt-2 text-sm text-secondary-text">{t('admin.family_v2.not_updated')}</li>}</ul>
  </div>;

  return <MyLifeWorkspaceLayout backTo="/familytree" breadcrumbName={member?.fullName} showDock contentScroll="auto">
    <div className="family-profile">
      {loading ? <Loading label={t('admin.family_v2.loading_profile')}/>
        : error || !profile || !member ? <ErrorState message={t('admin.family_v2.profile_error')} action={<Button variant="secondary" onClick={() => setRetry(value => value + 1)}>{t('admin.library_ui.retry')}</Button>}/> : <>
          <header className="family-profile__hero">
            <MemberAvatarImage member={member} alt={member.fullName} className="family-profile__hero-avatar" />
            <div className="min-w-0 flex-1">
              <PageHeader eyebrow={t('family.archive')} title={member.fullName} description={<>{birth?.toLocaleDateString(dateLocale, { timeZone: 'UTC' }) ?? t('admin.family_v2.not_updated')} – {death?.toLocaleDateString(dateLocale, { timeZone: 'UTC' }) ?? t(member.lifeStatus === 'DECEASED' ? 'admin.family_v2.not_updated' : 'admin.family_v2.present')}</>}/>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-secondary-text">
                <Badge variant="outline">{t('admin.generation')} {member.generation}</Badge>
                <Badge variant="neutral">{t(member.lifeStatus === 'DECEASED' ? 'admin.member_life_status.deceased' : 'admin.member_life_status.living')}</Badge>
                {member.gender && <Badge variant="outline">{t(\`admin.gender_\${member.gender.toLowerCase()}\`, { defaultValue: member.gender })}</Badge>}
                {member.role && <Badge variant="outline">{t(\`admin.role_\${member.role.toLowerCase()}\`, { defaultValue: member.role })}</Badge>}
              </div>
              {member.address && <p className="mb-0 mt-3 flex items-start gap-2 text-sm text-secondary-text"><MapPin size={15} className="mt-0.5 shrink-0"/>{member.address}</p>}
            </div>
            <Button variant="primary" onClick={() => navigate('/familytree', { state: { editMemberId: member.id } })} leftIcon={<Edit3 size={16}/>}>{t('admin.family_v2.edit_member')}</Button>
          </header>
          <div className="family-profile__layout"><div className="family-profile__main">
            <section className="family-profile__section"><h2><UsersRound/>{t('admin.family_v2.family_relations')}</h2><div>
              {relationGroup(t('admin.father'), parents.filter(item => item.id === member.fatherId))}
              {relationGroup(t('admin.mother'), parents.filter(item => item.id === member.motherId))}
              {relationGroup(t('admin.field_spouse'), spouse)}
              {relationGroup(t('admin.children'), children)}
              {relationGroup(t('admin.family_v2.biological_siblings'), siblings)}
              {relationGroup(t('admin.family_v2.cousins'), cousins)}
            </div></section>
            <RelationshipExplorer key={member.id} members={[member, ...relatives]} initialMemberId={member.id}/>
            <section className="family-profile__section"><h2><CalendarDays/>{t('admin.family_v2.member_timeline', { name: member.fullName })}</h2>
              {profile.timeline.length ? <ol className="m-0 space-y-5 border-l-2 border-accent/30 pl-5">{profile.timeline.map(event => <li key={\`\${event.sourceType}-\${event.id}\`} className="relative list-none"><span className="absolute -left-[1.63rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent"/><p className="m-0 text-xs font-semibold text-secondary-text">{event.eventDate ? new Date(\`\${event.eventDate.slice(0, 10)}T00:00:00Z\`).toLocaleDateString(dateLocale, { timeZone:'UTC' }) : \`\${event.isApproximate ? t('admin.family_v2.approximate_date') : ''} \${event.eventYear ?? ''}\`}</p><h3 className="m-0 text-sm font-semibold text-primary-text">{event.title}</h3>{event.description && <p className="m-0 text-sm text-secondary-text">{event.description}</p>}</li>)}</ol> : <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.empty_timeline')}</p>}
              <Link to="/timeline" className="mt-5 inline-block text-sm font-semibold text-accent hover:underline">{t('family.openTimeline')} →</Link>
            </section>
            {member.biography && <section className="family-profile__section"><h2>{t('admin.biography')}</h2><p className="family-profile__biography">{member.biography}</p></section>}
          </div><aside className="family-profile__aside">
            <section className="family-profile__section"><h2>{t('family.contact')}</h2><div className="family-profile__contact">
              {member.phoneNumber && <a href={\`tel:\${member.phoneNumber}\`}><Phone size={15}/>{member.phoneNumber}</a>}
              {member.facebookUrl && <a href={member.facebookUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>Facebook</a>}
              {!member.phoneNumber && !member.facebookUrl && <p className="m-0">{t('admin.family_v2.not_updated')}</p>}
            </div></section>
            <section className="family-profile__section"><h2><CalendarDays/>{t('admin.family_v2.anniversaries')}</h2>
              {profile.anniversaries.length ? <ul className="m-0 space-y-3 p-0">{profile.anniversaries.map(item => <li key={item.id} className="family-profile__anniversary list-none rounded-xl border border-custom-border p-3"><strong className="text-sm text-primary-text">{item.title}</strong>{item.originalSolarDate && <p className="mb-0 mt-1 text-xs text-secondary-text">{new Date(\`\${item.originalSolarDate.slice(0,10)}T00:00:00Z\`).toLocaleDateString(dateLocale, {timeZone:'UTC'})}</p>}{item.place && <p className="m-0 text-xs text-secondary-text">{item.place}</p>}</li>)}</ul> : <p className="m-0 text-sm text-secondary-text">{t('admin.family_v2.no_anniversaries')}</p>}
            </section>
            <section className="family-profile__section"><h2><MapPin/>{t('admin.family_v2.location')}</h2><p className="text-sm text-secondary-text">{member.address || t('admin.family_v2.not_updated')}</p>
              {hasCoordinates && <div className="h-44 overflow-hidden rounded-xl"><MapContainer center={[member.latitude!,member.longitude!]} zoom={13} scrollWheelZoom={false} className="h-full w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Marker position={[member.latitude!,member.longitude!]}/></MapContainer></div>}
              <Link to="/map" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">{t('family.openMap')} →</Link>
            </section>
            <section className="family-profile__section"><h2><BookOpen/>{t('admin.family_v2.library')}</h2><p className="text-sm text-secondary-text">{profile.libraryMemberLinkAvailable ? t('admin.family_v2.library_related') : t('admin.family_v2.library_not_linked')}</p><Link to="/library" className="text-sm font-semibold text-accent hover:underline">{t('family.openLibrary')} →</Link></section>
          </aside></div>
        </>}
    </div>
  </MyLifeWorkspaceLayout>;
};
`;
 return s;
});
