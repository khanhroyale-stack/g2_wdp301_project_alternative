import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import productService from "../../services/product.service";
import uploadService from "../../services/upload.service";
import categoryService from "../../services/category.service";

const defaultForm = {
  title: "",
  categoryId: "",
  conditionStatus: "",
  productType: "sale",
  salePrice: "",
  rentPricePerDay: "",
  depositAmount: "",
  location: "Khu vuc Hoa Lac",
  description: "",
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

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.success) {
          setCategories(res.data);
        }
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
            conditionStatus: product.conditionStatus || "",
            productType: product.productType || "sale",
            salePrice: product.salePrice || "",
            rentPricePerDay: product.rentPricePerDay || "",
            depositAmount: product.depositAmount || "",
            location: product.location || "",
            description: product.description || "",
          });
          setImagePreviews(product.images || []);
          setImageFiles([]);
        }
      } catch (err) {
        alert(err.response?.data?.message || "Khong the tai bai dang de chinh sua.");
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
    const files = Array.from(event.target.files || []).slice(0, 8);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      let mediaIds = [];
      if (imageFiles.length > 0) {
        const uploadRes = await uploadService.uploadImages(imageFiles);
        if (uploadRes.success) {
          mediaIds = uploadRes.mediaIds || [];
        }
      }

      const productData = {
        ...form,
        ...(mediaIds.length > 0 ? { mediaIds } : {}),
      };

      if (isEditMode) {
        await productService.updateProduct(id, productData);
      } else {
        await productService.createProduct(productData);
      }

      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Co loi xay ra khi dang tin.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all";
  const labelCls = "block text-sm font-medium text-on-surface mb-1.5";

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-surface-container-lowest rounded-2xl p-10 shadow-apple-md border border-surface-variant/30">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-3xl text-on-secondary-container">task_alt</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-3">
              {isEditMode ? "Da cap nhat bai dang!" : "Da dang tin thanh cong!"}
            </h2>
            <p className="text-on-surface-variant text-sm mb-6">
              {isEditMode
                ? "Bai dang da duoc cap nhat va chuyen ve trang thai cho Admin duyet lai."
                : "Bai dang dang cho Admin duyet. Ban se nhan thong bao sau khi bai duoc duyet."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="px-5 py-2.5 border border-surface-variant rounded-full text-sm font-medium hover:bg-surface-container-low transition-all"
              >
                {isEditMode ? "Chinh sua tiep" : "Dang tin khac"}
              </button>
              <button
                onClick={() => navigate("/quan-ly/bai-dang")}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all"
              >
                Xem bai dang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 md:px-10 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">
            {isEditMode ? "Chinh sua bai dang" : "Dang tin moi"}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {isEditMode
              ? "Cap nhat thong tin bai dang. Sau khi luu, bai se quay ve trang thai cho duyet."
              : "Dien day du thong tin de tang kha nang ban hang"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-semibold text-on-surface mb-4">Loai bai dang</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "sale", label: "Ban", icon: "sell" },
                { value: "rent", label: "Cho thue", icon: "handshake" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setField("productType", option.value)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    form.productType === option.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-surface-variant text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col gap-5">
            <h3 className="font-semibold text-on-surface">Thong tin san pham</h3>
            <div>
              <label className={labelCls}>
                Ten san pham <span className="text-error">*</span>
              </label>
              <input
                className={inputCls}
                placeholder="VD: iPhone 14 Pro Max 256GB"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Danh muc <span className="text-error">*</span>
                </label>
                <select
                  className={inputCls}
                  value={form.categoryId}
                  onChange={(event) => setField("categoryId", event.target.value)}
                  required
                >
                  <option value="">Chon danh muc</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>
                  Tinh trang <span className="text-error">*</span>
                </label>
                <select
                  className={inputCls}
                  value={form.conditionStatus}
                  onChange={(event) => setField("conditionStatus", event.target.value)}
                  required
                >
                  <option value="">Chon tinh trang</option>
                  <option value="new">Moi</option>
                  <option value="like_new">Nhu moi</option>
                  <option value="good">Da dung - Con tot</option>
                  <option value="fair">Da dung - Co loi nho</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Khu vuc</label>
              <input
                className={inputCls}
                value={form.location}
                onChange={(event) => setField("location", event.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>
                Mo ta chi tiet <span className="text-error">*</span>
              </label>
              <textarea
                className={`${inputCls} min-h-[120px] resize-none`}
                placeholder="Mo ta tinh trang, phu kien di kem, ly do ban..."
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col gap-4">
            <h3 className="font-semibold text-on-surface">Thong tin gia</h3>
            {form.productType === "sale" ? (
              <div>
                <label className={labelCls}>
                  Gia ban (VND) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="VD: 15000000"
                  value={form.salePrice}
                  onChange={(event) => setField("salePrice", event.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Gia thue/ngay (VND) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="VD: 200000"
                    value={form.rentPricePerDay}
                    onChange={(event) => setField("rentPricePerDay", event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Tien dat coc (VND)</label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="VD: 2000000"
                    value={form.depositAmount}
                    onChange={(event) => setField("depositAmount", event.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-semibold text-on-surface mb-4">
              Anh san pham <span className="text-error">*</span>
              <span className="text-xs font-normal text-on-surface-variant ml-2">Toi da 8 anh</span>
            </h3>
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {imagePreviews.map((src, index) => (
                  <div key={`${src}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-surface-container-low">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-surface-variant hover:border-primary/40 cursor-pointer p-6 transition-all hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">add_photo_alternate</span>
              <p className="text-sm font-medium text-on-surface">
                {isEditMode ? "Nhan de thay anh moi" : "Nhan de them anh"}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">PNG, JPG - toi da 8 anh, moi anh 5MB</p>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 text-base shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                {isEditMode ? "Dang cap nhat..." : "Dang dang tin..."}
              </span>
            ) : isEditMode ? (
              "Luu thay doi"
            ) : (
              "Dang tin ngay"
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CreatePost;
