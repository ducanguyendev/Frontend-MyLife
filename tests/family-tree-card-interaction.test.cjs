const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');

// Execute the actual card handlers, including bubbling and stateful menu actions.
function harness(renderer){
  const slots=[];let cursor=0;const calls=[];
  const jsx=(type,props)=>({type,props});
  const react={memo:fn=>fn,useEffect:()=>{},useRef:initial=>{const i=cursor++;return slots[i]??(slots[i]={current:initial});},useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];}};
  const mocks={react,'react/jsx-runtime':{jsx,jsxs:jsx},'framer-motion':{motion:{article:'article'},useIsPresent:()=>true,useReducedMotion:()=>true},'lucide-react':Object.fromEntries(['Eye','GitBranch','MoreHorizontal','Pencil','Trash2'].map(name=>[name,name])),'@/shared/hooks/useLanguage':{useLanguage:()=>({t:(key,options)=>options?.defaultValue||key})},'@/shared/utils/normalizeDisplayText':{normalizeDisplayText:text=>text},'../MemberAvatarImage':{MemberAvatarImage:'Avatar'},'./MemberAvatarImage':{MemberAvatarImage:'Avatar'}};
  const file=renderer==='stable'?'family-view/FamilyPersonCard.tsx':'ShadcnFamilyTreePersonCard.tsx';
  const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/features/admin/components/family-tree',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};vm.runInNewContext(compiled,{exports:module.exports,require:name=>{assert.ok(name in mocks,name);return mocks[name];},document:{addEventListener(){},removeEventListener(){}}});
  const Component=module.exports[renderer==='stable'?'FamilyPersonCard':'ShadcnFamilyTreePersonCard'];
  const props={member:{id:9,fullName:'Member nine',generation:3,gender:'Nam'},x:0,y:0,hiddenCount:2,expanded:false,focused:false,highlighted:false,dimmed:false,reducedMotion:true};
  for(const[name,action]of[['onFocus','select'],['onSelect','select'],['onView','view'],['onEdit','edit'],['onDelete','delete'],['onViewBranch','branch'],['onExpand','expand']])props[name]=value=>calls.push([action,typeof value==='object'?value.id:value]);
  const render=()=>{cursor=0;return Component(props);};
  return{render,calls,reset:()=>{calls.length=0;}};
}
function paths(tree,predicate,parents=[]){
  if(!tree||typeof tree!=='object')return[];
  if(Array.isArray(tree))return tree.flatMap(item=>paths(item,predicate,parents));
  const branch=[...parents,tree];return[...(predicate(tree)?[branch]:[]),...paths(tree.props?.children,predicate,branch)];
}
const byClass=(tree,suffix)=>{const found=paths(tree,node=>(node.props?.className||'').split(' ').some(name=>name.endsWith(suffix)));assert.equal(found.length,1,suffix);return found[0];};
function click(branch){
  const target={closest:()=>branch.find(node=>['button','a'].includes(node.type))||null};let stopped=false;
  for(const node of [...branch].reverse()){node.props.onClick?.({target,currentTarget:node,stopPropagation(){stopped=true;}});if(stopped)break;}
}
function menuItem(tree,icon){const found=paths(tree,node=>node.props?.role==='menuitem'&&[].concat(node.props.children).some(child=>child?.type===icon));assert.equal(found.length,1,icon);return found[0];}

for(const renderer of['stable','shadcn']){
  test(`${renderer}: background, avatar, name and metadata each select once without opening workflows`,()=>{
    const h=harness(renderer);
    for(const suffix of['background','__portrait','__name','__role','__meta']){
      const tree=h.render();click(suffix==='background'?[tree]:byClass(tree,suffix));
      assert.deepEqual(h.calls,[['select',9]],suffix);h.reset();
    }
  });
  test(`${renderer}: explicit detail/edit/delete/branch and expand actions do not also select`,()=>{
    const h=harness(renderer),trigger=renderer==='stable'?'__action-trigger':'__action-menu';
    for(const[icon,action]of[['Eye','view'],['Pencil','edit'],['Trash2','delete'],['GitBranch','branch']]){
      click(byClass(h.render(),trigger));assert.deepEqual(h.calls,[],'menu trigger only');
      click(menuItem(h.render(),icon));assert.deepEqual(h.calls,[[action,9]],action);h.reset();
    }
    click(byClass(h.render(),'__expand'));assert.deepEqual(h.calls,[['expand',9]]);h.reset();
    if(renderer==='stable'){click(byClass(h.render(),'__edit'));assert.deepEqual(h.calls,[['edit',9]]);}
    else{const tree=h.render();const eye=paths(tree,node=>node.type==='button'&&[].concat(node.props?.children).some(child=>child?.type==='Eye'))[0];click(eye);assert.deepEqual(h.calls,[['view',9]]);}
  });
  test(`${renderer}: Tab stop and Enter/Space select once; nested controls stay independent`,()=>{
    const h=harness(renderer),tree=h.render();assert.equal(tree.props.tabIndex,0);assert.ok(tree.props['aria-label']);
    for(const key of['Enter',' ']){
      let prevented=false;tree.props.onKeyDown({key,target:tree,currentTarget:tree,preventDefault(){prevented=true;}});
      assert.equal(prevented,true);assert.deepEqual(h.calls,[['select',9]]);h.reset();
      tree.props.onKeyDown({key,target:{},currentTarget:tree,preventDefault(){throw Error('nested key intercepted');}});assert.deepEqual(h.calls,[]);
    }
  });
  test(`${renderer}: Escape closes action menu without bubbling to tree selection`,()=>{
    const h=harness(renderer);click(byClass(h.render(),renderer==='stable'?'__action-trigger':'__action-menu'));
    const menu=paths(h.render(),node=>node.props?.role==='menu')[0].at(-1);let stopped=false;
    menu.props.onKeyDown({key:'Escape',preventDefault(){},stopPropagation(){stopped=true;}});
    assert.equal(stopped,true);assert.deepEqual(h.calls,[]);assert.equal(paths(h.render(),node=>node.props?.role==='menu').length,0);
  });
}
