const fs=require('node:fs'),p='tests/family-w5.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("await page.click('button[aria-label=\"Full profile\"]');", "await page.$eval('button[aria-label=\"Full profile\"]',e=>e.click());");
s=s.replace("  await page.click('button[title=\"Cards\"]');await page.click('.family-gallery-card__identity');",`  // Medium families retain expandable branches and focus history.
  members=Array.from({length:16},(_,i)=>person(i+1,'Member '+String.fromCharCode(65+i),i+1,{fatherId:i?i:undefined,childIds:i<15?[i+2]:[]}));
  await goto();await page.waitForSelector('.family-person-card');await page.$eval('.family-person-card__action-trigger',e=>e.click());await textClick('View this branch','[role=menuitem]');await page.waitForSelector('.family-person-card__expand');
  const beforeExpand=await page.$$eval('.family-person-card',els=>els.length);await page.click('.family-person-card__expand');await page.waitForFunction(count=>document.querySelectorAll('.family-person-card').length>count,{},beforeExpand);await page.click('.family-person-card__expand[aria-expanded=true]');await page.waitForFunction(count=>document.querySelectorAll('.family-person-card').length===count,{},beforeExpand);
  await page.$$eval('.family-person-card__action-trigger',els=>els[1].click());await textClick('View this branch','[role=menuitem]');await page.waitForSelector('.family-tree-view__back');await page.click('.family-tree-view__back');await page.screenshot({path:path.join(artifacts,'restored-branch.png')});
  members=structuredClone(initial);await goto();await page.waitForSelector('.family-person-card');
  await page.click('button[title="Cards"]');await page.click('.family-gallery-card__identity');`);
// Avoid replacement-string dollar escaping in the two collection helpers above.
s=s.replace('const beforeExpand=await page.$eval', 'const beforeExpand=await page.'+String.fromCharCode(36,36)+'eval').replace("await page.$eval('.family-person-card__action-trigger',els=>els[1].click())","await page."+String.fromCharCode(36,36)+"eval('.family-person-card__action-trigger',els=>els[1].click())");
s=s.replace(" let members=structuredClone(initial),mode='normal';", " let members=structuredClone(initial),mode='normal',debugPage;");
s=s.replace('const page=await browser.newPage();','const page=await browser.newPage();debugPage=page;');
s=s.replace("console.error('Browser errors',errors);throw e;", "console.error('Browser errors',errors);if(debugPage){console.error(debugPage.url(),await debugPage.evaluate(()=>document.body.innerText.slice(-1800)));await debugPage.screenshot({path:path.join(artifacts,'interaction-failure.png')});}throw e;");
fs.writeFileSync(p,s);
