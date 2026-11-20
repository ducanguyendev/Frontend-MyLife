const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const files = [
 'src/features/admin/components/family-tree/treeViewportFit.ts',
 'src/features/admin/components/family-tree/FamilyExperience.css',
 'src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx',
 'src/features/my-life/pages/FamilyTimelinePage.tsx',
 'src/features/my-life/components/TimelineEventModal.tsx',
 'src/features/my-life/components/timeline/TimelineEventCard.tsx',
 'src/features/my-life/components/timeline/TimelineYearSection.tsx',
 'src/features/my-life/components/timeline/TimelineFilterBar.tsx',
 ...['AnniversaryTab','FamilyAnniversaryModal','LibraryTab','LibraryUploadModal','LibraryAlbumModal','LibraryPhotoEditModal','LibraryPhotoFormFields','PhotoLightboxModal'].map(name => `src/features/admin/components/family-tree/${name}.tsx`),
 ...['familyV2Service','anniversaryService','libraryService'].map(name => `src/features/admin/services/${name}.ts`),
];
const manifest = {};
for (const file of files) {
 const source=fs.readFileSync(file); const target=path.join('scratch/w6-baseline',file+'.txt');
 fs.mkdirSync(path.dirname(target),{recursive:true}); if(!fs.existsSync(target)) fs.writeFileSync(target,source);
 manifest[file]=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}
fs.writeFileSync('scratch/w6-baseline/manifest.json',JSON.stringify(manifest,null,2));
console.log('Saved',files.length,'W6 entry-state snapshots as text.');
