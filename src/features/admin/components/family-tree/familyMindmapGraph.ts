import type { Edge, Node } from "@xyflow/react";
import type { FamilyMember } from "./types";

export const MEMBER_NODE_WIDTH = 196;
export const MEMBER_NODE_HEIGHT = 136;
const UNION_NODE_SIZE = 4;
const SPOUSE_GAP = 20;
const FAMILY_GAP = 54;
const GENERATION_GAP = 168;
const SIBLING_BRANCH_GAP = 38;

export type FamilyRelationType = "parentChild" | "spouse" | "horizontal";
export type FamilyMindmapNode = Node<Record<string, unknown>>;
export type FamilyMindmapEdge = Edge<{
  relationType: FamilyRelationType;
  relationTypes?: string[];
  familyIds?: number[];
}>;

interface GraphOptions {
  direction?: "TB" | "LR";
  showHorizontalRelations?: boolean;
}

interface FamilyHub {
  id: string;
  parentIds: number[];
  childIds: number[];
  generation: number;
  branchId?: string;
}

const pairKey = (first: number, second: number) => first < second ? `${first}:${second}` : `${second}:${first}`;

function makeEdge(
  id: string,
  source: string | number,
  target: string | number,
  relationType: FamilyRelationType,
  familyIds: number[],
  direction: "TB" | "LR",
  dataExtra: Partial<NonNullable<FamilyMindmapEdge["data"]>> = {},
  handles: { sourceHandle?: string; targetHandle?: string } = {},
): FamilyMindmapEdge {
  return {
    id,
    source: String(source),
    target: String(target),
    type: "familyTree",
    sourceHandle: relationType === "spouse"
      ? direction === "TB" ? "spouse-right" : "spouse-bottom"
      : relationType === "horizontal"
        ? direction === "TB" ? "horizontal-right" : "horizontal-bottom"
        : direction === "TB" ? "child-source" : "child-source-right",
    targetHandle: relationType === "spouse"
      ? direction === "TB" ? "spouse-left" : "spouse-top"
      : relationType === "horizontal"
        ? direction === "TB" ? "horizontal-left" : "horizontal-top"
        : direction === "TB" ? "parent-target" : "parent-target-left",
    ...handles,
    className: `family-mindmap-edge family-mindmap-edge--${relationType}`,
    style: { stroke: "var(--family-tree-line)", strokeWidth: relationType === "parentChild" ? 1.7 : 1.4 },
    data: { relationType, familyIds, ...dataExtra },
  };
}

function uniqueVisibleParents(child: FamilyMember, visibleIds: Set<number>): number[] {
  return [...new Set([child.fatherId, child.motherId]
    .filter((id): id is number => id != null && id !== child.id && visibleIds.has(id)))].sort((a, b) => a - b);
}

export function buildFamilyMindmapGraph(members: FamilyMember[], options: GraphOptions = {}) {
  const direction = options.direction ?? "TB";
  const showHorizontalRelations = options.showHorizontalRelations ?? false;
  const memberById = new Map(members.map(member => [member.id, member]));
  const visibleIds = new Set(memberById.keys());
  const nodes: FamilyMindmapNode[] = members.map(member => ({
    id: String(member.id),
    type: "member",
    position: { x: 0, y: 0 },
    width: MEMBER_NODE_WIDTH,
    height: MEMBER_NODE_HEIGHT,
    data: { member },
  }));
  const edges: FamilyMindmapEdge[] = [];
  const parentPairs = new Set<string>();
  const hubs = new Map<string, FamilyHub>();

  for (const child of members) {
    const parentIds = uniqueVisibleParents(child, visibleIds);
    for (const parentId of parentIds) parentPairs.add(pairKey(parentId, child.id));
    if (parentIds.length === 0) continue;

    const key = `${parentIds.join(":")}:g${child.generation}`;
    const hub = hubs.get(key) ?? {
      id: `family-union-${key.replaceAll(":", "-").replace("g", "g-")}`,
      parentIds,
      childIds: [],
      generation: child.generation,
    };
    hub.childIds.push(child.id);
    hubs.set(key, hub);
  }

  for (const hub of hubs.values()) {
    if (hub.childIds.length > 1) hub.branchId = `family-branch-${hub.id.slice("family-union-".length)}`;
    nodes.push({
      id: hub.id,
      type: "familyUnion",
      position: { x: 0, y: 0 },
      width: UNION_NODE_SIZE,
      height: UNION_NODE_SIZE,
      selectable: false,
      draggable: false,
      connectable: false,
      data: { parentIds: hub.parentIds, childIds: hub.childIds, generation: hub.generation, direction },
    });
    if (hub.branchId) {
      nodes.push({
        id: hub.branchId,
        type: "familyBranch",
        position: { x: 0, y: 0 },
        width: 2,
        height: 2,
        selectable: false,
        draggable: false,
        connectable: false,
        data: { childIds: hub.childIds, direction },
      });
    }
  }

  // Deduplicate spouses even when both records point to each other.
  const spousePairs = new Set<string>();
  for (const member of members) {
    const spouseId = member.spouseId;
    if (spouseId == null || spouseId === member.id || !visibleIds.has(spouseId)) continue;
    spousePairs.add(pairKey(member.id, spouseId));
  }
  for (const key of spousePairs) {
    const [first, second] = key.split(":").map(Number);
    edges.push(makeEdge(`spouse-${key}`, first, second, "spouse", [first, second], direction));
  }

  for (const hub of hubs.values()) {
    const familyIds = [...new Set([...hub.parentIds, ...hub.childIds])];
    for (const parentId of hub.parentIds) {
      edges.push(makeEdge(`parent-union-${parentId}-${hub.id}`, parentId, hub.id, "parentChild", [parentId], direction, {}, {
        targetHandle: direction === "TB" ? "union-parent-target" : "union-parent-target-left",
      }));
    }
    if (hub.branchId) {
      edges.push(makeEdge(`union-branch-${hub.id}`, hub.id, hub.branchId, "parentChild", familyIds, direction, {}, {
        sourceHandle: direction === "TB" ? "union-child-source" : "union-child-source-right",
        targetHandle: direction === "TB" ? "branch-parent-target" : "branch-parent-target-left",
      }));
      for (const childId of hub.childIds) {
        edges.push(makeEdge(`branch-child-${hub.branchId}-${childId}`, hub.branchId, childId, "parentChild", [childId], direction, {}, {
          sourceHandle: `branch-child-${childId}`,
        }));
      }
    } else {
      for (const childId of hub.childIds) {
        edges.push(makeEdge(`union-child-${hub.id}-${childId}`, hub.id, childId, "parentChild", [childId], direction, {}, {
          sourceHandle: direction === "TB" ? "union-child-source" : "union-child-source-right",
        }));
      }
    }
  }

  if (showHorizontalRelations) {
    const relations = new Map<string, { firstId: number; secondId: number; relationTypes: Set<string> }>();
    for (const member of members) {
      for (const relation of member.horizontalRelations ?? []) {
        const otherId = Number(relation.memberId);
        if (!Number.isInteger(otherId) || otherId === member.id || !visibleIds.has(otherId)) continue;
        const key = pairKey(member.id, otherId);
        if (spousePairs.has(key) || parentPairs.has(key)) continue;
        const relationType = relation.relationType?.trim().toLocaleLowerCase();
        if (!relationType) continue;
        const pair = relations.get(key) ?? { firstId: Math.min(member.id, otherId), secondId: Math.max(member.id, otherId), relationTypes: new Set<string>() };
        pair.relationTypes.add(relationType);
        relations.set(key, pair);
      }
    }
    for (const [key, relation] of relations) {
      edges.push(makeEdge(`horizontal-${key}`, relation.firstId, relation.secondId, "horizontal", [relation.firstId, relation.secondId], direction, {
        relationTypes: [...relation.relationTypes].sort(),
      }));
    }
  }

  return { nodes, edges };
}

interface Unit {
  key: string;
  ids: string[];
  generation: number;
  parentKey: string;
}

function memberFromNode(node: FamilyMindmapNode): FamilyMember {
  return node.data.member as FamilyMember;
}

/** Places spouse components as one compact unit and keeps sibling families together by their visible parents. */
export function layoutFamilyMindmapGraph(
  graphNodes: FamilyMindmapNode[],
  edges: FamilyMindmapEdge[],
  direction: "TB" | "LR" = "TB",
): { nodes: FamilyMindmapNode[]; edges: FamilyMindmapEdge[] } {
  const memberNodes = graphNodes.filter(node => node.type === "member");
  const memberNodeById = new Map(memberNodes.map(node => [node.id, node]));
  const spouseNeighbours = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (edge.data?.relationType !== "spouse") continue;
    (spouseNeighbours.get(edge.source) ?? spouseNeighbours.set(edge.source, new Set()).get(edge.source)!).add(edge.target);
    (spouseNeighbours.get(edge.target) ?? spouseNeighbours.set(edge.target, new Set()).get(edge.target)!).add(edge.source);
  }

  const components: string[][] = [];
  const visited = new Set<string>();
  for (const node of memberNodes) {
    if (visited.has(node.id)) continue;
    const component: string[] = [];
    const stack = [node.id];
    visited.add(node.id);
    while (stack.length) {
      const id = stack.pop()!;
      component.push(id);
      for (const neighbor of spouseNeighbours.get(id) ?? []) {
        if (!visited.has(neighbor)) { visited.add(neighbor); stack.push(neighbor); }
      }
    }
    component.sort((a, b) => Number(a) - Number(b));
    components.push(component);
  }

  const units: Unit[] = components.map(ids => {
    const generation = Math.min(...ids.map(id => memberFromNode(memberNodeById.get(id)!).generation || 1));
    const parentCandidates = ids.map(id => {
      const person = memberFromNode(memberNodeById.get(id)!);
      return [person.fatherId, person.motherId].filter((value): value is number => value != null && memberNodeById.has(String(value))).sort((a, b) => a - b).join(":");
    }).filter(Boolean).sort();
    return { key: ids.join(":"), ids, generation, parentKey: parentCandidates[0] ?? `root:${ids[0]}` };
  });
  const ranks = [...new Set(units.map(unit => unit.generation))].sort((a, b) => a - b);
  const rankIndex = new Map(ranks.map((rank, index) => [rank, index]));
  const rankUnits = new Map<number, Unit[]>();
  for (const unit of units) {
    const list = rankUnits.get(unit.generation) ?? [];
    list.push(unit);
    rankUnits.set(unit.generation, list);
  }
  const positions = new Map<string, { x: number; y: number }>();
  const cardCross = direction === "TB" ? MEMBER_NODE_HEIGHT : MEMBER_NODE_WIDTH;

  // First assign stable within-rank rows, sorting descendant family clusters under their parents.
  for (const generation of ranks) {
    const index = rankIndex.get(generation)!;
    const clusterMap = new Map<string, Unit[]>();
    for (const unit of rankUnits.get(generation) ?? []) {
      const list = clusterMap.get(unit.parentKey) ?? [];
      list.push(unit);
      clusterMap.set(unit.parentKey, list);
    }
    const clusters = [...clusterMap.entries()].map(([key, clusterUnits]) => {
      clusterUnits.sort((a, b) => a.key.localeCompare(b.key));
      const width = clusterUnits.reduce((total, unit) => total + unit.ids.length * MEMBER_NODE_WIDTH + Math.max(0, unit.ids.length - 1) * SPOUSE_GAP, 0)
        + Math.max(0, clusterUnits.length - 1) * 28;
      const parentIds = key.startsWith("root:") ? [] : key.split(":").map(Number);
      const parentPositions = parentIds.map(id => positions.get(String(id))).filter((position): position is NonNullable<typeof position> => !!position);
      const parentCenter = parentPositions.length
        ? parentPositions.reduce((total, position) => total + (direction === "TB" ? position.x + MEMBER_NODE_WIDTH / 2 : position.y + MEMBER_NODE_HEIGHT / 2), 0) / parentPositions.length
        : Number.POSITIVE_INFINITY;
      return { key, units: clusterUnits, width, parentCenter, desiredCenter: parentCenter };
    }).sort((a, b) => a.parentCenter - b.parentCenter || a.key.localeCompare(b.key));
    const anchored = clusters.filter(cluster => Number.isFinite(cluster.desiredCenter));
    const anchoredCenter = anchored.length
      ? anchored.reduce((sum, cluster) => sum + cluster.desiredCenter, 0) / anchored.length
      : 0;
    const unanchored = clusters.filter(cluster => !Number.isFinite(cluster.desiredCenter));
    const unanchoredWidth = unanchored.reduce((sum, cluster) => sum + cluster.width, 0) + Math.max(0, unanchored.length - 1) * FAMILY_GAP;
    let unanchoredCursor = anchoredCenter - unanchoredWidth / 2;
    for (const cluster of unanchored) {
      cluster.desiredCenter = unanchoredCursor + cluster.width / 2;
      unanchoredCursor += cluster.width + FAMILY_GAP;
    }
    clusters.sort((a, b) => a.desiredCenter - b.desiredCenter || a.key.localeCompare(b.key));
    let previousRight = Number.NEGATIVE_INFINITY;
    const cross = index * (cardCross + GENERATION_GAP);
    for (const cluster of clusters) {
      let unitCursor = Math.max(cluster.desiredCenter - cluster.width / 2, previousRight + FAMILY_GAP);
      const clusterLeft = unitCursor;
      for (const unit of cluster.units) {
        const unitWidth = unit.ids.length * MEMBER_NODE_WIDTH + Math.max(0, unit.ids.length - 1) * SPOUSE_GAP;
        unit.ids.forEach((id, memberIndex) => {
          const axis = unitCursor + memberIndex * (MEMBER_NODE_WIDTH + SPOUSE_GAP);
          positions.set(id, direction === "TB"
            ? { x: axis, y: cross }
            : { x: cross, y: axis });
        });
        unitCursor += unitWidth + 28;
      }
      previousRight = clusterLeft + cluster.width;
    }
  }

  const extraNodes: FamilyMindmapNode[] = [];
  for (const generation of ranks) {
    const rowIds = (rankUnits.get(generation) ?? []).flatMap(unit => unit.ids);
    const rowPositions = rowIds.map(id => positions.get(id)!).filter(Boolean);
    if (!rowPositions.length) continue;
    const minAxis = Math.min(...rowPositions.map(position => direction === "TB" ? position.x : position.y));
    const maxAxis = Math.max(...rowPositions.map(position => (direction === "TB" ? position.x : position.y) + (direction === "TB" ? MEMBER_NODE_WIDTH : MEMBER_NODE_HEIGHT)));
    const cross = (rankIndex.get(generation) ?? 0) * (cardCross + GENERATION_GAP);
    extraNodes.push({
      id: `generation-${generation}`,
      type: "generationLabel",
      position: direction === "TB" ? { x: minAxis, y: cross - 36 } : { x: cross, y: minAxis - 34 },
      width: direction === "TB" ? maxAxis - minAxis : 26,
      height: direction === "TB" ? 26 : maxAxis - minAxis,
      selectable: false,
      draggable: false,
      connectable: false,
      data: { generation, direction, width: maxAxis - minAxis },
    });
  }

  const hubNodes = graphNodes.filter(node => node.type === "familyUnion");
  for (const hubNode of hubNodes) {
    const parentIds = (hubNode.data.parentIds as number[]).map(String);
    const childIds = (hubNode.data.childIds as number[]).map(String);
    const parentPositions = parentIds.map(id => positions.get(id)).filter((position): position is NonNullable<typeof position> => !!position);
    const childPositions = childIds.map(id => positions.get(id)).filter((position): position is NonNullable<typeof position> => !!position);
    if (!parentPositions.length || !childPositions.length) continue;
    const centerAxis = (list: Array<{ x: number; y: number }>) => list.reduce((sum, item) => sum + (direction === "TB" ? item.x + MEMBER_NODE_WIDTH / 2 : item.y + MEMBER_NODE_HEIGHT / 2), 0) / list.length;
    const parentCross = (parentPositions[0][direction === "TB" ? "y" : "x"] + cardCross);
    const childCross = childPositions[0][direction === "TB" ? "y" : "x"];
    const branchCross = childCross - SIBLING_BRANCH_GAP;
    const unionCross = (parentCross + branchCross) / 2;
    const unionAxis = centerAxis(parentPositions);
    positions.set(hubNode.id, direction === "TB"
      ? { x: unionAxis - UNION_NODE_SIZE / 2, y: unionCross - UNION_NODE_SIZE / 2 }
      : { x: unionCross - UNION_NODE_SIZE / 2, y: unionAxis - UNION_NODE_SIZE / 2 });

    const branchId = `family-branch-${hubNode.id.slice("family-union-".length)}`;
    if (childIds.length > 1 && memberNodeById.has(childIds[0])) {
      const axes = childIds.map(id => positions.get(id)!).map(position => direction === "TB" ? position.x + MEMBER_NODE_WIDTH / 2 : position.y + MEMBER_NODE_HEIGHT / 2);
      const start = Math.min(...axes);
      const end = Math.max(...axes);
      const branchPosition = direction === "TB"
        ? { x: start, y: branchCross - 1 }
        : { x: branchCross - 1, y: start };
      positions.set(branchId, branchPosition);
      const branchNode = graphNodes.find(node => node.id === branchId);
      if (branchNode) {
        extraNodes.push({ ...branchNode, position: branchPosition,
          width: Math.max(2, direction === "TB" ? end - start : 2),
          height: Math.max(2, direction === "LR" ? end - start : 2),
          data: { ...branchNode.data, childIds: childIds.map(Number), direction, span: Math.max(2, end - start) } });
      }
    }
  }

  const positioned = graphNodes.map(node => {
    if (node.type === "generationLabel") return node;
    const position = positions.get(node.id);
    return position ? { ...node, position } : node;
  });
  const extraIds = new Set(extraNodes.map(node => node.id));
  return { nodes: [...positioned.filter(node => !extraIds.has(node.id)), ...extraNodes], edges };
}
