import { Download, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface OneClickDownloadProps {
  /** Either provide an href to navigate (PDF route) or onDownload to handle async download. */
  href?: string;
  onDownload?: () => Promise<void> | void;
  filename?: string;
  label?: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "secondary" | "outline";
}

/**
 * Premium one-click download CTA. Single tap on mobile, success state,
 * confirmation toast — no extra redirects.
 */
export const OneClickDownload = ({
  href,
  onDownload,
  filename,
  label = "Download report",
  className,
  size = "lg",
  variant = "default",
}: OneClickDownloadProps) => {
  const { toast } = useToast();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const handle = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      if (onDownload) {
        await onDownload();
      } else if (href) {
        // Open in new tab to avoid breaking SPA navigation
        const a = document.createElement("a");
        a.href = href;
        if (filename) a.download = filename;
        a.target = "_blank";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setState("done");
      toast({ title: "Download ready", description: "Your file is on its way." });
      setTimeout(() => setState("idle"), 2200);
    } catch (e: any) {
      setState("idle");
      toast({ title: "Download failed", description: e?.message ?? "Please retry.", variant: "destructive" });
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={handle}
      className={cn("w-full md:w-auto min-h-[44px]", className)}
      disabled={state === "loading"}
    >
      {state === "loading" ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="mr-2 h-4 w-4" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {state === "done" ? "Downloaded" : label}
    </Button>
  );
};

export default OneClickDownload;
