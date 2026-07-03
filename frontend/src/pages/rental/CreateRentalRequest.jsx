import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";
import rentalService from "../../services/rental.service";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const todayISO = () => new Date().toISOString().split("T")[0];

const calcFee = (days, p) => {
  if (!p || days <= 0) return 0;
  if (p.rentPricePerMonth > 0 && days >= 30)
    return Math.floor(days / 30) * p.rentPricePerMonth + (days % 30) * p.rentPricePerDay;
  if (p.rentPricePerWeek > 0 && days >= 7)
    return Math.floor(days / 7) * p.rentPricePerWeek + (days % 7) * p.rentPricePerDay;
  return days * (p.rentPricePerDay || 0);
};

const isRangeBlocked = (start, end, ranges) => {
  if (!start || !end) return false;
  let cur = new Date(start);
  const endD = new Date(end);
  while (cur <= endD) {
    const ds = cur.toISOString().split("T")[0];
    const blocked = ranges.some(r => {
      const s = new Date(r.start); s.setHours(0, 0, 0, 0);
      const e = new Date(r.end);   e.setHours(23, 59, 59, 999);
      return cur >= s && cur <= e;
    });
    if (blocked) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
};

const isDateBlocked = (ds, ranges) =>
  ranges.some(r => {
    const s = new Date(r.start); s.setHours(0, 0, 0, 0);
    const e = new Date(r.end);   e.setHours(23, 59, 59, 999);
    const d = new Date(ds);
    return d >= s && d <= e;
  });

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const Calendar = ({ bookedRanges, startDate, endDate, onChange }) => {
  const [vm, setVm] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const { y, m } = vm;
  const todayStr = todayISO();
  const DAYS = ["T2","T3","T4","T5","T6","T7","CN"];
  const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                  "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const firstDow = new Date(y, m, 1).getDay(); // 0=Sun
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(`${y}-${String(m+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`);
  }

  const getStyle = (ds) => {
    if (!ds) return "";
    if (ds < todayStr) return "text-gray-300 cursor-not-allowed text-xs";
    if (isDateBlocked(ds, bookedRanges)) return "bg-red-50 text-red-300 line-through cursor-not-allowed text-xs rounded-lg";
    if (ds === startDate) return "bg-green-500 text-white font-bold rounded-l-full text-xs";
    if (ds === endDate) return "bg-green-500 text-white font-bold rounded-r-full text-xs";
    if (startDate && endDate && ds > startDate && ds < endDate) return "bg-green-100 text-green-700 text-xs";
    return "hover:bg-green-50 hover:text-green-700 cursor-pointer text-gray-700 text-xs rounded-lg";
  };

  const handleClick = (ds) => {
    if (!ds || ds < todayStr || isDateBlocked(ds, bookedRanges)) return;
    if (!startDate || (startDate && endDate)) {
      onChange(ds, ""); return;
    }
    if (ds <= startDate) { onChange(ds, ""); return; }
    // Kiểm tra khoảng không có ngày blocked
    let cur = new Date(startDate); cur.setDate(cur.getDate() + 1);
    const endD = new Date(ds);
    while (cur < endD) {
      if (isDateBlocked(cur.toISOString().split("T")[0], bookedRanges)) {
        toast.error("Khoảng này có ngày đã đặt, vui lòng chọn lại");
        return;
      }
      cur.setDate(cur.getDate() + 1);
    }
    onChange(startDate, ds);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setVm(v => { const d = new Date(v.y, v.m-1); return {y:d.getFullYear(),m:d.getMonth()}; })}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-600">‹</button>
        <span className="font-bold text-gray-800 text-sm">{MONTHS[m]} {y}</span>
        <button type="button" onClick={() => setVm(v => { const d = new Date(v.y, v.m+1); return {y:d.getFullYear(),m:d.getMonth()}; })}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-600">›</button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((ds, i) => (
          <button key={i} type="button" onClick={() => ds && handleClick(ds)}
            className={`text-center py-1.5 transition-all ${getStyle(ds)}`}>
            {ds ? parseInt(ds.split("-")[2]) : ""}
          </button>
        ))}
      </div>
      {/* Legend */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block"/>Đã đặt</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>Ngày chọn</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 inline-block"/>Khoảng thuê</span>
      </div>
    </div>
  );
};

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({ label, required, children, error }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all placeholder:text-gray-400";

// ─── Main ─────────────────────────────────────────────────────────────────────
const CreateRentalRequest = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Ngày thuê
  const [startDate, setStartDate] = useState(searchParams.get("start") || "");
  const [endDate, setEndDate] = useState(searchParams.get("end") || "");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:00");

  // Thông tin người thuê
  const [form, setForm] = useState({
    fullName:   "",
    phone:      "",
    cccd:       "",
    address:    "",
    note:       "",
  });

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Prefill từ user
  useEffect(() => {
    if (user) {
      setF("fullName", user.fullName || user.name || "");
      setF("phone",    user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          productService.getProduct(productId),
          rentalService.getAvailability(productId),
        ]);
        if (pRes.success) {
          setProduct(pRes.data);
          // Debug: xem cấu trúc ownerId
          console.log("[CreateRentalRequest] ownerId:", pRes.data.ownerId);
        }
        if (aRes.success) setBookedRanges(aRes.data);
      } catch { toast.error("Không thể tải thông tin sản phẩm"); }
      finally { setLoading(false); }
    };
    load();
  }, [productId]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(`${startDate}T${startTime}`);
    const e = new Date(`${endDate}T${endTime}`);
    return Math.max(0, Math.ceil((e - s) / 86400000));
  }, [startDate, endDate, startTime, endTime]);

  const rentalFee    = useMemo(() => calcFee(totalDays, product), [totalDays, product]);
  const depositAmt   = product?.depositAmount || 0;
  const totalAmount  = rentalFee + depositAmt;
  const rangeBlocked = isRangeBlocked(startDate, endDate, bookedRanges);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())  e.fullName = "Vui lòng nhập họ tên";
    if (!form.phone.trim())     e.phone    = "Vui lòng nhập số điện thoại";
    if (!/^0\d{9}$/.test(form.phone.replace(/\s/g,""))) e.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu 0)";
    if (!form.cccd.trim())      e.cccd     = "Vui lòng nhập số CCCD/CMND";
    if (!/^\d{9,12}$/.test(form.cccd.replace(/\s/g,""))) e.cccd = "CCCD phải 9-12 chữ số";
    if (!form.address.trim())   e.address  = "Vui lòng nhập địa chỉ";
    if (!startDate)             e.dates    = "Vui lòng chọn ngày bắt đầu";
    else if (!endDate)          e.dates    = "Vui lòng chọn ngày kết thúc";
    else if (totalDays <= 0)    e.dates    = "Ngày kết thúc phải sau ngày bắt đầu";
    else if (rangeBlocked)      e.dates    = "Khoảng ngày đã có người đặt";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error("Vui lòng điền đầy đủ thông tin"); return; }
    setSubmitting(true);
    try {
      const res = await rentalService.createRentalRequest({
        productId,
        startDate: `${startDate}T${startTime}:00`,
        endDate:   `${endDate}T${endTime}:00`,
        note: `[CCCD: ${form.cccd}] [SĐT: ${form.phone}] [Địa chỉ: ${form.address}]${form.note ? ` | Ghi chú: ${form.note}` : ""}`,
      });
      if (res.success) {
        toast.success("Đã gửi yêu cầu thuê thành công!");
        navigate("/thue-muon");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi yêu cầu");
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center flex-col gap-3">
        <p className="text-gray-500">Không tìm thấy sản phẩm</p>
        <button onClick={() => navigate(-1)} className="text-green-600 hover:underline text-sm">Quay lại</button>
      </div>
    </div>
  );

  const isOwner = user?._id === (product.ownerId?._id || product.ownerId);
  const imgSrc = product.thumbnailUrl || product.imageUrls?.[0];
  const getImg = (s) => { if (!s) return "https://placehold.co/200?text=No+Image"; if (s.startsWith("http")) return s; return `http://localhost:5000${s}`; };

  // Lấy tên chủ đồ an toàn (ownerId có thể là object hoặc raw ID)
  const ownerName = typeof product.ownerId === "object"
    ? (product.ownerId?.fullName || product.ownerId?.name || "—")
    : "—";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 pt-24 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate(-1)} className="hover:text-gray-800 flex items-center gap-1.5 font-medium">
            ← Quay lại
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-semibold">Đăng ký thuê</span>
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thuê đồ</h1>
        <p className="text-sm text-gray-500 mb-8">Vui lòng điền đầy đủ thông tin. Yêu cầu sẽ được gửi đến chủ đồ để xem xét.</p>

        {isOwner && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700 text-center font-semibold">
            Đây là sản phẩm của bạn, không thể tự thuê.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

            {/* ── CỘT TRÁI ─────────────────────────────────── */}
            <div className="space-y-6">

              {/* Sản phẩm */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                  <img src={getImg(imgSrc)} alt={product.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 text-base line-clamp-2 mb-1">{product.title}</h2>
                  <p className="text-sm text-gray-500 mb-2">{product.categoryId?.name} · {product.location}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.rentPricePerDay  > 0 && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-semibold">{fmt(product.rentPricePerDay)}/ngày</span>}
                    {product.rentPricePerWeek > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-semibold">{fmt(product.rentPricePerWeek)}/tuần</span>}
                    {product.rentPricePerMonth> 0 && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100 font-semibold">{fmt(product.rentPricePerMonth)}/tháng</span>}
                    {depositAmt > 0 && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100 font-semibold">Cọc {fmt(depositAmt)}</span>}
                  </div>
                </div>
              </div>

              {/* Thông tin người thuê */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-gray-800 text-base border-b border-gray-50 pb-3">
                  Thông tin người thuê
                </h3>
                <Field label="Họ và tên" required error={errors.fullName}>
                  <input value={form.fullName} onChange={e => setF("fullName", e.target.value)}
                    placeholder="Nguyễn Văn A" className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Số điện thoại" required error={errors.phone}>
                    <input value={form.phone} onChange={e => setF("phone", e.target.value)}
                      placeholder="0912345678" className={inputCls} />
                  </Field>
                  <Field label="Số CCCD / CMND" required error={errors.cccd}>
                    <input value={form.cccd} onChange={e => setF("cccd", e.target.value)}
                      placeholder="012345678901" className={inputCls} />
                  </Field>
                </div>
                <Field label="Địa chỉ thường trú" required error={errors.address}>
                  <input value={form.address} onChange={e => setF("address", e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" className={inputCls} />
                </Field>
                <Field label="Ghi chú cho chủ đồ" error={errors.note}>
                  <textarea value={form.note} onChange={e => setF("note", e.target.value)} rows={2}
                    placeholder="Mục đích sử dụng, yêu cầu đặc biệt, thời gian có thể gặp mặt..."
                    className={`${inputCls} resize-none`} />
                </Field>
              </div>

              {/* Chọn ngày thuê */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 text-base mb-1">
                  Chọn ngày thuê
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Bấm ngày bắt đầu rồi bấm ngày kết thúc. Ngày đỏ đã có người đặt.
                </p>
                {errors.dates && <p className="text-xs text-red-500 mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{errors.dates}</p>}
                <Calendar
                  bookedRanges={bookedRanges}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                />
                {/* Giờ */}
                {startDate && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Giờ nhận đồ</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                        className={inputCls} />
                    </div>
                    {endDate && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Giờ trả đồ</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                          className={inputCls} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── CỘT PHẢI: Biên bản ────────────────────────── */}
            <div className="lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header biên bản */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4">
                  <h3 className="font-bold text-white text-sm">BIÊN BẢN YÊU CẦU THUÊ</h3>
                  <p className="text-green-100 text-xs mt-0.5">Thông tin sẽ gửi cho chủ đồ xem xét</p>
                </div>

                <div className="p-5 space-y-0 text-sm divide-y divide-gray-50">
                  {[
                    ["Sản phẩm", product.title],
                    ["Chủ đồ", ownerName],
                    ["Người thuê", form.fullName || <span className="text-gray-300 italic">Chưa nhập</span>],
                    ["Số điện thoại", form.phone || <span className="text-gray-300 italic">Chưa nhập</span>],
                    ["CCCD/CMND", form.cccd || <span className="text-gray-300 italic">Chưa nhập</span>],
                    ["Địa chỉ", form.address || <span className="text-gray-300 italic">Chưa nhập</span>],
                    ["Ngày bắt đầu", startDate ? `${fmtDate(startDate)} ${startTime}` : <span className="text-gray-300 italic">Chưa chọn</span>],
                    ["Ngày kết thúc", endDate   ? `${fmtDate(endDate)} ${endTime}`   : <span className="text-gray-300 italic">Chưa chọn</span>],
                    ["Số ngày thuê", totalDays > 0 ? `${totalDays} ngày` : "—"],
                    ["Tiền thuê", totalDays > 0 ? fmt(rentalFee) : "—"],
                    ...(depositAmt > 0 ? [["Tiền cọc", fmt(depositAmt)]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2.5 gap-2">
                      <span className="text-gray-500 flex-shrink-0">{k}</span>
                      <span className="font-semibold text-gray-800 text-right">{v}</span>
                    </div>
                  ))}
                  {/* Tổng */}
                  <div className="flex justify-between pt-3 pb-1">
                    <span className="font-bold text-gray-900">TỔNG CỘNG</span>
                    <span className={`font-black text-lg ${totalDays > 0 ? "text-green-600" : "text-gray-300"}`}>
                      {totalDays > 0 ? fmt(totalAmount) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nút gửi */}
              {!isOwner && (
                <button type="submit" disabled={submitting}
                  className="w-full py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all disabled:opacity-40 shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang gửi...</>
                    : "Gửi yêu cầu thuê"
                  }
                </button>
              )}
              <p className="text-xs text-gray-400 text-center">
                Sau khi gửi, chủ đồ sẽ xem xét và phản hồi trong vòng 24 giờ.
              </p>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateRentalRequest;
