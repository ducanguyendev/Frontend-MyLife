const{test}=require('node:test');
const assert=require('node:assert/strict');
const{loadAdminModule,hookHarness,deferred,flush}=require('./helpers/load-admin-module.cjs');
class ApiError extends Error{constructor(message,status=0,payload){super(message);this.status=status;this.payload=payload;}}
const serviceFile='src/features/admin/services/adminConsoleService.ts';
const load=client=>loadAdminModule(serviceFile,{'@/shared/api/apiClient':{apiClient:client,ApiError}});
const model=load({});
const users=[
  {id:1,email:'admin@example.test',role:'ADMIN',isActive:true,createdAt:'2026-01-01T00:00:00Z'},
  {id:2,email:'Anna@example.test',role:'USER',isActive:true,createdAt:'2026-11-01T00:00:00Z'},
  {id:3,email:'ben@example.test',role:'USER',isActive:false,createdAt:'2026-10-01T00:00:00Z'},
  {id:4,email:'no-date@example.test',role:'USER',isActive:true,createdAt:'invalid'},
];
const logs=[{id:1,attemptEmail:'Anna@example.test',status:'SUCCESS',ipAddress:'192.0.2.10',createdAt:'2026-10-01T00:00:00Z'},{id:2,attemptEmail:'ben@example.test',status:'FAILED',ipAddress:'2001:db8::1',createdAt:'2026-11-01T00:00:00Z'},{id:3,attemptEmail:'new@example.test',status:'REGISTERED',createdAt:'invalid'}];
const stats={totalUsers:4,totalActive:3,totalLocked:1,last7Days:{successLogins:15,failedLogins:2,newRegistrations:1}};
const ids=rows=>Array.from(rows,row=>row.id);
test('users combine case-insensitive email, role and active/locked filters without mutating API order',()=>{
  assert.deepEqual(ids(model.selectAdminUsers(users,' ANNA ','USER','active','created-desc')),[2]);
  assert.deepEqual(ids(model.selectAdminUsers(users,'example','USER','locked','email-asc')),[3]);
  assert.deepEqual(ids(model.selectAdminUsers(users,'','ADMIN','all','created-desc')),[1]);
  assert.deepEqual(ids(model.selectAdminUsers(users,'missing','all','all','created-desc')),[]);
  assert.deepEqual(ids(users),[1,2,3,4]);
});
test('user email/date sorting keeps invalid dates last and has deterministic ties',()=>{
  assert.deepEqual(ids(model.selectAdminUsers(users,'','all','all','created-desc')),[2,3,1,4]);
  assert.deepEqual(ids(model.selectAdminUsers(users,'','all','all','created-asc')),[1,3,2,4]);
  assert.deepEqual(ids(model.selectAdminUsers(users,'','all','all','email-desc')),[4,3,2,1]);
});
test('login logs search email and IPv4/IPv6, combine statuses, sort newest first and preserve unknown entries',()=>{
  assert.deepEqual(ids(model.selectAdminLogs(logs,'ANNA','SUCCESS','newest')),[1]);
  assert.deepEqual(ids(model.selectAdminLogs(logs,'2001:db8','FAILED','newest')),[2]);
  assert.deepEqual(ids(model.selectAdminLogs(logs,'','all','newest')),[2,1,3]);
  assert.deepEqual(ids(model.selectAdminLogs(logs,'','all','oldest')),[1,2,3]);
  assert.deepEqual(ids(model.selectAdminLogs(logs,'192.0.2','REGISTERED','newest')),[]);
});
test('provider labels respect actual linked providers and do not assume Email for unknown provider',()=>{
  assert.equal(model.loginProvider({loginProviders:{local:true,google:true},authProvider:0}),'both');
  assert.equal(model.loginProvider({loginProviders:{local:false,google:true}}),'google');
  assert.equal(model.loginProvider({authProvider:0}),'email');assert.equal(model.loginProvider({}),'unknown');
});
test('ratio requires a valid nonzero denominator and never fabricates trends',()=>{
  assert.equal(model.accountProportions(stats).active,75);
  assert.equal(model.accountProportions({...stats,totalUsers:0}),null);
  assert.equal(model.accountProportions({...stats,totalActive:8}),null);
});
test('service keeps raw read contracts and mutation endpoints/bodies; no user writes before API success',async()=>{
  const calls=[],controller=new AbortController();
  const service=load({get:async(endpoint,options)=>{calls.push([endpoint,options.signal]);return endpoint.endsWith('stats')?stats:endpoint.endsWith('users')?users:logs;},put:async(endpoint,body,options)=>{calls.push([endpoint,body,options.signal]);return{success:true,...body};},delete:async(endpoint,options)=>{calls.push([endpoint,options.signal]);return{success:true,deletedId:2};}}).adminConsoleService;
  assert.equal(await service.stats(controller.signal),stats);assert.equal(await service.users(controller.signal),users);assert.equal(await service.logs(controller.signal),logs);
  assert.equal(await service.role(2,'ADMIN',controller.signal),'ADMIN');assert.equal(await service.status(2,false,controller.signal),false);await service.remove(2,controller.signal);
  assert.deepEqual(calls.map(call=>call[0]),['/api/admin/stats','/api/admin/users','/api/admin/logs','/api/admin/users/2/role','/api/admin/users/2/status','/api/admin/users/2']);
  assert.equal(calls[3][1].role,'ADMIN');assert.equal(calls[4][1].isActive,false);assert.ok(calls.every(call=>call.at(-1)===controller.signal));
});
test('service rejects business failures and invalid returned role/status; keeps family-members error code',async()=>{
  const signal=new AbortController().signal;
  let result={success:false,code:'USER_HAS_FAMILY_MEMBERS',message:'Rejected'};
  const service=load({put:async()=>result,delete:async()=>result}).adminConsoleService;
  await assert.rejects(service.role(2,'ADMIN',signal));await assert.rejects(service.status(2,false,signal));
  await assert.rejects(service.remove(2,signal),error=>model.adminErrorKey(error,'delete_error')==='admin.user_has_family_members');
  result={success:true,role:'OWNER',isActive:'yes'};await assert.rejects(service.role(2,'ADMIN',signal));await assert.rejects(service.status(2,false,signal));
});
test('read errors propagate independently and malformed statistics never become fake zeros',async()=>{
  for(const endpoint of['stats','users','logs']){
    const service=load({get:async path=>{if(path.endsWith(endpoint))throw new ApiError('Unavailable',503);return path.endsWith('stats')?stats:path.endsWith('users')?users:logs;}}).adminConsoleService;
    await assert.rejects(service[endpoint](new AbortController().signal));
    for(const other of['stats','users','logs'].filter(name=>name!==endpoint))assert.ok(await service[other](new AbortController().signal));
  }
  await assert.rejects(load({get:async()=>({...stats,totalUsers:NaN})}).adminConsoleService.stats(new AbortController().signal));
});
test('401/403 and family-member conflicts resolve to localized messages',()=>{
  assert.equal(model.adminErrorKey(new ApiError('x',401),'users_error'),'admin.notifications.session_expired');
  assert.equal(model.adminErrorKey(new ApiError('x',403),'users_error'),'admin.notifications.forbidden');
});
test('resource aborts old requests, ignores late responses, retains ordinary-error data and clears 403 data',async()=>{
  const h=hookHarness(),requests=[];const loader=signal=>{const request=deferred();requests.push({...request,signal});return request.promise;};
  const{useAdminResource}=loadAdminModule('src/features/admin/hooks/useAdminConsole.ts',{react:h.react,'../services/adminConsoleService':{adminConsoleService:{}}});
  let resource=h.render(()=>useAdminResource(loader));assert.equal(resource.loading,true);requests[0].resolve(['first']);await flush();resource=h.render(()=>useAdminResource(loader));assert.equal(resource.data[0],'first');
  const old=resource.reload();const fresh=resource.reload();assert.equal(requests[1].signal.aborted,true);requests[2].resolve(['latest']);await fresh;requests[1].resolve(['stale']);await old;
  resource=h.render(()=>useAdminResource(loader));assert.equal(resource.data[0],'latest');
  const failed=resource.reload();requests[3].reject(new ApiError('Failed',503));await failed;resource=h.render(()=>useAdminResource(loader));assert.equal(resource.data[0],'latest');assert.ok(resource.error);
  const forbidden=resource.reload();requests[4].reject(new ApiError('Forbidden',403));await forbidden;resource=h.render(()=>useAdminResource(loader));assert.equal(resource.data,null);
  const pending=resource.reload();h.unmount();assert.equal(requests[5].signal.aborted,true);requests[5].resolve(['after unmount']);await pending;
});
test('row mutex blocks duplicate/status/role overlap, confirms UI changes only after success and preserves self/admin policy',async()=>{
  const h=hookHarness(),writes=[],roleRequest=deferred();
  const service={stats:async()=>stats,users:async()=>users,logs:async()=>logs,role:async(id,role)=>{writes.push(['role',id,role]);return roleRequest.promise;},status:async(id,value)=>{writes.push(['status',id,value]);return value;},remove:async(id)=>{writes.push(['delete',id]);}};
  const{useAdminConsole}=loadAdminModule('src/features/admin/hooks/useAdminConsole.ts',{react:h.react,'../services/adminConsoleService':{adminConsoleService:service}});
  const render=()=>h.render(()=>useAdminConsole(1));let state=render();await flush();state=render();
  const pending=state.mutate(users[1],'role','ADMIN');assert.equal(render().users.data[1].role,'USER');assert.equal(render().pending.get(2),'role');
  await state.mutate(users[1],'status');await state.mutate(users[0],'role','USER');await state.mutate(users[0],'delete');assert.equal(writes.length,1);
  roleRequest.resolve('ADMIN');assert.equal((await pending).ok,true);state=render();assert.equal(state.users.data[1].role,'ADMIN');assert.equal(state.pending.size,0);
  const before=state.users.data;service.remove=async()=>{throw new ApiError('Family',409,{code:'USER_HAS_FAMILY_MEMBERS'});};
  const deletion=await state.mutate(users[2],'delete');assert.equal(deletion.ok,false);assert.equal(render().users.data,before);
  const unlocked=await state.mutate(users[2],'status');assert.equal(unlocked.ok,true);assert.equal(render().users.data[2].isActive,true);
  h.unmount();
});
test('role/status failures leave confirmed row data intact and deletion only removes a confirmed row',async()=>{
  const h=hookHarness();const service={stats:async()=>stats,users:async()=>users,logs:async()=>logs,role:async()=>{throw Error('role failed');},status:async()=>{throw Error('status failed');},remove:async()=>{}};
  const{useAdminConsole}=loadAdminModule('src/features/admin/hooks/useAdminConsole.ts',{react:h.react,'../services/adminConsoleService':{adminConsoleService:service}});
  const render=()=>h.render(()=>useAdminConsole(1));render();await flush();let state=render();
  assert.equal((await state.mutate(users[1],'role','ADMIN')).ok,false);assert.equal(render().users.data[1].role,'USER');
  assert.equal((await state.mutate(users[1],'status')).ok,false);assert.equal(render().users.data[1].isActive,true);
  assert.equal((await state.mutate(users[1],'delete')).ok,true);assert.deepEqual(ids(render().users.data),[1,3,4]);h.unmount();
});

test('VI/EN Admin labels resolve with no missing keys or raw interpolation',async()=>{
  const fs=require('node:fs'),i18next=require('i18next');
  const resources=Object.fromEntries(['vi','en'].map(language=>[language,{translation:{admin:JSON.parse(fs.readFileSync(`src/shared/locales/${language}/admin.json`,'utf8'))}}]));
  const keys=Object.keys(resources.vi.translation.admin.console);assert.deepEqual(keys.sort(),Object.keys(resources.en.translation.admin.console).sort());
  for(const language of['vi','en']){
    const i18n=i18next.createInstance();await i18n.init({lng:language,resources,fallbackLng:false});
    for(const key of keys){const translated=i18n.t('admin.console.'+key,{email:'fixture@example.test',count:6,shown:2,total:6,active:4,locked:2});assert.notEqual(translated,'admin.console.'+key);assert.ok(!translated.includes('{{'),key);}
  }
});

test('different rows can update concurrently without losing either confirmed change; unmount aborts pending mutations',async()=>{
  const h=hookHarness(),first=deferred(),second=deferred(),signals=[];
  const service={stats:async()=>stats,users:async()=>users,logs:async()=>logs,status:async(id,value,signal)=>{signals.push(signal);return id===2?first.promise:second.promise;}};
  const{useAdminConsole}=loadAdminModule('src/features/admin/hooks/useAdminConsole.ts',{react:h.react,'../services/adminConsoleService':{adminConsoleService:service}});
  const render=()=>h.render(()=>useAdminConsole(1));render();await flush();let state=render();
  const a=state.mutate(users[1],'status'),b=state.mutate(users[2],'status');assert.equal(render().pending.size,2);
  second.resolve(true);await b;first.resolve(false);await a;state=render();assert.equal(state.users.data[1].isActive,false);assert.equal(state.users.data[2].isActive,true);
  const third=deferred();service.status=async(id,value,signal)=>{signals.push(signal);return third.promise;};const pending=state.mutate(users[1],'status');h.unmount();assert.equal(signals.at(-1).aborted,true);third.resolve(true);assert.equal((await pending).ok,false);
});

test('status result and success wording use the confirmed API state, even if it differs from the requested state',async()=>{
  const h=hookHarness();const service={stats:async()=>stats,users:async()=>users,logs:async()=>logs,status:async()=>false};
  const{useAdminConsole}=loadAdminModule('src/features/admin/hooks/useAdminConsole.ts',{react:h.react,'../services/adminConsoleService':{adminConsoleService:service}});
  const render=()=>h.render(()=>useAdminConsole(1));render();await flush();const outcome=await render().mutate(users[2],'status');assert.equal(outcome.ok,true);assert.equal(outcome.isActive,false);assert.equal(render().users.data[2].isActive,false);h.unmount();
});
