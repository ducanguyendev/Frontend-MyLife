const fs=require('node:fs');
const view='src/features/admin/components/family-tree/family-view/FamilyTreeView.tsx';let s=fs.readFileSync(view,'utf8');
const token='toolbarLabel("admin.mindmap_fullscreen", "Toàn màn hình")';s=s.replaceAll(token,'isFullscreen ? t("family.exitFullscreen") : '+token);fs.writeFileSync(view,s);
const p='tests/family-w5.browser.cjs';s=fs.readFileSync(p,'utf8');
s=s.replace("else if(p.includes('timeline'))", "else if(p==='/api/family-tree/map')body=env({totalMembers:members.length,locatedMembers:0,unlocatedMembers:members.length,pendingGeocodingMembers:0,noAddressMembers:members.length,failedGeocodingMembers:0,locations:[],members});\n   else if(p.includes('timeline'))");
s=s.replace("await page.click('button[aria-label=\"Fullscreen\"]');await page.waitForFunction(()=>!document.fullscreenElement);", "await page.click('button[aria-label=\"Exit fullscreen\"]');await page.waitForFunction(()=>!document.fullscreenElement);");
s=s.replace("await page.setViewport({width:1440,height:900});await goto();",`await page.setViewport({width:1440,height:900});
  for(const route of ['/mylife','/familytree','/timeline','/anniversaries','/library','/map']){await goto(route);await page.waitForFunction(()=>document.querySelectorAll('.app-nav__link.is-active').length===1);assert.equal(await page.$('.app-shell__breadcrumb'),null);if(['/timeline','/anniversaries','/library'].includes(route))assert.equal(await page.$eval('.app-nav__link.is-active',e=>e.textContent.trim()),'Memories');}
  await page.click('button[aria-label="Open account menu"]');await page.waitForSelector('[data-user-menu]');await textClick('About MyLife','[data-user-menu] button');await page.waitForFunction(()=>location.pathname==='/');
  await goto();`);
fs.writeFileSync(p,s);
