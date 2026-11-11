const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const exportsForFit={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/admin/components/family-tree/treeViewportFit.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:exportsForFit});
const fit=exportsForFit.fitTreeContent;
const node=(x,y)=>({x,y,width:196,height:94});
test('a modest desktop tree occupies the intended width and stays horizontally centered',()=>{
 const nodes=[node(0,0),node(804,200)];const result=fit(nodes,{width:1200,height:900},54,true);
 assert.ok(result.scale*1000/1200>=.8&&result.scale*1000/1200<=.89);
 assert.ok(Math.abs(result.x+500*result.scale-600)<.001);
});
test('a distant generation does not make the first desktop names tiny; lower generations remain pannable',()=>{
 const nodes=[node(0,0),node(604,900)];const viewport={width:1100,height:580};
 const complete=fit(nodes,viewport,54),readable=fit(nodes,viewport,54,true);
 assert.ok(readable.scale>complete.scale*1.5);assert.ok(readable.scale<=1100*.89/800);
 assert.equal(readable.y,70);assert.ok(readable.y+994*readable.scale>viewport.height);
});
test('exports and large forests retain complete-bounds fitting without forced readability zoom',()=>{
 const nodes=Array.from({length:80},(_,i)=>node(i%10*230,Math.floor(i/10)*180));
 const a=fit(nodes,{width:1000,height:650},54),b=fit(nodes,{width:1000,height:650},54,true);
 assert.deepEqual(a,b);assert.ok(a.scale<1);assert.ok(a.y+(1260+94)*a.scale<=650);
});
test('empty or unavailable viewports return no transform and a single person is never excessively enlarged',()=>{
 assert.equal(fit([],{width:1000,height:700}),null);assert.equal(fit([node(0,0)],{width:0,height:700}),null);
 assert.ok(fit([node(0,0)],{width:1920,height:1080},54,true).scale<=1.35);
});
