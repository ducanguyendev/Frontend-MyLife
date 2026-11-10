const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { createReviewPage, ready } = require('./helpers/global-polish-browser.cjs');
const output = path.resolve('docs/review-w9/interactions');
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const translations = language => ({ admin: require(`../src/shared/locales/${language}/admin.json`) });
async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const checks = []; let current;
  try {
    for (const [width,height,language] of [[1440,900,'vi'], [820,1180,'en'], [390,844,'vi']]) for (const theme of ['light','dark']) {
      const { page, state, go } = await createReviewPage(browser, { width,height,language,theme }); current = page;
      const name = `${language}-${theme}-${width}`; console.log('Interactions', name);
      const copy = translations(language);
      async function field(selector, label) {
        await ready(page, selector);
        const dimensions = await page.$eval(selector, el => { const r = el.closest('[data-field-shell]').getBoundingClientRect(); return { width:r.width, height:r.height }; });
        // Tab from a temporary preceding anchor proves keyboard ownership, rather than programmatic focus styling alone.
        await page.$eval(selector, el => { const anchor = document.createElement('button'); anchor.id = 'qa-focus-anchor'; el.before(anchor); anchor.focus(); });
        await page.keyboard.press('Tab');
        assert.equal(await page.$eval(selector, el => document.activeElement === el), true);
        await page.evaluate(() => document.querySelector('#qa-focus-anchor').remove());
        const result = await page.$eval(selector, el => {
          const shell = el.closest('[data-field-shell]'), inner = getComputedStyle(el), outer = getComputedStyle(shell), r = shell.getBoundingClientRect();
          return { outline:inner.outlineStyle, border:inner.borderWidth, shadow:inner.boxShadow, shellShadow:outer.boxShadow, width:r.width, height:r.height };
        });
        assert.equal(result.outline, 'none'); assert.equal(result.border, '0px'); assert.equal(result.shadow, 'none');
        assert.notEqual(result.shellShadow, 'none'); assert.equal(result.shellShadow.includes('inset'), false);
        assert.equal(result.width, dimensions.width); assert.equal(result.height, dimensions.height);
        checks.push({ case:name, check:label+' focus owner', ...result });
      }
      async function modalKeyboard(selector) {
        await ready(page, selector);
        const bounds = await page.$eval(selector, el => { const r=el.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,overflow:el.scrollWidth>el.clientWidth+1 }; });
        assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.right<=width+1&&bounds.bottom<=height+1&&!bounds.overflow);
        assert.equal(await page.$eval(selector, el => el.contains(document.activeElement)), true, 'focus enters dialog');
        const controls = 'button:not([disabled]),input:not([disabled]),[role=combobox]:not([aria-disabled=true]),textarea:not([disabled]),a[href],[tabindex="0"]';
        await page.$eval(selector, (el,controls) => [...el.querySelectorAll(controls)].filter(el=>el.getClientRects().length).at(-1).focus(), controls);
        await page.keyboard.press('Tab');
        assert.equal(await page.$eval(selector,(el,controls)=>document.activeElement===[...el.querySelectorAll(controls)].find(el=>el.getClientRects().length),controls),true,'Tab wraps inside dialog');
        await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
        assert.equal(await page.$eval(selector,(el,controls)=>document.activeElement===[...el.querySelectorAll(controls)].filter(el=>el.getClientRects().length).at(-1),controls),true,'Shift+Tab wraps inside dialog');
        checks.push({ case:name, check:selector+' dialog bounds/focus trap', ...bounds });
      }
      await go('/familytree'); await field('input[type=search]', 'family search');
      await page.type('input[type=search]', 'Quỳnh'); assert.equal(await page.$eval('input[type=search]', el=>el.value), 'Quỳnh');
      await page.click('.family-search-clear'); assert.equal(await page.$eval('input[type=search]',el=>el.value),'');
      await page.click('.family-toolbar [role=combobox]'); await ready(page, '[role=option]');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForFunction(()=>!document.querySelector('[role=listbox]'));
      await go('/map'); await field('.family-map-search input', 'map search');
      await page.type('.family-map-search input','nothing-matches-review'); await ready(page,'.family-map-list-empty');
      await page.focus('.family-map-search input'); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await ready(page,'.family-map-location');
      await go('/anniversaries'); await field('.memory-upcoming__search input', 'anniversary search');
      await go('/timeline'); await ready(page,'.timeline-event');
      await page.click('.ds-page-header__actions button'); await modalKeyboard('.memory-form--timeline');
      await field('#familyTimelineEventForm input:not([type=hidden])', 'timeline form');
      await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
      assert.equal(await page.$eval('.ds-page-header__actions button',el=>el===document.activeElement),true,'modal restores opener focus');
      await go('/library'); await ready(page,'.memory-album');
      await field('.library-album-filter [role=combobox]', 'library filter');
      await page.click('.memory-album__open'); await ready(page,'.memory-photo');
      await page.click('.memory-photo__open'); await modalKeyboard('.memory-lightbox');
      if (width===390&&theme==='dark') await page.screenshot({path:path.join(output,'dark-390-library-lightbox.png')});
      await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
      state.anonymous=true; await go('/Register'); await ready(page,'input[name=email]');
      if(width<640) assert.equal(await page.$eval('.auth-register__utilities',el=>el.getBoundingClientRect().bottom<=el.nextElementSibling.getBoundingClientRect().top),true,'Register utilities do not overlap heading');
      await page.$eval('form',el=>el.requestSubmit()); await ready(page,'[aria-invalid=true]');
      assert.ok(await page.$$eval('[role=alert]',els=>els.length)>0);
      await field('input[name=email]', 'register validation');
      await page.waitForFunction(()=>[...document.querySelectorAll('.auth-register form > .overflow-hidden')].every(el=>Number(getComputedStyle(el).opacity)>=.99));
      if(width===390&&theme==='light') await page.screenshot({path:path.join(output,'light-390-register-validation.png')});
      await page.click('a[href="/"]'); await ready(page,'.mylife-landing');
      await page.evaluate(()=>window.dispatchEvent(new CustomEvent('ui:openLogin'))); await modalKeyboard('.auth-login');
      await page.$eval('.auth-login form',el=>el.requestSubmit()); await ready(page,'.auth-login [aria-invalid=true]');
      await field('.auth-login input[name=email]', 'login validation');
      const loginContrast=await page.evaluate(()=>{
        const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        return ['.auth-login form [role=alert]','.auth-login form > p a'].map(selector=>{
          const el=document.querySelector(selector);let parent=el,background;
          while(parent){background=getComputedStyle(parent).backgroundColor;if(!background.endsWith(', 0)')&&background!=='rgba(0, 0, 0, 0)')break;parent=parent.parentElement;}
          const a=luminance(getComputedStyle(el).color),b=luminance(background);return{selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
        });
      });
      assert.ok(loginContrast.every(pair=>pair.ratio>=4.5),'Login error and link text retain contrast on actual dialog surface');
      checks.push({case:name,check:'login actual error/link contrast',pairs:loginContrast});
      assert.equal(await page.$eval('.auth-login button[aria-label]',el=>el.getAttribute('aria-label')),copy.admin.close);
      if(width===1440&&theme==='dark') await page.screenshot({path:path.join(output,'dark-1440-login-validation-focus.png')});
      await page.keyboard.press('Escape'); await page.waitForFunction(()=>!document.querySelector('.auth-login'));
      await go('/dev/design-system'); await ready(page,'.ds-field[data-disabled]');
      assert.equal(await page.$eval('input:disabled',el=>el.closest('[data-field-shell]').hasAttribute('data-disabled')),true);
      assert.equal(await page.$eval('input:disabled',el=>getComputedStyle(el.closest('[data-field-shell]')).boxShadow),'none');
      await page.$eval('#theme-preview',el=>{const anchor=document.createElement('button');anchor.id='native-anchor';el.before(anchor);anchor.focus();});
      await page.keyboard.press('Tab');
      assert.equal(await page.$eval('#theme-preview',el=>el===document.activeElement&&getComputedStyle(el).outlineStyle!=='none'),true,'standalone native focus remains visible');
      assert.ok(await page.$eval('.ds-field',el=>parseFloat(getComputedStyle(el).transitionDuration)<=.001),'reduced motion is respected');
      checks.push({case:name,check:'disabled/native focus/reduced motion',status:'pass'});
      assert.deepEqual(state.errors,[]); assert.ok(state.writes.every(write=>['/api/refresh-token','/api/logout'].includes(write.route)));
      await page.close();
    }
    for(const theme of ['light','dark']) for(const mode of ['loading','empty','error']) {
      const {page,state,go}=await createReviewPage(browser,{width:390,height:844,theme}); current=page;
      const gate=deferred(); state.mode=mode==='loading'?'normal':mode; state.gate=mode==='loading'?gate.promise:null;
      await go('/timeline');
      await ready(page,mode==='loading'?'.memory-skeleton':mode==='error'?'.ds-feedback--error':'.memory-page .grid.min-h-48');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.screenshot({path:path.join(output,`${theme}-390-timeline-${mode}.png`)});
      checks.push({case:theme+'-390',check:'timeline '+mode,status:'pass'}); gate.resolve(); await page.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(checks,null,2));
    console.log('PASS:',checks.length,'field focus, dialog, validation and state checks.');
  } catch(error) {
    fs.writeFileSync(path.join(output,'partial-results.json'),JSON.stringify(checks,null,2));
    if(current&&!current.isClosed())await current.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
    throw error;
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
