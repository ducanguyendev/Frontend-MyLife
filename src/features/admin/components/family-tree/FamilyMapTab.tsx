import React from "react";
import { Compass, Globe } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button } from "@/shared/components/ui";

interface FamilyMapTabProps {
  onShowMapDetail: () => void;
}

export const FamilyMapTab: React.FC<FamilyMapTabProps> = ({ onShowMapDetail }) => {
  const { t } = useLanguage();

  const regions = [
    {
      region: "Khu Vực Miền Bắc",
      count: "142 Thành viên (Chi 1 & Chi 2)",
      percent: "58%",
      color: "bg-accent",
      hubs: "Hà Nội, Hà Tĩnh, Nghệ An, Hải Phòng",
      contact: "Trưởng ban LL Miền Bắc: 0912.888.999",
    },
    {
      region: "Khu Vực Miền Nam",
      count: "68 Thành viên (Chi 3)",
      percent: "28%",
      color: "bg-blue-500",
      hubs: "TP. Hồ Chí Minh, Bình Dương, Đồng Nai",
      contact: "Trưởng ban LL Miền Nam: 0983.777.666",
    },
    {
      region: "Khu Vực Miền Trung & Tây Nguyên",
      count: "24 Thành viên",
      percent: "10%",
      color: "bg-amber-500",
      hubs: "Đà Nẵng, Huế, Đắk Lắk",
      contact: "Trưởng ban LL Miền Trung: 0905.333.222",
    },
    {
      region: "Kiều Bào Hải Ngoại",
      count: "11 Thành viên",
      percent: "4%",
      color: "bg-emerald-500",
      hubs: "Hoa Kỳ, CHLB Đức, Úc, Nhật Bản",
      contact: "Đại diện hải ngoại: contact@family.org",
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 custom-scrollbar space-y-6">
      {/* Header Banner */}
      <div className="bg-secondary-bg border border-custom-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-primary-text mb-1 flex items-center gap-2">
            <Globe className="text-accent" size={20} />
            {t("admin.map_title", { defaultValue: "Bản Đồ Phân Bố Hậu Duệ & Chi Tộc" })}
          </h3>
          <p className="text-secondary-text text-sm">
            {t("admin.map_desc", { defaultValue: "Thống kê mật độ con cháu định cư và hoạt động trên khắp các tỉnh thành & quốc tế." })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-secondary-text">Tổng Hậu Duệ Ghi Nhận</p>
            <p className="text-xl font-bold text-accent">245 Thành Viên</p>
          </div>
        </div>
      </div>

      {/* Regional Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {regions.map((reg) => (
          <div
            key={reg.region}
            className="bg-secondary-bg border border-custom-border rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-secondary-text mb-2">
                <span>{reg.percent}</span>
                <span className="text-primary-text font-semibold">{reg.count}</span>
              </div>
              <div className="w-full h-2 bg-primary-bg rounded-full overflow-hidden mb-3">
                <div className={`h-full ${reg.color} rounded-full`} style={{ width: reg.percent }} />
              </div>
              <h4 className="font-bold text-primary-text text-sm">{reg.region}</h4>
              <p className="text-xs text-secondary-text mt-1">
                Đô thị tiêu biểu: <strong className="text-primary-text">{reg.hubs}</strong>
              </p>
            </div>
            <div className="text-[11px] text-accent font-medium border-t border-custom-border/50 pt-2">
              {reg.contact}
            </div>
          </div>
        ))}
      </div>

      {/* Center Radar Card */}
      <div className="bg-secondary-bg border border-custom-border rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-3">
          <h4 className="text-lg font-bold text-primary-text flex items-center gap-2">
            <Compass className="text-accent" size={20} />
            Trung Tâm Quy Tụ & Kết Nối Gia Tộc
          </h4>
          <p className="text-sm text-secondary-text leading-relaxed">
            Hàng năm vào dịp lễ hội Giỗ Tổ ngày 15/05 Âm lịch, con cháu các chi phái từ khắp ba miền Bắc - Trung - Nam và kiều bào hải ngoại đều hành hương về Nhà thờ tổ Tiên Điền (Hà Tĩnh) để thắp hương tri ấn, họp họ và phát động phong trào khuyến học khuyến tài.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-primary-bg border border-custom-border font-medium text-secondary-text">
              📍 Tọa độ gốc: 18.665° Bắc, 105.789° Đông
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 font-medium text-accent">
              ✨ Nhà thờ tổ xếp hạng Di tích Lịch sử
            </span>
          </div>
        </div>

        <div className="w-full lg:w-96 bg-primary-bg p-5 rounded-xl border border-custom-border text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Globe size={32} />
          </div>
          <h5 className="font-bold text-primary-text text-sm">Mạng Lưới Chi Tộc Trực Tuyến</h5>
          <p className="text-xs text-secondary-text mt-1 mb-4">
            Dữ liệu định vị và liên lạc của các thành viên được bảo mật và cập nhật bởi Ban liên lạc dòng họ.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onShowMapDetail}
            className="w-full"
          >
            Xem chi tiết danh bạ chi nhánh
          </Button>
        </div>
      </div>
    </div>
  );
};
