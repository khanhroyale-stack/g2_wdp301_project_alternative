import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Eye,
  Info,
  Leaf,
  List,
  Plus,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";
import uploadService from "../../services/upload.service";
import categoryService from "../../services/category.service";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";

const MAX_IMAGES = 8;
const FREE_POST_LIMIT = 5;

const defaultForm = {
  title: "",
  categoryId: "",
  conditionStatus: "good",
  productType: "sale",
  salePrice: "",
  quantity: "1",
  rentPricePerDay: "",
  depositAmount: "",
  location: "Khu vực Hòa Lạc",
  description: "",
};

const inputCls =
  "h-11 w-full rounded-md border border-[#dbe1e8] bg-white px-3 text-sm text-[#20242b] outline-none transition focus:border-[#18c94f] focus:ring-2 focus:ring-[#18c94f]/10 placeholder:text-[#929bad]";
const labelCls = "mb-2 block text-sm font-bold text-[#444b57]";

const getImageSource = (src) => {
  if (!src) return "";
  if (src.startsWith("blob:") || src.startsWith("http")) return src;
  return `http://localhost:5000${src}`;
};

const CreatePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const returnTo = searchParams.get("returnTo");

  const [form, setForm] = useState(defaultForm);
  // imagePreviews: array of { src: string, file?: File, isExisting: boolean }
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditMode);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const [myPostCount, setMyPostCount] = useState(null);

  const isPro = user?.accountType === "pro" || user?.subscriptionPlan === "pro" || user?.isPro;

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data || []);
      })
      .catch((err) => console.error("Error fetching categories:", err));

    // Fetch post count for non-pro users
    if (!isPro && !isEditMode) {
      productService
        .getMyProducts()
        .then((res) => {
          if (res.success) {
            const activeCount = (res.data || []).filter(
              (p) => !["sold", "rented", "inactive", "closed"].includes(p.postStatus)
            ).length;
            setMyPostCount(activeCount);
          }
        })
        .catch(() => {});
    }
  }, [isPro, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setInitializing(false);
      return;
    }

    const fetchProduct = async () => {
      setInitializing(true);
      try {
        const res = await productService.getProductById(id);
        if (res.success) {
          const product = res.data;
          setForm({
            title: product.title || "",
            categoryId: product.categoryId?._id || product.categoryId || "",
            conditionStatus: product.conditionStatus || "good",
            productType: product.productType || "sale",
            salePrice: product.salePrice || "",
            quantity: String(product.quantity || 1),
            rentPricePerDay: product.rentPricePerDay || "",
            depositAmount: product.depositAmount || "",
            location: product.location || "",
            description: product.description || "",
          });
          setImagePreviews(
            (product.images || []).map((src) => ({ src, isExisting: true }))
          );
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tải bài đăng để chỉnh sửa.");
        navigate("/quan-ly/bai-dang");
      } finally {
        setInitializing(false);
      }
    };

    fetchProduct();
  }, [id, isEditMode, navigate]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddImages = (event) => {
    const files = Array.from(event.target.files || []);
    const remaining = MAX_IMAGES - imagePreviews.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      src: URL.createObjectURL(file),
      file,
      isExisting: false,
    }));
    setImagePreviews((prev) => [...prev, ...toAdd]);
    // reset input so same files can be re-added if removed
    event.target.value = "";
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => {
      const updated = [...prev];
      const removed = updated.splice(index, 1)[0];
      if (removed.src.startsWith("blob:")) URL.revokeObjectURL(removed.src);
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newImages = imagePreviews.filter((p) => !p.isExisting);
    if (!isEditMode && newImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh sản phẩm.");
      return;
    }

    setLoading(true);
    try {
      let mediaIds = [];
      if (newImages.length > 0) {
        const uploadRes = await uploadService.uploadImages(newImages.map((p) => p.file));
        if (uploadRes.success) mediaIds = uploadRes.mediaIds || [];
      }

      const productData = {
        title: form.title,
        categoryId: form.categoryId,
        description: form.description,
        productType: form.productType,
        conditionStatus: form.conditionStatus,
        salePrice: form.productType === "sale" ? form.salePrice : 0,
        rentPricePerDay: form.productType === "rent" ? form.rentPricePerDay : 0,
        depositAmount: form.productType === "rent" ? form.depositAmount : 0,
        location: form.location,
        quantity: form.quantity,
        ...(mediaIds.length > 0 ? { mediaIds } : {}),
      };

      if (isEditMode) {
        await productService.updateProduct(id, productData);
      } else {
        await productService.createProduct(productData);
      }

      if (!isEditMode && returnTo) {
        navigate(returnTo);
        return;
      }

      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Có lỗi xảy ra khi đăng tin.");
    } finally {
      setLoading(false);
    }
  };

  const imageCountText = useMemo(() => `${imagePreviews.length}/${MAX_IMAGES}`, [imagePreviews.length]);

  if (initializing) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#dfe5ec] border-t-[#18c94f]" />
        </div>
      </EcoTradeLayout>
    );
  }

  if (success) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-5">
          <div className="w-full max-w-md rounded-2xl border border-[#dfe5ec] bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#18c94f]" />
            <h2 className="text-xl font-bold text-[#20242b]">
              {isEditMode ? "Đã cập nhật bài đăng" : "Đã gửi bài đăng"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#707b8d]">
              {isEditMode
                ? "Bài đăng đã được đưa về trạng thái PENDING để quản trị viên duyệt lại."
                : "Sản phẩm sẽ giữ trạng thái PENDING cho đến khi quản trị viên kiểm duyệt nội dung."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="h-10 rounded-md border border-[#dbe1e8] px-4 text-sm font-semibold text-[#444b57] hover:bg-[#f7f8f9]"
              >
                {isEditMode ? "Chỉnh sửa tiếp" : "Đăng tin khác"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/quan-ly/bai-dang")}
                className="h-10 rounded-md bg-[#18c94f] px-4 text-sm font-semibold text-[#062d15] hover:bg-[#14b947]"
              >
                Xem bài đăng
              </button>
            </div>
          </div>
        </div>
      </EcoTradeLayout>
    );
  }

  return (
    <EcoTradeLayout>
      <div className="mx-auto w-full max-w-[760px] pb-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#7b8492]">
          <Link to="/quan-ly/bai-dang" className="hover:text-[#20242b]">Quản lý</Link>
          <ChevronLeft size={14} />
          <span className="text-[#20242b]">{isEditMode ? "Chỉnh sửa bài đăng" : "Tạo bài đăng sản phẩm"}</span>
        </div>

        <div className="mb-7">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-[#20242b]">
            {isEditMode ? "Chỉnh sửa bài đăng sản phẩm" : "Tạo bài đăng sản phẩm"}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#7b8492]">
            Điền các thông tin chi tiết để sản phẩm của bạn sớm được tiếp cận với khách hàng.
          </p>
        </div>

        {/* Post count reminder for free users */}
        {!isPro && !isEditMode && myPostCount !== null && (
          <div className={`mb-6 rounded-xl border px-4 py-3.5 flex items-start gap-3 ${myPostCount >= FREE_POST_LIMIT ? "border-[#ffc5c5] bg-[#fff7f7]" : "border-[#bfefcf] bg-[#edfff2]"}`}>
            <Info className={`mt-0.5 h-5 w-5 shrink-0 ${myPostCount >= FREE_POST_LIMIT ? "text-[#e74343]" : "text-[#18c94f]"}`} />
            <div>
              <p className={`text-sm font-bold ${myPostCount >= FREE_POST_LIMIT ? "text-[#e74343]" : "text-[#18c94f]"}`}>
                {myPostCount >= FREE_POST_LIMIT
                  ? `Bạn đã đạt giới hạn ${FREE_POST_LIMIT} bài đăng (tài khoản thường)`
                  : `Bạn đã đăng ${myPostCount}/${FREE_POST_LIMIT} bài (tài khoản thường)`}
              </p>
              <p className={`mt-0.5 text-xs font-medium leading-5 ${myPostCount >= FREE_POST_LIMIT ? "text-[#e74343]/80" : "text-[#49cc74]"}`}>
                {myPostCount >= FREE_POST_LIMIT
                  ? "Nâng cấp lên Pro để đăng không giới hạn và nhận nhiều ưu đãi hơn."
                  : `Còn ${FREE_POST_LIMIT - myPostCount} bài có thể đăng. Nâng cấp Pro để đăng không giới hạn.`}
              </p>
              {myPostCount >= FREE_POST_LIMIT && (
                <Link to="/goi-pro" className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#18c94f] px-3 py-1.5 text-xs font-bold text-[#062d15] hover:bg-[#14b947]">
                  <Leaf size={12} /> Nâng cấp Pro
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="rounded-2xl border border-[#dfe5ec] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#20242b]">Thông tin cơ bản</h2>
            <p className="mt-1 text-sm font-medium text-[#8a94a5]">
              Tên sản phẩm và danh mục giúp khách hàng dễ dàng tìm thấy bạn.
            </p>

            <div className="mt-6 space-y-5">
              <div>
                <label className={labelCls}>
                  Tên sản phẩm <span className="text-[#ef5350]">*</span>
                </label>
                <input
                  className={inputCls}
                  maxLength={120}
                  placeholder="Ví dụ: Laptop MacBook Pro M2 2023..."
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  required
                />
                <p className="mt-1.5 text-xs font-medium text-[#8a94a5]">Tối đa 120 ký tự.</p>
              </div>

              <div>
                <label className={labelCls}>
                  Danh mục <span className="text-[#ef5350]">*</span>
                </label>
                <div className="relative">
                  <select
                    className={`${inputCls} appearance-none pr-10`}
                    value={form.categoryId}
                    onChange={(event) => setField("categoryId", event.target.value)}
                    required
                  >
                    <option value="">Chọn danh mục sản phẩm</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f6b7e]" />
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Mô tả sản phẩm <span className="text-[#ef5350]">*</span>
                </label>
                <div className="overflow-hidden rounded-md border border-[#dbe1e8]">
                  <div className="flex h-11 items-center gap-6 border-b border-[#dbe1e8] bg-[#f4f5f7] px-5 text-sm font-bold text-[#3f4652]">
                    <span>B</span>
                    <span className="font-medium italic">I</span>
                    <span className="underline">U</span>
                    <span className="h-5 w-px bg-[#d3d9e1]" />
                    <span className="flex items-center gap-1">
                      <List size={16} />
                      List
                    </span>
                  </div>
                  <textarea
                    className="min-h-[140px] w-full resize-none border-0 bg-white px-4 py-4 text-sm text-[#20242b] outline-none placeholder:text-[#8a94a5]"
                    placeholder="Chia sẻ chi tiết về cấu hình, tình trạng, lý do bán..."
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Khu vực giao dịch</label>
                <input
                  className={inputCls}
                  placeholder="Ví dụ: Khu vực Hòa Lạc"
                  value={form.location}
                  onChange={(event) => setField("location", event.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Images */}
          <section className="rounded-2xl border border-[#dfe5ec] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#20242b]">Hình ảnh sản phẩm</h2>
                <p className="mt-1 text-sm font-medium text-[#8a94a5]">
                  Đăng tối đa 8 hình ảnh. Hình ảnh rõ nét giúp tăng 70% tỉ lệ chốt đơn.
                </p>
              </div>
              <span className="rounded-full bg-[#f3f5f7] px-3 py-1 text-xs font-bold text-[#7b8492]">{imageCountText}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {imagePreviews.map((item, index) => (
                <div key={`${item.src}-${index}`} className="relative h-[136px] w-[136px] overflow-hidden rounded-xl border border-[#dbe1e8] bg-[#f3f5f7] group">
                  <img src={getImageSource(item.src)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/80"
                    title="Xóa ảnh"
                  >
                    <X size={12} />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">Ảnh bìa</span>
                  )}
                </div>
              ))}
              {imagePreviews.length < MAX_IMAGES ? (
                <label className="flex h-[136px] w-[136px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#cfd6df] bg-white text-[#657083] transition hover:border-[#18c94f] hover:bg-[#f7fff9]">
                  <Upload size={28} strokeWidth={1.8} />
                  <span className="mt-2 text-xs font-bold">Thêm ảnh</span>
                  <span className="mt-0.5 text-[10px] text-[#9aa3af]">{imagePreviews.length}/{MAX_IMAGES}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />
                </label>
              ) : null}
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#7b8492]">
              <Info size={14} />
              Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng tối đa 5MB/ảnh. Ảnh đầu tiên sẽ là ảnh bìa.
            </p>
          </section>

          {/* Transaction settings */}
          <section className="rounded-2xl border border-[#dfe5ec] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#20242b]">Thiết lập giao dịch</h2>
            <p className="mt-1 text-sm font-medium text-[#8a94a5]">
              Xác định hình thức đăng bài và mức giá mong muốn.
            </p>

            <div className="mt-6 space-y-6">
              <div>
                <label className={labelCls}>Loại bài đăng</label>
                <div className="inline-flex rounded-md bg-[#f0f2f4] p-1">
                  {[
                    ["sale", "Bán sản phẩm (SALE)"],
                    ["rent", "Cho thuê (RENT)"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField("productType", value)}
                      className={`h-8 min-w-[148px] rounded px-4 text-sm font-bold transition ${
                        form.productType === value ? "bg-white text-[#18c94f] shadow-sm" : "text-[#7b8492] hover:text-[#20242b]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Tình trạng sản phẩm</label>
                  <div className="flex h-11 items-center gap-8">
                    {[
                      ["new", "Mới 100%"],
                      ["good", "Đã sử dụng"],
                    ].map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#444b57]">
                        <input
                          type="radio"
                          name="conditionStatus"
                          value={value}
                          checked={form.conditionStatus === value}
                          onChange={(event) => setField("conditionStatus", event.target.value)}
                          className="h-4 w-4 accent-[#18c94f]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>
                    Số lượng sản phẩm <span className="text-[#ef5350]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={inputCls}
                    value={form.quantity}
                    onChange={(event) => setField("quantity", event.target.value)}
                    required
                  />
                </div>
              </div>

              {form.productType === "sale" ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>
                      Giá sản phẩm (VND) <span className="text-[#ef5350]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      placeholder="₫ 0"
                      value={form.salePrice}
                      onChange={(event) => setField("salePrice", event.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelCls}>
                      Giá thuê/ngày (VND) <span className="text-[#ef5350]">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      placeholder="₫ 0"
                      value={form.rentPricePerDay}
                      onChange={(event) => setField("rentPricePerDay", event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tiền đặt cọc (VND)</label>
                    <input
                      type="number"
                      min="0"
                      className={inputCls}
                      placeholder="₫ 0"
                      value={form.depositAmount}
                      onChange={(event) => setField("depositAmount", event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-md border border-[#bfefcf] bg-[#edfff2] px-4 py-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#18c94f]" />
                  <div>
                    <p className="text-sm font-bold text-[#18c94f]">Thông tin phê duyệt</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#49cc74]">
                      Sản phẩm sau khi gửi sẽ ở trạng thái PENDING chờ Quản trị viên kiểm duyệt nội dung. Quá trình này thường mất từ 2-4 giờ làm việc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="border-t border-[#e3e7ec] pt-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-md border border-[#dbe1e8] bg-white px-5 text-sm font-bold text-[#444b57] hover:bg-[#f7f8f9]"
                >
                  <Eye size={16} />
                  Xem trước
                </button>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2 rounded-md border border-[#18c94f] bg-white px-5 text-sm font-bold text-[#18c94f] hover:bg-[#f0fff4]"
                >
                  <Save size={16} />
                  Lưu nháp
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 min-w-[198px] items-center justify-center gap-2 rounded-md bg-[#13c94a] px-6 text-sm font-bold text-[#062d15] shadow-sm transition hover:bg-[#10b944] disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#062d15]/30 border-t-[#062d15]" />
                ) : (
                  <Send size={16} />
                )}
                {loading ? (isEditMode ? "Đang cập nhật..." : "Đang gửi...") : isEditMode ? "Lưu thay đổi" : "Gửi bài đăng ngay"}
              </button>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-[#8a94a5]">
              <CircleHelp size={14} />
              Cần hỗ trợ? Liên hệ bộ phận hỗ trợ EcoTrade 24/7.
            </p>
          </div>
        </form>
      </div>
    </EcoTradeLayout>
  );
};

export default CreatePost;
