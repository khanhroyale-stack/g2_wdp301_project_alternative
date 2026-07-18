import { Crown } from "lucide-react";

export default function ProBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 ${className}`}
    >
      <Crown size={12} />
      Pro
    </span>
  );
}
