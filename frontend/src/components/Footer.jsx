import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full border-t border-primary/5 bg-background relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20"></div>
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-10 px-6 py-20 md:flex-row md:px-10">
      <div className="text-center md:text-left">
        <Link to="/" className="text-2xl font-display font-black text-primary tracking-tight">EcoTrade</Link>
        <p className="mt-4 text-sm font-medium text-on-surface-variant max-w-xs">Nền tảng mua bán và cho thuê bền vững dành cho cộng đồng sinh viên.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-8">
        {[["Trang chủ", "/"], ["Sản phẩm", "/marketplaces"], ["Cho thuê", "/cho-thue"], ["Hỗ trợ", "#"]].map(([label, href]) => (
          <Link
            key={label}
            to={href}
            className="text-xs font-bold uppercase tracking-widest text-primary/60 transition-colors hover:text-primary"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="text-center md:text-right">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 mb-2">© 2024 EcoTrade</p>
        <p className="text-xs font-bold text-on-surface-variant">Khu vực Hòa Lạc</p>
      </div>
    </div>
  </footer>
);

export default Footer;
