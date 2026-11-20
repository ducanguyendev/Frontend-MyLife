const fs=require('node:fs'),p='tests/family-w5.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("state==='slow'?'.family-loading':'.ds-feedback'", "state==='slow'?'.family-loading':state==='empty'?'.ds-empty':'.ds-feedback'");
// Capture the quick overview at both ends of the responsive range.
s=s.replace("await textClick('Add member');await page.waitForSelector('#familyForm');await metrics", "if(width===1440 || width===390){await page.click('button[title=\"Cards\"]');await page.click('.family-gallery-card__identity');await page.waitForSelector('.family-quick-detail');await metrics(theme+'-'+width+'-quick-detail');await page.screenshot({path:path.join(artifacts,theme+'-'+width+'-quick-detail.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('[role=dialog]'));}await textClick('Add member');await page.waitForSelector('#familyForm');await metrics");
fs.writeFileSync(p,s);
