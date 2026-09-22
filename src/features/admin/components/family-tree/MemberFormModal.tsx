import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Users, Phone, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
  DateInput,
  formatBackendToDob,
  formatDobToBackend,
  validateDob,
} from "@/shared/components/ui";
import { type FamilyMember, type Generation, removeVietnameseTones } from "./types";

const API = import.meta.env.VITE_API_URL || "";

interface MemberFormModalProps {
  isOpen: boolean;
  editingMember: Partial<FamilyMember> | null;
  members: FamilyMember[];
  isSaving: boolean;
  getHeaders?: () => Record<string, string>;
  onClose: () => void;
  onChange: (updated: Partial<FamilyMember>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

interface FormErrors {
  fullName?: string;
  role?: string;
  generation?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  facebookUrl?: string;
  avatarUrl?: string;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  editingMember,
  members,
  isSaving,
  getHeaders,
  onClose,
  onChange,
  onSubmit,
}) => {
  const { t, language } = useLanguage();
  const [errors, setErrors] = useState<FormErrors>({});

  // Dynamic generations list loaded from database
  const [generations, setGenerations] = useState<Generation[]>([
    { id: 1, name: "Đời 1", title: "Thế hệ thứ nhất" },
    { id: 2, name: "Đời 2", title: "Thế hệ thứ hai" },
    { id: 3, name: "Đời 3", title: "Thế hệ thứ ba" },
    { id: 4, name: "Đời 4", title: "Thế hệ thứ tư" },
    { id: 5, name: "Đời 5", title: "Thế hệ thứ năm" },
  ]);

  // Collapsible accordion state (chỉ mở 1 mục tại 1 thời điểm)
  const [openSection, setOpenSection] = useState<string>("basic");

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? "" : section));
  };

  // Fetch generations from backend database
  useEffect(() => {
    if (!isOpen) return;

    const fetchGenerations = async () => {
      try {
        const res = await fetch(`${API}/api/family-tree/generations`, {
          credentials: "include",
          headers: getHeaders ? getHeaders() : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setGenerations(json.data);
          }
        }
      } catch {
        // Retain fallback 5 generations
      }
    };

    fetchGenerations();
  }, [isOpen, getHeaders]);

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

  const handleAddChild = (childId: string) => {
    if (!childId || !editingMember) return;
    const current = editingMember.childIds || [];
    const numId = parseInt(childId, 10);
    if (!current.includes(numId)) {
      onChange({ ...editingMember, childIds: [...current, numId] });
    }
  };

  // Removed early return here to comply with React Hooks rules

  const formatName = (name: string) => {
    if (!name) return "";
    return language === "en" ? removeVietnameseTones(name) : name;
  };

  const handleRemoveChild = (childId: number) => {
    const current = editingMember.childIds || [];
    onChange({ ...editingMember, childIds: current.filter((id) => id !== childId) });
  };

  const selectedSiblings = useMemo(() => {
    return (editingMember?.horizontalRelations || [])
      .filter((r) => r.relationType === "sibling")
      .map((r) => members.find((m) => m.id === r.memberId))
      .filter(Boolean) as FamilyMember[];
  }, [editingMember?.horizontalRelations, members]);

  const availableForSiblings = availableMembers.filter(
    (m) =>
      m.id !== editingMember?.id &&
      m.id !== editingMember?.fatherId &&
      m.id !== editingMember?.motherId &&
      m.id !== editingMember?.spouseId &&
      !selectedSiblings.find((s) => s.id === m.id)
  );

  const handleAddSibling = (siblingId: string) => {
    if (!siblingId || !editingMember) return;
    const current = editingMember.horizontalRelations || [];
    if (!current.find((r) => r.memberId.toString() === siblingId && r.relationType === "sibling")) {
      onChange({
        ...editingMember,
        horizontalRelations: [...current, { memberId: parseInt(siblingId), relationType: "sibling" }],
      });
    }
  };

  const handleRemoveSibling = (siblingId: number) => {
    const current = editingMember.horizontalRelations || [];
    onChange({
      ...editingMember,
      horizontalRelations: current.filter((r) => !(r.memberId === siblingId && r.relationType === "sibling")),
    });
  };

  // Chặn nhập ký tự không phải chữ vào ô Họ và Tên
  const handleFullNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[\p{L}\s]$/u.test(e.key)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        fullName: t("common.registerPage.errors.nameSpecialChars", {
          defaultValue: "Họ và tên không được chứa số hoặc ký tự đặc biệt.",
        }),
      }));
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[\p{L}\s]*$/u.test(val)) {
      setErrors((prev) => ({
        ...prev,
        fullName: t("common.registerPage.errors.nameSpecialChars", {
          defaultValue: "Họ và tên không được chứa số hoặc ký tự đặc biệt.",
        }),
      }));
      const cleaned = val.replace(/[^\p{L}\s]/gu, "").slice(0, 50);
      onChange({ ...editingMember, fullName: cleaned });
      return;
    }
    onChange({ ...editingMember, fullName: val.slice(0, 50) });
    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
  };

  const handleFullNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text");
    if (!/^[\p{L}\s]*$/u.test(pasteData)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        fullName: t("common.registerPage.errors.nameSpecialChars", {
          defaultValue: "Họ và tên không được chứa số hoặc ký tự đặc biệt.",
        }),
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
        phoneNumber: t("common.registerPage.errors.phoneDigitsOnly", {
          defaultValue: "Số điện thoại chỉ được chứa các chữ số (0-9).",
        }),
      }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) {
      setErrors((prev) => ({
        ...prev,
        phoneNumber: t("common.registerPage.errors.phoneDigitsOnly", {
          defaultValue: "Số điện thoại chỉ được chứa các chữ số (0-9).",
        }),
      }));
      const cleaned = val.replace(/[^0-9]/g, "").slice(0, 10);
      onChange({ ...editingMember, phoneNumber: cleaned });
      return;
    }
    onChange({ ...editingMember, phoneNumber: val.slice(0, 10) });
    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData("text");
    if (/[^0-9]/.test(pasteData)) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        phoneNumber: t("common.registerPage.errors.phoneDigitsOnly", {
          defaultValue: "Số điện thoại chỉ được chứa các chữ số (0-9).",
        }),
      }));
      const cleaned = pasteData.replace(/[^0-9]/g, "").slice(0, 10);
      onChange({ ...editingMember, phoneNumber: ((editingMember.phoneNumber || "") + cleaned).slice(0, 10) });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};
    let sectionToOpen = "";

    // 1. Họ và tên (Bắt buộc, 2-50 ký tự, không chứa số hoặc ký tự đặc biệt)
    const trimmedName = (editingMember.fullName || "").trim();
    if (!trimmedName) {
      newErrors.fullName = t("common.registerPage.errors.nameRequired", {
        defaultValue: "Vui lòng nhập họ và tên.",
      });
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.fullName = t("common.registerPage.errors.nameLength", {
        defaultValue: "Họ và tên phải có độ dài từ 2 đến 50 ký tự.",
      });
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (!/^[\p{L}\s]+$/u.test(trimmedName)) {
      newErrors.fullName = t("common.registerPage.errors.nameSpecialChars", {
        defaultValue: "Họ và tên không được chứa số hoặc ký tự đặc biệt.",
      });
      if (!sectionToOpen) sectionToOpen = "basic";
    }

    // 2. Vai trò trong tộc (Bắt buộc, 2-50 ký tự)
    const trimmedRole = (editingMember.role || "").trim();
    if (!trimmedRole) {
      newErrors.role = t("admin.error_role_required", {
        defaultValue: "Vai trò không được để trống.",
      });
      if (!sectionToOpen) sectionToOpen = "basic";
    } else if (trimmedRole.length < 2 || trimmedRole.length > 50) {
      newErrors.role = t("admin.error_role_length", {
        defaultValue: "Vai trò phải có độ dài từ 2 đến 50 ký tự.",
      });
      if (!sectionToOpen) sectionToOpen = "basic";
    }

    // 3. Số điện thoại (Nếu nhập thì phải đúng 10 số bắt đầu bằng 03, 05, 07, 08, 09)
    const phone = (editingMember.phoneNumber || "").trim().replace(/\s+/g, "");
    if (phone && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone)) {
      newErrors.phoneNumber = t("common.registerPage.errors.phoneInvalid", {
        defaultValue: "Số điện thoại không hợp lệ (10 chữ số bắt đầu bằng 03, 05, 07, 08, 09).",
      });
      if (!sectionToOpen) sectionToOpen = "contact";
    }

    // 4. Ngày sinh (Định dạng DD/MM/YYYY hợp lệ, không trong tương lai)
    const rawDob = (editingMember.dateOfBirth || "").trim();
    if (rawDob) {
      const formatted = rawDob.includes("-") ? formatBackendToDob(rawDob) : rawDob;
      const dobResult = validateDob(formatted, 0, 200);
      if (!dobResult.valid) {
        newErrors.dateOfBirth = dobResult.error;
        if (!sectionToOpen) sectionToOpen = "basic";
      }
    }

    // 5. Facebook URL
    const fb = (editingMember.facebookUrl || "").trim();
    if (fb && !/^https?:\/\/(www\.)?facebook\.com\/.+/i.test(fb) && !fb.startsWith("https://")) {
      newErrors.facebookUrl = t("admin.error_invalid_url", {
        defaultValue: "Đường dẫn Facebook không hợp lệ (ví dụ: https://facebook.com/...).",
      });
      if (!sectionToOpen) sectionToOpen = "contact";
    }

    // 6. Link ảnh Avatar
    const avatar = (editingMember.avatarUrl || "").trim();
    if (avatar && !/^https?:\/\/.+/i.test(avatar) && !avatar.startsWith("/")) {
      newErrors.avatarUrl = t("admin.error_invalid_url", {
        defaultValue: "Đường dẫn ảnh đại diện không hợp lệ (ví dụ: https://...).",
      });
      if (!sectionToOpen) sectionToOpen = "bio";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (sectionToOpen) {
        setOpenSection(sectionToOpen);
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
      title={
        isUpdate
          ? t("admin.edit_member", { defaultValue: "Cập nhật thông tin thành viên" })
          : t("admin.add_new_member", { defaultValue: "Thêm thành viên mới" })
      }
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
        {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
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
                openSection === "basic" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSection === "basic" && (
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
                    error={errors.fullName}
                    onKeyDown={handleFullNameKeyDown}
                    onChange={handleFullNameChange}
                    onPaste={handleFullNamePaste}
                  />

                  {/* Thế hệ (Đời thứ) * - Lấy động từ bảng database generations */}
                  <Select
                    required
                    label={t("admin.field_generation", { defaultValue: "Thế hệ (Đời thứ) *" })}
                    value={editingMember.generation ?? 1}
                    includeEmptyOption={false}
                    error={errors.generation}
                    onChange={(e) => {
                      onChange({ ...editingMember, generation: parseInt(e.target.value) || 1 });
                      if (errors.generation) setErrors((prev) => ({ ...prev, generation: undefined }));
                    }}
                  >
                    {generations.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.title ? `(${g.title})` : ""}
                      </option>
                    ))}
                  </Select>

                  {/* Vai trò trong tộc * */}
                  <Input
                    required
                    label={t("admin.field_role", { defaultValue: "Vai trò *" })}
                    value={editingMember.role || ""}
                    error={errors.role}
                    onChange={(e) => {
                      onChange({ ...editingMember, role: e.target.value });
                      if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
                    }}
                  />

                  {/* Giới tính */}
                  <Select
                    label={t("admin.field_gender", { defaultValue: "Giới tính" })}
                    value={editingMember.gender || "Nam"}
                    includeEmptyOption={false}
                    onChange={(e) => onChange({ ...editingMember, gender: e.target.value })}
                  >
                    <option value="Nam">{t("admin.gender_nam", { defaultValue: "Nam" })}</option>
                    <option value="Nữ">{t("admin.gender_nu", { defaultValue: "Nữ" })}</option>
                    <option value="Khác">{t("admin.gender_khac", { defaultValue: "Khác" })}</option>
                  </Select>

                  {/* Ngày sinh */}
                  <div className="md:col-span-2">
                    <DateInput
                      label={t("admin.field_dob", { defaultValue: "Ngày sinh" })}
                      value={
                        editingMember.dateOfBirth
                          ? editingMember.dateOfBirth.includes("-")
                            ? formatBackendToDob(editingMember.dateOfBirth)
                            : editingMember.dateOfBirth
                          : ""
                      }
                      error={errors.dateOfBirth}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const backend = formatDobToBackend(raw);
                        onChange({ ...editingMember, dateOfBirth: backend || raw });
                        if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* KHỐI 2: ACCORDION 1 - QUAN HỆ GIA ĐÌNH & CON CÁI */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
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
                openSection === "relations" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSection === "relations" && (
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
                  <Select
                    label={t("admin.field_father", { defaultValue: "Cha (Bố)" })}
                    value={editingMember.fatherId || ""}
                    onChange={(e) => onChange({ ...editingMember, fatherId: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    {potentialFathers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {formatName(f.fullName)} ({t("admin.generation", { defaultValue: "Đời" })} {f.generation})
                      </option>
                    ))}
                  </Select>

                  {/* Mẹ */}
                  <Select
                    label={t("admin.field_mother", { defaultValue: "Mẹ" })}
                    value={editingMember.motherId || ""}
                    onChange={(e) => onChange({ ...editingMember, motherId: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    {potentialMothers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {formatName(m.fullName)} ({t("admin.generation", { defaultValue: "Đời" })} {m.generation})
                      </option>
                    ))}
                  </Select>

                  {/* Vợ / Chồng */}
                  <div className="md:col-span-2">
                    <Select
                      label={t("admin.field_spouse", { defaultValue: "Vợ / Chồng" })}
                      value={editingMember.spouseId || ""}
                      onChange={(e) => onChange({ ...editingMember, spouseId: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      {potentialSpouses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {formatName(s.fullName)} ({t("admin.generation", { defaultValue: "Đời" })} {s.generation})
                        </option>
                      ))}
                    </Select>
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
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="font-medium">{formatName(child.fullName)}</span>
                            <span className="text-[10px] text-secondary-text px-1 py-0.5 rounded bg-primary-bg">
                              {t("admin.generation", { defaultValue: "Đời" })} {child.generation}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(child.id)}
                              className="text-secondary-text hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
                              title={t("admin.remove", { defaultValue: "Bỏ chọn" })}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dropdown thêm con */}
                    {availableForChildren.length > 0 ? (
                      <Select
                        label={t("admin.select_children_placeholder", { defaultValue: "+ Chọn thêm con cái từ danh sách..." })}
                        value=""
                        includeEmptyOption={true}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddChild(e.target.value);
                          }
                        }}
                      >
                        {availableForChildren.map((c) => (
                          <option key={c.id} value={c.id}>
                            {formatName(c.fullName)} ({t("admin.generation", { defaultValue: "Đời" })} {c.generation}{c.gender ? ` • ${c.gender}` : ""})
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="text-xs text-secondary-text italic px-1 py-1">
                        {t("admin.no_more_children_available", { defaultValue: "Đã chọn hết thành viên phù hợp hoặc chưa có thành viên khác trong hệ thống." })}
                      </div>
                    )}
                  </div>

                  {/* Anh / Chị / Em họ (Sibling horizontal multi-selector) */}
                  <div className="md:col-span-2 space-y-2 pt-1 border-t border-custom-border/40 mt-2">
                    <div className="flex items-center justify-between text-xs mt-2">
                      <label className="font-semibold text-secondary-text">
                        {t("admin.field_siblings_ho", { defaultValue: "Anh / Chị / Em Họ (Liên kết tuỳ chỉnh)" })}
                      </label>
                      <span className="text-[11px] text-accent font-medium">
                        {selectedSiblings.length} {t("admin.siblings_count", { defaultValue: "người" })}
                      </span>
                    </div>

                    {/* Danh sách anh/chị/em họ đã chọn */}
                    {selectedSiblings.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-primary-bg/70 border border-custom-border/60">
                        {selectedSiblings.map((sibling) => (
                          <span
                            key={sibling.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary-bg text-primary-text text-xs border border-custom-border shadow-xs"
                          >
                            <span className="w-2 h-2 rounded-full bg-accent" />
                            <span className="font-medium">{formatName(sibling.fullName)}</span>
                            <span className="text-[10px] text-secondary-text px-1 py-0.5 rounded bg-primary-bg">
                              {t("admin.generation", { defaultValue: "Đời" })} {sibling.generation}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSibling(sibling.id)}
                              className="text-secondary-text hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
                              title={t("admin.remove", { defaultValue: "Bỏ chọn" })}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Dropdown thêm anh/chị/em họ */}
                    {availableForSiblings.length > 0 ? (
                      <Select
                        label={t("admin.select_siblings_placeholder", { defaultValue: "+ Chọn thêm Anh/Chị/Em họ..." })}
                        value=""
                        includeEmptyOption={true}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSibling(e.target.value);
                          }
                        }}
                      >
                        {availableForSiblings.map((c) => (
                          <option key={c.id} value={c.id}>
                            {formatName(c.fullName)} ({t("admin.generation", { defaultValue: "Đời" })} {c.generation}{c.gender ? ` • ${c.gender}` : ""})
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <div className="text-xs text-secondary-text italic px-1 py-1">
                        {t("admin.no_more_siblings_available", { defaultValue: "Đã chọn hết thành viên phù hợp." })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* KHỐI 3: ACCORDION 2 - THÔNG TIN LIÊN HỆ & NƠI Ở */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
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
                openSection === "contact" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSection === "contact" && (
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
                    error={errors.phoneNumber}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handlePhoneChange}
                    onPaste={handlePhonePaste}
                  />

                  {/* Facebook URL */}
                  <Input
                    label={t("admin.field_facebook", { defaultValue: "Facebook URL" })}
                    placeholder="https://facebook.com/..."
                    value={editingMember.facebookUrl || ""}
                    error={errors.facebookUrl}
                    onChange={(e) => {
                      onChange({ ...editingMember, facebookUrl: e.target.value });
                      if (errors.facebookUrl) setErrors((prev) => ({ ...prev, facebookUrl: undefined }));
                    }}
                  />

                  {/* Nơi ở */}
                  <div className="md:col-span-2">
                    <Input
                      label={t("admin.field_address", { defaultValue: "Nơi ở hiện tại / Quê quán" })}
                      value={editingMember.address || ""}
                      onChange={(e) => onChange({ ...editingMember, address: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* KHỐI 4: ACCORDION 3 - ẢNH ĐẠI DIỆN & TIỂU SỬ */}
        {/* ========================================================= */}
        <div className="border border-custom-border/70 rounded-xl bg-secondary-bg/30 overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => toggleSection("bio")}
            className="w-full flex items-center justify-between p-3.5 hover:bg-secondary-bg/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                <FileText size={16} />
              </div>
              <span className="font-semibold text-sm text-primary-text">
                {t("admin.section_avatar_bio", { defaultValue: "Ảnh đại diện & Tiểu sử" })}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-secondary-text transition-transform duration-200 ${
                openSection === "bio" ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {openSection === "bio" && (
              <motion.div
                key="bio-section"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3.5 pt-1 border-t border-custom-border/40 space-y-3.5">
                  {/* Link Avatar */}
                  <Input
                    label={t("admin.field_avatar", { defaultValue: "Link Ảnh Đại Diện" })}
                    placeholder="https://..."
                    value={editingMember.avatarUrl || ""}
                    error={errors.avatarUrl}
                    onChange={(e) => {
                      onChange({ ...editingMember, avatarUrl: e.target.value });
                      if (errors.avatarUrl) setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
                    }}
                  />

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
      </form>
    </Modal>
  );
};
