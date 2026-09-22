import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical, Eye, Edit2, Trash2, CalendarDays, MapPin, Phone
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";

import { type FamilyMember, getMemberAvatar, removeVietnameseTones, getGenerationColors } from "./types";

interface MemberCardProps {
  member: FamilyMember;
  index: number;
  isDropdownOpen: boolean;
  onToggleDropdown: (e: React.MouseEvent) => void;
  onCloseDropdown: () => void;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member: m,
  index: i,
  isDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      onClick={() => onView(m)}
      className={`bg-secondary-bg border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col h-full cursor-pointer ${genColors.border}`}
    >
      {/* Action Menu (Top Right) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onToggleDropdown}
          className="p-1.5 rounded-full text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors cursor-pointer"
          aria-label="Actions"
        >
          <MoreVertical size={16} />
        </button>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-8 mt-1 w-48 bg-secondary-bg border border-custom-border rounded-xl shadow-lg overflow-hidden z-20"
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDropdown();
                    onView(m);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors cursor-pointer"
                >
                  <Eye size={14} className="text-accent" />
                  {t("admin.view_detail", { defaultValue: "Xem chi tiết" })}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDropdown();
                    onEdit(m);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-text hover:text-blue-400 hover:bg-primary-bg transition-colors cursor-pointer"
                >
                  <Edit2 size={14} className="text-blue-400" />
                  {t("admin.edit", { defaultValue: "Chỉnh sửa" })}
                </button>
                <div className="h-px bg-custom-border mx-2 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDropdown();
                    onDelete(m);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  {t("admin.delete", { defaultValue: "Xóa thành viên" })}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <img
          src={getMemberAvatar(m)}
          alt={formatName(m.fullName)}
          className="w-14 h-14 rounded-xl object-cover border border-custom-border shrink-0"
        />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${genColors.bg} ${genColors.text} ${genColors.border}`}
            >
              {t("admin.generation", { defaultValue: "Đời thứ" })} {m.generation}
            </span>
            <span className="text-secondary-text text-[10px] font-bold uppercase">
              ({t(`admin.gender_${m.gender?.toLowerCase() || "unknown"}`, { defaultValue: m.gender || "Không rõ" })})
            </span>
          </div>
          <h3 className="text-lg font-bold text-primary-text leading-tight">{formatName(m.fullName)}</h3>
          <p className="text-secondary-text text-xs mt-1 font-medium">
            {t(`admin.role_${m.role?.toLowerCase() || "member"}`, { defaultValue: m.role || "Thành viên" })}
          </p>
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        <div className="flex items-center gap-2 text-xs text-secondary-text">
          <CalendarDays size={14} className="shrink-0" />
          <span>
            {m.dateOfBirth
              ? new Date(m.dateOfBirth).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
              : t("admin.not_updated", { defaultValue: "Chưa cập nhật" })}
          </span>
        </div>
        {m.address && (
          <div className="flex items-center gap-2 text-xs text-secondary-text">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{m.address}</span>
          </div>
        )}
        {m.phoneNumber && (
          <div className="flex items-center gap-2 text-xs text-secondary-text">
            <Phone size={14} className="shrink-0" />
            <span>{m.phoneNumber}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-custom-border/50 flex items-center justify-between text-xs text-secondary-text">
        <span className="text-[11px] text-accent/80 font-medium">
          {t("admin.click_view_detail", { defaultValue: "Nhấn để xem chi tiết →" })}
        </span>
      </div>
    </motion.div>
  );
};
