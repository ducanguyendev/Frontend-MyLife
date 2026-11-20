import { memo } from "react";
import type { FamilyViewLink } from "./familyTreeTypes";
import { getFamilyRenderSegments } from '../familyTreeHighlight';

interface FamilyBranchProps {
  links: FamilyViewLink[];
  width: number;
  height: number;
  activeMemberId: number | null;
  highlightedSegmentIds: ReadonlySet<string>;
  variant?: 'stable' | 'shadcn';
}

export const FamilyBranch = memo(function FamilyBranch({ links, width, height, activeMemberId, highlightedSegmentIds, variant = 'stable' }: FamilyBranchProps) {
  const prefix = variant === 'shadcn' ? 'shadcn-family-tree__link' : 'family-tree-link';
  return <svg className={variant === 'shadcn' ? 'shadcn-family-tree__links' : 'family-tree-view__links'} width={width} height={height} aria-hidden="true">
    {links.flatMap(link => getFamilyRenderSegments(link).map(segment => {
      const related = activeMemberId != null && highlightedSegmentIds.has(segment.id);
      return <g key={segment.id} data-segment-id={segment.id} data-semantic-edges={segment.semanticEdgeIds.join(' ')} className={`${prefix} ${prefix}--${link.kind}${activeMemberId == null ? '' : related ? " is-related" : " is-dimmed"}`}>
        <path d={segment.path} />
        {link.kind === "spouse" && <>
          <circle cx={link.labelX} cy={link.labelY} r={9} />
          <text x={link.labelX} y={link.labelY} textAnchor="middle" dominantBaseline="central">♥</text>
        </>}
      </g>;
    }))}
  </svg>;
});
