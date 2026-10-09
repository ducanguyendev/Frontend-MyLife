# Library Drive image 429 fix report

Ngày: 07/10/2026. Project: Frontend-MyLife, branch feature_minhduc.

Đã sửa lifecycle và số lần thử ảnh ở frontend. Build, lint, 34 Node tests và hai browser harness PASS. Không sửa Backend/Mobile/Google Apps Script, không deploy/commit/push. Thay đổi local từ các lượt trước được giữ nguyên.

## Root cause và giới hạn xác minh

Network thực tế do người dùng cung cấp cho thấy Drive thumbnail trả302, sau đó Google image trả 429. Đây là lỗi tải ở Google; frontend không thể biến response429 thành ảnh thành công. Image onError cũng không cung cấp HTTP status cho React, nên mọi lỗi ảnh đều dùng cùng flow hữu hạn.

Source local trước fix **đã** có tối đa hai candidates và guard bỏ stale callback; không tìm thấy loop vô hạn do ordinary rerender với cùng URL. Key JSON.stringify(candidates) lúc đó có nội dung ổn định khi props không đổi. Report không quy lỗi cho một reset effect vốn không tồn tại.

Hai cơ chế gây thêm attempts đã xác định:

- LibraryTab gọi setLibraryPhotos([]) ở đầu mỗi refresh. React xóa gallery cards, unmount LibraryImage; khi metadata tải lại, cùng photo được mount với candidateIndex=0. Vì vậy refresh sau upload/edit/delete có thể thử lại ảnh đã exhausted dù URL/Drive ID không đổi. Key photo.id ổn định không cứu được instance đã bị unmount.
- Dedup trước đây chỉ dùng exact-string Set. Stored thumbnail có query order khác (sz trước id), size khác hoặc tham số phụ có thể tương đương generated thumbnail nhưng vẫn tạo hai candidates. Hai attempts có thể đi qua cùng redirect target và gặp cùng429.

Ngoài ra img trước đây có key theo current candidate URL, nên đổi fallback tạo img DOM node mới. Đã bỏ key này; đổi src trong cùng node, state attempts vẫn thuộc identity ảnh.

Không khẳng định đã tái hiện được Google rate limit của account thật. Người dùng cung cấp file local WebP “download (1).webp” (6.408 bytes), chưa có driveFileId/URL ảnh thật. Browser đã giải mã và hiển thị chính bytes của file này ở gallery/lightbox, đồng thời kiểm tra chuỗi302→429 bằng intercepted responses. Đây là browser/React/network lifecycle test thực, **Google responses vẫn được kiểm soát**, không phải live Drive verification. Không upload file này lên Drive hoặc gọi API backend thật.

## Files sửa trong lượt này

| File | Thay đổi |
| --- | --- |
| src/features/admin/components/family-tree/LibraryImage.tsx | useMemo theo primitive dependencies; optional photoId; identity key rõ ràng; canonical thumbnail dedup; bounded index; bỏ key img theo candidate; sizing theo variant. |
| src/features/admin/components/family-tree/LibraryTab.tsx | Giữ cards qua refresh, ẩn grid khi loading/error; truyền photo.id; chỉ mount lightbox khi previewPhoto có giá trị, key theo photo.id. |
| src/features/admin/components/family-tree/PhotoLightboxModal.tsx | Truyền photo.id vào LibraryImage lightbox; giữ guard closed→null. |
| tests/library-ui.test.cjs | Giữ bảy tests cũ, bổ sung bốn tests về success/rerender, fallback/exhaustion/identity, logical thumbnail dedup và closed/open lightbox; memo mock có dependency comparison. |
| tests/feature-i18n.test.cjs | Giữ toàn bộ assertions; fixture mở card trước edit/delete vì closed lightbox nay không mount. Thêm assertion closed không có Lightbox. |
| tests/library-image-browser-harness.tsx | Fixture test-only dùng React thật/StrictMode và production LibraryImage/PhotoLightboxModal/LibraryTab. Không import vào production routes. |
| tests/library-image-429.browser.cjs | Request-count test qua Puppeteer, redirect302/429, real WebP decode, metadata refresh và stable DOM instance. |
| LIBRARY_DRIVE_IMAGE_429_FIX_REPORT.md | Report này. |

Không đổi Backend DTO, Library service routes, URL trong DB, Drive file ID, Apps Script hoặc dependencies/package.json.

## Candidate flow BEFORE / AFTER

| Tình huống | BEFORE | AFTER |
| --- | --- | --- |
| Ordinary same-photo rerender | Finite state đã giữ khi candidate key không đổi | Memoized array + key từ photoId/driveFileId/trimmed primaryUrl/variant; caption, class, locale không reset |
| Primary success | Hiển thị primary | Hiển thị primary; không tải fallback |
| Primary failure | Chuyển fallback; đổi img key | Chuyển đúng một candidate, cùng img DOM node |
| Last candidate failure | Placeholder trong instance đó | Placeholder, index bị chặn tại candidates.length; không quay về0 |
| Metadata refresh | Clear cards → unmount → same photo starts lại0 | Giữ cards/identity; same-photo exhausted state vẫn giữ |
| Equivalent stored thumbnail | Exact strings khác nhau có thể tạo duplicate | Canonical id + requested width; query order/size/extraneous thumbnail params không tạo duplicate |
| Real identity change | Reset theo candidate-array key, chưa có photo.id riêng | Reset theo photo.id, Drive ID, primary URL hoặc variant |
| Closed lightbox | Modal component mount nhưng guard không render ảnh | Parent chỉ mount khi mở; guard trong modal vẫn giữ |

Cấu trúc candidates tối đa hai: valid primary → alternate Drive thumbnail → placeholder. Nếu primary đã là thumbnail tương đương fallback, chỉ còn **một** candidate → placeholder khi fail.

Stored lh3.googleusercontent.com/d/... và drive.google.com/thumbnail là hai delivery endpoints khác nhau. Giữ một fallback giữa chúng để bảo toàn chức năng khi primary endpoint lỗi; không gọi chúng song song. Redirect URL do Google trả về không thể deduplicate trước khi tải. Network row của302 và redirect target là hai hops của một candidate, không phải hai lần React retry.

onError chỉ tăng index khi callback thuộc index hiện tại; stale callbacks không tăng tiếp. Không set index=0, không timeout retry, không cache-busting random/timestamp, không preload candidates, không global retry cache hoặc tăng concurrency.

Ảnh thật sự unmount (rời tab/filter, đóng rồi mở lại lightbox, reload page) tạo instance mới; fix không thêm persistent negative cache. Giới hạn áp dụng cho mỗi instance/identity và refresh metadata không còn phá instance. Hết candidates dừng cho tới genuine identity change hoặc mount mới.

## Gallery và lightbox

Gallery luôn explicit thumbnail: known Google primary/fallback dùng w640, loading=lazy, decoding=async. URL custom/legacy vẫn ưu tiên làm primary. Canonicalization chỉ ở rendered candidate, không ghi DB. Grid được ẩn bằng display:none khi loading/error để không hiện dữ liệu cũ; mounted card vẫn giữ attempt state.

Lightbox chỉ tải sau thao tác mở. Explicit lightbox: known Google primary/fallback dùng w1600, eager + async. Không preload high-res từ gallery. Khi đóng, modal unmount và không có high-res img. Original link vẫn https://drive.google.com/file/d/{driveFileId}/view, không đổi storage identity.

## Regression cases và request-count evidence

Browser fixture dùng React StrictMode, cache disabled và controlled no-store responses. Mỗi thao tác rerender được flush qua animation frame; không chỉ đếm source code hoặc mocked hook.

| Case bắt buộc | Kết quả |
| --- | --- |
| 1. Primary success | Primary 1, fallback 0; decoded image; 30 rerenders không thêm request. |
| 2. Primary fail → fallback once | Primary 1, thumbnail 1, redirect target 1 trả 200; không retry primary. |
| 3. Primary+fallback fail | Primary 1, thumbnail 1, redirect target 1 trả 429; placeholder; không còn img. |
| 4. Same-photo rerender | 30 rerenders sau exhausted không tăng request count; caption/class thay đổi không reset. |
| 5. Photo identity đổi | Chỉ đổi photo.id từ1→2 với cùng URLs: starts một sequence mới; count tăng đúng một primary/fallback sequence. |
| 6. Gallery không preload w1600 | Known primary w640 đúng1; no w1600 trước mở. lazy/async verified DOM. |
| 7. Closed lightbox | Không dialog/image high-res; đóng và 30 rerenders không thêm w1600. |
| 8. Open lightbox | Primary w1600 đúng1; 30 rerenders trong lúc mở không thêm request. |

Thêm hai browser checks:

- Stored thumbnail query sz=w1600&id=... và fallback generated được normalize thành một w640 candidate: đúng một thumbnail request và một redirect429, rồi dừng.
- Production LibraryTab edit metadata → refresh: placeholder DOM node vẫn chính instance cũ, gallery primary w640=1 và fallback w640=1 trước/sau refresh. Lightbox high-res attempts trong edit flow được đếm riêng, không nhầm thành gallery retry.

## Validation

| Command / harness | Result |
| --- | --- |
| npm run build | PASS, TypeScript + production Vite |
| npm run lint | PASS |
| npm run test:library | 4/4 PASS |
| npm run test:library-ui | 11/11 PASS (bảy existing + bốn mới) |
| npm run test:optimization | 8/8 PASS, gồm production manifest/lazy split và image variants |
| npm run test:i18n | 11/11 PASS, additional regression check |
| node tests/library-image-429.browser.cjs | PASS, 10 groups gồm tám cases bắt buộc + dedup/refresh |
| node tests/library-ui.browser.cjs | PASS, 17 existing groups (CRUD/upload/preview/fallback/reload/original/VI-EN/mobile/dark/dialog/ErrorBoundary) |
| git diff --check (Frontend) | PASS |
| Backend/Mobile tracked diff vs snapshot đầu lượt | Không đổi |

Tổng Node tests đã chạy trong lượt: 34 pass,0 fail. Không remove tests để pass. Browser Google/network fixtures được intercepted, không backend/Drive writes. Backend readonly diff-check thấy whitespace sẵn có trong FAMILY_LIBRARY_I18N_REPORT.md:178; giữ nguyên vì user yêu cầu không sửa Backend. Frontend diff-check sạch.

## Reproduce

Ở terminal Frontend-MyLife:

~~~powershell
npm run build
npm run lint
npm run test:library
npm run test:library-ui
npm run test:optimization
npm run test:i18n
~~~

Trong terminal riêng:

~~~powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 7001 --strictPort
~~~

Browser harness:

~~~powershell
# Set BROWSER_EXECUTABLE to an installed Chromium executable if Edge unavailable.
# Optional USER_WEBP_FIXTURE points to a local image; it is only read, never uploaded.
node tests/library-image-429.browser.cjs
node tests/library-ui.browser.cjs
~~~

Puppeteer reuse scratch_puppeteer/node_modules; không thêm runtime dependency. Restricted run dùng LIBRARY_UI_NO_SANDBOX=1 cho test browser; default harness giữ sandbox. Artifacts/results.json được ghi vào temp directory được command in ra.

## Review và live verification tiếp theo

Agent dừng sau source/tests/report, không commit/push/deploy. Review frontend diff trước khi dùng bản sửa.

Để xác nhận read-only trên Drive thật, cần driveFileId hoặc URL ảnh đang lỗi, không chỉ file local. Sau đó dùng DevTools Preserve log, filter theo ID: ordinary rerender và metadata edit/refresh không lặp gallery attempts; tối đa một primary và một fallback cho identity đang mount; 302 + target429 là redirect chain; exhausted hiển thị placeholder. Mở lightbox mới bắt đầu high-res sequence, đóng thì không còn high-res mount. Không spam reload/upload để “test lại”429.

Fix làm request flow hữu hạn và tránh attempts thừa. Nếu Google vẫn trả 429 cho cả hai delivery endpoints, UI dừng gracefully; report không tuyên bố upstream429 hoặc live image availability đã được giải quyết.
