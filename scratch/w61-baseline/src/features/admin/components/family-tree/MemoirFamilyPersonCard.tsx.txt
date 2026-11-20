import { useState, type MouseEvent } from "react";
import { Eye, GitBranch, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { FamilyCardProps } from "@memoir/tree";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { MemberAvatarImage } from "./MemberAvatarImage";
import type { FamilyMember } from "./types";
import type { MemoirPerson } from "./memoirTreeAdapter";

export interface MemoirFamilyCardActions {
  hiddenCount: number;
  expanded: boolean;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onFocus: (id: number) => void;
  onExpand: (id: number) => void;
}

export type MemoirFamilyPersonCardProps = FamilyCardProps<MemoirPerson> & MemoirFamilyCardActions;

export function MemoirFamilyPersonCard({
  person, personId, focused, selected, relation, metadata, collapsed, readOnly, placement,
  onAddRelationship, className, style, hiddenCount, expanded, onView, onEdit, onDelete, onFocus, onExpand, ...rootProps
}: MemoirFamilyPersonCardProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const birthYear = year(person.dateOfBirth);
  const deathYear = year(person.deathDate);
  const meta = [birthYear, person.lifeStatus === "DECEASED" ? `†${deathYear ? ` ${deathYear}` : ""}` : undefined].filter(Boolean).join(" · ");
  const memberId = person.id;
  const id = Number(memberId);
  const role = person.role?.trim();
  const generation = t("admin.mindmap_generation", { generation: person.generation, defaultValue: `Đời ${person.generation}` });
  const actionLabel = t("admin.member_actions_for", { name: person.fullName, defaultValue: `Actions for ${person.fullName}` });
  const domProps = { ...rootProps, "data-person-id": personId };
  void onAddRelationship;
  const action = (event: MouseEvent, callback: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    callback();
  };

  return <article {...domProps} className={`${className ?? ""} memoir-family-card${focused || selected ? " is-focused" : ""}${person.lifeStatus === "DECEASED" ? " is-deceased" : ""}`} style={style}
    data-relation={relation.label} data-node-kind={metadata?.kind} data-placement-group-id={placement?.partnershipGroupIds[0]}
    data-collapsed={collapsed || undefined} data-readonly={readOnly || undefined}>
    <MemberAvatarImage member={person} alt={person.fullName} className="memoir-family-card__avatar" />
    <strong className="memoir-family-card__name" title={person.fullName}>{person.fullName}</strong>
    {role && <span className="memoir-family-card__role" title={role}>{role}</span>}
    <span className="memoir-family-card__meta">{[generation, meta].filter(Boolean).join(" · ")}</span>
    <div className="memoir-family-card__actions">
      <button type="button" aria-label={actionLabel} aria-haspopup="menu" aria-expanded={menuOpen}
        onClick={event => action(event, () => setMenuOpen(value => !value))}><MoreHorizontal size={16} /></button>
      {menuOpen && <div role="menu" className="memoir-family-card__menu" onClick={event => event.stopPropagation()}>
        <button type="button" role="menuitem" onClick={event => action(event, () => { setMenuOpen(false); onFocus(id); })}><GitBranch size={14} />{t("admin.mindmap_focus_branch", { defaultValue: "View this branch" })}</button>
        <button type="button" role="menuitem" onClick={event => action(event, () => { setMenuOpen(false); onView(person); })}><Eye size={14} />{t("admin.view_detail", { defaultValue: "View details" })}</button>
        <button type="button" role="menuitem" onClick={event => action(event, () => { setMenuOpen(false); onEdit(person); })}><Pencil size={14} />{t("admin.edit", { defaultValue: "Edit" })}</button>
        <button type="button" role="menuitem" onClick={event => action(event, () => { setMenuOpen(false); onDelete(person); })}><Trash2 size={14} />{t("admin.delete", { defaultValue: "Delete" })}</button>
      </div>}
    </div>
    {hiddenCount > 0 && <button type="button" className="memoir-family-card__expand" aria-expanded={expanded}
      aria-label={`${t(expanded ? "admin.mindmap_collapse" : "admin.mindmap_expand_descendants", { count: hiddenCount, defaultValue: expanded ? "Collapse branch" : `Show ${hiddenCount} descendants` })}: ${person.fullName}`}
      onClick={event => action(event, () => onExpand(id))}>{expanded ? "−" : `+${hiddenCount}`}</button>}
  </article>;
}

function year(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? String(parsed.getFullYear()) : undefined;
}
