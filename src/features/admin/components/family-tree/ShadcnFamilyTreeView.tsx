import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Focus, GitBranch, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { buildFamilyTreeIndex, getHiddenDescendantCount, getVisibleFamilyMembers } from "./familyTreeAdapter";
import { getFamilyBranchEdgeIds, getFamilyBranchMemberIds } from "./familyBranchResolver";
import { layoutShadcnFamilyTree } from "./shadcnFamilyTreeLayout";
import { adaptMembersToShadcnFamilyTree } from "./shadcnFamilyTreeAdapter";
import { ShadcnFamilyTreePersonCard } from "./ShadcnFamilyTreePersonCard";
import type { FamilyMember } from "./types";
import "./ShadcnFamilyTreeView.css";

interface Props {
  members: FamilyMember[];
  searchFocusMemberId?: number | null;
  generationFilterId?: number | null;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

interface Transform { x: number; y: number; scale: number }
const clampScale = (value: number) => Math.max(.32, Math.min(1.35, value));

/** Independent MyLife renderer using flat parent/partner ids and first-class parent unions. */
export function ShadcnFamilyTreeView({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete }: Props) {
  const { t } = useLanguage();
  const shellRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  const focusedIdRef = useRef<number | null>(null);
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showAll, setShowAll] = useState(true);
  const [branchMemberId, setBranchMemberId] = useState<number | null>(null);
  const [showExtended, setShowExtended] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => generationFilterId == null ? members : members.filter(member => member.generation === generationFilterId), [members, generationFilterId]);
  const model = useMemo(() => adaptMembersToShadcnFamilyTree(filtered), [filtered]);
  const layoutMembers = useMemo(() => {
    const byId = new Map(model.people.map(person => [person.id, person]));
    return model.people.map(person => {
      const parents = person.parentIds.map(id => byId.get(id)).filter((parent): parent is NonNullable<typeof parent> => Boolean(parent));
      const validIds = new Set(parents.map(parent => parent.source.id));
      const fatherId = (person.source.fatherId != null && validIds.has(person.source.fatherId) ? person.source.fatherId : undefined)
        ?? parents.find(parent => parent.sex === "male")?.source.id
        ?? parents[0]?.source.id;
      const motherId = (person.source.motherId != null && validIds.has(person.source.motherId) && person.source.motherId !== fatherId ? person.source.motherId : undefined)
        ?? parents.find(parent => parent.sex === "female" && parent.source.id !== fatherId)?.source.id
        ?? parents.find(parent => parent.source.id !== fatherId)?.source.id;
      return { ...person.source, fatherId, motherId, spouseId: person.partnerIds[0] ? Number(person.partnerIds[0]) : undefined };
    });
  }, [model]);
  const index = useMemo(() => buildFamilyTreeIndex(layoutMembers), [layoutMembers]);
  const branchIds = useMemo(() => branchMemberId == null ? null : getFamilyBranchMemberIds(layoutMembers, branchMemberId), [layoutMembers, branchMemberId]);
  const visible = useMemo(() => branchIds
    ? layoutMembers.filter(member => branchIds.has(member.id))
    : getVisibleFamilyMembers(layoutMembers, focusedId, expandedIds, showAll, index),
  [layoutMembers, branchIds, focusedId, expandedIds, showAll, index]);
  const visibleIds = useMemo(() => new Set(visible.map(member => member.id)), [visible]);
  const hiddenCounts = useMemo(() => new Map(visible.map(member => [member.id, getHiddenDescendantCount(member, index, visibleIds)])), [visible, index, visibleIds]);
  const layout = useMemo(() => layoutShadcnFamilyTree(visible, showExtended), [visible, showExtended]);
  const activeId = hoveredId ?? branchMemberId ?? focusedId;
  const previewBranchIds = useMemo(() => activeId == null ? null : getFamilyBranchMemberIds(layoutMembers, activeId), [layoutMembers, activeId]);
  const previewBranchEdgeIds = useMemo(() => previewBranchIds == null ? null : getFamilyBranchEdgeIds(previewBranchIds, layout.links), [previewBranchIds, layout.links]);

  useEffect(() => { focusedIdRef.current = focusedId; }, [focusedId]);
  useEffect(() => {
    if (focusedId != null && !layoutMembers.some(member => member.id === focusedId)) setFocusedId(null);
  }, [layoutMembers, focusedId]);
  useEffect(() => {
    if (branchMemberId != null && !layoutMembers.some(member => member.id === branchMemberId)) setBranchMemberId(null);
  }, [layoutMembers, branchMemberId]);
  useEffect(() => {
    if (searchFocusMemberId == null || !layoutMembers.some(member => member.id === searchFocusMemberId)) return;
    const current = focusedIdRef.current;
    if (current != null && current !== searchFocusMemberId) setFocusHistory(history => [...history, current]);
    setFocusedId(searchFocusMemberId);
    setBranchMemberId(null);
    setExpandedIds(new Set());
  }, [searchFocusMemberId, layoutMembers]);

  const fitView = useCallback((centerOnly = false) => {
    const viewport = viewportRef.current;
    if (!viewport || !layout.nodes.length) return;
    const bounds = viewport.getBoundingClientRect();
    const target = centerOnly ? layout.nodes.filter(node => node.member.id === focusedIdRef.current) : layout.nodes;
    if (!target.length) return;
    const minX = Math.min(...target.map(node => node.x));
    const maxX = Math.max(...target.map(node => node.x + node.width));
    const minY = Math.min(...target.map(node => node.y));
    const maxY = Math.max(...target.map(node => node.y + node.height));
    const ideal = Math.min((bounds.width - 80) / (maxX - minX + 80), (bounds.height - 130) / (maxY - minY + 130), 1);
    const floor = centerOnly ? .88 : .42;
    const scale = clampScale(Math.max(floor, ideal));
    setTransform({ x: bounds.width / 2 - (minX + maxX) / 2 * scale, y: bounds.height / 2 - (minY + maxY) / 2 * scale, scale });
  }, [layout.nodes, showAll]);
  useEffect(() => { fitView(); }, [fitView, visible.length]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => fitView());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitView]);
  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const viewBranch = useCallback((id: number) => {
    if (branchMemberId != null && branchMemberId !== id) setFocusHistory(history => [...history, branchMemberId]);
    setFocusedId(id); setHoveredId(null); setBranchMemberId(id); setExpandedIds(new Set()); setShowAll(false);
  }, [branchMemberId]);
  const restoreFocus = () => {
    const previous = focusHistory.at(-1);
    if (previous == null) return;
    setFocusHistory(history => history.slice(0, -1)); setFocusedId(previous); setBranchMemberId(previous); setExpandedIds(new Set()); setShowAll(false);
  };
  const toggleExpanded = (id: number) => setExpandedIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const zoomAt = (next: number, clientX?: number, clientY?: number) => {
    const bounds = viewportRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const scale = clampScale(next); const anchorX = clientX == null ? bounds.width / 2 : clientX - bounds.left; const anchorY = clientY == null ? bounds.height / 2 : clientY - bounds.top;
    setTransform(current => ({ scale, x: anchorX - (anchorX - current.x) * scale / current.scale, y: anchorY - (anchorY - current.y) * scale / current.scale }));
  };
  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => { event.preventDefault(); zoomAt(transform.scale * (event.deltaY < 0 ? 1.08 : 1 / 1.08), event.clientX, event.clientY); };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, .shadcn-family-tree__person")) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current; if (!drag || drag.id !== event.pointerId) return;
    setTransform(current => ({ ...current, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y }));
  };
  const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => { if (dragRef.current?.id === event.pointerId) dragRef.current = null; };
  const toggleFullscreen = async () => {
    const shell = shellRef.current; if (!shell) return;
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen(); } catch { setIsFullscreen(false); }
  };
  const exportPng = async () => {
    if (!shellRef.current) return;
    setExporting(true); await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try { const data = await toPng(shellRef.current, { pixelRatio: members.length > 100 ? 1.5 : 2, skipFonts: true }); const anchor = document.createElement("a"); anchor.href = data; anchor.download = "mylife-family-tree-shadcn-poc.png"; anchor.click(); }
    catch (failure) { const error = failure instanceof Error ? failure : new Error("Could not export the family tree image."); console.error(error); }
    finally { setExporting(false); }
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); setTransform(current => ({ ...current, x: current.x + (event.key === "ArrowLeft" ? 48 : event.key === "ArrowRight" ? -48 : 0), y: current.y + (event.key === "ArrowUp" ? 48 : event.key === "ArrowDown" ? -48 : 0) })); }
    else if (event.key === "+" || event.key === "=") zoomAt(transform.scale * 1.12);
    else if (event.key === "-") zoomAt(transform.scale / 1.12);
  };

  if (!filtered.length) return <div className="family-mindmap-empty" role="status">{t("admin.tree_empty", { defaultValue: "Chưa có thành viên trong đời này." })}</div>;
  const sceneStyle: React.CSSProperties = { width: layout.width, height: layout.height, transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` };
  const toolbarLabel = (key: string, fallback: string) => t(key, { defaultValue: fallback });

  return <div ref={shellRef} className={`shadcn-family-tree${exporting ? " is-exporting" : ""}`} data-renderer="shadcn-family-tree">
    <div className="shadcn-family-tree__toolbar" role="toolbar" aria-label={toolbarLabel("admin.mindmap_toolbar", "Công cụ sơ đồ gia phả")}>
      {!showAll && <button type="button" className="shadcn-family-tree__tool shadcn-family-tree__back" onClick={() => { setShowAll(true); setBranchMemberId(null); setExpandedIds(new Set()); }}>{toolbarLabel("admin.mindmap_all_tree", "Xem toàn bộ cây")}</button>}
      {!showAll && focusHistory.length > 0 && <button type="button" className="shadcn-family-tree__tool" onClick={restoreFocus}>{toolbarLabel("admin.mindmap_previous_branch", "← Nhánh trước")}</button>}
      <button type="button" className="shadcn-family-tree__tool" aria-label={toolbarLabel("admin.mindmap_zoom_out", "Thu nhỏ")} onClick={() => zoomAt(transform.scale / 1.18)}><ZoomOut size={16} /></button>
      <button type="button" className="shadcn-family-tree__tool" aria-label={toolbarLabel("admin.mindmap_zoom_in", "Phóng to")} onClick={() => zoomAt(transform.scale * 1.18)}><ZoomIn size={16} /></button>
      <button type="button" className="shadcn-family-tree__tool" aria-label={toolbarLabel("admin.mindmap_fit_view", "Vừa nhánh hiện tại")} onClick={() => fitView()}><Focus size={16} /></button>
      <button type="button" className="shadcn-family-tree__tool" aria-label={toolbarLabel("admin.mindmap_focus_branch", "Đưa người đang chọn vào giữa")} onClick={() => fitView(true)}>{toolbarLabel("admin.mindmap_center", "Giữa người chọn")}</button>
      <button type="button" className={`shadcn-family-tree__tool${showExtended ? " is-active" : ""}`} aria-pressed={showExtended} aria-label={toolbarLabel("admin.mindmap_extended_relations", "Bật/tắt quan hệ mở rộng")} onClick={() => setShowExtended(value => !value)}><GitBranch size={15} /></button>
      <button type="button" className="shadcn-family-tree__tool" aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} onClick={() => void toggleFullscreen()}>{isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}</button>
      <button type="button" className="shadcn-family-tree__tool shadcn-family-tree__export" aria-label={toolbarLabel("admin.export_png", "Xuất PNG")} onClick={() => void exportPng()}><Download size={15} /><span>PNG</span></button>
    </div>
    <div ref={viewportRef} className="shadcn-family-tree__viewport" role="application" aria-label={toolbarLabel("admin.mindmap_canvas", "Cây gia phả")} tabIndex={0} onKeyDown={onKeyDown} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
      <div className="shadcn-family-tree__scene" style={sceneStyle}>
        <svg className="shadcn-family-tree__links" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.links.map(link => {
            const related = activeId == null || Boolean(previewBranchEdgeIds?.has(link.id));
            return <g key={link.id} className={`shadcn-family-tree__link shadcn-family-tree__link--${link.kind}${related ? " is-related" : " is-dimmed"}`}><path d={link.path} />{link.kind === "spouse" && <><circle cx={link.labelX} cy={link.labelY} r={9} /><text x={link.labelX} y={link.labelY} textAnchor="middle" dominantBaseline="central">♥</text></>}</g>;
          })}
        </svg>
        <AnimatePresence initial={false}>
          {layout.nodes.map(node => <ShadcnFamilyTreePersonCard key={node.member.id} member={node.member} x={node.x} y={node.y} focused={focusedId === node.member.id || branchMemberId === node.member.id} dimmed={activeId != null && !previewBranchIds?.has(node.member.id)} hiddenCount={branchMemberId == null ? hiddenCounts.get(node.member.id) ?? 0 : 0} expanded={expandedIds.has(node.member.id)} onViewBranch={viewBranch} onHover={setHoveredId} onExpand={toggleExpanded} onView={onView} onEdit={onEdit} onDelete={onDelete} />)}
        </AnimatePresence>
      </div>
      <div className="shadcn-family-tree__hint" aria-hidden="true">{toolbarLabel("admin.mindmap_drag_hint", "Kéo để di chuyển · Cuộn để thu phóng")}</div>
    </div>
    <div className="shadcn-family-tree__status" role="status">{visible.length} / {members.length} {toolbarLabel("admin.members", "thành viên")} · {model.unions.length} {toolbarLabel("admin.family_units", "gia đình")}</div>
  </div>;
}

export default ShadcnFamilyTreeView;
