import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { MemberMindmapNode } from "./MemberMindmapNode";
import { type FamilyMember } from "./types";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { toPng } from "html-to-image";
import { Search, Download, GitMerge } from "lucide-react";

interface FamilyMindmapProps {
  members: FamilyMember[];
  onView: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (member: FamilyMember) => void;
}

const nodeTypes = {
  member: MemberMindmapNode,
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Dimensions based on MemberMindmapNode size + some padding
  const nodeWidth = 300;
  const nodeHeight = 150;

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

const FamilyMindmapInner: React.FC<FamilyMindmapProps> = ({ members, onView, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [layoutDirection, setLayoutDirection] = useState("TB");
  const [searchQuery, setSearchQuery] = useState("");

  const buildGraph = useCallback(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    const nodeIds = new Set(members.map(m => m.id.toString()));

    members.forEach((m) => {
      initialNodes.push({
        id: m.id.toString(),
        type: "member",
        position: { x: 0, y: 0 },
        data: { member: m, onView, onEdit, onDelete },
      });

      if (m.fatherId && nodeIds.has(m.fatherId.toString())) {
        initialEdges.push({
          id: `e-${m.fatherId}-${m.id}`,
          source: m.fatherId.toString(),
          target: m.id.toString(),
          type: "smoothstep",
          animated: true,
          style: { stroke: "#D4AF37", strokeWidth: 1.5 },
        });
      }
      if (m.motherId && nodeIds.has(m.motherId.toString())) {
        initialEdges.push({
          id: `e-${m.motherId}-${m.id}`,
          source: m.motherId.toString(),
          target: m.id.toString(),
          type: "smoothstep",
          animated: true,
          style: { stroke: "#D4AF37", strokeWidth: 1.5 },
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges, layoutDirection);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [members, onView, onEdit, onDelete, layoutDirection, setNodes, setEdges]);

  useEffect(() => {
    buildGraph();
  }, [buildGraph]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const targetNode = nodes.find(n => {
      const mem = n.data?.member as FamilyMember;
      return mem && mem.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    if (targetNode) {
      fitView({ nodes: [targetNode], duration: 800, maxZoom: 1 });
    }
  };

  const onDownload = useCallback(() => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    toPng(el, { backgroundColor: "#141414" }).then((dataUrl) => {
      const a = document.createElement("a");
      a.setAttribute("download", "mylife-family-tree.png");
      a.setAttribute("href", dataUrl);
      a.click();
    });
  }, []);

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
        <Background color="#D4AF37" gap={20} size={1} variant={"dots" as any} />
        <Controls className="!bg-secondary-bg !border-custom-border shadow-md [&_button]:!bg-secondary-bg [&_button]:!border-b [&_button]:!border-custom-border [&_button]:!fill-primary-text [&_button:hover]:!bg-hover-bg overflow-hidden rounded-md" />
        <MiniMap 
          nodeColor="#D4AF37"
          className="!bg-secondary-bg !border-custom-border"
          maskColor="rgba(128, 128, 128, 0.25)"
        />
        
        {/* Search Panel (Top Left) */}
        <Panel position="top-left" className="flex gap-2">
          <form onSubmit={handleSearch} className="flex items-center bg-secondary-bg border border-custom-border rounded-lg overflow-hidden shadow-sm">
            <input 
              type="text" 
              placeholder={t("admin.search_member", { defaultValue: "Tìm thành viên..." })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-transparent text-primary-text text-sm outline-none border-none w-48"
            />
            <button type="submit" className="px-3 py-2 text-secondary-text hover:text-accent transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </Panel>

        {/* Action Panel (Top Right) */}
        <Panel position="top-right" className="flex gap-2">
           <button 
             onClick={() => setLayoutDirection(prev => prev === "TB" ? "LR" : "TB")}
             className="flex items-center gap-2 px-3 py-2 bg-secondary-bg border border-custom-border rounded-lg text-xs text-primary-text font-bold hover:bg-accent hover:text-primary-bg transition-colors shadow-sm cursor-pointer"
             title={layoutDirection === "TB" ? "Đổi sang chiều ngang" : "Đổi sang chiều dọc"}
           >
             <GitMerge className="w-4 h-4" />
             <span className="hidden sm:inline">
               {layoutDirection === "TB" ? t("admin.layout_horizontal", { defaultValue: "Ngang" }) : t("admin.layout_vertical", { defaultValue: "Dọc" })}
             </span>
           </button>

           <button 
             onClick={onDownload}
             className="flex items-center gap-2 px-3 py-2 bg-accent border border-accent rounded-lg text-xs text-primary-bg font-bold hover:bg-yellow-500 transition-colors shadow-sm cursor-pointer"
             title="Tải ảnh PNG"
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
