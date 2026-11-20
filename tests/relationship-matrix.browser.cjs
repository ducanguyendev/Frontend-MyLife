const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('../scratch_puppeteer/node_modules/puppeteer');
const{members,setupPage,outputDirectory,redact}=require('./helpers/stabilization-browser.cjs');
// Canonical server answers deliberately keep their original endpoint order
// when the UI requests the reverse, exercising reverseRelationshipCode/path.
const cases=[
  {from:1,to:3,code:'daughter',reverse:'mother',labels:['Con gái','Mẹ'],ids:[1,3],edges:[null,'CHILD'],display:[[1,3],[1,3]],displayEdges:[['Con'],['Con']]},
  {from:1,to:9,code:'grandson',reverse:'grandmother',labels:['Cháu trai','Bà'],ids:[1,3,9],edges:[null,'CHILD','CHILD'],display:[[1,3,9],[1,3,9]],displayEdges:[['Con','Con'],['Con','Con']]},
  {from:9,to:10,code:'sibling',reverse:'sibling',labels:['Anh/chị/em','Anh/chị/em'],ids:[9,3,10],edges:[null,'PARENT','CHILD'],display:[[9,3,10],[10,3,9]],displayEdges:[['Cha/mẹ','Con'],['Cha/mẹ','Con']]},
  {from:9,to:11,code:'cousin',reverse:'cousin',labels:['Anh/chị/em họ','Anh/chị/em họ'],ids:[9,3,1,4,11],edges:[null,'PARENT','PARENT','CHILD','CHILD'],display:[[9,3,1,4,11],[11,4,1,3,9]],displayEdges:[['Cha/mẹ','Cha/mẹ','Con','Con'],['Cha/mẹ','Cha/mẹ','Con','Con']]},
  {from:1,to:2,code:'husband',reverse:'wife',labels:['Chồng','Vợ'],ids:[1,2],edges:[null,'SPOUSE'],display:[[1,2],[2,1]],displayEdges:[['Vợ/chồng'],['Vợ/chồng']]},
  {from:9,to:14,code:'unknown',reverse:'unknown',labels:['Chưa rõ quan hệ','Chưa rõ quan hệ'],ids:[],edges:[],display:[[],[]],displayEdges:[[],[]]},
];
async function main(){
  const browser=await puppeteer.launch({headless:true,pipe:true,timeout:20000}),results=[];
  try{
    for(const[width,height]of[[1440,900],[1920,1080],[390,844]])for(const theme of['light','dark']){
      console.log('Relationship matrix',width,theme);
      const{page,state,go}=await setupPage(browser,'http://127.0.0.1:7004',{width,height,theme});
      // The profile's unrelated map is outside this relationship-only test.
      // Keep external provider loading out of this matrix (Map has its own real-network test).
      state.providerFailure=true;
      let checked=0;
      for(const item of cases)for(const direction of[0,1]){
        const reference=direction?item.to:item.from,target=direction?item.from:item.to;
        const name=id=>members.find(member=>member.id===id).fullName;
        state.relationshipAnswer=(from,to)=>{assert.deepEqual([from,to],[reference,target]);return{fromMemberId:item.from,toMemberId:item.to,relationshipCode:item.code,reverseRelationshipCode:item.reverse,relationshipLabel:item.labels[0],reverseRelationshipLabel:item.labels[1],distance:Math.max(0,item.ids.length-1),path:item.ids.map((id,index)=>({memberId:id,fullName:name(id),edge:item.edges[index]}))};};
        await go('/mylife/family/member/'+reference);await page.waitForSelector('#relationship-member-search:not(:disabled)');
        assert.equal(await page.$eval('#relationship-reference-member',el=>el.value),name(reference));
        await page.click('#relationship-member-search');await page.waitForSelector('#relationship-member-option-'+target);await page.click('#relationship-member-option-'+target);
        await page.click('.family-explorer > button');await page.waitForSelector('.family-explorer__answer');
        assert.deepEqual(await page.$$eval('.family-explorer__answer strong',els=>els.map(el=>el.textContent)),[name(target),name(reference)]);
        assert.equal(await page.$eval('.family-explorer__answer b',el=>el.textContent),item.labels[direction]);
        assert.deepEqual(await page.$$eval('.family-explorer__step',els=>els.map(el=>el.lastChild.textContent)),item.display[direction].map(name));
        assert.deepEqual(await page.$$eval('.family-explorer__edge small',els=>els.map(el=>el.textContent)),item.displayEdges[direction]);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        if(item.code==='unknown')assert.equal(await page.$('.family-explorer__path'),null);
        checked++;
      }
      assert.deepEqual(state.errors,[]);assert.deepEqual(state.writes,[]);
      results.push({width,theme,queries:checked,categories:['parent-child','grandparent-grandchild','sibling','cousin','spouse','unknown'],apiOrder:'canonical in both request directions',errors:state.errors});
      fs.writeFileSync(path.join(outputDirectory('relationship-matrix'),'results.json'),JSON.stringify(results,null,2));await page.close();
    }
    console.log('PASS:',results.reduce((sum,item)=>sum+item.queries,0),'relationship queries across',results.length,'viewport/theme cases.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(redact(error.stack));process.exitCode=1;});
