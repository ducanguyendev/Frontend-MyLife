import { useCallback, useEffect, useMemo, useRef, useState, type WheelEvent } from "react";
import { FamilyTree, type FamilyCardProps, type TreeApi } from "@memoir/tree";
import "@memoir/tree/styles.css";
import { Download, Focus, UsersRound, ZoomIn, ZoomOut } from "lucide-react";
import { toPng } from "html-to-image";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { buildFamilyTreeIndex, getHiddenDescendantCount, getVisibleFamilyMembers } from "./familyTreeAdapter";
import type { FamilyMember } from "./types";
import { adaptMembersToMemoirTree, type MemoirPerson } from "./memoirTreeAdapter";
import { MemoirFamilyPersonCard, type MemoirFamilyCardActions } from "./MemoirFamilyPersonCard";
import "./MemoirFamilyTreeView.css";

interface MemoirFamilyTreeViewProps {
  members: FamilyMember[];
  searchFocusMemberId?: number | null;
  generationFilterId?: number | null;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
  onRuntimeError: (error: Error) => void;
}

type MemoirCardProps = FamilyCardProps<MemoirPerson> & MemoirFamilyCardActions;
const MIN_ZOOM = 0.62;
const MAX_ZOOM = 1.5;
const initialFocus = (members: FamilyMember[]) => members.length
  ? [...members].sort((a, b) => b.generation - a.generation || a.id - b.id)[0].id
  : null;

export function MemoirFamilyTreeView({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete, onRuntimeError }: MemoirFamilyTreeViewProps) {
  const { t } = useLanguage();
  const hostRef = useRef<HTMLDivElement>(null);
  const treeApiRef = useRef<TreeApi>(null);
  const [focusedId, setFocusedId] = useState<number | null>(() => initialFocus(members));
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showAll, setShowAll] = useState(false);
  const [zoom, setZoom] = useState(1);

  const treeMembers = useMemo(() => generationFilterId == null ? members : members.filter(member => member.generation === generationFilterId), [members, generationFilterId]);
  const treeIndex = useMemo(() => buildFamilyTreeIndex(treeMembers), [treeMembers]);
  const activeId = focusedId != null && treeIndex.byId.has(focusedId) ? focusedId : initialFocus(treeMembers);
  const visibleMembers = useMemo(() => getVisibleFamilyMembers(treeMembers, activeId, expandedIds, showAll, treeIndex), [treeMembers, activeId, expandedIds, showAll, treeIndex]);
  const visibleIds = useMemo(() => new Set(visibleMembers.map(member => member.id)), [visibleMembers]);
  const hiddenCounts = useMemo(() => new Map(visibleMembers.map(member => [member.id, getHiddenDescendantCount(member, treeIndex, visibleIds)])), [visibleMembers, treeIndex, visibleIds]);
  const { graph } = useMemo(() => adaptMembersToMemoirTree(visibleMembers, activeId), [visibleMembers, activeId]);
  const generations = [...new Set(visibleMembers.map(member => member.generation))].sort((a, b) => a - b);

  const focusMember = useCallback((id: number) => {
    if (!treeIndex.byId.has(id)) return;
    setFocusedId(current => {
      if (current != null && current !== id) setFocusHistory(history => [...history, current]);
      return id;
    });
    setExpandedIds(new Set());
    setShowAll(false);
  }, [treeIndex]);
  const toggleExpanded = useCallback((id: number) => setExpandedIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);
  const cardProps = useCallback((person: MemoirPerson): MemoirFamilyCardActions => ({
    hiddenCount: hiddenCounts.get(person.id) ?? 0,
    expanded: expandedIds.has(person.id),
    onView,
    onEdit,
    onDelete,
    onFocus: focusMember,
    onExpand: toggleExpanded,
  }), [hiddenCounts, expandedIds, onView, onEdit, onDelete, focusMember, toggleExpanded]);
  const PersonCard = useCallback((props: MemoirCardProps) => <MemoirFamilyPersonCard {...props} />, []);

  useEffect(() => {
    if (treeMembers.length && (focusedId == null || !treeIndex.byId.has(focusedId))) {
      setFocusedId(initialFocus(treeMembers));
    }
  }, [treeMembers, treeIndex, focusedId]);
  useEffect(() => {
    if (searchFocusMemberId == null || !treeIndex.byId.has(searchFocusMemberId)) return;
    focusMember(searchFocusMemberId);
  }, [searchFocusMemberId, treeIndex, focusMember]);
  useEffect(() => {
    if (activeId == null) return;
    const frame = requestAnimationFrame(() => treeApiRef.current?.centerPerson(String(activeId)));
    return () => cancelAnimationFrame(frame);
  }, [activeId]);

  const restoreFocus = () => {
    const previous = focusHistory.at(-1);
    if (previous == null) return;
    setFocusHistory(history => history.slice(0, -1));
    setFocusedId(previous);
    setExpandedIds(new Set());
    setShowAll(false);
  };
  const centerFocus = () => {
    if (activeId != null) treeApiRef.current?.centerPerson(String(activeId));
  };
  const changeZoom = (amount: number) => setZoom(current => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * amount)));
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? 1.08 : 1 / 1.08);
  };
  const exportPng = async () => {
    const element = hostRef.current;
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { pixelRatio: members.length > 100 ? 1.5 : 2, skipFonts: true });
      const anchor = document.createElement("a");
      anchor.download = "mylife-memoir-tree-poc.png";
      anchor.href = dataUrl;
      anchor.click();
    } catch (error) {
      onRuntimeError(error instanceof Error ? error : new Error(String(error)));
    }
  };
  const label = (key: string, fallback: string) => t(key, { defaultValue: fallback });

  if (!members.length || !visibleMembers.length) return <div className="memoir-tree-poc__empty" role="status">{label("admin.mindmap_empty", "Thêm thành viên để xem cây gia đình.")}</div>;

  return <section className="memoir-tree-poc" aria-label={t("admin.view_mindmap", { defaultValue: "Cây gia đình" })}>
    <div className="memoir-tree-poc__toolbar" role="toolbar" aria-label={label("admin.mindmap_toolbar", "Công cụ sơ đồ gia đình")}>
      {focusHistory.length > 0 && <button type="button" onClick={restoreFocus}>{label("admin.mindmap_previous_branch", "← Nhánh trước")}</button>}
      <button type="button" aria-label={label("admin.mindmap_zoom_out", "Thu nhỏ")} onClick={() => changeZoom(1 / 1.15)}><ZoomOut size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_zoom_in", "Phóng to")} onClick={() => changeZoom(1.15)}><ZoomIn size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_focus_branch", "Đưa người đang chọn vào giữa")} onClick={centerFocus}><Focus size={16} /></button>
      <button type="button" aria-label={label("admin.mindmap_fit_view", "Vừa khung nội dung")} onClick={() => { setZoom(1); treeApiRef.current?.fitToSubject(); }}><Focus size={15} /></button>
      <button type="button" aria-pressed={showAll} onClick={() => { setShowAll(value => !value); setExpandedIds(new Set()); }}><UsersRound size={15} />{label(showAll ? "admin.mindmap_current_branch" : "admin.mindmap_all_tree", showAll ? "Nhánh hiện tại" : "Xem toàn bộ cây")}</button>
      <button type="button" aria-label={label("admin.export_png", "Xuất PNG")} onClick={() => void exportPng()}><Download size={15} />PNG</button>
      <span className="memoir-tree-poc__generation-pills" aria-label="Các đời đang hiển thị">
        {generations.map(generation => <span key={generation}>{t("admin.mindmap_generation", { generation, defaultValue: `Đời ${generation}` }).toLocaleUpperCase()}</span>)}
      </span>
    </div>
    <div ref={hostRef} className="memoir-tree-poc__canvas" onWheel={handleWheel}>
      <div className="memoir-tree-poc__zoom-layer" style={{ transform: `scale(${zoom})` }}>
        <FamilyTree<MemoirPerson, MemoirFamilyCardActions>
          graph={graph}
          card={PersonCard}
          cardProps={cardProps}
          ariaLabel="Sơ đồ gia đình MyLife Memoir POC"
          className="memoir-tree-poc__tree"
          theme="system"
          lineShape="orthogonal"
          layoutMode="compact-family"
          layoutPolicy={{ descendantCoparents: "include", subjectPartnerPlacement: "balanced" }}
          interactionMode="pan"
          initialViewport={activeId == null ? "canvas" : { mode: "center-person", personId: String(activeId) }}
          treeApiRef={treeApiRef}
          estimatedCardSize={{ width: 232, height: 178 }}
          spacing={{ row: 108, column: 30, padding: 32 }}
          onPersonClick={person => onView(person)}
        />
      </div>
    </div>
    <p className="memoir-tree-poc__note">@memoir/tree 0.8.0 · {visibleMembers.length} / {members.length} {label("admin.members", "thành viên")} · {label("admin.mindmap_drag_hint", "Cuộn để thu phóng · kéo để di chuyển")}</p>
  </section>;
}

export default MemoirFamilyTreeView;
