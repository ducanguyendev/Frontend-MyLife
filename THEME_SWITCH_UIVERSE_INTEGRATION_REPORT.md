# Báo cáo tích hợp Uiverse Theme Switch

## Phạm vi

Chỉ cập nhật Frontend trên nhánh `feature_minhduc`. Không sửa Backend/Mobile; không đổi nhánh, commit hoặc push.

## Thay đổi

1. `src/shared/components/ThemeSwitch.tsx` tạo component dùng controlled checkbox và `useTheme()`.
2. `src/shared/components/ThemeSwitch.css` chứa nguyên CSS do người dùng cung cấp.
3. `src/shared/components/index.ts` export `ThemeSwitch` để Header import từ shared components.
4. `src/shared/layouts/Header.tsx` thay nút Sun/Moon cũ bằng switch trên desktop, đồng thời dùng lại switch đó trong mobile drawer.
5. `src/shared/locales/vi/common.json` và `src/shared/locales/en/common.json` bổ sung nhãn trợ năng cho thao tác chuyển theme.

## Kiểm tra tại lần tích hợp ban đầu

| Hạng mục | Kết quả |
|---|---|
| Cách cũ | Header dùng button gọi `toggleTheme`, hiển thị Lucide Sun/Moon. |
| Component mới | Dùng đúng cấu trúc HTML và SVG nguồn; chỉ đổi cú pháp sang JSX và thêm binding/nhãn trợ năng. |
| ThemeContext được dùng lại | Có. Component đọc `theme` và gọi `toggleTheme()` từ `ThemeContext`. |
| Tạo theme state mới | Không. |
| localStorage | Giữ nguyên key `portfolio-theme`; ThemeContext hiện tại tiếp tục đọc/ghi key này. |
| System preference fallback | Giữ nguyên trong ThemeContext. |
| Tailwind dark mode | Giữ nguyên; ThemeContext vẫn bật/tắt class `dark` trên `<html>`. |
| CSS nguồn thay đổi về hình ảnh | Tại lần tích hợp ban đầu: không. Sau đó chỉ `--toggle-size` được điều chỉnh theo yêu cầu chuẩn hóa mới. |
| `--toggle-size` | Ban đầu `30px`; hiện tại `17.6px` để đạt chiều cao control 44px. |
| SVG path | Đối chiếu path với nguồn, khớp chính xác. |
| Desktop | Switch thay nút theme cũ trong nhóm điều khiển header. |
| Mobile | Cùng component được đặt cạnh LanguageSwitcher trong drawer; không có phiên bản mini. |
| Logo | Header vẫn đọc `theme` từ ThemeContext để chọn logo sáng/tối. |
| Light/Dark/animation | Checkbox phản ánh `theme === 'dark'`; click gọi `toggleTheme()`, trạng thái CSS và animation lấy từ CSS nguồn. |
| React theme button Lucide cũ | Đã gỡ Sun/Moon khỏi Header; các chỗ khác trong ứng dụng không thuộc phạm vi thay đổi. |
| Trạng thái controlled | `checked` và `onChange` được gắn trực tiếp; không tạo cảnh báo controlled/uncontrolled theo cách dùng này. |

## Validation

- `npm run build`: đạt.
- `npm run lint`: đạt.
- `npm run test:i18n`: đạt, 12/12.
- `npm run test:optimization`: đạt, 8/8.
- `git diff --check`: đạt; Git chỉ in cảnh báo chuẩn hóa LF/CRLF trên working tree Windows.
- Đối chiếu CSS nguồn: khớp chính xác, 7.927 ký tự sau chuẩn hóa line ending.
- Đối chiếu SVG path: khớp chính xác.

Trạng thái chuẩn hóa mới nhất, bao gồm Admin và FamilyTree, được ghi trong [THEME_SWITCH_GLOBAL_STANDARDIZATION_REPORT.md](THEME_SWITCH_GLOBAL_STANDARDIZATION_REPORT.md).

## Giới hạn và kiểm tra thủ công

CSS nguồn đặt `.theme-switch__checkbox { display: none; }`. Theo yêu cầu giữ nguyên CSS, checkbox ẩn không nhận focus bằng bàn phím như một checkbox thông thường. `aria-label` đã được thêm bằng i18n VI/EN, nhưng nhãn này không tự khôi phục khả năng focus bàn phím. Cần cân nhắc riêng nếu muốn thay đổi CSS nguồn sau khi duyệt visual.

Chưa xác nhận bằng ảnh chụp trực quan trong trình duyệt. Hãy kiểm tra Light/Dark, vị trí mặt trời/mặt trăng, clouds/stars, shadow, hover/animation, logo và trạng thái sau F5 trên desktop lẫn mobile trước khi commit/push.

## Git

- Commit: không.
- Push: không.
- Các thay đổi Library đã có trước đó trong working tree được giữ nguyên.
