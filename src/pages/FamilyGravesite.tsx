import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Calendar, Wrench, X, Save, Compass, Search, Filter, Edit3, Trash2, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GraveSite {
  id: string;
  ancestorName: string;
  generation: string;
  lotNumber: string;
  address: string;
  lat: number;
  lng: number;
  lastMaintenanceDate: string;
  status: 'Tốt' | 'Cần tu sửa' | 'Đã tôn tạo';
  note: string;
}

const initialGraves: GraveSite[] = [
  {
    id: '1',
    ancestorName: 'Cụ Thủy Tổ Nguyễn Văn Đạo',
    generation: 'Đời thứ 1',
    lotNumber: 'Khu A - Lô 01',
    address: 'Nghĩa trang dòng họ Nguyễn, xã Hải Minh, huyện Hải Hậu, Nam Định',
    lat: 20.2185,
    lng: 106.2340,
    lastMaintenanceDate: '2025-04-05',
    status: 'Tốt',
    note: 'Xây bằng đá xanh nguyên khối, có bia ghi danh'
  },
  {
    id: '2',
    ancestorName: 'Cụ Bà Trần Thị Mai',
    generation: 'Đời thứ 1',
    lotNumber: 'Khu A - Lô 02',
    address: 'Nghĩa trang dòng họ Nguyễn, xã Hải Minh, huyện Hải Hậu, Nam Định',
    lat: 20.2187,
    lng: 106.2342,
    lastMaintenanceDate: '2025-04-05',
    status: 'Tốt',
    note: 'Nằm bên cạnh mộ Cụ Tổ'
  },
  {
    id: '3',
    ancestorName: 'Cụ Ông Nguyễn Văn Hùng',
    generation: 'Đời thứ 2',
    lotNumber: 'Khu B - Lô 05',
    address: 'Nghĩa trang nhân dân xã Yên Ninh, huyện Ý Yên, Nam Định',
    lat: 20.3500,
    lng: 106.0200,
    lastMaintenanceDate: '2024-11-12',
    status: 'Đã tôn tạo',
    note: 'Được con cháu đóng góp ốp đá hoa cương năm ngoái'
  },
  {
    id: '4',
    ancestorName: 'Cụ Bà Lê Thị Hoa',
    generation: 'Đời thứ 2',
    lotNumber: 'Khu B - Lô 06',
    address: 'Nghĩa trang nhân dân xã Yên Ninh, huyện Ý Yên, Nam Định',
    lat: 20.3502,
    lng: 106.0203,
    lastMaintenanceDate: '2024-11-12',
    status: 'Đã tôn tạo',
    note: 'Xây chung khuôn viên với Cụ Hùng'
  },
  {
    id: '5',
    ancestorName: 'Cụ Nguyễn Văn Minh',
    generation: 'Đời thứ 3',
    lotNumber: 'Khu C - Lô 12',
    address: 'Nghĩa trang Văn Điển, Thanh Trì, Hà Nội',
    lat: 20.9583,
    lng: 105.8412,
    lastMaintenanceDate: '2023-08-15',
    status: 'Cần tu sửa',
    note: 'Đá ốp quanh viền bắt đầu có dấu hiệu rêu phong, cần sơn sửa lại trước mùa mưa bão'
  }
];

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.flyTo(center, zoom, { duration: 1.5 });
  return null;
};

export const FamilyGravesite: React.FC = () => {
  const [graves, setGraves] = useState<GraveSite[]>(initialGraves);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [mapCenter, setMapCenter] = useState<[number, number]>([20.2185, 106.2340]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [activeGraveId, setActiveGraveId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSearchingGeo, setIsSearchingGeo] = useState(false);

  const [form, setForm] = useState({
    ancestorName: '',
    generation: 'Đời thứ ',
    lotNumber: '',
    address: '',
    lat: 20.2185,
    lng: 106.2340,
    lastMaintenanceDate: new Date().toISOString().split('T')[0],
    status: 'Tốt' as GraveSite['status'],
    note: ''
  });

  const handleFetchCoordinates = async () => {
    if (!form.address) {
      alert('Vui lòng nhập địa chỉ trước khi tìm tọa độ!');
      return;
    }

    setIsSearchingGeo(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.address)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const foundLat = parseFloat(data[0].lat);
        const foundLng = parseFloat(data[0].lon);
        setForm(prev => ({ ...prev, lat: foundLat, lng: foundLng }));
        alert(`Đã tìm thấy tọa độ thành công!\nVĩ độ: ${foundLat}\nKinh độ: ${foundLng}`);
      } else {
        alert('Không tìm thấy tọa độ cho địa chỉ này. Hãy thử nhập chi tiết hơn (Ví dụ: Thêm tên tỉnh/thành phố).');
      }
    } catch (error) {
      console.error('Lỗi khi lấy tọa độ:', error);
      alert('Đã xảy ra lỗi kết nối khi tìm tọa độ.');
    } finally {
      setIsSearchingGeo(false);
    }
  };

  const handleOpenModal = (grave?: GraveSite) => {
    if (grave) {
      setEditingId(grave.id);
      setForm({
        ancestorName: grave.ancestorName,
        generation: grave.generation,
        lotNumber: grave.lotNumber,
        address: grave.address,
        lat: grave.lat,
        lng: grave.lng,
        lastMaintenanceDate: grave.lastMaintenanceDate,
        status: grave.status,
        note: grave.note
      });
    } else {
      setEditingId(null);
      setForm({
        ancestorName: '',
        generation: 'Đời thứ ',
        lotNumber: '',
        address: '',
        lat: 20.2185,
        lng: 106.2340,
        lastMaintenanceDate: new Date().toISOString().split('T')[0],
        status: 'Tốt',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ancestorName || !form.address) return;

    const graveData = {
      ancestorName: form.ancestorName,
      generation: form.generation,
      lotNumber: form.lotNumber,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      lastMaintenanceDate: form.lastMaintenanceDate,
      status: form.status,
      note: form.note
    };

    if (editingId) {
      setGraves(prev => prev.map(g => g.id === editingId ? { ...g, ...graveData } : g));
    } else {
      const newGrave: GraveSite = {
        id: Date.now().toString(),
        ...graveData
      };
      setGraves(prev => [newGrave, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông tin mộ phần này?')) {
      setGraves(prev => prev.filter(g => g.id !== id));
    }
  };

  const handleSelectGrave = (grave: GraveSite) => {
    setMapCenter([grave.lat, grave.lng]);
    setMapZoom(17);
    setActiveGraveId(grave.id);
  };

  const filteredGraves = graves.filter(g => {
    const matchSearch = g.ancestorName.toLowerCase().includes(searchTerm.toLowerCase()) || g.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-secondary-bg border border-white/10 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 text-accent mb-1">
            <Compass className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-xs">Quy Hoạch Tâm Linh Gia Tộc</span>
          </div>
          <h2 className="text-xl font-bold">Bản Đồ Mộ Phần & Nghĩa Trang Dòng Họ</h2>
          <p className="text-xs text-gray-400 mt-0.5">Quản lý toàn bộ danh sách mộ phần rải rác ở nhiều nghĩa trang khác nhau.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" /> Thêm mộ phần mới
        </button>
      </div>

      {/* Bản đồ tương tác */}
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-300">Sơ đồ vị trí các nghĩa trang thực tế</h3>
        <div className="h-96 w-full rounded-2xl overflow-hidden border border-white/10 relative z-0">
          <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController center={mapCenter} zoom={mapZoom} />
            {graves.map((grave) => (
              <Marker key={grave.id} position={[grave.lat, grave.lng]}>
                <Popup>
                  <div className="text-primary-text space-y-1">
                    <strong className="text-sm font-bold text-accent">{grave.ancestorName}</strong>
                    <p className="text-xs text-gray-600">Địa chỉ: {grave.address}</p>
                    <p className="text-xs text-gray-500 italic">{grave.note}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Tìm kiếm & Lọc */}
      <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm theo tên tổ tiên, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-accent" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2 text-sm text-primary-text focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">Tất cả tình trạng</option>
            <option value="Tốt">Tốt</option>
            <option value="Cần tu sửa">Cần tu sửa</option>
            <option value="Đã tôn tạo">Đã tôn tạo</option>
          </select>
        </div>
      </div>

      {/* Danh sách mộ phần */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGraves.map(g => (
          <motion.div 
            key={g.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleSelectGrave(g)}
            className={`bg-secondary-bg border rounded-2xl p-6 space-y-4 relative group cursor-pointer transition ${
              activeGraveId === g.id ? 'border-accent shadow-lg shadow-accent/10 bg-accent/5' : 'border-white/10 hover:border-white/30'
            }`}
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => handleOpenModal(g)} className="p-1.5 text-gray-400 hover:text-blue-400 bg-white/5 rounded-lg transition cursor-pointer" title="Chỉnh sửa"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center justify-between pr-16">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-1 inline-block">{g.generation}</span>
                <h3 className="font-bold text-lg text-primary-text">{g.ancestorName}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                g.status === 'Tốt' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                g.status === 'Đã tôn tạo' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-400'
              }`}>{g.status}</span>
            </div>

            <div className="space-y-2 text-xs bg-primary-bg/50 p-4 rounded-xl border border-white/5">
              <div className="flex items-start gap-2 text-primary-text">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Địa chỉ: <strong>{g.address}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Wrench className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Tu sửa gần nhất: {g.lastMaintenanceDate}</span>
              </div>
            </div>

            {g.note && <p className="text-xs text-gray-400 italic">Ghi chú: "{g.note}"</p>}
          </motion.div>
        ))}
      </div>

      {/* Modal Thêm / Sửa Mộ Phần */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-secondary-bg border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-bold">{editingId ? 'Chỉnh Sửa Mộ Phần' : 'Thêm Mộ Phần Mới'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Tên chân linh / Tổ tiên</label>
                  <input type="text" value={form.ancestorName} onChange={e => setForm({...form, ancestorName: e.target.value})} required placeholder="Cụ ông..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Thế hệ</label>
                    <input type="text" value={form.generation} onChange={e => setForm({...form, generation: e.target.value})} placeholder="Đời thứ 1" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Số lô / Khu vực</label>
                    <input type="text" value={form.lotNumber} onChange={e => setForm({...form, lotNumber: e.target.value})} placeholder="Khu A" className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Địa chỉ cụ thể của nghĩa trang / mộ phần</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={form.address} 
                      onChange={e => setForm({...form, address: e.target.value})} 
                      required 
                      placeholder="Ví dụ: Xã Hải Minh, Huyện Hải Hậu, Nam Định" 
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" 
                    />
                    <button 
                      type="button" 
                      onClick={handleFetchCoordinates}
                      disabled={isSearchingGeo}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shrink-0 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Tự động tìm tọa độ GPS từ địa chỉ"
                    >
                      {isSearchingGeo ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      <span>Định vị</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 italic">Nhập địa chỉ rồi bấm "Định vị" để hệ thống tự động cập nhật tọa độ bản đồ.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Ngày tu sửa gần nhất</label>
                    <input type="date" value={form.lastMaintenanceDate} onChange={e => setForm({...form, lastMaintenanceDate: e.target.value})} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-400 mb-1 uppercase">Tình trạng</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value as GraveSite['status']})} className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent">
                      <option value="Tốt">Tốt</option>
                      <option value="Cần tu sửa">Cần tu sửa</option>
                      <option value="Đã tôn tạo">Đã tôn tạo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1 uppercase">Ghi chú kiến trúc / vật liệu</label>
                  <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Xây đá xanh..." className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent" />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 rounded-xl cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2 bg-accent text-white rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20"><Save className="w-4 h-4" /> Lưu mộ phần</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};