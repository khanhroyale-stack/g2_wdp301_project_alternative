import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CircleHelp,
  MapPin,
  PackageSearch,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import productService from "../../services/product.service";
import { authService } from "../../services/auth.service";
import { useAuth } from "../../context/AuthContext";

const MAX_FEATURED = 3;
const ELIGIBLE_STATUSES = ["approved", "available"];

const formatPrice = (product) => {
  const value = product.productType === "rent" ? product.rentPricePerDay : product.salePrice;
  return `${new Intl.NumberFormat("vi-VN").format(value || 0)}đ${product.productType === "rent" ? "/ngày" : ""}`;
};

const getImage = (product) => product.thumbnailUrl || product.images?.[0] || "https://placehold.co/640x420/f3f5f7/8b95a5?text=EcoTrade";

export default function SelectFeaturedProducts() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getMyProducts();
        if (res.success) {
          const eligible = (res.data || []).filter((item) => ELIGIBLE_STATUSES.includes(item.postStatus));
          setProducts(eligible);
          setSelectedIds(eligible.filter((item) => item.isFeatured).map((item) => item._id).slice(0, MAX_FEATURED));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tải danh sách sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    if (filter === "selected") return products.filter((item) => selectedIds.includes(item._id));
    return products;
  }, [filter, products, selectedIds]);

  const toggleProduct = (productId) => {
    setSelectedIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }
      if (current.length >= MAX_FEATURED) {
        return current;
      }
      return [...current, productId];
    });
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await productService.setFeaturedProducts(selectedIds);
      await refreshUser();
      navigate("/quan-ly/bai-dang");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật sản phẩm nổi bật.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setSubmitting(true);
    try {
      await authService.markFeaturedSetupDone();
      await refreshUser();
      navigate("/quan-ly/bai-dang");
    } catch {
      navigate("/quan-ly/bai-dang");
    } finally {
      setSubmitting(false);
    }
  };

  const isPro = user?.isPro || (user?.proExpiresAt && new Date(user.proExpiresAt).getTime() > Date.now());

  return (
    <EcoTradeLayout>
      <div className="pb-28">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#8b95a5]">
            <Link to="/quan-ly/bai-dang" className="font-medium hover:text-[#20242b]">Sản phẩm</Link>
            <ChevronRight size={15} />
            <span className="font-semibold text-[#20242b]">Chọn sản phẩm nổi bật</span>
          </div>
          <CircleHelp className="h-5 w-5 text-[#4b5563]" />
        </header>

        <section className="mb-10 rounded-[8px] bg-[#eefbf4] px-6 py-8 md:px-10 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_260px] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#27c76f]">
                <Star className="h-4 w-4" />
                Gói Pro đã kích hoạt
              </div>
              <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#174b2f] md:text-4xl">
                Chọn sản phẩm nổi bật của bạn
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#6b8777]">
                Chúc mừng bạn đã nâng cấp thành công. Hãy chọn những sản phẩm tốt nhất để thu hút khách hàng ngay hôm nay.
              </p>
              <div className="mt-6 grid gap-3 text-sm font-semibold text-[#668174] sm:grid-cols-2">
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#35d27a]" /> Đăng bài không giới hạn</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#35d27a]" /> Chọn tối đa 3 sản phẩm nổi bật</span>
                <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#35d27a]" /> Sản phẩm được ưu tiên hiển thị</span>
              </div>
            </div>

            <div className="rounded-[8px] bg-white p-6 text-center shadow-sm">
              <p className="text-sm font-bold text-[#a0a8b3]">Đã chọn sản phẩm</p>
              <div className="mt-3 flex items-end justify-center gap-1">
                <span className="text-5xl font-black text-[#20242b]">{selectedIds.length}</span>
                <span className="mb-2 text-2xl font-bold text-[#a0a8b3]">/ {MAX_FEATURED}</span>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#edf0f2]">
                <div className="h-full rounded-full bg-[#34d37b] transition-all" style={{ width: `${(selectedIds.length / MAX_FEATURED) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>

        {!isPro ? (
          <div className="rounded-[8px] border border-[#f8d7a4] bg-[#fff8eb] p-5 text-sm font-semibold text-[#a46707]">
            Tài khoản của bạn chưa có Pro hoặc gói Pro đã hết hạn. Vui lòng nâng cấp Pro để chọn sản phẩm nổi bật.
          </div>
        ) : null}

        <section>
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-xl font-extrabold text-[#20242b]">Danh sách sản phẩm được duyệt</h2>
              <p className="mt-1 text-sm font-medium text-[#9aa3af]">Chỉ hiển thị các sản phẩm đã qua kiểm duyệt nội dung.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/dang-tin?returnTo=${encodeURIComponent("/goi-pro/chon-san-pham-noi-bat")}`}
                className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#34d37b] px-4 text-sm font-bold text-[#07361f] hover:bg-[#2fc271]"
              >
                <Plus className="h-4 w-4" />
                Đăng sản phẩm mới
              </Link>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`h-10 rounded-[6px] border px-4 text-sm font-bold ${filter === "all" ? "border-[#dfe5ec] bg-white text-[#20242b]" : "border-transparent text-[#98a1ad]"}`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilter("selected")}
                className={`h-10 rounded-[6px] border px-4 text-sm font-bold ${filter === "selected" ? "border-[#dfe5ec] bg-white text-[#20242b]" : "border-transparent text-[#98a1ad]"}`}
              >
                Đã chọn
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-72 items-center justify-center rounded-[8px] border border-[#e3e7ec] bg-white">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#dfe5ec] border-t-[#34d37b]" />
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center rounded-[8px] border border-dashed border-[#dce2e8] bg-white text-center">
              <PackageSearch className="mb-3 h-10 w-10 text-[#a0a8b3]" />
              <p className="text-sm font-bold text-[#20242b]">Chưa có sản phẩm đã duyệt phù hợp</p>
              <p className="mt-1 text-sm text-[#8b95a5]">Bạn có thể đăng sản phẩm mới và quay lại chọn sau khi admin duyệt.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const selected = selectedIds.includes(product._id);
                return (
                  <article
                    key={product._id}
                    className={`overflow-hidden rounded-[8px] border bg-white shadow-sm transition-all ${selected ? "border-[#34d37b] ring-1 ring-[#34d37b]" : "border-[#e6e9ee] hover:border-[#b9efcf] hover:shadow-md"}`}
                  >
                    <button type="button" onClick={() => toggleProduct(product._id)} disabled={!selected && selectedIds.length >= MAX_FEATURED} className="block w-full text-left disabled:cursor-not-allowed">
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#f2f4f6]">
                        <img src={getImage(product)} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                        {selected ? (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#34d37b] px-3 py-1 text-xs font-extrabold text-[#07361f]">
                            <Star className="h-3.5 w-3.5" />
                            Nổi bật
                          </span>
                        ) : null}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 min-h-[42px] text-sm font-extrabold leading-5 text-[#2b3139]">{product.title}</h3>
                        <p className="mt-5 text-xl font-black text-[#34d37b]">{formatPrice(product)}</p>
                        <div className="mt-2 space-y-1 text-xs font-medium text-[#8b95a5]">
                          <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {product.location || "Chưa cập nhật"}</p>
                          <p className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {product.categoryId?.name || "Sản phẩm"}</p>
                        </div>
                        <div className={`mt-4 flex h-10 items-center justify-center rounded-[6px] border text-sm font-extrabold ${selected ? "border-[#34d37b] bg-white text-[#34b86e]" : "border-[#34d37b] bg-[#34d37b] text-[#07361f]"}`}>
                          {selected ? (
                            <>
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              Đã chọn
                            </>
                          ) : (
                            "Chọn làm nổi bật"
                          )}
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-[8px] border border-dashed border-[#dfe5ec] bg-white p-5">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#dff7e8] bg-[#f4fff8] text-[#34d37b]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#20242b]">Mẹo nhỏ: Chọn sản phẩm bán chạy</p>
              <p className="mt-1 text-sm leading-6 text-[#9aa3af]">Các sản phẩm nổi bật thường có lượt xem cao hơn. Nên chọn sản phẩm có hình ảnh sắc nét và mức giá cạnh tranh.</p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#e2e6eb] bg-white/95 px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur xl:left-[250px]">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
              <p className="font-medium text-[#9aa3af]">Đang lựa chọn:</p>
              <p className="font-extrabold text-[#20242b]">Đã chọn {selectedIds.length} sản phẩm</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleSkip} disabled={submitting} className="h-12 min-w-[170px] rounded-[6px] border border-[#dfe5ec] bg-white px-5 text-sm font-extrabold text-[#3d4652] hover:bg-[#f7f8f9] disabled:opacity-60">
                Bỏ qua, chọn sau
              </button>
              <button type="button" onClick={handleConfirm} disabled={!isPro || submitting} className="inline-flex h-12 min-w-[230px] items-center justify-center gap-2 rounded-[6px] bg-[#34d37b] px-6 text-sm font-extrabold text-[#07361f] hover:bg-[#2fc271] disabled:opacity-60">
                {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07361f]/30 border-t-[#07361f]" /> : <Sparkles className="h-4 w-4" />}
                Xác nhận ({selectedIds.length} sản phẩm)
              </button>
            </div>
          </div>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
