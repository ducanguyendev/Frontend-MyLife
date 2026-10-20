
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => { errors.push(err.toString()); });
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto('http://localhost:7000/FamilyTree');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // click button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.innerText.includes('Thêm Thành Viên'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log('Errors:', JSON.stringify(errors));
  await browser.close();
})();

