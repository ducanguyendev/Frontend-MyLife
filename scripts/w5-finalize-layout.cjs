const fs=require('node:fs');
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
for(const lang of ['vi','en'])edit(`src/shared/locales/${lang}/admin.json`,s=>{const d=JSON.parse(s);Object.assign(d,lang==='en'?{section_basic_info:'Personal information',create_member:'Add member',children_count:'children',siblings_count:'people'}:{section_basic_info:'Thông tin cá nhân',create_member:'Thêm thành viên',children_count:'người con',siblings_count:'người'});return JSON.stringify(d,null,2)+'\n';});
edit('src/features/my-life/pages/FamilyMemberProfilePage.tsx',s=>s.replace("t('admin.father')","t('admin.field_father')").replace("t('admin.mother')","t('admin.field_mother')").replace("t('admin.children')","t('admin.field_children')"));
edit('src/features/admin/components/family-tree/MemberFormModal.tsx',s=>{
 const positions=[...s.matchAll(/        <div className="family-form-section"/g)].map(m=>m.index);
 const end=s.indexOf('\n      </form>',positions[3]);if(positions.length!==4)throw Error('Section count');
 const blocks=positions.map((v,i)=>s.slice(v,positions[i+1]??end));
 return s.slice(0,positions[0])+'<div className="family-form-column">\n'+blocks[0]+blocks[2]+'</div><div className="family-form-column">\n'+blocks[1]+blocks[3]+'</div>'+s.slice(end);
});
edit('src/features/admin/components/family-tree/FamilyExperience.css',s=>s.replace(/\.family-form-section\[data-section="(?:bio|basic|relations|contact)"\] \{[^}]+\}/g,'').replace('.family-form-section:nth-child(n) { grid-column:auto; grid-row:auto; }','')+'\n.family-form-column { display:grid; align-content:start; gap:20px; min-width:0; }\n.family-member-mobile__identity .family-relation-avatar { width:44px; height:44px; flex-shrink:0; border-radius:12px; object-fit:cover; }\n');
edit('tests/member-form-layout.test.cjs',s=>s.replace(`['aria-expanded={openSections.includes("basic")}', 'aria-expanded={openSections.includes("relations")}', 'aria-expanded={openSections.includes("bio")}', 'aria-expanded={openSections.includes("contact")}']`,`['aria-expanded={openSections.includes("basic")}', 'aria-expanded={openSections.includes("bio")}', 'aria-expanded={openSections.includes("relations")}', 'aria-expanded={openSections.includes("contact")}']`));
