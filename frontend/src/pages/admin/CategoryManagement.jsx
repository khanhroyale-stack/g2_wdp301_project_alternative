import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import categoryService from "../../services/category.service";

const CategoryManagement = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await categoryService.adminGetCategories();
      if (res.success) setCats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const resetForm = () => {
    setForm({ name: "", description: "" });
    setEditing(null);
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Vui lòng nhập tên danh mục");
    try {
      if (editing) {
        await categoryService.updateCategory(editing._id, form);
      } else {
        await categoryService.createCategory(form);
      }
      resetForm();
      fetchCats();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  const handleToggle = async (cat) => {
    try {
      if (cat.status === "active") {
        await categoryService.deleteCategory(cat._id);
      } else {
        await categoryService.updateCategory(cat._id, { status: "active" });
      }
      fetchCats();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Quản lý danh mục</h1>
            <button onClick={() => { setShowAdd(true); setEditing(null); setForm({ name: "", description: "" }); }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>Thêm danh mục
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-on-surface-variant">Đang tải...</div>
          ) : cats.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">Chưa có danh mục nào.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cats.map((cat) => (
                <div key={cat._id}
                  className={`bg-surface-container-lowest rounded-2xl shadow-apple border p-5 flex items-center gap-4 transition-all ${cat.status === "active" ? "border-surface-variant/30" : "border-surface-variant/30 opacity-60"}`}>
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">category</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">{cat.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{cat.description || "Không có mô tả"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold mr-1 ${cat.status === "active" ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}>
                      {cat.status === "active" ? "Hiện" : "Ẩn"}
                    </span>
                    <button onClick={() => { setEditing(cat); setForm({ name: cat.name, description: cat.description || "" }); setShowAdd(true); }}
                      className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => handleToggle(cat)}
                      className="p-1.5 text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{cat.status === "active" ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-sm">
            <h3 className="font-bold text-on-surface mb-5">{editing ? "Sửa danh mục" : "Thêm danh mục mới"}</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Tên danh mục</label>
                <input className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none transition-all"
                  placeholder="VD: Điện tử" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Mô tả</label>
                <textarea className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none transition-all resize-none min-h-[80px]"
                  placeholder="Mô tả ngắn về danh mục" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={resetForm}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">Hủy</button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                {editing ? "Cập nhật" : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
