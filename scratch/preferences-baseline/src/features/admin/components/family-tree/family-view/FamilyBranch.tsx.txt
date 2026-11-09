import { memo } from "react";
import type { FamilyViewLink } from "./familyTreeTypes";

interface FamilyBranchProps {
  links: FamilyViewLink[];
  width: number;
  height: number;
  activeMemberId: number | null;
  relatedMemberIds: ReadonlySet<number>;
}

export const FamilyBranch = memo(function FamilyBranch({ links, width, height, activeMemberId, relatedMemberIds }: FamilyBranchProps) {
  return <svg className="family-tree-view__links" width={width} height={height} aria-hidden="true">
    {links.map(link => {
      const related = activeMemberId == null || link.memberIds.some(id => relatedMemberIds.has(id));
      return <g key={link.id} className={`family-tree-link family-tree-link--${link.kind}${related ? " is-related" : " is-dimmed"}`}>
        <path d={link.path} />
        {link.kind === "spouse" && <>
          <circle cx={link.labelX} cy={link.labelY} r={9} />
          <text x={link.labelX} y={link.labelY} textAnchor="middle" dominantBaseline="central">♥</text>
        </>}
      </g>;
    })}
  </svg>;
});
