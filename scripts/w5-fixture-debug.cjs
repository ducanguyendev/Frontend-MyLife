const fs=require('node:fs'),p='tests/family-w5.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("await page.evaluate(()=>[...document.querySelectorAll('.family-gallery-card')].find(e=>e.textContent.includes('Nguyen Sua'))?.querySelector('[aria-haspopup=menu]')?.click());", "console.log('Edited payload',writes.find(w=>w.method==='PUT')?.payload.fullName);console.log('Cards',await page.$$eval('.family-gallery-card h2',els=>els.map(e=>e.textContent)));await page.click('.family-gallery-card[data-member-id=\"99\"] [aria-haspopup=menu]');");
fs.writeFileSync(p,s);
