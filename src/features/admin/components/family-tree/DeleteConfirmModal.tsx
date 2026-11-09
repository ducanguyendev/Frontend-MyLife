import React from "react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { ConfirmDialog } from "@/shared/components/ui";
import { type FamilyMember, removeVietnameseTones } from "./types";

interface DeleteConfirmModalProps {
  member: FamilyMember | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  member,
  isDeleting,
  onClose,
  onConfirm,
}) => {
  const { t, language } = useLanguage();

  if (!member) return null;

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  return <ConfirmDialog isOpen={!!member} title={t('admin.delete_confirm_title')} busy={isDeleting} confirmLabel={t('admin.delete_forever')} cancelLabel={t('admin.cancel')} onClose={onClose} onConfirm={onConfirm}>
    {t('admin.delete_confirm_desc')} <strong className="text-primary-text">{formatName(member.fullName)}</strong>
  </ConfirmDialog>;
};
