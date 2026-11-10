# MyLife W9 — Hoàn thiện giao diện dùng chung

Thực hiện ngày 09/11/2026; tiếp tục rà soát và hoàn tất ngày 10/11/2026 (Asia/Saigon). Baseline: `595ba563613cebe1f74ee1a9929f7a0cc246e6a1`.

## Kết quả

W9 cải thiện độ tương phản, khả năng đọc nhãn nhỏ, vùng bấm và tính nhất quán của biểu mẫu trên giao diện hiện có. Modal đăng nhập sử dụng `Modal` dùng chung để có focus containment, khôi phục focus, Escape và khóa cuộn. Đăng ký dùng cùng token màu/kiểu chữ; thanh tiện ích trên mobile được đặt phía trên tiêu đề.

- Token chữ mờ, trạng thái, màu module và viền control được điều chỉnh cho light/dark. Trong 30 cặp token được đo, chữ đạt tối thiểu 4.5:1, viền control đạt tối thiểu 3:1. Đây là phép đo các cặp đã liệt kê, không phải chứng nhận toàn bộ ứng dụng đạt WCAG.
- Nhãn điều hướng, bảng Admin, timeline, thư viện, bản đồ và hồ sơ dùng thang chữ chung. Nhãn nổi của field dùng `--type-caption`; label và feedback dùng `--type-label`.
- Icon button mặc định có kích thước 44px; size nhỏ là 40px trên chuột và 44px trên thiết bị cảm ứng. Button dùng chung có chiều cao tối thiểu 44px khi pointer là coarse.
- Kiểm tra bàn phím bao gồm focus của field, Tab/Shift+Tab trong dialog, Escape, khôi phục focus, validation, trạng thái disabled và reduced motion.

Các handler xác thực, service, API, route, guard và dữ liệu nghiệp vụ được giữ nguyên theo [preservation.json](preservation.json). Thay đổi `LoginModal.tsx` và `Register.tsx` tập trung vào phần trình bày. Không thay đổi package/lockfile.

## Phạm vi file

| Nhóm | File |
|---|---|
| Tokens và control foundations | `src/design-system/tokens/tokens.css`, `src/design-system/foundations.css`, `src/design-system/forms.css` |
| Thành phần dùng chung | `src/shared/components/ui/Button.tsx`, `FormFieldShell.tsx`, `Modal.tsx` |
| Shell và điều hướng | `src/shared/layouts/app-shell/AppShell.css` |
| Đăng nhập/đăng ký | `src/features/auth/components/LoginModal.tsx`, `AuthPresentation.css`, `src/features/auth/pages/Register.tsx` |
| Các module hiện có | `FamilyExperience.css`, `FamilyMapTab.css`, `AdminDashboard.css`, `Memories.css`, `UserProfileModal.css` |
| Kiểm tra | `tests/global-polish.browser.cjs`, `tests/global-polish-interactions.browser.cjs`, `tests/global-polish-touch.browser.cjs`, `tests/helpers/global-polish-browser.cjs`, `tests/profile-layout.browser.cjs` |

`profile-layout.browser.cjs` chỉ bổ sung biến `MYLIFE_REVIEW_DIR` để lưu evidence đúng đợt. Lượt tiếp tục ngày 10/11 bổ sung kiểm tra cảm ứng có thể chạy lại và bảo vệ phần seed `localStorage` khỏi document có origin không hợp lệ trong fixture.

## Xác minh

| Kiểm tra | Kết quả và thời điểm | Evidence |
|---|---|---|
| Build | PASS, chạy lại 10/11 | `resume-build.log` |
| Lint toàn repo | PASS, 0 error; 1 warning có sẵn, chạy lại 10/11 | `resume-lint.log` |
| Giao diện toàn ứng dụng | 240 view qua 16 tổ hợp viewport/theme/language, 09/11 | [after/results.json](after/results.json), `browser-global.log` |
| Đăng nhập/đăng ký | 32 view qua 16 tổ hợp, 09/11 | [after-auth/results.json](after-auth/results.json), `browser-auth.log` |
| Tương phản token | 30 cặp light/dark đạt ngưỡng đặt ra, 09/11 | [contrast-comparison.json](contrast-comparison.json) |
| Field/dialog/validation/state | 78 kiểm tra, chạy lại 10/11 | [interactions/results.json](interactions/results.json), `resume-interactions.log` |
| Cảm ứng mobile | PASS light/dark, 390×844, chạy 10/11 | [touch/results.json](touch/results.json), `resume-touch.log` |
| Admin visual/filter | 16 trường hợp, 09/11 | [admin-visual-results.json](admin-visual-results.json) |
| Admin behavior/access | 11 nhóm, 09/11 | [admin-behavior-results.json](admin-behavior-results.json) |
| Hồ sơ và bảo mật | 10 tổ hợp cùng các thao tác với API giả lập, 09/11 | [profile-results.json](profile-results.json) |
| Unit/regression baseline | Trước và sau: 339 test, 310 pass, 29 fail; danh sách failure giống nhau, 09/11 | [test-comparison.json](test-comparison.json) |

Ma trận giao diện: 1920×1080, 1440×900, 820×1180, 390×844 × light/dark × VI/EN. Assertions kiểm tra page/content overflow, giới hạn dialog, heading bị cắt và lỗi JavaScript. Các browser fixture chặn request bên ngoài và giả lập API; không chứng minh đăng nhập Google thật hoặc kết nối backend production hoạt động.

Lượt chạy lại browser trong sandbox ngày 10/11 ban đầu không khởi động được Chromium do tiến trình GPU/network bị chặn. Các lượt xác minh cuối chạy Chromium ngoài sandbox với cùng localhost và API giả lập. `touch-diagnostic.json`, `interactions/partial-results.json` và `interactions/failure.png` là chẩn đoán từ các lượt cũ, không phải kết quả cuối.

## Ảnh đã rà soát

| Giao diện | Ảnh |
|---|---|
| Admin desktop light | [Tổng quan](after/vi-light-1440-admin-overview.png) |
| Đăng nhập mobile dark | [Modal](after/en-dark-390-login.png) |
| Validation khi chạm mobile | [Light](touch/light-390-login-validation.png), [Dark](touch/dark-390-login-validation.png) |
| Đăng ký mobile | [Validation light](interactions/light-390-register-validation.png), [Validation dark](interactions/dark-390-register-validation.png) |
| Loading/empty/error mobile | [Loading](interactions/light-390-timeline-loading.png), [Empty](interactions/light-390-timeline-empty.png), [Error](interactions/light-390-timeline-error.png) |

Ảnh baseline nằm trong [before](before/); ảnh sau thay đổi nằm trong [after](after/) và [after-auth](after-auth/).

## Giới hạn còn lại

- 29 failure có sẵn vẫn cần một đợt xử lý riêng. Danh sách gồm các assertion cấu trúc/CSS cũ, mock thiếu import, native Select cũ và các kiểm tra layout từ các đợt trước; không đổi assertion để làm xanh trong W9.
- Lint còn cảnh báo dependency `form.title`/`update` ở `TimelineEventModal.tsx:44`.
- Build còn cảnh báo chunk lớn hơn 500kB.
- Cảm ứng được giả lập bằng Chromium, chưa kiểm tra trên điện thoại thật hoặc Safari/iOS. Không khẳng định mọi control riêng của các feature đạt 44px; assertion kích thước áp dụng cho button/icon button dùng chung đã đo.

## Chạy lại

Yêu cầu dependencies hiện có trong `node_modules` và Puppeteer trong `scratch_puppeteer/node_modules`. Khởi động Vite ở cổng 7009:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 7009
```

Trong terminal khác, từ root `Frontend-MyLife`:

```powershell
npm.cmd run build
npm.cmd run lint
node tests/global-polish.browser.cjs
node tests/global-polish.browser.cjs --auth-only
node tests/global-polish-interactions.browser.cjs
node tests/global-polish-touch.browser.cjs
```

Browser dùng `MYLIFE_UI_URL` nếu được đặt; mặc định `http://127.0.0.1:7009`.
