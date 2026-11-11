import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../src/index.css';
import '../src/shared/i18n';
import {Input,Textarea,Select,SelectItem,DateInput,PasswordInput} from '../src/shared/components/ui';
import {FamilyRelationSelect} from '../src/features/admin/components/family-tree/FamilyRelationSelect';
import {FamilyMemberPicker} from '../src/features/admin/components/family-tree/FamilyMemberPicker';
import {Search} from 'lucide-react';
const options=[{id:12,fullName:'Nguyễn Huỳnh Quốc Bảo'.normalize('NFD'),generation:1},{id:18,fullName:'Nguyễn Hoàng Yến',generation:2},{id:25,fullName:'Nguyễn Thị Hồng Nhung',generation:3}];
function Fixture(){const [relation,setRelation]=useState<number>();const [date,setDate]=useState('');const [selected,setSelected]=useState<number>();return <main style={{padding:20,maxWidth:920,margin:'0 auto',color:'var(--text-primary)'}}>
<h1>Sự kiện sắp tới</h1><form style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:16}} onSubmit={e=>e.preventDefault()}>
<Input id="empty" label="Họ và tên *" required placeholder="Nguyễn Văn An"/>
<Input id="filled" label="Họ và tên đã nhập" defaultValue="Nguyễn Huỳnh Quốc Bảo"/>
<Input id="leading" label="Tìm thành viên" leftIcon={<Search/>}/>
<PasswordInput id="password" label="Mật khẩu"/>
<Select id="generation" label="Thế hệ" options={[{value:'1',label:'Đời 1'},{value:'2',label:'Đời 2'}]}/>
<DateInput id="date" label="Ngày sinh" value={date} onValueChange={setDate}/>
<Textarea id="notes" label="Tiểu sử" placeholder="Câu chuyện gia đình" rows={3}/>
<Input id="error" label="Họ và tên lỗi" error="Vui lòng nhập họ và tên." required/>
<Input id="disabled" label="Không khả dụng" value="Nguyễn Hoàng Yến" disabled/>
<Input id="readonly" label="Chỉ đọc" value="Nguyễn Thị Hồng Nhung" readOnly/>
<FamilyRelationSelect value={relation} options={options} placeholder="Chọn cha" label="Cha" generationLabel="Đời" onChange={setRelation}/>
<FamilyMemberPicker options={options} placeholder="Chọn con cái" generationLabel="Đời" onSelect={setSelected}/>
<Select id="compact" variant="compact" aria-label="Vai trò" value="viewer"><SelectItem value="viewer">Người xem</SelectItem><SelectItem value="editor">Biên tập viên</SelectItem></Select>
<output id="selection">{JSON.stringify({relation,selected,date})}</output>
</form><p id="nfd">{'Nguyễn Huỳnh Quốc Bảo · Nguyễn Hoàng Yến · Nguyễn Thị Hồng Nhung'.normalize('NFD')}</p>
</main>};createRoot(document.getElementById('root')!).render(<Fixture/>);
