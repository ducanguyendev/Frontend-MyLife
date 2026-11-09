const fs=require('node:fs');
const p='tests/memories-w6.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("const clickText=async(text,scope='button')=>{assert.ok(","const clickText=async(text,scope='button')=>{await page.waitForFunction(({text,scope})=>[...document.querySelectorAll(scope)].some(e=>e.textContent.trim().toLowerCase()===text.toLowerCase()&&!e.disabled),{timeout:10000},{text,scope});assert.ok(");
fs.writeFileSync(p,s);
