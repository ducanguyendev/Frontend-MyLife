import React from "react";
import { Handle, Position } from "@xyflow/react";
import { MoreVertical, Edit2, Eye, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { type FamilyMember, removeVietnameseTones, getGenerationColors } from "./types";
import { MemberAvatarImage } from "./MemberAvatarImage";

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
  const name = formatName(m.fullName);

  const openWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onView(m);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClick = () => setIsDropdownOpen(false);
    if (isDropdownOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isDropdownOpen]);

  return (
    <div className="bg-secondary-bg border-[1.5px] border-[#D4AF37] rounded-xl p-3 shadow-md w-64 h-24 relative group">
      <Handle type="target" id="parent-target" position={Position.Top} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="child-source" position={Position.Bottom} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="child-source-right" position={Position.Right} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="target" id="parent-target-left" position={Position.Left} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="spouse-right" position={Position.Right} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="target" id="spouse-left" position={Position.Left} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="spouse-bottom" position={Position.Bottom} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="target" id="spouse-top" position={Position.Top} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="horizontal-right" position={Position.Right} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="target" id="horizontal-left" position={Position.Left} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="source" id="horizontal-bottom" position={Position.Bottom} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      <Handle type="target" id="horizontal-top" position={Position.Top} isConnectable={false} aria-hidden="true" className="!w-1.5 !h-1.5 !bg-transparent !border-none !opacity-0 !pointer-events-none" />
      
      {/* Dropdown Menu */}
      <div className="absolute top-2 right-2 z-50">
        <button aria-label={t("admin.member_actions_for", { name })} aria-expanded={isDropdownOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-secondary-text hover:text-primary-text hover:bg-primary-bg transition-colors"
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

      <div
        role="button"
        tabIndex={0}
        aria-label={`${t("admin.view_detail")}: ${name}`}
        onClick={() => onView(m)}
        onKeyDown={openWithKeyboard}
        className="flex h-full items-center gap-3 rounded-md pr-8 outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
      >
        <MemberAvatarImage
          member={m}
          alt={name}
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
            {name}
          </h3>
          <p className="text-[10px] text-secondary-text truncate mt-0.5">
            {t(`admin.role_${m.role?.toLowerCase() || "member"}`, { defaultValue: m.role || "Thành viên" })}
          </p>
        </div>
      </div>

    </div>
  );
};
