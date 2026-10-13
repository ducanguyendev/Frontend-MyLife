import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, MoreVertical, Eye, Edit2, Trash2, UsersRound } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";

import { type FamilyMember, removeVietnameseTones, getGenerationColors } from "./types";
import { MemberAvatarImage } from "./MemberAvatarImage";
import "./MemberCard.css";

const HOVER_ENTER_DELAY_MS = 200;
const HOVER_LEAVE_DELAY_MS = 100;

interface MemberCardProps {
  member: FamilyMember;
  members: FamilyMember[];
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
  members,
  index: i,
  isDropdownOpen,
  onToggleDropdown,
  onCloseDropdown,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t, language } = useLanguage();
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isPointerHovering, setIsPointerHovering] = React.useState(false);
  const hoverEnterTimerRef = React.useRef<number | null>(null);
  const hoverLeaveTimerRef = React.useRef<number | null>(null);
  const viewButtonRef = React.useRef<HTMLButtonElement>(null);
  const isPreviewVisible = isFlipped || isPointerHovering;

  const clearHoverTimers = React.useCallback(() => {
    if (hoverEnterTimerRef.current !== null) {
      window.clearTimeout(hoverEnterTimerRef.current);
      hoverEnterTimerRef.current = null;
    }
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  }, []);

  const scheduleHoverEnter = () => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
    if (hoverEnterTimerRef.current !== null) {
      window.clearTimeout(hoverEnterTimerRef.current);
    }
    hoverEnterTimerRef.current = window.setTimeout(() => {
      hoverEnterTimerRef.current = null;
      setIsPointerHovering(true);
    }, HOVER_ENTER_DELAY_MS);
  };

  const scheduleHoverLeave = () => {
    if (hoverEnterTimerRef.current !== null) {
      window.clearTimeout(hoverEnterTimerRef.current);
      hoverEnterTimerRef.current = null;
    }
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
    }
    hoverLeaveTimerRef.current = window.setTimeout(() => {
      hoverLeaveTimerRef.current = null;
      setIsPointerHovering(false);
    }, HOVER_LEAVE_DELAY_MS);
  };

  React.useEffect(() => clearHoverTimers, [clearHoverTimers]);

  const formatName = (name: string) => !name ? "" : language === "en" ? removeVietnameseTones(name) : name;
  const genColors = getGenerationColors(m.generation);
  const spouse = members.find(candidate => candidate.id === m.spouseId);
  const childrenCount = members.filter(candidate =>
    candidate.fatherId === m.id || candidate.motherId === m.id || m.childIds?.includes(candidate.id)
  ).length;
  const empty = t("admin.profile_no_information", { defaultValue: "Chưa có thông tin" });
  const gender = t(`admin.gender_${m.gender?.toLowerCase() || "unknown"}`, { defaultValue: m.gender || t("admin.gender_unknown") });
  const role = t(`admin.role_${m.role?.toLowerCase() || "member"}`, { defaultValue: m.role || t("admin.role_member") });

  const flipToBack = () => {
    clearHoverTimers();
    setIsFlipped(true);
    requestAnimationFrame(() => viewButtonRef.current?.focus());
  };

  const flipToFront = () => {
    clearHoverTimers();
    setIsFlipped(false);
    setIsPointerHovering(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      className={`family-flip-card relative h-full min-h-[248px] ${isDropdownOpen ? "z-40" : "z-0"}`}
      data-flipped={isPreviewVisible}
      aria-label={`${t("admin.view_detail")}: ${formatName(m.fullName)}`}
    >
      <div className="family-flip-card__scene">
        <div
          className="family-flip-card__inner"
          onPointerEnter={event => { if (event.pointerType === "mouse") scheduleHoverEnter(); }}
          onPointerLeave={event => { if (event.pointerType === "mouse") scheduleHoverLeave(); }}
        >
          <section className={`family-flip-card__face family-flip-card__front bg-secondary-bg border ${genColors.border}`} aria-label={t("admin.member_card_front", { defaultValue: "Thông tin tóm tắt" })} aria-hidden={isPreviewVisible} inert={isPreviewVisible}>
            <div className="family-flip-card__glow" aria-hidden="true" />
            <MemberAvatarImage
              member={m}
              alt={formatName(m.fullName)}
              className="family-flip-card__avatar h-[76px] w-[76px] rounded-2xl border border-custom-border object-cover"
            />
            <h3 className="family-flip-card__name text-primary-text" title={formatName(m.fullName)}>{formatName(m.fullName) || empty}</h3>
            <div className="family-flip-card__meta text-secondary-text">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${genColors.bg} ${genColors.text} ${genColors.border}`}>
                {t("admin.generation", { defaultValue: "Đời" })} {m.generation}
              </span>
              <span>{gender}</span>
            </div>
            <p className="family-flip-card__role text-secondary-text" title={role}>{role}</p>
            <button
              type="button"
              className="family-flip-card__flip-trigger text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              onClick={flipToBack}
              aria-label={t("admin.quick_preview", { defaultValue: "Xem nhanh thông tin" })}
            >
              {t("admin.quick_preview", { defaultValue: "Xem nhanh" })} <ArrowRight size={14} aria-hidden="true" />
            </button>
          </section>

          <section className={`family-flip-card__face family-flip-card__back bg-secondary-bg border ${genColors.border}`} aria-label={t("admin.member_card_summary", { defaultValue: "Tóm tắt thành viên" })} aria-hidden={!isPreviewVisible} inert={!isPreviewVisible}>
            <h3 className="family-flip-card__back-title text-primary-text" title={formatName(m.fullName)}>{formatName(m.fullName) || empty}</h3>
            <dl className="family-flip-card__summary text-secondary-text">
              <div className="family-flip-card__summary-row">
                <CalendarDays size={15} aria-hidden="true" />
                <dt className="sr-only">{t("admin.field_dob", { defaultValue: "Ngày sinh" })}</dt>
                <dd>{m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : empty}</dd>
              </div>
              <div className="family-flip-card__summary-row">
                <UsersRound size={15} aria-hidden="true" />
                <dt className="sr-only">{t("admin.field_spouse", { defaultValue: "Vợ/Chồng" })}</dt>
                <dd className="truncate">{spouse ? formatName(spouse.fullName) : empty}</dd>
              </div>
              <div className="family-flip-card__summary-row">
                <UsersRound size={15} aria-hidden="true" />
                <dt className="sr-only">{t("admin.children", { defaultValue: "Con cái" })}</dt>
                <dd>{t("admin.child_count", { count: childrenCount, defaultValue: `${childrenCount} người con` })}</dd>
              </div>
              <div className="family-flip-card__summary-row family-flip-card__summary-row--address">
                <MapPin size={15} aria-hidden="true" />
                <dt className="sr-only">{t("admin.field_address", { defaultValue: "Địa chỉ" })}</dt>
                <dd title={m.address || undefined}>{m.address || empty}</dd>
              </div>
            </dl>
            <div className="family-flip-card__back-actions">
              <button type="button" onClick={flipToFront} className="family-flip-card__flip-trigger text-secondary-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                <ArrowLeft size={14} aria-hidden="true" /> {t("admin.flip_back", { defaultValue: "Lật lại" })}
              </button>
              <button ref={viewButtonRef} type="button" onClick={() => onView(m)} className="family-flip-card__view text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                {t("admin.view_profile", { defaultValue: "Xem hồ sơ" })} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <div className="family-flip-card__menu absolute right-3 top-3 z-30">
        <button
          type="button"
          onClick={onToggleDropdown}
          className="rounded-full border border-custom-border bg-secondary-bg/90 p-2 text-secondary-text shadow-sm transition-colors hover:text-primary-text hover:bg-primary-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={t("admin.member_actions_for", { name: formatName(m.fullName) })}
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
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
              role="menu"
              className="absolute right-0 top-10 w-48 overflow-hidden rounded-xl border border-custom-border bg-secondary-bg shadow-xl"
            >
              <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); onCloseDropdown(); onView(m); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text">
                <Eye size={14} className="text-accent" />{t("admin.view_detail", { defaultValue: "Xem chi tiết" })}
              </button>
              <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); onCloseDropdown(); onEdit(m); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text">
                <Edit2 size={14} className="text-blue-400" />{t("admin.edit", { defaultValue: "Chỉnh sửa" })}
              </button>
              <div className="mx-2 my-1 h-px bg-custom-border" />
              <button type="button" role="menuitem" onClick={(e) => { e.stopPropagation(); onCloseDropdown(); onDelete(m); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/10">
                <Trash2 size={14} />{t("admin.delete", { defaultValue: "Xóa thành viên" })}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};
