import { useReducedMotion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MemberMindmapNode } from "./MemberMindmapNode";
import { type FamilyMember } from "./types";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { toPng } from "html-to-image";
import { Download, GitMerge } from "lucide-react";
import { buildFamilyMindmapGraph, layoutFamilyMindmapGraph } from "./familyMindmapGraph";

interface FamilyMindmapProps {
  members: FamilyMember[];
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

const nodeTypes = {
  member: MemberMindmapNode,
  familyUnion: () => (
    <div aria-hidden="true" className="h-full w-full pointer-events-none">
      <Handle type="target" id="union-parent-target" position={Position.Top} isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
      <Handle type="source" id="union-child-source" position={Position.Bottom} isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
      <Handle type="target" id="union-parent-target-left" position={Position.Left} isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
      <Handle type="source" id="union-child-source-right" position={Position.Right} isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent !opacity-0" />
    </div>
  ),
};

const FamilyMindmapInner: React.FC<FamilyMindmapProps> = ({ members, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDirection, setLayoutDirection] = useState("TB");
  const [graphRevision, setGraphRevision] = useState(0);

  const buildGraph = useCallback(() => {
    const graph = buildFamilyMindmapGraph(members, { direction: layoutDirection as "TB" | "LR", animateParentEdges: !reduceMotion });
    const initialNodes = graph.nodes.map(node => node.type === "member"
      ? { ...node, data: { ...node.data, onView, onEdit, onDelete } }
      : node) as Node[];
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutFamilyMindmapGraph(
      initialNodes as Parameters<typeof layoutFamilyMindmapGraph>[0],
      graph.edges,
      layoutDirection as "TB" | "LR",
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setGraphRevision(revision => revision + 1);
  }, [members, onView, onEdit, onDelete, layoutDirection, reduceMotion, setNodes, setEdges]);

  useEffect(() => {
    buildGraph();
  }, [buildGraph]);

  useEffect(() => {
    if (!graphRevision) return;
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.14, duration: reduceMotion ? 0 : 220 });
    });
    return () => cancelAnimationFrame(frame);
  }, [graphRevision, fitView, reduceMotion]);



  const onDownload = useCallback(async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    await fitView({ padding: 0.12, duration: 0 });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--primary-bg").trim() || undefined;
    const dataUrl = await toPng(el, { backgroundColor });
    const a = document.createElement("a");
    a.setAttribute("download", "mylife-family-tree.png");
    a.setAttribute("href", dataUrl);
    a.click();
  }, [fitView]);

  return (
    <div className="w-full h-[600px] bg-secondary-bg/30 rounded-xl border border-custom-border overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
      >
        <Background color="#D4AF37" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls className="!bg-secondary-bg !border-custom-border shadow-md [&_button]:!bg-secondary-bg [&_button]:!border-b [&_button]:!border-custom-border [&_button]:!fill-primary-text [&_button:hover]:!bg-hover-bg overflow-hidden rounded-md" />
        <MiniMap 
          nodeColor="#D4AF37"
          className="!bg-secondary-bg !border-custom-border"
          maskColor="rgba(128, 128, 128, 0.25)"
        />
        <Panel position="top-left" className="!m-3">
          <div role="list" aria-label={t("admin.mindmap_relationship_legend")} className="space-y-2 rounded-xl border border-custom-border bg-secondary-bg/95 px-3 py-2.5 text-[10px] font-medium text-secondary-text shadow-sm backdrop-blur-sm">
            <div role="listitem" className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-[#D4AF37]" />{t("admin.mindmap_parent_child")}</div>
            <div role="listitem" className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-accent" />{t("admin.mindmap_spouse")}</div>
            <div role="listitem" className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-dashed border-secondary-text" />{t("admin.mindmap_horizontal")}</div>
          </div>
        </Panel>

        {/* Action Panel (Top Right) */}
        <Panel position="top-right" className="flex gap-2">
           <button 
             onClick={() => setLayoutDirection(prev => prev === "TB" ? "LR" : "TB")}
             className="flex items-center gap-2 px-3 py-2 bg-secondary-bg border border-custom-border rounded-lg text-xs text-primary-text font-bold hover:bg-accent hover:text-primary-bg transition-colors shadow-sm cursor-pointer"
             aria-label={t(layoutDirection === "TB" ? "admin.layout_horizontal" : "admin.layout_vertical")}
             title={t(layoutDirection === "TB" ? "admin.layout_horizontal" : "admin.layout_vertical")}
           >
             <GitMerge className="w-4 h-4" />
             <span className="hidden sm:inline">
               {layoutDirection === "TB" ? t("admin.layout_horizontal", { defaultValue: "Ngang" }) : t("admin.layout_vertical", { defaultValue: "Dọc" })}
             </span>
           </button>

           <button 
             onClick={() => { void onDownload(); }}
             className="flex items-center gap-2 px-3 py-2 bg-accent border border-accent rounded-lg text-xs text-primary-bg font-bold hover:bg-yellow-500 transition-colors shadow-sm cursor-pointer"
             aria-label={t("admin.export_png")} title={t("admin.export_png")}
           >
             <Download className="w-4 h-4" />
             <span className="hidden sm:inline">PNG</span>
           </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const FamilyMindmap: React.FC<FamilyMindmapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FamilyMindmapInner {...props} />
    </ReactFlowProvider>
  );
};
