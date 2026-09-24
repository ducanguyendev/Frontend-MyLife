import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Loader2, Search, LayoutGrid, List, Users, CalendarDays, BookOpen, Globe, Network
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button } from "@/shared/components/ui";
import {
  type FamilyMember,
  type FamilyTreeManagerProps,
  removeVietnameseTones,
  MemberCard,
  MemberListItem,
  MemberDetailModal,
  MemberFormModal,
  DeleteConfirmModal,
  AnniversaryTab,
  LibraryTab,
  FamilyMapTab,
  FamilyMindmap,
} from "./family-tree";

const API = import.meta.env.VITE_API_URL || "";

export const FamilyTreeManager: React.FC<FamilyTreeManagerProps> = ({ showToast, getHeaders }) => {
  const { t } = useLanguage();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  // UI State
  const [activeTab, setActiveTab] = useState<"members" | "anniversaries" | "library" | "map">("members");
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
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/family-tree`, {
        credentials: "include",
        headers: getHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        console.log("Fetched members:", json.data);
        setMembers(json.data || []);
      } else {
        showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối đến Backend!" }), false);
      }
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối đến Backend!" }), false);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, showToast, t]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter((m) => {
      if (!q) {
        return generationFilter === "all" || m.generation.toString() === generationFilter;
      }
      const rawMatch = m.fullName.toLowerCase().includes(q);
      const noToneMatch = removeVietnameseTones(m.fullName).toLowerCase().includes(removeVietnameseTones(q));
      const matchSearch = rawMatch || noToneMatch;
      const matchGen = generationFilter === "all" || m.generation.toString() === generationFilter;
      return matchSearch && matchGen;
    });
  }, [members, searchQuery, generationFilter]);

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
    const url = isUpdate
      ? `${API}/api/family-tree/${editingMember.id}`
      : `${API}/api/family-tree`;
    const method = isUpdate ? "PUT" : "POST";

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
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          isUpdate
            ? t("admin.success", { defaultValue: "Cập nhật thành công!" })
            : t("admin.success", { defaultValue: "Thêm thành công!" }),
          true
        );
        fetchMembers();
        handleCloseModal();
      } else {
        const errorMsg =
          data.message ||
          (data.errors && Object.values(data.errors).flat().join(", ")) ||
          t("admin.action_failed", { defaultValue: "Có lỗi xảy ra" });
        showToast(errorMsg, false);
      }
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối khi lưu thông tin!" }), false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`${API}/api/family-tree/${memberToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getHeaders(),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(
          data.message ||
            t("admin.delete_success", { defaultValue: `Đã xóa thành viên ${memberToDelete.fullName}` }),
          true
        );
        setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
        setMemberToDelete(null);
      } else {
        showToast(data.message || t("admin.delete_failed", { defaultValue: "Không thể xóa thành viên." }), false);
      }
    } catch {
      showToast(t("admin.error_connect", { defaultValue: "Lỗi kết nối khi xóa thành viên!" }), false);
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
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
                Dòng họ Nguyễn
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
              title={t("admin.add_member", { defaultValue: "Thêm Thành Viên" })}
              onClick={() => handleOpenModal()}
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
      {activeTab === "members" ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Toolbar */}
          <div className="p-6 pb-2 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
              <input
                type="text"
                placeholder={t("admin.search_member", { defaultValue: "Tìm kiếm thành viên..." })}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-secondary-bg rounded-xl border border-custom-border text-primary-text text-sm focus:outline-none focus:border-accent shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={generationFilter}
                onChange={(e) => setGenerationFilter(e.target.value)}
                className="px-4 py-2 bg-secondary-bg rounded-xl border border-custom-border text-primary-text text-sm focus:outline-none focus:border-accent shadow-sm cursor-pointer font-medium"
              >
                <option value="all">{t("admin.all_generations", { defaultValue: "Tất cả các đời" })}</option>
                {generations.map((g) => (
                  <option key={g} value={g}>
                    {t("admin.generation", { defaultValue: "Đời thứ" })} {g}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-secondary-bg p-1 rounded-xl border border-custom-border shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_grid", { defaultValue: "Lưới" })}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-accent text-primary-bg" : "text-secondary-text hover:text-primary-text"}`}
                  title={t("admin.view_list", { defaultValue: "Danh sách" })}
                >
                  <List size={16} />
                </button>
                <button
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
              <div className="flex items-center justify-center h-48">
                <Loader2 size={32} className="animate-spin text-accent" />
              </div>
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
              <FamilyMindmap 
                members={filteredMembers}
                onView={setMemberToView}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              />
            )}
          </div>
        </div>
      ) : activeTab === "anniversaries" ? (
        <AnniversaryTab />
      ) : activeTab === "library" ? (
        <LibraryTab onUploadDoc={() => showToast(t("admin.upload_doc", { defaultValue: "Tải lên tư liệu" }), true)} />
      ) : (
        <FamilyMapTab onShowMapDetail={() => showToast(t("admin.map_title", { defaultValue: "Bản đồ phân bố hậu duệ" }), true)} />
      )}

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
        getHeaders={getHeaders}
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
