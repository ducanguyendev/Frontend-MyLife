// Real VietMap network requests; isolated synthetic account/family API responses.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { setupPage, outputDirectory, redact, switchTheme } = require('./helpers/stabilization-browser.cjs');
const base = process.env.MYLIFE_UI_URL || 'http://127.0.0.1:7004';
async function main() {
  const dir = outputDirectory('map');
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const report = process.env.MAP_WIDTHS && fs.existsSync(path.join(dir,'results.json')) ? JSON.parse(fs.readFileSync(path.join(dir,'results.json'),'utf8')) : [];
  let debugPage;
  try {
    for (const [width, height] of (process.env.STABILIZATION_AUDIT ? [[1440,900]] : [[1440,900],[1920,1080],[820,1180],[390,844]]).filter(([width])=>!process.env.MAP_WIDTHS || process.env.MAP_WIDTHS.split(',').includes(String(width)))) {
      for (const theme of (process.env.STABILIZATION_AUDIT ? ['light'] : ['light','dark'])) {
        const { page, state, go } = await setupPage(browser, base, { width, height, theme });
        console.log('Map', theme, width);
        debugPage = page;
        await go('/map'); await page.waitForSelector('.family-distribution-map');
        await page.waitForSelector('.family-map-location');
        await page.$eval('.family-distribution-map',el=>el.scrollIntoView({block:'center'}));
        try { await page.waitForFunction(() => document.querySelector('.family-distribution-map .leaflet-gl-layer canvas') || document.querySelector('.family-map-provider-error'), { timeout: 15000 }); } catch { /* Captured as an explicit provider limitation below. */ }
        // Wait for the provider request, not an arbitrary animation delay.
        if (!state.providerResponses.some(item=>item.path.endsWith('/style.json'))) {
          try { await page.waitForResponse(response => { const url = new URL(response.url()); return url.hostname === 'maps.vietmap.vn' && /style.json$/.test(url.pathname); }, { timeout: 5000 }); } catch { /* Reported by provider-error assertions. */ }
        }
        if (!state.providerResponses.some(item=>item.path.includes('/tiles/') && item.status===200)) {
          await page.waitForResponse(response=>{ const url=new URL(response.url()); return url.hostname==='maps.vietmap.vn' && url.pathname.includes('/tiles/') && response.status()===200; },{timeout:45000}).catch(()=>{});
        }
        await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
        await page.screenshot({ path: path.join(dir, `${theme}-${width}-map.png`) });
        const audit = await page.evaluate(() => ({
          glLayers: document.querySelectorAll('.family-distribution-map .leaflet-gl-layer').length,
          providerError: !!document.querySelector('.family-distribution-map .family-map-provider-error'),
          controls: document.querySelectorAll('.family-distribution-map .family-map-controls').length,
          defaultZoom: document.querySelectorAll('.family-distribution-map .leaflet-control-zoom').length,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }));
        if (process.env.STABILIZATION_AUDIT) {
          await page.click('.family-map-workspace > header button'); await page.waitForSelector('.family-location-modal__leaflet');
          await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
          await page.screenshot({ path: path.join(dir, 'baseline-editor.png') });
          await go('/mylife/family/member/1'); await page.waitForSelector('.family-profile__map-leaflet');
          await page.waitForNetworkIdle({ idleTime: 800, timeout: 15000 }).catch(() => {});
          await page.screenshot({ path: path.join(dir, 'baseline-profile.png') });
        } else {
          assert.deepEqual(audit, { glLayers: 1, providerError: false, controls: 1, defaultZoom: 0, overflow: false });
          assert.ok(state.providerResponses.some(item => /\/styles\/(lm|dm)\/style.json$/.test(item.path) && [200,304].includes(item.status)), 'real VietMap style loaded');
          if (!state.providerResponses.some(item => item.path.includes('/tiles/') && item.status === 200)) console.log('Provider diagnostics',JSON.stringify({responses:state.providerResponses,messages:state.providerMessages}));
          assert.ok(state.providerResponses.some(item => item.path.includes('/tiles/') && item.status === 200), 'real VietMap vector tiles loaded');
          const search = '.family-map-search input';
          await page.type(search, 'duc');
          assert.equal(await page.$$eval('.family-map-location', els => els.length), 1, 'accent-insensitive name search handles đ');
          await page.focus(search); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.type(search, 'da nang');
          await page.waitForFunction(() => document.querySelectorAll('.family-map-location').length === 1);
          assert.equal(await page.$$eval('.family-map-location', els => els.length), 1, 'search includes stored address when region label differs');
          await page.focus(search); await page.keyboard.down('Control'); await page.keyboard.press('A'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
          await page.click('.family-map-filter button:nth-child(3)'); assert.equal(await page.$$eval('.family-map-location', els => els.length), 0);
          await page.click('.family-map-filter button:nth-child(2)'); assert.equal(await page.$('.family-map-unlocated'), null);
          await page.click('.family-map-filter button:first-child');
          await page.click('.family-map-location'); await page.waitForSelector('.family-map-detail');
          await page.click('.family-distribution-map .family-map-controls button:first-child');
          await page.click('.family-distribution-map .family-map-controls button:last-child');
          await page.$eval('.family-map-marker', el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
          await page.waitForSelector('.family-map-popup-member');
          assert.ok((await page.$eval('.family-map-popup-member', el => el.getAttribute('href'))).startsWith('/mylife/family/member/'));
          await page.click('.family-map-workspace > header button'); await page.waitForSelector('.family-location-modal__leaflet .leaflet-gl-layer canvas');
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});
          const containment = await page.evaluate(() => {
            const modal = document.querySelector('.family-location-modal'), surface = modal.querySelector('.family-location-modal__map');
            const r = surface.getBoundingClientRect(), root = modal.getBoundingClientRect();
            const hit = el => { const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)); };
            const buttons = [...modal.querySelectorAll('.family-map-controls button')].map(el => ({ w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height, icon: el.querySelector('svg').getAttribute('width') }));
            return { clipped: getComputedStyle(surface).overflow === 'hidden' && getComputedStyle(surface).isolation === 'isolate', inside: r.left>=root.left && r.right<=root.right+1, headerHit: hit(modal.querySelector(':scope > div:first-child button')), footerHit: hit(modal.querySelector(':scope > div:last-child button:last-child')), buttons, controls: modal.querySelectorAll('.family-map-controls').length, defaultZoom: modal.querySelectorAll('.leaflet-control-zoom').length };
          });
          assert.ok(containment.clipped && containment.inside && containment.headerHit && containment.footerHit);
          assert.equal(containment.controls,1); assert.equal(containment.defaultZoom,0);
          assert.ok(containment.buttons.every(button=>button.w===44 && button.h===44 && button.icon==='17'));
          await page.click('.family-location-modal__info [role=combobox]'); await page.waitForSelector('[role=option]');
          const menuAbove = await page.$eval('[role=option]', el => { const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); });
          assert.equal(menuAbove,true,'portalled member picker remains above map panes');
          await page.click('[role=option][aria-selected=true]');
          const beforePick=await page.$eval('.family-location-modal__info .font-mono',el=>el.textContent);
          // On narrow screens the map scrolls into view before coordinate selection.
          await page.$eval('.family-location-modal__leaflet',el=>el.scrollIntoView({block:'center'}));
          const visibleRect=await page.$eval('.family-location-modal__leaflet',el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width*.6,y:r.y+r.height*.6};});
          await page.mouse.click(visibleRect.x,visibleRect.y);
          await page.waitForFunction(before=>document.querySelector('.family-location-modal__info .font-mono').textContent!==before,{},beforePick);
          await page.screenshot({path:path.join(dir,`${theme}-${width}-editor.png`)});
          await page.click('.family-location-modal > div:last-child button:last-child');
          await page.waitForFunction(()=>!document.querySelector('.family-location-modal'));
          assert.equal(state.writes.filter(item=>/\/location$/.test(item.path)).length,1);
          await page.click('.family-map-workspace > header button');await page.waitForSelector('.family-location-modal__leaflet .leaflet-gl-layer canvas');
          assert.equal(await page.$$eval('.family-location-modal .leaflet-gl-layer',els=>els.length),1,'reopen creates only one base layer');
          await page.click('.family-location-modal > div:first-child button');await page.waitForFunction(()=>!document.querySelector('.family-location-modal'));
          await page.$eval('.family-map-notice button',el=>el.click());
          await page.waitForFunction(()=>document.querySelector('.family-map-notice [role=status]'));
          assert.ok(state.writes.some(item=>item.path.endsWith('/retry-geocoding')));
          if(width===1440) {
            const markerCount = await page.$$eval('.family-map-marker', els=>els.length);
            state.providerFailure=true;
            await switchTheme(page,theme==='light'?'dark':'light');await page.waitForSelector('.family-map-provider-error');
            assert.equal(await page.$$eval('.family-map-marker',els=>els.length),markerCount,'provider failure preserves marker data');
            await page.screenshot({path:path.join(dir,`${theme}-provider-error.png`)});
            state.providerFailure=false;await page.click('.family-map-provider-error button');
            await page.waitForNetworkIdle({idleTime:800,timeout:15000}).catch(()=>{});
            assert.equal(await page.$('.family-map-provider-error'),null,'retry restores the approved provider');
            assert.equal(await page.$$eval('.family-distribution-map .leaflet-gl-layer',els=>els.length),1);
          }
          await go('/mylife/family/member/1');await page.waitForSelector('.family-profile__map-leaflet .leaflet-gl-layer canvas');
          await page.$eval('.family-profile__map',el=>el.scrollIntoView({block:'center'}));
          await page.waitForNetworkIdle({idleTime:500,timeout:15000}).catch(()=>{});
          assert.equal(await page.$$eval('.family-profile__map .family-map-controls',els=>els.length),1);
          assert.equal(await page.$('.family-profile__map .leaflet-control-zoom'),null);
          await page.screenshot({path:path.join(dir,`${theme}-${width}-profile-map.png`)});
          assert.deepEqual(state.errors,[]);
        }
        const previous=report.findIndex(item=>item.width===width&&item.theme===theme);if(previous>=0)report.splice(previous,1);
        report.push({ width, height, theme, ...audit, providerStyles: state.providerResponses.filter(item=>item.path.endsWith('/style.json')), tileResponses: state.providerResponses.filter(item=>item.path.includes('/tiles/')&&item.status===200).length, errors: state.errors });
        fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(report, null, 2));
        await page.close();
      }
    }
    fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    if (debugPage && !debugPage.isClosed()) await debugPage.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});
    throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
