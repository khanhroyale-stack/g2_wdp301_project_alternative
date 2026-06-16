import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import productService from "../../services/product.service";
import uploadService from "../../services/upload.service";
import categoryService from "../../services/category.service";



const CreatePost = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", categoryId: "", conditionStatus: "", productType: "sale",
    salePrice: "", rentPricePerDay: "", depositAmount: "", location: "Khu vực Hòa Lạc",
    description: "",
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getCategories().then(res => {
      if (res.success) setCategories(res.data);
    }).catch(err => console.error("Error fetching categories:", err));
  }, []);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedImageUrls = [];
      if (imageFiles.length > 0) {
        const uploadRes = await uploadService.uploadImages(imageFiles);
        if (uploadRes.success) {
          uploadedImageUrls = uploadRes.urls;
        }
      }

      const productData = {
        ...form,
        images: uploadedImageUrls
      };

      await productService.createProduct(productData);
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Có lỗi xảy ra khi đăng tin.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center bg-surface-container-lowest rounded-2xl p-10 shadow-apple-md border border-surface-variant/30">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-3xl text-on-secondary-container">task_alt</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-3">Đã đăng tin thành công!</h2>
            <p className="text-on-surface-variant text-sm mb-6">Bài đăng đang chờ Admin duyệt. Bạn sẽ nhận thông báo sau khi bài được duyệt.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSuccess(false)}
                className="px-5 py-2.5 border border-surface-variant rounded-full text-sm font-medium hover:bg-surface-container-low transition-all">
                Đăng tin khác
              </button>
              <button onClick={() => navigate("/quan-ly/bai-dang")}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all">
                Xem bài đăng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all";
  const labelCls = "block text-sm font-medium text-on-surface mb-1.5";

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 md:px-10 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Đăng tin mới</h1>
          <p className="text-on-surface-variant text-sm mt-1">Điền đầy đủ thông tin để tăng khả năng bán hàng</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Loại bài đăng */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-semibold text-on-surface mb-4">Loại bài đăng</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{ v: "sale", label: "Bán", icon: "sell" }, { v: "rent", label: "Cho thuê", icon: "handshake" }].map((opt) => (
                <button key={opt.v} type="button" onClick={() => set("productType", opt.v)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${form.productType === opt.v
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-surface-variant text-on-surface-variant hover:border-primary/40"
                    }`}>
                  <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thông tin cơ bản */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col gap-5">
            <h3 className="font-semibold text-on-surface">Thông tin sản phẩm</h3>
            <div>
              <label className={labelCls}>Tên sản phẩm <span className="text-error">*</span></label>
              <input className={inputCls} placeholder="VD: iPhone 14 Pro Max 256GB" value={form.title}
                onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Danh mục <span className="text-error">*</span></label>
                <select className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} required>
                  <option value="">Chọn danh mục</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tình trạng <span className="text-error">*</span></label>
                <select className={inputCls} value={form.conditionStatus} onChange={(e) => set("conditionStatus", e.target.value)} required>
                  <option value="">Chọn tình trạng</option>
                  <option value="new">Mới</option>
                  <option value="like_new">Như mới</option>
                  <option value="good">Đã dùng - Còn tốt</option>
                  <option value="fair">Đã dùng - Có lỗi nhỏ</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Khu vực</label>
              <input className={inputCls} value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Mô tả chi tiết <span className="text-error">*</span></label>
              <textarea className={`${inputCls} min-h-[120px] resize-none`} placeholder="Mô tả tình trạng, phụ kiện đi kèm, lý do bán..."
                value={form.description} onChange={(e) => set("description", e.target.value)} required />
            </div>
          </div>

          {/* Giá */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30 flex flex-col gap-4">
            <h3 className="font-semibold text-on-surface">Thông tin giá</h3>
            {form.productType === "sale" ? (
              <div>
                <label className={labelCls}>Giá bán (VNĐ) <span className="text-error">*</span></label>
                <input type="number" className={inputCls} placeholder="VD: 15000000" value={form.salePrice}
                  onChange={(e) => set("salePrice", e.target.value)} required />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Giá thuê/ngày (VNĐ) <span className="text-error">*</span></label>
                  <input type="number" className={inputCls} placeholder="VD: 200000" value={form.rentPricePerDay}
                    onChange={(e) => set("rentPricePerDay", e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Tiền đặt cọc (VNĐ)</label>
                  <input type="number" className={inputCls} placeholder="VD: 2000000" value={form.depositAmount}
                    onChange={(e) => set("depositAmount", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Ảnh sản phẩm */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple border border-surface-variant/30">
            <h3 className="font-semibold text-on-surface mb-4">
              Ảnh sản phẩm <span className="text-error">*</span>
              <span className="text-xs font-normal text-on-surface-variant ml-2">Tối đa 8 ảnh</span>
            </h3>
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 mb-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-container-low">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-surface-variant hover:border-primary/40 cursor-pointer p-6 transition-all hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2">add_photo_alternate</span>
              <p className="text-sm font-medium text-on-surface">Nhấn để thêm ảnh</p>
              <p className="text-xs text-on-surface-variant mt-1">PNG, JPG — Tối đa 8 ảnh, mỗi ảnh 5MB</p>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 text-base shadow-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Đang đăng tin...
              </span>
            ) : "Đăng tin ngay"}
          </button>
        </form>
      </main>
    </div>
  );
};
export default CreatePost;
