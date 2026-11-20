# MyLife Web W7.5 — Click consistency và kiểm tra hồi quy

Ngày: 09/11/2026. Phạm vi chỉ W7.5; không bắt đầu W8 Admin/W9 Global Polish.

## 1. Repository

- Repository: `D:\DUAN\MYLIFE\Frontend-MyLife`.
- Branch: `feature_minhduc`.
- HEAD trước/sau sửa: `9bcb45d23320ddb58fad286be78b975b22646533`, khớp commit được giao.
- Working tree sạch trước khi sửa. Các thay đổi hiện tại thuộc lượt W7.5.
- Local `.env.local`: `shadcn-family-tree`. Production resolve về `family-view`. Đã chạy hai dev server kiểm tra riêng ở 7004/7005; không sửa renderer config hoặc `.env`.
- Không đổi Backend, Mobile, API contract, authentication, password, module Timeline/Library/Anniversary, global theme/font. Không commit/push/PR.

## 2. Family Tree

### Root cause và bản sửa

`FamilyPersonCard` production gọi `onFocus(member.id); onView(member)` trên avatar và tên, trong khi nền card chỉ gọi `onFocus`. Nút Edit trực tiếp còn gọi thêm `onFocus`. Shadcn đã tách click nội dung/action nhưng card article chưa có Tab stop và Enter/Space tương ứng.

| File source đã sửa | Nội dung |
|---|---|
| `src/features/admin/components/family-tree/family-view/FamilyPersonCard.tsx` | Avatar/tên chỉ gọi selection, có aria-pressed và label chọn người; action area/expand/edit chặn click bubbling; Edit chỉ gọi edit. Menu Escape đóng menu và giữ selection. `onView(member)` chỉ còn trong action Xem chi tiết. |
| `src/features/admin/components/family-tree/ShadcnFamilyTreePersonCard.tsx` | Article có Tab stop, label/current state, Enter/Space khi focus chính card; menu Escape đóng và trả focus về trigger. Giữ nguyên các click selection/action đã đúng. |
| `src/features/admin/components/family-tree/ShadcnFamilyTreeView.css` | Bổ sung focus-visible cho chính article, dùng accent/focus token hiện tại. Không đổi visual hierarchy/font/layout. |

Không sửa `FamilyTreeView.tsx`, `ShadcnFamilyTreeView.tsx`, graph, layout hoặc connector. Giữ opacity card dim 0.38 và connector dim 0.18.

### Kết quả hành vi

- Nền card, avatar, tên và thông tin cơ bản: chỉ chọn thành viên, không mở dialog/route/edit hoặc ghi dữ liệu.
- Nút/menu Xem chi tiết: mở quick detail đúng người. Nút/menu Edit: chỉ mở form edit. Trong browser, kích hoạt action ở Sơn Tùng trong khi đang chọn Đức không đổi selection của Đức.
- Menu chỉ mở menu; Escape khi đang trong menu đóng menu, giữ highlight. Escape ở canvas vẫn bỏ chọn.
- Unit chạy handler thực của hai card, mô phỏng bubbling và state menu, xác nhận mỗi click nội dung chỉ gọi selection một lần; action detail/edit/delete/branch/expand không gọi thêm selection.
- Browser xác nhận Tab thực sự đi tới article; Enter/Space chọn người; Space không cuộn trang; focus ring ít nhất 2px; DOM không có button lồng button.
- 12/12 trường hợp click: hai renderer × 1440/1920/390 × Light/Dark. Ảnh trong `card-click/`: initial, hover-selected, avatar ancestry, name ancestry, new-selection, Fit All. Ảnh avatar đồng thời thể hiện cousin dim.

### Ancestry và điều hướng

- Fixture regression dùng quan hệ đã có trong repository: chọn Đức làm sáng Mai Thu, Nguyễn Bửu, Nguyễn Mai Anh, Đức và Quốc Bảo. Sơn Tùng/Hoàng Yến/Hoàng Anh/Hoàng Minh không sáng chỉ vì cùng thế hệ/ông bà.
- Tập node và từng segment SVG được đối chiếu với graph selector. Hover không ghi đè selection; chọn người khác tính lại; clear trả opacity về 1.
- 16/16 trường hợp highlight qua trên hai renderer và bốn viewport 1440/1920/820/390, hai theme. Đo selected 1, unrelated card 0.38, edge 0.18.
- 4/4 lượt pointer pan, Focus, Fit All, fullscreen qua. Zoom/keyboard pan và bốn PNG export cũng qua. Nền giấy/lá và typography được giữ.
- Search/filter/Card/List và thuật toán expand/collapse không đổi. Callback branch/expand/delete được kiểm tra bằng handler unit; không gửi CRUD thật.
- Đây là graph fixture, không xác nhận hồ sơ gia đình hiện tại trong database; không hardcode người/ID trong production.

## 3. Map

**Mocked verification — Real Backend not verified.**

- Backend local `http://localhost:5274/api/me` phản hồi 401 khi kiểm tra bằng phiên mới. Không có phiên test đã xác thực được cung cấp cho lượt automation này.
- Dữ liệu thành viên/map và các thao tác lưu vị trí/retry geocoding đều được mock trong browser. VietMap không mock ở ma trận Map: style `lm`/`dm`, sprite và vector tile tải qua mạng thật. Artifact chỉ lưu pathname/status, không có API key.
- Giữ nguyên toàn bộ source Map từ đợt stabilization trước.
- Kiểm tra `/map`, editor và embedded profile: một GL layer/nhóm controls, tắt default zoom, +/−/Focus 44px/icon17px, marker/popup/member link, chọn điểm, PUT fixture, reopen, theme và provider retry.
- Editor được kiểm tra containment/isolation, hit-test header/footer và dropdown; không tràn canvas ra ngoài vùng map.
- Kiểm tra profile map dùng dữ liệu fixture sau cập nhật vị trí; không tuyên bố persistence hoặc tọa độ Backend thật đã được xác minh.
- Ma trận cuối **6/6 pass** tại 1440/1920/390, Light/Dark; mỗi trường hợp có tile thật HTTP 200 và không có page error. Kết quả tại `map/results.json`; log `map-final-run.log`.
- Một lượt đầu mở Map 1440 Light nhận style/sprite 200 nhưng không nhận vector tile trong 45 giây, canvas nền xám và marker còn hiện. Giữ ảnh/log của lượt đó tại `map/initial-load-blank.png` và `map-run.log`. Lượt chẩn đoán sau đó có tile 200, và ma trận chạy lại kiểm tra đầy đủ. Chưa đủ bằng chứng quy nguyên nhân cho source UI, provider, GPU hoặc mạng; không thêm retry/fallback suy đoán.

## 4. Relationship Explorer

**Mocked verification — Real Backend not verified.**

- Không sửa source `RelationshipExplorer.tsx`, `relationshipPresentation.ts` hoặc `siblingRelations.ts`.
- Picker 8/8 trường hợp đã qua ở 1440/1920/820/390, Light/Dark: fixed reference, floating label, tìm không dấu/toàn bộ thành viên, ID selection, check mark, chọn lại để bỏ chọn, clear result, keyboard, stale response và route reset. Không thêm `(Đời X)`.
- Ma trận mới: 6 trường hợp viewport/theme, tổng 72 truy vấn UI. Các câu trả lời canonical của server giữ nguyên endpoints khi request đảo chiều để kiểm tra reverseCode/path thực sự.
- Các nhóm: cha/mẹ–con, ông/bà–cháu, sibling có shared parent, cousin có path qua cha/mẹ/tổ tiên, vợ/chồng, unknown. Kiểm tra cả hai chiều, đúng người trong câu trả lời, sequence và từng nhãn cạnh; không tràn mobile.
- Generic `Sibling` thiếu parent không được biến thành cousin. Unknown không có path tự tạo. Nhãn cháu không tự thêm nội/ngoại từ giới tính.
- `relationship-matrix/results.json` ghi 72 truy vấn. Bản đồ profile ngoài phạm vi test relationship này nhận provider failure fixture để tách tải mạng; provider thật được kiểm tra riêng ở mục Map.
- Không có thay đổi output/layout so với implementation trước nên không giữ thêm ảnh Relationship trùng lặp; kết quả picker và ma trận được lưu bằng JSON/log.

## 5. Tests

### File test đã thay đổi/thêm

| File | Mục đích |
|---|---|
| `tests/family-tree-card-interaction.test.cjs` (mới) | 8 test thực thi handler hai card, callback count, bubbling, menu state, keyboard và action độc lập. |
| `tests/family-tree-card-click.browser.cjs` (mới) | 12 trường hợp UI, kiểm tra không mở dialog/route ngoài ý muốn, action độc lập, Tab/Enter/Space, ancestry/segments/clear, ảnh yêu cầu. |
| `tests/relationship-matrix.browser.cjs` (mới) | 72 truy vấn quan hệ có path/code fixture rõ ràng, hai chiều và sáu viewport/theme. |
| `tests/family-tree-view.test.cjs` | Thay assertion cũ bắt buộc avatar gọi onView bằng assertion selection + detail action riêng theo yêu cầu mới. Không nới assertion layout/graph. |
| `tests/helpers/stabilization-browser.cjs` | Cho chọn thư mục artifact để giữ báo cáo cũ; hook trả server answer riêng cho ma trận quan hệ. Không đổi hành vi app. |
| `tests/relationship-picker.browser.cjs` | Thư mục artifact cấu hình được; giữ nguyên assertion picker. |

### Kết quả

| Nhóm | Kết quả |
|---|---|
| Baseline bốn file được yêu cầu | 48 pass trước sửa |
| Unit sau sửa: bốn file yêu cầu + card interaction + adapters/layout/branch/viewport | 100 pass, 0 fail (`unit.log`) |
| Click browser | 12 pass (`card-click/results.json`) |
| Highlight/zoom/export browser | 16 pass (`tree/results.json`), 4 PNG |
| Navigation browser | 4 pass (`tree-navigation/results.json`) |
| Relationship picker | 8 pass (`relationship-picker/results.json`) |
| Relationship matrix | 6 pass / 72 truy vấn (`relationship-matrix/results.json`) |
| Map runtime | 6 pass; `map/results.json`; 1440/1920/390, Light/Dark, provider thật + API fixture |
| Build | PASS, exit 0; cảnh báo chunk lớn hơn 500kB, map chunk khoảng 1.15MB; không thêm dependency |
| Lint | PASS, exit 0; 0 error, 1 warning có sẵn tại `TimelineEventModal.tsx:44` (`form.title`/`update`) |
| `git diff --check` | PASS |

Known i18n harness issue `generationCardThemes` từ báo cáo trước không được sửa hoặc chạy lại trong W7.5; nó không chặn 100 unit test và các hồi quy thiết yếu đã chạy. Các test browser ban đầu phải điều chỉnh cách chờ DOM/menu visibility trước khi focus/assert; kết quả pass chỉ lấy từ lượt chạy hoàn tất, không nhận các lượt timeout là pass.

Tổng browser: **52 trường hợp hoàn tất đạt**, trong đó sáu trường hợp Relationship matrix chứa 72 truy vấn. Đây không phải 52 E2E với Backend thật.

Lệnh unit đã chạy:

```powershell
node --test tests/family-tree-highlight.test.cjs tests/family-tree-view.test.cjs tests/family-map.test.cjs tests/relationship-presentation.test.cjs tests/family-tree-card-interaction.test.cjs tests/family-tree-adapter.test.cjs tests/shadcn-family-tree-adapter.test.cjs tests/shadcn-family-tree-layout.test.cjs tests/shadcn-family-tree-branch.test.cjs tests/tree-viewport-fit.test.cjs
```

Các script browser dùng Chromium sẵn có trong `scratch_puppeteer/node_modules/puppeteer`, dev servers 7004 (Shadcn) và 7005 (`VITE_FAMILY_TREE_RENDERER=family-view`). Đặt `$env:MYLIFE_REVIEW_DIR='docs/review-w75'`; picker đặt thêm `$env:MYLIFE_UI_URL='http://127.0.0.1:7004'`. Không cần cài package/UI framework mới.

## 6. Remaining issues

**Quan sát Map tải nền không hoàn tất ở một lượt đầu, chưa xác định nguyên nhân:** mở `/map` trực tiếp trong browser automation mới, fixture family có ba vùng, viewport 1440×900 Light; chờ style/sprite VietMap 200 và tối đa 45 giây cho tile. Lượt gặp vấn đề chỉ có marker trên nền xám, không có tile response và không có page error. Lượt chẩn đoán/chạy lại có tile thật; chưa tái hiện ổn định. Ảnh/log được giữ để đối chiếu; chưa có bản sửa source dựa trên nguyên nhân đã xác minh cho quan sát này.

Không ghi nhận lỗi click/highlight/relationship còn tồn đọng trong các hồi quy hoàn tất. Trạng thái chưa xác thực Backend là giới hạn kiểm tra đã nêu ở mục 3/4, không được nhận là lỗi sản phẩm.

## 7. Verdict

**PARTIAL PASS.** Bản sửa click đạt unit và browser trên hai renderer; graph/connector/hierarchy không đổi và hồi quy qua. Relationship fixture kiểm tra 72 truy vấn; Map dùng network VietMap thật. Chưa có E2E Backend thật vì phiên mới nhận 401, và còn quan sát initial Map load không hoàn tất ở một lượt chưa có root cause xác minh.

Dừng sau W7.5. Chờ người dùng duyệt hình ảnh trước bất kỳ phase tiếp theo.
