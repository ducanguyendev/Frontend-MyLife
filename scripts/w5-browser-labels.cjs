const fs=require('node:fs');
for(const lang of ['vi','en']){const p=`src/shared/locales/${lang}/admin.json`,d=JSON.parse(fs.readFileSync(p,'utf8'));d.export_png=lang==='en'?'Export PNG':'Xuất PNG';fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');}
const p='tests/family-w5.browser.cjs';let s=fs.readFileSync(p,'utf8');
s=s.replace("  const setField=",`  const selectField=async(label,option)=>{await page.evaluate(label=>{const labelEl=[...document.querySelectorAll('#familyForm label')].find(e=>e.textContent.includes(label));document.getElementById(labelEl?.htmlFor)?.click();},label);await page.waitForSelector('[role=option]');await page.evaluate(option=>[...document.querySelectorAll('[role=option]')].find(e=>e.textContent.includes(option))?.click(),option);};
  const setField=`);
s=s.replace("await setField('Role','Thành viên');", "await setField('Role','Thành viên');await selectField('Generation','1');await selectField('Life status','Living');");
fs.writeFileSync(p,s);
