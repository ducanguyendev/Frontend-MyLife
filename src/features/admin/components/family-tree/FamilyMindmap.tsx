import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  getSmoothStepPath,
  getStraightPath,
  useEdgesState,
  useNodesState,
  useNodesInitialized,
  useReactFlow,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useReducedMotion } from "framer-motion";
import { Download, Expand, GitMerge, Info, LocateFixed, Minus, Plus, Shrink } from "lucide-react";
import { toPng } from "html-to-image";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { MemberMindmapNode } from "./MemberMindmapNode";
import { buildFamilyMindmapGraph, layoutFamilyMindmapGraph, type FamilyMindmapEdge, type FamilyMindmapNode } from "./familyMindmapGraph";
import { adaptFamilyMembers, buildFamilyTreeIndex, chooseInitialFocus, getHiddenDescendantCount, getVisibleFamilyMembers } from "./familyTreeAdapter";
import { type FamilyMember } from "./types";
import "./FamilyMindmap.css";

interface FamilyMindmapProps {
  members: FamilyMember[];
  searchFocusMemberId?: number | null;
  generationFilterId?: number | null;
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

type Direction = "TB" | "LR";

const HiddenUnionNode = memo(({ data }: NodeProps<FamilyMindmapNode>) => {
  const direction = data.direction as Direction;
  return <div className="family-mindmap-union" aria-hidden="true">
    {direction === "TB" ? <>
      <Handle type="target" id="union-parent-target" position={Position.Top} />
      <Handle type="source" id="union-child-source" position={Position.Bottom} />
    </> : <>
      <Handle type="target" id="union-parent-target-left" position={Position.Left} />
      <Handle type="source" id="union-child-source-right" position={Position.Right} />
    </>}
  </div>;
});

const FamilyAnchorNode = memo(({ data }: NodeProps<FamilyMindmapNode>) => {
  const direction = data.direction as Direction;
  return <div className="family-mindmap-anchor" aria-hidden="true">
    <Handle type="source" id={direction === "TB" ? "family-anchor-source" : "family-anchor-source-right"}
      position={direction === "TB" ? Position.Bottom : Position.Right} />
  </div>;
});

const FamilyBranchNode = memo(({ data }: NodeProps<FamilyMindmapNode>) => {
  const direction = data.direction as Direction;
  const childIds = data.childIds as number[];
  const childOffsets = data.childOffsets as Array<{ id: number; offset: number }>;
  const span = Math.max(1, Number(data.span));
  const targetPercent = (Number(data.targetOffset) / span) * 100;
  return <div className={`family-mindmap-branch ${direction === "LR" ? "family-mindmap-branch--lr" : ""}`} aria-hidden="true">
    {direction === "TB"
      ? <svg className="family-mindmap-branch__svg" viewBox={`0 0 ${span} 2`} aria-hidden="true"><line className="family-mindmap-branch__line" x1="0" y1="1" x2={span} y2="1" /></svg>
      : <svg className="family-mindmap-branch__svg" viewBox={`0 0 2 ${span}`} aria-hidden="true"><line className="family-mindmap-branch__line" x1="1" y1="0" x2="1" y2={span} /></svg>}
    <Handle type="target" id={direction === "TB" ? "branch-parent-target" : "branch-parent-target-left"}
      position={direction === "TB" ? Position.Top : Position.Left}
      style={direction === "TB" ? { left: `${targetPercent}%` } : { top: `${targetPercent}%` }} />
    {childIds.map(childId => {
      const offset = childOffsets?.find(item => item.id === childId)?.offset ?? span / 2;
      const proportion = Math.max(0, Math.min(100, (offset / span) * 100));
      return <Handle key={childId} type="source" id={`branch-child-${childId}`}
        position={direction === "TB" ? Position.Bottom : Position.Right}
        style={direction === "TB" ? { left: `${proportion}%` } : { top: `${proportion}%` }} />;
    })}
  </div>;
});

const GenerationLabelNode = memo(({ data }: NodeProps<FamilyMindmapNode>) => {
  const { t } = useLanguage();
  const generation = Number(data.generation);
  const direction = data.direction as Direction;
  return <div className={`family-mindmap-generation ${direction === "LR" ? "family-mindmap-generation--lr" : ""}`} aria-hidden="true">
    <span>{t("admin.mindmap_generation", { generation, defaultValue: `Đời ${generation}` })}</span>
  </div>;
});

const FamilyTreeEdge = memo((props: EdgeProps<FamilyMindmapEdge>) => {
  const relationType = props.data?.relationType;
  const spouse = relationType === "spouse";
  const horizontal = relationType === "horizontal";
  const [, labelX, labelY] = getStraightPath(props);
  let path: string;
  if (spouse) path = getStraightPath(props)[0];
  else if (horizontal) path = getSmoothStepPath({ ...props, borderRadius: 8, offset: 18 })[0];
  else if (props.sourcePosition === Position.Bottom || props.sourcePosition === Position.Top) {
    path = `M ${props.sourceX},${props.sourceY} L ${props.sourceX},${props.targetY} L ${props.targetX},${props.targetY}`;
  } else {
    path = `M ${props.sourceX},${props.sourceY} L ${props.targetX},${props.sourceY} L ${props.targetX},${props.targetY}`;
  }
  return <>
    <BaseEdge id={props.id} path={path} style={props.style} />
    {spouse && <EdgeLabelRenderer><span className="family-mindmap-spouse-mark" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }} aria-hidden="true">♥</span></EdgeLabelRenderer>}
  </>;
});

const nodeTypes = { member: MemberMindmapNode, familyAnchor: FamilyAnchorNode, familyUnion: HiddenUnionNode, familyBranch: FamilyBranchNode, generationLabel: GenerationLabelNode };
const edgeTypes = { familyTree: FamilyTreeEdge };

const label = (t: ReturnType<typeof useLanguage>["t"], key: string, fallback: string) => t(key, { defaultValue: fallback });

const FamilyMindmapInner: React.FC<FamilyMindmapProps> = ({ members, searchFocusMemberId, generationFilterId, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyMindmapNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FamilyMindmapEdge>([]);
  const [direction, setDirection] = useState<Direction>("TB");
  const [showExtendedRelations, setShowExtendedRelations] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);
  const [focusedMemberId, setFocusedMemberId] = useState<number | null>(() => chooseInitialFocus(adaptFamilyMembers(members)));
  const [focusHistory, setFocusHistory] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const focusMember = useCallback((id: number) => {
    if (focusedMemberId !== id && focusedMemberId != null) setFocusHistory(history => [...history, focusedMemberId]);
    setFocusedMemberId(id);
    setExpandedIds(new Set());
    setShowAllMembers(false);
  }, [focusedMemberId]);
  const restoreFocus = useCallback(() => {
    const prior = focusHistory.at(-1);
    if (prior == null) return;
    setFocusHistory(history => history.slice(0, -1));
    setFocusedMemberId(prior);
  }, [focusHistory]);

  const treeMembers = useMemo(() => generationFilterId == null ? members : members.filter(member => member.generation === generationFilterId), [members, generationFilterId]);
  const treePeople = useMemo(() => adaptFamilyMembers(treeMembers), [treeMembers]);
  const treeIndex = useMemo(() => buildFamilyTreeIndex(treeMembers), [treeMembers]);
  const visibleMembers = useMemo(() => getVisibleFamilyMembers(treeMembers, focusedMemberId, expandedIds, showAllMembers, treeIndex), [treeMembers, focusedMemberId, expandedIds, showAllMembers, treeIndex]);
  const visibleIdSet = useMemo(() => new Set(visibleMembers.map(member => member.id)), [visibleMembers]);
  const hiddenCounts = useMemo(() => new Map(visibleMembers.map(member => [member.id, getHiddenDescendantCount(member, treeIndex, visibleIdSet)])), [visibleMembers, treeIndex, visibleIdSet]);
  const graph = useMemo(() => {
    const built = buildFamilyMindmapGraph(visibleMembers, { direction, showHorizontalRelations: showExtendedRelations });
    const withActions = built.nodes.map(node => node.type === "member"
      ? { ...node, className: `${node.className ?? ""} ${Number(node.id) === focusedMemberId ? "is-focus-person" : ""}`, data: { ...node.data, onView, onEdit, onDelete, onFocusMember: setActiveMemberId, onFocusBranch: focusMember,
        onExpandBranch: (id: number) => setExpandedIds(current => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
        hiddenDescendantCount: hiddenCounts.get(Number(node.id)) ?? 0, branchExpanded: expandedIds.has(Number(node.id)) } }
      : node) as FamilyMindmapNode[];
    return layoutFamilyMindmapGraph(withActions, built.edges, direction);
  }, [visibleMembers, onView, onEdit, onDelete, direction, showExtendedRelations, focusMember, hiddenCounts, expandedIds, focusedMemberId]);
  const relatedMemberIds = useMemo(() => {
    if (activeMemberId == null) return new Set<number>();
    const active = treeMembers.find(member => member.id === activeMemberId);
    if (!active) return new Set<number>([activeMemberId]);
    const related = new Set<number>([activeMemberId]);
    for (const id of [active.fatherId, active.motherId, active.spouseId, ...(active.childIds ?? [])]) if (id != null) related.add(id);
    for (const member of treeMembers) {
      if (member.childIds?.includes(activeMemberId) || member.fatherId === activeMemberId || member.motherId === activeMemberId || member.spouseId === activeMemberId) related.add(member.id);
    }
    return related;
  }, [activeMemberId, treeMembers]);
  const visibleNodes = useMemo(() => graph.nodes.map(node => {
    if (activeMemberId == null) return node;
    const familyIds = node.type === "member"
      ? [(node.data.member as FamilyMember).id]
      : node.data.familyIds as number[] | undefined;
    if (!familyIds?.length) return node;
    const highlighted = familyIds.some(id => relatedMemberIds.has(id));
    return { ...node, className: `${node.className ?? ""} ${highlighted ? "is-family-related" : "is-family-dimmed"}` };
  }), [graph.nodes, activeMemberId, relatedMemberIds]);
  const visibleEdges = useMemo(() => graph.edges.map(edge => {
    if (activeMemberId == null) return edge;
    const highlighted = edge.data?.familyIds?.some(id => relatedMemberIds.has(id)) ?? false;
    return { ...edge, className: `${edge.className ?? ""} ${highlighted ? "is-family-related" : "is-family-dimmed"}` };
  }), [graph.edges, activeMemberId, relatedMemberIds]);

  useEffect(() => { setNodes(visibleNodes); setEdges(visibleEdges); }, [visibleNodes, visibleEdges, setNodes, setEdges]);
  useEffect(() => {
    if (members.length === 0 || !nodesInitialized) return;
    const frame = requestAnimationFrame(() => { void fitView({ padding: 0.22, maxZoom: 1, duration: reduceMotion ? 0 : 280 }); });
    return () => cancelAnimationFrame(frame);
  }, [graph.nodes, fitView, nodesInitialized, reduceMotion, members.length]);
  useEffect(() => {
    if (searchFocusMemberId != null && members.some(member => member.id === searchFocusMemberId)) {
      setFocusedMemberId(searchFocusMemberId);
      setShowAllMembers(false);
      setExpandedIds(new Set());
    }
  }, [searchFocusMemberId, members]);
  useEffect(() => {
    if (!treeMembers.some(member => member.id === focusedMemberId)) setFocusedMemberId(chooseInitialFocus(treePeople));
  }, [treeMembers, focusedMemberId, treePeople]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === document.querySelector(".family-mindmap-shell"));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = document.querySelector<HTMLElement>(".family-mindmap-shell");
    if (!shell) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (shell.requestFullscreen) await shell.requestFullscreen();
    } catch {
      setIsFullscreen(false);
    }
  }, []);

  const onDownload = useCallback(async () => {
    const shell = document.querySelector<HTMLElement>(".family-mindmap-shell");
    const canvas = shell?.querySelector<HTMLElement>(".react-flow");
    if (!shell || !canvas) return;
    setIsExporting(true);
    try {
      await fitView({ padding: 0.13, maxZoom: 1.25, duration: 0 });
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const backgroundColor = getComputedStyle(shell).backgroundColor;
      const connectorShapes = [...canvas.querySelectorAll<SVGElement>(".react-flow__edge-path, .family-mindmap-branch__line")];
      const originalConnectorStyles = connectorShapes.map(shape => shape.getAttribute("style"));
      connectorShapes.forEach(shape => {
        const stroke = getComputedStyle(shape).stroke;
        const modernSrgb = stroke.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
        if (modernSrgb) {
          const [, red, green, blue, alpha] = modernSrgb;
          shape.style.stroke = `rgba(${Math.round(Number(red) * 255)}, ${Math.round(Number(green) * 255)}, ${Math.round(Number(blue) * 255)}, ${alpha ?? 1})`;
        } else {
          shape.style.stroke = stroke;
        }
      });
      let dataUrl: string;
      try {
        dataUrl = await toPng(canvas, {
          backgroundColor,
          pixelRatio: members.length > 100 ? 1.5 : 2,
          skipFonts: true,
          filter: element => !(element instanceof HTMLElement && element.classList.contains("family-mindmap-ui")),
        });
      } finally {
        connectorShapes.forEach((shape, index) => {
          const originalStyle = originalConnectorStyles[index];
          if (originalStyle == null) shape.removeAttribute("style");
          else shape.setAttribute("style", originalStyle);
        });
      }
      const anchor = document.createElement("a");
      anchor.download = "mylife-family-tree.png";
      anchor.href = dataUrl;
      anchor.click();
    } catch (error) {
      console.error("Could not export the family tree image.", error);
    } finally {
      setIsExporting(false);
    }
  }, [fitView, members.length]);

  if (!members.length) return <div className="family-mindmap-empty" role="status">
    <span className="family-mindmap-empty__icon">✳</span>
    <strong>{label(t, "admin.mindmap_empty_title", "Bắt đầu dựng gia phả")}</strong>
    <span>{label(t, "admin.mindmap_empty", "Thêm thành viên để xem các thế hệ và mối quan hệ gia đình tại đây.")}</span>
  </div>;

  return <div className={`family-mindmap-shell${isExporting ? " family-mindmap-exporting" : ""}`}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeMouseEnter={(_event, node) => node.type === "member" && setActiveMemberId((node.data.member as FamilyMember).id)}
      onNodeMouseLeave={() => setActiveMemberId(null)}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      minZoom={0.12}
      maxZoom={1.8}
      fitView
      fitViewOptions={{ padding: 0.16, maxZoom: 1 }}
      proOptions={{ hideAttribution: true }}
      aria-label={label(t, "admin.mindmap_canvas", "Sơ đồ gia phả")}
    >
      <Panel position="top-left" className="family-mindmap-ui family-mindmap-toolbar">
        {focusHistory.length > 0 && <button type="button" className="family-mindmap-icon-button family-mindmap-branch-back" onClick={restoreFocus}>{label(t, "admin.mindmap_previous_branch", "← Nhánh trước")}</button>}
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_zoom_out", "Thu nhỏ")}
          onClick={() => void zoomOut({ duration: reduceMotion ? 0 : 160 })}><Minus size={16} /></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_zoom_in", "Phóng to")}
          onClick={() => void zoomIn({ duration: reduceMotion ? 0 : 160 })}><Plus size={16} /></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_fit_view", "Vừa khung nhánh")}
          onClick={() => void fitView({ padding: 0.16, maxZoom: 1, duration: reduceMotion ? 0 : 220 })}><LocateFixed size={16} /></button>
        <button type="button" className={`family-mindmap-icon-button${showAllMembers ? " is-active" : ""}`} aria-pressed={showAllMembers}
          onClick={() => { setShowAllMembers(value => !value); setExpandedIds(new Set()); }}>{label(t, showAllMembers ? "admin.mindmap_current_branch" : "admin.mindmap_all_tree", showAllMembers ? "Xem nhánh hiện tại" : "Xem toàn bộ cây")}</button>
        <span className="family-mindmap-toolbar__separator" />
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, direction === "TB" ? "admin.layout_horizontal" : "admin.layout_vertical", direction === "TB" ? "Bố cục ngang" : "Bố cục dọc")}
          onClick={() => setDirection(value => value === "TB" ? "LR" : "TB")}><GitMerge size={16} /></button>
        <button type="button" className={`family-mindmap-icon-button family-mindmap-toggle${showExtendedRelations ? " is-active" : ""}`}
          aria-label={label(t, "admin.mindmap_extended_relations", "Quan hệ mở rộng")} aria-pressed={showExtendedRelations}
          onClick={() => setShowExtendedRelations(value => !value)}><span className="family-mindmap-toggle__label">{label(t, "admin.mindmap_extended_relations_short", "Quan hệ mở rộng")}</span></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_legend", "Chú giải")}
          aria-expanded={showLegend} onClick={() => setShowLegend(value => !value)}><Info size={16} /></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, isFullscreen ? "admin.mindmap_exit_fullscreen" : "admin.mindmap_fullscreen", isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình")}
          onClick={() => void toggleFullscreen()}>{isFullscreen ? <Shrink size={16} /> : <Expand size={16} />}</button>
        <button type="button" className="family-mindmap-icon-button family-mindmap-icon-button--export" aria-label={label(t, "admin.export_png", "Xuất PNG")}
          onClick={() => void onDownload()}><Download size={16} /><span>PNG</span></button>
      </Panel>

      {showLegend && <Panel position="top-left" className="family-mindmap-ui family-mindmap-legend">
        <div role="list" aria-label={label(t, "admin.mindmap_relationship_legend", "Chú giải quan hệ gia phả")}>
          <div role="listitem"><span className="family-mindmap-legend__line" />{t("admin.mindmap_parent_child")}</div>
          <div role="listitem"><span className="family-mindmap-legend__line family-mindmap-legend__line--spouse" />{t("admin.mindmap_spouse")}</div>
          {showExtendedRelations && <div role="listitem"><span className="family-mindmap-legend__line family-mindmap-legend__line--extended" />{t("admin.mindmap_horizontal")}</div>}
        </div>
      </Panel>}

      {showAllMembers && members.length > 20 && <Panel position="bottom-right" className="family-mindmap-ui family-mindmap-overview">
        <span className="family-mindmap-overview__label">{label(t, "admin.mindmap_overview", "Tổng quan")}</span>
        <MiniMap pannable zoomable className="family-mindmap-overview__map"
          nodeColor="var(--family-tree-minimap-node)" maskColor="var(--family-tree-minimap-mask)" />
      </Panel>}
    </ReactFlow>
  </div>;
};

export const FamilyMindmap: React.FC<FamilyMindmapProps> = props => <ReactFlowProvider><FamilyMindmapInner {...props} /></ReactFlowProvider>;
