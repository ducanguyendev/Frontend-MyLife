import React, { useState } from "react";
import { BookOpen, Plus, Eye } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button } from "@/shared/components/ui";
import { type LibraryPhoto } from "./types";
import { PhotoLightboxModal } from "./PhotoLightboxModal";

const libraryPhotos: LibraryPhoto[] = [
  {
    id: "lib-1",
    title: "Nhà thờ tổ Họ Nguyễn (Tiên Điền)",
    category: "temple",
    year: "Khởi dựng 1820",
    url: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop",
    desc: "Toàn cảnh khuôn viên Từ đường tiền nhân, nơi phụng thờ các bậc tiền bối và sinh hoạt gia tộc.",
    author: "Ban liên lạc dòng họ Nguyễn",
  },
  {
    id: "lib-2",
    title: "Sắc phong Triều Nguyễn niên hiệu Tự Đức",
    category: "decrees",
    year: "Năm 1858",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop",
    desc: "Bản sao chiếu sắc phong công đức danh nhân tiền bối đỗ đạt cử nhân và phụng sự triều đình.",
    author: "Lưu trữ tại Viện Hán Nôm",
  },
  {
    id: "lib-3",
    title: "Họp mặt Đại gia đình Xuân Giáp Thìn",
    category: "events",
    year: "Tháng 02/2024",
    url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
    desc: "Con cháu nội ngoại 4 thế hệ sum vầy chúc thọ các cụ cao niên và trao học bổng khuyến học.",
    author: "Nguyễn Văn Dũng chụp",
  },
  {
    id: "lib-4",
    title: "Khu Lăng mộ Tổ tiền nhân tại Hà Tĩnh",
    category: "temple",
    year: "Trùng tu 2018",
    url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=800&auto=format&fit=crop",
    desc: "Phần mộ tổ phụ được con cháu các chi phái đóng góp tôn tạo khang trang, tôn nghiêm.",
    author: "Hội đồng gia tộc",
  },
  {
    id: "lib-5",
    title: "Ảnh tư liệu cụ Trưởng chi Nguyễn Văn Minh",
    category: "photos",
    year: "Năm 1945",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
    desc: "Chân dung cụ cố chụp trong thời kỳ kháng chiến cứu quốc, người có công mở rộng sản nghiệp gia đình.",
    author: "Tư liệu gia đình chi 1",
  },
  {
    id: "lib-6",
    title: "Trao quỹ khuyến học cho con cháu thủ khoa",
    category: "events",
    year: "Mùa thu 2025",
    url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    desc: "Vinh danh 12 cháu đạt giải quốc gia và đỗ các trường đại học top đầu trong năm học vừa qua.",
    author: "Ban Khuyến học dòng họ",
  },
];

interface LibraryTabProps {
  onUploadDoc: () => void;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({ onUploadDoc }) => {
  const { t } = useLanguage();
  const [libraryCategory, setLibraryCategory] = useState<string>("all");
  const [previewPhoto, setPreviewPhoto] = useState<LibraryPhoto | null>(null);

  const categories = [
    { id: "all", label: t("admin.all_categories", { defaultValue: "Tất cả tư liệu" }) },
    { id: "photos", label: t("admin.cat_photos", { defaultValue: "Ảnh tư liệu cổ" }) },
    { id: "decrees", label: t("admin.cat_decrees", { defaultValue: "Sắc phong & Gia phả" }) },
    { id: "events", label: t("admin.cat_events", { defaultValue: "Họp mặt dòng họ" }) },
    { id: "temple", label: t("admin.cat_temple", { defaultValue: "Từ đường & Lăng mộ" }) },
  ];

  const filteredPhotos = libraryPhotos.filter(
    (photo) => libraryCategory === "all" || photo.category === libraryCategory
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 custom-scrollbar space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary-bg border border-custom-border p-6 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-primary-text mb-1 flex items-center gap-2">
            <BookOpen className="text-accent" size={20} />
            {t("admin.library_title", { defaultValue: "Thư Viện & Kỷ Vật Dòng Tộc" })}
          </h3>
          <p className="text-secondary-text text-sm">
            {t("admin.library_desc", { defaultValue: "Nơi lưu giữ gia phả cổ, sắc phong, văn tự và tư liệu lịch sử dòng họ." })}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={onUploadDoc}
        >
          {t("admin.upload_doc", { defaultValue: "Tải lên tư liệu" })}
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setLibraryCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer shrink-0 ${
              libraryCategory === cat.id
                ? "bg-accent text-primary-bg border-accent shadow-sm"
                : "bg-secondary-bg border-custom-border text-secondary-text hover:text-primary-text hover:bg-primary-bg"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setPreviewPhoto(photo)}
            className="bg-secondary-bg border border-custom-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-accent/40 transition-all duration-300 flex flex-col group cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden bg-black/10">
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-medium flex items-center gap-1.5">
                  <Eye size={14} /> Nhấn để phóng to
                </span>
              </div>
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[10px] border border-white/10">
                {photo.year}
              </span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-primary-text text-base group-hover:text-accent transition-colors line-clamp-1 mb-1.5">
                  {photo.title}
                </h4>
                <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                  {photo.desc}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-custom-border/60 flex items-center justify-between text-[11px] text-secondary-text">
                <span className="truncate max-w-[180px]">{photo.author}</span>
                <span className="text-accent font-semibold flex items-center gap-1">
                  <Eye size={13} /> {t("admin.view_detail", { defaultValue: "Xem ảnh" })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </div>
  );
};
