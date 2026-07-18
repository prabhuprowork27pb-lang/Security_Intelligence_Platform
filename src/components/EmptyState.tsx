import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  primaryCta?: { label: string; onClick: () => void };
  secondary?: ReactNode;
  className?: string;
}

/**
 * Shared empty-state panel for the Command Centre and supporting screens.
 * Reassures the user and surfaces the next action — no decorative illustrations.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryCta,
  secondary,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("p-8 md:p-10 text-center border-dashed", className)}>
      {Icon && (
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">
          {eyebrow}
        </p>
      )}
      <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
        {description}
      </p>
      {primaryCta && (
        <Button onClick={primaryCta.onClick} className="min-h-11">
          {primaryCta.label}
        </Button>
      )}
      {secondary && <div className="mt-4">{secondary}</div>}
    </Card>
  );
}

export default EmptyState;
