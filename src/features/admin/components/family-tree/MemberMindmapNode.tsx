import React, { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Edit2, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { getGenerationColors, removeVietnameseTones, type FamilyMember } from "./types";
import { MemberAvatarImage } from "./MemberAvatarImage";
import type { FamilyMindmapNode } from "./familyMindmapGraph";

interface MemberNodeData extends Record<string, unknown> {
  member: FamilyMember;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onFocusMember?: (memberId: number | null) => void;
}

function MemberMindmapNodeComponent({ data }: NodeProps<FamilyMindmapNode>) {
  const { member, onView, onEdit, onDelete, onFocusMember } = data as MemberNodeData;
  const { t, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const colors = getGenerationColors(member.generation);
  const name = language === "en" ? removeVietnameseTones(member.fullName) : member.fullName;
  const generationLabel = t("admin.mindmap_generation", { generation: member.generation, defaultValue: `Đời ${member.generation}` });
  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || "Thành viên" });
  const deceased = member.lifeStatus === "DECEASED";

  const onCardKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && menuOpen) {
      event.preventDefault();
      setMenuOpen(false);
      actionButtonRef.current?.focus();
    }
  };
  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setMenuOpen(false);
    actionButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!cardRef.current?.contains(event.target as globalThis.Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  return <article ref={cardRef} className={`family-mindmap-card${deceased ? " family-mindmap-card--deceased" : ""}`}>
    <Handle type="target" id="parent-target" position={Position.Top} isConnectable={false} />
    <Handle type="source" id="child-source" position={Position.Bottom} isConnectable={false} />
    <Handle type="source" id="child-source-right" position={Position.Right} isConnectable={false} />
    <Handle type="target" id="parent-target-left" position={Position.Left} isConnectable={false} />
    <Handle type="source" id="spouse-right" position={Position.Right} isConnectable={false} />
    <Handle type="target" id="spouse-left" position={Position.Left} isConnectable={false} />
    <Handle type="source" id="spouse-bottom" position={Position.Bottom} isConnectable={false} />
    <Handle type="target" id="spouse-top" position={Position.Top} isConnectable={false} />
    <Handle type="source" id="horizontal-right" position={Position.Right} isConnectable={false} />
    <Handle type="target" id="horizontal-left" position={Position.Left} isConnectable={false} />
    <Handle type="source" id="horizontal-bottom" position={Position.Bottom} isConnectable={false} />
    <Handle type="target" id="horizontal-top" position={Position.Top} isConnectable={false} />

    <button type="button" className="family-mindmap-card__main" aria-label={`${t("admin.view_detail")}: ${name}`}
      onClick={() => onView(member)} onKeyDown={onCardKeyDown}
      onFocus={() => onFocusMember?.(member.id)}
      onBlur={event => { if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) onFocusMember?.(null); }}>
      <span className="family-mindmap-card__avatar-wrap">
        <MemberAvatarImage member={member} alt={name} className="family-mindmap-card__avatar" />
      </span>
      <span className="family-mindmap-card__name" title={name}>{name}</span>
      <span className="family-mindmap-card__role">{role}</span>
      <span className={`family-mindmap-card__generation ${colors.bg} ${colors.text} ${colors.border}`}>{generationLabel}</span>
      {deceased && <span className="family-mindmap-card__memorial" aria-label={t("admin.mindmap_deceased", { defaultValue: "Đã mất" })}>†</span>}
    </button>

    <div className="family-mindmap-card__actions" onClick={event => event.stopPropagation()}>
      <button ref={actionButtonRef} type="button" aria-label={t("admin.member_actions_for", { name })}
        aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}
        className="family-mindmap-card__action-trigger"><MoreVertical size={16} /></button>
      {menuOpen && <div className="family-mindmap-card__menu" role="menu" aria-label={t("admin.member_actions_for", { name })} onKeyDown={onMenuKeyDown}>
        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onView(member); }}><Eye size={14} />{t("admin.view_detail", { defaultValue: "Xem chi tiết" })}</button>
        <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onEdit(member); }}><Edit2 size={14} />{t("admin.edit", { defaultValue: "Chỉnh sửa" })}</button>
        <button type="button" role="menuitem" className="is-delete" onClick={() => { setMenuOpen(false); onDelete(member); }}><Trash2 size={14} />{t("admin.delete", { defaultValue: "Xóa" })}</button>
      </div>}
    </div>
  </article>;
}

export const MemberMindmapNode = memo(MemberMindmapNodeComponent);
