import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldX, 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Building2, 
  Gem, 
  Tag, 
  MapPin,
  Clock,
  Key,
  Coins,
  History
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  category: 'Bất động sản' | 'Phương tiện' | 'Vàng bạc & Tích trữ' | 'Đồ gia truyền & Tâm linh' | 'Thiết bị điện tử' | 'Tài sản khác';
  ownerType: 'personal' | 'family';
  value: number;
  goldAmount?: number;
  legalDocLocation?: string;
  purchaseDate: string;
  warrantyEndDate?: string;
  maintenanceCostYearly?: number;
  location: string;
  note: string;
}

const initialAssets: Asset[] = [
  { 
    id: '1', 
    name: 'Nhà từ đường & Đất thổ cư', 
    category: 'Bất động sản', 
    ownerType: 'family', 
    value: 4500000000, 
    legalDocLocation: 'Két sắt tầng 2 (Sổ hồng gốc)', 
    purchaseDate: '2015-05-10', 
    maintenanceCostYearly: 12000000,
    location: 'Nam Định', 
    note: 'Tài sản thờ cúng chung của dòng họ' 
  },
  { 
    id: '2', 
    name: 'Vàng nhẫn tròn trơn 9999 (Tích trữ)', 
    category: 'Vàng bạc & Tích trữ', 
    ownerType: 'personal', 
    value: 175000000, 
    goldAmount: 20, 
    legalDocLocation: 'Két sắt phòng ngủ chính', 
    purchaseDate: '2024-06-15', 
    location: 'Két sắt gia đình', 
    note: 'Mua tích trữ chống lạm phát' 
  },
  { 
    id: '3', 
    name: 'Xe ô tô Honda Civic', 
    category: 'Phương tiện', 
    ownerType: 'personal', 
    value: 750000000, 
    legalDocLocation: 'Hộp đựng giấy tờ xe', 
    purchaseDate: '2024-03-15', 
    warrantyEndDate: '2027-03-15', 
    maintenanceCostYearly: 15000000,
    location: 'Hầm chung cư', 
    note: 'Bảo hiểm thân vỏ và đăng kiểm định kỳ' 
  },
];

export const AssetTracker: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'personal' | 'family'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Bất động sản' as Asset['category'],
    ownerType: 'personal' as 'personal' | 'family',
    value: '',
    goldAmount: '',
    legalDocLocation: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyEndDate: '',
    maintenanceCostYearly: '',
    location: '',
    note: ''
  });

  const totalAssetValue = assets.reduce((sum, a) => sum + a.value, 0);
  const personalAssetValue = assets.filter(a => a.ownerType === 'personal').reduce((sum, a) => sum + a.value, 0);
  const familyAssetValue = assets.filter(a => a.ownerType === 'family').reduce((sum, a) => sum + a.value, 0);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchOwner = ownerFilter === 'all' || a.ownerType === ownerFilter;
      const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
      return matchSearch && matchOwner && matchCat;
    });
  }, [assets, searchTerm, ownerFilter, categoryFilter]);

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingId(asset.id);
      setForm({
        name: asset.name,
        category: asset.category,
        ownerType: asset.ownerType,
        value: asset.value.toString(),
        goldAmount: asset.goldAmount ? asset.goldAmount.toString() : '',
        legalDocLocation: asset.legalDocLocation || '',
        purchaseDate: asset.purchaseDate,
        warrantyEndDate: asset.warrantyEndDate || '',
        maintenanceCostYearly: asset.maintenanceCostYearly ? asset.maintenanceCostYearly.toString() : '',
        location: asset.location,
        note: asset.note
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        category: 'Bất động sản',
        ownerType: 'personal',
        value: '',
        goldAmount: '',
        legalDocLocation: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyEndDate: '',
        maintenanceCostYearly: '',
        location: '',
        note: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.value) return;

    const assetData = {
      name: form.name,
      category: form.category,
      ownerType: form.ownerType,
      value: Number(form.value),
      goldAmount: form.category === 'Vàng bạc & Tích trữ' && form.goldAmount ? Number(form.goldAmount) : undefined,
      legalDocLocation: ['Bất động sản', 'Phương tiện', 'Vàng bạc & Tích trữ'].includes(form.category) ? form.legalDocLocation : undefined,
      purchaseDate: form.purchaseDate,
      warrantyEndDate: ['Phương tiện', 'Thiết bị điện tử', 'Tài sản khác'].includes(form.category) ? form.warrantyEndDate : undefined,
      maintenanceCostYearly: ['Bất động sản', 'Phương tiện'].includes(form.category) && form.maintenanceCostYearly ? Number(form.maintenanceCostYearly) : undefined,
      location: form.location,
      note: form.note
    };

    if (editingId) {
      setAssets(prev => prev.map(a => a.id === editingId ? { ...a, ...assetData } : a));
    } else {
      const newAsset: Asset = {
        id: Date.now().toString(),
        ...assetData
      };
      setAssets(prev => [newAsset, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa tài sản này khỏi danh sách quản lý?')) {
      setAssets(prev => prev.filter(a => a.id !== id));
    }
  };

  const getWarrantyStatus = (endDate?: string) => {
    if (!endDate) return null;
    const today = new Date().toISOString().split('T')[0];
    if (endDate >= today) {
      return { label: `Còn bảo hành (Đến ${endDate})`, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: ShieldCheck };
    } else {
      return { label: `Hết hạn bảo hành (${endDate})`, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: ShieldX };
    }
  };

  return (
    <div className="min-h-screen bg-primary-bg text-primary-text pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <ShieldCheck className="w-6 h-6" />
              <span className="font-semibold uppercase tracking-wider text-sm">Quản Lý Tài Sản & Tích Lũy Gia Tộc</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Danh Sách Tài Sản & Kỷ Vật</h1>
            <p className="text-gray-400 mt-1">Quản lý tài sản cá nhân, gia đình, vàng tích trữ, giấy tờ nhà đất và lịch bảo hành.</p>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-5 py-2.5 rounded-xl font-medium transition shadow-lg shadow-accent/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Tài Sản Mới</span>
          </button>
        </div>

        {/* Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng Giá Trị Tài Sản</p>
              <h3 className="text-2xl font-bold text-accent mt-1">{totalAssetValue.toLocaleString()} đ</h3>
            </div>
            <div className="p-3 bg-accent/10 text-accent rounded-2xl"><Gem className="w-6 h-6" /></div>
          </div>
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tài Sản Cá Nhân</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{personalAssetValue.toLocaleString()} đ</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl"><Tag className="w-6 h-6" /></div>
          </div>
          <div className="bg-secondary-bg border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tài Sản Gia Đình / Dòng Họ</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{familyAssetValue.toLocaleString()} đ</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl"><Building2 className="w-6 h-6" /></div>
          </div>
        </div>

        {/* Thanh tìm kiếm & lọc */}
        <div className="bg-secondary-bg border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm tài sản, vị trí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-primary-bg border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'personal' | 'family')}
              className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition cursor-pointer"
            >
              <option value="all">Tất cả quyền sở hữu</option>
              <option value="personal">Cá nhân</option>
              <option value="family">Gia đình</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent transition cursor-pointer"
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Bất động sản">Bất động sản</option>
              <option value="Phương tiện">Phương tiện</option>
              <option value="Vàng bạc & Tích trữ">Vàng bạc & Tích trữ</option>
              <option value="Đồ gia truyền & Tâm linh">Đồ gia truyền & Tâm linh</option>
              <option value="Thiết bị điện tử">Thiết bị điện tử</option>
              <option value="Tài sản khác">Tài sản khác</option>
            </select>
          </div>
        </div>

        {/* Lưới hiển thị tài sản */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const warranty = getWarrantyStatus(asset.warrantyEndDate);
            const WarrantyIcon = warranty?.icon || Clock;

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden hover:border-accent/50 transition flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                        asset.ownerType === 'family' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {asset.ownerType === 'family' ? 'Tài sản gia đình / Dòng họ' : 'Tài sản cá nhân'}
                      </span>
                      <h3 className="text-lg font-bold">{asset.name}</h3>
                      <p className="text-xs text-gray-400 font-medium">{asset.category}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenModal(asset)} className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer" title="Chỉnh sửa"><Edit3 className="w-4 h-4 text-blue-400" /></button>
                      <button onClick={() => handleDelete(asset.id)} className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5 hover:bg-red-500/10 transition cursor-pointer" title="Xóa"><Trash2 className="w-4 h-4 text-red-400" /></button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-300 bg-primary-bg/50 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Giá trị định giá:</span>
                      <strong className="text-accent text-sm">{asset.value.toLocaleString()} đ</strong>
                    </div>

                    {asset.goldAmount !== undefined && (
                      <div className="flex items-center gap-2 text-amber-400 font-semibold">
                        <Coins className="w-3.5 h-3.5 shrink-0" />
                        <span>Khối lượng: {asset.goldAmount} chỉ vàng</span>
                      </div>
                    )}

                    {asset.legalDocLocation && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Key className="w-3.5 h-3.5 shrink-0" />
                        <span>Vị trí giấy tờ: {asset.legalDocLocation}</span>
                      </div>
                    )}

                    {asset.maintenanceCostYearly !== undefined && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <History className="w-3.5 h-3.5 shrink-0" />
                        <span>Chi phí nuôi/năm: {asset.maintenanceCostYearly.toLocaleString()} đ</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Vị trí: {asset.location}</span>
                    </div>
                  </div>

                  {warranty && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${warranty.color}`}>
                      <WarrantyIcon className="w-4 h-4 shrink-0" />
                      <span>{warranty.label}</span>
                    </div>
                  )}

                  {asset.note && (
                    <p className="text-xs text-gray-400 italic">Ghi chú: "{asset.note}"</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* --- MODAL THÊM / SỬA TÀI SẢN VỚI INPUT ĐỘNG --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-secondary-bg border border-white/10 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-secondary-bg/95 backdrop-blur-md z-10">
                <h2 className="text-xl font-bold">{editingId ? 'Chỉnh Sửa Tài Sản' : 'Thêm Tài Sản & Kỷ Vật Mới'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Tên tài sản / Kỷ vật / Giấy tờ</label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="Ví dụ: Sổ đỏ nhà từ đường, Vàng nhẫn 9999..."
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Danh mục</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Asset['category'] })}
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    >
                      <option value="Bất động sản">Bất động sản</option>
                      <option value="Phương tiện">Phương tiện</option>
                      <option value="Vàng bạc & Tích trữ">Vàng bạc & Tích trữ</option>
                      <option value="Đồ gia truyền & Tâm linh">Đồ gia truyền & Tâm linh</option>
                      <option value="Thiết bị điện tử">Thiết bị điện tử</option>
                      <option value="Tài sản khác">Tài sản khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Quyền sở hữu</label>
                    <select
                      value={form.ownerType}
                      onChange={(e) => setForm({ ...form, ownerType: e.target.value as 'personal' | 'family' })}
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    >
                      <option value="personal">Cá nhân</option>
                      <option value="family">Gia đình / Dòng họ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Giá trị định giá (đ)</label>
                    <input 
                      type="number" 
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      required
                      placeholder="50000000"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ngày mua / Nhận</label>
                    <input 
                      type="date" 
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                      required
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* --- INPUT ĐỘNG: Chỉ hiện khi chọn "Vàng bạc & Tích trữ" --- */}
                {form.category === 'Vàng bạc & Tích trữ' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-amber-400 uppercase">Khối lượng vàng (Đơn vị: Chỉ)</label>
                    <input 
                      type="number" 
                      value={form.goldAmount}
                      onChange={(e) => setForm({ ...form, goldAmount: e.target.value })}
                      placeholder="Ví dụ: 10 (chỉ)"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                {/* --- INPUT ĐỘNG: Hiện khi có giấy tờ pháp lý (Bất động sản, Phương tiện, Vàng) --- */}
                {['Bất động sản', 'Phương tiện', 'Vàng bạc & Tích trữ'].includes(form.category) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase">Vị trí cất giữ giấy tờ gốc (Sổ đỏ, đăng ký xe, két sắt...)</label>
                    <input 
                      type="text" 
                      value={form.legalDocLocation}
                      onChange={(e) => setForm({ ...form, legalDocLocation: e.target.value })}
                      placeholder="Ví dụ: Két sắt phòng ngủ chính"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                {/* --- INPUT ĐỘNG: Hiện khi có bảo hành (Phương tiện, Thiết bị điện tử) --- */}
                {['Phương tiện', 'Thiết bị điện tử', 'Tài sản khác'].includes(form.category) && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-blue-400 uppercase">Hết hạn bảo hành</label>
                    <input 
                      type="date" 
                      value={form.warrantyEndDate}
                      onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })}
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                {/* --- INPUT ĐỘNG: Hiện chi phí nuôi/bảo dưỡng (Bất động sản, Phương tiện) --- */}
                {['Bất động sản', 'Phương tiện'].includes(form.category) && (
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-purple-400 uppercase">Chi phí nuôi / bảo dưỡng định kỳ hàng năm (đ)</label>
                    <input 
                      type="number" 
                      value={form.maintenanceCostYearly}
                      onChange={(e) => setForm({ ...form, maintenanceCostYearly: e.target.value })}
                      placeholder="Ví dụ: 12000000"
                      className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Vị trí đặt tài sản thực tế</label>
                  <input 
                    type="text" 
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ví dụ: Nhà thờ họ Nam Định"
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Ghi chú (Nguồn gốc gia truyền, lưu ý...)</label>
                  <input 
                    type="text" 
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Ví dụ: Đồ do ông cha để lại..."
                    className="w-full bg-primary-bg border border-white/10 rounded-xl px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-sm font-medium rounded-xl transition cursor-pointer">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-accent/20">
                    <Save className="w-4 h-4" />
                    <span>Lưu Tài Sản</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};