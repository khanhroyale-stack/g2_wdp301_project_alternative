import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import productService from "../../services/product.service";
import cartService from "../../services/cart.service";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCompactLayout, setIsCompactLayout] = useState(() => window.innerWidth < 960);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  useEffect(() => {
    const handleResize = () => setIsCompactLayout(window.innerWidth < 960);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await productService.getProductById(id);
      if (res.success) {
        setProduct(res.data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
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

  const handleBuyNow = () => {
    navigate(`/orders/create/${id}`);
  };

  const handleAddToCart = async () => {
    try {
      const res = await cartService.addCartItem(id, 1);
      if (res.success) {
        navigate("/gio-hang");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Khong the them vao gio hang");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
        <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7" }}>
        <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        padding: "clamp(1rem, 2vw, 2rem) clamp(1rem, 3vw, 2.5rem)",
      }}
    >
      <div style={{ width: "100%" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0.5rem 1rem", background: "white", border: "1px solid #d1d1d6", borderRadius: "8px", cursor: "pointer", marginBottom: "1.5rem" }}
        >
          ← Quay lại
        </button>

        <div style={{ background: "white", borderRadius: "16px", padding: "clamp(1rem, 2vw, 2rem)", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isCompactLayout ? "1fr" : "minmax(0, 1.05fr) minmax(320px, 0.95fr)",
              gap: "clamp(1.25rem, 3vw, 3rem)",
              alignItems: "start",
            }}
          >
            {/* Images */}
            <div>
              <div style={{ width: "100%", height: isCompactLayout ? "280px" : "clamp(320px, 42vw, 520px)", background: "#f5f5f7", borderRadius: "12px", overflow: "hidden", marginBottom: "1rem" }}>
                {product.images && product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#86868b" }}>
                    📦 No Image
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border: selectedImage === idx ? "3px solid #0071e3" : "3px solid transparent",
                      }}
                    >
                      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <span style={{ display: "inline-block", padding: "0.25rem 0.75rem", background: "#f5f5f7", borderRadius: "12px", fontSize: "0.9rem", color: "#86868b", marginBottom: "0.5rem" }}>
                  {product.categoryId?.name || "Khác"}
                </span>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1d1d1f", marginBottom: "0.5rem" }}>
                  {product.title}
                </h1>
                <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#0071e3", marginBottom: "1rem" }}>
                  {formatPrice(product.salePrice)}
                </p>
              </div>

              <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#1d1d1f" }}>Thông tin sản phẩm</h3>
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#86868b" }}>Tình trạng:</span>
                    <span style={{ fontWeight: 600 }}>{product.conditionStatus}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#86868b" }}>Số lượng:</span>
                    <span style={{ fontWeight: 600 }}>{product.quantity}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#86868b" }}>Địa điểm:</span>
                    <span style={{ fontWeight: 600 }}>{product.location || "Chưa cập nhật"}</span>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div style={{ padding: "1.5rem", background: "#f5f5f7", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#1d1d1f" }}>Người bán</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#0071e3", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 600 }}>
                    {product.ownerId?.fullName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "1rem" }}>{product.ownerId?.fullName || "N/A"}</p>
                    <p style={{ color: "#86868b", fontSize: "0.9rem" }}>⭐ Điểm uy tín: {product.ownerId?.reputationScore || 100}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "#1d1d1f" }}>Mô tả</h3>
                <p style={{ color: "#515154", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem", flexDirection: isCompactLayout ? "column" : "row" }}>
                <button
                  onClick={handleBuyNow}
                  style={{
                    flex: 1,
                    padding: "1rem",
                    background: "#0071e3",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#0051ba"}
                  onMouseLeave={(e) => e.target.style.background = "#0071e3"}
                >
                  🛒 Mua ngay
                </button>
                <button
                  style={{
                    padding: "1rem",
                    background: "white",
                    color: "#0071e3",
                    border: "2px solid #0071e3",
                    borderRadius: "12px",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  💬 Chat với người bán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
