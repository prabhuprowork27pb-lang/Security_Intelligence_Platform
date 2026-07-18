import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileCheck2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface FileUploadProps {
  onChange?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

const ACCEPT_DEFAULT =
  "image/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.txt";

const formatBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Frictionless upload surface: drag/drop on desktop, tap on mobile.
 * Presentation-only — caller decides what to do with the File objects.
 */
export const FileUpload = ({
  onChange,
  accept = ACCEPT_DEFAULT,
  multiple = true,
  label = "Upload supporting evidence",
  hint = "Images, PDFs, spreadsheets, documents — your choice",
  className,
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setUploading(true);
      const next: UploadedFile[] = Array.from(incoming).map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        file: f,
      }));
      // Brief progress affordance
      setTimeout(() => {
        const merged = multiple ? [...files, ...next] : next;
        setFiles(merged);
        onChange?.(merged);
        setUploading(false);
      }, 350);
    },
    [files, multiple, onChange],
  );

  const removeFile = (id: string) => {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    onChange?.(next);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "w-full rounded-xl border-2 border-dashed border-border/60 bg-muted/20 px-5 py-8 md:py-10 text-center transition-all min-h-[140px] flex flex-col items-center justify-center gap-2 hover:border-secondary/50 hover:bg-muted/30",
          dragOver && "border-secondary bg-secondary/5",
        )}
        aria-label={label}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 text-secondary animate-spin" />
        ) : (
          <UploadCloud className="h-6 w-6 text-secondary" />
        )}
        <div className="font-heading font-semibold text-sm text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">
          <span className="hidden md:inline">Drag & drop or </span>
          <span className="md:hidden">Tap to </span>
          <span className="text-secondary underline-offset-2 hover:underline">browse</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-1">
          {hint}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card px-3 py-2"
            >
              <FileCheck2 className="h-4 w-4 text-accent shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate text-foreground">{f.name}</div>
                <div className="text-[10px] text-muted-foreground">{formatBytes(f.size)} · uploaded</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeFile(f.id)}
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUpload;
