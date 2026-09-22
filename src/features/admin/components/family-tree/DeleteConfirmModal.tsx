import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Modal, Button } from "@/shared/components/ui";
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

  return (
    <Modal
      isOpen={!!member}
      onClose={onClose}
      maxWidth="sm"
      hideCloseButton
      footer={
        <div className="flex items-center gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1"
          >
            {t("admin.cancel", { defaultValue: "Hủy bỏ" })}
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            leftIcon={<Trash2 size={16} />}
            onClick={onConfirm}
            className="flex-1"
          >
            {t("admin.delete_forever", { defaultValue: "Xóa vĩnh viễn" })}
          </Button>
        </div>
      }
    >
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-4 border border-error/20">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-primary-text mb-2">
          {t("admin.delete_confirm_title", { defaultValue: "Xóa thành viên?" })}
        </h3>
        <p className="text-secondary-text text-sm leading-relaxed">
          {t("admin.delete_confirm_desc", { defaultValue: "Bạn sắp xóa thành viên khỏi gia phả. Hành động này không thể hoàn tác." })}{" "}
          <strong className="text-primary-text">{formatName(member.fullName)}</strong>
        </p>
      </div>
    </Modal>
  );
};
