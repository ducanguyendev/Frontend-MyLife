# FamilyMember Avatar Upload Implementation Report

## Result

Implemented the FamilyMember avatar upload flow using the existing `GoogleDriveMemberAvatarService` and Apps Script member avatar contract. The API stores the Drive file ID privately and returns the avatar URL through `FamilyMemberDto`. No application database migration was applied.

## Acceptance checklist

1. **Storage reused:** Existing `IGoogleDriveMemberAvatarService` / `GoogleDriveMemberAvatarService` registered in `Program.cs` is reused.
2. **Apps Script contract:** Existing `member_avatar_upload` and `member_avatar_delete` actions are used; frontend never calls Apps Script.
3. **Apps Script modified:** No.
4. **Apps Script redeploy:** Not indicated by local diagnostic marker; it matches `member-avatar-v1-drive-v2-verified-overwrite`. A live deployed GET was not verified in this environment.
5. **Database change:** Nullable `FamilyMember.AvatarDriveFileId` mapped to `family_members.avatar_drive_file_id varchar(255)`.
6. **Migration:** `20261009152353_AddFamilyMemberAvatarDriveTracking.cs` (scaffolded; not applied).
7. **Avatar ID:** Storage managed only; returned by the member DTO neither on input nor output. Replacement passes the stored ID and keeps stable identity.
8. **Writable DTO security:** Removed `AvatarUrl` from Create/Update DTOs; metadata service no longer writes it. Legacy values remain readable.
9. **Upload endpoint:** `POST /api/family-tree/{id}/avatar`, multipart field `file`; success returns `{success,data:FamilyMemberDto}`.
10. **Delete endpoint:** `DELETE /api/family-tree/{id}/avatar`; returns updated member DTO.
11. **Ownership:** USER-only controller; both operations scope member to the current user’s tree; foreign member returns 404 before storage.
12. **File validation:** JPEG/JPG, PNG, WebP, GIF; empty/unsupported/over 5 MiB rejected. Existing storage also validates signatures and size.
13. **Request size:** Upload route limited to 6 MiB.
14. **Rate limiting:** Upload endpoint reuses `WebRateLimits.Upload`.
15. **First upload:** Creates file after the member exists; persisted URL, ID and UpdatedAt are returned.
16. **Replacement:** Existing Drive ID is passed to storage; response is validated before DB update.
17. **Stable ID:** Existing storage service and Apps Script contract preserve the ID; current storage contract harness covers repeated replacement.
18. **Avatar delete:** Storage delete first, then DB URL/ID clear; legacy URL without ID uses the idempotent null-ID delete contract.
19. **Member deletion cleanup:** DB commit happens first; Drive cleanup is best-effort with structured warning on failure.
20. **Partial failure:** New Drive file is compensated when the first upload succeeds but DB save fails; overwrite files are never compensated/deleted. Upload failure leaves member metadata saved and visible with localized error.
21. **Legacy URL:** Kept visible until user replaces/removes it; regular metadata update cannot overwrite it.
22. **URL form field:** Removed from the member form and CRUD payload.
23. **Picker:** File picker accepts the four supported formats; client checks type and 5 MiB limit.
24. **Preview cleanup:** Preview uses an object URL revoked on replacement, clearing selection, or modal unmount.
25. **Create flow:** Member POST, then avatar multipart POST using the returned ID.
26. **Edit flow:** Metadata PUT first; pending image POST or requested removal DELETE second. Unchanged image sends no avatar request.
27. **Cancel:** Pending selection/removal is local state only; close/cancel performs no avatar request.
28. **Cache:** Existing member `updatedAt` is used as a stable `t` query parameter; no per-render randomness.
29. **MemberCard:** Uses shared `getMemberAvatar` and shows returned URL.
30. **MemberList:** Uses shared `getMemberAvatar` and shows returned URL.
31. **MemberDetail:** Uses shared `getMemberAvatar` and shows returned URL.
32. **Mindmap:** Uses shared `getMemberAvatar` and shows returned URL.
33. **VI/EN:** Picker labels and known validation/storage errors are localized. Raw storage messages are not rendered.
34. **Backend tests:** Backend and test projects build. Existing member avatar storage unit tests and Apps Script contract harness pass. New authenticated endpoint/integration cases were not added because the required PostgreSQL test service is unavailable.
35. **Frontend tests:** Build, lint, i18n, Library UI, roles, avatar, optimization and existing Library suites pass. Dedicated create/edit/avatar sequencing tests remain a manual verification item.
36. **Migration test:** EF reports no pending model changes after scaffolding; migration file contains one nullable add/drop column. No DB migration test was run because PostgreSQL was unavailable.
37. **Manual browser:** Not verified; app/API browser session and test database were unavailable.
38. **Live Drive:** Not verified. Apps Script simulator tests passed; they use mocked Drive.
39. **Application DB migration applied:** No.
40. **Mobile modified:** No.
41. **Commit/push:** No.
42. **Next steps:** Start the disposable PostgreSQL integration test DB; run backend tests including new ownership/format/save-failure cases; manually exercise create, replace, cancel and delete in FamilyTree; verify deployed diagnostic marker and Drive persistence; review and apply this migration separately when ready.

## Validation performed

- `dotnet build MyLife.csproj -c Release --no-restore`: passed.
- `dotnet build Tests/Backend-MyLife.Tests.csproj -c Release --no-restore`: passed.
- `dotnet ef migrations has-pending-model-changes --no-build`: no model changes since migration.
- `dotnet test Tests/Backend-MyLife.Tests.csproj -c Release --no-build`: blocked by PostgreSQL refusing `127.0.0.1:55439`.
- Frontend `npm run build`, `npm run lint`, and suites `test:i18n`, `test:library`, `test:library-ui`, `test:roles`, `test:avatar`, `test:optimization`: passed.
- `node --test Tests/apps-script-member-avatar.test.cjs`: 21 passed.
- Apps Script source and deployment were not modified.
