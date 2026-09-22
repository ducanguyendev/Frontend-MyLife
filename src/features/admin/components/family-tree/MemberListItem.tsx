import React from "react";
import { Eye, Edit2, Trash2, CalendarDays, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";

import { type FamilyMember, getMemberAvatar, removeVietnameseTones, getGenerationColors } from "./types";

interface MemberListItemProps {
  member: FamilyMember;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const MemberListItem: React.FC<MemberListItemProps> = ({
  member: m,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t, language } = useLanguage();

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  const genColors = getGenerationColors(m.generation);

  return (
    <div
      onClick={() => onView(m)}
      className={`bg-secondary-bg border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all cursor-pointer shadow-sm ${genColors.border}`}
    >
      <div className="flex items-center gap-4 min-w-[240px]">
        <img
          src={getMemberAvatar(m)}
          alt={formatName(m.fullName)}
          className="w-12 h-12 rounded-xl object-cover border border-custom-border shrink-0"
        />
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-base font-bold text-primary-text">{formatName(m.fullName)}</h4>
            <span className="text-secondary-text text-xs">
              ({t(`admin.gender_${m.gender?.toLowerCase() || "unknown"}`, { defaultValue: m.gender || "Không rõ" })})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${genColors.bg} ${genColors.text} ${genColors.border}`}
            >
              {t("admin.generation", { defaultValue: "Đời" })} {m.generation}
            </span>
            <span className="text-xs text-secondary-text">
              {t(`admin.role_${m.role?.toLowerCase() || "member"}`, { defaultValue: m.role || "Thành viên" })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-xs text-secondary-text">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} className="shrink-0 text-accent" />
          <span>
            {m.dateOfBirth
              ? new Date(m.dateOfBirth).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
              : t("admin.not_updated", { defaultValue: "Chưa cập nhật" })}
          </span>
        </div>
        {m.address && (
          <div className="flex items-center gap-1.5 max-w-[200px] truncate">
            <MapPin size={14} className="shrink-0 text-blue-400" />
            <span className="truncate">{m.address}</span>
          </div>
        )}
        {m.phoneNumber && (
          <div className="flex items-center gap-1.5">
            <Phone size={14} className="shrink-0 text-emerald-500" />
            <span>{m.phoneNumber}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView(m)}
          className="p-2 rounded-lg text-secondary-text hover:text-accent hover:bg-primary-bg transition-colors cursor-pointer"
          title={t("admin.view_detail", { defaultValue: "Xem chi tiết" })}
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onEdit(m)}
          className="p-2 rounded-lg text-secondary-text hover:text-blue-400 hover:bg-primary-bg transition-colors cursor-pointer"
          title={t("admin.edit", { defaultValue: "Chỉnh sửa" })}
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(m)}
          className="p-2 rounded-lg text-secondary-text hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
          title={t("admin.delete", { defaultValue: "Xóa" })}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
