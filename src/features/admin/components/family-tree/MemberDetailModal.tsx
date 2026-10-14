import React from "react";
import {
  CalendarDays, MapPin, Phone, ExternalLink, BookOpen, Edit2, X, UsersRound,
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Modal } from "@/shared/components/ui";
import { type FamilyMember, removeVietnameseTones, getGenerationColors } from "./types";
import { MemberAvatarImage } from "./MemberAvatarImage";
import { getSiblingDisplayLabelKey, getSiblingKind, getSiblingSeniority, isBiologicalSibling } from "./siblingRelations";

const FacebookIcon: React.FC<{ size?: number; className?: string }> = ({ size = 13, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface MemberDetailModalProps {
  member: FamilyMember | null;
  members: FamilyMember[];
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
  onView: (member: FamilyMember) => void;
}

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary-text">
    <span className="text-accent">{icon}</span>{children}
  </h4>
);

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, members, onClose, onEdit, onView }) => {
  const { t, language } = useLanguage();

  if (!member) return null;

  const formatName = (name: string) => !name ? "" : language === "en" ? removeVietnameseTones(name) : name;
  const empty = t("admin.profile_no_information", { defaultValue: "Chưa có thông tin" });
  const dateLocale = language === "en" ? "en-GB" : "vi-VN";
  const father = members.find((m) => m.id === member.fatherId);
  const mother = members.find((m) => m.id === member.motherId);
  const spouse = members.find((m) => m.id === member.spouseId);
  const children = members.filter(
    (m) => m.fatherId === member.id || m.motherId === member.id || member.childIds?.includes(m.id)
  );

  // Keep the existing biological-sibling and cousin classification unchanged.
  const ruotSiblings = members.filter(m => m.id !== member.id && isBiologicalSibling(member, m));
  const hoSiblings = members.filter(m => m.id !== member.id && getSiblingKind(member, m) === 'cousin');
  const getSiblingLabel = (sibling: FamilyMember, kind: 'biological' | 'cousin') =>
    t('admin.' + getSiblingDisplayLabelKey(kind, getSiblingSeniority(member, sibling)));

  const renderRelationMember = (related: FamilyMember, roleLabel?: string) => (
    <button
      key={`${roleLabel ?? "relation"}-${related.id}`}
      type="button"
      onClick={() => onView(related)}
      aria-label={roleLabel ? `${roleLabel}: ${formatName(related.fullName)}` : formatName(related.fullName)}
      className="inline-flex min-h-8 max-w-full cursor-pointer items-center gap-1.5 rounded-lg border border-custom-border bg-secondary-bg px-2.5 py-1 text-left transition-colors hover:border-accent/40 hover:bg-primary-bg   "
    >
      <span className="max-w-full truncate text-xs font-semibold text-primary-text">{formatName(related.fullName)}</span>
      {roleLabel && <span className="shrink-0 text-[10px] text-secondary-text">{roleLabel}</span>}
    </button>
  );

  const renderRelationGroup = (label: string, related: FamilyMember[], emptyLabel = t("admin.none")) => (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-2 border-b border-custom-border/60 py-2 last:border-0">
      <dt className="pt-1 text-[10px] font-bold uppercase tracking-wide text-secondary-text">{label}</dt>
      <dd className="m-0 flex min-w-0 flex-wrap gap-1.5">
        {related.length ? related.map((item) => renderRelationMember(item)) : <span className="pt-1 text-xs text-secondary-text">{emptyLabel}</span>}
      </dd>
    </div>
  );

  const role = t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || t("admin.role_member") });
  const gender = t(`admin.gender_${member.gender?.toLowerCase() || "unknown"}`, { defaultValue: member.gender || t("admin.gender_unknown") });
  const generationColors = getGenerationColors(member.generation);

  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      maxWidth="full"
      showTitle={false}
      hideCloseButton
      ariaLabel={formatName(member.fullName) || t("admin.member_profile")}
      className="!max-h-[calc(100vh-24px)] sm:!max-h-[calc(100vh-40px)]"
    >
      <div className="space-y-4">
        <header className="flex min-w-0 items-start gap-3 border-b border-custom-border pb-4 sm:items-center sm:gap-4">
          <MemberAvatarImage
            member={member}
            alt={formatName(member.fullName)}
            className="h-[72px] w-[72px] shrink-0 rounded-2xl border border-accent/30 object-cover sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="max-w-full truncate text-xl font-bold leading-tight text-primary-text sm:text-2xl" title={formatName(member.fullName)}>
                {formatName(member.fullName)}
              </h2>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${generationColors.bg} ${generationColors.text} ${generationColors.border}`}>
                {t("admin.generation", { defaultValue: "Đời" })} {member.generation}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-secondary-text" title={`${gender} · ${role}`}>
              {gender} <span aria-hidden="true">·</span> {role}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary-text">
              {member.dateOfBirth && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-accent" />{new Date(member.dateOfBirth).toLocaleDateString(dateLocale)}</span>}
              {member.address && <span className="inline-flex min-w-0 max-w-full items-center gap-1.5"><MapPin size={13} className="shrink-0 text-accent" /><span className="line-clamp-1 break-all">{member.address}</span></span>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => { onClose(); onEdit(member); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-custom-border bg-secondary-bg px-2.5 py-2 text-xs font-semibold text-primary-text transition-colors hover:border-accent/50 hover:bg-primary-bg    sm:px-3"
            >
              <Edit2 size={14} aria-hidden="true" /><span className="hidden sm:inline">{t("admin.edit_info", { defaultValue: "Chỉnh sửa" })}</span><span className="sm:hidden">{t("admin.edit", { defaultValue: "Sửa" })}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.close", { defaultValue: "Đóng" })}
              className="rounded-xl p-2 text-secondary-text transition-colors hover:bg-primary-bg hover:text-primary-text   "
            >
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <section className="min-w-0 rounded-2xl border border-custom-border bg-primary-bg/45 p-3.5 sm:p-4">
            <SectionTitle icon={<UsersRound size={16} />}>{t("admin.profile_family", { defaultValue: "Gia đình" })}</SectionTitle>
            <dl className="m-0">
              {renderRelationGroup(t("admin.parents", { defaultValue: "Cha / Mẹ" }).replace(/[:：]$/, ""), [father, mother].filter((m): m is FamilyMember => Boolean(m)))}
              {renderRelationGroup(t("admin.field_spouse", { defaultValue: "Vợ/Chồng" }), spouse ? [spouse] : [])}
              {renderRelationGroup(t("admin.children", { defaultValue: "Con cái" }).replace(/ liên kết:$/, ""), children)}
              <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-2 border-b border-custom-border/60 py-2 last:border-0">
                <dt className="pt-1 text-[10px] font-bold uppercase tracking-wide text-secondary-text">{t("admin.siblings_biological_group")}</dt>
                <dd className="m-0 flex min-w-0 flex-wrap gap-1.5">
                  {ruotSiblings.length ? ruotSiblings.map(s => renderRelationMember(s, getSiblingLabel(s, 'biological'))) : <span className="pt-1 text-xs text-secondary-text">{t("admin.siblings_biological_empty")}</span>}
                </dd>
              </div>
              <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-2 py-2">
                <dt className="pt-1 text-[10px] font-bold uppercase tracking-wide text-secondary-text">{t("admin.siblings_cousin_group")}</dt>
                <dd className="m-0 flex min-w-0 flex-wrap gap-1.5">
                  {hoSiblings.length ? hoSiblings.map(s => renderRelationMember(s, getSiblingLabel(s, 'cousin'))) : <span className="pt-1 text-xs text-secondary-text">{t("admin.siblings_cousin_empty")}</span>}
                </dd>
              </div>
            </dl>
          </section>

          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-custom-border bg-primary-bg/45 p-3.5 sm:p-4">
              <SectionTitle icon={<BookOpen size={16} />}>{t("admin.biography", { defaultValue: "Tiểu sử & Cuộc đời" })}</SectionTitle>
              {member.biography?.trim()
                ? <p className="m-0 whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary-text">{member.biography}</p>
                : <p className="m-0 text-xs text-secondary-text">{empty}</p>}
            </section>

            <section className="rounded-2xl border border-custom-border bg-primary-bg/45 p-3.5 sm:p-4">
              <SectionTitle icon={<Phone size={15} />}>{t("admin.profile_contact", { defaultValue: "Liên hệ" })}</SectionTitle>
              <dl className="m-0 space-y-2">
                <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] items-start gap-2">
                  <dt className="text-xs text-secondary-text">{t("admin.field_phone", { defaultValue: "Điện thoại" })}</dt>
                  <dd className="m-0 break-words text-xs text-primary-text">{member.phoneNumber ? <a href={`tel:${member.phoneNumber}`} className="hover:text-accent hover:underline">{member.phoneNumber}</a> : empty}</dd>
                </div>
                <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] items-start gap-2">
                  <dt className="text-xs text-secondary-text">Facebook</dt>
                  <dd className="m-0 min-w-0 text-xs text-primary-text">{member.facebookUrl
                    ? <a href={member.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-accent hover:underline"><FacebookIcon className="shrink-0" /><span className="truncate">{member.facebookUrl}</span><ExternalLink size={11} className="shrink-0" /></a>
                    : empty}</dd>
                </div>
                <div className="grid grid-cols-[6.75rem_minmax(0,1fr)] items-start gap-2">
                  <dt className="text-xs text-secondary-text">{t("admin.field_address", { defaultValue: "Địa chỉ" })}</dt>
                  <dd className="m-0 break-words text-xs text-primary-text">{member.address || empty}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
};
