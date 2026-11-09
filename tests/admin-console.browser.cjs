const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const{adminPage,tab,choose,replace,directory}=require('./helpers/admin-browser.cjs');
const vi=require('../src/shared/locales/vi/admin.json').console,en=require('../src/shared/locales/en/admin.json').console;
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),results=[],dir=directory();let current;
  try{
    for(const[width,height]of[[1920,1080],[1440,1000],[820,1180],[390,844]])for(const theme of['light','dark']){
      const language=width===820?'en':'vi',labels=language==='vi'?vi:en;
      console.log('Admin UI',width,theme,language);
      const{page,state,go}=await adminPage(browser,{width,height,theme,language});current=page;
      await go(width===1920?'/home/admin':'/Home/Admin');await page.waitForSelector('.admin-kpi');await page.waitForFunction(()=>!document.querySelector('.admin-console .ds-page-header button[aria-busy=true]'));
      assert.equal(await page.$$eval('.admin-kpi',els=>els.length),6);
      assert.deepEqual(await page.$$eval('.admin-kpi > p',els=>els.map(el=>el.textContent)),['6','4','2','24','3','2']);
      const kpi=await page.$$eval('.admin-kpi',els=>els.map(el=>{const r=el.getBoundingClientRect();return{y:r.y,height:r.height,icon:el.querySelector('svg').getAttribute('width')};}));
      for(const item of kpi)assert.ok(kpi.filter(other=>Math.abs(other.y-item.y)<1).every(other=>Math.abs(other.height-item.height)<1));
      assert.ok(kpi.every(item=>item.icon==='20'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.screenshot({path:path.join(dir,`${theme}-${width}-overview.png`)});
      await page.$eval('.admin-shortcuts__links button:first-child',el=>el.click());await page.waitForSelector('.admin-users',{visible:true});
      assert.equal(await page.$eval('.admin-console__tabs button:nth-child(2)',el=>el.getAttribute('aria-pressed')),'true');
      assert.equal(await page.$$eval('[data-admin-user]',els=>els.length),6);
      assert.equal(await page.$eval('[data-admin-user="1"] [role=combobox]',el=>el.disabled),true);
      assert.equal(await page.$$eval('[data-admin-user="1"] .admin-row-actions button',els=>els.length),0);
      assert.ok(await page.$eval('[data-admin-user="5"] .admin-provider',el=>el.textContent.includes('Email + Google')));
      await page.screenshot({path:path.join(dir,`${theme}-${width}-users.png`)});
      const reads=state.reads.length;
      await page.type('#admin-user-search','ANNA');await page.waitForFunction(()=>document.querySelectorAll('[data-admin-user]').length===1);
      await choose(page,labels.role_filter,'User');await choose(page,labels.account_status,labels.active);
      assert.equal(await page.$eval('[data-admin-user]',el=>el.dataset.adminUser),'2');assert.equal(state.reads.length,reads,'local filters do not fetch');
      await choose(page,labels.account_status,labels.locked);await page.waitForFunction(()=>!document.querySelector('[data-admin-user]'));
      assert.ok(await page.$eval('.admin-users',(el,label)=>el.textContent.includes(label),labels.no_matching_users));
      await page.$eval('.admin-users .admin-results button',el=>el.click());await page.waitForFunction(()=>document.querySelectorAll('[data-admin-user]').length===6);
      await choose(page,labels.role_filter,'Admin');assert.equal(await page.$$eval('[data-admin-user]',els=>els.length),2);
      await page.$eval('.admin-users .admin-results button',el=>el.click());
      await page.click('.admin-users-table th:first-child button');await page.waitForFunction(()=>document.querySelector('.admin-users-table th:first-child').getAttribute('aria-sort')==='ascending');
      assert.equal(await page.$eval('[data-admin-user]',el=>el.dataset.adminUser),'1');
      // Prove the intentionally scrolling table has keyboard access on narrow screens.
      if(width<1200){await page.focus('.admin-users .admin-table');await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.admin-users .ds-table-scroll').scrollLeft>0);}
      await page.$eval('[data-admin-user="5"] button:has(svg.lucide-trash-2)',el=>el.click());await page.waitForSelector('.admin-delete-message');
      assert.equal(state.writes.length,0,'opening confirmation never deletes');
      const dialog=await page.$eval('[role=dialog]',el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right,y:r.y,bottom:r.bottom,overflow:el.scrollWidth>el.clientWidth};});
      assert.ok(dialog.x>=0&&dialog.y>=0&&dialog.right<=width+1&&dialog.bottom<=height+1&&!dialog.overflow);
      if(width===390)await page.screenshot({path:path.join(dir,`${theme}-${width}-delete-confirmation.png`)});
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
      await tab(page,2);await page.waitForSelector('.admin-login-logs',{visible:true});
      assert.deepEqual(await page.$$eval('[data-admin-log]',els=>els.map(el=>+el.dataset.adminLog)),[105,102,101,103,104]);
      assert.ok(await page.$eval('[data-admin-log="104"] td:nth-child(2) span',el=>!el.className.includes('state-success')&&!el.className.includes('state-danger')));
      await page.screenshot({path:path.join(dir,`${theme}-${width}-logs.png`)});
      await page.type('#admin-log-search','2001:DB8::1');await choose(page,labels.log_status,language==='vi'?'Thất bại':'Failed');
      await page.waitForFunction(()=>document.querySelectorAll('[data-admin-log]').length===1);assert.equal(await page.$eval('[data-admin-log]',el=>el.dataset.adminLog),'102');
      await replace(page,'#admin-log-search','missing');await page.waitForFunction(()=>!document.querySelector('[data-admin-log]'));
      await page.$eval('.admin-login-logs .admin-results button',el=>el.click());await choose(page,labels.sort_logs,labels.oldest_first);
      assert.deepEqual(await page.$$eval('[data-admin-log]',els=>els.map(el=>+el.dataset.adminLog)),[103,101,102,105,104]);
      if(width===1440&&theme==='light'){
        const before=state.reads.length;
        await page.click('button[aria-label="Mở menu tài khoản"]');await page.waitForSelector('[data-user-menu]');await page.$eval('[data-user-menu] button:has(svg.lucide-settings)',el=>el.click());await page.waitForSelector('.appearance-language-modal');
        await page.click('.appearance-language-modal button[lang=en]');await page.waitForFunction(()=>document.querySelector('.admin-console h1').textContent==='Login history');
        await page.click('.appearance-theme .ds-segments button:last-child');await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
        await page.click('.appearance-language-modal button[lang=vi]');await page.click('.appearance-theme .ds-segments button:nth-child(2)');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
        assert.equal(state.reads.length,before,'language/theme changes do not refetch admin data');
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.deepEqual(state.writes,[]);assert.deepEqual(state.errors,[]);
      assert.ok(state.console.every(message=>!message.includes('192.0.2.')&&!message.includes('2001:db8')&&!message.includes('anna@example.test')),'no login records in console');
      results.push({width,height,theme,language,kpis:6,users:'pass',logs:'pass',filtersAndSort:'pass',deleteConfirmation:'pass',overflow:false,errors:state.errors});
      fs.writeFileSync(path.join(dir,'visual-results.json'),JSON.stringify(results,null,2));await page.close();
    }
    console.log('PASS:',results.length,'Admin overview/users/logs visual and filter cases.');
  }catch(error){if(current&&!current.isClosed())await current.screenshot({path:path.join(dir,'visual-failure.png')}).catch(()=>{});throw error;}
  finally{await browser.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
