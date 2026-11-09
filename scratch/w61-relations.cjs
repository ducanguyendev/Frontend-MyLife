const fs=require('fs');const base='src/features/admin/components/family-tree/';
for(const name of ['FamilyRelationSelect','FamilyMemberPicker']){
 const f=base+name+'.tsx';let s=fs.readFileSync(f,'utf8');
 s="import { FloatingField } from '@/shared/components/ui/FloatingField';\nimport { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';\n"+s;
 if(name==='FamilyRelationSelect'){
  s=s.replace('generationLabel: string, showGeneration = true) =>\r\n  showGeneration ? `${option.fullName} (${generationLabel} ${option.generation})` : option.fullName;', 'generationLabel: string, showGeneration = true) => {\n  void generationLabel; void showGeneration;\n  return normalizeDisplayText(option.fullName);\n};');
  // Support sources with LF too.
  s=s.replace('generationLabel: string, showGeneration = true) =>\n  showGeneration ? `${option.fullName} (${generationLabel} ${option.generation})` : option.fullName;', 'generationLabel: string, showGeneration = true) => {\n  void generationLabel; void showGeneration;\n  return normalizeDisplayText(option.fullName);\n};');
  const tabHelper=fs.readFileSync(base+'FamilyMemberPicker.tsx','utf8').match(/  const closeAndMoveFocus = [\s\S]*?\n  };/)[0].replaceAll('popupRef','listboxRef');s=s.replace('  const updatePosition =',tabHelper+'\n\n  const updatePosition =');
  s=s.replace('if (event.key === "Escape") event.preventDefault();\r\n          close(event.key === "Escape");','event.preventDefault();\n          if (event.key === "Escape") close(true);\n          else closeAndMoveFocus(event.shiftKey);');
 } else {
  s=s.replace('import { ChevronDown }',"import { MemberAvatarImage } from './MemberAvatarImage';\nimport { ChevronDown }");s=s.replace('  gender?: string;','  gender?: string;\n  avatarUrl?: string;\n  hasManagedAvatar?: boolean;\n  updatedAt?: string;');s=s.replace('  generationLabel,','  generationLabel: _generationLabel,');s=s.replace('  const popupId = useId();','  void _generationLabel;\n  const popupId = useId();');s=s.replace('{option.fullName} ({generationLabel} {option.generation}{option.gender ? ` • ${option.gender}` : ""})','{normalizeDisplayText(option.fullName)}');s=s.replace('<span className="min-w-0 flex-1 truncate">\r\n            {normalizeDisplayText(option.fullName)}','<MemberAvatarImage member={{ ...option, updatedAt: option.updatedAt ?? \'\' }} alt="" className="mr-2 h-8 w-8 shrink-0 rounded-full object-cover"/>\n          <span className="min-w-0 flex-1 whitespace-normal break-words">\n            {normalizeDisplayText(option.fullName)}');
 }
 s=s.replace('className="overflow-y-auto rounded-2xl border border-custom-border bg-secondary-bg p-1.5 text-primary-text shadow-xl outline-none"','className="ds-field-menu"');s=s.replace('className={`relative flex min-h-10','data-active={activeIndex === index}\n            className={`ds-field-option relative flex min-h-10').replace('className={`flex min-h-10','data-active={activeIndex === index}\n          className={`ds-field-option flex min-h-10');
 const i=s.indexOf('      <button\n',s.indexOf('  return (')); const ir=s.indexOf('      <button\r\n',s.indexOf('  return ('));const start=i>=0?i:ir;
 const end=s.indexOf('      {popup}',start); // includes emptyMessage for picker, handle separately
 let trigger=s.slice(start,end);
 trigger=trigger.replace(/className="flex min-h-\[56px\][^"]*"/,'data-ui-control\n        id={`${'+(name==='FamilyRelationSelect'?'listboxId':'popupId')+'}-trigger`}');
 const floating=name==='FamilyRelationSelect'?'label ?? placeholder':'placeholder';const isDisabled=name==='FamilyRelationSelect'?'disabled':'disabled || options.length === 0';const generated=name==='FamilyRelationSelect'?'listboxId':'popupId';
 if(name==='FamilyRelationSelect')trigger=trigger.replace('{selected ? formatOption(selected) : placeholder}',"{selected ? formatOption(selected) : ''}").replace('className="h-8 w-8 shrink-0 rounded-full object-cover"','className="h-6 w-6 shrink-0 rounded-full object-cover"');
 else trigger=trigger.replace('<span className="min-w-0 flex-1 truncate">{placeholder}</span>','<span className="min-w-0 flex-1" aria-hidden="true">&nbsp;</span>');
 trigger=trigger.replace('        <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-secondary-text" />','');
 const buttonEnd=trigger.indexOf('</button>')+'</button>'.length;const extra=trigger.slice(buttonEnd);trigger=trigger.slice(0,buttonEnd);
 s=s.slice(0,start)+`      <FloatingField label={${floating}} fieldId={\`\${${generated}}-trigger\`} active={open} hasValue={${name==='FamilyRelationSelect'?'Boolean(selected)':'false'}} disabled={${isDisabled}} trailing={<ChevronDown size={18} aria-hidden="true"/>}>\n`+trigger+'\n      </FloatingField>'+extra+s.slice(end);
 s=s.replace('      {label && <span className="mb-1.5 px-1 text-xs font-semibold text-secondary-text">{label}</span>}\r\n','');
 fs.writeFileSync(f,s);
}
let f=base+'MemberFormModal.tsx',s=fs.readFileSync(f,'utf8');s=s.replace(/\s*<span className="text-\[10px\] text-secondary-text px-1 py-0\.5 rounded bg-primary-bg">\s*\{t\("admin\.generation(?:_label)?"[^\n]*\n?\s*<\/span>/g,'');
s=s.replaceAll('generation: member.generation, gender: member.gender','generation: member.generation, gender: member.gender, avatarUrl: member.avatarUrl, hasManagedAvatar: member.hasManagedAvatar, updatedAt: member.updatedAt');
// Add tiny avatars to the selected chips using the same display-only member contract.
if(!s.includes("import { MemberAvatarImage }"))s="import { MemberAvatarImage } from './MemberAvatarImage';\n"+s;
for(const variable of ['child','sibling'])s=s.replace(`<span className="font-medium">{formatName(${variable}.fullName)}</span>`,`<MemberAvatarImage member={${variable}} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover"/><span className="font-medium">{normalizeDisplayText(formatName(${variable}.fullName))}</span>`);
s="import { normalizeDisplayText } from '@/shared/utils/normalizeDisplayText';\n"+s;fs.writeFileSync(f,s);
