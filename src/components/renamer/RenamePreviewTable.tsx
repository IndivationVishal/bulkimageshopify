"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowRight, ChevronDown, ChevronUp, X } from "lucide-react";
import type { RenameFile, RenamePreview } from "@/types/image";
import { useRenamerStore } from "@/store/renamer-store";
import { formatBytes } from "@/lib/utils/format-utils";
import { Thumb } from "./Thumb";

const ROW = 52;

/** Virtualized old → new filename list. */
export function RenamePreviewTable({ files, preview }: { files: RenameFile[]; preview: RenamePreview[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const moveFile = useRenamerStore((s) => s.moveFile);
  const removeFile = useRenamerStore((s) => s.removeFile);
  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW,
    overscan: 10,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[40px_1fr_24px_1fr_88px] items-center gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[11px] font-semibold tracking-wide text-subtle uppercase max-sm:grid-cols-[40px_1fr_64px]">
        <span>#</span>
        <span className="max-sm:hidden">Original</span>
        <span className="max-sm:hidden" />
        <span>New name</span>
        <span />
      </div>
      <div ref={parentRef} className="max-h-[560px] overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((row) => {
            const file = files[row.index];
            const p = preview[row.index];
            return (
              <div
                key={file.id}
                className="absolute inset-x-0 grid grid-cols-[40px_1fr_24px_1fr_88px] items-center gap-3 border-b border-border px-3 text-sm max-sm:grid-cols-[40px_1fr_64px]"
                style={{ top: row.start, height: ROW }}
              >
                <div className="relative">
                  <Thumb src={file.previewUrl} alt="" className="size-9 rounded-md" />
                </div>
                <div className="min-w-0 max-sm:hidden">
                  <p className="truncate text-muted" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-[11px] text-subtle">{formatBytes(file.size)}</p>
                </div>
                <ArrowRight className="size-4 text-subtle max-sm:hidden" aria-hidden />
                <p className="truncate font-mono text-[13px] font-medium" title={p?.newName}>
                  {p?.newName}
                </p>
                <div className="flex justify-end gap-0.5">
                  <button
                    type="button"
                    className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30 max-sm:hidden"
                    disabled={row.index === 0}
                    onClick={() => moveFile(row.index, row.index - 1)}
                    aria-label="Move up"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30 max-sm:hidden"
                    disabled={row.index === files.length - 1}
                    onClick={() => moveFile(row.index, row.index + 1)}
                    aria-label="Move down"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-subtle hover:bg-danger-soft hover:text-danger"
                    onClick={() => removeFile(file.id)}
                    aria-label={`Remove ${file.originalName}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
