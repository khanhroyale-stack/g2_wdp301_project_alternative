import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";

const PENDING_ORDERS = [
  { id: "DEL-001", product: "MacBook Pro M2 2022", from: "Phạm D - ĐHQG HN", to: "Nguyễn Văn A - KTX", fee: "25.000₫", distance: "1.2km" },
  { id: "DEL-002", product: "iPhone 14 Pro Max", from: "Trần B - Khu A", to: "Lê C - Khu B", fee: "20.000₫", distance: "0.8km" },
];

const ShipperDashboard = () => (
  <div className="flex min-h-screen bg-[#F5F5F7]">
    <Sidebar variant="shipper" />
    <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-on-surface mb-8">Tổng quan Shipper</h1>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: "local_shipping", label: "Đơn hôm nay", value: "5" },
            { icon: "pending_actions", label: "Đang giao", value: "2" },
            { icon: "check_circle", label: "Hoàn tất tháng này", value: "47" },
            { icon: "star", label: "Đánh giá TB", value: "4.8" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-5 shadow-apple border border-surface-variant/30 text-center">
              <span className="material-symbols-outlined text-primary text-3xl block mb-2">{s.icon}</span>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Đơn chờ nhận */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
          <div className="p-5 border-b border-surface-variant/40 flex justify-between items-center">
            <h2 className="font-bold text-on-surface">Đơn cần giao gần bạn</h2>
            <Link to="/shipper/don-can-giao" className="text-primary text-sm font-medium hover:underline">Xem tất cả</Link>
          </div>
          <div className="divide-y divide-surface-variant/30">
            {PENDING_ORDERS.map((order) => (
              <div key={order.id} className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{order.product}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Từ: {order.from}<br />Đến: {order.to}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-semibold text-primary">{order.fee}</span>
                    <span className="text-xs text-on-surface-variant">• {order.distance}</span>
                  </div>
                </div>
                <button className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                  Nhận đơn
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  </div>
);
export default ShipperDashboard;
