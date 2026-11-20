export const MEMBER_AVATAR_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif';
export const MAX_MEMBER_AVATAR_BYTES = 5 * 1024 * 1024;

export function isValidMemberAvatar(file: Pick<File, 'type' | 'size'>): boolean {
  return MEMBER_AVATAR_ACCEPT.split(',').includes(file.type.trim().toLowerCase())
    && file.size > 0 && file.size <= MAX_MEMBER_AVATAR_BYTES;
}
