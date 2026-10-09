import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import {
  Plus, Loader2, Search, LayoutGrid, List, Users, CalendarDays, BookOpen, Globe, Network
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button, Select } from "@/shared/components/ui";
import { apiClient } from "@/shared/api/apiClient";
import { featureSuccessKeys, getFeatureErrorKey } from '../services/featureMessages';
import {
  type FamilyMember,
  type FamilyTreeManagerProps,
  MemberCard,
  MemberListItem,
  MemberDetailModal,
  MemberFormModal,
  DeleteConfirmModal,
  AnniversaryTab,
  LibraryTab,
  FamilyMapTab,
} from "./family-tree";

import { filterFamilyMembers } from './family-tree/memberSearch';
const FamilyMindmap = lazy(() => import('./family-tree/FamilyMindmap').then(module => ({ default: module.FamilyMindmap })));

export const FamilyTreeManager: React.FC<FamilyTreeManagerProps> = ({ showToast }) => {
  const { t } = useLanguage();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  // UI State
  type FamilyTab = "members" | "anniversaries" | "library" | "map";
  const [activeTab, setActiveTab] = useState<FamilyTab>("members");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "mindmap">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [generationFilter, setGenerationFilter] = useState("all");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<FamilyMember> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToView, setMemberToView] = useState<FamilyMember | null>(null);

  // Fetch API
  const fetchMembers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError(null);
    try {
      const res = await apiClient.requestRaw("/api/family-tree", { signal });
      if (signal?.aborted) return;
      if (res.ok) {
        const json = await res.json();
        if (!signal?.aborted) setMembers(json.data || []);
      } else {
        const error = await res.json().catch(() => null);
        if (!signal?.aborted) setLoadError(getFeatureErrorKey(error, 'member_load', res.status));
      }
    } catch (failure) {
      if (!signal?.aborted) setLoadError(getFeatureErrorKey(failure, 'member_load'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMembers(controller.signal);
    return () => controller.abort();
  }, [fetchMembers]);

  const filteredMembers = useMemo(() => filterFamilyMembers(members, searchQuery, generationFilter), [members, searchQuery, generationFilter]);

  const generations = useMemo(() => {
    const gens = new Set(members.map((m) => m.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [members]);

  // Modal handlers
  const handleOpenModal = (member?: FamilyMember) => {
    if (member) {
      setEditingMember({
        ...member,
        dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
        childIds: member.childIds || [],
      });
    } else {
      setEditingMember({
        fullName: "",
        generation: 1,
        gender: "Nam",
        dateOfBirth: "",
        role: "",
        address: "",
        phoneNumber: "",
        avatarUrl: "",
        biography: "",
        fatherId: undefined,
        motherId: undefined,
        spouseId: undefined,
        childIds: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSaving(true);

    const isUpdate = !!editingMember.id;
    const payload = {
      ...editingMember,
      dateOfBirth: editingMember.dateOfBirth || null,
      fatherId: editingMember.fatherId || null,
      motherId: editingMember.motherId || null,
      spouseId: editingMember.spouseId || null,
      childIds: editingMember.childIds || [],
      generation: Number(editingMember.generation),
    };

    try {
      const res = await apiClient.requestRaw(
        isUpdate ? `/api/family-tree/${editingMember.id}` : "/api/family-tree",
        { method: isUpdate ? "PUT" : "POST", body: payload },
      );

      if (res.ok) {
        showToast(
          t(isUpdate ? featureSuccessKeys.memberUpdate : featureSuccessKeys.memberCreate),
          true
        );
        fetchMembers();
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

  const tabs: Array<{ id: FamilyTab; label: string; icon: React.ReactNode }> = [
    { id: "members", label: t("admin.tab_members", { defaultValue: "Danh Sách Phả Hệ" }), icon: <Users size={16} /> },
    { id: "anniversaries", label: t("admin.tab_anniversaries", { defaultValue: "Ngày Giỗ & Kỷ Niệm" }), icon: <CalendarDays size={16} /> },
    { id: "library", label: t("admin.tab_library", { defaultValue: "Tư Liệu & Kỷ Vật" }), icon: <BookOpen size={16} /> },
    { id: "map", label: t("admin.tab_map", { defaultValue: "Bản Đồ Phân Bố" }), icon: <Globe size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-primary-bg">
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
            <Button
              variant="primary"
              className="!p-3 !rounded-full aspect-square"
              aria-label={t("admin.add_member")}
              title={t("admin.add_member", { defaultValue: "Thêm Thành Viên" })}
              onClick={() => handleOpenModal()}
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" aria-label={t("admin.family_tree")} className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onKeyDown={event => {
                if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                const position = tabs.findIndex(item => item.id === activeTab);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (position + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                setActiveTab(tabs[next].id); document.getElementById('family-tab-' + tabs[next].id)?.focus();
              }}
              role="tab" aria-selected={activeTab === tab.id} id={"family-tab-" + tab.id} aria-controls={"family-panel-" + tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                activeTab === tab.id
                  ? "bg-accent/10 border-accent/50 text-accent shadow-sm"
                  : "bg-secondary-bg border-custom-border text-secondary-text hover:text-primary-text hover:bg-primary-bg"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Content */}
      <div role="tabpanel" id={"family-panel-" + activeTab} aria-labelledby={"family-tab-" + activeTab}>
      {activeTab === "members" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="p-6 pb-2 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
              <input
                type="text"
                aria-label={t("admin.search_member")}
                placeholder={t("admin.search_member", { defaultValue: "Tìm kiếm thành viên..." })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-secondary-bg rounded-xl border border-custom-border text-primary-text text-sm focus:outline-none focus:border-accent shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                aria-label={t("admin.all_generations")}
                value={generationFilter}
                onChange={(e) => setGenerationFilter(e.target.value)}
                containerClassName="!w-auto"
                className="!py-0 !pl-4 !pr-10 !h-10 border-0"
              >
                <option value="all">{t("admin.all_generations", { defaultValue: "Tất cả các đời" })}</option>
                {generations.map((g) => (
                  <option key={g} value={g}>
                    {t("admin.generation", { defaultValue: "Đời thứ" })} {g}
                  </option>
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
                  aria-label={t("admin.view_list")} aria-pressed={viewMode === "list"}
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_list", { defaultValue: "Danh sách" })}
                >
                  <List size={16} />
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
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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
                    index={i}
                    isDropdownOpen={activeDropdown === m.id}
                    onToggleDropdown={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === m.id ? null : m.id);
                    }}
                    onCloseDropdown={() => setActiveDropdown(null)}
                    onView={setMemberToView}
                    onEdit={handleOpenModal}
                    onDelete={setMemberToDelete}
                  />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-3">
                {filteredMembers.map((m) => (
                  <MemberListItem
                    key={m.id}
                    member={m}
                    onView={setMemberToView}
                    onEdit={handleOpenModal}
                    onDelete={setMemberToDelete}
                  />
                ))}
              </div>
            ) : (
              <Suspense fallback={<div role="status">{t("admin.library_ui.loading")}</div>}>
              <FamilyMindmap 
                members={filteredMembers}
                onView={setMemberToView}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              />
              </Suspense>
            )}
          </div>
        </div>
      ) : activeTab === "anniversaries" ? (
        <AnniversaryTab />
      ) : activeTab === "library" ? (
        <LibraryTab showToast={showToast} />
      ) : (
        <FamilyMapTab onShowMapDetail={() => showToast(t("admin.map_title", { defaultValue: "Bản đồ phân bố hậu duệ" }), true)} />
      )}

      </div>
      {/* Modals */}
      <MemberDetailModal
        member={memberToView}
        members={members}
        onClose={() => setMemberToView(null)}
        onEdit={handleOpenModal}
        onView={setMemberToView}
      />

      <MemberFormModal
        isOpen={isModalOpen}
        editingMember={editingMember}
        members={members}
        isSaving={isSaving}
        onClose={handleCloseModal}
        onChange={setEditingMember}
        onSubmit={handleSaveMember}
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
