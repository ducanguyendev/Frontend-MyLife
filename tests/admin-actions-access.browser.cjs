const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const{adminPage,tab,choose,directory,deferred}=require('./helpers/admin-browser.cjs');
const labels=require('../src/shared/locales/vi/admin.json').console;
const row=id=>`[data-admin-user="${id}"]`;
const statusButton=id=>row(id)+' .admin-row-actions button:first-child';
const deleteButton=id=>row(id)+' button:has(svg.lucide-trash-2)';
const confirm='[role=dialog] > div:last-child button:last-child';
const settle=page=>page.waitForFunction(()=>!document.querySelector('.admin-console .ds-page-header button[aria-busy=true]'));
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),results=[],dir=directory();let current;
  async function scenario(name,run){console.log('Admin behavior',name);await run();results.push({name,status:'pass'});fs.writeFileSync(path.join(dir,'behavior-results.json'),JSON.stringify(results,null,2));}
  try{
    await scenario('role/status/delete success, failure, busy confirmation and duplicate guards',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;await go();await page.waitForSelector('.admin-kpi');await settle(page);await tab(page,1);
      state.mutationFailure.role='business';await choose(page,labels.change_role.replace('{{email}}','anna@example.test'),'Admin');
      await page.waitForSelector('.admin-action-error');assert.equal(await page.$eval(row(2)+' [role=combobox]',el=>el.textContent.trim()),'User');
      state.mutationFailure.role=null;const roleGate=deferred();state.mutationGates.role=roleGate.promise;
      await choose(page,labels.change_role.replace('{{email}}','anna@example.test'),'Admin');await page.waitForSelector(row(2)+'[aria-busy=true]');
      assert.equal(await page.$eval(row(2)+' [role=combobox]',el=>el.textContent.trim()),'User','role stays confirmed while pending');
      assert.equal(await page.$eval(row(2),el=>[...el.querySelectorAll('button')].every(button=>button.disabled)),true);
      const count=state.writes.length;await page.$eval(row(2)+' [role=combobox]',el=>{el.click();el.click();});assert.equal(state.writes.length,count);
      roleGate.resolve();await page.waitForFunction(()=>document.querySelector('[data-admin-user="2"] [role=combobox]').textContent.trim()==='Admin');await settle(page);
      assert.equal(await page.$$eval(row(2)+' .admin-row-actions button',els=>els.length),0,'new ADMIN gets existing protection');
      await choose(page,labels.change_role.replace('{{email}}','anna@example.test'),'User');await page.waitForSelector(deleteButton(2));await settle(page);
      state.mutationFailure.status=503;await page.click(statusButton(2));await page.waitForSelector('.admin-action-error');
      await page.waitForFunction(()=>!document.querySelector('[data-admin-user="2"][aria-busy=true]'));assert.ok(await page.$eval(row(2)+' td:nth-child(4)',el=>el.textContent.includes('Hoạt động')));
      state.mutationFailure.status=403;await page.click(statusButton(2));await page.waitForFunction(()=>document.querySelector('.admin-action-error')?.textContent.includes('Bạn không có quyền'));assert.ok(await page.$eval(row(2)+' td:nth-child(4)',el=>el.textContent.includes('Hoạt động')));
      state.mutationFailure.status=null;const statusGate=deferred();state.mutationGates.status=statusGate.promise;
      await page.click(statusButton(3));await page.waitForSelector(row(3)+'[aria-busy=true]');
      assert.ok(await page.$eval(row(3)+' td:nth-child(4)',el=>el.textContent.includes('Bị khóa')),'status stays confirmed while pending');
      const writes=state.writes.length;await page.$eval(row(3)+' .admin-row-actions button',el=>{el.click();el.click();});assert.equal(state.writes.length,writes);
      statusGate.resolve();await page.waitForFunction(()=>document.querySelector('[data-admin-user="3"] td:nth-child(4)').textContent.includes('Hoạt động'));await settle(page);
      assert.equal(await page.$eval('.admin-kpi:nth-child(2) > p',el=>el.textContent),'5','stats refetched after unlock');
      await page.click(statusButton(3));await page.waitForFunction(()=>document.querySelector('[data-admin-user="3"] td:nth-child(4)').textContent.includes('Bị khóa'));await settle(page);
      const beforeDelete=state.writes.length;await page.click(deleteButton(2));await page.waitForSelector('.admin-delete-message');assert.equal(state.writes.length,beforeDelete);
      assert.ok(await page.$eval('.admin-delete-message',el=>el.textContent.includes('anna@example.test')&&el.textContent.includes('vĩnh viễn')));
      await page.click('[role=dialog] > div:last-child button:first-child');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));assert.equal(state.writes.length,beforeDelete);
      await page.click(deleteButton(2));await page.waitForSelector('.admin-delete-message');state.mutationFailure.delete='family';const deleteGate=deferred();state.mutationGates.delete=deleteGate.promise;
      await page.click(confirm);await page.waitForFunction(()=>document.querySelector('[role=dialog] > div:last-child button:last-child').disabled);
      await page.keyboard.press('Escape');await page.mouse.click(2,2);assert.ok(await page.$('[role=dialog]'));assert.ok(await page.$(row(2)));
      const deletionWrites=state.writes.length;await page.$eval(confirm,el=>{el.click();el.click();});assert.equal(state.writes.length,deletionWrites);
      deleteGate.resolve();await page.waitForSelector('.admin-delete-message [role=alert]');assert.ok(await page.$eval('.admin-delete-message',el=>el.textContent.includes('gia phả còn thành viên')));assert.ok(await page.$(row(2)));
      state.mutationFailure.delete=500;await page.click(confirm);await page.waitForFunction(()=>document.querySelector('.admin-delete-message [role=alert]')?.textContent.includes('Dữ liệu được giữ nguyên'));assert.ok(await page.$(row(2)));
      state.mutationFailure.delete=null;await page.click(confirm);await page.waitForFunction(()=>!document.querySelector('[role=dialog]')&&!document.querySelector('[data-admin-user="2"]'));await settle(page);
      assert.equal(await page.$eval('.admin-kpi:first-child > p',el=>el.textContent),'5');
      assert.ok(state.writes.filter(write=>write.action==='role').every(write=>write.method==='PUT'&&['ADMIN','USER'].includes(write.payload.role)));
      assert.ok(state.writes.filter(write=>write.action==='status').every(write=>write.method==='PUT'&&typeof write.payload.isActive==='boolean'));
      assert.ok(state.writes.filter(write=>write.action==='delete').every(write=>write.method==='DELETE'&&write.id===2));
      assert.deepEqual(state.errors,[]);await page.close();
    });
    for(const failed of['stats','users','logs'])await scenario(failed+' failure is isolated; section retry restores data',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;state.readFailures[failed]=503;await go();await page.waitForSelector('.admin-console');await settle(page);
      if(failed!=='stats')assert.equal(await page.$$eval('.admin-kpi',els=>els.length),3);
      await tab(page,1);if(failed!=='users')assert.equal(await page.$$eval('[data-admin-user]',els=>els.length),6);
      await tab(page,2);if(failed!=='logs')assert.equal(await page.$$eval('[data-admin-log]',els=>els.length),5);
      await tab(page,failed==='stats'?0:failed==='users'?1:2);await page.waitForSelector('.admin-console__panel:not([hidden]) .ds-feedback--error');
      state.readFailures[failed]=null;await page.click('.admin-console__panel:not([hidden]) .ds-feedback--error button');
      await page.waitForFunction(()=>!document.querySelector('.admin-console__panel:not([hidden]) .ds-feedback--error'));await settle(page);
      assert.equal(await page.$eval('.admin-console__panel:not([hidden])',el=>!!el.querySelector('.admin-kpi,[data-admin-user],[data-admin-log]')),true);
      const reads=state.reads.length;await page.waitForNetworkIdle({idleTime:400,timeout:5000});assert.equal(state.reads.length,reads,'no request loop');assert.deepEqual(state.errors,[]);await page.close();
    });
    await scenario('independent loading and empty responses',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;const gate=deferred();state.readGates.stats=gate.promise;await go();await page.waitForSelector('.admin-stat-skeleton');assert.equal(await page.$$eval('.admin-stat-skeleton',els=>els.length),3);
      await tab(page,1);await page.waitForSelector('[data-admin-user]',{visible:true});assert.equal(await page.$$eval('[data-admin-user]',els=>els.length),6);
      await tab(page,2);assert.equal(await page.$$eval('[data-admin-log]',els=>els.length),5);gate.resolve();await settle(page);
      state.users=[];state.logs=[];await page.click('.admin-console .ds-page-header button');await settle(page);await tab(page,0);
      assert.deepEqual(await page.$$eval('.admin-kpi',els=>els.slice(0,3).map(el=>el.querySelector('p:last-child').textContent)),['0','0','0']);
      await tab(page,1);assert.ok(await page.$eval('.admin-users',el=>el.textContent.includes('Chưa có người dùng')));await tab(page,2);assert.ok(await page.$eval('.admin-login-logs',el=>el.textContent.includes('Chưa có lịch sử đăng nhập')));assert.deepEqual(state.errors,[]);await page.close();
    });
    await scenario('late pre-mutation refresh cannot overwrite a confirmed row',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;await go();await page.waitForSelector('.admin-kpi');await settle(page);await tab(page,1);
      const gate=deferred();state.readGates.users=gate.promise;await page.click('.admin-console .ds-page-header button');await page.waitForSelector('.admin-users[aria-busy=true]');
      await page.click(statusButton(2));await page.waitForFunction(()=>document.querySelector('[data-admin-user="2"] td:nth-child(4)').textContent.includes('Bị khóa'));
      gate.resolve();await page.waitForNetworkIdle({idleTime:400,timeout:5000});assert.ok(await page.$eval(row(2)+' td:nth-child(4)',el=>el.textContent.includes('Bị khóa')));assert.deepEqual(state.errors,[]);await page.close();
    });
    await scenario('normal user and localStorage role spoof cannot enter either Admin route',async()=>{
      for(const route of['/Home/Admin','/home/admin']){
        const{page,state,go}=await adminPage(browser,{role:'USER'});current=page;await page.evaluateOnNewDocument(()=>{localStorage.setItem('user',JSON.stringify({role:'ADMIN'}));localStorage.setItem('role','ADMIN');});await go(route);await page.waitForFunction(()=>location.pathname==='/403');assert.equal(await page.$('.admin-console'),null);assert.deepEqual(state.reads,[]);assert.deepEqual(state.writes,[]);await page.close();
      }
    });
    await scenario('anonymous session is redirected without fetching Admin records',async()=>{
      const{page,state,go}=await adminPage(browser,{anonymous:true});current=page;await go();await page.waitForFunction(()=>location.pathname==='/');assert.equal(await page.$('.admin-console'),null);assert.deepEqual(state.reads,[]);assert.ok(state.authWrites.includes('/api/refresh-token'));await page.close();
    });
    await scenario('403 hides previously loaded login records while other sections remain usable',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;await go();await page.waitForSelector('.admin-kpi');await settle(page);assert.equal(await page.$$eval('[data-admin-log]',els=>els.length),5);
      state.readFailures.logs=403;await page.click('.admin-console .ds-page-header button');await settle(page);await tab(page,2);assert.equal(await page.$$eval('[data-admin-log]',els=>els.length),0);assert.ok(await page.$eval('.admin-login-logs,.admin-console__panel:not([hidden])',el=>el.textContent.includes('Bạn không có quyền')));
      await tab(page,1);assert.equal(await page.$$eval('[data-admin-user]',els=>els.length),6);assert.deepEqual(state.errors,[]);await page.close();
    });
    await scenario('401 plus expired refresh revokes Admin UI through existing AuthContext',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;await go();await page.waitForSelector('.admin-kpi');await settle(page);
      state.readFailures.logs=401;state.refreshExpired=true;await page.click('.admin-console .ds-page-header button');await page.waitForFunction(()=>location.pathname==='/'&&!document.querySelector('.admin-console'));
      assert.ok(state.authWrites.includes('/api/refresh-token'));assert.ok(state.authWrites.includes('/api/logout'));assert.equal(await page.evaluate(()=>document.body.textContent.includes('2001:db8')),false);assert.deepEqual(state.errors,[]);await page.close();
    });
    await scenario('401 with a valid refresh retries through apiClient and retains Admin access',async()=>{
      const{page,state,go}=await adminPage(browser);current=page;await go();await page.waitForSelector('.admin-kpi');await settle(page);
      state.readFailures.logs=401;state.refreshRecovers=true;await page.click('.admin-console .ds-page-header button');await settle(page);await tab(page,2);
      assert.equal(await page.$$eval('[data-admin-log]',els=>els.length),5);assert.ok(await page.$('.admin-console'));assert.ok(state.authWrites.includes('/api/refresh-token'));assert.ok(!state.authWrites.includes('/api/logout'));assert.deepEqual(state.errors,[]);await page.close();
    });
    console.log('PASS:',results.length,'Admin mutation, loading/error and access-control scenarios.');
  }catch(error){if(current&&!current.isClosed())await current.screenshot({path:path.join(dir,'behavior-failure.png')}).catch(()=>{});throw error;}
  finally{await browser.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
