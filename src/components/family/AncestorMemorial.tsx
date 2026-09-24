import React, { useState } from 'react';
import { Calendar, MapPin, Plus, Edit3, Trash2, X, Save, Search, LayoutGrid, List as ListIcon, ArrowUpDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Solar } from 'lunar-javascript';

interface MemorialEvent {
  id: string;
  ancestorName: string;
  lunarDate: string;
  solarEstimate: string; // YYYY-MM-DD
  location: string;
  note?: string;
}

const initialMemorials: MemorialEvent[] = [
  { id: '1', ancestorName: 'Cụ Tổ Nguyễn Văn Đạo', lunarDate: '15/08 Âm lịch', solarEstimate: '2026-09-10', location: 'Nhà thờ họ Nam Định', note: 'Cỗ lớn, con cháu tề tựu đông đủ' },
  { id: '2', ancestorName: 'Cụ Bà Trần Thị Mai', lunarDate: '02/11 Âm lịch', solarEstimate: '2026-12-11', location: 'Nhà thờ họ Nam Định', note: 'Giỗ phụ' },
  { id: '3', ancestorName: 'Cụ Ông Nguyễn Văn Hùng', lunarDate: '10/03 Âm lịch', solarEstimate: '2026-04-26', location: 'Nhà thờ họ Hà Nội', note: 'Cúng giỗ họ nội' }
];

interface LunarDatePickerProps {
  value: string;
  onChange: (solarDateStr: string, lunarDateStr: string) => void;
}

const LunarDatePicker: React.FC<LunarDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const initialDate = parseLocalDate(value);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const getDaysInMonth = (year: number, month: number) => {
    const days = [];
    const date = new Date(year, month, 1);
    
    let startDayOfWeek = date.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(currentYear, currentMonth);
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const solar = Solar.fromYmd(year, month, day);
    const lunar = solar.getLunar();
    
    const solarStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const lunarStr = `${lunar.getDay()}/${lunar.getMonth()} Âm lịch`;

    onChange(solarStr, lunarStr);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text flex items-center justify-between cursor-pointer hover:border-accent transition"
      >
        <span>{value ? `${value}` : 'Chọn ngày...'}</span>
        <CalendarIcon className="w-4 h-4 text-accent" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-secondary-bg border border-white/15 rounded-3xl p-4 shadow-2xl w-80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-primary-text">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-300 transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 uppercase mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} />;

              const y = date.getFullYear();
              const m = date.getMonth() + 1;
              const d = date.getDate();

              const solar = Solar.fromYmd(y, m, d);
              const lunar = solar.getLunar();
              
              const dateString = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = value === dateString;

              return (
                <button
                  type="button"
                  key={dateString}
                  onClick={() => handleSelectDate(date)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition cursor-pointer h-12 ${
                    isSelected 
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30' 
                      : 'bg-primary-bg/50 border-white/5 hover:border-accent/50 text-primary-text'
                  }`}
                >
                  <span className="text-xs font-bold">{d}</span>
                  <span className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-accent'}`}>
                    {lunar.getDay()}/${lunar.getMonth()}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const AncestorMemorial: React.FC = () => {
  const [memorials, setMemorials] = useState<MemorialEvent[]>(initialMemorials);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [sortBy, setSortBy] = useState<'nearest' | 'name-asc'>('nearest');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ancestorName: '',
    lunarDate: '',
    solarEstimate: new Date().toISOString().split('T')[0],
    location: 'Nhà thờ họ',
    note: ''
  });

  // Hàm kiểm tra xem ngày giỗ có sắp tới trong vòng 3 ngày không (hoặc đã đến/qua hôm nay một chút)
  const checkIfUpcoming = (solarDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(solarDateStr);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Sắp tới trong khoảng từ hôm nay đến 3 ngày sau
    return diffDays >= 0 && diffDays <= 3;
  };

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
      const today = new Date();
      const solarStr = today.toISOString().split('T')[0];
      const solarObj = Solar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
      const lunarObj = solarObj.getLunar();
      const defaultLunar = `${lunarObj.getDay()}/${lunarObj.getMonth()} Âm lịch`;

      setForm({
        ancestorName: '',
        lunarDate: defaultLunar,
        solarEstimate: solarStr,
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

  const filteredMemorials = memorials.filter(m => {
    const matchesSearch = m.ancestorName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.lunarDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.note && m.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || m.location.includes(locationFilter);
    return matchesSearch && matchesLocation;
  });

  const sortedMemorials = [...filteredMemorials].sort((a, b) => {
    if (sortBy === 'nearest') {
      return new Date(a.solarEstimate).getTime() - new Date(b.solarEstimate).getTime();
    } else {
      return a.ancestorName.localeCompare(b.ancestorName);
    }
  });

  const uniqueLocations = Array.from(new Set(memorials.map(m => m.location)));

  return (
    <div className="space-y-6">
      {/* Thanh công cụ tìm kiếm, lọc và chuyển đổi view */}
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên, ngày..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shadow-lg shadow-accent/20"
          >
            <Plus className="w-4 h-4" /> Thêm ngày giỗ
          </button>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition cursor-pointer"
          >
            <option value="all">Tất cả địa điểm</option>
            {uniqueLocations.map((loc, idx) => (
              <option key={idx} value={loc}>{loc}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-primary-bg border border-white/10 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-4 h-4 text-accent shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm text-primary-text focus:outline-none transition cursor-pointer"
            >
              <option value="nearest" className="bg-secondary-bg">Dương lịch gần nhất</option>
              <option value="name-asc" className="bg-secondary-bg">Tên chân linh (A - Z)</option>
            </select>
          </div>

          <div className="flex items-center bg-primary-bg border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'card' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
              title="Dạng Thẻ (Card)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition cursor-pointer ${viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}
              title="Dạng Bảng (List Table)"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMemorials.map((m) => {
            const isUpcoming = checkIfUpcoming(m.solarEstimate);
            return (
              <div 
                key={m.id} 
                className={`bg-secondary-bg border rounded-2xl p-6 space-y-4 relative group transition ${
                  isUpcoming 
                    ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10 ring-1 ring-accent/40' 
                    : 'border-white/10 hover:border-accent/50'
                }`}
              >
                {/* Huy hiệu nổi bật nếu sắp tới ngày giỗ */}
                {isUpcoming && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent border border-accent/30 animate-pulse">
                    <Clock className="w-3 h-3" /> Sắp tới
                  </div>
                )}

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

                <div className={`pr-16 ${isUpcoming ? 'pt-5' : ''}`}>
                  <span className="font-bold text-lg text-primary-text">{m.ancestorName}</span>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>Ngày Âm lịch: <strong className="text-accent">{m.lunarDate}</strong></span>
                  </div>
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
            );
          })}
        </div>
      ) : (
        <div className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-primary-bg/60 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Chân linh / Tổ tiên</th>
                  <th className="py-4 px-6">Ngày Âm Lịch</th>
                  <th className="py-4 px-6">Dương lịch quy đổi</th>
                  <th className="py-4 px-6">Địa điểm</th>
                  <th className="py-4 px-6">Ghi chú</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {sortedMemorials.map((m) => {
                  const isUpcoming = checkIfUpcoming(m.solarEstimate);
                  return (
                    <tr 
                      key={m.id} 
                      className={`transition ${isUpcoming ? 'bg-accent/5 ring-1 ring-inset ring-accent/30' : 'hover:bg-white/[0.02]'}`}
                    >
                      <td className="py-4 px-6 font-bold text-primary-text flex items-center gap-2">
                        {m.ancestorName}
                        {isUpcoming && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">
                            Sắp tới
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent">
                          {m.lunarDate}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300 flex items-center gap-1.5 pt-5">
                        <Calendar className="w-3.5 h-3.5 text-accent" /> {m.solarEstimate}
                      </td>
                      <td className="py-4 px-6 text-gray-300">{m.location}</td>
                      <td className="py-4 px-6 text-xs text-gray-400 italic">{m.note || '—'}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedMemorials.length === 0 && (
        <div className="text-center py-16 bg-secondary-bg border border-white/10 rounded-2xl">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold">Không tìm thấy ngày giỗ phù hợp</h3>
          <p className="text-gray-400 text-sm mt-1">Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc địa điểm.</p>
        </div>
      )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Chọn Ngày (Lịch Grid)</label>
                  <LunarDatePicker 
                    value={form.solarEstimate}
                    onChange={(solarStr, lunarStr) => {
                      setForm(prev => ({
                        ...prev,
                        solarEstimate: solarStr,
                        lunarDate: lunarStr
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ngày Âm Lịch (Tự nhảy)</label>
                  <input 
                    type="text" 
                    value={form.lunarDate} 
                    onChange={(e) => setForm({ ...form, lunarDate: e.target.value })} 
                    required 
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-accent font-semibold focus:outline-none bg-accent/5" 
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