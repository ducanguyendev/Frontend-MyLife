import React from "react";
import { UserRound } from "lucide-react";
import { apiClient } from "@/shared/api/apiClient";
import type { FamilyMember } from "./types";

interface MemberAvatarImageProps {
  member: Pick<FamilyMember, "id" | "fullName" | "avatarUrl" | "hasManagedAvatar" | "updatedAt">;
  alt?: string;
  className: string;
  /** Used only for an unsaved local upload preview. */
  sourceOverride?: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts.at(-1)?.[0]}`)
    .toLocaleUpperCase();
}

export const MemberAvatarImage: React.FC<MemberAvatarImageProps> = ({ member, alt, className, sourceOverride }) => {
  const managed = member.hasManagedAvatar === true;
  const revision = member.updatedAt ? `?v=${encodeURIComponent(member.updatedAt)}` : "";
  const candidate = sourceOverride || (managed
    ? apiClient.url(`/api/family-tree/${member.id}/avatar/image${revision}`)
    : member.avatarUrl || "");
  const identity = `${member.id}:${managed ? "managed" : member.avatarUrl ?? "none"}:${member.updatedAt}:${sourceOverride ?? ""}`;
  const [failedIdentity, setFailedIdentity] = React.useState<string | null>(null);
  const failed = failedIdentity === identity;

  if (!candidate || failed) {
    return (
      <div role="img" aria-label={alt ?? member.fullName} className={`${className} flex items-center justify-center overflow-hidden bg-accent/10 text-accent`}>
        {member.fullName.trim() ? <span aria-hidden="true" className="select-none text-sm font-semibold">{initials(member.fullName)}</span> : <UserRound aria-hidden="true" size={20} />}
      </div>
    );
  }

  return <img loading="lazy" decoding="async" src={candidate} alt="" role="img" aria-label={alt ?? member.fullName}
    className={className} onError={() => setFailedIdentity(identity)} />;
};
