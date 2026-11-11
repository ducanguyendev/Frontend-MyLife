const fs=require('fs'),path=require('path');
const files=[]; const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=d+'/'+e.name;if(e.isDirectory())walk(f);else if(/\.(tsx?|css)$/.test(f))files.push(f)}};walk('src');for(const f of files){const out='scratch/w61-baseline/'+f+'.txt';fs.mkdirSync(path.dirname(out),{recursive:true});if(!fs.existsSync(out))fs.copyFileSync(f,out)}
