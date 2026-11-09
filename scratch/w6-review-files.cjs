const fs=require('node:fs');
for(const p of ['tests/anniversary.test.cjs','src/features/admin/components/family-tree/PhotoLightboxModal.tsx'])fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'').trimEnd()+'\n');
const visual=JSON.parse(fs.readFileSync('docs/review-w6/visual-results.json','utf8'));
const result=JSON.parse(fs.readFileSync('docs/review-w6/results.json','utf8'));
console.log('Visual checks:',visual.length,'Clean:',visual.every(r=>!r.pageOverflow&&!r.mainOverflow&&!r.dialogOverflow&&!r.bodyScroll&&r.active===1));
console.log('Fixture writes:',result.writes.length,'Page errors:',result.errors.length);
