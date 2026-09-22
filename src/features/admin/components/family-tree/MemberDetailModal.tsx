import React from "react";
import {
  CalendarDays, MapPin, Phone, ExternalLink, BookOpen, Edit2
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Modal, Button, Badge } from "@/shared/components/ui";
import { type FamilyMember, getMemberAvatar, removeVietnameseTones, getGenerationColors } from "./types";

const FacebookIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
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

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  members,
  onClose,
  onEdit,
  onView,
}) => {
  const { t, language } = useLanguage();

  if (!member) return null;

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  const father = members.find((m) => m.id === member.fatherId);
  const mother = members.find((m) => m.id === member.motherId);
  const spouse = members.find((m) => m.id === member.spouseId);
  const children = members.filter(
    (m) => m.fatherId === member.id || m.motherId === member.id || member.childIds?.includes(m.id)
  );
  
  // Anh/chị/em ruột: Cùng cha hoặc cùng mẹ (khác chính mình)
  const ruotSiblings = members.filter(
    (m) =>
      m.id !== member.id &&
      ((member.fatherId && m.fatherId === member.fatherId) ||
        (member.motherId && m.motherId === member.motherId))
  );

  // Anh/chị/em họ: Dựa trên horizontalRelations (nếu có)
  const explicitSiblingIds = (member.horizontalRelations || [])
    .filter(r => r.relationType === "sibling")
    .map(r => r.memberId);

  const hoSiblings = members.filter(
    (m) =>
      m.id !== member.id &&
      !ruotSiblings.find(s => s.id === m.id) &&
      explicitSiblingIds.includes(m.id)
  );

  const getSiblingRole = (sibling: FamilyMember, current: FamilyMember) => {
    if (!sibling.dateOfBirth || !current.dateOfBirth) return "";
    const sibDate = new Date(sibling.dateOfBirth);
    const currDate = new Date(current.dateOfBirth);
    if (sibDate < currDate) {
      return sibling.gender?.toLowerCase() === "nữ" ? "Chị" : "Anh";
    } else if (sibDate > currDate) {
      return sibling.gender?.toLowerCase() === "nữ" ? "Em gái" : "Em trai";
    }
    return "";
  };

  const renderMemberLink = (m: FamilyMember, rolePrefix?: string) => (
    <button
      type="button"
      onClick={() => onView(m)}
      className="text-accent hover:underline cursor-pointer inline-flex items-center gap-1 focus:outline-none"
    >
      {rolePrefix && <span className="text-secondary-text text-xs mr-1">[{rolePrefix}]</span>}
      {formatName(m.fullName)}
    </button>
  );

  const renderParents = () => {
    const p = [];
    if (father) p.push(father);
    if (mother) p.push(mother);
    if (p.length === 0) return <span className="text-sm font-semibold text-primary-text">{t("admin.none", { defaultValue: "Chưa có liên kết" })}</span>;
    return (
      <div className="flex flex-wrap items-center gap-2">
        {p.map((parent) => (
          <div key={parent.id} className="bg-secondary-bg px-3 py-1.5 rounded-lg border border-custom-border flex items-center shadow-sm">
            {renderMemberLink(parent)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      maxWidth="2xl"
      title={t("admin.member_detail_title", { defaultValue: "Hồ Sơ Thành Viên Dòng Họ" })}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {t("admin.close", { defaultValue: "Đóng" })}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Edit2 size={16} />}
            onClick={() => {
              onClose();
              onEdit(member);
            }}
          >
            {t("admin.edit_info", { defaultValue: "Chỉnh Sửa Thông Tin" })}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-primary-bg/60 p-5 rounded-2xl border border-custom-border">
          <img
            src={getMemberAvatar(member)}
            alt={formatName(member.fullName)}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-accent/40 shadow-md shrink-0"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getGenerationColors(member.generation).bg} ${getGenerationColors(member.generation).text} ${getGenerationColors(member.generation).border}`}
              >
                {t("admin.generation", { defaultValue: "Đời thứ" })} {member.generation}
              </span>
              <Badge variant="outline">
                {t(`admin.gender_${member.gender?.toLowerCase() || "unknown"}`, { defaultValue: member.gender || "Không rõ" })}
              </Badge>
              <span className="text-xs text-secondary-text font-medium">
                • {t(`admin.role_${member.role?.toLowerCase() || "member"}`, { defaultValue: member.role || "Thành viên" })}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-primary-text mb-2">
              {formatName(member.fullName)}
            </h3>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
              {member.dateOfBirth && (
                <div className="flex items-center gap-1.5 text-xs text-secondary-text bg-secondary-bg px-3 py-1.5 rounded-xl border border-custom-border">
                  <CalendarDays size={14} className="text-accent" />
                  <span>{new Date(member.dateOfBirth).toLocaleDateString("vi-VN")}</span>
                </div>
              )}
              {member.address && (
                <div className="flex items-center gap-1.5 text-xs text-secondary-text bg-secondary-bg px-3 py-1.5 rounded-xl border border-custom-border">
                  <MapPin size={14} className="text-amber-500" />
                  <span>{member.address}</span>
                </div>
              )}
              {member.phoneNumber && (
                <div className="flex items-center gap-1.5 text-xs text-secondary-text bg-secondary-bg px-3 py-1.5 rounded-xl border border-custom-border">
                  <Phone size={14} className="text-blue-500" />
                  <a href={`tel:${member.phoneNumber}`} className="text-primary-text font-medium hover:underline">
                    {member.phoneNumber}
                  </a>
                </div>
              )}
              {member.facebookUrl && (
                <div className="flex items-center gap-1.5 text-xs text-secondary-text bg-secondary-bg px-3 py-1.5 rounded-xl border border-custom-border">
                  <FacebookIcon className="text-blue-600" />
                  <a href={member.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-medium hover:underline flex items-center gap-1">
                    Facebook <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Family Relations - Stacked Layout */}
        <div className="flex flex-col gap-5 bg-primary-bg/70 p-5 rounded-2xl border border-custom-border">
          {/* Row 1: Parents & Spouse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-secondary-text uppercase mb-1.5">
                {t("admin.parents", { defaultValue: "Cha / Mẹ:" })}
              </h4>
              <div className="text-sm text-primary-text font-semibold">
                {renderParents()}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-secondary-text uppercase mb-1.5">
                {t("admin.field_spouse", { defaultValue: "Vợ / Chồng:" })}
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {spouse ? (
                  <div className="bg-secondary-bg px-3 py-1.5 rounded-lg border border-custom-border flex items-center shadow-sm">
                    {renderMemberLink(spouse)}
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-primary-text">{t("admin.none", { defaultValue: "Chưa có liên kết" })}</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Children */}
          <div>
            <h4 className="text-xs font-bold text-secondary-text uppercase mb-2">
              {t("admin.children", { defaultValue: "Con cái:" })}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {children.length === 0
                ? <span className="text-sm font-semibold text-primary-text">{t("admin.none", { defaultValue: "Chưa có liên kết" })}</span>
                : children.map((c) => (
                    <div key={c.id} className="bg-secondary-bg px-3 py-1.5 rounded-lg border border-custom-border flex items-center shadow-sm">
                      {renderMemberLink(c)}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Row 3: Siblings (Ruột) */}
          <div>
            <h4 className="text-xs font-bold text-secondary-text uppercase mb-2">
              {t("admin.siblings_ruot", { defaultValue: "Anh / Chị / Em Ruột:" })}
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {ruotSiblings.length === 0
                ? <span className="text-sm font-semibold text-primary-text">{t("admin.none", { defaultValue: "Chưa có liên kết" })}</span>
                : ruotSiblings.map((s) => (
                    <div key={s.id} className="bg-secondary-bg px-3 py-1.5 rounded-lg border border-custom-border flex items-center shadow-sm">
                      {renderMemberLink(s, getSiblingRole(s, member))}
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Row 4: Siblings (Họ) */}
          {hoSiblings.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-secondary-text uppercase mb-2">
                {t("admin.siblings_ho", { defaultValue: "Anh / Chị / Em Họ:" })}
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {hoSiblings.map((s) => (
                  <div key={s.id} className="bg-secondary-bg px-3 py-1.5 rounded-lg border border-custom-border flex items-center shadow-sm">
                    {renderMemberLink(s, getSiblingRole(s, member))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Biography */}
        {member.biography && (
          <div>
            <h4 className="text-sm font-bold text-accent flex items-center gap-2 mb-2">
              <BookOpen size={16} />
              {t("admin.biography", { defaultValue: "Tiểu sử & Cuộc đời" })}
            </h4>
            <div className="bg-primary-bg/70 p-4 rounded-2xl border border-custom-border text-xs text-secondary-text leading-relaxed italic">
              "{member.biography}"
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
