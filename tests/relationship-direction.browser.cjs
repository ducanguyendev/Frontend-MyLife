const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const {setupPage,outputDirectory,redact}=require('./helpers/stabilization-browser.cjs');
const base=process.env.MYLIFE_UI_URL||'http://127.0.0.1:7004';
async function main(){
  const dir=outputDirectory('relationship-direction'),results=[];
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000});
  try{
    for(const[width,height]of[[1440,900],[1920,1080],[820,1180],[390,844]])for(const theme of['light','dark']){
      const {page,state,go}=await setupPage(browser,base,{width,height,theme});
      const choose=async id=>{await page.click('#relationship-member-search');await page.waitForSelector('#relationship-member-option-'+id);await page.click('#relationship-member-option-'+id);};
      const calculate=async()=>{await page.click('.family-explorer > button');await page.waitForSelector('.family-explorer__answer');};
      const answer=()=>page.$eval('.family-explorer__answer',el=>({people:[...el.querySelectorAll('strong')].map(item=>item.textContent),label:el.querySelector('b').textContent}));
      await go('/mylife/family/member/1');await page.waitForSelector('#relationship-member-search:not(:disabled)');
      assert.equal(await page.$eval('#relationship-reference-member',el=>el.value),'Mai Thu');
      await choose(3);await calculate();
      assert.deepEqual(await answer(),{people:['Nguyễn Mai Anh','Mai Thu'],label:'Con gái'});
      await page.screenshot({path:path.join(dir,`${theme}-${width}-daughter.png`)});
      await choose(3);assert.equal(await page.$('.family-explorer__result'),null,'deselect clears prior answer');
      state.relationshipReversed=true;
      await go('/mylife/family/member/3');await page.waitForSelector('#relationship-member-search:not(:disabled)');
      await choose(1);await calculate();
      assert.deepEqual(await answer(),{people:['Mai Thu','Nguyễn Mai Anh'],label:'Mẹ'});
      assert.deepEqual(await page.$$eval('.family-explorer__step',els=>els.map(el=>el.lastChild.textContent)),['Mai Thu','Nguyễn Mai Anh']);
      assert.equal(await page.$eval('.family-explorer__edge small',el=>el.textContent),'Con');
      await page.screenshot({path:path.join(dir,`${theme}-${width}-reversed-mother.png`)});
      await go('/mylife/family/member/9');await page.waitForSelector('#relationship-member-search:not(:disabled)');
      assert.ok(await page.$eval('.family-profile__main',el=>el.textContent.includes('Quan hệ chưa xác minh')));
      await choose(11);await calculate();
      assert.equal((await answer()).label,'Chưa rõ quan hệ');assert.equal(await page.$('.family-explorer__path'),null);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.screenshot({path:path.join(dir,`${theme}-${width}-unknown.png`)});
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      results.push({width,height,theme,forward:'daughter',reversed:'mother',unknown:'neutral'});await page.close();
    }
    fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));console.log('PASS: 8 relationship direction/unknown UI cases with isolated server answers.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(redact(error.message));process.exitCode=1;});
