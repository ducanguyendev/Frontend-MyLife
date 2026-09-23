# Frontend - MyLife Portfolio

Ứng dụng Portfolio & CV cá nhân tương tác cao được xây dựng bằng React 19, TypeScript, Tailwind CSS v4, Framer Motion và Vite. Nằm trong dự án tổng thể **MYLIFE**, phần Frontend mang phong cách **Tech-Noir tối giản**, cung cấp trải nghiệm mượt mà với nhiều tính năng và hiệu ứng ấn tượng.

---

## ✨ Tính năng nổi bật

* **Landing Page / Portfolio:**
  * Thanh điều hướng thông minh (ẩn/hiện tự động, chuyển đổi ngôn ngữ đa quốc gia).
  * **Hero & About:** Giới thiệu bản thân, ảnh đại diện, chức danh.
  * **Stats & Skills:** Hiển thị số liệu trực quan và bộ kỹ năng hiện đại.
  * **Projects & Experience:** Trình bày dự án & kinh nghiệm dạng timeline chuyên nghiệp.
  * Form liên hệ trực tiếp.
  * **UI/UX đặc biệt:** Custom Cursor (con trỏ chuột tùy chỉnh), Scroll Progress Bar, Loading Screen đậm chất Tech-Noir.
* **Xác thực & Phiên (Auth):**
  * Giao diện Đăng nhập / Đăng ký dạng Modal popup mượt mà và Trang độc lập.
  * Hỗ trợ xác thực với **Google OAuth 2.0**.
  * Quản lý phiên thông minh: Bắt sự kiện `auth:expired` để hiển thị Modal hết hạn phiên.
  * **Protected Routes:** Cơ chế phân quyền, chặn truy cập tài nguyên với người dùng chưa đăng nhập hoặc không đủ quyền (`403 Forbidden`).
* **Trang Gia phả (Family Tree):**
  * Giao diện trực quan để xem và quản lý cây phả hệ gia đình (tính năng dành riêng cho người dùng đã đăng nhập).
* **Admin Dashboard:**
  * Thống kê tổng quan toàn bộ hệ thống.
  * Quản lý người dùng: Bật/tắt trạng thái hoạt động (khóa/mở khóa), xóa tài khoản.
  * Trình xem và phân tích lịch sử hoạt động (Logs).

---

## 🛠️ Công nghệ sử dụng
- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **i18n:** [react-i18next](https://react.i18next.com/)

---

## 🚀 Hướng dẫn khởi chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy ở môi trường Development
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: **http://localhost:7000**
> **Lưu ý**: Mọi request đến `/api/*` sẽ được tự động proxy sang Backend C# ASP.NET Core tại `http://localhost:5274` theo cấu hình trong `vite.config.ts`.

### 3. Build cho Production
```bash
npm run build
```
Mã nguồn sau khi build sẽ được tạo trong thư mục `dist/`.

### 4. Xem trước bản build (Preview)
```bash
npm run preview
```

