import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  ClipboardList,
  Eye,
  Grid2X2,
  HelpCircle,
  Info,
  Leaf,
  List,
  LogOut,
  PackageCheck,
  Plus,
  Save,
  Send,
  Settings,
  ShoppingBag,
  Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";
import uploadService from "../../services/upload.service";
import categoryService from "../../services/category.service";

const MAX_IMAGES = 8;

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

function SellerCreateSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || "Người bán";

  const navGroups = [
    {
      title: "Quản lý",
      items: [
        { label: "Bảng điều khiển", icon: Grid2X2, to: "/ho-so" },
        { label: "Đơn hàng của tôi", icon: ShoppingBag, to: "/don-ban" },
        { label: "Lịch sử giao dịch", icon: ClipboardList, to: "/orders/history" },
        { label: "Tạo bài đăng", icon: Plus, to: "/dang-tin" },
      ],
    },
    {
      title: "Cá nhân",
      items: [
        { label: "Cài đặt", icon: Settings, to: "/ho-so" },
        { label: "Trung tâm hỗ trợ", icon: HelpCircle, to: "/thong-bao" },
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-[#e1e5ea] bg-[#fbfbfc] xl:flex">
      <Link to="/marketplaces" className="flex h-[90px] items-center gap-2 border-b border-[#e5e8ed] px-16">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#18c94f] text-white">
          <Leaf size={18} />
        </span>
        <span className="text-[20px] font-bold text-[#18c94f]">EcoTrade</span>
      </Link>

      <nav className="flex-1 px-8 py-5">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-7">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wide text-[#a0a7b4]">{group.title}</p>
            <div className="space-y-2">
              {group.items.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={label}
                  to={to}
                  end={to === "/dang-tin"}
                  className={({ isActive }) =>
                    `flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#16cc4e] text-[#062d15]"
                        : "text-[#7b8492] hover:bg-[#f0f2f4] hover:text-[#1f2933]"
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#e1e5ea] p-5">
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#dfe4ea] bg-white px-3 py-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8edf2] text-sm font-bold text-[#475569]">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#13c85a]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#20242b]">{displayName}</p>
            <p className="truncate text-xs text-[#7b8492]">Người bán Premium</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/marketplaces");
          }}
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#6f7785] hover:bg-[#f0f2f4]"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

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
  const isEditMode = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditMode);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);

  const imageCountText = useMemo(() => `${imagePreviews.length}/${MAX_IMAGES}`, [imagePreviews.length]);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data || []);
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

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
          setImagePreviews(product.images || []);
          setImageFiles([]);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Không thể tải bài đăng để chỉnh sửa.");
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

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_IMAGES);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isEditMode && imageFiles.length === 0) {
      alert("Vui lòng thêm ít nhất một hình ảnh sản phẩm.");
      return;
    }

    setLoading(true);
    try {
      let mediaIds = [];
      if (imageFiles.length > 0) {
        const uploadRes = await uploadService.uploadImages(imageFiles);
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

      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Có lỗi xảy ra khi đăng tin.");
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-white">
        <SellerCreateSidebar />
        <div className="flex min-h-screen items-center justify-center xl:ml-[264px]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#dfe5ec] border-t-[#18c94f]" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <SellerCreateSidebar />
        <main className="flex min-h-screen items-center justify-center px-5 xl:ml-[264px]">
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
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#20242b]">
      <SellerCreateSidebar />
      <div className="xl:ml-[264px]">
        <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-16">
          <div className="mb-9">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#7b8492]">
              <Link to="/quan-ly/bai-dang" className="hover:text-[#20242b]">Quản lý</Link>
              <ChevronLeft size={14} />
              <span className="text-[#20242b]">{isEditMode ? "Chỉnh sửa bài đăng" : "Tạo bài đăng sản phẩm"}</span>
            </div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#20242b]">
              {isEditMode ? "Chỉnh sửa bài đăng sản phẩm" : "Tạo bài đăng sản phẩm"}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#7b8492]">
              Điền các thông tin chi tiết để sản phẩm của bạn sớm được tiếp cận với khách hàng.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="rounded-2xl border border-[#dfe5ec] bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-[#20242b]">Thông tin cơ bản</h2>
              <p className="mt-1 text-sm font-medium text-[#8a94a5]">
                Tên sản phẩm và danh mục giúp khách hàng dễ dàng tìm thấy bạn.
              </p>

              <div className="mt-7 space-y-6">
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
                  <p className="mt-2 text-xs font-medium text-[#8a94a5]">Tối đa 120 ký tự.</p>
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
                      className="min-h-[158px] w-full resize-none border-0 bg-white px-4 py-4 text-sm text-[#20242b] outline-none placeholder:text-[#8a94a5]"
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

            <section className="rounded-2xl border border-[#dfe5ec] bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#20242b]">Hình ảnh sản phẩm</h2>
                  <p className="mt-1 text-sm font-medium text-[#8a94a5]">
                    Đăng tối đa 8 hình ảnh. Hình ảnh rõ nét giúp tăng 70% tỉ lệ chốt đơn.
                  </p>
                </div>
                <span className="rounded-full bg-[#f3f5f7] px-3 py-1 text-xs font-bold text-[#7b8492]">{imageCountText}</span>
              </div>

              <div className="mt-7 flex flex-wrap gap-4">
                {imagePreviews.map((src, index) => (
                  <div key={`${src}-${index}`} className="h-[148px] w-[148px] overflow-hidden rounded-md border border-[#dbe1e8] bg-[#f3f5f7]">
                    <img src={getImageSource(src)} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {imagePreviews.length < MAX_IMAGES ? (
                  <label className="flex h-[148px] w-[148px] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#cfd6df] bg-white text-[#657083] transition hover:border-[#18c94f] hover:bg-[#f7fff9]">
                    <Upload size={30} strokeWidth={1.8} />
                    <span className="mt-2 text-xs font-bold">Tải ảnh lên</span>
                    <input type="file" accept="image/*" multiple required={!isEditMode} className="hidden" onChange={handleImageChange} />
                  </label>
                ) : null}
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#7b8492]">
                <Info size={14} />
                Định dạng hỗ trợ: JPG, PNG, WEBP. Dung lượng tối đa 5MB/ảnh.
              </p>
            </section>

            <section className="rounded-2xl border border-[#dfe5ec] bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-[#20242b]">Thiết lập giao dịch</h2>
              <p className="mt-1 text-sm font-medium text-[#8a94a5]">
                Xác định hình thức đăng bài và mức giá mong muốn.
              </p>

              <div className="mt-7 space-y-7">
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
                        className={`h-8 min-w-[164px] rounded px-4 text-sm font-bold transition ${
                          form.productType === value ? "bg-white text-[#18c94f] shadow-sm" : "text-[#7b8492] hover:text-[#20242b]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
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
                  <div className="grid gap-6 md:grid-cols-2">
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
                  <div className="grid gap-6 md:grid-cols-2">
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
              <p className="mt-8 flex items-center justify-center gap-2 text-xs font-medium text-[#8a94a5]">
                <CircleHelp size={14} />
                Dữ liệu của bạn được tự động lưu vào 10:45 AM
              </p>
            </div>
          </form>
        </main>

        <footer className="border-t border-[#e1e5ea] px-5 py-7 text-xs font-medium text-[#8a94a5]">
          <div className="mx-auto flex max-w-[760px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>© 2024 EcoTrade — Sustainable Trading Platform</span>
            <div className="flex flex-wrap gap-7">
              <span>Chính sách bảo mật</span>
              <span>Điều khoản dịch vụ</span>
              <span>Liên hệ hỗ trợ</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CreatePost;
