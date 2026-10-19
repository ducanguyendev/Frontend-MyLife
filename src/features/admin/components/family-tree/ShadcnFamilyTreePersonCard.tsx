import { memo, useState } from "react";
import { Eye, GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { MemberAvatarImage } from "./MemberAvatarImage";
import type { FamilyMember } from "./types";

interface Props {
  member: FamilyMember;
  x: number;
  y: number;
  focused: boolean;
  dimmed: boolean;
  hiddenCount: number;
  expanded: boolean;
  onFocus: (id: number) => void;
  onHover: (id: number | null) => void;
  onExpand: (id: number) => void;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const ShadcnFamilyTreePersonCard = memo(function ShadcnFamilyTreePersonCard({
  member, x, y, focused, dimmed, hiddenCount, expanded, onFocus, onHover, onExpand, onView, onEdit, onDelete,
}: Props) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const birth = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
  const death = member.deathDate ? new Date(member.deathDate) : null;
  const birthYear = birth && Number.isFinite(birth.getTime()) ? birth.getFullYear() : null;
  const deathYear = death && Number.isFinite(death.getTime()) ? death.getFullYear() : null;
  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || t("admin.role_member", { defaultValue: "Thành viên" }) });
  const generation = t("admin.mindmap_generation", { generation: member.generation, defaultValue: `Đời ${member.generation}` });
  const actionsLabel = t("admin.member_actions_for", { name: member.fullName, defaultValue: `Thao tác với ${member.fullName}` });

  return <motion.article
    className={`shadcn-family-tree__person${focused ? " is-focused" : ""}${dimmed ? " is-dimmed" : ""}${member.lifeStatus === "DECEASED" ? " is-deceased" : ""}`}
    style={{ left: x, top: y }}
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: dimmed ? .54 : 1, y: 0 }} exit={{ opacity: 0 }}
    transition={{ duration: reduceMotion ? .01 : .32, ease: "easeOut" }}
    onClick={() => onFocus(member.id)}
    onMouseEnter={() => onHover(member.id)}
    onMouseLeave={() => onHover(null)}
  >
    <button type="button" className="shadcn-family-tree__portrait" aria-label={`${t("admin.view_detail", { defaultValue: "Xem chi tiết" })}: ${member.fullName}`} onClick={event => { event.stopPropagation(); onFocus(member.id); }}>
      <MemberAvatarImage member={member} alt={member.fullName} className="shadcn-family-tree__avatar" />
    </button>
    <div className="shadcn-family-tree__copy">
      <button type="button" className="shadcn-family-tree__name" title={member.fullName} onClick={event => { event.stopPropagation(); onFocus(member.id); }}>{member.fullName}</button>
      <span className="shadcn-family-tree__role">{role}</span>
      <span className="shadcn-family-tree__meta">
        <span className="shadcn-family-tree__generation-chip">{generation}</span>
        {birthYear && <span>{birthYear}</span>}
        {member.lifeStatus === "DECEASED" && <span>†{deathYear ? ` ${deathYear}` : ""}</span>}
      </span>
    </div>
    <div className="shadcn-family-tree__actions">
      <button type="button" className="shadcn-family-tree__action" aria-label={`${t("admin.view_detail", { defaultValue: "Xem chi tiết" })}: ${member.fullName}`} onClick={event => { event.stopPropagation(); onView(member); }}><Eye size={15} /></button>
      <button type="button" className="shadcn-family-tree__action-menu" aria-label={actionsLabel} aria-haspopup="menu" aria-expanded={menuOpen} onClick={event => { event.stopPropagation(); setMenuOpen(value => !value); }}><MoreHorizontal size={16} /></button>
      {menuOpen && <div className="shadcn-family-tree__menu" role="menu" aria-label={actionsLabel} onClick={event => event.stopPropagation()}>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onFocus(member.id); }}><GitBranch size={14} />{t("admin.mindmap_focus_branch", { defaultValue: "Xem nhánh người này" })}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onView(member); }}><Eye size={14} />{t("admin.view_detail", { defaultValue: "Xem chi tiết" })}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onEdit(member); }}><Pencil size={14} />{t("admin.edit", { defaultValue: "Sửa" })}</button>
        <button role="menuitem" className="is-delete" onClick={() => { setMenuOpen(false); onDelete(member); }}><Trash2 size={14} />{t("admin.delete", { defaultValue: "Xóa" })}</button>
      </div>}
    </div>
    {hiddenCount > 0 && <button type="button" className="shadcn-family-tree__expand" aria-expanded={expanded} aria-label={`${expanded ? "Thu gọn" : `Mở ${hiddenCount} hậu duệ`}: ${member.fullName}`} onClick={event => { event.stopPropagation(); onExpand(member.id); }}>{expanded ? "−" : `+${hiddenCount}`}</button>}
  </motion.article>;
});
