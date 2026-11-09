// Local UI QA with intercepted API fixtures. No request is sent to a real backend.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7000';
const output = path.resolve(__dirname, '../docs/review-w4');
const readLocale = lng => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../src/shared/locales/${lng}/landing.json`), 'utf8'));
const translations = { vi: readLocale('vi'), en: readLocale('en') };

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const errors = [], cases = [], calls = [];
  let role = null, locale = 'en', theme = 'light';
  const identity = () => ({ id: 42, email: 'landing-review@example.test', displayName: 'MyLife review', fullName: 'MyLife review', role: role || 'USER', roles: [role || 'USER'], isActive: true, avatarUrl: null, loginProviders: { local: true, google: false } });
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => {errors.push(error.message);console.log('Browser error:',error.message);});
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) return request.continue();
      const method = request.method(), headers = { 'Access-Control-Allow-Origin': request.headers().origin || base, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type,x-requested-with', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' };
      if (method === 'OPTIONS') return request.respond({status:204,headers});
      calls.push({ method, path: url.pathname });
      let status=200, body={};
      if (url.pathname === '/api/me') { body=identity(); if (!role) status=401; }
      else if (url.pathname === '/api/login') { role='USER'; body={success:true,user:identity(),message:'Fixture login'}; }
      else if (url.pathname === '/api/logout') { role=null; body={success:true}; }
      else if (url.pathname === '/api/refresh-token') status=401;
      else if (url.pathname === '/api/library/overview') body={categories:[],albums:[]};
      else if (url.pathname === '/api/family-tree/map') body={success:true,data:{totalMembers:0,locatedMembers:0,unlocatedMembers:0,pendingGeocodingMembers:0,noAddressMembers:0,failedGeocodingMembers:0,locations:[],members:[]}};
      else if (url.pathname.startsWith('/api/family-tree')) body={success:true,data:[]};
      else if (url.pathname === '/api/admin/stats') body={totalUsers:1,totalActive:1,totalLocked:0,last7Days:{successLogins:1,failedLogins:0,newRegistrations:1}};
      else if (url.pathname === '/api/admin/users') body=[identity()];
      else if (url.pathname === '/api/admin/logs') body=[];
      await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(body)});
    });
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.goto(base,{waitUntil:'networkidle0'});
    const setPrefs = async () => {
      await page.evaluate(({locale,theme}) => { localStorage.setItem('app_language',locale); localStorage.setItem('i18nextLng',locale); localStorage.setItem('portfolio-theme-preference',theme); },{locale,theme});
    };
    const visit = async route => { await setPrefs(); await page.goto(base+route,{waitUntil:'networkidle0'}); };
    const clickText = async (selector,text) => { const clicked=await page.evaluate(({selector,text})=>{const el=[...document.querySelectorAll(selector)].find(el=>el.textContent.toLowerCase().includes(text.toLowerCase()));el?.click();return !!el;},{selector,text});assert.ok(clicked,`Missing control: ${text}`); };
    await page.setViewport({width:390,height:844});await visit('/');
    await page.click('button[aria-label="Open menu"]');await page.waitForSelector('.ds-drawer',{timeout:5000});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ds-drawer'));
    const matrix = process.env.MYLIFE_UI_INTERACTIONS_ONLY === '1' ? [] : [[1366,768],[1440,900],[1920,1080],[820,1180],[390,844]];
    for(locale of ['vi','en']) for(theme of ['light','dark']) for(const [width,height] of matrix) {
      await page.setViewport({width,height});
      for(const route of ['/','/Home']) {
        await visit(route); await page.waitForSelector('.mylife-landing h1');
        const metrics=await page.evaluate(()=>({title:document.title,lang:document.documentElement.lang,dark:document.documentElement.classList.contains('dark'),h1:document.querySelector('h1').textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,oldPortfolio:/Backend & Game Developer|Programming Skills|Selected Projects/.test(document.body.innerText),video:!!document.querySelector('video'),sections:['family-story','memories','library-story','places'].every(id=>!!document.getElementById(id)),imageLoaded:document.querySelector('.hero-archive img').complete&&document.querySelector('.hero-archive img').naturalWidth>0}));
        assert.equal(metrics.lang,locale);assert.equal(metrics.dark,theme==='dark');assert.equal(metrics.overflow,false,`${route}/${locale}/${theme}/${width} overflow`);assert.equal(metrics.oldPortfolio,false);assert.equal(metrics.video,false);assert.ok(metrics.sections);assert.ok(metrics.imageLoaded);assert.equal(metrics.h1,translations[locale].heroBegin+translations[locale].heroEnd);assert.equal(metrics.title,translations[locale].seoTitle);
        cases.push({route,locale,theme,width,height,...metrics});
        if(route==='/' && (width===1440||width===390||width===820)) {
          await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});
          await page.screenshot({path:path.join(output,`landing-${locale}-${theme}-${width}.png`),fullPage:true});
          if(width===1440)await page.screenshot({path:path.join(output,`hero-${locale}-${theme}-${width}.png`)});
        }
        console.log('Landing',route,locale,theme,width,'OK');
      }
    }
    locale='en';theme='light';await page.setViewport({width:1440,height:900});await visit('/');
    await page.click('.landing-hero__actions a[href="#story"]');await page.waitForFunction(()=>scrollY>200);
    await page.click('.landing-hero__actions button');await page.waitForFunction(()=>location.pathname==='/Register');await page.waitForSelector('form');
    await visit('/Home');await clickText('.landing-header button','Log in');await page.waitForSelector('input[type="password"]');
    await page.evaluate(()=>{window.__googlePopup=null;window.open=(url)=>{window.__googlePopup=String(url);return null;};});
    await clickText('button','Sign in with Google');
    await page.waitForFunction(()=>window.__googlePopup || document.body.innerText.includes('not configured'));
    const googlePath=await page.evaluate(()=>window.__googlePopup?'popup URL built':'configuration unavailable');
    if(googlePath==='popup URL built')assert.equal(await page.evaluate(()=>new URL(window.__googlePopup).hostname),'accounts.google.com');
    await page.type('input[type="email"]','landing-review@example.test');await page.type('input[type="password"]','fixture-password-only');await page.click('form button[type="submit"]');await page.waitForFunction(()=>!document.querySelector('input[type="password"]'));
    assert.equal(role,'USER');await visit('/');assert.ok(await page.$('.landing-header [data-user-menu]') || await page.$('.landing-header button[aria-label="Open account menu"]'));
    await page.click('.landing-hero__actions button');await page.waitForSelector('.app-shell');assert.ok(page.url().endsWith('/mylife'));
    await visit('/timeline');await page.click('.app-shell__brand');await page.waitForFunction(()=>location.pathname==='/mylife');
    await visit('/library');await page.click('.app-nav a[href="/mylife"]');await page.waitForFunction(()=>location.pathname==='/mylife');
    await page.waitForSelector('button[aria-label="Open account menu"]');
    await page.click('button[aria-label="Open account menu"]');await clickText('[data-user-menu] button',translations.en.publicHome);await page.waitForSelector('.mylife-landing');assert.equal(new URL(page.url()).pathname,'/');
    for(const route of ['/mylife','/familytree','/timeline','/anniversaries','/library','/map']){await visit(route);assert.equal(await page.$$eval('.app-shell',els=>els.length),1,route);}
    await visit('/mylife');await page.select('select[aria-label="Language"]','vi');await page.waitForFunction(()=>document.documentElement.lang==='vi');assert.equal(await page.$eval('.app-nav a[href="/mylife"]',el=>el.textContent.trim()),'Trang chủ');
    await visit('/mylife');await page.click('button[aria-label="Open account menu"]');await clickText('[data-user-menu] button','Log Out');await page.waitForSelector('.mylife-landing');assert.equal(role,null);
    assert.equal(await page.$('input[type="password"]'),null,'Intentional logout must not reopen the login overlay');
    await page.setViewport({width:390,height:844});await page.click('button[aria-label="Open menu"]');await page.waitForSelector('.ds-drawer');await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.querySelector('.ds-drawer').contains(document.activeElement)));await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ds-drawer'));
    await page.select('select[aria-label="Language"]','vi');await page.waitForFunction(()=>document.documentElement.lang==='vi');
    await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]);await page.select('select[aria-label="Giao diện"]','system');await page.waitForFunction(()=>document.documentElement.classList.contains('dark'));
    role='ADMIN';locale='en';theme='light';await page.setViewport({width:1440,height:900});await visit('/');await page.click('.landing-hero__actions button');await page.waitForSelector('.app-shell');assert.ok(page.url().endsWith('/Home/Admin'));assert.equal(await page.$eval('.app-shell__brand',el=>el.getAttribute('href')),'/mylife');
    await page.click('.app-shell__brand');await page.waitForFunction(()=>location.pathname==='/Home/Admin');
    await visit('/dev/design-system');assert.ok(await page.$('h1'));
    assert.deepEqual(errors,[],'No uncaught browser errors');
    const result={mode:'isolated fixtures; no live backend',cases,googlePath,errors,calls};
    fs.writeFileSync(path.join(output,process.env.MYLIFE_UI_INTERACTIONS_ONLY==='1'?'interaction-results.json':'qa-results.json'),JSON.stringify(result,null,2));
    console.log(`PASS: ${cases.length} landing viewport/language/theme/route cases; navigation, fixture auth, Google entry, mobile drawer, system theme, authenticated routes, and exclusive roles.`);
  } catch(error) {
    const pages=await browser.pages();const current=pages.at(-1);
    console.error('UI state',role,errors,await current.evaluate(()=>({url:location.href,body:document.body.innerText.slice(0,1200),dialogs:[...document.querySelectorAll('[role="dialog"]')].map(el=>el.className)})));
    await current.screenshot({path:path.join(output,'failure.png')});throw error;
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
