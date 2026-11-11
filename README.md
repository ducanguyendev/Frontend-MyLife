# MyLife Frontend

Frontend của hệ thống **MyLife**, được xây dựng bằng React, TypeScript, Vite và Tailwind CSS.

Frontend cung cấp các chức năng:

- Trang Home / Portfolio
- Đăng ký / đăng nhập
- Google Login
- Dark / Light Mode
- Đa ngôn ngữ VI / EN
- Quản lý thông tin cá nhân
- Quản lý gia phả
- Quản lý thành viên gia đình
- Thư viện gia đình
- Album và hình ảnh
- Quản lý danh mục
- Admin Dashboard
- Quản lý người dùng

---

## Công nghệ sử dụng

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- React Router
- Framer Motion
- i18next
- Lucide React
- XYFlow / Dagre

---

# 1. Yêu cầu môi trường

Cài đặt trước:

- Git
- Node.js 20+
- npm
- Backend MyLife

Kiểm tra:

```powershell
node --version
npm --version
git --version
```

---

# 2. Clone project

```powershell
git clone https://github.com/ducanguyendev/Frontend-MyLife.git
cd Frontend-MyLife
```

Nếu cần chạy branch đang phát triển:

```powershell
git checkout feature_minhduc
```

---

# 3. Cài dependencies

```powershell
npm install
```

---

# 4. Cấu hình Backend

Frontend hiện không cần file `.env` cho môi trường development mặc định.

Vite chạy tại:

```text
http://localhost:7000
```

Các request:

```text
/api/*
```

được proxy tự động tới Backend:

```text
http://localhost:5274
```

Cấu hình nằm trong:

```text
vite.config.ts
```

Ví dụ:

```ts
server: {
  port: 7000,
  strictPort: true,
  proxy: {
    '/api': {
      target: 'http://localhost:5274',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

Vì vậy cần chạy Backend trước hoặc song song với Frontend.

---

# 5. Chạy Frontend

```powershell
npm run dev
```

Sau đó mở:

```text
http://localhost:7000
```

Nếu terminal hiển thị:

```text
Local: http://localhost:7000/
```

thì Frontend đã chạy thành công.

---

# 6. Build production

```powershell
npm run build
```

Output được tạo trong:

```text
dist/
```

Preview bản build:

```powershell
npm run preview
```

---

# 7. Kiểm tra code

Lint:

```powershell
npm run lint
```

Build:

```powershell
npm run build
```

---

# 8. Tests

Các test hiện có:

```powershell
npm run test:avatar
npm run test:date-input
npm run test:member-avatar
npm run test:library
npm run test:library-ui
npm run test:theme-switch
npm run test:i18n
npm run test:roles
npm run test:optimization
```

Có thể chạy các test cần thiết tùy phần đang phát triển.

---

# 9. Cấu trúc chính

```text
src/
├── features/
│   ├── admin/
│   ├── auth/
│   ├── family-tree/
│   ├── portfolio/
│   └── profile/
│
├── shared/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   └── locales/
│
├── App.tsx
└── main.tsx
```

---

# 10. Authentication

Web sử dụng session thông qua HttpOnly Cookie.

Frontend gọi Backend với:

```text
credentials: include
```

Các request thay đổi dữ liệu sử dụng header:

```text
X-Requested-With: MyLife
```

Không lưu Access Token của browser trong localStorage.

---

# 11. Dark / Light Mode

Theme được quản lý bởi:

```text
src/shared/context/ThemeContext.tsx
```

Theme hiện tại được lưu bằng:

```text
localStorage["portfolio-theme"]
```

Giá trị:

```text
light
dark
```

Nếu chưa có giá trị lưu trước đó, ứng dụng sử dụng:

```text
prefers-color-scheme
```

của hệ điều hành.

---

# 12. Đa ngôn ngữ

Project hỗ trợ:

```text
VI
EN
```

Translation nằm tại:

```text
src/shared/locales/
```

---

# 13. Các port mặc định

| Service | URL |
|---|---|
| Frontend | http://localhost:7000 |
| Backend | http://localhost:5274 |
| Backend HTTPS | https://localhost:7274 |
| Swagger | http://localhost:5274/swagger |

---

# 14. Thứ tự chạy toàn hệ thống

Terminal 1:

```powershell
cd Backend-MyLife
dotnet run
```

Terminal 2:

```powershell
cd Frontend-MyLife
npm run dev
```

Sau đó mở:

```text
http://localhost:7000
```

---

# 15. Lỗi thường gặp

## Port 7000 đã được sử dụng

Vite đang sử dụng:

```text
strictPort: true
```

nên nếu port 7000 bận, Frontend sẽ không tự đổi port.

Kiểm tra:

```powershell
netstat -ano | findstr :7000
```

Dừng process đang chiếm port hoặc đổi cấu hình Vite.

Nếu đổi Frontend port, cần cập nhật CORS bên Backend.

---

## API không hoạt động

Kiểm tra Backend:

```text
http://localhost:5274/health/live
```

hoặc:

```text
http://localhost:5274/swagger
```

Backend phải chạy trước khi sử dụng các chức năng cần API.

---

## Lỗi CORS

Frontend mặc định phải chạy tại:

```text
http://localhost:7000
```

Backend cũng phải cho phép origin này:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:7000"
  ]
}
```

---

## Sau khi pull code mới bị lỗi package

Chạy:

```powershell
npm install
```

Nếu vẫn lỗi:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

Chỉ xóa `package-lock.json` khi thật sự cần regenerate dependencies.

---

# MyLife

Frontend này cần kết nối với repository Backend:

```text
Backend-MyLife
```

để sử dụng đầy đủ authentication, FamilyTree, Library và Admin APIs.