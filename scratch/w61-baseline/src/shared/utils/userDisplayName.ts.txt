export interface UserIdentityName {
  displayName?: string | null;
  fullName?: string | null;
  /** Legacy name field returned by older API versions. */
  name?: string | null;
}

export const normalizeNameWhitespace = (value: string | null | undefined): string =>
  (value ?? '').trim().split(/\s+/u).filter(Boolean).join(' ');

export const generateDefaultDisplayName = (fullName: string | null | undefined): string => {
  const normalized = normalizeNameWhitespace(fullName);
  if (!normalized) return '';
  const words = normalized.split(' ');
  return words.length === 1 ? words[0] : `${words[0]} ${words[words.length - 1]}`;
};

export const getUserDisplayName = (user: UserIdentityName | null | undefined, fallback = 'Account'): string => {
  const displayName = normalizeNameWhitespace(user?.displayName);
  if (displayName) return displayName;
  const shortFullName = generateDefaultDisplayName(user?.fullName);
  if (shortFullName) return shortFullName;
  const fullName = normalizeNameWhitespace(user?.fullName);
  if (fullName) return fullName;
  const legacyName = normalizeNameWhitespace(user?.name);
  return legacyName || fallback;
};

export const getDisplayNameInitials = (name: string): string => {
  const words = normalizeNameWhitespace(name).split(' ').filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toLocaleUpperCase();
  return words[0]?.slice(0, 2).toLocaleUpperCase() || 'US';
};
