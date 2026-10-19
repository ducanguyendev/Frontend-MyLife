import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Loader2, LayoutGrid, Table2, Network
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button, FloatingAddButton, Select, SelectItem } from "@/shared/components/ui";
import { SearchBar } from "@/shared/components/SearchBar";
import { apiClient } from "@/shared/api/apiClient";
import { featureSuccessKeys, getFeatureErrorKey } from '../services/featureMessages';
import {
  type FamilyMember,
  type FamilyTreeManagerProps,
  MemberCard,
  MemberTable,
  MemberDetailModal,
  MemberFormModal,
  DeleteConfirmModal,
} from "./family-tree";
import { useFamilyMembers } from './family-tree/useFamilyMembers';

import { filterFamilyMembers } from './family-tree/memberSearch';
const FamilyMindmap = lazy(() => import('./family-tree/FamilyMindmap').then(module => ({ default: module.FamilyMindmap })));

export const FamilyTreeManager: React.FC<FamilyTreeManagerProps> = ({ showToast }) => {
  const { t } = useLanguage();

  const { members, setMembers, loading, loadError, fetchMembers } = useFamilyMembers();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "table" | "mindmap">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<FamilyMember> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToViewId, setMemberToViewId] = useState<number | null>(null);
  const memberToView = members.find(member => member.id === memberToViewId) ?? null;
  const handleViewMember = (member: FamilyMember) => setMemberToViewId(member.id);

  const filteredMembers = useMemo(() => filterFamilyMembers(members, searchQuery, generationFilter), [members, searchQuery, generationFilter]);

  const generations = useMemo(() => {
    const gens = new Set(members.map((m) => m.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [members]);

  // Modal handlers
  const handleOpenModal = (member?: FamilyMember) => {
    setPendingAvatar(null); setRemoveAvatar(false);
    if (member) {
      setEditingMember({
        ...member,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
        deathDate: member.deathDate ? member.deathDate.split("T")[0] : null,
        childIds: member.childIds || [],
      });
    } else {
      setEditingMember({
        fullName: "",
        generation: undefined,
        gender: undefined,
        dateOfBirth: "",
        lifeStatus: undefined,
        deathDate: null,
        role: "",
        address: "",
        phoneNumber: "",
        avatarUrl: "",
        biography: "",
        fatherId: undefined,
        motherId: undefined,
        spouseId: undefined,
        childIds: [],
        horizontalRelations: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setPendingAvatar(null); setRemoveAvatar(false);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!Number.isInteger(editingMember.generation) || Number(editingMember.generation) < 1) return;
    setIsSaving(true);

    const isUpdate = !!editingMember.id;
    const payload = {
      ...editingMember,
      avatarUrl: undefined,
      dateOfBirth: editingMember.dateOfBirth || null,
      lifeStatus: editingMember.lifeStatus === "DECEASED" ? "DECEASED" : "LIVING",
      deathDate: editingMember.lifeStatus === "DECEASED" ? editingMember.deathDate || null : null,
      fatherId: editingMember.fatherId || null,
      motherId: editingMember.motherId || null,
      spouseId: editingMember.spouseId || null,
      childIds: editingMember.childIds || [],
      horizontalRelations: (editingMember.horizontalRelations || []).map(relation => ({
        ...relation,
        relationType: relation.relationType?.trim().toLowerCase() === 'sibling' ? 'sibling' : relation.relationType,
      })),
      generation: editingMember.generation,
    };

    try {
      const res = await apiClient.requestRaw(
        isUpdate ? `/api/family-tree/${editingMember.id}` : "/api/family-tree",
        { method: isUpdate ? "PUT" : "POST", body: payload },
      );

      if (res.ok) {
        const saved = (await res.json()).data as FamilyMember;
        setMembers(previous => [...previous.filter(m => m.id !== saved.id), saved]);
        let avatarFailure = false;
        if (pendingAvatar) {
          const form = new FormData(); form.append("file", pendingAvatar);
          try {
            const upload = await apiClient.requestRaw(`/api/family-tree/${saved.id}/avatar`, { method: "POST", body: form });
            if (upload.ok) {
              const avatarMember = (await upload.json()).data as FamilyMember;
              setMembers(previous => [...previous.filter(m => m.id !== saved.id), avatarMember]);
            } else avatarFailure = true;
          } catch { avatarFailure = true; }
        } else if (isUpdate && removeAvatar) {
          try {
            const deletion = await apiClient.requestRaw(`/api/family-tree/${saved.id}/avatar`, { method: "DELETE" });
            if (deletion.ok) {
              const avatarMember = (await deletion.json()).data as FamilyMember;
              setMembers(previous => [...previous.filter(m => m.id !== saved.id), avatarMember]);
            } else avatarFailure = true;
          } catch { avatarFailure = true; }
        } else setMembers(previous => [...previous.filter(m => m.id !== saved.id), saved]);
        showToast(
          t(isUpdate ? featureSuccessKeys.memberUpdate : featureSuccessKeys.memberCreate),
          true
        );
        if (avatarFailure) showToast(t("admin.member_avatar_errors.upload_failed"), false);
        void fetchMembers();
        handleCloseModal();
      } else {
        showToast(t(getFeatureErrorKey(await res.json().catch(() => null), 'member_save', res.status)), false);
      }
    } catch (failure) {
      showToast(t(getFeatureErrorKey(failure, 'member_save')), false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);

    try {
      const res = await apiClient.requestRaw(`/api/family-tree/${memberToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(
          t(featureSuccessKeys.memberDelete, { name: memberToDelete.fullName }),
          true
        );
        setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
        setMemberToDelete(null);
      } else {
        showToast(t(getFeatureErrorKey(await res.json().catch(() => null), 'member_delete', res.status)), false);
      }
    } catch (failure) {
      showToast(t(getFeatureErrorKey(failure, 'member_delete')), false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-primary-bg">
      {/* Header Bar */}
      <div className="p-6 pb-4 border-b border-custom-border bg-secondary-bg/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-wide text-primary-text flex items-center gap-3">
              <span>{t("admin.family_tree_title", { defaultValue: "CÂY GIA PHẢ DÒNG TỘC" })}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 uppercase">
                {t("admin.my_family_tree")}
              </span>
            </h2>
            <p className="text-secondary-text text-xs mt-1">
              {t("admin.family_tree_subtitle", { defaultValue: "Hệ thống số hóa phả hệ, lưu trữ thông tin tiền nhân và kết nối các thế hệ con cháu." })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <FloatingAddButton
              ariaLabel={t("admin.add_member")}
              tooltip={t("admin.add_member", { defaultValue: "Thêm Thành Viên" })}
              onClick={() => handleOpenModal()}
            />
          </div>
        </div>

      </div>

      {/* Main Tab Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-6 pb-2 flex flex-col lg:flex-row items-center justify-between gap-4">
            <SearchBar
              className="w-full lg:w-80"
              ariaLabel={t("admin.search_member")}
              placeholder={t("admin.search_member", { defaultValue: "Tìm kiếm thành viên..." })}
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Select
                aria-label={t("admin.all_generations")}
                value={generationFilter}
                onValueChange={setGenerationFilter}
                containerClassName="!w-auto"
                className="min-w-44 border-0"
              >
                <SelectItem value="all">{t("admin.all_generations", { defaultValue: "Tất cả các đời" })}</SelectItem>
                {generations.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {t("admin.generation", { defaultValue: "Đời thứ" })} {g}
                  </SelectItem>
                ))}
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-secondary-bg p-1 rounded-xl border border-custom-border shadow-sm">
                <button
                  aria-label={t("admin.view_grid")} aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_grid", { defaultValue: "Lưới" })}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  aria-label={t("admin.view_table")} aria-pressed={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "table" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_table")}
                >
                  <Table2 size={16} />
                </button>
                <button
                  aria-label={t("admin.view_mindmap")} aria-pressed={viewMode === "mindmap"}
                  onClick={() => setViewMode("mindmap")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "mindmap" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_mindmap", { defaultValue: "Sơ đồ phả hệ" })}
                >
                  <Network size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Members List/Grid Area */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 custom-scrollbar">
            {loading ? (
              <div role="status" aria-label={t("admin.library_ui.loading")} className="flex items-center justify-center h-48">
                <Loader2 size={32} className="animate-spin text-accent" />
              </div>
            ) : loadError ? (
              <div role="alert" className="py-12 text-center space-y-3"><p className="text-error">{t(loadError)}</p>
                <Button variant="secondary" onClick={() => void fetchMembers()}>{t('admin.library_ui.retry')}</Button></div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center space-y-3 text-secondary-text"><p>{t('admin.tree_empty')}</p><p>{t('admin.tree_empty_hint')}</p>
                <Button onClick={() => handleOpenModal()}>{t('admin.add_member')}</Button></div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-secondary-text text-sm">
                {t("admin.no_members", { defaultValue: "Không tìm thấy thành viên nào." })}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map((m, i) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    members={members}
                    index={i}
                    isDropdownOpen={activeDropdown === m.id}
                    onToggleDropdown={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === m.id ? null : m.id);
                    }}
                    onCloseDropdown={() => setActiveDropdown(null)}
                    onView={handleViewMember}
                    onEdit={handleOpenModal}
                    onDelete={setMemberToDelete}
                  />
                ))}
              </div>
            ) : viewMode === "table" ? (
              <MemberTable
                members={filteredMembers}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              />
            ) : (
              <Suspense fallback={<div role="status">{t("admin.library_ui.loading")}</div>}>
              <FamilyMindmap 
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              />
              </Suspense>
            )}
          </div>
        </div>
      </div>
      {/* Modals */}
      <MemberDetailModal
        member={memberToView}
        members={members}
        onClose={() => setMemberToViewId(null)}
        onEdit={handleOpenModal}
        onView={handleViewMember}
      />

      <MemberFormModal
        isOpen={isModalOpen}
        editingMember={editingMember}
        members={members}
        isSaving={isSaving}
        onClose={handleCloseModal}
        onChange={setEditingMember}
        onSubmit={handleSaveMember}
        pendingAvatar={pendingAvatar}
        onPendingAvatarChange={file => { setPendingAvatar(file); if (file) setRemoveAvatar(false); }}
        hasAvatar={Boolean(editingMember?.hasManagedAvatar || editingMember?.avatarUrl)}
        removeAvatar={removeAvatar}
        onRemoveAvatarChange={setRemoveAvatar}
      />

      <DeleteConfirmModal
        member={memberToDelete}
        isDeleting={isDeleting}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
