import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export function Tabs(props) {
  return <TabsPrimitive.Root {...props} />;
}

export function TabsList({ className, ...props }) {
  return <TabsPrimitive.List className={cn("inline-flex rounded-2xl bg-muted p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex min-w-[140px] items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-muted-foreground transition data-[state=active]:bg-white data-[state=active]:text-success data-[state=active]:shadow-panel",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn("mt-6", className)} {...props} />;
}
