import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full border-t border-surface-variant bg-surface-container-lowest">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
      <div>
        <Link to="/" className="text-xl font-bold text-primary tracking-tight">EcoTrade</Link>
        <p className="text-xs text-on-surface-variant mt-1">Nền tảng mua bán & cho thuê đồ cũ khu vực Hòa Lạc</p>
      </div>
      <div className="flex gap-6">
        {[["Về chúng tôi", "#"], ["Điều khoản", "#"], ["Bảo mật", "#"], ["Hỗ trợ", "#"], ["Tuyển dụng", "#"]].map(([label, href]) => (
          <a key={label} href={href}
            className="text-xs font-medium text-on-surface-variant/60 hover:text-on-surface transition-colors uppercase tracking-wider">
            {label}
          </a>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant">© 2024 EcoTrade. Khu vực Hòa Lạc.</p>
    </div>
  </footer>
);

export default Footer;
