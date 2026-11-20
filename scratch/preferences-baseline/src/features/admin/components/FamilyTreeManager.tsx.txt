import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Table2, Network, Plus
} from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { Button, Select, SelectItem } from "@/shared/components/ui";
import { PageHeader, SegmentedControl, ErrorState, EmptyState } from "@/shared/components/ui";
import { FamilyViewSkeleton } from './family-tree/FamilyViewSkeleton';
import './family-tree/FamilyExperience.css';
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
import { FAMILY_TREE_RENDERER, IS_DEVELOPMENT_BUILD, IS_FAMILY_CHART_DEV_POC, IS_MEMOIR_DEV_POC, IS_SHADCN_FAMILY_TREE_DEV_POC } from './family-tree/familyTreeRendererConfig';
import { FamilyChartErrorBoundary } from './family-tree/FamilyChartErrorBoundary';
import { FamilyTreeRendererErrorBoundary } from './family-tree/FamilyTreeRendererErrorBoundary';

import { filterFamilyMembers } from './family-tree/memberSearch';
const FamilyMindmap = lazy(() => import('./family-tree/FamilyMindmap').then(module => ({ default: module.FamilyMindmap })));
const FamilyTreeView = lazy(() => import('./family-tree/family-view/FamilyTreeView').then(module => ({ default: module.FamilyTreeView })));
// Keep the library evaluation limited to development/POC; the validated custom view remains the production renderer.
const FamilyChartView = IS_FAMILY_CHART_DEV_POC ? lazy(() => import('./family-tree/FamilyChartView').then(module => ({ default: module.FamilyChartView }))) : null;
const MemoirFamilyTreeView = IS_MEMOIR_DEV_POC ? lazy(() => import('./family-tree/MemoirFamilyTreeView').then(module => ({ default: module.MemoirFamilyTreeView }))) : null;
const ShadcnFamilyTreeView = IS_SHADCN_FAMILY_TREE_DEV_POC ? lazy(() => import('./family-tree/ShadcnFamilyTreeView').then(module => ({ default: module.ShadcnFamilyTreeView }))) : null;

export const FamilyTreeManager: React.FC<FamilyTreeManagerProps> = ({ showToast }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const { members, setMembers, loading, loadError, fetchMembers } = useFamilyMembers();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [familyChartFailed, setFamilyChartFailed] = useState(false);
  const [memoirTreeFailed, setMemoirTreeFailed] = useState(false);
  const [shadcnTreeFailed, setShadcnTreeFailed] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [activeDropdown]);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "table" | "mindmap">("mindmap");
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
  const handleFamilyChartError = useCallback((error: Error) => {
    if (IS_DEVELOPMENT_BUILD) console.warn("[FamilyChart] POC failed; using stable FamilyTreeView fallback.", error);
    setFamilyChartFailed(true);
  }, []);
  const handleMemoirTreeError = useCallback((error: Error) => {
    if (IS_DEVELOPMENT_BUILD) console.warn("[MemoirTree] POC failed; using stable FamilyTreeView fallback.", error);
    setMemoirTreeFailed(true);
  }, []);
  const handleShadcnTreeError = useCallback((error: Error) => {
    if (IS_DEVELOPMENT_BUILD) console.warn("[ShadcnFamilyTree] POC failed; using stable FamilyTreeView fallback.", error);
    setShadcnTreeFailed(true);
  }, []);

  const filteredMembers = useMemo(() => filterFamilyMembers(members, searchQuery, generationFilter), [members, searchQuery, generationFilter]);

  const generations = useMemo(() => {
    const gens = new Set(members.map((m) => m.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [members]);

  // Modal handlers
  const handleOpenModal = useCallback((member?: FamilyMember) => {
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
  }, []);

  useEffect(() => {
    const editMemberId = (location.state as { editMemberId?: number } | null)?.editMemberId;
    if (!editMemberId || !members.length) return;
    const member = members.find(item => item.id === editMemberId);
    if (member) handleOpenModal(member);
    navigate(location.pathname, { replace: true, state: null });
  }, [handleOpenModal, location.pathname, location.state, members, navigate]);

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
    <div className="family-manager flex h-full min-h-0 flex-col overflow-hidden">
      <div className="family-manager__header">
        <PageHeader title={t('appShell.family')} description={t('appShell.familyDescription')} eyebrow={t('family.roots')}
          actions={members.length > 0 || loading || loadError ? <Button leftIcon={<Plus size={16}/>} onClick={() => handleOpenModal()}>{t('admin.add_member')}</Button> : undefined}/>
      </div>
      {/* Main Tab Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="family-toolbar">
            <SearchBar
              className="family-toolbar__search"
              clearLabel={t('family.clearSearch')}
              ariaLabel={t("admin.search_member")}
              placeholder={t("admin.search_member", { defaultValue: "Tìm kiếm thành viên..." })}
              value={searchQuery}
              onChange={setSearchQuery}
            />

            <div className="family-toolbar__filters">
              <Select
                aria-label={t("admin.all_generations")}
                value={generationFilter}
                onValueChange={setGenerationFilter}
                containerClassName="!w-auto"
                variant="compact" className="min-w-44"
              >
                <SelectItem value="all">{t("admin.all_generations", { defaultValue: "Tất cả các đời" })}</SelectItem>
                {generations.map((g) => (
                  <SelectItem key={g} value={String(g)}>
                    {t("admin.generation", { defaultValue: "Đời thứ" })} {g}
                  </SelectItem>
                ))}
              </Select>

              <SegmentedControl label={t('appShell.views')} value={viewMode} onChange={setViewMode} options={[
                { value: 'mindmap', label: t('family.viewTree'), icon: <Network size={17}/> },
                { value: 'grid', label: t('family.viewCards'), icon: <LayoutGrid size={17}/> },
                { value: 'table', label: t('family.viewList'), icon: <Table2 size={17}/> },
              ]}/>
            </div>
          </div>

          {/* Members List/Grid Area */}
          <div className={`family-manager__viewport min-h-0 flex-1 overscroll-contain custom-scrollbar ${viewMode === "mindmap" ? "overflow-hidden" : "overflow-y-auto"}`}>
            {loading ? (
              <FamilyViewSkeleton view={viewMode}/>
            ) : loadError ? (
              <ErrorState message={t(loadError)} action={<Button variant="secondary" onClick={() => void fetchMembers()}>{t('admin.library_ui.retry')}</Button>}/>
            ) : members.length === 0 ? (
              <EmptyState title={t('family.emptyTitle')} description={t('family.emptyDescription')} action={<Button onClick={() => handleOpenModal()}>{t('admin.add_member')}</Button>}/>
            ) : filteredMembers.length === 0 ? (
              <EmptyState title={t('admin.no_members')}/>
            ) : viewMode === "grid" ? (
              <div className="family-gallery">
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
              <Suspense fallback={<FamilyViewSkeleton view="mindmap"/>}>
              {FAMILY_TREE_RENDERER === "shadcn-family-tree" && ShadcnFamilyTreeView && !shadcnTreeFailed ? <FamilyTreeRendererErrorBoundary
                onError={handleShadcnTreeError}
                fallback={<FamilyTreeView
                  members={members}
                  searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                  generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                  onView={handleViewMember}
                  onEdit={handleOpenModal}
                  onDelete={setMemberToDelete}
                />}
              ><ShadcnFamilyTreeView
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              /></FamilyTreeRendererErrorBoundary> : FAMILY_TREE_RENDERER === "memoir" && MemoirFamilyTreeView && !memoirTreeFailed ? <FamilyTreeRendererErrorBoundary
                onError={handleMemoirTreeError}
                fallback={<FamilyTreeView
                  members={members}
                  searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                  generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                  onView={handleViewMember}
                  onEdit={handleOpenModal}
                  onDelete={setMemberToDelete}
                />}
              ><MemoirFamilyTreeView
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
                onRuntimeError={handleMemoirTreeError}
              /></FamilyTreeRendererErrorBoundary> : FAMILY_TREE_RENDERER === "family-chart" && FamilyChartView && !familyChartFailed ? <FamilyChartErrorBoundary
                onError={handleFamilyChartError}
                fallback={<FamilyTreeView
                  members={members}
                  searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                  generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                  onView={handleViewMember}
                  onEdit={handleOpenModal}
                  onDelete={setMemberToDelete}
                />}
              ><FamilyChartView
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
                onRuntimeError={handleFamilyChartError}
              /></FamilyChartErrorBoundary> : FAMILY_TREE_RENDERER === "react-flow" ? <FamilyMindmap
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              /> : <FamilyTreeView
                members={members}
                searchFocusMemberId={searchQuery.trim() ? filteredMembers[0]?.id ?? null : null}
                generationFilterId={generationFilter === "all" ? null : Number(generationFilter)}
                onView={handleViewMember}
                onEdit={handleOpenModal}
                onDelete={setMemberToDelete}
              />}
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
        onOpenProfile={member => { setMemberToViewId(null); navigate(`/mylife/family/member/${member.id}`); }}
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
