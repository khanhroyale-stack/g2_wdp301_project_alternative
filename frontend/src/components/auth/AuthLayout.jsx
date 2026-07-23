import { Link } from "react-router-dom";

// Khung chung cho trang đăng nhập & đăng ký.
// Desktop: panel thương hiệu bên trái + cột form bên phải.
// Dưới lg: ẩn panel, chỉ còn form và logo nhỏ phía trên.
const HIGHLIGHTS = [
  { icon: "mark_email_read", label: "Xác minh OTP qua email" },
  { icon: "verified_user", label: "Điểm uy tín minh bạch" },
  { icon: "inventory", label: "Kiểm định khi giao hàng" },
];

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-surface-container-low lg:grid lg:grid-cols-2">
    <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-primary-container text-on-primary p-12 relative overflow-hidden">
      {/* Hình khối trang trí, không mang thông tin nên ẩn với screen reader */}
      <div aria-hidden="true" className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-on-primary/10" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-on-primary/5" />

      <Link to="/" className="relative flex items-center gap-2 text-2xl font-bold tracking-tight w-fit">
        <span className="material-symbols-outlined text-[28px]">eco</span>
        EcoTrade
      </Link>

      <div className="relative">
        <h1 className="text-4xl font-bold leading-tight mb-4">
          Thuê và mua bán đồ cũ,
          <br />
          an toàn
        </h1>
        <p className="text-on-primary/80 text-base mb-10 max-w-sm">
          Nền tảng trao đổi đồ dùng cho cộng đồng khu vực Hòa Lạc.
        </p>

        <ul className="flex flex-col gap-4">
          {HIGHLIGHTS.map((item) => (
            <li key={item.icon} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-on-primary/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-on-primary/60">Đồ án WDP301 — Nhóm G2</p>
    </aside>

    <main className="flex items-center justify-center px-4 py-10 lg:py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="lg:hidden flex items-center justify-center gap-1.5 text-2xl font-bold text-primary tracking-tight mb-6"
        >
          <span className="material-symbols-outlined text-[26px]">eco</span>
          EcoTrade
        </Link>

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-on-surface">{title}</h2>
          {subtitle && <p className="text-on-surface-variant text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple-md p-6 sm:p-8 border border-surface-variant/30">
          {children}
        </div>

        {footer}

        <div className="text-center mt-3">
          <Link
            to="/"
            className="text-sm text-on-surface-variant hover:text-primary inline-flex items-center justify-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  </div>
);

export default AuthLayout;
