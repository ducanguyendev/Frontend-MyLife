import { memo, useEffect, useRef, useState } from "react";
import { CalendarDays, Eye, GitBranch, MoreHorizontal, Pencil, Plus, Skull, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { MemberAvatarImage } from "../MemberAvatarImage";
import type { FamilyMember } from "../types";

interface FamilyPersonCardProps {
  member: FamilyMember;
  focused: boolean;
  highlighted: boolean;
  dimmed: boolean;
  hiddenCount: number;
  expanded: boolean;
  x: number;
  y: number;
  onFocus: (id: number) => void;
  onHover: (id: number | null) => void;
  onExpand: (id: number) => void;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

export const FamilyPersonCard = memo(function FamilyPersonCard({
  member, focused, highlighted, dimmed, hiddenCount, expanded, x, y, onFocus, onHover, onExpand, onView, onEdit, onDelete,
}: FamilyPersonCardProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const year = member.dateOfBirth ? new Date(member.dateOfBirth).getFullYear() : undefined;
  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || t("admin.role_member", { defaultValue: "Thành viên" }) });
  const rawGender = member.gender?.trim().toLocaleLowerCase();
  const genderKey = rawGender && (rawGender.includes("nữ") || rawGender === "nu" || rawGender === "female") ? "gender_nữ"
    : rawGender && (rawGender.includes("nam") || rawGender === "male") ? "gender_nam"
      : rawGender ? "gender_khác" : undefined;
  const gender = genderKey ? t(`admin.${genderKey}`, { defaultValue: member.gender }) : undefined;
  const name = member.fullName;
  const actionsLabel = t("admin.member_actions_for", { name, defaultValue: `Thao tác với ${name}` });
  const focusBranchLabel = t("admin.mindmap_focus_branch", { defaultValue: "Xem nhánh người này" });
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => { if (!cardRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  return <article ref={cardRef}
    className={`family-person-card${focused ? " is-focused" : ""}${highlighted ? " is-related" : ""}${dimmed ? " is-dimmed" : ""}${member.lifeStatus === "DECEASED" ? " is-deceased" : ""}`}
    onMouseEnter={() => onHover(member.id)} onMouseLeave={() => onHover(null)}
    style={{ left: x, top: y }}
  >
    <button type="button" className="family-person-card__portrait" aria-label={`${t("admin.view_detail", { defaultValue: "Xem chi tiết" })}: ${name}`}
      onClick={() => { onFocus(member.id); onView(member); }}>
      <MemberAvatarImage member={member} alt={name} className="family-person-card__avatar" />
    </button>
    <div className="family-person-card__copy">
      <button type="button" className="family-person-card__name" title={name} onClick={() => { onFocus(member.id); onView(member); }}>{name}</button>
      <span className="family-person-card__role">{role}</span>
      <span className="family-person-card__meta">
        <span>{t("admin.mindmap_generation", { generation: member.generation, defaultValue: `Đời ${member.generation}` })}</span>
        {gender && <><span aria-hidden="true">·</span><span>{gender}</span></>}
        {year && <><span aria-hidden="true">·</span><span><CalendarDays size={11} />{year}</span></>}
      </span>
      {member.lifeStatus === "DECEASED" && <span className="family-person-card__memorial"><Skull size={11} />{t("admin.mindmap_deceased", { defaultValue: "Tưởng nhớ" })}</span>}
    </div>
    <div className="family-person-card__actions">
      <button type="button" className="family-person-card__action-trigger" aria-label={actionsLabel} aria-haspopup="menu" aria-expanded={menuOpen}
        onClick={() => setMenuOpen(value => !value)}><MoreHorizontal size={17} /></button>
      {menuOpen && <div className="family-person-card__menu" role="menu" aria-label={actionsLabel} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); } }}>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onFocus(member.id); }}><GitBranch size={14} />{focusBranchLabel}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onView(member); }}><Eye size={14} />{t("admin.view_detail", { defaultValue: "Xem chi tiết" })}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onEdit(member); }}><Pencil size={14} />{t("admin.edit", { defaultValue: "Chỉnh sửa" })}</button>
        <button role="menuitem" className="is-delete" onClick={() => { setMenuOpen(false); onDelete(member); }}><Trash2 size={14} />{t("admin.delete", { defaultValue: "Xóa" })}</button>
      </div>}
    </div>
    {hiddenCount > 0 && <button type="button" className="family-person-card__expand" aria-expanded={expanded}
      aria-label={`${expanded ? t("admin.mindmap_collapse", { defaultValue: "Thu gọn" }) : t("admin.mindmap_expand_descendants", { count: hiddenCount, defaultValue: `Hiện ${hiddenCount} hậu duệ` })}: ${name}`}
      onClick={() => onExpand(member.id)}><Plus size={13} className={expanded ? "is-rotated" : ""} /><span>{expanded ? t("admin.mindmap_collapse", { defaultValue: "Thu gọn" }) : `${hiddenCount} ${t("admin.mindmap_descendants", { defaultValue: "hậu duệ" })}`}</span></button>}
  </article>;
});
