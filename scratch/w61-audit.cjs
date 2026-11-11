const fs=require('fs'),ts=require('typescript'),path=require('path');
const norm=s=>s.replace(/\r\n?/g,'\n');const declarations=s=>{const ast=ts.createSourceFile('audit.tsx',norm(s),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const result=new Map();const walk=n=>{if(ts.isVariableDeclaration(n)&&n.initializer&&ts.isIdentifier(n.name))result.set(n.name.text,n.initializer.getText(ast));ts.forEachChild(n,walk)};walk(ast);return result;};
const checks=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else if(f.endsWith('.txt')){const source=f.replace('scratch/w61-baseline/','').slice(0,-4);if(/(?:services|shared\/api)\//.test(source)||/(?:types|lunarYearUtils)\.ts$/.test(source))checks.push({file:source,check:'entire API / DTO / business module',pass:norm(fs.readFileSync(f,'utf8'))===norm(fs.readFileSync(source,'utf8'))});}}};walk('scratch/w61-baseline');
for(const [file,names]of[
['src/features/admin/components/family-tree/MemberFormModal.tsx',['potentialFathers','potentialMothers','potentialSpouses','availableForChildren','availableForSiblings','handleAddChild','handleRemoveChild','handleAddSibling','handleRemoveSibling','handleFormSubmit','handleFullNameChange','handlePhoneChange']],
['src/features/my-life/pages/FamilyTimelinePage.tsx',['blank','load','beginEdit','save','remove','filtered','yearGroups']],
['src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx',['submit','handleRelatedMemberChange','validSolarDate','validLunarParts']],
['src/features/admin/components/family-tree/AnniversaryTab.tsx',['save','load','confirmDelete','filtered','eventsByDate']],
['src/features/admin/components/family-tree/LibraryAlbumModal.tsx',['submit']],
['src/features/admin/components/family-tree/LibraryUploadModal.tsx',['submit']],
['src/features/admin/components/family-tree/LibraryPhotoEditModal.tsx',['submit']],
['src/features/admin/components/family-tree/LibraryTab.tsx',['savePhoto','confirmDelete','filteredPhotos']],
['src/shared/components/ui/DateInput.tsx',['handleOpenPicker','handleSelectDate','handleInputChange','handlePaste','handleKeyDown','handlePopupKeyDown']],
['src/features/profile/components/UserProfileModal.tsx',['handleSaveProfile','handleChangePassword','validateNewPassword']],
]){const b=declarations(fs.readFileSync('scratch/w61-baseline/'+file+'.txt','utf8')),a=declarations(fs.readFileSync(file,'utf8'));for(const name of names)checks.push({file,check:name,pass:b.has(name)&&b.get(name)===a.get(name),exists:b.has(name)});}
fs.mkdirSync('docs/review-w61',{recursive:true});fs.writeFileSync('docs/review-w61/preservation-audit.json',JSON.stringify(checks,null,2));console.log(checks.length,'checks;',checks.filter(c=>!c.pass));if(checks.some(c=>!c.pass))process.exitCode=1;
