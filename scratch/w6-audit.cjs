const fs=require('node:fs'),ts=require('typescript'),crypto=require('node:crypto');
const normalized=s=>s.replace(/\r\n?/g,'\n');
const digest=s=>crypto.createHash('sha256').update(normalized(s)).digest('hex');
const declarations=source=>{const result=new Map();const ast=ts.createSourceFile('audit.tsx',normalized(source),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const walk=node=>{if(ts.isVariableDeclaration(node)&&node.initializer&&ts.isIdentifier(node.name))result.set(node.name.text,node.initializer.getText(ast));ts.forEachChild(node,walk);};walk(ast);return result;};
const checks=[];
for(const name of ['familyV2Service','anniversaryService','libraryService']){const file=`src/features/admin/services/${name}.ts`;const before=fs.readFileSync('scratch/w6-baseline/'+file+'.txt','utf8');checks.push({file,check:'entire service module unchanged',pass:digest(before)===digest(fs.readFileSync(file,'utf8'))});}
for(const[file,names]of[
 ['src/features/my-life/pages/FamilyTimelinePage.tsx',['blank','load','beginEdit','save','remove','dateLabel','filtered','yearGroups']],
 ['src/features/admin/components/family-tree/AnniversaryTab.tsx',['openEditor','load','save','confirmDelete','filtered','eventsByDate','moveMonth','selectDay','applyMonthPicker']],
 ['src/features/admin/components/family-tree/FamilyAnniversaryModal.tsx',['submit','handleRelatedMemberChange','validSolarDate','validLunarParts']],
 ['src/features/admin/components/family-tree/LibraryTab.tsx',['requestDelete','confirmDelete','savePhoto','filteredPhotos']],
 ['src/features/admin/components/family-tree/LibraryUploadModal.tsx',['submit']],
 ['src/features/admin/components/family-tree/LibraryAlbumModal.tsx',['submit']],
 ['src/features/admin/components/family-tree/LibraryPhotoEditModal.tsx',['submit']],
]){const before=declarations(fs.readFileSync('scratch/w6-baseline/'+file+'.txt','utf8')),after=declarations(fs.readFileSync(file,'utf8'));for(const name of names)checks.push({file,check:name,pass:before.has(name)&&before.get(name)===after.get(name)});}
fs.mkdirSync('docs/review-w6',{recursive:true});fs.writeFileSync('docs/review-w6/preservation-audit.json',JSON.stringify(checks,null,2));
const failures=checks.filter(c=>!c.pass);console.log(checks.length,'preservation checks;',failures.length,'differences');if(failures.length){console.log(failures);process.exitCode=1;}
