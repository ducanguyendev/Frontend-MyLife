const fs=require('node:fs');
const p='scripts/w5-surfaces.cjs';
let s=fs.readFileSync(p,'utf8');
const tick=String.fromCharCode(96),slash=String.fromCharCode(92);
const marker='s=s.slice(0,start)+';
const a=s.indexOf(marker)+marker.length+1,b=s.lastIndexOf(tick);
s=s.slice(0,a)+s.slice(a,b).replaceAll(tick,slash+tick).replaceAll('${',slash+'${')+s.slice(b);
fs.writeFileSync(p,s);
