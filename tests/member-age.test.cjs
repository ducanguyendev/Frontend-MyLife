const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{spawnSync}=require('node:child_process');
const source=fs.readFileSync('src/shared/utils/memberAge.ts','utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const age={};vm.runInNewContext(output,{exports:age,Date});
test('completed years change on the birthday, not January 1',()=>{
 for(const[birth,day,expected]of[['2000-11-04','2026-11-03',25],['2000-11-04','2026-11-04',26],['2000-11-04','2026-11-05',26],['1984-12-20','2026-11-03',41],['1984-12-20','2026-12-20',42],['2026-11-03','2026-11-03',0]])assert.equal(age.calculateAgeAtDate(birth,day),expected);
});
test('age at death respects a birthday before, after, and on the death date',()=>{
 assert.equal(age.getAgeAtDeath('1935-12-20','2011-04-10'),75);
 assert.equal(age.getAgeAtDeath('1935-12-20','2011-12-25'),76);
 assert.equal(age.getAgeAtDeath('1935-12-20','2011-12-20'),76);
 const display=age.getMemberAgeDisplay({dateOfBirth:'1935-12-20',deathDate:'2011-04-10',lifeStatus:'DECEASED'},'2026-11-03');
 assert.equal(display.ageAtDeath,75);assert.equal(display.currentEquivalentAge,90);
});
test('February 29 follows completed month/day years: March 1 in a non-leap year',()=>{
 assert.equal(age.getCurrentAge('2000-02-29','2025-02-28'),24);
 assert.equal(age.getCurrentAge('2000-02-29','2025-03-01'),25);
 assert.equal(age.getCurrentAge('2000-02-29','2024-02-28'),23);
 assert.equal(age.getCurrentAge('2000-02-29','2024-02-29'),24);
 assert.equal(age.getCurrentAge('1900-02-29','2026-11-03'),null);
 assert.equal(age.getCurrentAge('2000-02-29','2026-11-03'),26);
});
test('missing, malformed and impossible dates do not invent ages',()=>{
 for(const invalid of[undefined,null,'','garbage','1935','1935-12','2000-02-30','2026-04-31','2026-00-10','0000-01-01','2000-13-01','2000-01-00','2000-01-01nonsense','2000-01-01T99:00:00'])assert.equal(age.getCurrentAge(invalid,'2026-11-03'),null,String(invalid));
 assert.equal(age.getCurrentAge('2000-01-01','invalid'),null);
 assert.equal(age.getCurrentAge('2000-01-01',new Date('invalid')),null);
 assert.equal(age.getCurrentAge('2027-01-01','2026-11-03'),null);
 assert.equal(age.getAgeAtDeath('1935-12-20',undefined),null);
 assert.equal(age.getAgeAtDeath('1935-12-20','1930-01-01'),null);
});
test('legacy deceased records retain only ages that can be derived safely',()=>{
 for(const deathDate of[undefined,null,'bad','1930-01-01','2027-01-01']){
  const display=age.getMemberAgeDisplay({dateOfBirth:'1935-12-20',deathDate,lifeStatus:'DECEASED'},'2026-11-03');
  assert.equal(display.ageAtDeath,null);assert.equal(display.currentEquivalentAge,90);
 }
 const missing=age.getMemberAgeDisplay({deathDate:'2011-04-10',lifeStatus:'DECEASED'},'2026-11-03');assert.equal(missing.ageAtDeath,null);assert.equal(missing.currentEquivalentAge,null);
 const living=age.getMemberAgeDisplay({lifeStatus:'LIVING'},'2026-11-03');assert.equal(living.currentAge,null);
});
test('ISO API date-time suffixes never shift the represented birth/death date',()=>{
 for(const suffix of['','T00:00:00','T00:00:00.0000000','T00:00:00Z','T00:00:00+14:00','T23:59:59-12:00'])assert.equal(age.getCurrentAge('2000-11-04'+suffix,'2026-11-03'),25);
 assert.equal(age.getAgeAtDeath('1935-12-20T00:00:00Z','2011-04-10T00:00:00+07:00'),75);
});
test('Date references use the local calendar day in positive and negative UTC offsets',()=>{
 const script=`const vm=require('node:vm'),exports={};vm.runInNewContext(${JSON.stringify(output)},{exports,Date});process.stdout.write(JSON.stringify(exports.getCurrentAge('2000-11-03T00:00:00+07:00',new Date('2026-11-03T00:30:00Z'))));`;
 for(const[zone,expected]of[['Asia/Ho_Chi_Minh',26],['America/Los_Angeles',25],['UTC',26]]){const result=spawnSync(process.execPath,['-e',script],{encoding:'utf8',env:{...process.env,TZ:zone}});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout),expected,zone);}
});
test('derived ages recalculate without mutating or persisting member data',()=>{
 const member=Object.freeze({id:12,fullName:'Nguyễn An',dateOfBirth:'2000-11-04',lifeStatus:'LIVING',deathDate:null,generation:2});const before=JSON.stringify(member);
 assert.equal(age.getMemberAgeDisplay(member,'2026-11-03').currentAge,25);
 assert.equal(age.getMemberAgeDisplay(member,'2026-11-04').currentAge,26);
 assert.equal(JSON.stringify(member),before);assert.equal('age' in member,false);
 assert.equal(age.getMemberAgeDisplay({dateOfBirth:'2000-11-04'},'2026-11-03').kind,'living');
});
