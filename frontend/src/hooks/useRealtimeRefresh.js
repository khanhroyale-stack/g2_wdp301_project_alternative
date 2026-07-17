import { useEffect } from "react";

export default function useRealtimeRefresh(types, refresh) {
  useEffect(() => {
    if (!refresh) return undefined;

    const allowedTypes = new Set((Array.isArray(types) ? types : [types]).filter(Boolean));
    const handleRealtimeUpdate = (event) => {
      const detail = event.detail || {};
      const type = detail.type || detail.relatedType;

      if (!allowedTypes.size || allowedTypes.has(type) || allowedTypes.has("all")) {
        refresh(detail);
      }
    };

    window.addEventListener("realtime:update", handleRealtimeUpdate);
    return () => window.removeEventListener("realtime:update", handleRealtimeUpdate);
  }, [types, refresh]);
}
