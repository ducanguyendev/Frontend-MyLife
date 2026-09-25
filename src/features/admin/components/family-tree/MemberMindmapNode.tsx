import React from "react";
import { Handle, Position } from "@xyflow/react";
import { MoreVertical, Edit2, Eye, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { type FamilyMember, getMemberAvatar, removeVietnameseTones, getGenerationColors } from "./types";

interface NodeData {
  member: FamilyMember;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const MemberMindmapNode: React.FC<{ data: NodeData }> = ({ data }) => {
  const { member: m, onView, onEdit, onDelete } = data;
  const { t, language } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  const genColors = getGenerationColors(m.generation);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClick = () => setIsDropdownOpen(false);
    if (isDropdownOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isDropdownOpen]);

  return (
    <div className={`bg-secondary-bg border-[1.5px] border-[#D4AF37] rounded-xl p-3 shadow-md w-64 relative group transition-transform hover:scale-105 cursor-pointer`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-[#D4AF37] !border-none" />
      
      {/* Dropdown Menu */}
      <div className="absolute top-2 right-2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="p-1 rounded-full text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors"
        >
          <MoreVertical size={14} />
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 top-7 mt-1 w-40 bg-secondary-bg border border-custom-border rounded-lg shadow-xl overflow-hidden z-[100] text-left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(false);
                onView(m);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors"
            >
              <Eye size={12} className="text-accent" />
              {t("admin.view_detail", { defaultValue: "Xem chi tiết" })}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(false);
                onEdit(m);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-secondary-text hover:text-blue-400 hover:bg-primary-bg transition-colors"
            >
              <Edit2 size={12} className="text-blue-400" />
              {t("admin.edit", { defaultValue: "Chỉnh sửa" })}
            </button>
            <div className="h-px bg-custom-border mx-2 my-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(false);
                onDelete(m);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 size={12} />
              {t("admin.delete", { defaultValue: "Xóa" })}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3" onClick={() => onView(m)}>
        <img
          src={getMemberAvatar(m)}
          alt={formatName(m.fullName)}
          className="w-12 h-12 rounded-full object-cover border-[1.5px] border-[#D4AF37]/70 shrink-0 pointer-events-none"
        />
        <div className="flex-1 overflow-hidden pr-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${genColors.border} ${genColors.text}`}>
              F{m.generation}
            </span>
            <span className="text-[9px] text-secondary-text uppercase font-semibold">
              ({t(`admin.gender_${m.gender?.toLowerCase() || "unknown"}`, { defaultValue: m.gender || "Không rõ" })})
            </span>
          </div>
          <h3 className="text-sm font-bold text-primary-text truncate leading-tight pointer-events-none">
            {formatName(m.fullName)}
          </h3>
          <p className="text-[10px] text-secondary-text truncate mt-0.5">
            {t(`admin.role_${m.role?.toLowerCase() || "member"}`, { defaultValue: m.role || "Thành viên" })}
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-[#D4AF37] !border-none" />
    </div>
  );
};
