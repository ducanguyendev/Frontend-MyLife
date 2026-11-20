# MyLife — Báo cáo Final Stabilization

Ngày kiểm tra: 09/11/2026. Phạm vi: Frontend Web, W7 Map, Family Tree, Relationship Explorer và QA modal hồ sơ W8.

## 1. Current repository state

- Repository: `D:\DUAN\MYLIFE\Frontend-MyLife`.
- Branch: `feature_minhduc`.
- HEAD: `82f1b60bef37c927038ddb90e015ea9cd084d600`.
- Working tree sạch khi bắt đầu; không có thay đổi chưa commit từ trước cần giữ riêng.
- Các bản sửa ancestry, connector chia đoạn, VietMap và layout hồ sơ W8 đã có trong HEAD. Đã kiểm tra trước khi chỉnh; không viết lại graph hay thiết kế modal.
- Local `.env.local` yêu cầu `shadcn-family-tree`; production vẫn resolve về `family-view`. Không sửa cấu hình renderer hoặc file môi trường. `family-chart`, `memoir`, `shadcn-family-tree` chỉ được bật trong development; cấu hình `react-flow` vẫn giữ ngoại lệ đã có.
- Không sửa Backend/Mobile, endpoint/DTO, bảo mật mật khẩu; không commit, push hoặc tạo PR.

## 2. Confirmed root causes

| Vấn đề | Nguyên nhân đã xác nhận |
|---|---|
| Nhánh không liên quan còn quá sáng | Card của hai renderer dùng opacity khoảng 0.60/0.62; rule connector cuối cùng khoảng 0.45. Selector ancestry có sẵn đã trả đúng tập người, nên lỗi còn lại chủ yếu là phân cấp thị giác. |
| Chọn bằng bàn phím ở renderer production | `FamilyPersonCard` chỉ chọn khi click phần card, chưa có điểm focus/Enter/Space tương ứng cho chính card. Các nút chi tiết vẫn giữ hành vi riêng. |
| Quan hệ thiếu dữ liệu bị gọi là cousin | `getSiblingKind()` chuyển mọi horizontal `Sibling` không có shared parent thành `cousin`. Đây không phải bằng chứng quan hệ họ. |
| Đảo chiều sơ đồ quan hệ sai nhãn cạnh | Khi API trả endpoints ngược, Explorer đảo mảng người nhưng chưa chuyển cạnh incoming sang đúng node và đảo PARENT/CHILD. |
| Nhãn quan hệ quá cụ thể | Explorer suy ra nội/ngoại của cháu từ giới tính node giữa. Một số nhãn cô/dì/cậu không thể hiện việc chưa biết lớn/nhỏ tuổi so với cha/mẹ. |
| Controls bản đồ không thống nhất | Main/editor dùng icon Layers cho Fit; profile dùng zoom mặc định Leaflet. CSS controls nằm riêng trong trang Map nên embedded profile không có cùng nhóm style. |
| Resize/lifecycle bản đồ | Main map chưa dùng helper resize; helper cũ không hủy đủ RAF lồng nhau khi unmount. Polling chưa abort request khi effect kết thúc. |
| Tìm vị trí thiếu kết quả | Normalize chưa đổi `đ` thành `d`; tìm khu vực chỉ xét displayName và tên, bỏ địa chỉ thành viên khi khác tên vùng. |

Không thấy bằng chứng cần viết lại `familyTreeConnectors.ts`, graph ancestry hoặc layout hồ sơ W8. Những phần này được giữ nguyên và kiểm tra hồi quy.

## 3. Changes made

Các đường dẫn đầu tiên dưới đây tính từ `src/features/admin/components/family-tree/`.

| File | Thay đổi và lý do |
|---|---|
| `FamilyLocationMap.tsx` | Gom controls +/−/Focus dùng chung, label/tooltip và chống truyền sự kiện; resize hủy RAF/observer/listener đầy đủ, kiểm tra container còn gắn DOM. Embedded map có cùng controls. |
| `FamilyMapSurface.css` (mới) | CSS controls và lỗi provider dùng chung cho ba bề mặt; nút 44px, icon 17px, focus rõ. |
| `FamilyMapTab.tsx` | Dùng shared controls/resize, abort polling, tìm `đ` không dấu và địa chỉ gốc. Bỏ controls trùng. |
| `FamilyMapTab.css` | Chuyển CSS dùng chung sang surface; bỏ kích thước controls mobile khác nhau. Giữ containment và layout hiện tại. |
| `VietMapBaseLayer.tsx` | Import CSS surface; không thay provider, URL style, key hoặc cơ chế tải layer. |
| `siblingRelations.ts` | Thêm trạng thái unknown; shared parent xác nhận sibling, dữ liệu `Cousin` rõ ràng mới xác nhận cousin. Generic Sibling thiếu parent giữ neutral. |
| `familyTreeHighlight.ts` | Chỉ sửa comment cũ gây hiểu nhầm horizontal Sibling là cousin; giữ thuật toán. |
| `MemberDetailModal.tsx` | Hiển thị nhóm quan hệ chưa xác minh thay vì đưa vào cousin. |
| `MemberFormModal.tsx` | Giữ khả năng xem/xóa record ngang hiện có; hỗ trợ kind unknown và cousin rõ ràng, không tự chuyển dữ liệu lưu. |
| `relationshipPresentation.ts` (mới) | Utility thuần định hướng câu trả lời và path từ API, đảo incoming edge đúng node, kiểm tra endpoints, bỏ geometry không đủ đầu/cuối. |
| `RelationshipExplorer.tsx` | Dùng utility, chọn đúng code/reverseCode, từ chối phản hồi sai cặp người; bỏ suy diễn nội/ngoại bằng giới tính. Giữ picker/layout. |
| `family-view/FamilyPersonCard.tsx` | Dim 0.38; card có focus, Enter/Space và aria-current. Giữ các nút điều hướng/CRUD. |
| `family-view/FamilyTreeView.css` | Connector không liên quan 0.18, outline khi focus card. |
| `ShadcnFamilyTreePersonCard.tsx` | Dim 0.38 thống nhất renderer production. |
| `ShadcnFamilyTreeView.css` | Connector không liên quan 0.18. |
| `src/features/my-life/pages/FamilyMemberProfilePage.tsx` | Nhóm quan hệ chưa xác minh; tắt zoom mặc định để embedded map chỉ có shared controls. |
| `src/shared/locales/vi/admin.json` | Nhãn unknown; sibling trung tính; cô/dì/chú/cậu/bác giữ phần chưa biết tuổi và bên gia đình đúng mức API cung cấp. |
| `src/shared/locales/en/admin.json` | Nhãn unknown tương ứng; giữ các mapping quan hệ EN hiện có. |

Các file test tính từ root repository:

| File | Mục đích |
|---|---|
| `tests/family-map.test.cjs` | Cập nhật cấu trúc shared controls và thêm hồi quy cleanup RAF/observer/listener khi unmount. |
| `tests/scroll-sibling.test.cjs` | Thay kỳ vọng cousin sai bằng unknown có căn cứ; thêm cousin explicit và neutral bất kể DOB. |
| `tests/relationship-presentation.test.cjs` (mới) | Hai chiều code API, đảo cạnh, không mutate/duplicate do orientation, unknown/path thiếu và nhãn VI/EN. |
| `tests/helpers/stabilization-browser.cjs` (mới) | Fixture API cục bộ, regression graph theo dữ liệu mẫu có sẵn; provider VietMap thật; chặn mọi mutation fixture trước khi ra Backend. Chỉ lưu provider pathname/status, không lưu key. |
| `tests/family-map.browser.cjs` (mới) | Map/editor/profile map, tìm kiếm, filter, marker, controls, coordinate/save fixture, reopen, theme, provider failure/retry, geometry. |
| `tests/family-map-states.browser.cjs` (mới) | Loading, API error, retry, empty family ở desktop/mobile hai theme. |
| `tests/family-tree-focus.browser.cjs` (mới) | Hai renderer × bốn viewport × hai theme; so semantic segments với selector, hover/click/clear/keyboard, hierarchy, zoom và PNG. Tải PNG vào OS temp rồi chép file hoàn tất để tránh Vite theo dõi `.crdownload`. |
| `tests/family-tree-navigation.browser.cjs` (mới) | Pointer pan, Focus, Fit All, fullscreen và giữ selection. |
| `tests/relationship-picker.browser.cjs` | Thêm 1920px và dùng Chromium có trong môi trường; giữ các assertion picker, stale response, route reset. |
| `tests/relationship-direction.browser.cjs` (mới) | Câu trả lời forward/reversed API, sequence/edge label và unknown trên tám trường hợp UI. |
| `tests/profile-layout.browser.cjs` | Thêm 1920px, chờ animation đúng; synthetic upload/remove, validation, switch/logout với CORS fixture đủ method. Không gửi thay đổi mật khẩu hoặc hồ sơ thật. |

Ảnh và JSON/log là bằng chứng kiểm tra: `docs/review-final/`, `docs/review-w80/`, `docs/review-relationship-picker/`. Danh sách chính xác từng file thay đổi được lưu trong `changed-files.md`; các ảnh cùng nhóm chỉ khác renderer/theme/viewport/trạng thái.

## 4. W7 Map verification

- Cả `/map`, editor và embedded profile dùng chung VietMap GL; không thêm provider dự phòng.
- Xác nhận network thật tới VietMap: style `lm`/`dm`, sprite và vector tile HTTP 200. Key không xuất trong báo cáo, log hoặc artifact.
- Modal: containment/isolation/overflow được giữ; browser hit-test header/footer và dropdown phía trên map. Editor không che các thao tác ngoài vùng map.
- Một nhóm controls mỗi map, không có default Leaflet zoom; +/−/Focus cùng kích thước.
- Browser kiểm tra chọn location, marker/popup/member link, zoom/Fit, chọn điểm, PUT location vào fixture, mở lại editor một GL layer, retry geocoding và profile map.
- Hai lượt 1440px ép provider 503: marker vẫn còn, retry tải lại đúng VietMap và chỉ có một layer. Theme thay đổi qua UI settings trong khi map đang mount.
- Loading, API 503, retry và empty family: 4/4 trường hợp độc lập qua.
- Ma trận map chính **8/8 pass** ở 1440/1920/820/390, Light/Dark: mỗi trường hợp có vector tile VietMap HTTP 200 và không có page error; xem `map/results.json`. Có các lượt đầu chưa nhận vector tile dù style 200; đã ghi lại trong `map-run.log`. Browser phải cuộn canvas mobile vào viewport trước khi đợi render. Không quy mọi trường hợp chậm mạng thành lỗi UI hoặc khẳng định provider luôn sẵn sàng.

## 5. Family Tree verification

- Local: Shadcn trên port kiểm tra 7004; production `family-view` trên 7005 bằng override riêng cho dev server, không sửa `.env`.
- Regression chọn Đức: sáng Mai Thu, Nguyễn Bửu, Nguyễn Mai Anh, Đức và Quốc Bảo, đúng parent IDs của fixture repository. Sơn Tùng, Hoàng Yến, Hoàng Anh, Hoàng Minh vẫn dim; không hardcode tên/ID trong production.
- Shared parent được dùng để xác nhận sibling, kể cả chỉ có một parent đã ghi nhận; record ngang thiếu parent không làm sáng nhánh.
- 16/16 trường hợp: tập node và từng SVG segment khớp semantic route; hover không đổi camera/selection; click giữ highlight sau mouse leave; chọn người khác và Escape tính lại/xóa đúng; keyboard kích hoạt được.
- Đo browser: selected 1.00, unrelated card 0.38, unrelated edge 0.18 trong cả hai theme và hai renderer. Đã xem ảnh thực tế, người không liên quan còn nhận ra được.
- 4/4 lượt bổ sung pointer pan/Focus/Fit All/fullscreen qua. Zoom, keyboard pan và bốn file PNG cũng qua; đã mở PNG xem đường nối, chữ và nền botanical/paper.
- Không sửa thuật toán connector, font, card layout, generation/search/Card/List hoặc workflow CRUD.

## 6. Relationship Explorer verification

- Picker: 8/8 trường hợp ở 1440/1920/820/390, Light/Dark. Reference cố định, floating label, tìm không dấu và thành viên ngoài immediate relatives, check mark, deselect, keyboard, narrow geometry, stale response và reset khi chuyển profile đều qua.
- Direction UI: 8/8. Mai Thu → Mai Anh trả Con gái; request đảo với response endpoints ngược trả Mẹ đúng người, ancestor ở trên và cạnh Con gắn đúng bước.
- Unit kiểm tra forward/reverse cho cha/mẹ/con/ông/bà/cháu/sibling/spouse/cậu/cô/cháu họ/cousin/related theo code API. Không khẳng định mọi nhãn này đã được kiểm tra bằng Backend thật.
- Generic horizontal Sibling thiếu parent được hiển thị “Quan hệ chưa xác minh”; không gọi cousin. Chỉ record Cousin rõ ràng mới phân loại cousin ngoài shared-parent sibling.
- Không suy ra nội/ngoại từ giới tính hoặc thêm người/path khi API thiếu dữ liệu. VI/EN lookup cho nhãn mới đã qua test.

## 7. Profile verification

- Không thay code/CSS modal hồ sơ trong đợt này.
- 10/10 trường hợp: 1440×900, 1920×1080, 390×844, 820×1180 và 1440×600, mỗi kích thước có Light/Dark; gồm VI/EN.
- Geometry: tabs bằng chiều rộng/chiều cao, badges cùng chiều cao, footer actions bằng nhau, dialog nằm trong viewport, không tràn ngang body/metadata, màn hình thấp có scroll.
- Đã kiểm tra mở/đóng, đổi tab bằng click/keyboard, vào edit, validation mật khẩu rỗng, synthetic avatar upload/remove, account switch/logout. Các request ghi chỉ đến mock; không đổi tài khoản thật.
- Ảnh cả hai tab: `../review-w80/`; số đo: `../review-w80/results.json`.

## 8. Test results

| Nhóm | Kết quả |
|---|---|
| Bốn file bắt buộc trước sửa | 35 pass |
| Bốn file bắt buộc sau sửa + relationship utility ban đầu | 40 pass, gồm test lifecycle mới và 4 test relationship |
| Tree/adapters/layout/branch + relationship utility | 62 pass; log `unit-layout.log` |
| Sibling/form bằng pattern repository | 4 pass; `unit-sibling.log` |
| Viewport fit | 4 pass; `unit-viewport.log` |
| Relationship utility + VI/EN cuối cùng | 5 pass; `unit-relationship-final.log` |
| `tests/feature-i18n.test.cjs` | FAIL tại setup loader: `Unexpected import ./generationCardThemes`. Test, `types.ts` và module đó đều không đổi so với HEAD. Chưa chạy tới assertion; không sửa assertion để che lỗi. |
| Tree browser | 16 pass + 4 navigation pass, 4 PNG |
| Picker browser | 8 pass |
| Relationship direction browser | 8 pass |
| Profile browser | 10 pass |
| Map loading/error/empty browser | 4 pass |
| Map runtime chính | 8 pass; `map/results.json` và `map-final-run.log`; API fixture, provider network thật |
| `npm.cmd run build` | PASS, exit 0; TypeScript và Vite qua. Cảnh báo chunk lớn hơn 500kB; map chunk khoảng 1.15MB, không thêm dependency. |
| `npm.cmd run lint` | PASS, 0 error, 1 warning có sẵn: `TimelineEventModal.tsx:44`, dependency `form.title`/`update`. |
| `git diff --check` | PASS |

Các lượt debug bị timeout do chờ transition, CORS fixture thiếu DELETE hoặc download `.crdownload` đã được sửa trong test harness. Không dùng kết quả các lượt đó để tuyên bố pass. Kết quả pass nêu trên là các lượt chạy lại đã hoàn tất.

## 9. Remaining limitations

- Chưa có E2E với phiên đăng nhập, database và mutation Backend thật. Chưa xác nhận lưu vị trí bền vững, geocoding queue hoặc avatar/password/session trên môi trường thật.
- Graph kiểm tra là regression fixture theo repository, không phải đọc hồ sơ gia đình hiện tại từ database. Độ chính xác ngoài fixture phụ thuộc fatherId/motherId/childIds và code/path Backend trả về.
- Model hiện có không chứng minh quan hệ sinh học ngoài shared recorded parent, hoặc phân biệt đầy đủ full/half/adoptive; thiếu dữ liệu phải giữ neutral. Explicit Cousin chỉ được dùng khi record đã ghi rõ, không tự sinh/cập nhật dữ liệu.
- Chưa kiểm tra đầy đủ mọi quan hệ xa bằng Backend, CRUD lưu thật, mọi tổ hợp filter/expand trên cây lớn hoặc browser/thiết bị vật lý khác. Các workflow không thuộc lỗi đã xác nhận được giữ nguyên.
- VietMap phụ thuộc mạng/key/provider; có lượt tải style nhưng chưa đủ tile. Các scenario ép lỗi và retry được kiểm tra riêng; không có fallback âm thầm.
- Test i18n tổng còn lỗi setup có sẵn; lint warning và chunk warning được báo riêng, không nhận là đã giải quyết.
- Cần người dùng duyệt hình ảnh trước bất kỳ đợt redesign tiếp theo.

## 10. Final verdict

**PARTIAL PASS**: các sửa Frontend đã xác nhận và các nhóm kiểm tra cô lập nêu trên đạt; chưa đủ cơ sở tuyên bố end-to-end với dữ liệu/tài khoản Backend thật, đồng thời test i18n tổng còn lỗi harness có sẵn. Dừng tại phạm vi stabilization, không bắt đầu phase khác.
