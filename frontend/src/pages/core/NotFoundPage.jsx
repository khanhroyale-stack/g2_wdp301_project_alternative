import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <span className="material-symbols-outlined text-8xl text-primary mb-6">sentiment_dissatisfied</span>
        <h1 className="text-4xl font-extrabold text-on-surface mb-4">404 - Không tìm thấy trang</h1>
        <p className="text-on-surface-variant mb-8 max-w-md">
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không thể truy cập.
        </p>
        <Link 
          to="/" 
          className="px-8 py-3 bg-gradient-to-r from-primary to-primary-fixed text-white font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          Quay lại trang chủ
        </Link>
      </main>
      <Footer />
    </div>
  );
}
