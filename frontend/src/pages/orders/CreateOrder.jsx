import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  CircleUser,
  CreditCard,
  Pencil,
  Plus,
  MapPin,
  Phone,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/order.service";
import userService from "../../services/user.service";
import { formatPrice } from "../../lib/utils";

const blankAddress = (index, fallback = {}) => ({
  label: index === 0 ? "Địa chỉ mặc định" : "Địa chỉ 2",
  recipientName: fallback.recipientName || "",
  phone: fallback.phone || "",
  address: fallback.address || "",
  isDefault: index === 0,
});

const normalizeAddressBook = (user, fallback = {}) => {
  const source = Array.isArray(user?.addresses) ? user.addresses : [];
  const cleaned = source
    .map((item, index) => ({
      _id: item?._id || `saved-${index}`,
      label: (item?.label || "").trim() || `Địa chỉ ${index + 1}`,
      recipientName: (item?.recipientName || user?.fullName || fallback.recipientName || "").trim(),
      phone: (item?.phone || user?.phone || fallback.phone || "").trim(),
      address: (item?.address || user?.address || fallback.address || "").trim(),
      isDefault: Boolean(item?.isDefault),
    }))
    .filter((item) => item.recipientName || item.phone || item.address);

  if (!cleaned.length && (user?.address || user?.fullName || user?.phone || fallback.address)) {
    cleaned.push({
      _id: "legacy-default",
      label: "Địa chỉ mặc định",
      recipientName: user?.fullName || fallback.recipientName || "",
      phone: user?.phone || fallback.phone || "",
      address: user?.address || fallback.address || "",
      isDefault: true,
    });
  }

  if (!cleaned.length) {
    cleaned.push(blankAddress(0, fallback));
  }

  let defaultIndex = cleaned.findIndex((item) => item.isDefault);
  if (defaultIndex < 0) defaultIndex = 0;

  return cleaned.map((item, index) => ({
    ...item,
    isDefault: index === defaultIndex,
  }));
};

const createAddressDraft = (fallback, index = 0) => {
  // fallback có thể là null (khi thêm địa chỉ mới) — default {} chỉ chặn undefined,
  // nên phải tự chuẩn hóa null về {} để tránh crash.
  const source = fallback || {};
  return {
    label: source.label || (index === 0 ? "Địa chỉ mặc định" : `Địa chỉ ${index + 1}`),
    recipientName: source.recipientName || "",
    phone: source.phone || "",
    address: source.address || "",
    isDefault: Boolean(source.isDefault) || index === 0,
  };
};

function AddressEditorModal({ open, onClose, initialAddress, addressIndex, onSave, saving }) {
  const [draft, setDraft] = useState(() => createAddressDraft(initialAddress, addressIndex));

  useEffect(() => {
    if (open) {
      setDraft(createAddressDraft(initialAddress, addressIndex));
    }
  }, [addressIndex, initialAddress, open]);

  if (!open) return null;

  const handleSave = () => {
    const cleaned = {
      label: (draft.label || "").trim() || `Địa chỉ ${addressIndex + 1}`,
      recipientName: (draft.recipientName || "").trim(),
      phone: (draft.phone || "").trim(),
      address: (draft.address || "").trim(),
      isDefault: Boolean(draft.isDefault),
    };

    if (!cleaned.recipientName || !cleaned.phone || !cleaned.address) {
      toast.error("Vui lòng nhập đầy đủ tên người nhận, số điện thoại và địa chỉ.");
      return;
    }

    onSave(cleaned);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.18)]">
        <div className="flex items-center justify-between border-b border-[#eef1f4] px-6 py-5">
          <div>
            <div className="text-[1.1rem] font-bold text-[#202124]">
              {initialAddress ? "Sửa địa chỉ nhận hàng" : "Thêm địa chỉ mới"}
            </div>
            <div className="mt-1 text-sm text-[#667085]">Địa chỉ sẽ được lưu trong hồ sơ của bạn để dùng cho các đơn sau.</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3e8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <Input placeholder="Nhãn địa chỉ, ví dụ: Nhà riêng, Công ty" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
          <Input placeholder="Tên người nhận" value={draft.recipientName} onChange={(e) => setDraft({ ...draft, recipientName: e.target.value })} />
          <Input placeholder="Số điện thoại" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <Textarea
            placeholder="Địa chỉ giao hàng"
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            className="min-h-[110px]"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-[#667085]">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
            />
            Đặt làm địa chỉ mặc định
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef1f4] px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu địa chỉ"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CreateOrder() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedQuantity = Math.max(Number(searchParams.get("quantity")) || 1, 1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [preview, setPreview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [addressEditor, setAddressEditor] = useState({ open: false, index: null });
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [form, setForm] = useState({
    recipientName: "",
    buyerPhone: "",
    buyerAddress: "",
    note: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const addressBook = useMemo(() => {
    const source = profile?.user || user || {};
    return normalizeAddressBook(source, preview?.buyer || {});
  }, [preview?.buyer, profile?.user, user]);

  const selectedAddress = addressBook[selectedAddressIndex] || addressBook[0];

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [previewRes, profileRes] = await Promise.all([
          orderService.getCheckoutPreview(productId, requestedQuantity),
          userService.getMyProfile().catch(() => null),
        ]);

        if (!mounted) return;

        if (previewRes.success) {
          setPreview(previewRes.data);
        }

        if (profileRes?.success) {
          setProfile(profileRes);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tải thông tin sản phẩm");
        navigate(`/marketplaces/${productId}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [navigate, productId, requestedQuantity]);

  useEffect(() => {
    if (!addressBook.length) return;
    const defaultIndex = addressBook.findIndex((item) => item.isDefault);
    setSelectedAddressIndex(defaultIndex >= 0 ? defaultIndex : 0);
  }, [addressBook]);

  useEffect(() => {
    if (!selectedAddress) return;
    setForm((prev) => ({
      ...prev,
      recipientName: selectedAddress.recipientName || "",
      buyerPhone: selectedAddress.phone || "",
      buyerAddress: selectedAddress.address || "",
    }));
  }, [selectedAddress]);

  const handleSelectAddress = (index) => {
    setSelectedAddressIndex(index);
    const address = addressBook[index];
    if (!address) return;
    setForm((prev) => ({
      ...prev,
      recipientName: address.recipientName || "",
      buyerPhone: address.phone || "",
      buyerAddress: address.address || "",
    }));
  };

  const persistAddresses = async (nextAddresses, successMessage = "Đã lưu địa chỉ nhận hàng") => {
    setSavingAddress(true);
    try {
      const defaultAddress = nextAddresses.find((item) => item.isDefault) || nextAddresses[0] || null;
      const payload = {
        fullName: profile?.user?.fullName || user?.fullName || defaultAddress?.recipientName || "",
        phone: profile?.user?.phone || user?.phone || defaultAddress?.phone || "",
        address: defaultAddress?.address || "",
        addresses: nextAddresses,
      };
      const res = await userService.updateMyProfile(payload);
      if (res.success) {
        setProfile({ user: res.user });
        setAddressEditor({ open: false, index: null });
        toast.success(successMessage);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể lưu địa chỉ");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSaveAddress = async (address) => {
    const editingIndex = addressEditor.index;
    const source = addressBook.filter((item) => item.recipientName || item.phone || item.address);
    const nextAddresses = editingIndex === null ? [...source, address] : source.map((item, index) => (index === editingIndex ? address : item));
    const defaultIndex = address.isDefault
      ? (editingIndex === null ? nextAddresses.length - 1 : editingIndex)
      : nextAddresses.findIndex((item) => item.isDefault);
    const resolvedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
    const normalized = nextAddresses.map((item, index) => ({
      label: item.label,
      recipientName: item.recipientName,
      phone: item.phone,
      address: item.address,
      isDefault: index === resolvedDefaultIndex,
    }));

    await persistAddresses(normalized, editingIndex === null ? "Đã thêm địa chỉ mới" : "Đã cập nhật địa chỉ");
  };

  const handleDeleteAddress = async (index) => {
    const nextAddresses = addressBook
      .filter((_, itemIndex) => itemIndex !== index)
      .filter((item) => item.recipientName || item.phone || item.address)
      .map(({ label, recipientName, phone, address, isDefault }) => ({ label, recipientName, phone, address, isDefault }));

    const hasDefault = nextAddresses.some((item) => item.isDefault);
    const normalized = nextAddresses.map((item, itemIndex) => ({
      ...item,
      isDefault: hasDefault ? item.isDefault : itemIndex === 0,
    }));

    await persistAddresses(normalized, "Đã xóa địa chỉ");
    setSelectedAddressIndex((prev) => Math.max(0, Math.min(prev, normalized.length - 1)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      toast.error("Vui lòng chọn hoặc nhập đầy đủ địa chỉ nhận hàng");
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({ productId, quantity: requestedQuantity, ...form, paymentMethod });
      if (res.success) {
        // Thanh toán chuyển khoản VNPay → chuyển sang cổng thanh toán
        if (res.paymentMethod === "VNPAY" && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        }
        navigate(`/orders/${res.data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tạo đơn hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">
          Đang tải dữ liệu đơn hàng...
        </div>
      </EcoTradeLayout>
    );
  }

  if (!preview) return null;

  const product = preview.product;
  const shippingFee = formatPrice(preview.shippingFee);
  const subtotal = formatPrice(preview.subtotal);
  const totalAmount = formatPrice(preview.totalAmount);

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold text-[#667085]">
            <span>Giỏ hàng</span>
            <span>›</span>
            <span className="text-[#18c76b]">Xác nhận đơn hàng</span>
            <span>›</span>
            <span>Hoàn tất</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/marketplaces/${productId}`)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#596576] hover:text-[#202124]"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-7">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#eef1f4] bg-[#fbfcfd]">
                <CardTitle className="flex items-center justify-between text-[1.6rem]">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[#18c76b]" />
                    Địa chỉ nhận hàng
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddressEditor({ open: true, index: null })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm địa chỉ mới
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {addressBook.map((address, index) => (
                    <div
                      key={address._id || index}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectAddress(index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleSelectAddress(index);
                      }}
                      className={`rounded-[18px] border p-4 text-left transition-all ${
                        selectedAddressIndex === index
                          ? "border-[#18c76b] bg-[#f0fff5] shadow-[0_0_0_1px_rgba(24,199,107,.08)]"
                          : "border-[#e6eaee] bg-white hover:border-[#cfd6dd]"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-bold text-[#202124]">{address.label}</div>
                        {address.isDefault ? <Badge variant="success">Mặc định</Badge> : null}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#667085]">
                        <CircleUser className="h-4 w-4" />
                        <span className="truncate">{address.recipientName || "Chưa cập nhật"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-[#667085]">
                        <Phone className="h-4 w-4" />
                        <span>{address.phone || "Chưa cập nhật"}</span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#596576]">{address.address || "Chưa cập nhật"}</div>
                      <div className="mt-4 flex gap-2 border-t border-[#eef1f4] pt-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setAddressEditor({ open: true, index });
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-[#dfe3e8] px-3 py-2 text-xs font-bold text-[#596576] hover:bg-[#f7f8f9]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteAddress(index);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-red-100 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[18px] border border-[#eef1f4] bg-white px-5 py-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
                    <div>
                      <div className="text-sm font-bold text-[#202124]">{selectedAddress?.recipientName || preview.buyer?.fullName || "Người nhận"}</div>
                      <div className="mt-1 text-sm text-[#667085]">{selectedAddress?.phone || preview.buyer?.phone || "Chưa cập nhật"}</div>
                    </div>
                    <div className="text-sm leading-6 text-[#667085]">{selectedAddress?.address || preview.buyer?.address || "Chưa cập nhật"}</div>
                    <div className="text-sm font-semibold text-[#18c76b]">Đã chọn</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#eef1f4] bg-[#fbfcfd]">
                <CardTitle className="flex items-center gap-3 text-[1.35rem]">
                  <Store className="h-5 w-5 text-[#18c76b]" />
                  {product.ownerId?.fullName || "Người bán"}
                </CardTitle>
                <div className="text-sm text-[#667085]">
                  Phản hồi {product.ownerId?.reputationScore || 98}% | Giao hàng nhanh
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-0">
                <div className="flex flex-col gap-5 border-b border-[#eef1f4] px-6 py-5 sm:flex-row">
                  <div className="h-28 w-28 overflow-hidden rounded-[18px] bg-[#f1f4f6]">
                    {product.images?.[0] ? <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-[1.2rem] font-bold leading-tight text-[#202124]">{product.title}</h3>
                        <p className="mt-1 text-sm text-[#667085]">
                          {product.categoryId?.name || "Điện tử"} / {product.conditionStatus || "Tình trạng"}
                        </p>
                        <div className="mt-3 text-sm text-[#667085]">Số lượng: x{preview.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[1.35rem] font-extrabold text-[#202124]">{formatPrice(product.salePrice)}</div>
                        <div className="text-xs text-[#667085]">Đơn giá</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-6 py-4 text-sm">
                  <div className="flex items-center gap-2 text-[#667085]">
                    <Truck className="h-4 w-4" />
                    <span>Hình thức vận chuyển: <span className="font-semibold text-[#202124]">Giao hàng nhanh (Nội tỉnh)</span></span>
                  </div>
                  <div className="font-semibold text-[#202124]">Phí vận chuyển: {shippingFee}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <label className="text-[1.1rem] font-semibold">Ghi chú cho người bán (Không bắt buộc)</label>
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi đến..."
                    className="min-h-[126px]"
                  />
                </div>
                <div className="mt-6 rounded-[18px] border border-[#bdeed2] bg-[#f0fff5] px-5 py-4 text-sm leading-6 text-[#202124]">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#18c76b]" />
                    <p>
                      Vui lòng kiểm tra kỹ thông tin sản phẩm và địa chỉ nhận hàng trước khi tiến hành đặt hàng.
                      Đơn hàng sau khi đặt sẽ ở trạng thái <span className="font-bold">Chờ xác nhận</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-7 xl:sticky xl:top-[112px] xl:self-start">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#d9efdf] bg-[#eefcf4]">
                <CardTitle className="flex items-center gap-3 text-[1.5rem]">
                  <CreditCard className="h-5 w-5 text-[#18c76b]" />
                  Tóm tắt thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="space-y-4 text-base">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-on-surface-variant whitespace-nowrap">Tổng tiền hàng</span>
                    <span className="whitespace-nowrap font-medium text-on-surface">{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-on-surface-variant whitespace-nowrap">Phí vận chuyển</span>
                    <span className="whitespace-nowrap font-medium text-on-surface">{shippingFee}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-on-surface-variant whitespace-nowrap">Giảm giá voucher</span>
                    <span className="whitespace-nowrap font-medium text-danger">0 đ</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-surface-variant/30 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-bold text-on-surface">Tổng thanh toán:</div>
                      <div className="text-xs text-on-surface-variant">(Đã bao gồm VAT nếu có)</div>
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-primary">{totalAmount}</div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-dashed border-surface-variant/30 pt-5">
                  <div className="text-sm font-bold text-on-surface">Phương thức thanh toán</div>
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("COD")}
                      className={`flex items-center gap-3 rounded-[18px] border p-4 text-left transition-all ${
                        paymentMethod === "COD"
                          ? "border-[#18c76b] bg-[#f0fff5] shadow-[0_0_0_1px_rgba(24,199,107,.08)]"
                          : "border-[#e6eaee] bg-white hover:border-[#cfd6dd]"
                      }`}
                    >
                      <Truck className={`h-6 w-6 shrink-0 ${paymentMethod === "COD" ? "text-[#18c76b]" : "text-[#98a2b3]"}`} />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#202124]">Thanh toán khi nhận hàng (COD)</div>
                        <div className="text-xs text-[#667085]">Trả tiền mặt cho shipper khi nhận hàng</div>
                      </div>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === "COD" ? "border-[#18c76b]" : "border-[#cfd6dd]"}`}>
                        {paymentMethod === "COD" ? <span className="h-2.5 w-2.5 rounded-full bg-[#18c76b]" /> : null}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("VNPAY")}
                      className={`flex items-center gap-3 rounded-[18px] border p-4 text-left transition-all ${
                        paymentMethod === "VNPAY"
                          ? "border-[#18c76b] bg-[#f0fff5] shadow-[0_0_0_1px_rgba(24,199,107,.08)]"
                          : "border-[#e6eaee] bg-white hover:border-[#cfd6dd]"
                      }`}
                    >
                      <CreditCard className={`h-6 w-6 shrink-0 ${paymentMethod === "VNPAY" ? "text-[#18c76b]" : "text-[#98a2b3]"}`} />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#202124]">Chuyển khoản qua VNPay</div>
                        <div className="text-xs text-[#667085]">Thanh toán online qua cổng VNPay (Sandbox)</div>
                      </div>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${paymentMethod === "VNPAY" ? "border-[#18c76b]" : "border-[#cfd6dd]"}`}>
                        {paymentMethod === "VNPAY" ? <span className="h-2.5 w-2.5 rounded-full bg-[#18c76b]" /> : null}
                      </span>
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-[1rem]" disabled={submitting}>
                  {submitting
                    ? "Đang xử lý..."
                    : paymentMethod === "VNPAY"
                    ? "Thanh toán qua VNPay"
                    : "Đặt hàng ngay"}
                </Button>

                <Button type="button" variant="outline" size="lg" className="w-full text-[1rem]" onClick={() => navigate(`/marketplaces/${productId}`)}>
                  Hủy tạo đơn
                </Button>
              </CardContent>

              <div className="border-t border-surface-variant/30 px-6 py-4 text-center text-xs leading-6 text-on-surface-variant">
                Bằng việc nhấn đặt hàng, bạn đồng ý tuân thủ Điều khoản dịch vụ và Chính sách bảo mật của MarketPlace.
              </div>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-2xl bg-success-soft p-3 text-success">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold text-on-surface">Cần hỗ trợ?</div>
                  <div className="text-sm text-on-surface-variant">Liên hệ ngay với CSKH 24/7</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      <AddressEditorModal
        open={addressEditor.open}
        onClose={() => setAddressEditor({ open: false, index: null })}
        initialAddress={addressEditor.index === null ? null : addressBook[addressEditor.index]}
        addressIndex={addressEditor.index === null ? addressBook.length : addressEditor.index}
        onSave={handleSaveAddress}
        saving={savingAddress}
      />
    </EcoTradeLayout>
  );
}
