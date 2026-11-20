import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Eye, Flower2, GitBranch, Leaf, MoreVertical, Sprout, Sun, TreeDeciduous, Trash2, Wheat } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { type FamilyMember, removeVietnameseTones } from "./types";
import { getGenerationCardTheme } from "./generationCardThemes";
import { MemberAvatarImage } from "./MemberAvatarImage";
import "./MemberCard.css";

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
  member,
  index,
  isDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t, language } = useLanguage();
  const formatName = (name: string) => !name ? "" : language === "en" ? removeVietnameseTones(name) : name;
  const generationTheme = getGenerationCardTheme(member.generation);
  const isDeceased = member.lifeStatus === "DECEASED";
  const Motif = {
    tree: TreeDeciduous,
    branch: GitBranch,
    leaf: Leaf,
    blossom: Flower2,
    sun: Sun,
    bird: Sprout,
    flower: Flower2,
    seed: Sprout,
    vine: GitBranch,
    harvest: Wheat,
  }[generationTheme.motif];
  const name = formatName(member.fullName);
  const gender = t(`admin.gender_${member.gender?.toLowerCase() || "unknown"}`, { defaultValue: member.gender || t("admin.gender_unknown") });
  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || t("admin.role_member") });
  const actionsLabel = t("admin.member_actions_for", { name });

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`family-flip-card family-member-card ${generationTheme.className} relative h-full min-h-[248px] ${isDropdownOpen ? "z-40" : "z-0"}`}
    >
      <button
        type="button"
        className="family-member-card__open family-flip-card__front bg-secondary-bg border"
        onClick={() => onView(member)}
        aria-label={`${t("admin.view_detail", { defaultValue: "Xem chi tiết" })}: ${name}`}
      >
        <Motif className="family-member-card__motif" size={54} strokeWidth={1.4} aria-hidden="true" />
        <MemberAvatarImage
          member={member}
          alt={name}
          className="family-flip-card__avatar h-[76px] w-[76px] rounded-2xl border border-custom-border object-cover"
        />
        <span className="family-flip-card__name text-primary-text" title={name}>{name || t("admin.profile_no_information", { defaultValue: "Chưa có thông tin" })}</span>
        <span className="family-flip-card__meta text-secondary-text">
          <span className={`family-member-card__generation rounded-full border px-2 py-0.5 text-[11px] font-semibold ${generationTheme.badgeClassName}`}>
            {t("admin.generation", { defaultValue: "Đời" })} {member.generation}
          </span>
          <span>{gender}</span>
        </span>
        <span className="family-flip-card__role text-secondary-text" title={role}>{role}</span>
        <span className={`family-member-card__life-status ${isDeceased ? "is-deceased" : "is-living"}`}>
          {isDeceased ? "† " : "● "}{t(isDeceased ? "admin.member_life_status.deceased" : "admin.member_life_status.living")}
        </span>
      </button>

      <div className="family-flip-card__menu absolute right-3 top-3 z-30" onClick={event => event.stopPropagation()}>
        <button
          type="button"
          onClick={onToggleDropdown}
          className="rounded-full border border-custom-border bg-secondary-bg/95 p-2 text-secondary-text shadow-sm transition-colors hover:bg-primary-bg hover:text-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-border)]"
          aria-label={actionsLabel}
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
        >
          <MoreVertical size={16} aria-hidden="true" />
        </button>
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              role="menu"
              aria-label={actionsLabel}
              className="absolute right-0 top-10 w-48 overflow-hidden rounded-xl border border-custom-border bg-secondary-bg shadow-xl"
            >
              <button type="button" role="menuitem" onClick={() => { onCloseDropdown(); onView(member); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text">
                <Eye size={14} className="text-accent" />{t("admin.view_detail", { defaultValue: "Xem chi tiết" })}
              </button>
              <button type="button" role="menuitem" onClick={() => { onCloseDropdown(); onEdit(member); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text">
                <Edit2 size={14} className="text-blue-400" />{t("admin.edit", { defaultValue: "Chỉnh sửa" })}
              </button>
              <div className="mx-2 my-1 h-px bg-custom-border" />
              <button type="button" role="menuitem" onClick={() => { onCloseDropdown(); onDelete(member); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/10">
                <Trash2 size={14} />{t("admin.delete", { defaultValue: "Xóa thành viên" })}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};
