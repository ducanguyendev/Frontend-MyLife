import React, { useState } from "react";
import { Search, MapPin, Users } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Card } from "@/shared/components/ui";
import { type AnniversaryItem } from "./types";

const defaultAnniversaries: AnniversaryItem[] = [
  {
    id: "anni-1",
    title: "Lễ Giỗ Cụ Tổ Khởi Thuỷ - Nguyễn Văn Cao",
    relation: "Thế hệ 1 • Trưởng tộc đời thứ nhất",
    lunarDate: "15 Tháng 05 (Âm lịch)",
    solarDate: "02/07/2026",
    daysLeft: "Còn 28 ngày",
    place: "Từ đường Nhà thờ tổ họ Nguyễn, Làng Tiên Điền, Hà Tĩnh",
    host: "Trưởng tộc: Nguyễn Văn Dũng (0912.888.999)",
    notes: "Nghi lễ tế thần, dâng hương, họp họ toàn quốc và tuyên dương con cháu đỗ đạt.",
    badgeColor: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  },
  {
    id: "anni-2",
    title: "Lễ Giỗ Cụ Bà Trần Thị Mai",
    relation: "Thế hệ 1 • Vợ Cụ Tổ",
    lunarDate: "20 Tháng 08 (Âm lịch)",
    solarDate: "30/09/2026",
    daysLeft: "Còn 118 ngày",
    place: "Từ đường Nhà thờ tổ họ Nguyễn, Tiên Điền, Hà Tĩnh",
    host: "Trưởng chi 1: Nguyễn Văn Minh",
    notes: "Họp mặt phụ nữ dòng tộc, phát thưởng khuyến học cho các cháu học sinh giỏi.",
    badgeColor: "text-rose-500 bg-rose-500/10 border-rose-500/20"
  },
  {
    id: "anni-3",
    title: "Lễ Giỗ Cụ Trưởng Chi - Nguyễn Văn Minh",
    relation: "Thế hệ 2 • Con trai trưởng Cụ Tổ",
    lunarDate: "01 Tháng 12 (Âm lịch)",
    solarDate: "08/01/2027",
    daysLeft: "Còn 215 ngày",
    place: "Nhà thờ chi họ Nguyễn - Ba Đình, Hà Nội",
    host: "Đích tôn: Nguyễn Văn Dũng",
    notes: "Cúng tế gia đình và gặp mặt các chi phái tại khu vực Miền Bắc.",
    badgeColor: "text-accent bg-accent/10 border-accent/20"
  },
  {
    id: "anni-4",
    title: "Lễ Tảo Mộ & Tri Ân Tiên Tổ (Tiết Thanh Minh)",
    relation: "Đại lễ toàn tộc họ Nguyễn",
    lunarDate: "Tiết Thanh Minh (Tháng 3 ÂL)",
    solarDate: "05/04/2027",
    daysLeft: "Còn 304 ngày",
    place: "Khu lăng mộ tổ tiên dòng tộc, Hà Tĩnh",
    host: "Hội đồng gia tộc họ Nguyễn",
    notes: "Đoàn kết con cháu các miền về thăm viếng, dâng hương và tu sửa phần mộ tiền nhân.",
    badgeColor: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
];

export const AnniversaryTab: React.FC = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = defaultAnniversaries.filter(
    (item) =>
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.place.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 custom-scrollbar space-y-6">
      {/* Top Banner & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary-bg border border-custom-border p-6 rounded-2xl shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-primary-text mb-1">
            {t("admin.anniversary_title", { defaultValue: "Lịch Giỗ Chạp & Kỷ Niệm Tiên Tổ" })}
          </h3>
          <p className="text-secondary-text text-sm">
            {t("admin.anniversary_desc", { defaultValue: "Lưu giữ và thông báo các ngày kỵ nhật, lễ giỗ theo âm lịch truyền thống." })}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
          <input
            type="text"
            placeholder={t("admin.search_anniversary", { defaultValue: "Tìm ngày giỗ, địa điểm..." })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-primary-bg rounded-xl border border-custom-border text-primary-text text-sm focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
            4
          </div>
          <div>
            <p className="text-xs text-secondary-text uppercase font-semibold">Đại Lễ Trong Năm</p>
            <p className="text-base font-bold text-primary-text">4 Sự Kiện Lớn</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
            15/5
          </div>
          <div>
            <p className="text-xs text-secondary-text uppercase font-semibold">Giỗ Gần Nhất</p>
            <p className="text-base font-bold text-primary-text">Giỗ Cụ Tổ (15/05 ÂL)</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
            100%
          </div>
          <div>
            <p className="text-xs text-secondary-text uppercase font-semibold">Đồng Bộ Âm Lịch</p>
            <p className="text-base font-bold text-primary-text">Tự động tính ngày Dương</p>
          </div>
        </Card>
      </div>

      {/* Anniversaries List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((anni) => (
          <div
            key={anni.id}
            className="bg-secondary-bg border border-custom-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${anni.badgeColor}`}>
                  {anni.daysLeft}
                </span>
                <h4 className="text-lg font-bold text-primary-text mt-2">{anni.title}</h4>
                <p className="text-xs text-secondary-text mt-0.5">{anni.relation}</p>
              </div>
              <div className="text-right shrink-0 bg-primary-bg px-3 py-2 rounded-xl border border-custom-border">
                <p className="text-xs font-semibold text-accent">{anni.lunarDate}</p>
                <p className="text-[11px] text-secondary-text mt-0.5">
                  {t("admin.solar_day", { defaultValue: "Dương lịch:" })} {anni.solarDate}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-secondary-text border-t border-custom-border/60 pt-3">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-accent shrink-0 mt-0.5" />
                <span>
                  <strong className="text-primary-text">{t("admin.anniversary_place", { defaultValue: "Nơi tổ chức:" })}</strong>{" "}
                  {anni.place}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={15} className="text-blue-400 shrink-0" />
                <span>
                  <strong className="text-primary-text">{t("admin.anniversary_host", { defaultValue: "Chủ trì:" })}</strong>{" "}
                  {anni.host}
                </span>
              </div>
            </div>

            <div className="bg-primary-bg/70 p-3 rounded-xl border border-custom-border text-xs text-secondary-text italic">
              "{anni.notes}"
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
