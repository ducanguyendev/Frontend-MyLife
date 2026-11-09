const fs=require('node:fs');
const file='src/features/admin/components/family-tree/MemberFormModal.tsx';
const source=fs.readFileSync(file,'utf8');console.log('Form null characters:',[...source].filter(c=>c.charCodeAt(0)===0).length);
fs.writeFileSync(file,source.replace(/\r\n?/g,'\n'));
const table='src/features/admin/components/family-tree/MemberTable.tsx';fs.writeFileSync(table,fs.readFileSync(table,'utf8').replace('toLocaleDateString("vi-VN",','toLocaleDateString(language === "vi" ? "vi-VN" : "en-GB",'));
const visual=JSON.parse(fs.readFileSync('docs/review-w5/visual-results.json','utf8'));const interaction=JSON.parse(fs.readFileSync('docs/review-w5/results.json','utf8'));
console.log('Visual checks:',visual.length,'Clean:',visual.every(r=>!r.overflow&&!r.mainOverflow&&!r.dialogOverflow&&r.active===1));console.log('Fixture writes:',interaction.writes.length,'Runtime errors:',interaction.errors.length);
