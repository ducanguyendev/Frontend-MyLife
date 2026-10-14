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
import { type FamilyMember } from "./types";
import "./FamilyMindmap.css";

interface FamilyMindmapProps {
  members: FamilyMember[];
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

const FamilyBranchNode = memo(({ data }: NodeProps<FamilyMindmapNode>) => {
  const direction = data.direction as Direction;
  const childIds = data.childIds as number[];
  return <div className={`family-mindmap-branch ${direction === "LR" ? "family-mindmap-branch--lr" : ""}`} aria-hidden="true">
    <Handle type="target" id={direction === "TB" ? "branch-parent-target" : "branch-parent-target-left"}
      position={direction === "TB" ? Position.Top : Position.Left} />
    {childIds.map((childId, index) => {
      const proportion = childIds.length <= 1 ? 50 : (index / (childIds.length - 1)) * 100;
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
  const spouse = props.data?.relationType === "spouse";
  const [path, labelX, labelY] = spouse
    ? getStraightPath(props)
    : getSmoothStepPath({ ...props, borderRadius: 0, offset: 22 });
  return <>
    <BaseEdge id={props.id} path={path} style={props.style} />
    {spouse && <EdgeLabelRenderer><span className="family-mindmap-spouse-mark" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }} aria-hidden="true">♥</span></EdgeLabelRenderer>}
  </>;
});

const nodeTypes = { member: MemberMindmapNode, familyUnion: HiddenUnionNode, familyBranch: FamilyBranchNode, generationLabel: GenerationLabelNode };
const edgeTypes = { familyTree: FamilyTreeEdge };

const label = (t: ReturnType<typeof useLanguage>["t"], key: string, fallback: string) => t(key, { defaultValue: fallback });

const FamilyMindmapInner: React.FC<FamilyMindmapProps> = ({ members, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyMindmapNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FamilyMindmapEdge>([]);
  const [direction, setDirection] = useState<Direction>("TB");
  const [showExtendedRelations, setShowExtendedRelations] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const graph = useMemo(() => {
    const built = buildFamilyMindmapGraph(members, { direction, showHorizontalRelations: showExtendedRelations });
    const withActions = built.nodes.map(node => node.type === "member"
      ? { ...node, data: { ...node.data, onView, onEdit, onDelete, onFocusMember: setActiveMemberId } }
      : node) as FamilyMindmapNode[];
    return layoutFamilyMindmapGraph(withActions, built.edges, direction);
  }, [members, onView, onEdit, onDelete, direction, showExtendedRelations]);
  const relatedMemberIds = useMemo(() => {
    if (activeMemberId == null) return new Set<number>();
    const active = members.find(member => member.id === activeMemberId);
    if (!active) return new Set<number>([activeMemberId]);
    const related = new Set<number>([activeMemberId]);
    for (const id of [active.fatherId, active.motherId, active.spouseId, ...(active.childIds ?? [])]) if (id != null) related.add(id);
    for (const member of members) {
      if (member.childIds?.includes(activeMemberId) || member.fatherId === activeMemberId || member.motherId === activeMemberId || member.spouseId === activeMemberId) related.add(member.id);
    }
    return related;
  }, [activeMemberId, members]);
  const visibleNodes = useMemo(() => graph.nodes.map(node => {
    if (activeMemberId == null || node.type !== "member") return node;
    const member = node.data.member as FamilyMember;
    return { ...node, className: `${node.className ?? ""} ${relatedMemberIds.has(member.id) ? "is-family-related" : "is-family-dimmed"}` };
  }), [graph.nodes, activeMemberId, relatedMemberIds]);
  const visibleEdges = useMemo(() => graph.edges.map(edge => {
    if (activeMemberId == null) return edge;
    const highlighted = edge.data?.familyIds?.some(id => relatedMemberIds.has(id)) ?? false;
    return { ...edge, className: `${edge.className ?? ""} ${highlighted ? "is-family-related" : "is-family-dimmed"}` };
  }), [graph.edges, activeMemberId, relatedMemberIds]);

  useEffect(() => { setNodes(visibleNodes); setEdges(visibleEdges); }, [visibleNodes, visibleEdges, setNodes, setEdges]);
  useEffect(() => {
    if (members.length === 0) return;
    const frame = requestAnimationFrame(() => { void fitView({ padding: 0.16, maxZoom: 1, duration: reduceMotion ? 0 : 240 }); });
    return () => cancelAnimationFrame(frame);
  }, [graph.nodes, fitView, reduceMotion, members.length]);
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
      const edgePaths = [...canvas.querySelectorAll<SVGPathElement>(".react-flow__edge-path")];
      const originalEdgeStyles = edgePaths.map(path => path.getAttribute("style"));
      edgePaths.forEach(path => {
        const stroke = getComputedStyle(path).stroke;
        const modernSrgb = stroke.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
        if (modernSrgb) {
          const [, red, green, blue, alpha] = modernSrgb;
          path.style.stroke = `rgba(${Math.round(Number(red) * 255)}, ${Math.round(Number(green) * 255)}, ${Math.round(Number(blue) * 255)}, ${alpha ?? 1})`;
        } else {
          path.style.stroke = stroke;
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
        edgePaths.forEach((path, index) => {
          const originalStyle = originalEdgeStyles[index];
          if (originalStyle == null) path.removeAttribute("style");
          else path.setAttribute("style", originalStyle);
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
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_zoom_out", "Thu nhỏ")}
          onClick={() => void zoomOut({ duration: reduceMotion ? 0 : 160 })}><Minus size={16} /></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_zoom_in", "Phóng to")}
          onClick={() => void zoomIn({ duration: reduceMotion ? 0 : 160 })}><Plus size={16} /></button>
        <button type="button" className="family-mindmap-icon-button" aria-label={label(t, "admin.mindmap_fit_view", "Vừa khung")}
          onClick={() => void fitView({ padding: 0.16, maxZoom: 1, duration: reduceMotion ? 0 : 220 })}><LocateFixed size={16} /></button>
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

      {members.length > 20 && <Panel position="bottom-right" className="family-mindmap-ui family-mindmap-overview">
        <span className="family-mindmap-overview__label">{label(t, "admin.mindmap_overview", "Tổng quan")}</span>
        <MiniMap pannable zoomable className="family-mindmap-overview__map"
          nodeColor="var(--family-tree-minimap-node)" maskColor="var(--family-tree-minimap-mask)" />
      </Panel>}
    </ReactFlow>
  </div>;
};

export const FamilyMindmap: React.FC<FamilyMindmapProps> = props => <ReactFlowProvider><FamilyMindmapInner {...props} /></ReactFlowProvider>;
