import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import orderService from "../services/order.service";

export default function usePendingSalesCount() {
  const { user } = useAuth();
  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchPendingSales = async () => {
      if (!user || user.role === "admin" || user.role === "shipper") {
        setPendingSalesCount(0);
        return;
      }

      try {
        const res = await orderService.getMySales();
        if (!cancelled && res.success) {
          const count = (res.data || []).filter((order) => order.actions?.canSellerConfirm).length;
          setPendingSalesCount(count);
        }
      } catch {
        if (!cancelled) {
          setPendingSalesCount(0);
        }
      }
    };

    fetchPendingSales();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return pendingSalesCount;
}
