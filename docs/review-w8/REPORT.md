# MyLife Web W8 — Admin Overview, User Management và Login Logs

Ngày kiểm tra: 09/11/2026. Phạm vi: Frontend Web W8; không triển khai W9/W10.

## 1. Current state

- Repository: `D:\DUAN\MYLIFE\Frontend-MyLife`.
- Branch: `feature_minhduc`.
- HEAD: `a43ea45d22a7e7a7a3ff919b12b7394895ffdf8d`, khớp reviewed HEAD.
- Working tree sạch khi bắt đầu. Các file chưa commit hiện tại thuộc bản sửa W8 và bằng chứng kiểm tra.
- Không commit, push hoặc tạo PR. Không sửa Backend, Mobile, auth/password/session, global font/theme hoặc các module gia đình đã hoàn thiện.

## 2. Existing Admin audit

Admin trước W8 đã có AppShell, ba tab, ba API đọc, đổi role, khóa/mở khóa, xóa với ConfirmDialog và route ADMIN guard. Đã đọc implementation, shared components, apiClient và model xác thực trước khi chỉnh.

Các vấn đề xác nhận từ source:

| Vấn đề | Nguyên nhân / xử lý |
|---|---|
| Search không có tác dụng | `adminSearch` chỉ nhận input, chưa áp dụng predicate cho users/logs. Đã chuyển thành search riêng có filter/sort thực. |
| Thiếu KPI | Chỉ render năm chỉ số; bỏ `newRegistrations`. Skeleton chỉ có bốn card. Đã thống nhất sáu card và sáu skeleton. |
| Lỗi một API ảnh hưởng toàn bộ trang | `Promise.all` và một cờ loading chung khiến một rejection chặn cập nhật cả ba kết quả. Đã tách resource/request state độc lập. |
| Role rejection thiếu phản hồi | Nhánh `success:false` của cập nhật role không thông báo lỗi. Service mới từ chối business failure và UI hiển thị lỗi. |
| Mutation có thể chồng nhau | Pending role/status chỉ theo từng biến ID, chưa khóa chung toàn bộ action của một hàng. Đã thêm mutex bằng ref và pending Map theo hàng. |
| Response cũ có thể ghi đè state | Fetch không có abort/version và không hủy GET cũ khi mutation bắt đầu. Đã thêm AbortController, version và cleanup. |
| Nhãn trạng thái sai ngữ cảnh | Account active/locked dùng badge SUCCESS/FAILED của login. Đã tách nhãn tài khoản và nhãn log. |
| Ngày/giờ chưa theo ngôn ngữ | Format hardcode `vi-VN`. Đã dùng ngôn ngữ hiện hành; ngày không hợp lệ hiển thị “—”, sắp xếp xuống cuối. |
| UI thiếu công cụ quản trị | Chưa có role/status filters, sort, clear filters, loaded-result count hoặc supporting overview. Đã thêm từ dữ liệu API hiện có. |

Giới hạn API được giữ:

- Stats chỉ có ba tổng tài khoản và ba số tổng hợp bảy ngày. Không có dữ liệu chuỗi thời gian, revenue, visitors, retention hoặc growth để dựng chart/trend.
- Users/logs là danh sách API trả về, chưa có metadata xác nhận phân trang hoặc toàn bộ lịch sử. Filter/sort áp dụng local trên danh sách đã tải; không thêm pagination hoặc filter ngày/server giả.
- Logs là nhật ký đăng nhập/đăng ký, không được mô tả thành audit của mọi thao tác quản trị.
- Giữ nguyên sáu endpoint và payload: ba GET `/api/admin/{stats,users,logs}`, PUT role `{role}`, PUT status `{isActive}`, DELETE user theo ID.

## 3. UI implementation

### Dashboard

- Header “Quản trị hệ thống / Tổng quan”, mô tả theo yêu cầu, Refresh có loading.
- Sáu StatCard dùng token hiện tại; cùng chiều cao theo hàng, icon 20px, skeleton/error/empty state.
- Tình trạng tài khoản hiển thị số active/locked. Thanh tỷ lệ chỉ có khi tổng hợp hợp lệ và mẫu số lớn hơn 0; không dựng tỷ lệ từ dữ liệu thiếu/hỏng.
- Hoạt động đăng nhập hiển thị ba số bảy ngày bằng danh sách so sánh, không giả lập chart.
- Hai lối tắt chuyển thật sang Users/Logs.

### Users

- Search email không phân biệt hoa/thường; role + status filters kết hợp, Clear Filters, số “Hiển thị X / Y người dùng”. Không phát sinh API khi lọc/sort.
- Sort email A–Z/Z–A và ngày tạo tăng/giảm qua toolbar hoặc heading bảng. Không mutate mảng response.
- Bảng có avatar/email, role, provider thực (Email/Google/cả hai/unknown), active/locked, ngày tạo, action có accessible label. Email dài có ellipsis và title đầy đủ.
- TableShell giữ native table semantics; mobile cuộn ngang có hướng dẫn, keyboard ArrowLeft/Right và action 44px. Toolbar xuống dòng; page không overflow.
- Giữ hạn chế hiện tại: không đổi role của chính mình; không khóa/xóa ADMIN. Backend vẫn kiểm soát quyền thật.

### Login Logs

- Search email/IP, filter SUCCESS/FAILED/REGISTERED, sort thời điểm mới/cũ. Invalid date xuống cuối, không tạo thời gian giả.
- StatusPill: success/danger/info; trạng thái không nhận diện dùng neutral.
- Có loaded-count, no-match/empty/error và mô tả giới hạn dữ liệu API trả về.
- Không thêm export, analytics, console logging hoặc localStorage cho email/IP/log records.

### Visual QA

- Giữ AppShell, font, tokens ivory/forest/sage và các shared components hiện có.
- Đã xem ảnh thật của Overview, Users, Logs và delete dialog; chỉnh mobile nav để cả ba tab vừa hàng, không cắt nhãn.
- 26 ảnh fixture: bốn viewport × hai theme × ba tab = 24 ảnh, cộng hai ảnh dialog mobile. Không có dữ liệu cá nhân thật.

## 4. Functional verification

| Hành vi | Bằng chứng |
|---|---|
| Search/filter/sort | Unit + 8 browser matrix cases; kiểm tra counts, phối hợp role/status/query, IPv6, no-match, clear, sort ngày/email và không gọi thêm GET. |
| Đổi role | Business failure giữ role cũ và báo lỗi; success dùng role API trả về; row pending disables toàn bộ controls, spinner, chặn trùng; không sửa role self. |
| Khóa/mở khóa | HTTP 503/403 giữ trạng thái; pending không optimistic; success dùng isActive trả về. Thông báo success cũng dựa trên trạng thái được API xác nhận. |
| Xóa | Click Trash chỉ mở ConfirmDialog đúng email + cảnh báo vĩnh viễn. Cancel không gửi DELETE. Trong lúc pending không đóng bằng Escape/backdrop; double-click không tạo request thứ hai. |
| Xóa thất bại | `USER_HAS_FAMILY_MEMBERS` có thông điệp riêng; lỗi 500/business rejection giữ dialog và hàng dữ liệu. |
| Xóa thành công | Chỉ xóa hàng/đóng dialog sau response; stats được đọc lại từ API. Không tự suy ra tổng hệ thống từ subset users. |
| Endpoint lỗi độc lập | Stats/users/logs lần lượt bị 503 trong browser; hai phần còn lại vẫn sử dụng được. Retry chỉ khôi phục phần tương ứng, không request loop. |
| Refresh/stale | Abort/version bỏ response cũ; browser xác nhận GET users trước mutation không rollback hàng đã cập nhật. Unit kiểm tra late response kể cả loader bỏ qua AbortSignal. |
| Unmount/concurrency | Unit xác nhận cleanup abort, không cập nhật sau unmount; hai hàng đồng thời không mất bản cập nhật của nhau. |
| Access control | Admin vào cả hai alias; USER và localStorage role spoof bị chuyển 403 trước khi fetch Admin. Anonymous chuyển landing và không tải Admin records. |
| 401/403 | 403 xóa cached logs khỏi DOM nhưng phần được phép khác vẫn dùng được. 401 với refresh hợp lệ retry thành công; refresh hết hạn đi qua apiClient/AuthContext hiện có để bỏ Admin UI và session. |
| Language/theme | Đổi thực qua Settings; UI đổi VI/EN/Light/Dark mà không fetch lại Admin data. |

Toàn bộ thao tác ghi chỉ đi tới fixture trong browser. Không khóa/xóa/sửa role tài khoản thật.

## 5. Files modified

Đường dẫn tính từ root `Frontend-MyLife`.

| File | Lý do |
|---|---|
| `src/features/admin/pages/AdminDashboard.tsx` | Điều phối ba module, header/nav, notice và delete confirmation; loại monolith UI/API cũ. |
| `src/features/admin/pages/AdminDashboard.css` (mới) | Styling riêng Admin bằng tokens; grid KPI, table, toolbar, mobile nav và dialog wrapping. |
| `src/features/admin/services/adminConsoleService.ts` (mới) | Types, sáu API contract hiện có, xác nhận mutation, selectors/search/sort, provider/error/ratio helpers. Không có fixture trong production. |
| `src/features/admin/hooks/useAdminConsole.ts` (mới) | Resource độc lập, abort/version, mutation mutex, update sau xác nhận và refetch stats. |
| `src/features/admin/components/console/AdminOverview.tsx` (mới) | Sáu KPI, account distribution, login summary và shortcuts thật. |
| `src/features/admin/components/console/AdminUsers.tsx` (mới) | Users toolbar/filter/sort/table, provider/avatar, pending/control policies. |
| `src/features/admin/components/console/AdminLoginLogs.tsx` (mới) | Logs search/filter/sort, status mapping, loaded-data scope và states. |
| `src/features/admin/components/console/AdminShared.tsx` (mới) | Error retry, sortable heading, local table keyboard scroll và localized date formatting dùng chung trong Admin. |
| `src/shared/locales/vi/admin.json` | Thêm namespace `admin.console` cho W8; giữ các khóa cũ. |
| `src/shared/locales/en/admin.json` | Namespace EN tương ứng; kiểm tra key parity/lookup. |
| `tests/admin-console.test.cjs` (mới) | 15 unit/hook/service/locale tests cho dữ liệu, states, mutations, concurrency và cleanup. |
| `tests/helpers/load-admin-module.cjs` (mới) | Loader TS và hook harness để test actual service/hook code bằng mô hình repository đang dùng. |
| `tests/helpers/admin-browser.cjs` (mới) | Tài khoản/danh sách/IP giả dành riêng test; interception API local, gates/errors, helpers. Không đổi guard để test. |
| `tests/admin-console.browser.cjs` (mới) | 8 visual/filter/locale/theme/responsive cases và 26 ảnh QA. |
| `tests/admin-actions-access.browser.cjs` (mới) | 11 nhóm mutation/error/loading/refresh/access/session scenarios trên components thật. |
| `tests/search-bar.test.cjs` | Cập nhật đường dẫn assertion shared SearchBar sang hai component Admin sau khi tách; giữ nguyên assertion CSS cũ đang fail từ baseline. |
| `docs/review-w8/` | Báo cáo, 26 ảnh fixture, kết quả JSON và log baseline/final. |

Không thay `App.tsx`, `ProtectedRoute.tsx`, `AuthContext.tsx`, `apiClient.ts`, shared design components, AppShell, package/lockfile hoặc cấu hình môi trường.

## 6. Test report

| Nhóm | Kết quả |
|---|---|
| Admin unit/service/hooks/VI–EN mới | **15 pass, 0 fail** — `unit-admin.log` |
| Hồi quy Family Tree card/highlight, Map, Relationship, Profile edit semantics | **40 pass, 0 fail** — `regression.log` |
| Existing Account/Auth/theme/SearchBar/i18n trước sửa | **14 pass, 6 fail** — `baseline.log` |
| Cùng nhóm existing sau sửa | **14 pass, 6 fail**, cùng sáu lỗi — `existing-tests.log` |
| Visual/responsive/browser | **8 pass** ở 1920/1440/820/390, Light/Dark, gồm VI/EN — `visual-results.json` |
| Mutation/error/access browser | **11 nhóm pass** — `behavior-results.json` |
| Build | **PASS, exit 0** — TypeScript + Vite; `build.log` |
| Lint | **PASS, exit 0**, 0 error, 1 warning có sẵn tại `TimelineEventModal.tsx:44` (`form.title`/`update`) — `lint.log` |
| `git diff --check` | **PASS** |

Sáu failure có sẵn, được xác nhận trước khi sửa:

1. Hai test `family-role.test.cjs` không mock import `PreferenceControls` của UserMenu.
2. `feature-i18n.test.cjs` dừng ở loader thiếu `generationCardThemes`, chưa chạy assertion.
3. `search-bar.test.cjs` còn assertion class/CSS nội bộ cũ của SearchBar.
4. Hai test `theme-switch.test.cjs` kỳ vọng sizing/ThemeSwitch trực tiếp của layout cũ; AppShell/settings hiện tại đã khác trước W8.

Không sửa các assertion/harness ngoài scope để làm xanh test. Assertion xác nhận Admin dùng shared SearchBar đã được chuyển đúng component sau extraction và vẫn PASS.

Browser dùng Chromium đã có trong repository, server kiểm tra port 7008. Không cài thư viện mới. Các bài browser đi qua router, ProtectedRoute, AuthContext và apiClient thật; chỉ response API được intercept theo fixture.

## 7. Remaining limitations

### Lỗi đã xác nhận

- Sáu failure test cũ nêu trên vẫn còn; không phải regression mới W8. Lint dependency warning và build chunk warning có sẵn được giữ riêng.
- Chưa ghi nhận lỗi chức năng W8 còn tồn đọng trong các ca kiểm tra hoàn tất.

### Chưa kiểm thử với Backend thật

- Request không có phiên đăng nhập tới `/api/admin/stats` trả HTTP 401. Chưa có phiên ADMIN hợp lệ cho E2E dữ liệu thật trong lượt này.
- Chưa xác nhận thống kê/account/log database thật, persistence role/status/delete hoặc các rule Backend ngoài response fixture.
- Không thực hiện thao tác ghi trên tài khoản thật. Fixture không chứng minh Backend thực thi quyền; frontend guard và hành vi khi nhận 401/403 đã được kiểm tra.

### API chưa cung cấp

- Không có series theo thời gian, visitor/revenue/growth hoặc full audit events để trình bày.
- Chưa có metadata xác nhận full history/pagination. UI giới hạn search/filter/sort trên records đã tải, không export hoặc giả lập server filtering/pagination.
- Không bổ sung impersonation, reset password, bulk delete hoặc quyền mới.

## 8. Final verdict

**PARTIAL PASS.** W8 Frontend đã triển khai đủ ba module và các chức năng trong contract; 15 Admin unit, 40 hồi quy, 8 browser visual và 11 nhóm browser hành vi đạt; build/lint qua. Chưa tuyên bố E2E Backend thật, và nhóm test existing vẫn có sáu failure baseline đã phân loại.

Dừng sau W8; không bắt đầu W9/W10, không commit/push/PR tự động.
