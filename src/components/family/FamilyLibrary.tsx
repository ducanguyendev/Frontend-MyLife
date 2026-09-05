import React, { useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';

interface ArchiveItem {
  id: string;
  title: string;
  category: 'Sắc phong' | 'Ảnh từ đường' | 'Gia huấn' | 'Tư liệu cổ';
  imageUrl: string;
  description: string;
  year: string;
}

const initialArchives: ArchiveItem[] = [
  { id: '1', title: 'Sắc phong triều Nguyễn', category: 'Sắc phong', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400', description: 'Sắc phong thời vua Duy Tân công nhận dòng họ có người đậu đạt làm quan.', year: '1910' },
  { id: '2', title: 'Nhà thờ họ Nguyễn tại Nam Định', category: 'Ảnh từ đường', imageUrl: 'https://images.unsplash.com/photo-1599809275671-b5942eabc7a2?auto=format&fit=crop&q=80&w=400', description: 'Từ đường dòng họ sau đợt trùng tu lớn năm 2018.', year: '2018' },
];

export const FamilyLibrary: React.FC = () => {
  const [archives] = useState<ArchiveItem[]>(initialArchives);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Thư Viện & Tư Liệu Lịch Sử Dòng Họ</h3>
          <p className="text-xs text-gray-400 mt-0.5">Lưu giữ sắc phong triều đình, hình ảnh nhà thờ tổ và gia huấn đời trước.</p>
        </div>
        <button 
          onClick={() => alert('Mở modal upload ảnh/tư liệu mới')}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" /> Thêm tư liệu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archives.map((item) => (
          <div key={item.id} className="bg-secondary-bg border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-6 space-y-2 flex-grow flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-accent border border-white/10">
                  {item.category} ({item.year})
                </span>
                <h4 className="font-bold text-base mt-2">{item.title}</h4>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};