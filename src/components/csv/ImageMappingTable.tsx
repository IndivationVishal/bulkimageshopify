"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CdnImage } from "@/types/csv";
import { Badge } from "@/components/ui/Badge";

const ROW = 40;

/** URL → handle + image number, and whether a product already exists. */
export function ImageMappingTable({ images, knownHandles }: { images: CdnImage[]; knownHandles: Set<string> }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: images.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW,
    overscan: 12,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_1fr_56px_110px] gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[11px] font-semibold tracking-wide text-subtle uppercase max-sm:grid-cols-[1fr_48px_90px]">
        <span className="max-sm:hidden">File</span>
        <span>Handle</span>
        <span>#</span>
        <span>Product</span>
      </div>
      <div ref={parentRef} className="max-h-80 overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((row) => {
            const img = images[row.index];
            const known = knownHandles.has(img.handle);
            return (
              <div
                key={img.url}
                className="absolute inset-x-0 grid grid-cols-[1fr_1fr_56px_110px] items-center gap-3 border-b border-border px-3 text-xs max-sm:grid-cols-[1fr_48px_90px]"
                style={{ top: row.start, height: ROW }}
              >
                <a
                  href={img.url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-muted hover:text-accent max-sm:hidden"
                  title={img.url}
                >
                  {img.fileName}
                </a>
                <span className="truncate font-mono">{img.handle}</span>
                <span className="tabular-nums">{img.position || "–"}</span>
                <span>{known ? <Badge tone="success">Matched</Badge> : <Badge tone="warning">New</Badge>}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
