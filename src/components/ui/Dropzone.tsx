"use client";

import { useRef, useState, type ReactNode, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type DropzoneProps = {
  title: string;
  description?: ReactNode;
  accept?: string;
  multiple?: boolean;
  /** Select whole folders instead of files. */
  directory?: boolean;
  /** Receives the raw drop event (needed to read folders). */
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFiles: (files: FileList) => void;
  compact?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

/**
 * Generic drag & drop / click-to-browse area.
 * Files stay in the browser – nothing is uploaded.
 */
export function Dropzone({
  title,
  description,
  accept,
  multiple = true,
  directory,
  onDrop,
  onFiles,
  compact,
  disabled,
  icon,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const dirProps = directory ? ({ webkitdirectory: "", directory: "" } as Record<string, string>) : {};

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (!disabled) onDrop(e);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        compact ? "gap-1 px-4 py-5" : "gap-3 px-6 py-12",
        dragging ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-subtle",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className={cn("rounded-full bg-surface-2 text-accent", compact ? "p-2" : "p-3")}>
        {icon ?? <UploadCloud className={compact ? "size-4" : "size-6"} aria-hidden />}
      </div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        {...dirProps}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = ""; // allow selecting the same files again
        }}
      />
    </div>
  );
}
