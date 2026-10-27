import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Expand, Focus, GitBranch, Shrink, ZoomIn, ZoomOut } from "lucide-react";
import { toPng } from "html-to-image";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { buildFamilyTreeIndex, getHiddenDescendantCount, getRelatedFamilyMemberIds, getVisibleFamilyMembers } from "../familyTreeAdapter";
import type { FamilyMember } from "../types";
import { FamilyBranch } from "./FamilyBranch";
import { FamilyPersonCard } from "./FamilyPersonCard";
import { layoutFamilyView } from "./familyTreeLayout";
import "./FamilyTreeView.css";

interface FamilyTreeViewProps {
  members: FamilyMember[];
  searchFocusMemberId?: number | null;
  generationFilterId?: number | null;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

interface ViewTransform { x: number; y: number; scale: number }

const clampScale = (scale: number) => Math.max(0.28, Math.min(1.45, scale));

export const FamilyTreeView: React.FC<FamilyTreeViewProps> = ({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<number | null>(null);
  const [branchMemberId, setBranchMemberId] = useState<number | null>(null);
  const focusedMemberIdRef = useRef<number | null>(focusedMemberId);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showExtendedRelations, setShowExtendedRelations] = useState(false);
  const [hoveredMemberId, setHoveredMemberId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });

  const treeMembers = useMemo(() => generationFilterId == null ? members : members.filter(member => member.generation === generationFilterId), [members, generationFilterId]);
  const treeIndex = useMemo(() => buildFamilyTreeIndex(treeMembers), [treeMembers]);
  const visibleMembers = useMemo(() => branchMemberId == null
    ? treeMembers
    : getVisibleFamilyMembers(treeMembers, branchMemberId, expandedIds, false, treeIndex), [treeMembers, branchMemberId, expandedIds, treeIndex]);
  const visibleIds = useMemo(() => new Set(visibleMembers.map(member => member.id)), [visibleMembers]);
  const hiddenCounts = useMemo(() => new Map(visibleMembers.map(member => [member.id, getHiddenDescendantCount(member, treeIndex, visibleIds)])), [visibleMembers, treeIndex, visibleIds]);
  const layout = useMemo(() => layoutFamilyView(visibleMembers, showExtendedRelations), [visibleMembers, showExtendedRelations]);
  const activeMemberId = hoveredMemberId ?? focusedMemberId;
  const relatedMemberIds = useMemo(() => getRelatedFamilyMemberIds(treeMembers, activeMemberId, showExtendedRelations), [treeMembers, activeMemberId, showExtendedRelations]);

  const fitView = useCallback((animate = true) => {
    const viewport = viewportRef.current;
    if (!viewport || !layout.width || !layout.height) return;
    const bounds = viewport.getBoundingClientRect();
    const toolbarHeight = shellRef.current?.querySelector(".family-tree-view__toolbar")?.getBoundingClientRect().height ?? 64;
    const availableHeight = Math.max(160, bounds.height - toolbarHeight - 34);
    const fitScale = Math.min((bounds.width - 48) / layout.width, availableHeight / layout.height, 1);
    const scale = clampScale(fitScale);
    const focusCenterX = layout.width / 2;
    const contentCenterY = (Math.min(...layout.nodes.map(node => node.y)) + Math.max(...layout.nodes.map(node => node.y + node.height))) / 2;
    const viewportCenterY = toolbarHeight + availableHeight / 2;
    if (!animate || reduceMotion) {
      viewport.classList.add("is-still");
      requestAnimationFrame(() => requestAnimationFrame(() => viewport.classList.remove("is-still")));
    } else viewport.classList.remove("is-still");
    setTransform({ x: bounds.width / 2 - focusCenterX * scale, y: viewportCenterY - contentCenterY * scale, scale });
  }, [layout.width, layout.height, reduceMotion]);

  useEffect(() => { focusedMemberIdRef.current = focusedMemberId; }, [focusedMemberId]);
  useEffect(() => {
    if (focusedMemberId != null && !treeMembers.some(member => member.id === focusedMemberId)) setFocusedMemberId(null);
    if (branchMemberId != null && !treeMembers.some(member => member.id === branchMemberId)) setBranchMemberId(null);
  }, [treeMembers, focusedMemberId, branchMemberId]);
  useEffect(() => {
    if (searchFocusMemberId == null || !treeMembers.some(member => member.id === searchFocusMemberId)) return;
    const currentFocus = focusedMemberIdRef.current;
    if (currentFocus !== searchFocusMemberId && currentFocus != null) setFocusHistory(history => [...history, currentFocus]);
    setFocusedMemberId(searchFocusMemberId);
  }, [searchFocusMemberId, treeMembers]);
  useEffect(() => { fitView(false); }, [fitView, layout.width, layout.height, branchMemberId]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fitView(false));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitView]);
  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const focusMember = useCallback((id: number) => {
    if (focusedMemberId !== id && focusedMemberId != null) setFocusHistory(history => [...history, focusedMemberId]);
    setFocusedMemberId(id);
    setHoveredMemberId(null);
  }, [focusedMemberId]);
  const focusBranch = useCallback((id: number) => {
    focusMember(id);
    setBranchMemberId(id);
    setExpandedIds(new Set());
  }, [focusMember]);
  const restoreFocus = useCallback(() => {
    const previous = focusHistory.at(-1);
    if (previous == null) return;
    setFocusHistory(history => history.slice(0, -1));
    setFocusedMemberId(previous);
    setBranchMemberId(previous);
    setExpandedIds(new Set());
  }, [focusHistory]);
  const toggleExpanded = useCallback((id: number) => setExpandedIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  }), []);

  const zoomAt = useCallback((nextScale: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    const bounds = viewport?.getBoundingClientRect();
    if (!bounds) return;
    const scale = clampScale(nextScale);
    const anchorX = clientX == null ? bounds.width / 2 : clientX - bounds.left;
    const anchorY = clientY == null ? bounds.height / 2 : clientY - bounds.top;
    setTransform(current => ({ scale, x: anchorX - (anchorX - current.x) * scale / current.scale, y: anchorY - (anchorY - current.y) * scale / current.scale }));
  }, []);
  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoomAt(transform.scale * (event.deltaY < 0 ? 1.08 : 1 / 1.08), event.clientX, event.clientY);
  }, [transform.scale, zoomAt]);
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, .family-person-card")) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setTransform(current => ({ ...current, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y }));
  };
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };
  const onViewportKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      const delta = 48;
      setTransform(current => ({ ...current, x: current.x + (event.key === "ArrowLeft" ? delta : event.key === "ArrowRight" ? -delta : 0), y: current.y + (event.key === "ArrowUp" ? delta : event.key === "ArrowDown" ? -delta : 0) }));
    } else if (event.key === "+" || event.key === "=") zoomAt(transform.scale * 1.12);
    else if (event.key === "-") zoomAt(transform.scale / 1.12);
  };
  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen(); }
    catch { setIsFullscreen(false); }
  };
  const downloadPng = async () => {
    if (!shellRef.current) return;
    setHoveredMemberId(null);
    fitView(false);
    setIsExporting(true);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (!reduceMotion) await new Promise<void>(resolve => window.setTimeout(resolve, 340));
    try {
      const dataUrl = await toPng(shellRef.current, { pixelRatio: members.length > 100 ? 1.5 : 2, skipFonts: true });
      const anchor = document.createElement("a"); anchor.download = "mylife-family-tree.png"; anchor.href = dataUrl; anchor.click();
    } catch (error) { console.error("Could not export the family tree image.", error); }
    finally { setIsExporting(false); }
  };

  if (!members.length) return <div className="family-mindmap-empty" role="status"><span className="family-mindmap-empty__icon">✳</span><strong>{t("admin.mindmap_empty_title", { defaultValue: "Bắt đầu dựng gia phả" })}</strong><span>{t("admin.mindmap_empty", { defaultValue: "Thêm thành viên để xem các thế hệ và mối quan hệ gia đình tại đây." })}</span></div>;

  const toolbarLabel = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const sceneStyle: React.CSSProperties = { width: layout.width, height: layout.height, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` };

  return <div ref={shellRef} className={`family-tree-view-shell${isExporting ? " is-exporting" : ""}`}>
    <div className="family-tree-view__toolbar" role="toolbar" aria-label={toolbarLabel("admin.mindmap_toolbar", "Công cụ sơ đồ gia phả")}>
      {branchMemberId != null && <button type="button" className="family-tree-view__tool family-tree-view__overview is-active" aria-pressed="true" onClick={() => { setBranchMemberId(null); setExpandedIds(new Set()); }}>{toolbarLabel("admin.mindmap_all_tree", "Xem toàn bộ cây")}</button>}
      {branchMemberId != null && focusHistory.length > 0 && <button type="button" className="family-tree-view__tool family-tree-view__back" onClick={restoreFocus}>{toolbarLabel("admin.mindmap_previous_branch", "← Nhánh trước")}</button>}
      <button type="button" className="family-tree-view__tool" aria-label={toolbarLabel("admin.mindmap_zoom_out", "Thu nhỏ")} onClick={() => zoomAt(transform.scale / 1.18)}><ZoomOut size={17} /></button>
      <button type="button" className="family-tree-view__tool" aria-label={toolbarLabel("admin.mindmap_zoom_in", "Phóng to")} onClick={() => zoomAt(transform.scale * 1.18)}><ZoomIn size={17} /></button>
      <button type="button" className="family-tree-view__tool" aria-label={toolbarLabel("admin.mindmap_fit_view", "Vừa khung nhánh")} onClick={() => fitView()}><Focus size={16} /></button>
      <span className="family-tree-view__divider" />
      <button type="button" className={`family-tree-view__tool${showExtendedRelations ? " is-active" : ""}`} aria-pressed={showExtendedRelations}
        aria-label={toolbarLabel("admin.mindmap_extended_relations", "Bật/tắt quan hệ mở rộng")} onClick={() => setShowExtendedRelations(value => !value)}><GitBranch size={15} /><span className="family-tree-view__tool-text">{toolbarLabel("admin.mindmap_extended_relations_short", "Quan hệ mở rộng")}</span></button>
      <button type="button" className="family-tree-view__tool" aria-label={toolbarLabel("admin.mindmap_fullscreen", "Toàn màn hình")} onClick={() => void toggleFullscreen()}>{isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}</button>
      <button type="button" className="family-tree-view__tool family-tree-view__export" aria-label={toolbarLabel("admin.export_png", "Xuất PNG")} onClick={() => void downloadPng()}><Download size={16} /><span>PNG</span></button>
    </div>
    <div ref={viewportRef} className="family-tree-view__viewport" role="application" aria-label={toolbarLabel("admin.mindmap_canvas", "Cây gia phả")}
      tabIndex={0} onKeyDown={onViewportKeyDown} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
      <div ref={sceneRef} className="family-tree-view__scene" style={sceneStyle}>
        <FamilyBranch links={layout.links} width={layout.width} height={layout.height} activeMemberId={activeMemberId} relatedMemberIds={relatedMemberIds} />
        <AnimatePresence initial={false}>
          {layout.nodes.map(node => {
            const member = node.member;
            const related = activeMemberId == null || relatedMemberIds.has(member.id);
            return <FamilyPersonCard key={member.id} member={member} x={node.x} y={node.y} focused={member.id === focusedMemberId}
              highlighted={activeMemberId != null && related} dimmed={activeMemberId != null && !related} reducedMotion={Boolean(reduceMotion)}
              hiddenCount={hiddenCounts.get(member.id) ?? 0} expanded={expandedIds.has(member.id)} onFocus={focusMember} onViewBranch={focusBranch}
              onHover={setHoveredMemberId} onExpand={toggleExpanded} onView={onView} onEdit={onEdit} onDelete={onDelete} />;
          })}
        </AnimatePresence>
      </div>
      <div className="family-tree-view__hint" aria-hidden="true">{toolbarLabel("admin.mindmap_drag_hint", "Kéo để di chuyển · Cuộn để thu phóng")}</div>
    </div>
    {branchMemberId != null && <div className="family-tree-view__status" role="status">{toolbarLabel("admin.mindmap_focus_branch", "Nhánh đang xem")} · {visibleMembers.length} {toolbarLabel("admin.members", "thành viên")}</div>}
  </div>;
};

export default FamilyTreeView;
