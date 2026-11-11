const fs=require('node:fs'),p='tests/family-w5.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("await page.click('button[aria-label=\"Zoom out\"]');assert.ok((await matrix()).a<initialScale);", "await page.click('button[aria-label=\"Zoom out\"]');await page.waitForFunction(a=>new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene')).transform).a<a,{},initialScale);");
s=s.replace("report.push({name,...m});", "report.push({name,...m});fs.writeFileSync(path.join(artifacts,'visual-results.json'),JSON.stringify(report,null,2));");
s=s.replace("await page.click('button[aria-label=\"Zoom in\"]');", "const zoomedOut=(await matrix()).a;await page.click('button[aria-label=\"Zoom in\"]');await page.waitForFunction(a=>new DOMMatrix(getComputedStyle(document.querySelector('.family-tree-view__scene')).transform).a>a,{},zoomedOut);");
fs.writeFileSync(p,s);
