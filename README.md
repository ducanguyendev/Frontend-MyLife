# Frontend - MyLife Portfolio

Ứng dụng Portfolio & CV cá nhân tương tác cao được xây dựng bằng React 19, TypeScript, Tailwind CSS v4, Framer Motion và Vite.

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

