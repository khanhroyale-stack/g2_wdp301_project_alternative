import { useState } from "react";
import Sidebar from "../../components/Sidebar";

const DEMO_CATS = [
  { id: 1, name: "Điện tử", icon: "laptop", count: 245, active: true },
  { id: 2, name: "Xe cộ", icon: "directions_car", count: 89, active: true },
  { id: 3, name: "Thời trang", icon: "checkroom", count: 156, active: true },
  { id: 4, name: "Nội thất", icon: "chair", count: 67, active: true },
  { id: 5, name: "Sách & Tài liệu", icon: "menu_book", count: 134, active: true },
  { id: 6, name: "Thể thao", icon: "sports_soccer", count: 78, active: false },
];

const QuanLyDanhMuc = () => {
  const [cats, setCats] = useState(DEMO_CATS);
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", icon: "category" });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Quản lý danh mục</h1>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-[18px]">add</span>Thêm danh mục
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cats.map((cat) => (
              <div key={cat.id} className={`bg-surface-container-lowest rounded-2xl shadow-apple border p-5 flex items-center gap-4 transition-all ${cat.active ? "border-surface-variant/30" : "border-surface-variant/30 opacity-60"
                }`}>
                <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0">
                  <span className="material-symbols-outlined text-[22px]">{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface">{cat.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{cat.count} sản phẩm</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold mr-1 ${cat.active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
                    }`}>{cat.active ? "Hiện" : "Ẩn"}</span>
                  <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button onClick={() => setCats((prev) => prev.map((c) => c.id === cat.id ? { ...c, active: !c.active } : c))}
                    className="p-1.5 text-on-surface-variant hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{cat.active ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal thêm danh mục */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-sm">
            <h3 className="font-bold text-on-surface mb-5">Thêm danh mục mới</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Tên danh mục</label>
                <input className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none transition-all"
                  placeholder="VD: Nhạc cụ" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">Icon (Material Symbols)</label>
                <input className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-primary outline-none transition-all"
                  placeholder="VD: music_note" value={newCat.icon} onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">Hủy</button>
              <button className="flex-1 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                onClick={() => {
                  if (newCat.name) {
                    setCats((prev) => [...prev, { id: Date.now(), ...newCat, count: 0, active: true }]);
                    setNewCat({ name: "", icon: "category" });
                    setShowAdd(false);
                  }
                }}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default QuanLyDanhMuc;
