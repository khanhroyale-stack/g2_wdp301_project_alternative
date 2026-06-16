import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import shipperService from "../../services/shipper.service";

const DonCanGiao = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await shipperService.getAvailableOrders();
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAccept = async (id) => {
    try {
      const res = await shipperService.acceptOrder(id);
      if (res.success) {
        alert("Đã nhận đơn giao hàng thành công!");
        fetchOrders();
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
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3">inbox</span>
              <p className="text-sm">Hiện không có đơn hàng nào chờ giao.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-bold text-on-surface">{order.product?.title}</p>
                      <p className="text-xs text-on-surface-variant mt-1">Mã đơn: {order._id}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">Phí ship: {order.shippingFee?.toLocaleString()}₫</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-surface-container-low rounded-xl">
                    <div className="flex gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">store</span>
                      <div>
                        <p className="text-xs text-on-surface-variant">Lấy hàng tại</p>
                        <p className="text-sm font-medium text-on-surface">{order.seller?.name}</p>
                        <p className="text-xs text-on-surface-variant">{order.seller?.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
                      <div>
                        <p className="text-xs text-on-surface-variant">Giao đến</p>
                        <p className="text-sm font-medium text-on-surface">{order.buyer?.name}</p>
                        <p className="text-xs text-on-surface-variant">{order.buyer?.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleAccept(order._id)}
                      className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                      Nhận đơn giao hàng
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default DonCanGiao;
