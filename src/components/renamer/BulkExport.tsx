"use client";

import { ArrowRight, FolderArchive, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import type { ProductPlan } from "@/lib/image/bulk-rename";
import type { RenameStatus } from "@/hooks/useRenameImages";
import { pluralize } from "@/lib/utils/format-utils";

type Props = {
  plans: ProductPlan[];
  names: Map<string, string>;
  status: RenameStatus;
  progress: number;
  error: string | null;
  canRename: boolean;
  sentCount: number | null;
  onDownload: () => void;
  onSend: () => void;
  onSelect: (id: string) => void;
};

/** Rename every product at once into one ZIP with a folder per product. */
export function BulkExport({ plans, names, status, progress, error, canRename, sentCount, onDownload, onSend, onSelect }: Props) {
  const filled = plans.filter((p) => p.ordered.length > 0);
  const images = filled.reduce((n, p) => n + p.ordered.length, 0);
  const problems = filled.filter((p) => p.error);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border text-sm">
        {filled.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <button type="button" onClick={() => onSelect(p.id)} className="min-w-0 truncate text-left hover:underline">
              <span className="font-mono">{p.handle || "—"}/</span>
              <span className="ml-2 text-muted">{names.get(p.id)}</span>
            </button>
            {p.error ? (
              <span className="shrink-0 text-xs text-danger">{p.error}</span>
            ) : (
              <span className="shrink-0 text-xs text-subtle">
                {pluralize(p.ordered.length, "image")} · {p.preview[0]?.newName}
                {p.preview.length > 1 ? ` … ${p.preview.at(-1)?.newName}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>

      {problems.length > 0 && (
        <Alert tone="warning" title={`Fix ${pluralize(problems.length, "product")} before downloading`}>
          Click a product above to open it and set a valid, unique handle.
        </Alert>
      )}
      {status === "zipping" && <Progress value={progress} label="Building ZIP in your browser…" />}
      {status === "done" && (
        <Alert tone="success" title="ZIP downloaded">
          {pluralize(filled.length, "product folder")} with {pluralize(images, "image")}. Upload them to Shopify admin →
          Content → Files.
        </Alert>
      )}
      {status === "error" && error && <Alert tone="danger" title="Something went wrong">{error}</Alert>}
      {sentCount !== null && (
        <Alert tone="info" title={`Added ${pluralize(sentCount, "product")} to the Product Builder`}>
          <Link href="/products" className="inline-flex items-center gap-1 font-medium underline">
            Open Product Builder <ArrowRight className="size-3" />
          </Link>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onDownload} disabled={!canRename} loading={status === "zipping"}>
          <FolderArchive className="size-4" /> Download all ({pluralize(filled.length, "product")}, {pluralize(images, "image")})
        </Button>
        <Button size="lg" variant="secondary" onClick={onSend} disabled={!canRename}>
          <PackagePlus className="size-4" /> Add all to Product Builder
        </Button>
      </div>
    </div>
  );
}
