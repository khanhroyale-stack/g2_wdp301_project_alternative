import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import orderService from "../../services/order.service";

const CreateOrder = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    recipientName: "",
    buyerPhone: "",
    buyerAddress: "",
    note: "",
  });

  useEffect(() => {
    fetchCheckoutPreview();
  }, [productId]);

  const fetchCheckoutPreview = async () => {
    setLoading(true);
    try {
      const res = await orderService.getCheckoutPreview(productId);
      if (res.success) {
        setPreview(res.data);
        setForm({
          recipientName: res.data.buyer?.fullName || "",
          buyerPhone: res.data.buyer?.phone || "",
          buyerAddress: res.data.buyer?.address || "",
          note: "",
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tải thông tin sản phẩm");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({
        productId,
        ...form,
      });
      if (res.success) {
        alert("✅ Đặt hàng thành công!");
        navigate("/orders/my-orders");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
        <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
      </div>
    );
  }

  if (!preview) return null;

  const product = preview.product;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid #d1d1d6", borderRadius: "8px", cursor: "pointer", marginBottom: "1.5rem" }}
        >
          ← Quay lại
        </button>

        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem", color: "#1d1d1f" }}>
          📦 Xác nhận đơn hàng
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
            {/* Left Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Delivery Info */}
              <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", color: "#1d1d1f" }}>
                  📍 Thông tin nhận hàng
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Họ và tên người nhận</label>
                    <input
                      type="text"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      required
                      style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Số điện thoại</label>
                    <input
                      type="tel"
                      value={form.buyerPhone}
                      onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                      required
                      style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Địa chỉ giao hàng</label>
                    <textarea
                      value={form.buyerAddress}
                      onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                      required
                      rows={3}
                      style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem", resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", color: "#1d1d1f" }}>
                  🛍️ Sản phẩm
                </h2>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ width: "120px", height: "120px", borderRadius: "12px", overflow: "hidden", background: "#f5f5f7" }}>
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#86868b" }}>📦</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>{product.title}</h3>
                    <p style={{ color: "#86868b", marginBottom: "0.5rem" }}>
                      {product.categoryId?.name || "Khác"} • {product.conditionStatus}
                    </p>
                    <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0071e3" }}>
                      {formatPrice(product.salePrice)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Ghi chú cho người bán (tùy chọn)</label>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  placeholder="Ví dụ: Gọi trước khi giao..."
                  style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem", resize: "vertical" }}
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div style={{ background: "white", borderRadius: "16px", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: "2rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem", color: "#1d1d1f" }}>
                  💰 Tổng quan đơn hàng
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#86868b" }}>Giá sản phẩm</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(preview.subtotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#86868b" }}>Phí vận chuyển</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(preview.shippingFee)}</span>
                  </div>
                  <div style={{ height: "1px", background: "#d1d1d6" }}></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem" }}>
                    <span style={{ fontWeight: 600 }}>Tổng cộng</span>
                    <span style={{ fontWeight: 700, color: "#0071e3" }}>{formatPrice(preview.totalAmount)}</span>
                  </div>
                </div>

                <div style={{ padding: "1rem", background: "#f5f5f7", borderRadius: "12px", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>💵</span>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>Thanh toán khi nhận hàng (COD)</p>
                      <p style={{ fontSize: "0.85rem", color: "#86868b" }}>Thanh toán trực tiếp cho shipper</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: submitting ? "#86868b" : "#0071e3",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Đang xử lý..." : "✅ Đặt hàng"}
                </button>

                <p style={{ fontSize: "0.85rem", color: "#86868b", marginTop: "1rem", textAlign: "center" }}>
                  Bằng cách đặt hàng, bạn đồng ý với điều khoản sử dụng
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
