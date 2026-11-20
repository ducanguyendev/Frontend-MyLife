const fs=require('node:fs');
const p='src/features/admin/components/family-tree/MemberFormModal.tsx';let s=fs.readFileSync(p,'utf8');s=s.replaceAll('({ id: member.id, fullName: formatName(member.fullName), generation: member.generation })','({ id: member.id, fullName: formatName(member.fullName), generation: member.generation, avatarUrl: member.avatarUrl, hasManagedAvatar: member.hasManagedAvatar, updatedAt: member.updatedAt })');fs.writeFileSync(p,s);
const test='tests/family-w5.browser.cjs';s=fs.readFileSync(test,'utf8').replace("await textClick('Delete member','[role=menuitem]');", "await page.waitForSelector('.family-gallery-card__menu [role=menuitem]');await textClick('Delete member','[role=menuitem]');");fs.writeFileSync(test,s);
// Compare the exact W5 entry-state handlers before removing temporary baselines.
const manager='src/features/admin/components/FamilyTreeManager.tsx',form='src/features/admin/components/family-tree/MemberFormModal.tsx';
const section=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
const comparisons=[
 [form,'  const handleFormSubmit =','  if (!isOpen || !editingMember)'],
 [manager,'  const handleSaveMember =','  return ('],
 [manager,'  const handleOpenModal =','  const handleCloseModal ='],
];
for(const[file,start,end]of comparisons){const before=fs.readFileSync('scratch/w5-baseline/'+file,'utf8'),after=fs.readFileSync(file,'utf8');if(section(before,start,end)!==section(after,start,end))throw Error('Behavior changed: '+start);console.log('Unchanged:',start.trim());}
