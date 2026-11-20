const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const {members,setupPage,outputDirectory,redact}=require('./helpers/stabilization-browser.cjs');
const {loadTreeModule}=require('./helpers/load-tree-module.cjs');
const {buildFamilyRelationshipGraph,getAncestralLineageHighlight}=loadTreeModule(path.resolve('src/features/admin/components/family-tree/familyTreeHighlight.ts'));
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),report=[],dir=outputDirectory('card-click');let debugPage;
  try{
    for(const[renderer,base]of[['stable','http://127.0.0.1:7005'],['shadcn','http://127.0.0.1:7004']])for(const[width,height]of[[1440,900],[1920,1080],[390,844]])for(const theme of['light','dark']){
      console.log('Card click',renderer,width,theme);
      const{page,state,go}=await setupPage(browser,base,{width,height,theme});debugPage=page;
      const card=renderer==='stable'?'.family-person-card':'.shadcn-family-tree__person';
      const shell=renderer==='stable'?'.family-tree-view-shell':'.shadcn-family-tree';
      const viewport=renderer==='stable'?'.family-tree-view__viewport':'.shadcn-family-tree__viewport';
      const nine=card+'[data-member-id="9"]',eleven=card+'[data-member-id="11"]';
      const prefix=renderer==='stable'?'.family-person-card':'.shadcn-family-tree';
      const graph=buildFamilyRelationshipGraph(members);
      const shot=label=>page.screenshot({path:path.join(dir,`${renderer}-${theme}-${width}-${label}.png`)});
      const clear=async()=>{await page.$eval(viewport,el=>el.focus());await page.keyboard.press('Escape');await page.waitForFunction(card=>!document.querySelector(card+'.is-focused'),{},card);};
      const noWorkflow=async()=>{assert.equal(new URL(page.url()).pathname,'/familytree');assert.equal(await page.$('[role=dialog]'),null);assert.deepEqual(state.writes,[]);};
      const verify=async id=>{
        const expected=getAncestralLineageHighlight(graph,id);
        await page.waitForSelector(card+`[data-member-id="${id}"].is-focused`);
        const actual=await page.evaluate(card=>({ids:[...document.querySelectorAll(card+'.is-related')].map(el=>+el.dataset.memberId).sort((a,b)=>a-b),segments:[...document.querySelectorAll('[data-segment-id]')].map(el=>({active:el.classList.contains('is-related'),edges:el.dataset.semanticEdges.split(' ').filter(Boolean)}))}),card);
        assert.deepEqual(actual.ids,[...expected.highlightedNodeIds].sort((a,b)=>a-b));
        for(const segment of actual.segments)assert.equal(segment.active,segment.edges.some(edge=>expected.highlightedSemanticEdgeIds.has(edge)));
        await noWorkflow();
      };
      await go('/familytree');await page.waitForSelector(nine);
      await page.waitForFunction(card=>[...document.querySelectorAll(card)].every(el=>+getComputedStyle(el).opacity===1),{},card);
      await shot('initial');
      // Select once to make this card visible even in a narrow tree viewport.
      await page.$eval(nine,el=>el.click());await verify(9);
      await page.waitForFunction(card=>+getComputedStyle(document.querySelector(card+'.is-dimmed')).opacity<.4,{},card);
      await page.hover(nine);await verify(9);await shot('hover-selected');
      await clear();
      await page.click(nine+' '+prefix+'__portrait');await verify(9);await shot('avatar-ancestry-cousins-dim');
      await clear();await page.click(nine+' '+prefix+'__name');await verify(9);await shot('name-ancestry');
      const dim=await page.$eval(eleven,el=>+getComputedStyle(el).opacity);assert.ok(dim<.4);
      await clear();await page.click(nine+' '+prefix+'__role');await verify(9);
      await clear();await page.$eval(nine,el=>el.click());await verify(9);
      assert.equal(await page.$$eval(shell+' button button',els=>els.length),0,'valid non-nested button HTML');
      await clear();await page.focus(viewport);
      for(let step=0;step<100&&!await page.$eval(nine,el=>document.activeElement===el);step++)await page.keyboard.press('Tab');
      assert.equal(await page.$eval(nine,el=>document.activeElement===el),true,'card participates in Tab order');
      const ring=await page.$eval(nine,el=>({width:parseFloat(getComputedStyle(el).outlineWidth),style:getComputedStyle(el).outlineStyle}));assert.ok(ring.width>=2&&ring.style!=='none');
      await page.keyboard.press('Enter');await verify(9);
      await clear();await page.focus(nine);const scroll=await page.evaluate(()=>scrollY);await page.keyboard.press('Space');await verify(9);assert.equal(await page.evaluate(()=>scrollY),scroll,'Space activation does not scroll page');
      // Use a different, dimmed card: menu/detail/edit must preserve selection 9.
      const menu=eleven+(renderer==='stable'?' .family-person-card__action-trigger':' .shadcn-family-tree__action-menu');
      await page.$eval(menu,el=>el.click());await page.waitForSelector(eleven+' [role=menu]');await verify(9);
      await page.$eval(eleven+' [role=menu]',el=>el.querySelector('button:has(svg.lucide-eye)').click());
      await page.waitForSelector('.family-quick-detail');assert.ok(await page.$(nine+'.is-focused'));
      assert.ok(await page.$eval('.family-quick-detail',el=>el.textContent.includes('Nguyễn Sơn Tùng')));
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));
      if(renderer==='stable')await page.$eval(eleven+' .family-person-card__edit',el=>el.click());
      else{await page.$eval(menu,el=>el.click());await page.$eval(eleven+' [role=menu] button:has(svg.lucide-pencil)',el=>el.click());}
      await page.waitForSelector('.family-member-form');assert.ok(await page.$(nine+'.is-focused'));assert.equal(await page.$('.family-quick-detail'),null);
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));await noWorkflow();
      // Menu Escape must close the menu rather than clear the current lineage.
      await page.$eval(menu,el=>el.click());await page.waitForSelector(eleven+' [role=menu] button',{visible:true});await page.focus(eleven+' [role=menu] button');
      await page.waitForFunction(selector=>document.querySelector(selector)===document.activeElement,{},eleven+' [role=menu] button');await page.keyboard.press('Escape');
      await page.waitForFunction(selector=>!document.querySelector(selector),{},eleven+' [role=menu]');await verify(9);
      await page.$eval(eleven,el=>el.click());await verify(11);await shot('new-selection');
      await page.click(shell+' button[aria-label="Vừa toàn bộ cây"]');await verify(11);await shot('fit-all');
      await clear();await page.waitForFunction(card=>[...document.querySelectorAll(card)].every(el=>+getComputedStyle(el).opacity===1),{},card);
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      report.push({renderer,width,height,theme,contentSelection:'pass',explicitDetail:'pass',editOnly:'pass',menuOnly:'pass',keyboard:'pass',lineageAndSegments:'pass',cousinsDimmed:dim,focusRing:ring,clear:'pass',errors:state.errors});
      fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(report,null,2));await page.close();
    }
    console.log('PASS:',report.length,'card interaction browser cases.');
  }catch(error){if(debugPage&&!debugPage.isClosed())await debugPage.screenshot({path:path.join(dir,'failure.png')}).catch(()=>{});throw error;}
  finally{await browser.close();}
}
main().catch(error=>{console.error(redact(error.stack));process.exitCode=1;});
