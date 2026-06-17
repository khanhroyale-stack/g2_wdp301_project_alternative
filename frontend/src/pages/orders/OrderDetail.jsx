import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import orderService from "../../services/order.service";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tải thông tin đơn hàng");
      navigate(-1);
    } finally {
      setLoading(false);
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
      pending: { label: "Chờ xác nhận", color: "#ff9500", bg: "#fff3e0", icon: "⏳" },
      confirmed: { label: "Đã xác nhận", color: "#34c759", bg: "#e8f5e9", icon: "✅" },
      shipping: { label: "Đang giao", color: "#007aff", bg: "#e3f2fd", icon: "🚚" },
      delivered: { label: "Đã giao", color: "#5856d6", bg: "#ede7f6", icon: "📦" },
      completed: { label: "Hoàn thành", color: "#34c759", bg: "#e8f5e9", icon: "🎉" },
      cancelled: { label: "Đã hủy", color: "#ff3b30", bg: "#ffebee", icon: "❌" },
    };
    return statusMap[status] || { label: status, color: "#86868b", bg: "#f5f5f7", icon: "❓" };
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
        <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = getStatusInfo(order.orderStatus);
  const product = order.postId;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid #d1d1d6", borderRadius: "8px", cursor: "pointer", marginBottom: "1.5rem" }}
        >
          ← Quay lại
        </button>

        <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1d1d1f" }}>
                Chi tiết đơn hàng
              </h1>
              <p style={{ color: "#86868b" }}>
                Mã đơn: <strong>{order._id.substring(0, 12).toUpperCase()}</strong>
              </p>
            </div>
            <div
              style={{
                padding: "0.75rem 1.5rem",
                background: statusInfo.bg,
                color: statusInfo.color,
                borderRadius: "12px",
                fontSize: "1.1rem",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {statusInfo.icon} {statusInfo.label}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>📍 Trạng thái đơn hàng</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34c759" }}></div>
                <span style={{ fontSize: "0.9rem" }}>Đơn hàng đã tạo - {formatDate(order.createdAt)}</span>
              </div>
              {order.orderStatus !== "pending" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34c759" }}></div>
                  <span style={{ fontSize: "0.9rem" }}>Người bán đã xác nhận</span>
                </div>
              )}
              {(order.orderStatus === "shipping" || order.orderStatus === "delivered" || order.orderStatus === "completed") && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#007aff" }}></div>
                  <span style={{ fontSize: "0.9rem" }}>Đang giao hàng</span>
                </div>
              )}
              {(order.orderStatus === "delivered" || order.orderStatus === "completed") && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#5856d6" }}></div>
                  <span style={{ fontSize: "0.9rem" }}>Đã giao thành công</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>🛍️ Sản phẩm</h3>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "12px", overflow: "hidden", background: "white" }}>
                {product?.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#86868b" }}>📦</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{product?.title || "Sản phẩm"}</h4>
                <p style={{ color: "#86868b", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  {product?.categoryId?.name || "Khác"} • {product?.conditionStatus || "N/A"}
                </p>
                <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0071e3" }}>
                  {formatPrice(order.productPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
            <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>📍 Thông tin nhận hàng</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                <p><strong>Người nhận:</strong> {order.recipientName}</p>
                <p><strong>Số điện thoại:</strong> {order.buyerPhone}</p>
                <p><strong>Địa chỉ:</strong> {order.buyerAddress}</p>
                {order.note && <p><strong>Ghi chú:</strong> {order.note}</p>}
              </div>
            </div>

            <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>👤 Thông tin liên hệ</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                <p><strong>Người bán:</strong> {order.sellerId?.fullName || "N/A"}</p>
                <p><strong>Email:</strong> {order.sellerId?.email || "N/A"}</p>
                <p><strong>Số điện thoại:</strong> {order.sellerId?.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>💰 Thông tin thanh toán</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#86868b" }}>Giá sản phẩm</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(order.productPrice)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#86868b" }}>Phí vận chuyển</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(order.shippingFee)}</span>
              </div>
              <div style={{ height: "1px", background: "#d1d1d6", margin: "0.5rem 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem" }}>
                <span style={{ fontWeight: 600 }}>Tổng cộng</span>
                <span style={{ fontWeight: 700, color: "#0071e3" }}>{formatPrice(order.totalAmount)}</span>
              </div>
              <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "white", borderRadius: "8px", fontSize: "0.9rem" }}>
                💵 Thanh toán khi nhận hàng (COD)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
