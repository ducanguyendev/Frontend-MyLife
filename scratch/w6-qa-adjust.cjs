const fs=require('node:fs'),p='tests/memories-w6.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("t('admin.anniversary_ui.solar_date')","t('admin.anniversary_ui.event_date')");
s=s.replace("await field(t('admin.anniversary_ui.title'),'A new family gathering');", "await field(t('admin.anniversary_ui.title'),'A new family gathering');await select(t('admin.anniversary_ui.related_member'),members[2].fullName);await field(t('admin.anniversary_ui.place'),'Our family home');await field(t('admin.anniversary_ui.host'),'Family host');await field(t('admin.anniversary_ui.notes'),'A gathering to remember.');");
s=s.replace("await page.click('button[title=\"Cards\"]');assert.ok(", "await page.click('button[title=\"Cards\"]');await page.waitForSelector('.family-gallery-card');assert.equal(await page.evaluate(()=>document.querySelectorAll('.family-gallery-card').length),members.length);assert.ok(");
fs.writeFileSync(p,s);
