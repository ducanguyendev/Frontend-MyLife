const fs=require('node:fs');
const path=require('node:path');
const base=process.env.MYLIFE_UI_URL||'http://127.0.0.1:7008';
const users=[
  {id:1,email:'admin@example.test',role:'ADMIN',isActive:true,authProvider:0,createdAt:'2026-01-01T10:00:00Z'},
  {id:2,email:'anna@example.test',role:'USER',isActive:true,authProvider:0,createdAt:'2026-11-08T10:00:00Z'},
  {id:3,email:'ben@example.test',role:'USER',isActive:false,authProvider:1,createdAt:'2026-11-07T10:00:00Z'},
  {id:4,email:'care@example.test',role:'ADMIN',isActive:true,authProvider:0,createdAt:'2026-10-01T10:00:00Z'},
  {id:5,email:'long.address.for.admin.layout.review.with.multiple.parts.and.extra.characters@example.test',role:'USER',isActive:true,loginProviders:{local:true,google:true},createdAt:'2026-11-06T10:00:00Z'},
  {id:6,email:'unknown@example.test',role:'USER',isActive:false,createdAt:'invalid-date'},
];
const logs=[
  {id:101,attemptEmail:'anna@example.test',status:'SUCCESS',ipAddress:'192.0.2.10',createdAt:'2026-11-08T10:00:00Z'},
  {id:102,attemptEmail:'ben@example.test',status:'FAILED',ipAddress:'2001:db8::1',createdAt:'2026-11-09T10:00:00Z'},
  {id:103,attemptEmail:'new@example.test',status:'REGISTERED',ipAddress:'192.0.2.11',createdAt:'2026-11-07T10:00:00Z'},
  {id:104,attemptEmail:'unknown@example.test',status:'CHALLENGE',createdAt:'invalid-date'},
  {id:105,attemptEmail:'long.address.for.admin.layout.review.with.multiple.parts.and.extra.characters@example.test',status:'SUCCESS',ipAddress:'2001:db8:1234:5678:abcd:abcd:abcd:abcd',createdAt:'2026-11-09T11:00:00Z'},
];
const stats=records=>({totalUsers:records.length,totalActive:records.filter(user=>user.isActive).length,totalLocked:records.filter(user=>!user.isActive).length,last7Days:{successLogins:24,failedLogins:3,newRegistrations:2}});
const directory=()=>{const dir=path.resolve(process.env.MYLIFE_REVIEW_DIR||'docs/review-w8');fs.mkdirSync(dir,{recursive:true});return dir;};
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{promise,resolve};};
async function adminPage(browser,{width=1440,height=1000,theme='light',language='vi',role='ADMIN',anonymous=false}={}){
  const page=await browser.newPage();page.setDefaultTimeout(15000);await page.setViewport({width,height});
  const state={users:structuredClone(users),logs:structuredClone(logs),role,anonymous,reads:[],writes:[],authWrites:[],errors:[],console:[],readFailures:{},readGates:{},mutationFailure:{},mutationGates:{},refreshExpired:false};
  await page.evaluateOnNewDocument(({theme,language})=>{localStorage.setItem('app_language',language);localStorage.setItem('portfolio-theme-preference',theme);}, {theme,language});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  page.on('pageerror',error=>state.errors.push(error.message));
  page.on('console',message=>state.console.push(message.text()));
  await page.setRequestInterception(true);
  page.on('request',async request=>{
    const url=new URL(request.url()),route=url.pathname,method=request.method();
    if(!['127.0.0.1','localhost'].includes(url.hostname)||!route.startsWith('/api/'))return request.continue();
    let status=200,body={success:true,data:[]};
    const headers={'Access-Control-Allow-Origin':request.headers().origin||'*','Access-Control-Allow-Credentials':'true','Access-Control-Allow-Headers':request.headers()['access-control-request-headers']||'content-type,x-requested-with','Access-Control-Allow-Methods':'GET,OPTIONS,POST,PUT,DELETE'};
    try{
      if(method==='OPTIONS')return await request.respond({status:204,headers});
      if(route.startsWith('/api/avatar/'))return await request.respond({status:200,headers,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect width="36" height="36" rx="18" fill="#66816e"/><circle cx="18" cy="13" r="6" fill="#e7eee7"/><path d="M6 36c0-17 24-17 24 0" fill="#e7eee7"/></svg>'});
      if(route==='/api/me'){
        if(state.anonymous){status=401;body={message:'Unauthorized'};}else body={id:1,email:'admin@example.test',displayName:'Review Administrator',fullName:'Review Administrator',role:state.role,roles:[state.role],authProvider:0,loginProviders:{local:true,google:false},isActive:true};
      }else if(route==='/api/refresh-token'){state.authWrites.push(route);if(state.refreshExpired||state.anonymous){status=401;body={message:'Session expired'};}else if(state.refreshRecovers){state.readFailures={};}}
      else if(route==='/api/logout'){state.authWrites.push(route);body={success:true};}
      else if(/^\/api\/admin\/(stats|users|logs)$/.test(route)&&method==='GET'){
        const key=route.split('/').at(-1);state.reads.push(key);
        body=structuredClone(key==='stats'?stats(state.users):state[key]);
        const failure=state.readFailures[key];if(state.readGates[key])await state.readGates[key];
        if(state.role!=='ADMIN'||failure){status=failure||403;body={message:status===403?'Forbidden':'Synthetic read failure'};}
      }else if(/^\/api\/admin\/users\/\d+(\/(role|status))?$/.test(route)&&['PUT','DELETE'].includes(method)){
        const id=Number(route.split('/')[4]),action=method==='DELETE'?'delete':route.split('/').at(-1),payload=method==='DELETE'?undefined:JSON.parse(request.postData());
        state.writes.push({id,action,method,payload});if(state.mutationGates[action])await state.mutationGates[action];
        const failure=state.mutationFailure[action];
        if(failure){status=typeof failure==='number'?failure:200;body={success:false,code:failure==='family'?'USER_HAS_FAMILY_MEMBERS':undefined,message:'Synthetic action rejection'};}
        else if(action==='delete'){state.users=state.users.filter(user=>user.id!==id);body={success:true,deletedId:id};}
        else{state.users=state.users.map(user=>user.id===id?{...user,...payload}:user);body={success:true,...payload};}
      }
      await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(body)});
    }catch{/* A deliberate route change/unmount may abort a fixture response. */}
  });
  const go=(route='/Home/Admin')=>page.goto(base+route,{waitUntil:'domcontentloaded'});
  return{page,state,go};
}
async function tab(page,index){await page.click(`.admin-console__tabs button:nth-child(${index+1})`);}
async function choose(page,label,text){await page.click(`[role=combobox][aria-label="${label}"]`);await page.waitForSelector('[role=option]',{visible:true});const index=await page.$$eval('[role=option]',(els,text)=>els.findIndex(el=>el.textContent.trim()===text),text);if(index<0)throw Error('Missing fixture select option: '+text);await page.click(`[role=option]:nth-child(${index+1})`);await page.waitForFunction(()=>!document.querySelector('[role=listbox]'));}
async function replace(page,selector,value){await page.focus(selector);await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.press('Backspace');if(value)await page.type(selector,value);}
module.exports={adminPage,tab,choose,replace,directory,deferred,users,logs,stats,base};
