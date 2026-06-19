import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import shipperService from "../../services/shipper.service";

const getImageUrl = (url) => {
  if (!url) return "https://placehold.co/400x300?text=No+Image";
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
};

const PendingDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await shipperService.getAvailableOrders();
      if (res.success) setDeliveries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleAccept = async (id) => {
    try {
      const res = await shipperService.acceptOrder(id);
      if (res.success) {
        alert("Đã nhận đơn giao hàng thành công!");
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi nhận đơn");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="shipper" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-8">Đơn cần giao</h1>

          {loading ? (
            <div className="text-center py-16 text-on-surface-variant">Đang tải...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3">inbox</span>
              <p className="text-sm">Hiện không có đơn hàng nào chờ giao.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {deliveries.map((delivery) => {
                const order = delivery.orderId;
                return (
                  <div key={delivery._id} className="bg-white rounded-2xl shadow-sm border border-surface-variant/30 overflow-hidden">
                    <div className="p-6 flex gap-6">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-surface-container flex-shrink-0">
                        <img src={getImageUrl(order.productImage)} alt={order.postId?.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h3 className="font-bold text-on-surface text-lg">{order.postId?.title}</h3>
                            <p className="text-xs text-on-surface-variant mt-1">Mã đơn hàng: {order._id}</p>
                          </div>
                          <p className="text-sm font-bold text-primary">
                            Phí ship: {delivery.deliveryFee ? `${delivery.deliveryFee.toLocaleString()}₫` : "0₫"}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-surface-container-low rounded-xl">
                          <div className="flex gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">store</span>
                            <div>
                              <p className="text-xs text-on-surface-variant">Lấy hàng tại</p>
                              <p className="text-sm font-medium text-on-surface">{order.sellerId?.fullName}</p>
                              <p className="text-xs text-on-surface-variant">{order.sellerId?.phone}</p>
                              <p className="text-xs text-on-surface-variant">{delivery.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
                            <div>
                              <p className="text-xs text-on-surface-variant">Giao đến</p>
                              <p className="text-sm font-medium text-on-surface">{order.buyerId?.fullName}</p>
                              <p className="text-xs text-on-surface-variant">{order.buyerPhone}</p>
                              <p className="text-xs text-on-surface-variant">{order.buyerAddress}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAccept(delivery._id)}
                          className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                        >
                          Nhận đơn giao hàng
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default PendingDeliveries;
