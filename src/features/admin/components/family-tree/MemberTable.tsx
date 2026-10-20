import React from "react";
import { createPortal } from "react-dom";
import { Edit2, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { type FamilyMember, getGenerationColors, removeVietnameseTones } from "./types";
import { MemberAvatarImage } from "./MemberAvatarImage";

interface MemberTableProps {
  members: FamilyMember[];
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

interface OpenMenu {
  member: FamilyMember;
  top: number;
  left: number;
}

const missingValue = "—";

export const MemberTable: React.FC<MemberTableProps> = ({ members, onView, onEdit, onDelete }) => {
  const { t, language } = useLanguage();
  const [openMenu, setOpenMenu] = React.useState<OpenMenu | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!openMenu) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  const displayName = (name: string) => language === "en" ? removeVietnameseTones(name) : name;
  const genderLabel = (gender?: string) => gender
    ? t(`admin.gender_${gender.toLowerCase()}`, { defaultValue: gender })
    : t("admin.gender_unknown");
  const roleLabel = (role?: string) => role
    ? t(`admin.role_${role.toLowerCase()}`, { defaultValue: role })
    : missingValue;
  const openActions = (event: React.MouseEvent<HTMLButtonElement>, member: FamilyMember) => {
    event.stopPropagation();
    if (openMenu?.member.id === member.id) {
      setOpenMenu(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const menuHeight = 136;
    setOpenMenu({
      member,
      top: rect.bottom + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight) : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - 192, window.innerWidth - 200)),
    });
  };
  const runAction = (action: (member: FamilyMember) => void) => {
    if (!openMenu) return;
    action(openMenu.member);
    setOpenMenu(null);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-custom-border bg-secondary-bg shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-auto border-collapse text-left">
          <caption className="sr-only">{t("admin.members_table_caption")}</caption>
          <thead className="bg-primary-bg/60">
            <tr className="border-b border-custom-border text-[11px] font-semibold uppercase tracking-wide text-secondary-text">
              <th scope="col" className="px-4 py-3">{t("admin.col_member")}</th>
              <th scope="col" className="px-3 py-3">{t("admin.col_generation")}</th>
              <th scope="col" className="hidden px-3 py-3 sm:table-cell">{t("admin.col_gender")}</th>
              <th scope="col" className="px-3 py-3">{t("admin.col_role")}</th>
              <th scope="col" className="hidden px-3 py-3 md:table-cell">{t("admin.col_dob")}</th>
              <th scope="col" className="hidden px-3 py-3 lg:table-cell">{t("admin.col_phone")}</th>
              <th scope="col" className="hidden px-3 py-3 xl:table-cell">{t("admin.col_address")}</th>
              <th scope="col" className="px-2 py-3"><span className="sr-only">{t("admin.col_actions")}</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => {
              const colors = getGenerationColors(member.generation);
              const name = displayName(member.fullName);
              return (
                <tr
                  key={member.id}
                  onClick={() => onView(member)}
                  onKeyDown={event => {
                    if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      onView(member);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`${t("admin.view_detail")}: ${name}`}
                  className="group cursor-pointer border-b border-custom-border/70 last:border-b-0 hover:bg-primary-bg/55    "
                >
                  <td className="px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatarImage member={member} alt={name} className="h-10 w-10 shrink-0 rounded-xl border border-custom-border object-cover" />
                      <button
                        type="button"
                        onClick={event => { event.stopPropagation(); onView(member); }}
                        title={name}
                        className="min-w-0 truncate text-left text-sm font-semibold text-primary-text hover:text-accent  focus-visible:underline"
                      >
                        {name || missingValue}
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold ${colors.bg} ${colors.text} ${colors.border}`}>
                      {t("admin.generation")} {member.generation}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-secondary-text sm:table-cell">{genderLabel(member.gender)}</td>
                  <td className="px-3 py-2.5"><span className="block truncate text-xs font-medium text-primary-text" title={roleLabel(member.role)}>{roleLabel(member.role)}</span></td>
                  <td className="hidden whitespace-nowrap px-3 py-2.5 text-xs text-secondary-text md:table-cell">
                    {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : missingValue}
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-secondary-text lg:table-cell">
                    {member.phoneNumber ? <a href={`tel:${member.phoneNumber}`} onClick={event => event.stopPropagation()} className="whitespace-nowrap hover:text-accent">{member.phoneNumber}</a> : missingValue}
                  </td>
                  <td className="hidden px-3 py-2.5 text-xs text-secondary-text xl:table-cell">
                    <span className="block truncate" title={member.address || undefined} tabIndex={member.address ? 0 : undefined} aria-label={member.address || undefined}>{member.address || missingValue}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      ref={openMenu?.member.id === member.id ? triggerRef : undefined}
                      onClick={event => openActions(event, member)}
                      aria-label={t("admin.member_actions_for", { name })}
                      aria-haspopup="menu"
                      aria-expanded={openMenu?.member.id === member.id}
                      className="rounded-lg p-2 text-secondary-text hover:bg-primary-bg hover:text-primary-text   "
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {openMenu && createPortal(
        <div ref={menuRef} role="menu" className="fixed z-[100] w-48 overflow-hidden rounded-xl border border-custom-border bg-secondary-bg py-1 shadow-xl" style={{ top: openMenu.top, left: openMenu.left }}>
          <button type="button" role="menuitem" onClick={() => runAction(onView)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text hover:bg-primary-bg hover:text-primary-text">
            <Eye size={14} className="text-accent" />{t("admin.view_detail")}
          </button>
          <button type="button" role="menuitem" onClick={() => runAction(onEdit)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-text hover:bg-primary-bg hover:text-primary-text">
            <Edit2 size={14} className="text-blue-400" />{t("admin.edit")}
          </button>
          <div className="mx-2 my-1 h-px bg-custom-border" />
          <button type="button" role="menuitem" onClick={() => runAction(onDelete)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-error hover:bg-error/10">
            <Trash2 size={14} />{t("admin.delete")}
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
};
