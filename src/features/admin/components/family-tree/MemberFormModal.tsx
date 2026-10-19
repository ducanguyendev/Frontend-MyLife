import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Users, Phone, FileText, X, ImagePlus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { apiClient } from "@/shared/api/apiClient";
import {
  Modal,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  DateInput,
  formatBackendToDob,
  formatDobToBackend,
  validateDob,
} from "@/shared/components/ui";
import { type FamilyMember, type Generation, removeVietnameseTones } from "./types";
import { getSiblingKind, isBiologicalSibling } from "./siblingRelations";
import { MemberAvatarImage } from "./MemberAvatarImage";
import { FamilyRelationSelect } from "./FamilyRelationSelect";
import { FamilyMemberPicker } from "./FamilyMemberPicker";
import { GoogleAddressAutocomplete } from "@/shared/components/GoogleAddressAutocomplete";

interface MemberFormModalProps {
  isOpen: boolean;
  editingMember: Partial<FamilyMember> | null;
  members: FamilyMember[];
  isSaving: boolean;
  onClose: () => void;
  onChange: (updated: Partial<FamilyMember>) => void;
  onSubmit: (e: React.FormEvent) => void;
  pendingAvatar: File | null;
  onPendingAvatarChange: (file: File | null) => void;
  hasAvatar: boolean;
  removeAvatar: boolean;
  onRemoveAvatarChange: (value: boolean) => void;
}

interface FormErrors {
  fullName?: string;
  role?: string;
  generation?: string;
  lifeStatus?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  deathDate?: string;
  facebookUrl?: string;
  avatarUrl?: string;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  editingMember,
  members,
  isSaving,
  onClose,
  onChange,
  onSubmit,
  pendingAvatar,
  onPendingAvatarChange,
  hasAvatar,
  removeAvatar,
  onRemoveAvatarChange,
}) => {
  const { t, language } = useLanguage();
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingAvatar) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(pendingAvatar); setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingAvatar]);

  // Dynamic generations list loaded from database
  const [generations, setGenerations] = useState<Generation[]>([
    { id: 1, name: "Đời 1", title: "Thế hệ thứ nhất" },
    { id: 2, name: "Đời 2", title: "Thế hệ thứ hai" },
    { id: 3, name: "Đời 3", title: "Thế hệ thứ ba" },
    { id: 4, name: "Đời 4", title: "Thế hệ thứ tư" },
    { id: 5, name: "Đời 5", title: "Thế hệ thứ năm" },
  ]);

  // Collapsible accordion state
  const [openSections, setOpenSections] = useState<string[]>(["bio"]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // Fetch generations from backend database
  useEffect(() => {
    if (!isOpen) return;

    const fetchGenerations = async () => {
      try {
        const json = await apiClient.get<{ success?: boolean; data?: Generation[] }>("/api/family-tree/generations");
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setGenerations(json.data);
        }
      } catch (error) {
        // Retain fallback generations, but do not hide an operational failure.
        console.warn("Unable to load family tree generations.", error);
      }
    };

    void fetchGenerations();
  }, [isOpen]);

  const isUpdate = !!editingMember?.id;

  // Filter potential relatives (cannot select oneself)
  const availableMembers = members.filter((m) => m.id !== editingMember?.id);
  const potentialFathers = availableMembers.filter(
    (m) => m.gender?.toLowerCase() === "nam" || !m.gender
  );
  const potentialMothers = availableMembers.filter(
    (m) => m.gender?.toLowerCase() === "nữ" || !m.gender
  );
  const potentialSpouses = availableMembers;

  // Available members to select as children (exclude self, parents, spouse, and already added children)
  const selectedChildIds = useMemo(() => new Set(editingMember?.childIds || []), [editingMember?.childIds]);
  const availableForChildren = availableMembers.filter(
    (m) =>
      m.id !== editingMember?.id &&
      m.id !== editingMember?.fatherId &&
      m.id !== editingMember?.motherId &&
      m.id !== editingMember?.spouseId &&
      !selectedChildIds.has(m.id)
  );

  const selectedChildren = useMemo(() => {
    return (editingMember?.childIds || [])
      .map((cid) => members.find((m) => m.id === cid))
      .filter(Boolean) as FamilyMember[];
  }, [editingMember?.childIds, members]);

  const handleAddChild = (childId: number) => {
    if (!childId || !editingMember) return;
    const current = editingMember.childIds || [];
    if (!current.includes(childId)) {
      onChange({ ...editingMember, childIds: [...current, childId] });
    }
  };

  // Removed early return here to comply with React Hooks rules

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  const handleRemoveChild = (childId: number) => {
    if (!editingMember) return;
    const current = editingMember.childIds || [];
    onChange({ ...editingMember, childIds: current.filter((id) => id !== childId) });
  };

  const siblings = useMemo(() => {
    if (!editingMember) return [];
    const siblingById = new Map<number, { member: FamilyMember; kind: "biological" | "cousin" }>();
    for (const member of members) {
      if (member.id !== editingMember.id && isBiologicalSibling(editingMember, member)) {
        siblingById.set(member.id, { member, kind: "biological" });
      }
    }
    for (const relation of editingMember.horizontalRelations || []) {
      if (relation.relationType?.trim().toLowerCase() !== "sibling") continue;
      const member = members.find((candidate) => candidate.id === relation.memberId);
      if (!member || member.id === editingMember.id) continue;
      const kind = getSiblingKind(editingMember as FamilyMember, member);
      if (kind) siblingById.set(member.id, { member, kind });
    }
    return [...siblingById.values()];
  }, [editingMember, members]);

  const selectedSiblingIds = new Set(siblings.map(({ member }) => member.id));
  const availableForSiblings = members.filter(
    (m) =>
      m.id !== editingMember?.id &&
      m.id !== editingMember?.fatherId &&
      m.id !== editingMember?.motherId &&
      m.id !== editingMember?.spouseId &&
      !selectedSiblingIds.has(m.id) &&
      !isBiologicalSibling(editingMember || {}, m)
  );

  const handleAddSibling = (siblingId: number) => {
    if (!siblingId || !editingMember) return;
    const current = editingMember.horizontalRelations || [];
    const selectedMember = members.find(member => member.id === siblingId);
    if (!selectedMember || isBiologicalSibling(editingMember, selectedMember)) return;
    if (!current.find((r) => r.memberId === siblingId && r.relationType?.trim().toLowerCase() === "sibling")) {
      onChange({
        ...editingMember,
        horizontalRelations: [...current, { memberId: siblingId, relationType: "sibling" }],
      });
    }
  };

  const handleRemoveSibling = (siblingId: number) => {
    if (!editingMember) return;
    const current = editingMember.horizontalRelations || [];
    onChange({
      ...editingMember,
      horizontalRelations: current.filter((r) => !(r.memberId === siblingId && r.relationType?.trim().toLowerCase() === "sibling")),
    });
  };

  // Chặn nhập ký tự không phải chữ vào ô Họ và Tên
  const handleFullNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[\p{L}\s]$/u.test(e.key)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        fullName: "common.registerPage.errors.nameSpecialChars",
      }));
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingMember) return;
    const val = e.target.value;
    if (!/^[\p{L}\s]*$/u.test(val)) {
      setErrors((prev) => ({
        ...prev,
        fullName: "common.registerPage.errors.nameSpecialChars",
      }));
      const cleaned = val.replace(/[^\p{L}\s]/gu, "").slice(0, 50);
      onChange({ ...editingMember, fullName: cleaned });
      return;
    }
    onChange({ ...editingMember, fullName: val.slice(0, 50) });
    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handleFullNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!editingMember) return;
    const pasteData = e.clipboardData.getData("text");
    if (!/^[\p{L}\s]*$/u.test(pasteData)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        fullName: "common.registerPage.errors.nameSpecialChars",
      }));
      const cleaned = pasteData.replace(/[^\p{L}\s]/gu, "");
      onChange({ ...editingMember, fullName: ((editingMember.fullName || "") + cleaned).slice(0, 50) });
    }
  };

  // Chặn nhập ký tự không phải số vào ô Số Điện Thoại
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "common.registerPage.errors.phoneDigitsOnly",
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingMember) return;
    const val = e.target.value;
    if (/[^0-9]/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "common.registerPage.errors.phoneDigitsOnly",
      }));
      const cleaned = val.replace(/[^0-9]/g, "").slice(0, 10);
      onChange({ ...editingMember, phoneNumber: cleaned });
      return;
    }
    onChange({ ...editingMember, phoneNumber: val.slice(0, 10) });
    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!editingMember) return;
    const pasteData = e.clipboardData.getData("text");
    if (/[^0-9]/.test(pasteData)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        phoneNumber: "common.registerPage.errors.phoneDigitsOnly",
      }));
      const cleaned = pasteData.replace(/[^0-9]/g, "").slice(0, 10);
      onChange({ ...editingMember, phoneNumber: ((editingMember.phoneNumber || "") + cleaned).slice(0, 10) });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    const newErrors: FormErrors = {};
    let sectionToOpen = "";

    // 1. Họ và tên (Bắt buộc, 2-50 ký tự, không chứa số hoặc ký tự đặc biệt)
    const trimmedName = (editingMember.fullName || "").trim();
    if (!trimmedName) {
      newErrors.fullName = "common.registerPage.errors.nameRequired";
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.fullName = "common.registerPage.errors.nameLength";
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (!/^[\p{L}\s]+$/u.test(trimmedName)) {
      newErrors.fullName = "common.registerPage.errors.nameSpecialChars";
      if (!sectionToOpen) sectionToOpen = "basic";
    }

    // 2. Vai trò trong tộc (Bắt buộc, 2-50 ký tự)
    const trimmedRole = (editingMember.role || "").trim();
    if (!trimmedRole) {
      newErrors.role = "admin.error_role_required";
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (trimmedRole.length < 2 || trimmedRole.length > 50) {
      newErrors.role = "admin.error_role_length";
      if (!sectionToOpen) sectionToOpen = "basic";
    }

    if (!Number.isInteger(editingMember.generation) || Number(editingMember.generation) < 1) {
      newErrors.generation = 'admin.select_generation_error';
      if (!sectionToOpen) sectionToOpen = 'basic';
    }

    // 3. Số điện thoại (Nếu nhập thì phải đúng 10 số bắt đầu bằng 03, 05, 07, 08, 09)
    const phone = (editingMember.phoneNumber || "").trim().replace(/\s+/g, "");
    if (phone && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
      newErrors.phoneNumber = "common.registerPage.errors.phoneInvalid";
      if (!sectionToOpen) sectionToOpen = "contact";
    }

    // 4. Ngày sinh (Định dạng DD/MM/YYYY hợp lệ, không trong tương lai)
    const rawDob = (editingMember.dateOfBirth || "").trim();
    if (rawDob) {
      const formatted = rawDob.includes("-") ? formatBackendToDob(rawDob) : rawDob;
      const dobResult = validateDob(formatted, 0, 200, {
        required: 'common.registerPage.dobValidation.required', format: 'common.registerPage.dobValidation.format',
        invalid: 'common.registerPage.dobValidation.invalid', invalidMonth: 'common.registerPage.dobValidation.invalidMonth',
        invalidDay: 'common.registerPage.dobValidation.invalidDay', futureDate: 'common.registerPage.dobValidation.futureDate',
        dayNotExist: () => 'common.registerPage.dobValidation.invalid',
        minAge: () => 'common.registerPage.dobValidation.invalid',
        maxAge: () => 'common.registerPage.dobValidation.invalid',
      });
      if (!dobResult.valid) {
        newErrors.dateOfBirth = dobResult.error;
        if (!sectionToOpen) sectionToOpen = "basic";
      }
    }

    const lifeStatus = editingMember.lifeStatus;
    if (lifeStatus !== "LIVING" && lifeStatus !== "DECEASED") {
      newErrors.lifeStatus = "admin.member_life_status.invalid_status";
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (lifeStatus === "DECEASED") {
      const rawDeathDate = (editingMember.deathDate || "").trim();
      if (!rawDeathDate) {
        newErrors.deathDate = "admin.member_life_status.death_date_required";
        if (!sectionToOpen) sectionToOpen = "basic";
      } else {
        const deathDate = rawDeathDate.includes("-") ? rawDeathDate : formatDobToBackend(rawDeathDate);
        const dob = rawDob.includes("-") ? rawDob : formatDobToBackend(rawDob);
        const dateIsValid = Boolean(deathDate && /^\d{4}-\d{2}-\d{2}$/.test(deathDate) && !Number.isNaN(Date.parse(`${deathDate}T00:00:00Z`)) && new Date(`${deathDate}T00:00:00Z`).toISOString().slice(0, 10) === deathDate);
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        if (!dateIsValid) {
          newErrors.deathDate = "admin.member_life_status.death_date_required";
        } else if (deathDate! > today) {
          newErrors.deathDate = "admin.member_life_status.death_date_future";
        } else if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob) && deathDate! < dob) {
          newErrors.deathDate = "admin.member_life_status.death_before_birth";
        }
        if (newErrors.deathDate && !sectionToOpen) sectionToOpen = "basic";
      }
    }

    // 5. Facebook URL
    const fb = (editingMember.facebookUrl || "").trim();
    if (fb && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(fb) && !fb.startsWith("https://")) {
      newErrors.facebookUrl = "admin.error_facebook_url";
      if (!sectionToOpen) sectionToOpen = "contact";
    }

    // 6. Link ảnh Avatar
    // Avatar files are validated before preview and again at the API boundary.

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (sectionToOpen) {
        setOpenSections((prev) => prev.includes(sectionToOpen) ? prev : [...prev, sectionToOpen]);
      }
      return;
    }

    setErrors({});
    onSubmit(e);
  };

  if (!isOpen || !editingMember) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      showTitle={false}
      ariaLabel={isUpdate
        ? t("admin.edit_member", { defaultValue: "Cập nhật thông tin thành viên" })
        : t("admin.add_new_member", { defaultValue: "Thêm thành viên mới" })}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={onClose}
          >
            {t("admin.cancel", { defaultValue: "Hủy bỏ" })}
          </Button>
          <Button
            type="submit"
            form="familyForm"
            variant="primary"
            isLoading={isSaving}
          >
            {isUpdate
              ? t("admin.save_changes", { defaultValue: "Lưu thay đổi" })
              : t("admin.create_member", { defaultValue: "Thêm thành viên" })}
          </Button>
        </div>
      }
    >
      <form id="familyForm" onSubmit={handleFormSubmit} noValidate className="space-y-4">
        {/* ========================================================= */}
        {/* KHỐI 1: ẢNH ĐẠI DIỆN & TIỂU SỬ */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
            aria-expanded={openSections.includes("bio")}
            onClick={() => toggleSection("bio")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-secondary-bg/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <ImagePlus size={16} />
              </div>
              <span className="font-semibold text-sm text-primary-text">
                {t("admin.section_avatar_bio", { defaultValue: "Ảnh đại diện & Tiểu sử" })}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-secondary-text transition-transform duration-200 ${
                openSections.includes("bio") ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.includes("bio") && (
              <motion.div
                key="bio-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-1 border-t border-custom-border/40 space-y-3.5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary-text">{t("admin.member_avatar_label")}</label>
                    <div className="flex items-center gap-3">
                      {!removeAvatar && <MemberAvatarImage member={editingMember as FamilyMember} sourceOverride={previewUrl} alt={editingMember.fullName || ""} className="h-16 w-16 rounded-xl object-cover border border-custom-border" />}
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-xl border border-custom-border px-3 py-2 text-sm cursor-pointer hover:bg-primary-bg">
                          <ImagePlus size={16} /> {t("admin.member_avatar_choose")}
                          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={isSaving} onChange={event => {
                            const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (!file) return;
                            if (!["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
                              onPendingAvatarChange(null); onRemoveAvatarChange(false);
                              setErrors(prev => ({ ...prev, avatarUrl: "admin.member_avatar_errors.invalid_file" }));
                              setOpenSections((prev) => prev.includes("bio") ? prev : [...prev, "bio"]);
                              return;
                            }
                            setErrors(prev => ({ ...prev, avatarUrl: undefined })); onRemoveAvatarChange(false); onPendingAvatarChange(file);
                          }} />
                        </label>
                        {(hasAvatar || pendingAvatar) && <button type="button" disabled={isSaving} onClick={() => { onPendingAvatarChange(null); onRemoveAvatarChange(hasAvatar); }} className="inline-flex items-center gap-2 rounded-xl border border-custom-border px-3 py-2 text-sm text-error"><Trash2 size={16} />{t("admin.member_avatar_remove")}</button>}
                      </div>
                    </div>
                    {errors.avatarUrl && <p role="alert" className="text-xs text-error">{t(errors.avatarUrl)}</p>}
                  </div>
                  {/* Tiểu sử */}
                  <Textarea
                    label={t("admin.field_biography", { defaultValue: "Tiểu sử & Ghi chú cuộc đời" })}
                    rows={3}
                    value={editingMember.biography || ""}
                    onChange={(e) => onChange({ ...editingMember, biography: e.target.value })}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* KHỐI 2: THÔNG TIN CƠ BẢN */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
            aria-expanded={openSections.includes("basic")}
            onClick={() => toggleSection("basic")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-secondary-bg/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="font-semibold text-sm text-primary-text">
                {t("admin.section_basic_info", { defaultValue: "Thông tin cơ bản" })}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-secondary-text transition-transform duration-200 ${
                openSections.includes("basic") ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.includes("basic") && (
              <motion.div
                key="basic-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-1 border-t border-custom-border/40 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Họ và tên * */}
                  <Input
                    required
                    maxLength={50}
                    label={t("admin.field_fullname", { defaultValue: "Họ và tên *" })}
                    value={editingMember.fullName || ""}
                    error={errors.fullName ? t(errors.fullName) : undefined}
                    onKeyDown={handleFullNameKeyDown}
                    onChange={handleFullNameChange}
                    onPaste={handleFullNamePaste}
                  />

                  {/* Thế hệ (Đời thứ) * - Lấy động từ bảng database generations */}
                  <Select
                    required
                    appearance="simple"
                    label={t("admin.field_generation", { defaultValue: "Thế hệ (Đời thứ)" })}
                    value={editingMember.generation == null ? undefined : String(editingMember.generation)}
                    floatingLabel
                    error={errors.generation ? t(errors.generation) : undefined}
                    onValueChange={(value) => {
                      onChange({ ...editingMember, generation: Number(value) });
                      if (errors.generation) setErrors((prev) => ({ ...prev, generation: undefined }));
                    }}
                  >
                    {generations.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {t("admin.generation_option", { generation: g.id, defaultValue: `Đời ${g.id} (Thế hệ thứ ${g.id})` })}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Vai trò trong tộc * */}
                  <Input
                    required
                    label={t("admin.field_role", { defaultValue: "Vai trò *" })}
                    value={editingMember.role || ""}
                    error={errors.role ? t(errors.role) : undefined}
                    onChange={(e) => {
                      onChange({ ...editingMember, role: e.target.value });
                      if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                    }}
                  />

                  {/* Giới tính */}
                  <Select
                    appearance="simple"
                    label={t("admin.field_gender", { defaultValue: "Giới tính" })}
                    value={editingMember.gender || undefined}
                    floatingLabel
                    onValueChange={(value) => onChange({ ...editingMember, gender: value })}
                  >
                    <SelectItem value="Nam">{t("admin.gender_nam", { defaultValue: "Nam" })}</SelectItem>
                    <SelectItem value="Nữ">{t("admin.gender_nu", { defaultValue: "Nữ" })}</SelectItem>
                    <SelectItem value="Khác">{t("admin.gender_khac", { defaultValue: "Khác" })}</SelectItem>
                  </Select>

                  {/* Ngày sinh */}
                  <div>
                    <DateInput
                      disableFuture
                      label={t("admin.field_dob", { defaultValue: "Ngày sinh" })}
                      value={
                        editingMember.dateOfBirth
                          ? editingMember.dateOfBirth.includes("-")
                            ? formatBackendToDob(editingMember.dateOfBirth)
                            : editingMember.dateOfBirth
                          : ""
                      }
                      error={errors.dateOfBirth ? t(errors.dateOfBirth) : undefined}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const backend = formatDobToBackend(raw);
                        onChange({ ...editingMember, dateOfBirth: backend || raw });
                        if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                      }}
                    />
                  </div>
                  <Select
                    appearance="simple"
                    label={t("admin.member_life_status.label")}
                    value={editingMember.lifeStatus || undefined}
                    floatingLabel
                    required
                    error={errors.lifeStatus ? t(errors.lifeStatus) : undefined}
                    onValueChange={(value) => {
                      const lifeStatus = value === "DECEASED" ? "DECEASED" : "LIVING";
                      onChange({ ...editingMember, lifeStatus, deathDate: lifeStatus === "LIVING" ? null : editingMember.deathDate ?? null });
                      if (errors.lifeStatus || errors.deathDate) setErrors((prev) => ({ ...prev, lifeStatus: undefined, deathDate: undefined }));
                    }}
                  >
                    <SelectItem value="LIVING">{t("admin.member_life_status.living")}</SelectItem>
                    <SelectItem value="DECEASED">{t("admin.member_life_status.deceased")}</SelectItem>
                  </Select>
                  {editingMember.lifeStatus === "DECEASED" && <div className="md:col-span-2">
                    <DateInput
                      disableFuture
                      label={t("admin.member_life_status.death_date")}
                      value={editingMember.deathDate ? (editingMember.deathDate.includes("-") ? formatBackendToDob(editingMember.deathDate) : editingMember.deathDate) : ""}
                      error={errors.deathDate ? t(errors.deathDate) : undefined}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const backend = formatDobToBackend(raw);
                        onChange({ ...editingMember, deathDate: backend || raw });
                        if (errors.deathDate) setErrors((prev) => ({ ...prev, deathDate: undefined }));
                      }}
                    />
                  </div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* KHỐI 3: QUAN HỆ GIA ĐÌNH & CON CÁI */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
            aria-expanded={openSections.includes("relations")}
            onClick={() => toggleSection("relations")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-secondary-bg/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Users size={16} />
              </div>
              <span className="font-semibold text-sm text-primary-text">
                {t("admin.section_family_relations", { defaultValue: "Quan hệ gia đình & Con cái" })}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-secondary-text transition-transform duration-200 ${
                openSections.includes("relations") ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.includes("relations") && (
              <motion.div
                key="relations-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-1 border-t border-custom-border/40 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Cha */}
                  <FamilyRelationSelect
                    label={t("admin.field_father", { defaultValue: "Cha (Bố)" })}
                    value={editingMember.fatherId}
                    options={potentialFathers.map((member) => ({ id: member.id, fullName: formatName(member.fullName), generation: member.generation }))}
                    generationLabel={t("admin.generation_label")}
                    placeholder={t("admin.select_father")}
                    ariaLabel={t("admin.select_father")}
                    onChange={(fatherId) => onChange({ ...editingMember, fatherId })}
                  />

                  {/* Mẹ */}
                  <FamilyRelationSelect
                    label={t("admin.field_mother", { defaultValue: "Mẹ" })}
                    value={editingMember.motherId}
                    options={potentialMothers.map((member) => ({ id: member.id, fullName: formatName(member.fullName), generation: member.generation }))}
                    generationLabel={t("admin.generation_label")}
                    placeholder={t("admin.select_mother")}
                    ariaLabel={t("admin.select_mother")}
                    onChange={(motherId) => onChange({ ...editingMember, motherId })}
                  />

                  {/* Vợ / Chồng */}
                  <div className="md:col-span-2">
                    <FamilyRelationSelect
                      label={t("admin.field_spouse", { defaultValue: "Vợ / Chồng" })}
                      value={editingMember.spouseId}
                      options={potentialSpouses.map((member) => ({ id: member.id, fullName: formatName(member.fullName), generation: member.generation }))}
                      generationLabel={t("admin.generation_label")}
                      placeholder={t("admin.select_spouse")}
                      ariaLabel={t("admin.select_spouse")}
                      onChange={(spouseId) => onChange({ ...editingMember, spouseId })}
                    />
                  </div>

                  {/* Con cái (Children multi-selector) */}
                  <div className="md:col-span-2 space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-secondary-text">
                        {t("admin.field_children", { defaultValue: "Con cái trong dòng tộc" })}
                      </label>
                      <span className="text-[11px] text-accent font-medium">
                        {selectedChildren.length} {t("admin.children_count", { defaultValue: "người con" })}
                      </span>
                    </div>

                    {/* Danh sách con đã chọn */}
                    {selectedChildren.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-primary-bg/70 border border-custom-border/60">
                        {selectedChildren.map((child) => (
                          <span
                            key={child.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-bg text-primary-text text-xs border border-custom-border shadow-xs"
                          >
                            <span className="font-medium">{formatName(child.fullName)}</span>
                            <span className="text-[10px] text-secondary-text px-1 py-0.5 rounded bg-primary-bg">
                              {t("admin.generation", { defaultValue: "Đời" })} {child.generation}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-secondary-text hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
                              title={t("admin.remove", { defaultValue: "Bỏ chọn" })}
                              aria-label={t("admin.remove", { defaultValue: "Bỏ chọn" })}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <FamilyMemberPicker
                      options={availableForChildren.map((member) => ({ id: member.id, fullName: formatName(member.fullName), generation: member.generation, gender: member.gender }))}
                      generationLabel={t("admin.generation_label")}
                      placeholder={t("admin.select_children")}
                      ariaLabel={t("admin.select_children")}
                      emptyMessage={t("admin.no_more_children_available")}
                      onSelect={handleAddChild}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2 pt-2 border-t border-custom-border/40 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-secondary-text">{t("admin.siblings_group")}</label>
                      <span className="text-[11px] text-accent font-medium">{siblings.length} {t("admin.siblings_count", { defaultValue: "người" })}</span>
                    </div>

                    {siblings.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-primary-bg/70 border border-custom-border/60">
                        {siblings.map(({ member: sibling, kind }) => (
                          <span key={sibling.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-bg text-primary-text text-xs border border-custom-border shadow-xs">
                            <span className="font-medium">{formatName(sibling.fullName)}</span>
                            <span className="text-[10px] text-secondary-text px-1 py-0.5 rounded bg-primary-bg">
                              {t("admin.generation_label")} {sibling.generation}
                            </span>
                            {kind === "cousin" && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSibling(sibling.id)}
                                className="text-secondary-text hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
                                title={t("admin.remove", { defaultValue: "Bỏ chọn" })}
                                aria-label={`${t("admin.remove", { defaultValue: "Bỏ chọn" })}: ${formatName(sibling.fullName)}`}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    <FamilyMemberPicker
                      options={availableForSiblings.map((member) => ({ id: member.id, fullName: formatName(member.fullName), generation: member.generation, gender: member.gender }))}
                      generationLabel={t("admin.generation_label")}
                      placeholder={t("admin.select_sibling")}
                      ariaLabel={t("admin.select_sibling")}
                      emptyMessage={t("admin.no_more_siblings_available")}
                      onSelect={handleAddSibling}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* KHỐI 4: THÔNG TIN LIÊN HỆ & NƠI Ở */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
            aria-expanded={openSections.includes("contact")}
            onClick={() => toggleSection("contact")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-secondary-bg/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <Phone size={16} />
              </div>
              <span className="font-semibold text-sm text-primary-text">
                {t("admin.section_contact_address", { defaultValue: "Thông tin liên hệ & Nơi ở" })}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-secondary-text transition-transform duration-200 ${
                openSections.includes("contact") ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSections.includes("contact") && (
              <motion.div
                key="contact-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-1 border-t border-custom-border/40 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Số điện thoại */}
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    label={t("admin.field_phone", { defaultValue: "Số điện thoại" })}
                    value={editingMember.phoneNumber || ""}
                    error={errors.phoneNumber ? t(errors.phoneNumber) : undefined}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handlePhoneChange}
                    onPaste={handlePhonePaste}
                  />

                  {/* Facebook URL */}
                  <Input
                    label={t("admin.field_facebook", { defaultValue: "Facebook URL" })}
                    placeholder="https://facebook.com/..."
                    value={editingMember.facebookUrl || ""}
                    error={errors.facebookUrl ? t(errors.facebookUrl) : undefined}
                    onChange={(e) => {
                      onChange({ ...editingMember, facebookUrl: e.target.value });
                      if (errors.facebookUrl) setErrors((prev) => ({ ...prev, facebookUrl: undefined }));
                    }}
                  />

                  {/* Nơi ở */}
                  <div className="md:col-span-2">
                    <GoogleAddressAutocomplete
                      id="family-member-address"
                      name="address"
                      label={t("admin.field_address", { defaultValue: "Nơi ở hiện tại / Quê quán" })}
                      placeholder={t("admin.address_autocomplete_placeholder", { defaultValue: "Nhập địa chỉ..." })}
                      unavailableMessage={t("admin.address_autocomplete_unavailable", { defaultValue: "Không tải được gợi ý địa chỉ. Bạn vẫn có thể nhập thủ công." })}
                      value={editingMember.address || ""}
                      disabled={isSaving}
                      onChange={(address) => onChange({ ...editingMember, address })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
      </form>
    </Modal>
  );
};
