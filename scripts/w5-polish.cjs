const fs=require('node:fs');
for(const p of ['src/features/admin/components/family-tree/MemberTable.tsx','src/features/admin/components/family-tree/RelationshipExplorer.tsx','src/features/my-life/pages/FamilyMemberProfilePage.tsx']) {
 let s=fs.readFileSync(p,'utf8').replaceAll('alt=""/>','alt="" className="family-relation-avatar"/>').replaceAll('variant="neutral"','variant="default"');fs.writeFileSync(p,s);
}
const p='src/features/admin/components/family-tree/family-view/FamilyPersonCard.tsx';
let s=fs.readFileSync(p,'utf8');
const marker='  const metadata =',start=s.indexOf(marker),end=s.indexOf('  const name =',start);
s=s.slice(0,start)+'  const metadata = [generation, gender].filter(Boolean).join(" · ");\n  const lifeRange = [birthYear, member.lifeStatus === "DECEASED" ? (deathYear ?? "†") : undefined].filter(value => value != null).join(" – ");\n'+s.slice(end);
s=s.replace('<span className="family-person-card__meta">{metadata}</span>','<span className="family-person-card__meta" title={metadata}>{metadata}</span><span className="family-person-card__years">{lifeRange}</span>');
s=s.replace('setMenuOpen(false); } }}>', 'setMenuOpen(false); cardRef.current?.querySelector<HTMLButtonElement>(".family-person-card__action-trigger")?.focus(); } }}>');
fs.writeFileSync(p,s);
// Keep tab order aligned with the desktop reading order, retaining each field verbatim.
const f='src/features/admin/components/family-tree/MemberFormModal.tsx';s=fs.readFileSync(f,'utf8');
const begins=[...s.matchAll(/        <div className="family-form-section">/g)].map(m=>m.index);
const final=s.indexOf('\n      </form>',begins[3]);
if(begins.length!==4 || final<0)throw Error('Unexpected form layout');
const blocks=begins.map((v,i)=>s.slice(v,begins[i+1]??final));
s=s.slice(0,begins[0])+blocks[1]+blocks[2]+blocks[0]+blocks[3]+s.slice(final);
fs.writeFileSync(f,s);
const css='src/features/admin/components/family-tree/FamilyExperience.css';s=fs.readFileSync(css,'utf8');
s=s.replaceAll('.family-form-section:nth-child(1)', '.family-form-section[data-section="bio"]').replaceAll('.family-form-section:nth-child(2)', '.family-form-section[data-section="basic"]').replaceAll('.family-form-section:nth-child(3)', '.family-form-section[data-section="relations"]').replaceAll('.family-form-section:nth-child(4)', '.family-form-section[data-section="contact"]');
fs.writeFileSync(css,s);
const names=['basic','relations','bio','contact'];let i=0;s=fs.readFileSync(f,'utf8').replaceAll('className="family-form-section"',()=>`className="family-form-section" data-section="${names[i++]}"`);fs.writeFileSync(f,s);
