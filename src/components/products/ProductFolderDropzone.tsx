"use client";

import { FolderInput } from "lucide-react";
import { Dropzone } from "@/components/ui/Dropzone";
import type { DragEvent } from "react";

export function ProductFolderDropzone({
  onDrop,
  onFiles,
  compact,
  renamedMode,
}: {
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onFiles: (files: FileList) => void;
  compact?: boolean;
  renamedMode?: boolean;
}) {
  return (
    <Dropzone
      directory
      compact={compact}
      onDrop={onDrop}
      onFiles={onFiles}
      icon={<FolderInput className={compact ? "size-4" : "size-6"} />}
      title={
        renamedMode
          ? "Drop your already-renamed images here"
          : compact
            ? "Add another products folder"
            : "Drop your products folder here"
      }
      description={
        renamedMode ? (
          <>
            Files like <span className="font-mono">red-ring1.png</span> are grouped by name into products. Nothing is
            renamed. Click to choose a folder.
          </>
        ) : compact ? undefined : (
          <>
            Each sub-folder becomes one product, e.g.{" "}
            <span className="font-mono">Products/Red Ring/…</span> → <span className="font-mono">red-ring1.jpg</span>.
            Click to choose a folder.
          </>
        )
      }
    />
  );
}
