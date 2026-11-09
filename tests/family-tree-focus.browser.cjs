const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const puppeteer = require('../scratch_puppeteer/node_modules/puppeteer');
const { members, setupPage, outputDirectory, redact } = require('./helpers/stabilization-browser.cjs');
const { loadTreeModule } = require('./helpers/load-tree-module.cjs');
const { buildFamilyRelationshipGraph, getAncestralLineageHighlight } = loadTreeModule(path.resolve('src/features/admin/components/family-tree/familyTreeHighlight.ts'));
async function main() {
  const dir = outputDirectory('tree');
  const browser = await puppeteer.launch({ headless: true, pipe: true, timeout: 20000 });
  const results = [];
  try {
    const renderers = process.env.STABILIZATION_AUDIT ? [['shadcn','http://127.0.0.1:7004']] : [['shadcn','http://127.0.0.1:7004'],['stable','http://127.0.0.1:7005']];
    for (const [renderer, base] of renderers) for (const [width,height] of (process.env.STABILIZATION_AUDIT ? [[1440,900]] : [[1440,900],[1920,1080],[820,1180],[390,844]])) for (const theme of (process.env.STABILIZATION_AUDIT ? ['light'] : ['light','dark'])) {
      const { page, state, go } = await setupPage(browser, base, { width,height,theme });
      console.log('Tree', renderer, theme, width);
      const card = renderer === 'shadcn' ? '.shadcn-family-tree__person' : '.family-person-card';
      const scene = renderer === 'shadcn' ? '.shadcn-family-tree__scene' : '.family-tree-view__scene';
      const viewport = renderer === 'shadcn' ? '.shadcn-family-tree__viewport' : '.family-tree-view__viewport';
      const shell = renderer === 'shadcn' ? '.shadcn-family-tree' : '.family-tree-view-shell';
      const graph = buildFamilyRelationshipGraph(members);
      const camera = () => page.$eval(scene, el => { const m = new DOMMatrix(getComputedStyle(el).transform); return { x:m.e,y:m.f,scale:m.a }; });
      const verify = async id => {
        const expected = getAncestralLineageHighlight(graph,id);
        const actual = await page.evaluate(card => ({ nodes:[...document.querySelectorAll(card+'.is-related')].map(el=>+el.dataset.memberId).sort((a,b)=>a-b),segments:[...document.querySelectorAll('[data-segment-id]')].map(el=>({active:el.classList.contains('is-related'),edges:el.dataset.semanticEdges.split(' ').filter(Boolean)})) }), card);
        assert.deepEqual(actual.nodes,[...expected.highlightedNodeIds].sort((a,b)=>a-b));
        for (const segment of actual.segments) assert.equal(segment.active,segment.edges.some(edge=>expected.highlightedSemanticEdgeIds.has(edge)));
      };
      await go('/familytree'); await page.waitForSelector(card+'[data-member-id="9"]');
      await page.waitForFunction(card => [...document.querySelectorAll(card)].every(el=>+getComputedStyle(el).opacity===1),{},card);
      await page.screenshot({path:path.join(dir,`${renderer}-${theme}-${width}-overview.png`)});
      const initial = await camera(); await page.hover(card+'[data-member-id="9"]');
      assert.equal(await page.$$eval(card+'.is-related',els=>els.length),0);
      assert.equal(await page.$$eval('[data-segment-id].is-related',els=>els.length),0);
      assert.deepEqual(await camera(),initial,'hover keeps camera');
      await page.$eval(card+'[data-member-id="9"]',el=>el.click()); await page.mouse.move(5,5); await verify(9);
      await page.waitForFunction(card => +getComputedStyle(document.querySelector(card+'.is-dimmed')).opacity < .65,{},card);
      await page.waitForFunction(() => [...document.querySelectorAll('[data-segment-id].is-dimmed')].every(el=>+getComputedStyle(el).opacity < .5));
      const hierarchy = await page.evaluate(card=>({selected:+getComputedStyle(document.querySelector(card+'.is-focused')).opacity,dimmed:+getComputedStyle(document.querySelector(card+'.is-dimmed')).opacity,edge:+getComputedStyle(document.querySelector('[data-segment-id].is-dimmed')).opacity}),card);
      await page.screenshot({path:path.join(dir,`${renderer}-${theme}-${width}-selected.png`)});
      if (!process.env.STABILIZATION_AUDIT) {
        assert.ok(hierarchy.dimmed>=.3 && hierarchy.dimmed<=.4);
        assert.ok(hierarchy.edge>=.12 && hierarchy.edge<=.22);
        await page.$eval(card+'[data-member-id="11"]',el=>el.click()); await verify(11);
        await page.$eval(viewport,el=>el.focus()); await page.keyboard.press('Escape');
        assert.equal(await page.$$eval(card+'.is-related',els=>els.length),0);
        if (renderer==='stable') { await page.focus(card+'[data-member-id="9"]'); await page.keyboard.press('Enter'); }
        else { await page.focus(card+'[data-member-id="9"] button'); await page.keyboard.press('Enter'); }
        await verify(9);
        await page.evaluate(scene=>Promise.all(document.querySelector(scene).getAnimations().map(animation=>animation.finished)),scene);
        const originalScale=(await camera()).scale;
        await page.click(shell+' button[aria-label="Thu nhỏ"]');
        await page.waitForFunction(({scene,scale})=>new DOMMatrix(getComputedStyle(document.querySelector(scene)).transform).a<scale-.001,{}, {scene,scale:originalScale});
        await page.evaluate(scene=>Promise.all(document.querySelector(scene).getAnimations().map(animation=>animation.finished)),scene);
        const before = await camera(); await page.click(shell+' button[aria-label="Phóng to"]');
        await page.waitForFunction(({scene,scale})=>new DOMMatrix(getComputedStyle(document.querySelector(scene)).transform).a>scale,{}, {scene,scale:before.scale}).catch(async error=>{console.log('Zoom failure',await camera(),await page.$eval(scene,el=>el.style.transform));await page.screenshot({path:path.join(dir,'zoom-failure.png')});throw error;});
        await page.screenshot({path:path.join(dir,`${renderer}-${theme}-${width}-zoom.png`)});
        await page.$eval(viewport,el=>el.focus()); await page.keyboard.press('ArrowRight');
        await page.click(shell+' button[aria-label="Vừa toàn bộ cây"]');
        if (width===1440) {
          const downloadDir=fs.mkdtempSync(path.join(os.tmpdir(),'mylife-tree-review-'));
          const artifactDir=path.join(dir,'downloads',renderer,theme);fs.mkdirSync(artifactDir,{recursive:true});
          const cdp=await page.createCDPSession();await cdp.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir,eventsEnabled:true});
          const downloaded=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('PNG download timeout')),25000);cdp.on('Browser.downloadProgress',event=>{if(event.state==='completed'){clearTimeout(timer);resolve();}});});
          await page.click(shell+' button[aria-label="Xuất PNG"]');await downloaded;
          const filename=fs.readdirSync(downloadDir).find(name=>name.endsWith('.png'));
          const png=fs.readFileSync(path.join(downloadDir,filename));assert.equal(png.subarray(1,4).toString(),'PNG');
          fs.writeFileSync(path.join(artifactDir,filename),png);fs.unlinkSync(path.join(downloadDir,filename));fs.rmdirSync(downloadDir);
          await cdp.detach();
        }
      }
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      results.push({renderer,width,height,theme,hierarchy});await page.close();
    }
    fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(redact(error.stack));process.exitCode=1;});
