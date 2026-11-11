const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const {setupPage,outputDirectory,redact}=require('./helpers/stabilization-browser.cjs');
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),results=[];
  try{
    for(const width of[1440,390])for(const theme of['light','dark']){
      const{page,state,go}=await setupPage(browser,'http://127.0.0.1:7004',{width,height:900,theme});
      let release;state.mapResponseGate=new Promise(resolve=>{release=resolve;});state.mapApiFailure=true;
      await go('/map');await page.waitForSelector('.family-map-workspace [role=status]');
      assert.equal(await page.$('.family-distribution-map'),null);
      release();await page.waitForSelector('.family-map-workspace [role=alert]');
      await page.screenshot({path:path.join(outputDirectory('map-states'),`${theme}-${width}-api-error.png`)});
      state.mapApiFailure=false;state.members=[];
      await page.click('.family-map-workspace [role=alert] button');
      await page.waitForFunction(()=>document.querySelector('.family-map-summary')&&!document.querySelector('.family-map-workspace [role=alert]'));
      assert.equal(await page.$('.family-distribution-map'),null,'empty family does not mount an unnecessary provider');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.screenshot({path:path.join(outputDirectory('map-states'),`${theme}-${width}-empty.png`)});
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      results.push({width,theme,loading:'pass',apiError:'pass',retry:'pass',empty:'pass'});await page.close();
    }
    fs.writeFileSync(path.join(outputDirectory('map-states'),'results.json'),JSON.stringify(results,null,2));console.log('PASS: 4 loading, API error, retry and empty-family browser cases.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(redact(error.stack));process.exitCode=1;});
