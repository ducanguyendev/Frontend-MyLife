# Báo cáo chuẩn hóa Theme Switch toàn Frontend

## Kích thước

- Kích thước ban đầu: `--toggle-size: 30px`.
- Kích thước ban đầu tính theo CSS nguồn: cao `30 × 2.5 = 75px`, rộng `30 × 5.625 = 168.75px`.
- Control Header chuẩn: `h-11` = `44px` (cùng chiều cao LanguageSwitcher và nút đăng nhập).
- Kích thước mới: `--toggle-size: 17.6px`, tính `44 / 2.5`.
- Kích thước switch mới theo tỷ lệ CSS nguồn: cao `17.6 × 2.5 = 44px`, rộng `17.6 × 5.625 = 99px`.

Chỉ `--toggle-size` được đổi trong CSS Uiverse. Các biến kích thước khác, màu sắc, bóng, filter, hover, transition, class, DOM hierarchy và SVG không đổi. SVG path được đối chiếu với nguồn và giữ nguyên.

## Theme architecture

- `ThemeContext` không đổi kiến trúc; vẫn là nơi duy nhất giữ state, đổi class `dark` và lưu theme.
- `ThemeSwitch` dùng `useTheme()` với checkbox controlled (`checked={theme === 'dark'}` và `onChange={toggleTheme}`). Không có state theme thứ hai.
- Storage key vẫn là `portfolio-theme`; fallback `prefers-color-scheme` và Tailwind dark mode vẫn do ThemeContext hiện tại đảm nhiệm.

## Audit và tích hợp

Đã tìm toàn bộ `src/` theo `toggleTheme`, `useTheme`, `setTheme`, `portfolio-theme`, `Sun`, `Moon`, `Toggle theme`, `dark mode`, `light mode`, `theme toggle`, và các biểu thức `theme === 'dark'`/`'light'`.

Các vị trí điều khiển theme được tìm thấy và chuẩn hóa:

| Vị trí | Kết quả |
|---|---|
| `src/shared/layouts/Header.tsx` desktop | Thay nút Sun/Moon cũ bằng `<ThemeSwitch />`; Header vẫn đọc `theme` để đổi logo. |
| `src/shared/layouts/Header.tsx` mobile drawer | Dùng cùng `<ThemeSwitch />` cạnh LanguageSwitcher. |
| `src/features/admin/pages/AdminDashboard.tsx` | Thay toggle Sun/Moon bằng `<ThemeSwitch />`. |
| `src/features/family-tree/pages/FamilyTreePage.tsx` | Thay toggle Sun/Moon bằng `<ThemeSwitch />`. |
| `src/shared/components/ThemeSwitch.tsx` | Implementation dùng chung duy nhất; không tạo bản mini/desktop/mobile riêng. |
| `src/shared/context/ThemeContext.tsx` | Giữ logic theme và persistence hiện tại, không phải UI toggle thứ hai. |

Sau audit không còn import hoặc nút Sun/Moon cho theme toggle. Các usage đọc `theme` còn lại chỉ phục vụ logo và logic ThemeContext. Không tìm thấy toggle theme ở Profile, Settings, layouts/pages khác. Admin và FamilyTree đã chuyển sang component chung. Header mobile dùng cùng component; switch rộng 99px và nằm trong hàng flex với LanguageSwitcher.

## Validation

- `npm run build`: đạt.
- `npm run lint`: đạt.
- `npm run test:i18n`: đạt, 12/12.
- `npm run test:optimization`: đạt, 8/8.
- `npm run test:theme-switch`: đạt, 4/4 focused tests (context binding, kích thước/biến CSS, tích hợp các vị trí, persistence).
- `git diff --check`: đạt; Git có cảnh báo chuẩn hóa LF/CRLF của working tree Windows.

## Kiểm tra trực quan còn lại

Chưa xác nhận bằng ảnh chụp trình duyệt ở desktop/mobile. Vui lòng kiểm tra switch cao 44px có cân với header controls, không tràn/đè trong Admin, FamilyTree và drawer, đồng thời kiểm tra sun/moon, clouds/stars, bóng, hover và animation sau khi thu nhỏ.

## Git

- Branch: `feature_minhduc` (giữ nguyên).
- Commit: không.
- Push: không.
- Các thay đổi Library đã có trước đó trong working tree được giữ nguyên.
