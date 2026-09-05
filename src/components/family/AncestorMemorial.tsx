import React, { useState } from 'react';
import { Calendar, MapPin, Bell, Plus, Edit3, Trash2, X, Save } from 'lucide-react';

interface MemorialEvent {
  id: string;
  ancestorName: string;
  lunarDate: string;
  solarEstimate: string;
  location: string;
  note?: string;
}

const initialMemorials: MemorialEvent[] = [
  { id: '1', ancestorName: 'Cụ Tổ Nguyễn Văn Đạo', lunarDate: '15/08 Âm lịch', solarEstimate: '2026-09-26', location: 'Nhà thờ họ Nam Định', note: 'Cỗ lớn, con cháu tề tựu đông đủ' },
  { id: '2', ancestorName: 'Cụ Bà Trần Thị Mai', lunarDate: '02/11 Âm lịch', solarEstimate: '2026-12-11', location: 'Nhà thờ họ Nam Định', note: 'Giỗ phụ' },
];

export const AncestorMemorial: React.FC = () => {
  const [memorials, setMemorials] = useState<MemorialEvent[]>(initialMemorials);
  
  // Trạng thái modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ancestorName: '',
    lunarDate: '',
    solarEstimate: new Date().toISOString().split('T')[0],
    location: 'Nhà thờ họ',
    note: ''
  });

  const handleOpenModal = (memorial?: MemorialEvent) => {
    if (memorial) {
      setEditingId(memorial.id);
      setForm({
        ancestorName: memorial.ancestorName,
        lunarDate: memorial.lunarDate,
        solarEstimate: memorial.solarEstimate,
        location: memorial.location,
        note: memorial.note || ''
      });
    } else {
      setEditingId(null);
      setForm({
        ancestorName: '',
        lunarDate: '',
        solarEstimate: new Date().toISOString().split('T')[0],
        location: 'Nhà thờ họ',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ancestorName || !form.lunarDate) return;

    if (editingId) {
      setMemorials(prev => prev.map(m => m.id === editingId ? {
        ...m,
        ancestorName: form.ancestorName,
        lunarDate: form.lunarDate,
        solarEstimate: form.solarEstimate,
        location: form.location,
        note: form.note
      } : m));
    } else {
      const newEvent: MemorialEvent = {
        id: Date.now().toString(),
        ancestorName: form.ancestorName,
        lunarDate: form.lunarDate,
        solarEstimate: form.solarEstimate,
        location: form.location,
        note: form.note
      };
      setMemorials(prev => [...prev, newEvent]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngày giỗ này?')) {
      setMemorials(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Widget Cảnh báo */}
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-accent">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 text-accent rounded-2xl">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-base">Sắp tới ngày giỗ quan trọng!</h3>
            <p className="text-xs text-gray-400 mt-0.5">Hệ thống thông báo trước 3 ngày để con cháu chuẩn bị tươm tắp.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Giỗ Cụ Tổ Nguyễn Văn Đạo (Còn 3 ngày)
          </span>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" /> Thêm ngày giỗ
          </button>
        </div>
      </div>

      {/* Danh sách ngày giỗ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {memorials.map((m) => (
          <div key={m.id} className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-4 relative group">
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
              <button 
                onClick={() => handleOpenModal(m)}
                className="p-1.5 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer"
                title="Chỉnh sửa"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(m.id)}
                className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pr-16">
              <span className="font-bold text-lg text-primary-text">{m.ancestorName}</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent">{m.lunarDate}</span>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span>Dương lịch dự kiến: <strong>{m.solarEstimate}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Địa điểm: {m.location}</span>
              </div>
              {m.note && (
                <p className="text-gray-400 italic pt-1">Ghi chú: "{m.note}"</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL THÊM / SỬA NGÀY GIỖ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? 'Chỉnh Sửa Ngày Giỗ' : 'Thêm Ngày Giỗ Âm Lịch'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tên chân linh / Tổ tiên</label>
                <input 
                  type="text" 
                  value={form.ancestorName} 
                  onChange={(e) => setForm({ ...form, ancestorName: e.target.value })} 
                  required 
                  placeholder="Ví dụ: Cụ ông Nguyễn Văn A" 
                  className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ngày Âm Lịch</label>
                  <input 
                    type="text" 
                    value={form.lunarDate} 
                    onChange={(e) => setForm({ ...form, lunarDate: e.target.value })} 
                    required 
                    placeholder="Ví dụ: 15/08 Âm lịch" 
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Dương lịch quy đổi</label>
                  <input 
                    type="date" 
                    value={form.solarEstimate} 
                    onChange={(e) => setForm({ ...form, solarEstimate: e.target.value })} 
                    required 
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Địa điểm cúng giỗ</label>
                <input 
                  type="text" 
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })} 
                  required 
                  placeholder="Ví dụ: Nhà thờ họ Nam Định" 
                  className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ghi chú (Mâm cỗ, phân công)</label>
                <input 
                  type="text" 
                  value={form.note} 
                  onChange={(e) => setForm({ ...form, note: e.target.value })} 
                  placeholder="Ví dụ: Con trưởng chuẩn bị cỗ" 
                  className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-lg shadow-accent/20 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Lưu Ngày Giỗ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};