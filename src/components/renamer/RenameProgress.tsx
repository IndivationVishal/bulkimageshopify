"use client";

import { ArrowRight, Download, PackagePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Alert } from "@/components/ui/Alert";
import type { RenameStatus } from "@/hooks/useRenameImages";
import { pluralize } from "@/lib/utils/format-utils";

type Props = {
  count: number;
  status: RenameStatus;
  progress: number;
  error: string | null;
  canRename: boolean;
  sentHandle: string | null;
  onDownload: () => void;
  onSend: () => void;
};

export function RenameProgress({ count, status, progress, error, canRename, sentHandle, onDownload, onSend }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {status === "zipping" && <Progress value={progress} label="Building ZIP in your browser…" />}
      {status === "done" && (
        <Alert tone="success" title="ZIP downloaded">
          {pluralize(count, "image")} renamed. Upload them to Shopify admin → Content → Files.
        </Alert>
      )}
      {status === "error" && error && <Alert tone="danger" title="Something went wrong">{error}</Alert>}
      {sentHandle && (
        <Alert tone="info" title={`Added "${sentHandle}" to the Product Builder`}>
          <Link href="/products" className="inline-flex items-center gap-1 font-medium underline">
            Open Product Builder <ArrowRight className="size-3" />
          </Link>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={onDownload} disabled={!canRename} loading={status === "zipping"}>
          <Download className="size-4" /> Rename & download ZIP
        </Button>
        <Button size="lg" variant="secondary" onClick={onSend} disabled={!canRename}>
          <PackagePlus className="size-4" /> Add to Product Builder
        </Button>
      </div>
    </div>
  );
}
