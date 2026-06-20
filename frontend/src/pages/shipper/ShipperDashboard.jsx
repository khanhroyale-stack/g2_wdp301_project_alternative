import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import deliveryService from "../../services/delivery.service";

const formatCurrency = (value) => `${(value || 0).toLocaleString("vi-VN")}₫`;

const ShipperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [availableRes, mineRes] = await Promise.all([
          deliveryService.getAvailableDeliveries(),
          deliveryService.getMyDeliveries(),
        ]);

        if (availableRes.success) {
          setAvailableDeliveries(availableRes.data);
        }
        if (mineRes.success) {
          setMyDeliveries(mineRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const activeDeliveries = myDeliveries.filter((delivery) =>
    ["accepted", "picking_up", "picked_up", "in_transit", "delivered"].includes(delivery.deliveryStatus)
  );
  const completedCount = myDeliveries.filter((delivery) => delivery.deliveryStatus === "completed").length;
  const failedCount = myDeliveries.filter((delivery) => delivery.deliveryStatus === "failed").length;

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="shipper" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-8">Tong quan Shipper</h1>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: "local_shipping", label: "Cho nhan", value: availableDeliveries.length },
              { icon: "pending_actions", label: "Dang xu ly", value: activeDeliveries.length },
              { icon: "check_circle", label: "Hoan tat", value: completedCount },
              { icon: "error", label: "That bai", value: failedCount },
            ].map((item) => (
              <div key={item.label} className="bg-surface-container-lowest rounded-2xl p-5 shadow-apple border border-surface-variant/30 text-center">
                <span className="material-symbols-outlined text-primary text-3xl block mb-2">{item.icon}</span>
                <p className="text-2xl font-bold text-on-surface">{item.value}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
            <div className="p-5 border-b border-surface-variant/40 flex justify-between items-center">
              <h2 className="font-bold text-on-surface">Don cho shipper nhan</h2>
              <Link to="/shipper/don-can-giao" className="text-primary text-sm font-medium hover:underline">Xem tat ca</Link>
            </div>

            {loading ? (
              <div className="p-10 text-center text-on-surface-variant">Dang tai...</div>
            ) : availableDeliveries.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant">
                Hien khong co don giao nao cho nhan.
              </div>
            ) : (
              <div className="divide-y divide-surface-variant/30">
                {availableDeliveries.slice(0, 5).map((delivery) => {
                  const order = delivery.orderId || {};
                  return (
                    <div key={delivery._id} className="p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-surface text-sm">{order.postId?.title || "Don giao hang"}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Tu: {order.sellerId?.fullName || "Nguoi ban"}<br />
                          Den: {order.buyerId?.fullName || "Nguoi mua"}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-semibold text-primary">{formatCurrency(delivery.deliveryFee)}</span>
                          <span className="text-xs text-on-surface-variant truncate">{delivery.pickupAddress}</span>
                        </div>
                      </div>
                      <Link
                        to="/shipper/don-can-giao"
                        className="flex-shrink-0 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        Xu ly
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default ShipperDashboard;
