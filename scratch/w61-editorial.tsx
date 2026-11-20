import {createRoot} from 'react-dom/client';
import '../src/index.css';
import '../src/features/admin/components/family-tree/FamilyExperience.css';
import '../src/features/my-life/components/memories/Memories.css';
import {normalizeDisplayText} from '../src/shared/utils/normalizeDisplayText';
const names=['Nguyễn Huỳnh Quốc Bảo','Nguyễn Hoàng Yến','Nguyễn Thị Hồng Nhung','Sự kiện sắp tới'];
const supported='Family Archive · AV To · Nguyên Hoàng Huỳnh Ỳ · 0123456789';
const chars=[...new Set(names.join(''))].filter(c=>c!==' ');
const nativeFaces=`@font-face{font-family:NativeGeorgia;src:local('Georgia');font-weight:400}@font-face{font-family:NativeGeorgia;src:local('Georgia Bold');font-weight:700}@font-face{font-family:NativeGeorgia;src:local('Georgia Italic');font-weight:400;font-style:italic}@font-face{font-family:NativeGeorgia;src:local('Georgia Bold Italic');font-weight:700;font-style:italic}`;
function Fixture(){return <main style={{padding:24,color:'var(--text-primary)',background:'var(--bg-app)'}}>
<style>{nativeFaces+`.editorial-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}.editorial-sample{font:400 24px/1.4 Georgia,'Times New Roman',serif;margin:0 0 12px}.native-probe{font-size:24px;font-family:NativeGeorgia;white-space:nowrap}.composite-probe{font-size:24px;font-family:Georgia;white-space:nowrap}.probes{position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}.glyph{display:inline-block;font:400 24px/1.4 Georgia}.sample-label{font:12px/1.4 var(--font-sans);color:var(--text-secondary)}`}</style>
<div className="editorial-grid">
{names.map((raw,i)=><section key={i}><p className="sample-label">Approved editorial face · NFC display</p><article className={i===0?'family-gallery-card':i===1?'timeline-event':i===2?'anniversary-event__summary':'memory-upcoming__header'}>{i===0||i===3?<h2 data-editorial-title data-raw-value={raw.normalize('NFD')}>{normalizeDisplayText(raw.normalize('NFD'))}</h2>:<h3 data-editorial-title data-raw-value={raw.normalize('NFD')}>{normalizeDisplayText(raw.normalize('NFD'))}</h3>}</article></section>)}
{(['normal','italic'] as const).flatMap(style=>[400,500,600,700].flatMap(weight=>['NFC','NFD'].map(form=><section key={style+weight+form}><p className="sample-label">{style} · {weight} · {form} input → NFC display</p>{names.map((name,i)=>{const raw=name.normalize(form);return <p key={i} data-sample data-raw-value={raw} className="editorial-sample" style={{fontWeight:weight,fontStyle:style}}>{normalizeDisplayText(raw)}</p>})}</section>)))}
</div>
<div className="probes" aria-hidden="true">{(['normal','italic'] as const).flatMap(style=>[400,500,600,700].map(weight=><div key={style+weight}><span id={'composite-'+style+weight} className="composite-probe" style={{fontWeight:weight,fontStyle:style}}>{supported}</span><span id={'native-'+style+weight} className="native-probe" style={{fontWeight:weight,fontStyle:style}}>{supported}</span></div>))}{chars.map((c,i)=><span key={i} id={'glyph-'+i} data-code={c.codePointAt(0)} className="glyph">{c}</span>)}</div>
</main>};createRoot(document.getElementById('root')!).render(<Fixture/>);
