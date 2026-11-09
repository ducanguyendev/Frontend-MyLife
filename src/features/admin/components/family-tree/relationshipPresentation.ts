import type { RelationshipPathNode, RelationshipResult } from '../../services/familyV2Service';

const ancestorCodes = new Set(['father', 'mother', 'grandfather', 'grandmother', 'great_grandfather', 'great_grandmother', 'ancestor']);
const descendantCodes = new Set(['son', 'daughter', 'grandson', 'granddaughter', 'grandson_paternal', 'granddaughter_paternal', 'grandson_maternal', 'granddaughter_maternal', 'descendant']);

const inverseEdge = (edge?: string | null) => {
  const normalized = edge?.toLowerCase();
  return normalized === 'parent' ? 'CHILD' : normalized === 'child' ? 'PARENT' : edge;
};

/** Edges describe the hop INTO a node, so reversing people must move edges too. */
export function reverseRelationshipPath(path: readonly RelationshipPathNode[]): RelationshipPathNode[] {
  return [...path].reverse().map((node, index) => ({
    ...node,
    edge: index === 0 ? null : inverseEdge(path[path.length - index]?.edge),
  }));
}

/** Orient only the server's answer; never derive relationship codes from names or gender. */
export function getRelationshipPresentation(result: RelationshipResult, referenceId: number, targetId: number) {
  const forward = result.fromMemberId === referenceId && result.toMemberId === targetId;
  const reversed = result.toMemberId === referenceId && result.fromMemberId === targetId;
  if (!forward && !reversed) return null;
  const code = (forward ? result.relationshipCode : result.reverseRelationshipCode).toLowerCase();
  const label = forward ? result.relationshipLabel : result.reverseRelationshipLabel;
  // An incomplete server path may still have a valid answer. Omit misleading
  // geometry rather than filling in missing people or relationships locally.
  const validPath = result.path.length > 0 && result.path[0].memberId === result.fromMemberId
    && result.path[result.path.length - 1].memberId === result.toMemberId;
  const referencePath = validPath ? (forward ? result.path.map(node => ({ ...node })) : reverseRelationshipPath(result.path)) : [];
  const targetIsAncestor = ancestorCodes.has(code);
  return {
    code, label, referenceId, targetId,
    displayPath: targetIsAncestor ? reverseRelationshipPath(referencePath) : referencePath,
    verticalPath: targetIsAncestor || descendantCodes.has(code),
  };
}
