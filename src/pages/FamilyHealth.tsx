import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, Bell, Calendar, User, AlertCircle, HeartPulse, Pill, X, Save, Edit3, Trash2, Search, Filter } from 'lucide-react';

interface HealthProfile {
  id: string;
  name: string;
  relation: string; // Ông, Bà, Bố, Mẹ, Con...
  bloodType: string;
  chronicConditions: string[]; // Bệnh mãn tính
  allergies: string[]; // Dị ứng
  nextAppointment?: string; // Lịch tái khám
  medicationReminder?: string; // Nhắc nhở uống thuốc
}

const initialHealthProfiles: HealthProfile[] = [
  {
    id: '1',
    name: 'Nguyễn Văn Đạo',
    relation: 'Ông nội',
    bloodType: 'A+',
    chronicConditions: ['Cao huyết áp', 'Xương khớp'],
    allergies: ['Penicillin'],
    nextAppointment: '2026-09-20',
    medicationReminder: 'Uống thuốc huyết áp lúc 08:00 sáng'
  },
  {
    id: '2',
    name: 'Lê Thị Hoa',
    relation: 'Bà nội',
    bloodType: 'O+',
    chronicConditions: ['Tiểu đường tuýp 2'],
    allergies: ['Hải sản'],
    nextAppointment: '2026-09-25',
    medicationReminder: 'Đo đường huyết và uống thuốc trước ăn'
  }
];

export const FamilyHealth: React.FC = () => {
  const [profiles, setProfiles] = useState<HealthProfile[]>(initialHealthProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationFilter, setRelationFilter] = useState('all');

  // Trạng thái Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    relation: '',
    bloodType: 'O+',
    chronicConditions: '',
    allergies: '',
    nextAppointment: '',
    medicationReminder: ''
  });

  const handleOpenModal = (profile?: HealthProfile) => {
    if (profile) {
      setEditingId(profile.id);
      setForm({
        name: profile.name,
        relation: profile.relation,
        bloodType: profile.bloodType,
        chronicConditions: profile.chronicConditions.join(', '),
        allergies: profile.allergies.join(', '),
        nextAppointment: profile.nextAppointment || '',
        medicationReminder: profile.medicationReminder || ''
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        relation: '',
        bloodType: 'O+',
        chronicConditions: '',
        allergies: '',
        nextAppointment: '',
        medicationReminder: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    const profileData = {
      name: form.name,
      relation: form.relation,
      bloodType: form.bloodType,
      chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      nextAppointment: form.nextAppointment,
      medicationReminder: form.medicationReminder
    };

    if (editingId) {
      setProfiles(prev => prev.map(p => p.id === editingId ? { ...p, ...profileData } : p));
    } else {
      const newProfile: HealthProfile = {
        id: Date.now().toString(),
        ...profileData
      };
      setProfiles(prev => [newProfile, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ y tế này?')) {
      setProfiles(prev => prev.filter(p => p.id !== id));
    }
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm và quan hệ
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.relation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRelation = relationFilter === 'all' || p.relation.toLowerCase() === relationFilter.toLowerCase();
      return matchSearch && matchRelation;
    });
  }, [profiles, searchTerm, relationFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Nút thêm */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-secondary-bg border border-white/10 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-accent mb-1">
            <HeartPulse className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Chăm Sóc Sức Khỏe Gia Tộc</span>
          </div>
          <h2 className="text-xl font-bold">Sổ Sức Khỏe & Lịch Khám Bệnh Định Kỳ</h2>
          <p className="text-xs text-gray-400 mt-0.5">Theo dõi hồ sơ y tế, bệnh sử mãn tính và lịch uống thuốc của các thành viên.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" /> Thêm hồ sơ y tế
        </button>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc (Filter) */}
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-accent" />
          <select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
            className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">Tất cả mối quan hệ</option>
            <option value="ông nội">Ông nội</option>
            <option value="bà nội">Bà nội</option>
            <option value="bố">Bố</option>
            <option value="mẹ">Mẹ</option>
          </select>
        </div>
      </div>

      {/* Danh sách thẻ hồ sơ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProfiles.map(p => (
          <motion.div 
            key={p.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-4 relative group"
          >
            {/* Nút Sửa / Xóa góc phải */}
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              <button onClick={() => handleOpenModal(p)} className="p-1.5 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer" title="Chỉnh sửa">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer" title="Xóa">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pr-16">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 text-accent rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-primary-text">{p.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">{p.relation}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 block">Nhóm máu</span>
                <span className="text-sm font-extrabold text-rose-400">{p.bloodType}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-primary-bg/50 p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400">Bệnh mãn tính: </span>
                  <span className="text-primary-text font-medium">{p.chronicConditions.join(', ') || 'Không có'}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-gray-400">Dị ứng thuốc/thực phẩm: </span>
                  <span className="text-primary-text font-medium">{p.allergies.join(', ') || 'Không có'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
              {p.medicationReminder && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Pill className="w-4 h-4 shrink-0" />
                  <span><strong>Nhắc nhở:</strong> {p.medicationReminder}</span>
                </div>
              )}
              {p.nextAppointment && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span><strong>Lịch tái khám:</strong> {p.nextAppointment}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12 bg-secondary-bg border border-white/10 rounded-2xl">
          <p className="text-sm text-gray-400">Không tìm thấy hồ sơ y tế nào phù hợp.</p>
        </div>
      )}

      {/* Modal Thêm / Sửa Hồ Sơ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold">{editingId ? 'Chỉnh Sửa Hồ Sơ Y Tế' : 'Thêm Hồ Sơ Sức Khỏe Mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Họ và tên</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="Nguyễn Văn A" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Quan hệ</label>
                    <input type="text" value={form.relation} onChange={e => setForm({...form, relation: e.target.value})} placeholder="Ông nội, Bố..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Nhóm máu</label>
                    <select value={form.bloodType} onChange={e => setForm({...form, bloodType: e.target.value})} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Bệnh mãn tính (cách nhau bởi dấu phẩy)</label>
                  <input type="text" value={form.chronicConditions} onChange={e => setForm({...form, chronicConditions: e.target.value})} placeholder="Cao huyết áp, tiểu đường..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Dị ứng (thuốc, thực phẩm...)</label>
                  <input type="text" value={form.allergies} onChange={e => setForm({...form, allergies: e.target.value})} placeholder="Penicillin, hải sản..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Lịch nhắc nhở uống thuốc</label>
                  <input type="text" value={form.medicationReminder} onChange={e => setForm({...form, medicationReminder: e.target.value})} placeholder="Uống thuốc lúc 8h sáng..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Ngày tái khám dự kiến</label>
                  <input type="date" value={form.nextAppointment} onChange={e => setForm({...form, nextAppointment: e.target.value})} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 rounded-xl cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-accent text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"><Save className="w-4 h-4" /> Lưu hồ sơ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};