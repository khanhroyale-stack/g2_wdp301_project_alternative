import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        sky: "bg-sky-soft text-sky",
        muted: "bg-muted text-muted-foreground",
        danger: "bg-danger-soft text-danger",
        outline: "border border-border bg-white text-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
