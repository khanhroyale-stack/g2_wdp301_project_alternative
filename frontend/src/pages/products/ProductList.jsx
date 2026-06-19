import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productService from "../../services/product.service";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    type: "",
    search: "",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await productService.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts(filters);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f7",
        padding: "clamp(1rem, 2vw, 2rem) clamp(1rem, 3vw, 2.5rem)",
      }}
    >
      <div style={{ width: "100%" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "2rem", color: "#1d1d1f" }}>
          🛍️ Chợ đồ cũ sinh viên
        </h1>

        {/* Search and Filters */}
        <div style={{ background: "white", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem" }}
              />
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                style={{ padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem" }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                style={{ padding: "0.75rem", border: "1px solid #d1d1d6", borderRadius: "8px", fontSize: "1rem" }}
              >
                <option value="">Loại sản phẩm</option>
                <option value="sale">Bán</option>
                <option value="rent">Cho thuê</option>
                <option value="both">Cả hai</option>
              </select>
              <button
                type="submit"
                style={{ padding: "0.75rem", background: "#0071e3", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: 600, cursor: "pointer" }}
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Đang tải...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", background: "white", borderRadius: "12px" }}>
            <p style={{ fontSize: "1.2rem", color: "#86868b" }}>Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              gap: "clamp(1rem, 2vw, 1.5rem)",
              alignItems: "stretch",
            }}
          >
            {products.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ background: "white", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer", height: "100%" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }}
                >
                  <div style={{ width: "100%", height: "200px", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ color: "#86868b" }}>📦 No Image</span>
                    )}
                  </div>
                  <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "160px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#1d1d1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: "0.9rem", color: "#86868b", marginBottom: "0.75rem" }}>
                      {product.categoryId?.name || "Khác"}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "auto", flexWrap: "wrap" }}>
                      <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0071e3" }}>
                        {formatPrice(product.salePrice)}
                      </p>
                      <span style={{ fontSize: "0.8rem", padding: "0.25rem 0.75rem", background: "#f5f5f7", borderRadius: "12px", color: "#1d1d1f" }}>
                        {product.conditionStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;
