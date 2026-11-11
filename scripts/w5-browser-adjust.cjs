const fs=require('node:fs'),p='tests/family-w5.browser.cjs';
let s=fs.readFileSync(p,'utf8');
s=s.replace("await page.mouse.wheel({deltaY:-100});assert.ok((await matrix()).a>old.a);", "await page.mouse.wheel({deltaY:-100});await page.waitForFunction(a=>new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene')).transform).a>a,{},old.a);");
// An optional narrow interaction pass keeps visual matrix reruns purposeful.
s=s.replace("for(const theme of ['light','dark'])for(const[width,height]of", "for(const theme of (process.env.MYLIFE_INTERACTIONS_ONLY ? [] : ['light','dark']))for(const[width,height]of");
fs.writeFileSync(p,s);
