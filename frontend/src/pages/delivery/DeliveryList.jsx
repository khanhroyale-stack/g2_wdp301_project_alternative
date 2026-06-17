import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import deliveryService from "../../services/delivery.service";

const DeliveryList = () => {
  const [tab, setTab] = useState("available"); // available or my-deliveries
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, [tab]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = tab === "available"
        ? await deliveryService.getAvailableDeliveries()
        : await deliveryService.getMyDeliveries();
      
      if (res.success) {
        setDeliveries(res.data);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDelivery = async (id) => {
    if (!confirm("Bạn có chắc muốn nhận đơn giao này?")) {
      return;
    }

    try {
      const res = await deliveryService.acceptDelivery(id);
      if (res.success) {
        alert("✅ Đã nhận đơn giao thành công!");
        fetchDeliveries();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể nhận đơn giao");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Chờ shipper", color: "#ff9500", bg: "#fff3e0", icon: "⏳" },
      picking_up: { label: "Đang lấy hàng", color: "#007aff", bg: "#e3f2fd", icon: "🚶" },
      in_transit: { label: "Đang giao", color: "#5856d6", bg: "#ede7f6", icon: "🚚" },
      delivered: { label: "Đã giao", color: "#34c759", bg: "#e8f5e9", icon: "✅" },
      failed: { label: "Thất bại", color: "#ff3b30", bg: "#ffebee", icon: "❌" },
    };
    return statusMap[status] || { label: status, color: "#86868b", bg: "#f5f5f7", icon: "❓" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem", color: "#1d1d1f" }}>
          🚚 Quản lý giao hàng
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <button
            onClick={() => setTab("available")}
            style={{
              padding: "0.75rem 1.5rem",
              background: tab === "available" ? "#0071e3" : "white",
              color: tab === "available" ? "white" : "#1d1d1f",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            📦 Đơn có sẵn
          </button>
          <button
            onClick={() => setTab("my-deliveries")}
            style={{
              padding: "0.75rem 1.5rem",
              background: tab === "my-deliveries" ? "#0071e3" : "white",
              color: tab === "my-deliveries" ? "white" : "#1d1d1f",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            🚚 Đơn của tôi
          </button>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</p>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>
              {tab === "available" ? "Chưa có đơn giao nào" : "Bạn chưa nhận đơn giao nào"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {deliveries.map((delivery) => {
              const statusInfo = getStatusInfo(delivery.deliveryStatus);
              const order = delivery.orderId;

              return (
                <div
                  key={delivery._id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "#86868b" }}>
                          Mã giao hàng: <strong>{delivery._id.substring(0, 8).toUpperCase()}</strong>
                        </span>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                          }}
                        >
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0071e3" }}>
                        Phí giao hàng: {formatPrice(delivery.deliveryFee)}
                      </p>
                    </div>
                    <Link
                      to={`/delivery/${delivery._id}`}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#f5f5f7",
                        color: "#0071e3",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      Chi tiết →
                    </Link>
                  </div>

                  {order && (
                    <>
                      <div style={{ display: "flex", gap: "1.5rem", padding: "1rem 0", borderTop: "1px solid #f5f5f7", borderBottom: "1px solid #f5f5f7" }}>
                        <div style={{ width: "80px", height: "80px", borderRadius: "12px", overflow: "hidden", background: "#f5f5f7" }}>
                          {order.productImage ? (
                            <img src={order.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#86868b" }}>📦</div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                            {order.postId?.title || "Sản phẩm"}
                          </h3>
                          <p style={{ color: "#86868b", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                            📍 Lấy hàng: {delivery.pickupAddress}
                          </p>
                          <p style={{ color: "#86868b", fontSize: "0.85rem" }}>
                            📍 Giao đến: {delivery.deliveryAddress}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem", padding: "1rem", background: "#f5f5f7", borderRadius: "12px" }}>
                        <div>
                          <p style={{ fontSize: "0.85rem", color: "#86868b", marginBottom: "0.25rem" }}>👤 Người bán</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>{order.sellerId?.fullName || "N/A"}</p>
                          <p style={{ fontSize: "0.85rem", color: "#86868b" }}>📞 {order.sellerId?.phone || "N/A"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: "0.85rem", color: "#86868b", marginBottom: "0.25rem" }}>👤 Người mua</p>
                          <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>{order.buyerId?.fullName || "N/A"}</p>
                          <p style={{ fontSize: "0.85rem", color: "#86868b" }}>📞 {order.buyerId?.phone || "N/A"}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  {tab === "available" && (
                    <div style={{ marginTop: "1rem" }}>
                      <button
                        onClick={() => handleAcceptDelivery(delivery._id)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          background: "#34c759",
                          color: "white",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "1rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✅ Nhận đơn giao
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryList;
