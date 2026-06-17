import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import orderService from "../../services/order.service";

const OrderList = () => {
  const [tab, setTab] = useState("buyer"); // buyer or seller
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = tab === "buyer" 
        ? await orderService.getMyOrders()
        : await orderService.getMySales();
      
      if (res.success) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    if (!confirm(`Bạn có chắc muốn ${status === "confirmed" ? "xác nhận" : status === "cancelled" ? "hủy" : "cập nhật"} đơn hàng này?`)) {
      return;
    }

    try {
      const res = await orderService.updateOrderStatus(orderId, status);
      if (res.success) {
        alert("✅ Cập nhật thành công!");
        fetchOrders();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể cập nhật đơn hàng");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", color: "#ff9500", bg: "#fff3e0" },
      confirmed: { label: "Đã xác nhận", color: "#34c759", bg: "#e8f5e9" },
      shipping: { label: "Đang giao", color: "#007aff", bg: "#e3f2fd" },
      delivered: { label: "Đã giao", color: "#5856d6", bg: "#ede7f6" },
      completed: { label: "Hoàn thành", color: "#34c759", bg: "#e8f5e9" },
      cancelled: { label: "Đã hủy", color: "#ff3b30", bg: "#ffebee" },
    };
    return statusMap[status] || { label: status, color: "#86868b", bg: "#f5f5f7" };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem", color: "#1d1d1f" }}>
          📦 Quản lý đơn hàng
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
          <button
            onClick={() => setTab("buyer")}
            style={{
              padding: "0.75rem 1.5rem",
              background: tab === "buyer" ? "#0071e3" : "white",
              color: tab === "buyer" ? "white" : "#1d1d1f",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            🛒 Đơn mua
          </button>
          <button
            onClick={() => setTab("seller")}
            style={{
              padding: "0.75rem 1.5rem",
              background: tab === "seller" ? "#0071e3" : "white",
              color: tab === "seller" ? "white" : "#1d1d1f",
              border: "none",
              borderRadius: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            💰 Đơn bán
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "16px" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📭</p>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.orderStatus);
              const otherParty = tab === "buyer" ? order.sellerId : order.buyerId;

              return (
                <div
                  key={order._id}
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
                          Mã đơn: <strong>{order._id.substring(0, 8).toUpperCase()}</strong>
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
                          {statusInfo.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#86868b" }}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Link
                      to={`/orders/${order._id}`}
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

                  <div style={{ display: "flex", gap: "1.5rem", padding: "1rem 0", borderTop: "1px solid #f5f5f7", borderBottom: "1px solid #f5f5f7" }}>
                    <div style={{ width: "100px", height: "100px", borderRadius: "12px", overflow: "hidden", background: "#f5f5f7" }}>
                      {order.productImage ? (
                        <img src={order.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#86868b" }}>📦</div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        {order.postId?.title || "Sản phẩm"}
                      </h3>
                      <p style={{ color: "#86868b", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                        {tab === "buyer" ? "Người bán:" : "Người mua:"} {otherParty?.fullName || "N/A"}
                      </p>
                      <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0071e3" }}>
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", justifyContent: "flex-end" }}>
                    {/* Buyer Actions */}
                    {tab === "buyer" && order.orderStatus === "pending" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "cancelled")}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "white",
                          color: "#ff3b30",
                          border: "2px solid #ff3b30",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ❌ Hủy đơn
                      </button>
                    )}
                    {tab === "buyer" && order.orderStatus === "shipping" && (
                      <button
                        onClick={() => handleStatusUpdate(order._id, "delivered")}
                        style={{
                          padding: "0.5rem 1rem",
                          background: "#34c759",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✅ Đã nhận hàng
                      </button>
                    )}

                    {/* Seller Actions */}
                    {tab === "seller" && order.orderStatus === "pending" && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(order._id, "cancelled")}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "white",
                            color: "#ff3b30",
                            border: "2px solid #ff3b30",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ❌ Từ chối
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(order._id, "confirmed")}
                          style={{
                            padding: "0.5rem 1rem",
                            background: "#34c759",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          ✅ Xác nhận đơn
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
