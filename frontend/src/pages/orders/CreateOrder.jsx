import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  CircleUser,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Store,
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
import { formatDateOnly, formatPrice } from "../../lib/utils";

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

  return cleaned.slice(0, 2).map((item, index) => ({
    ...item,
    isDefault: index === defaultIndex,
  }));
};

const emptyAddressDraft = (existing = []) => [
  existing[0] || blankAddress(0),
  existing[1] || blankAddress(1, existing[0] || {}),
];

function AddressEditorModal({ open, onClose, addresses, onSave, saving }) {
  const [draft, setDraft] = useState(() => emptyAddressDraft(addresses));

  useEffect(() => {
    if (open) {
      setDraft(emptyAddressDraft(addresses));
    }
  }, [addresses, open]);

  if (!open) return null;

  const updateAddress = (index, field, value) => {
    setDraft((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = () => {
    const cleaned = draft
      .map((item, index) => ({
        label: (item.label || "").trim() || `Địa chỉ ${index + 1}`,
        recipientName: (item.recipientName || "").trim(),
        phone: (item.phone || "").trim(),
        address: (item.address || "").trim(),
        isDefault: Boolean(item.isDefault),
      }))
      .filter((item) => item.recipientName || item.phone || item.address);

    if (!cleaned.length) {
      toast.error("Vui lòng nhập ít nhất một địa chỉ.");
      return;
    }

    const defaultIndex = cleaned.findIndex((item) => item.isDefault);
    const resolvedDefaultIndex = defaultIndex >= 0 ? defaultIndex : 0;
    const normalized = cleaned.slice(0, 2).map((item, index) => ({
      ...item,
      isDefault: index === resolvedDefaultIndex,
    }));

    onSave(normalized);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.18)]">
        <div className="flex items-center justify-between border-b border-[#eef1f4] px-6 py-5">
          <div>
            <div className="text-[1.1rem] font-bold text-[#202124]">Cập nhật địa chỉ nhận hàng</div>
            <div className="mt-1 text-sm text-[#667085]">Lưu tối đa 2 địa chỉ để chọn nhanh khi đặt đơn.</div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3e8]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {draft.map((item, index) => (
            <div key={index} className="rounded-[20px] border border-[#e6eaee] bg-[#fbfcfd] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#18c76b]">{index === 0 ? "Địa chỉ 1" : "Địa chỉ 2"}</div>
                <label className="flex items-center gap-2 text-sm text-[#667085]">
                  <input
                    type="radio"
                    name="defaultAddress"
                    checked={item.isDefault}
                    onChange={() => setDraft((prev) => prev.map((entry, idx) => ({ ...entry, isDefault: idx === index })))}
                  />
                  Mặc định
                </label>
              </div>

              <div className="space-y-3">
                <Input placeholder="Tên người nhận" value={item.recipientName} onChange={(e) => updateAddress(index, "recipientName", e.target.value)} />
                <Input placeholder="Số điện thoại" value={item.phone} onChange={(e) => updateAddress(index, "phone", e.target.value)} />
                <Textarea
                  placeholder="Địa chỉ giao hàng"
                  value={item.address}
                  onChange={(e) => updateAddress(index, "address", e.target.value)}
                  className="min-h-[110px]"
                />
              </div>
            </div>
          ))}
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
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [form, setForm] = useState({
    recipientName: "",
    buyerPhone: "",
    buyerAddress: "",
    note: "",
  });

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
      recipientName: selectedAddress.recipientName || prev.recipientName,
      buyerPhone: selectedAddress.phone || prev.buyerPhone,
      buyerAddress: selectedAddress.address || prev.buyerAddress,
    }));
  }, [selectedAddress]);

  const handleSelectAddress = (index) => {
    setSelectedAddressIndex(index);
    const address = addressBook[index];
    if (!address) return;
    setForm((prev) => ({
      ...prev,
      recipientName: address.recipientName || prev.recipientName,
      buyerPhone: address.phone || prev.buyerPhone,
      buyerAddress: address.address || prev.buyerAddress,
    }));
  };

  const handleSaveAddresses = async (nextAddresses) => {
    setSavingAddress(true);
    try {
      const payload = {
        fullName: profile?.user?.fullName || user?.fullName || nextAddresses[0].recipientName,
        phone: profile?.user?.phone || user?.phone || nextAddresses[0].phone,
        address: nextAddresses.find((item) => item.isDefault)?.address || nextAddresses[0].address,
        addresses: nextAddresses,
      };
      const res = await userService.updateMyProfile(payload);
      if (res.success) {
        setProfile({ user: res.user });
        setShowAddressEditor(false);
        toast.success("Đã lưu địa chỉ nhận hàng");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể lưu địa chỉ");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.recipientName || !form.buyerPhone || !form.buyerAddress) {
      toast.error("Vui lòng chọn hoặc nhập đầy đủ địa chỉ nhận hàng");
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderService.createOrder({ productId, quantity: requestedQuantity, ...form });
      if (res.success) {
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddressEditor(true)}>
                    Thay đổi địa chỉ
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {addressBook.map((address, index) => (
                    <button
                      key={address._id || index}
                      type="button"
                      onClick={() => handleSelectAddress(index)}
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
                    </button>
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
                <div className="space-y-4 text-[1.05rem]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Tổng tiền hàng</span>
                    <span>{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Phí vận chuyển</span>
                    <span>{shippingFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Giảm giá voucher</span>
                    <span>0 đ</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-[#d9efdf] pt-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[1.05rem] font-bold text-[#202124]">Tổng thanh toán:</div>
                      <div className="text-xs text-[#667085]">(Đã bao gồm VAT nếu có)</div>
                    </div>
                    <div className="text-[2rem] font-extrabold text-[#18c76b]">{totalAmount}</div>
                  </div>
                </div>

                <div className="rounded-[18px] bg-white px-4 py-4">
                  <div className="flex items-start gap-3 text-sm text-[#667085]">
                    <AlertCircle className="mt-0.5 h-4 w-4 text-[#3b82f6]" />
                    <p>Bạn có thể tích lũy điểm EcoTradePoints sau khi đơn hàng được xác nhận thành công.</p>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full text-[1rem]" disabled={submitting}>
                  {submitting ? "Đang xử lý..." : "Đặt hàng ngay"}
                </Button>

                <Button type="button" variant="outline" size="lg" className="w-full text-[1rem]" onClick={() => navigate(`/marketplaces/${productId}`)}>
                  Hủy tạo đơn
                </Button>
              </CardContent>

              <div className="border-t border-[#eef1f4] px-6 py-4 text-center text-xs leading-6 text-[#667085]">
                Bằng việc nhấn đặt hàng, bạn đồng ý tuân thủ Điều khoản dịch vụ và Chính sách bảo mật của MarketPlace.
              </div>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-2xl bg-[#eefcf4] p-3 text-[#18c76b]">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold text-[#202124]">Cần hỗ trợ?</div>
                  <div className="text-sm text-[#667085]">Liên hệ ngay với CSKH 24/7</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>

      <AddressEditorModal
        open={showAddressEditor}
        onClose={() => setShowAddressEditor(false)}
        addresses={addressBook}
        onSave={handleSaveAddresses}
        saving={savingAddress}
      />
    </EcoTradeLayout>
  );
}
