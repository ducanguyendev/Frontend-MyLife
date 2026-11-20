import type { FamilyRenderSegment, FamilyViewLink, FamilyViewNode } from './family-view/familyTreeTypes';
import { parentChildEdgeId } from './familyTreeHighlight';

/** Split shared geometry at every junction; each piece records the relationships using it. */
export function buildParentChildLinks(key: string, parents: FamilyViewNode[], children: FamilyViewNode[]): FamilyViewLink[] {
  if (!parents.length || !children.length) return [];
  const center = (node: FamilyViewNode) => node.x + node.width / 2;
  const sourceX = parents.reduce((sum, node) => sum + center(node), 0) / parents.length;
  const sourceY = Math.max(...parents.map(node => node.y + node.height));
  const targetY = Math.min(...children.map(node => node.y));
  const joinY = sourceY + (parents.length > 1 ? Math.min(14, Math.abs(targetY - sourceY) / 4) : 0);
  const railY = joinY + (targetY - joinY) / 2;
  const allEdges = parents.flatMap(parent => children.map(child => parentChildEdgeId(parent.member.id, child.member.id)));
  const segments: FamilyRenderSegment[] = [];
  const line = (id: string, x1: number, y1: number, x2: number, y2: number, semanticEdgeIds: string[]) => {
    if (Math.abs(x1 - x2) + Math.abs(y1 - y2) < .01) return;
    segments.push({ id: `family-${key}:${id}`, path: `M ${x1} ${y1} L ${x2} ${y2}`, semanticEdgeIds });
  };
  // Independent parent ports avoid brightening their marriage line when selecting a child.
  for (const parent of parents) line(`parent-${parent.member.id}`, center(parent), parent.y + parent.height, center(parent), joinY,
    children.map(child => parentChildEdgeId(parent.member.id, child.member.id)));
  const parentXs = [...new Set([sourceX, ...parents.map(center)])].sort((a, b) => a - b);
  const childXs = [...new Set([sourceX, ...children.map(center)])].sort((a, b) => a - b);
  const crosses = (from: number, to: number, left: number, right: number) => Math.min(from, to) <= left && Math.max(from, to) >= right;
  parentXs.slice(1).forEach((right, i) => {
    const left = parentXs[i];
    line(`parent-rail-${i}`, left, joinY, right, joinY,
      parents.filter(parent => crosses(center(parent), sourceX, left, right)).flatMap(parent => children.map(child => parentChildEdgeId(parent.member.id, child.member.id))));
  });
  line('trunk', sourceX, joinY, sourceX, railY, allEdges);
  childXs.slice(1).forEach((right, i) => {
    const left = childXs[i];
    line(`child-rail-${i}`, left, railY, right, railY,
      children.filter(child => crosses(sourceX, center(child), left, right)).flatMap(child => parents.map(parent => parentChildEdgeId(parent.member.id, child.member.id))));
  });
  const parentIds = parents.map(node => node.member.id);
  const childIds = children.map(node => node.member.id);
  return [{ id: `family-${key}`, path: segments.map(segment => segment.path).join(' '), kind: 'family', memberIds: [...parentIds, ...childIds], sourceMemberIds: parentIds, targetMemberIds: childIds, segments },
    ...children.map(child => {
      const id = `family-child-${key}-${child.member.id}`;
      const path = `M ${center(child)} ${railY} L ${center(child)} ${child.y}`;
      return { id, path, kind: 'family-child' as const, memberIds: [child.member.id], sourceMemberIds: parentIds, targetMemberIds: [child.member.id],
        segments: [{ id, path, semanticEdgeIds: parents.map(parent => parentChildEdgeId(parent.member.id, child.member.id)) }] };
    })];
}
