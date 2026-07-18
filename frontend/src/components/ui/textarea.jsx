import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
