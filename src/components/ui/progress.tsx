import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "brand";
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", ...props }, ref) => {
  const v = value || 0;
  const isBrand = variant === "brand";
  // Ensure visible indicator when value > 0 (avoid invisible 1%)
  const renderedValue = isBrand && v > 0 && v < 2 ? 2 : v;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full",
        isBrand ? "pmi-progress-track" : "bg-secondary",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-complete={v >= 100 ? "true" : "false"}
        className={cn(
          "h-full w-full flex-1 transition-all",
          isBrand ? "pmi-progress-indicator" : "bg-primary",
        )}
        style={{ transform: `translateX(-${100 - renderedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
