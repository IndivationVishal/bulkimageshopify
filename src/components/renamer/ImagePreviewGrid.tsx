"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronLeft, ChevronRight, GripVertical, X } from "lucide-react";
import type { RenameFile, RenamePreview } from "@/types/image";
import { useRenamerStore } from "@/store/renamer-store";
import { cn } from "@/lib/utils/cn";
import { Thumb } from "./Thumb";

const MIN_CARD = 150;
const ROW_HEIGHT = 222;

/**
 * Virtualized thumbnail grid: only visible rows are in the DOM, so
 * thousands of images stay smooth. Drag cards (or use the arrows) to reorder.
 */
export function ImagePreviewGrid({ files, preview }: { files: RenameFile[]; preview: RenamePreview[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const moveFile = useRenamerStore((s) => s.moveFile);
  const removeFile = useRenamerStore((s) => s.removeFile);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setColumns(Math.max(2, Math.floor(entry.contentRect.width / MIN_CARD)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rowCount = Math.ceil(files.length / columns);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="max-h-[640px] overflow-y-auto pr-1">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            className="absolute inset-x-0 grid gap-3"
            style={{ top: row.start, height: ROW_HEIGHT - 12, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {files.slice(row.index * columns, row.index * columns + columns).map((file, col) => {
              const index = row.index * columns + col;
              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => {
                    setDragFrom(index);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(e) => {
                    if (dragFrom === null) return;
                    e.preventDefault();
                    setDragOver(index);
                  }}
                  onDrop={(e) => {
                    if (dragFrom === null) return;
                    e.preventDefault();
                    e.stopPropagation();
                    moveFile(dragFrom, index);
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDragOver(null);
                  }}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-lg border bg-surface transition-shadow",
                    dragOver === index && dragFrom !== index ? "border-accent ring-2 ring-ring" : "border-border",
                    dragFrom === index && "opacity-50",
                  )}
                >
                  <Thumb src={file.previewUrl} alt={file.originalName} className="aspect-square w-full" />
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="absolute top-1.5 right-1.5 rounded-md bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Remove ${file.originalName}`}
                  >
                    <X className="size-3.5" />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2 py-1.5">
                    <p className="truncate font-mono text-xs font-medium text-text" title={preview[index]?.newName}>
                      {preview[index]?.newName}
                    </p>
                    <div className="flex items-center gap-1">
                      <GripVertical className="size-3 shrink-0 text-subtle" aria-hidden />
                      <p className="min-w-0 flex-1 truncate text-[11px] text-subtle" title={file.originalName}>
                        {file.originalName}
                      </p>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveFile(index, index - 1)}
                        className="rounded p-0.5 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"
                        aria-label="Move earlier"
                      >
                        <ChevronLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === files.length - 1}
                        onClick={() => moveFile(index, index + 1)}
                        className="rounded p-0.5 text-subtle hover:bg-surface-2 hover:text-text disabled:opacity-30"
                        aria-label="Move later"
                      >
                        <ChevronRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
