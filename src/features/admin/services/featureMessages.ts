// User-facing FamilyTree/Library text belongs to frontend i18n. Never use
// backend message/title/validation strings to render a toast or modal error.
export const featureSuccessKeys = {
  memberCreate: 'admin.member_create_success', memberUpdate: 'admin.member_update_success', memberDelete: 'admin.member_delete_success',
  albumCreate: 'admin.library_ui.album_created', albumUpdate: 'admin.library_ui.album_updated', albumDelete: 'admin.library_ui.album_deleted',
  photoUpload: 'admin.library_ui.photo_uploaded', photoUpdate: 'admin.library_ui.photo_updated', photoDelete: 'admin.library_ui.photo_deleted',
  categoryCreate: 'admin.library_ui.category_created', categoryDelete: 'admin.library_ui.category_deleted',
} as const;

const errorCodes: Record<string, string> = {
  FAMILY_MEMBER_NOT_FOUND: 'admin.member_errors.not_found', FAMILY_RELATED_MEMBER_NOT_FOUND: 'admin.member_errors.related_not_found',
  FAMILY_SELF_RELATION: 'admin.member_errors.self_relation', FAMILY_PARENTS_MUST_DIFFER: 'admin.member_errors.parents_differ',
  FAMILY_SPOUSE_IN_USE: 'admin.member_errors.spouse_in_use', FAMILY_RELATIONSHIP_INVALID: 'admin.member_errors.relationship_invalid',
  FAMILY_RELATIONSHIP_CYCLE: 'admin.member_errors.relationship_cycle', FAMILY_VALIDATION_FAILED: 'admin.member_errors.validation',
  LIBRARY_NOT_FOUND: 'admin.library_ui.not_found', LIBRARY_ALBUM_NOT_FOUND: 'admin.library_ui.album_not_found',
  LIBRARY_PHOTO_NOT_FOUND: 'admin.library_ui.photo_not_found', LIBRARY_INVALID_IMAGE: 'admin.library_ui.file_invalid',
  LIBRARY_IMAGE_SIZE_INVALID: 'admin.library_ui.file_size', LIBRARY_FILE_COUNT_INVALID: 'admin.library_ui.file_count',
  LIBRARY_METADATA_INVALID: 'admin.library_ui.metadata_invalid', LIBRARY_VALIDATION_FAILED: 'admin.library_ui.validation',
  LIBRARY_ALBUM_UNAVAILABLE: 'admin.library_ui.album_unavailable', LIBRARY_CLEANUP_FAILED: 'admin.library_ui.cleanup_failed',
  LIBRARY_CATEGORY_IN_USE: 'admin.library_ui.category_in_use', LIBRARY_CATEGORY_CANNOT_DELETE: 'admin.library_ui.category_cannot_delete',
  LIBRARY_CATEGORY_NOT_FOUND: 'admin.library_ui.category_not_found', LIBRARY_CATEGORY_INVALID: 'admin.library_ui.category_invalid',
  AUTH_SESSION_INVALID: 'admin.notifications.session_expired', REQUEST_CONFLICT: 'admin.notifications.conflict',
};
const fallbackKeys = {
  category_save: 'admin.library_ui.category_save_failed', category_delete: 'admin.library_ui.category_delete_failed',
  member_load: 'admin.member_errors.load_failed', member_save: 'admin.member_errors.save_failed', member_delete: 'admin.member_errors.delete_failed',
  album_load: 'admin.library_ui.load_failed', album_save: 'admin.library_ui.save_failed', album_delete: 'admin.library_ui.album_delete_failed',
  photo_upload: 'admin.library_ui.upload_failed', photo_save: 'admin.library_ui.photo_save_failed', photo_delete: 'admin.library_ui.photo_delete_failed',
} as const;
export type FeatureAction = keyof typeof fallbackKeys;

export function getFeatureErrorKey(error: unknown, action: FeatureAction, responseStatus?: number): string {
  const failure = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const payload = failure.payload && typeof failure.payload === 'object' ? failure.payload as Record<string, unknown> : failure;
  const status = responseStatus ?? (typeof failure.status === 'number' ? failure.status : undefined);
  const code = typeof payload.code === 'string' ? payload.code : undefined;
  if (code === 'LIBRARY_STORAGE_FAILED' || code === 'LIBRARY_SAVE_FAILED') return fallbackKeys[action];
  if (code === 'LIBRARY_NOT_FOUND') return action.startsWith('photo') ? 'admin.library_ui.photo_not_found' : 'admin.library_ui.album_not_found';
  if (code && errorCodes[code]) return errorCodes[code];
  if (status === 0) return 'admin.notifications.connection_failed';
  if (status === 401) return 'admin.notifications.session_expired';
  if (status === 403) return 'admin.notifications.forbidden';
  if (status === 409) return 'admin.notifications.conflict';
  if (status === 413) return 'admin.library_ui.request_too_large';
  if (status === 404) return action.startsWith('member') ? 'admin.member_errors.not_found'
    : action.startsWith('photo') ? 'admin.library_ui.photo_not_found' : 'admin.library_ui.album_not_found';
  if (status === 400 || status === 422) {
    return action.startsWith('member') ? 'admin.member_errors.validation' : 'admin.library_ui.validation';
  }
  // Includes unrecognized codes and old deployments without codes. Raw backend
  // English is deliberately not a fallback for any status or network error.
  return fallbackKeys[action];
}
