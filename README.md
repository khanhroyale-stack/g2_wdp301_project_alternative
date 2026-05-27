# 🚀 My App — Full Stack Boilerplate

A full-stack boilerplate với **React + Vite** (frontend) và **Express + MongoDB** (backend), kèm JWT Authentication.

---

## 📁 Cấu trúc thư mục

```
my-app/
├── backend/                  # Express + MongoDB API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js         # Kết nối MongoDB
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── user.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js  # JWT protect + adminOnly
│   │   ├── models/
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── user.routes.js
│   │   └── server.js         # Entry point
│   ├── .env                  # Biến môi trường (không commit)
│   ├── .env.example          # Mẫu biến môi trường
│   └── package.json
│
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── PrivateRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── services/
│   │   │   ├── api.js        # Axios instance + interceptors
│   │   │   └── auth.service.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env                  # VITE_API_URL
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Cài đặt & Chạy

### 1. Yêu cầu
- Node.js >= 18
- MongoDB đang chạy (local hoặc Atlas)

### 2. Backend

```bash
cd backend
npm install
```

Chỉnh sửa file `.env` (đặc biệt là `MONGODB_URI` và `JWT_SECRET`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/myapp
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
```

Chạy dev server:
```bash
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint             | Access        | Mô tả               |
|--------|----------------------|---------------|---------------------|
| POST   | `/api/auth/register` | Public        | Đăng ký tài khoản   |
| POST   | `/api/auth/login`    | Public        | Đăng nhập           |
| GET    | `/api/auth/me`       | Private       | Thông tin user      |
| GET    | `/api/users`         | Admin only    | Danh sách user      |
| GET    | `/api/users/:id`     | Private       | Chi tiết user       |
| PUT    | `/api/users/:id`     | Private       | Cập nhật user       |
| DELETE | `/api/users/:id`     | Admin only    | Xóa user            |
| GET    | `/api/health`        | Public        | Health check        |

---

## 🛠️ Tech Stack

**Backend**
- [Express.js](https://expressjs.com/) — Web framework
- [Mongoose](https://mongoosejs.com/) — MongoDB ODM
- [JSON Web Token](https://jwt.io/) — Authentication
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Password hashing
- [dotenv](https://github.com/motdotla/dotenv) — Env config
- [morgan](https://github.com/expressjs/morgan) — HTTP logger

**Frontend**
- [React 18](https://react.dev/) — UI library
- [Vite](https://vitejs.dev/) — Build tool
- [React Router v6](https://reactrouter.com/) — Routing
- [Axios](https://axios-http.com/) — HTTP client

---

## 📝 Lưu ý

- File `.env` đã được thêm vào `.gitignore`, không commit lên Git
- Dùng `.env.example` làm mẫu khi setup trên máy mới
- Vite proxy `/api` → `http://localhost:5000` trong development, không cần CORS config thêm
