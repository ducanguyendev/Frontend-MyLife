const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const {setupPage,outputDirectory,redact}=require('./helpers/stabilization-browser.cjs');
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),results=[];
  try{
    for(const[renderer,base]of[['shadcn','http://127.0.0.1:7004'],['stable','http://127.0.0.1:7005']])for(const theme of['light','dark']){
      const {page,state,go}=await setupPage(browser,base,{theme});
      const shell=renderer==='shadcn'?'.shadcn-family-tree':'.family-tree-view-shell';
      const viewport=renderer==='shadcn'?'.shadcn-family-tree__viewport':'.family-tree-view__viewport';
      const scene=renderer==='shadcn'?'.shadcn-family-tree__scene':'.family-tree-view__scene';
      const card=renderer==='shadcn'?'.shadcn-family-tree__person':'.family-person-card';
      const camera=()=>page.$eval(scene,el=>el.style.transform);
      await go('/familytree');await page.waitForSelector(card+'[data-member-id="9"]');
      await page.$eval(card+'[data-member-id="9"]',el=>el.click());
      await page.click(shell+' button[aria-label="Vừa khung"]');
      await page.waitForFunction(card=>document.querySelector(card+'[data-member-id="9"]').classList.contains('is-focused'),{},card);
      const before=await camera();
      const point=await page.$eval(viewport,el=>{
        const r=el.getBoundingClientRect();
        for(let y=r.y+100;y<Math.min(r.bottom,innerHeight)-40;y+=50)for(let x=r.x+20;x<r.right-20;x+=50){
          const hit=document.elementFromPoint(x,y);
          if(hit&&el.contains(hit)&&!hit.closest('button,a,article,[data-member-id]'))return{x,y};
        }
        throw Error('No visible blank pan surface');
      });
      await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+50,point.y+35,{steps:5});await page.mouse.up();
      assert.notEqual(await camera(),before,'pointer drag moves tree');
      await page.click(shell+' button[aria-label="Vừa toàn bộ cây"]');
      await page.click(shell+' button[aria-label="Toàn màn hình"]');
      await page.waitForFunction(shell=>document.fullscreenElement?.matches(shell),{},shell);
      await page.screenshot({path:path.join(outputDirectory('tree-navigation'),`${renderer}-${theme}-fullscreen.png`)});
      await page.evaluate(()=>document.exitFullscreen());
      await page.waitForFunction(()=>!document.fullscreenElement);
      assert.ok(await page.$(card+'[data-member-id="9"].is-focused'));
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      results.push({renderer,theme,pointerPan:'pass',focus:'pass',fitAll:'pass',fullscreen:'pass'});await page.close();
    }
    fs.writeFileSync(path.join(outputDirectory('tree-navigation'),'results.json'),JSON.stringify(results,null,2));console.log('PASS: 4 tree pointer pan, focus, Fit All and fullscreen cases.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(redact(error.stack));process.exitCode=1;});
