"use client";

import Link from "next/link";
import { ArrowRight, Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import type { Product } from "@/types/product";
import { formatBytes, formatNumber } from "@/lib/utils/format-utils";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ProductSummary({
  products,
  zipProgress,
  onDownload,
  onRenumber,
  onClear,
}: {
  products: Product[];
  zipProgress: number | null;
  onDownload: () => void;
  onRenumber: () => void;
  onClear: () => void;
}) {
  const images = products.flatMap((p) => p.images);
  const bytes = images.reduce((n, i) => n + (i.file?.size ?? 0), 0);
  const mapped = images.filter((i) => i.src).length;
  const withFile = images.filter((i) => i.file).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Products" value={formatNumber(products.length)} />
        <Stat label="Images" value={formatNumber(images.length)} />
        <Stat label="Total size" value={formatBytes(bytes)} />
        <Stat label="CDN URLs mapped" value={`${formatNumber(mapped)} / ${formatNumber(images.length)}`} />
      </div>
      {withFile < images.length && (
        <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          {formatNumber(images.length - withFile)} images have no file loaded (normal after a refresh). Your product
          details and links are saved. To see thumbnails or download the ZIP again, turn on “already renamed” above and
          drop the images.
        </p>
      )}
      {zipProgress !== null && <Progress value={zipProgress} label="Building ZIP…" />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onDownload} loading={zipProgress !== null}>
          <Download className="size-4" /> Download renamed images (ZIP)
        </Button>
        <Link
          href="/csv"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2"
        >
          Continue to CSV Generator <ArrowRight className="size-4" />
        </Link>
        <Button variant="ghost" onClick={onRenumber} title="Re-apply naming settings to every product">
          <RefreshCw className="size-4" /> Re-number
        </Button>
        <Button variant="danger" onClick={onClear} className="sm:ml-auto">
          <Trash2 className="size-4" /> Clear all
        </Button>
      </div>
    </div>
  );
}
