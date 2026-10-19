import { memo, useEffect, useRef, useState } from "react";
import { Eye, GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion, useIsPresent } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { MemberAvatarImage } from "../MemberAvatarImage";
import type { FamilyMember } from "../types";

interface FamilyPersonCardProps {
  member: FamilyMember;
  focused: boolean;
  highlighted: boolean;
  dimmed: boolean;
  reducedMotion: boolean;
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
  member, focused, highlighted, dimmed, reducedMotion, hiddenCount, expanded, x, y, onFocus, onHover, onExpand, onView, onEdit, onDelete,
}: FamilyPersonCardProps) {
  const { t } = useLanguage();
  const isPresent = useIsPresent();
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const birthDate = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
  const birthYear = birthDate && Number.isFinite(birthDate.getTime()) ? birthDate.getFullYear() : undefined;
  const deathDate = member.deathDate ? new Date(member.deathDate) : null;
  const deathYear = deathDate && Number.isFinite(deathDate.getTime()) ? deathDate.getFullYear() : undefined;
  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || t("admin.role_member", { defaultValue: "Member" }) });
  const rawGender = member.gender?.trim().toLocaleLowerCase();
  const genderKey = rawGender && (rawGender.includes("nữ") || rawGender === "nu" || rawGender === "female") ? "gender_nữ"
    : rawGender && (rawGender.includes("nam") || rawGender === "male") ? "gender_nam"
      : rawGender ? "gender_khác" : undefined;
  const gender = genderKey ? t(`admin.${genderKey}`, { defaultValue: member.gender }) : undefined;
  const generation = t("admin.mindmap_generation", { generation: member.generation, defaultValue: `Đời ${member.generation}` });
  const metadata = [generation, gender, birthYear, member.lifeStatus === "DECEASED" ? `†${deathYear ? ` ${deathYear}` : ""}` : undefined]
    .filter(value => value != null).join(" · ");
  const name = member.fullName;
  const actionsLabel = t("admin.member_actions_for", { name, defaultValue: `Actions for ${name}` });
  const focusBranchLabel = t("admin.mindmap_focus_branch", { defaultValue: "View this branch" });
  const expandLabel = t("admin.mindmap_expand_descendants", { count: hiddenCount, defaultValue: `Show ${hiddenCount} descendants` });
  const collapseLabel = t("admin.mindmap_collapse", { defaultValue: "Collapse branch" });

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => { if (!cardRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [menuOpen]);

  return <motion.article ref={cardRef} initial={{ opacity: 0 }} animate={{ opacity: dimmed ? 0.6 : 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0.01 : 0.32, ease: "easeOut" }} aria-hidden={!isPresent}
    className={`family-person-card${focused ? " is-focused" : ""}${highlighted ? " is-related" : ""}${dimmed ? " is-dimmed" : ""}${member.lifeStatus === "DECEASED" ? " is-deceased" : ""}`}
    onMouseEnter={() => onHover(member.id)} onMouseLeave={() => onHover(null)}
    style={{ left: x, top: y, pointerEvents: isPresent ? undefined : "none" }}
  >
    <button type="button" className="family-person-card__portrait" aria-label={`${t("admin.view_detail", { defaultValue: "View details" })}: ${name}`}
      onClick={() => { onFocus(member.id); onView(member); }}>
      <MemberAvatarImage member={member} alt={name} className="family-person-card__avatar" />
    </button>
    <div className="family-person-card__copy">
      <button type="button" className="family-person-card__name" title={name} onClick={() => { onFocus(member.id); onView(member); }}>{name}</button>
      <span className="family-person-card__role">{role}</span>
      <span className="family-person-card__meta">{metadata}</span>
    </div>
    <div className="family-person-card__actions">
      <button type="button" className="family-person-card__action-trigger" aria-label={actionsLabel} aria-haspopup="menu" aria-expanded={menuOpen}
        onClick={() => setMenuOpen(value => !value)}><MoreHorizontal size={17} /></button>
      {menuOpen && <div className="family-person-card__menu" role="menu" aria-label={actionsLabel} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); } }}>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onFocus(member.id); }}><GitBranch size={14} />{focusBranchLabel}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onView(member); }}><Eye size={14} />{t("admin.view_detail", { defaultValue: "View details" })}</button>
        <button role="menuitem" onClick={() => { setMenuOpen(false); onEdit(member); }}><Pencil size={14} />{t("admin.edit", { defaultValue: "Edit" })}</button>
        <button role="menuitem" className="is-delete" onClick={() => { setMenuOpen(false); onDelete(member); }}><Trash2 size={14} />{t("admin.delete", { defaultValue: "Delete" })}</button>
      </div>}
    </div>
    {hiddenCount > 0 && <button type="button" className="family-person-card__expand" aria-expanded={expanded}
      aria-label={`${expanded ? collapseLabel : expandLabel}: ${name}`} title={expanded ? collapseLabel : expandLabel}
      onClick={() => onExpand(member.id)}><span>{expanded ? "−" : `+${hiddenCount}`}</span></button>}
  </motion.article>;
});
