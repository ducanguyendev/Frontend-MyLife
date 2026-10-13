import dagre from "dagre";
import type { Edge, Node } from "@xyflow/react";
import type { FamilyMember } from "./types";

export const MEMBER_NODE_WIDTH = 256;
export const MEMBER_NODE_HEIGHT = 96;
const UNION_NODE_SIZE = 4;
const SPOUSE_GAP = 20;
const FAMILY_GAP = 64;
const GENERATION_GAP = 160;

export const MINDMAP_EDGE_STYLES = {
  parentChild: { stroke: "#D4AF37", strokeWidth: 1.8 },
  spouse: { stroke: "var(--accent-color)", strokeWidth: 1.8 },
  horizontal: { stroke: "var(--secondary-text)", strokeWidth: 1.6, strokeDasharray: "6 5" },
} as const;

interface MemberNodeData extends Record<string, unknown> {
  member: FamilyMember;
  onView?: (member: FamilyMember) => void;
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (member: FamilyMember) => void;
}

export interface FamilyUnionNodeData extends Record<string, unknown> {
  parentIds: number[];
  childIds: number[];
  generation: number;
}

export type FamilyMindmapNode = Node<MemberNodeData | FamilyUnionNodeData>;
export type FamilyMindmapEdge = Edge<{ relationType: "parentChild" | "spouse" | "horizontal"; relationTypes?: string[] }>;

interface GraphOptions {
  direction?: "TB" | "LR";
  animateParentEdges?: boolean;
}

const pairKey = (first: number, second: number) => {
  const [min, max] = first < second ? [first, second] : [second, first];
  return `${min}:${max}`;
};

function relationshipEdge(
  id: string,
  source: number | string,
  target: number | string,
  relationType: "parentChild" | "spouse" | "horizontal",
  style: Record<string, string | number>,
  sourceHandle: string,
  targetHandle: string,
  animated = false,
  data: FamilyMindmapEdge["data"] = { relationType },
): FamilyMindmapEdge {
  return {
    id,
    source: String(source),
    target: String(target),
    sourceHandle,
    targetHandle,
    type: "smoothstep",
    animated,
    style: { ...style },
    data,
  };
}

export function buildFamilyMindmapGraph(members: FamilyMember[], options: GraphOptions = {}) {
  const direction = options.direction ?? "TB";
  const animateParentEdges = options.animateParentEdges ?? false;
  const nodeIds = new Set(members.map(member => String(member.id)));
  const memberById = new Map(members.map(member => [member.id, member]));
  const nodes: FamilyMindmapNode[] = members.map(member => ({
    id: String(member.id),
    type: "member",
    position: { x: 0, y: 0 },
    style: { width: MEMBER_NODE_WIDTH, height: MEMBER_NODE_HEIGHT },
    data: { member },
  }));
  const edges: FamilyMindmapEdge[] = [];
  const parentChildPairs = new Set<string>();
  const unions = new Map<string, { id: string; parentIds: number[]; childIds: number[]; generation: number }>();

  for (const child of members) {
    const parentIds = [...new Set([child.fatherId, child.motherId]
      .filter((parentId): parentId is number => parentId != null && parentId !== child.id && nodeIds.has(String(parentId))))];
    for (const parentId of parentIds) parentChildPairs.add(pairKey(parentId, child.id));

    if (parentIds.length === 2) {
      const key = `${pairKey(parentIds[0], parentIds[1])}:g${child.generation}`;
      const existing = unions.get(key);
      if (existing) existing.childIds.push(child.id);
      else unions.set(key, {
        id: `union-${key.replace(":", "-").replace(":g", "-g")}`,
        parentIds,
        childIds: [child.id],
        generation: child.generation,
      });
    } else if (parentIds.length === 1) {
      const parentId = parentIds[0];
      edges.push(relationshipEdge(
        `parent-child-${parentId}-${child.id}`, parentId, child.id, "parentChild",
        MINDMAP_EDGE_STYLES.parentChild,
        direction === "TB" ? "child-source" : "child-source-right",
        direction === "TB" ? "parent-target" : "parent-target-left",
        animateParentEdges,
      ));
    }
  }

  for (const union of unions.values()) {
    nodes.push({
      id: union.id,
      type: "familyUnion",
      position: { x: 0, y: 0 },
      selectable: false,
      draggable: false,
      connectable: false,
      style: { width: UNION_NODE_SIZE, height: UNION_NODE_SIZE, opacity: 0, pointerEvents: "none" },
      data: { parentIds: union.parentIds, childIds: union.childIds, generation: union.generation },
    });
    for (const parentId of union.parentIds) {
      edges.push(relationshipEdge(
        `parent-union-${parentId}-${union.id}`, parentId, union.id, "parentChild",
        MINDMAP_EDGE_STYLES.parentChild,
        direction === "TB" ? "child-source" : "child-source-right",
        direction === "TB" ? "union-parent-target" : "union-parent-target-left",
        animateParentEdges,
      ));
    }
    for (const childId of union.childIds) {
      edges.push(relationshipEdge(
        `union-child-${union.id}-${childId}`, union.id, childId, "parentChild",
        MINDMAP_EDGE_STYLES.parentChild,
        direction === "TB" ? "union-child-source" : "union-child-source-right",
        direction === "TB" ? "parent-target" : "parent-target-left",
        animateParentEdges,
      ));
    }
  }

  const spousePairs = new Set<string>();
  for (const member of members) {
    const spouseId = member.spouseId;
    if (spouseId == null || spouseId === member.id || !memberById.has(spouseId)) continue;
    const key = pairKey(member.id, spouseId);
    if (spousePairs.has(key)) continue;
    spousePairs.add(key);
    const [firstId, secondId] = key.split(":").map(Number);
    edges.push(relationshipEdge(
      `spouse-${key}`, firstId, secondId, "spouse", MINDMAP_EDGE_STYLES.spouse,
      direction === "TB" ? "spouse-right" : "spouse-bottom",
      direction === "TB" ? "spouse-left" : "spouse-top",
    ));
  }

  const horizontalRelations = new Map<string, { firstId: number; secondId: number; relationTypes: Set<string> }>();
  for (const member of members) {
    for (const relation of member.horizontalRelations ?? []) {
      const otherId = Number(relation.memberId);
      if (!Number.isInteger(otherId) || otherId === member.id || !memberById.has(otherId)) continue;
      const key = pairKey(member.id, otherId);
      if (spousePairs.has(key) || parentChildPairs.has(key)) continue;
      const relationType = relation.relationType?.trim().toLowerCase();
      if (!relationType) continue;
      const [firstId, secondId] = key.split(":").map(Number);
      const existing = horizontalRelations.get(key) ?? { firstId, secondId, relationTypes: new Set<string>() };
      existing.relationTypes.add(relationType);
      horizontalRelations.set(key, existing);
    }
  }

  for (const [key, relation] of horizontalRelations) {
    edges.push(relationshipEdge(
      `horizontal-${key}`, relation.firstId, relation.secondId, "horizontal", MINDMAP_EDGE_STYLES.horizontal,
      direction === "TB" ? "horizontal-right" : "horizontal-bottom",
      direction === "TB" ? "horizontal-left" : "horizontal-top",
      false,
      { relationType: "horizontal", relationTypes: [...relation.relationTypes].sort() },
    ));
  }

  return { nodes, edges };
}

export function layoutFamilyMindmapGraph(
  nodes: FamilyMindmapNode[],
  edges: FamilyMindmapEdge[],
  direction: "TB" | "LR" = "TB",
): { nodes: FamilyMindmapNode[]; edges: FamilyMindmapEdge[] } {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: direction, nodesep: 52, ranksep: 112, marginx: 16, marginy: 16 });
  const members = nodes.filter(node => node.type === "member");
  const memberNodeById = new Map(members.map(node => [node.id, node]));
  const memberById = new Map(members.map(node => [node.id, (node.data as MemberNodeData).member]));
  const spouseById = new Map<string, string>();
  for (const edge of edges) {
    if (edge.data?.relationType === "spouse") {
      spouseById.set(edge.source, edge.target);
      spouseById.set(edge.target, edge.source);
    }
  }

  nodes.forEach(node => {
    const width = node.type === "member" ? MEMBER_NODE_WIDTH : UNION_NODE_SIZE;
    const height = node.type === "member" ? MEMBER_NODE_HEIGHT : UNION_NODE_SIZE;
    graph.setNode(node.id, { width, height });
  });
  edges.filter(edge => edge.data?.relationType === "parentChild").forEach(edge => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  const effectiveGeneration = new Map<string, number>();
  for (const node of members) {
    const member = memberById.get(node.id)!;
    effectiveGeneration.set(node.id, member.generation);
  }
  for (const [firstId, secondId] of spouseById) {
    const firstGeneration = effectiveGeneration.get(firstId);
    const secondGeneration = effectiveGeneration.get(secondId);
    if (firstGeneration == null || secondGeneration == null || firstGeneration === secondGeneration) continue;
    const sharedGeneration = Math.min(firstGeneration, secondGeneration);
    effectiveGeneration.set(firstId, sharedGeneration);
    effectiveGeneration.set(secondId, sharedGeneration);
  }

  const ranks = [...new Set(effectiveGeneration.values())].sort((a, b) => a - b);
  const rankIndex = new Map(ranks.map((rank, index) => [rank, index]));
  const unitsByRank = new Map<number, Array<{ key: string; nodeIds: string[]; center: number }>>();
  const included = new Set<string>();
  const axisCenter = (id: string) => {
    const positioned = graph.node(id);
    return direction === "TB" ? positioned.x : positioned.y;
  };

  for (const memberNode of members) {
    if (included.has(memberNode.id)) continue;
    const spouseId = spouseById.get(memberNode.id);
    const spouseNode = spouseId ? memberNodeById.get(spouseId) : undefined;
    const ids = spouseNode ? [memberNode.id, spouseNode.id].sort((a, b) => axisCenter(a) - axisCenter(b) || Number(a) - Number(b)) : [memberNode.id];
    ids.forEach(id => included.add(id));
    const generation = Math.min(...ids.map(id => effectiveGeneration.get(id) ?? 1));
    const unit = {
      key: ids.join(":"),
      nodeIds: ids,
      center: ids.reduce((sum, id) => sum + axisCenter(id), 0) / ids.length,
    };
    const units = unitsByRank.get(generation) ?? [];
    units.push(unit);
    unitsByRank.set(generation, units);
  }

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const generation of ranks) {
    const units = (unitsByRank.get(generation) ?? []).sort((a, b) => a.center - b.center || a.key.localeCompare(b.key));
    const nodeSpan = direction === "TB" ? MEMBER_NODE_WIDTH : MEMBER_NODE_HEIGHT;
    const spans = units.map(unit => unit.nodeIds.length > 1 ? nodeSpan * 2 + SPOUSE_GAP : nodeSpan);
    const totalSpan = spans.reduce((sum, span) => sum + span, 0) + Math.max(0, units.length - 1) * FAMILY_GAP;
    let cursor = -totalSpan / 2;
    const rank = rankIndex.get(generation) ?? 0;
    const crossAxis = rank * ((direction === "TB" ? MEMBER_NODE_HEIGHT : MEMBER_NODE_WIDTH) + GENERATION_GAP);

    units.forEach((unit, unitIndex) => {
      const span = spans[unitIndex];
      if (unit.nodeIds.length > 1) {
        unit.nodeIds.forEach((id, spouseIndex) => {
          const axis = cursor + MEMBER_NODE_WIDTH / 2 + spouseIndex * (MEMBER_NODE_WIDTH + SPOUSE_GAP);
          positions.set(id, direction === "TB"
            ? { x: axis - MEMBER_NODE_WIDTH / 2, y: crossAxis, width: MEMBER_NODE_WIDTH, height: MEMBER_NODE_HEIGHT }
            : { x: crossAxis, y: axis - MEMBER_NODE_HEIGHT / 2, width: MEMBER_NODE_WIDTH, height: MEMBER_NODE_HEIGHT });
        });
      } else {
        const axis = cursor + span / 2;
        positions.set(unit.nodeIds[0], direction === "TB"
          ? { x: axis - MEMBER_NODE_WIDTH / 2, y: crossAxis, width: MEMBER_NODE_WIDTH, height: MEMBER_NODE_HEIGHT }
          : { x: crossAxis, y: axis - MEMBER_NODE_HEIGHT / 2, width: MEMBER_NODE_WIDTH, height: MEMBER_NODE_HEIGHT });
      }
      cursor += span + FAMILY_GAP;
    });
  }

  for (const node of nodes.filter(item => item.type === "familyUnion")) {
    const data = node.data as FamilyUnionNodeData;
    const parentCenters = data.parentIds.map(id => positions.get(String(id))).filter((position): position is NonNullable<typeof position> => !!position);
    const childCenters = data.childIds.map(id => positions.get(String(id))).filter((position): position is NonNullable<typeof position> => !!position);
    if (!parentCenters.length || !childCenters.length) continue;
    const centerX = (items: typeof parentCenters) => items.reduce((sum, item) => sum + item.x + item.width / 2, 0) / items.length;
    const centerY = (items: typeof parentCenters) => items.reduce((sum, item) => sum + item.y + item.height / 2, 0) / items.length;
    const parentX = centerX(parentCenters);
    const parentY = centerY(parentCenters);
    const childX = centerX(childCenters);
    const childY = centerY(childCenters);
    positions.set(node.id, direction === "TB"
      ? { x: parentX - UNION_NODE_SIZE / 2, y: (parentY + childY) / 2 - UNION_NODE_SIZE / 2, width: UNION_NODE_SIZE, height: UNION_NODE_SIZE }
      : { x: (parentX + childX) / 2 - UNION_NODE_SIZE / 2, y: parentY - UNION_NODE_SIZE / 2, width: UNION_NODE_SIZE, height: UNION_NODE_SIZE });
  }

  const layoutedNodes = nodes.map(node => {
    const position = positions.get(node.id);
    if (position) return { ...node, position: { x: position.x, y: position.y } };
    const dagrePosition = graph.node(node.id);
    const width = node.type === "member" ? MEMBER_NODE_WIDTH : UNION_NODE_SIZE;
    const height = node.type === "member" ? MEMBER_NODE_HEIGHT : UNION_NODE_SIZE;
    return { ...node, position: { x: dagrePosition.x - width / 2, y: dagrePosition.y - height / 2 } };
  });

  return { nodes: layoutedNodes, edges };
}
