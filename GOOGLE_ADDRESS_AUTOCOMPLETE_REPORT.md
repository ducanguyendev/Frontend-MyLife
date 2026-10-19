# Google Address Autocomplete — Family Member

## Thay đổi

- Thay ô địa chỉ trong modal thành Google Places `PlaceAutocompleteElement` dùng Places API mới; chỉ lấy `formattedAddress` qua `gmp-select` → `toPlace()` → `fetchFields()`. Không yêu cầu hoặc lưu place ID, tọa độ hay metadata Google.
- Địa chỉ gợi ý và địa chỉ gõ tay cùng cập nhật `editingMember.address`, giữ nguyên payload lưu thành viên hiện có. Loader chỉ tải một lần, dùng `importLibrary("places")`, và có fallback về ô nhập thường nếu thiếu key, tải lỗi hoặc Google báo lỗi.
- Giới hạn gợi ý ở Việt Nam, yêu cầu tiếng Việt, hỗ trợ nhãn/thông báo VI và EN. Styling theo input hiện có; Google attribution và tương tác bàn phím do widget quản lý được giữ nguyên.
- Backend, API, DB, Leaflet/OpenStreetMap và luồng bản đồ hiện tại không thay đổi. Backend hiện giới hạn `Address` ở 255 ký tự; địa chỉ Google dài hơn có thể vượt giới hạn lưu hiện hữu.

## Cấu hình Google Cloud

1. Thêm `VITE_GOOGLE_MAPS_API_KEY=...` vào `Frontend-MyLife/.env.local` (file này bị ignore, không commit key).
2. Trong Google Cloud, bật Maps JavaScript API và Places API (New), tạo key giới hạn theo HTTP referrer cho localhost và domain triển khai, đồng thời giới hạn key theo hai API này. Cấu hình billing theo yêu cầu tài khoản Google Cloud.
3. Tham khảo hướng dẫn chính thức: [Place Autocomplete Widget](https://developers.google.com/maps/documentation/javascript/place-autocomplete-new), [Places widget API reference](https://developers.google.com/maps/documentation/javascript/reference/places-widget), [Load the Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/load-maps-js-api).

## Kiểm tra

- Qua: `test:google-address-autocomplete` (9), `test:family-tree` (18), `test:family-map` (5), `test:member-form-layout` (4), `test:i18n` (15), `build`, `lint`, `git diff --check`.
- Chưa kiểm thử trực tiếp Google Cloud/hiển thị widget trong trình duyệt vì workspace chưa có API key cấu hình. Sau khi cấu hình, cần review gợi ý tiếng Việt, chọn địa chỉ, dropdown trong modal, mobile/dark mode và cập nhật địa chỉ qua API/bản đồ.
- `npm audit` không truy cập được advisory endpoint trong môi trường hiện tại; lần cài typings có báo một advisory mức high nhưng không thể xác minh package bị ảnh hưởng do endpoint lỗi.

## File

- `MemberFormModal.tsx`, `GoogleAddressAutocomplete.tsx`, `GoogleAddressAutocomplete.css`, `googleAddressAutocompleteEvents.ts`
- `googleMapsLoader.ts`, `googleMapsLoaderCore.ts`, `tsconfig.app.json`
- `package.json`, `package-lock.json`, bản dịch `vi/admin.json` và `en/admin.json`
- `tests/google-address-autocomplete.test.cjs`, `tests/feature-i18n.test.cjs`
