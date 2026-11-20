// Retain the existing test entry point while exercising the W5 gallery actions.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function render(language='vi',deceased=false){
 const source=fs.readFileSync(path.join(root,'src/features/admin/components/family-tree/MemberCard.tsx'),'utf8');
 const admin=JSON.parse(fs.readFileSync(path.join(root,`src/shared/locales/${language}/admin.json`),'utf8'));
 const t=(key,options={})=>key.slice(6).split('.').reduce((d,k)=>d?.[k],admin) ?? options.defaultValue ?? key;
 const jsx=(type,props)=>({type,props});
 const mocks={'@/shared/utils/normalizeDisplayText':{normalizeDisplayText:s=>s?.normalize('NFC')??''},'@/shared/components/MemberAgeStatus':{MemberAgeStatus:'MemberAgeStatus'},react:{useEffect(){},useRef:()=>({current:null})},'react/jsx-runtime':{jsx,jsxs:jsx},'lucide-react':{},'@/shared/hooks/useLanguage':{useLanguage:()=>({language,t})},'@/shared/components/ui':{Button:'Button',IconButton:'IconButton',Badge:'Badge'},'./MemberAvatarImage':{MemberAvatarImage:'MemberAvatarImage'},'./types':{removeVietnameseTones:s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D')}};
 const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,{exports,require:name=>mocks[name],document:{}});
 const member={id:12,fullName:'Nguyễn An',generation:7,role:'Thành viên',gender:'Nam',lifeStatus:deceased?'DECEASED':'LIVING',dateOfBirth:'1940-01-01',deathDate:deceased?'2020-01-01':null,address:'Hà Nội'};
 const calls=[];
 const tree=exports.MemberCard({member,index:0,isDropdownOpen:true,onToggleDropdown:()=>calls.push('toggle'),onCloseDropdown:()=>calls.push('close'),onView:m=>calls.push(['view',m]),onEdit:m=>calls.push(['edit',m]),onDelete:m=>calls.push(['delete',m])});
 const nodes=value=>!value||typeof value!=='object'?[]:Array.isArray(value)?value.flatMap(nodes):[value,...nodes(value.props?.children)];
 return{tree,nodes:nodes(tree),calls,member};
}
test('gallery identity and explicit View both open the original member',()=>{
 const{nodes,calls,member}=render();
 const identity=nodes.find(n=>n.props?.className==='family-gallery-card__identity');
 assert.equal(identity.type,'button');assert.ok(identity.props['aria-label'].includes(member.fullName));identity.props.onClick();
 nodes.find(n=>n.type==='Button').props.onClick();assert.deepEqual(calls,[['view',member],['view',member]]);
});
test('edit and overflow deletion retain the exact member and close the menu before deleting',()=>{
 const{nodes,calls,member}=render();nodes.find(n=>n.type==='IconButton').props.onClick();nodes.find(n=>n.props?.role==='menuitem').props.onClick();
 assert.deepEqual(calls,[['edit',member],'close',['delete',member]]);assert.equal(nodes.find(n=>n.props?.['aria-haspopup']==='menu').props['aria-expanded'],true);
});
test('gallery keeps generation and passes the original member to its shared age presentation',()=>{
 for(const language of ['vi','en'])for(const deceased of [false,true]){const{tree,nodes,member}=render(language,deceased);assert.equal(tree.props['data-member-id'],12);assert.ok(nodes.some(n=>n.type==='Badge'&&n.props.children.includes(7)));assert.ok(nodes.find(n=>n.props?.className==='family-gallery-card__status').props.children);assert.equal(tree.props.className.includes('is-deceased'),deceased);assert.equal(nodes.find(n=>n.type==='MemberAgeStatus').props.member,member);}
});
