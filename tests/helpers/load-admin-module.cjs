const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
function loadAdminModule(file,mocks={}){
  const compiled=ts.transpileModule(fs.readFileSync(path.resolve(file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  vm.runInNewContext(compiled,{exports:module.exports,AbortController,require:name=>{if(!(name in mocks))throw Error('Unexpected import '+name);return mocks[name];}});
  return module.exports;
}
function hookHarness(){
  const slots=[];let cursor=0;let queued=[];
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((value,index)=>value===b[index]);
  const react={
    useState(initial){const id=cursor++;if(!(id in slots))slots[id]=typeof initial==='function'?initial():initial;return[slots[id],update=>{slots[id]=typeof update==='function'?update(slots[id]):update;}];},
    useRef(initial){const id=cursor++;return slots[id]??(slots[id]={current:initial});},
    useCallback(fn,deps){const id=cursor++;if(!slots[id]||!same(slots[id].deps,deps))slots[id]={fn,deps};return slots[id].fn;},
    useEffect(fn,deps){const id=cursor++;if(!slots[id]||!same(slots[id].deps,deps)){const previous=slots[id];slots[id]={deps,cleanup:previous?.cleanup};queued.push(()=>{previous?.cleanup?.();slots[id].cleanup=fn();});}},
  };
  return{react,render(fn){cursor=0;const result=fn();const effects=queued;queued=[];effects.forEach(effect=>effect());return result;},unmount(){slots.forEach(slot=>slot?.cleanup?.());}};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
module.exports={loadAdminModule,hookHarness,deferred,flush};
