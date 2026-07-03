import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full border-t border-surface-variant/60 bg-surface-container-lowest/95 backdrop-blur">
    <div className="max-w-[1400px] mx-auto flex flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row md:px-10">
      <div>
        <Link to="/marketplaces" className="text-xl font-extrabold text-primary tracking-tight">EcoTrade</Link>
        <p className="mt-1 text-sm text-on-surface-variant">Nền tảng mua bán và cho thuê đồ cũ dành cho cộng đồng Hòa Lạc.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {[["Về chúng tôi", "#"], ["Điều khoản", "#"], ["Bảo mật", "#"], ["Hỗ trợ", "#"], ["Tuyển dụng", "#"]].map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant/70 transition-colors hover:text-on-surface"
          >
            {label}
          </a>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant">© 2024 EcoTrade. Khu vực Hòa Lạc.</p>
    </div>
  </footer>
);

export default Footer;
