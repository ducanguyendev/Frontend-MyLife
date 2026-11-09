const fs=require('fs');
const base='src/features/admin/components/family-tree/';
let f=base+'MemberFormModal.tsx',s=fs.readFileSync(f,'utf8');s="import { FormSectionHeader } from '@/shared/components/ui/FormSectionHeader';\n"+s;
s=s.replace(/<button\s+type="button"\s+aria-expanded=\{openSections.includes\("(basic|bio|relations|contact)"\)\}[\s\S]*?<\/button>/g,(all,key)=>{const title=all.match(/<span className="font-semibold text-sm text-primary-text">\s*([\s\S]*?)\s*<\/span>/)[1];const icon=all.match(/<(\w+) size=\{16\} \/>/)[1];return `<FormSectionHeader title=${title} icon={<${icon} size={16} aria-hidden="true"/>} expanded={openSections.includes("${key}")} onToggle={() => toggleSection("${key}")}/>`});
// ChevronDown is now supplied by the shared section header.
s=s.replace(/\s+ChevronDown,?\r?\n/,'\n');fs.writeFileSync(f,s);
f='src/features/my-life/components/TimelineEventModal.tsx';s=fs.readFileSync(f,'utf8');s="import { FormSectionHeader } from '@/shared/components/ui/FormSectionHeader';\n"+s;s=s.replace(/<h4 id="(timeline-event-(?:primary|time|content)-heading)" className="[^"]*"><(\w+) size=\{17\} aria-hidden="true" \/>(\{t\('[^']+'\)\})<\/h4>/g,(_,id,icon,title)=>`<FormSectionHeader id="${id}" icon={<${icon} size={17} aria-hidden="true"/>} title=${title}/>`);fs.writeFileSync(f,s);
f=base+'FamilyAnniversaryModal.tsx';s=fs.readFileSync(f,'utf8');s="import { FormSectionHeader } from '@/shared/components/ui/FormSectionHeader';\n"+s;s=s.replace(/<h2 className="flex items-center gap-2 border-b border-custom-border\/50 px-3\.5 py-3 text-sm font-semibold text-primary-text">\s*(<\w+ size=\{16\}[^>]*\/>)(\{t\('[^']+'\)\})\s*<\/h2>/g,(_,icon,title)=>`<FormSectionHeader icon={${icon}} title=${title}/>`);s=s.replace(/<h2 className="flex items-center gap-2 border-b border-custom-border\/50 px-3\.5 py-3 text-sm font-semibold text-primary-text">\s*(\{isDeathAnniversary [\s\S]*?\})\s*(\{t\(isDeathAnniversary[^\n]*\)\})\s*<\/h2>/g,(_,icon,title)=>`<FormSectionHeader icon=${icon} title=${title}/>`);fs.writeFileSync(f,s);
// Normalize rendered text only, never input values or save data.
const edits=[
 [base+'MemberCard.tsx', [['const name = language === \'en\' ? removeVietnameseTones(member.fullName) : member.fullName;',"const name = normalizeDisplayText(language === 'en' ? removeVietnameseTones(member.fullName) : member.fullName);"]]],
 [base+'family-view/FamilyPersonCard.tsx',[['const name = member.fullName;','const name = normalizeDisplayText(member.fullName);']]],
 [base+'MemberTable.tsx',[]],
 ['src/features/my-life/components/timeline/TimelineEventCard.tsx',[]],
 ['src/features/my-life/components/memories/LibraryGallery.tsx',[['{album.name}','{normalizeDisplayText(album.name)}'],['{photo.title}','{normalizeDisplayText(photo.title)}'],['{photo.author}','{normalizeDisplayText(photo.author)}']]],
 ['src/features/my-life/components/memories/LibraryLightbox.tsx',[['{photo.title}','{normalizeDisplayText(photo.title)}']]],
];
for(const [file,replacements]of edits){let text=fs.readFileSync(file,'utf8');if(file.endsWith('MemberTable.tsx'))text=text.replace(/const displayName = \(name: string\) => ([^;]+);/,(_,body)=>`const displayName = (name: string) => normalizeDisplayText(${body});`);if(file.endsWith('TimelineEventCard.tsx'))text=text.replaceAll('{title}','{normalizeDisplayText(title)}');for(const[a,b]of replacements)text=text.replaceAll(a,b);if(text.includes('normalizeDisplayText(')){text="import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';\n"+text;fs.writeFileSync(file,text)}}
