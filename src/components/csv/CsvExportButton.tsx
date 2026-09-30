"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { ValidationIssue } from "@/types/csv";
import { downloadBlob } from "@/lib/utils/file-utils";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format-utils";

type Props = {
  issues: ValidationIssue[];
  blocked: boolean;
  rowCount: number;
  getCsv: () => string;
  fileName: string;
};

export function CsvExportButton({ issues, blocked, rowCount, getCsv, fileName }: Props) {
  const [copied, setCopied] = useState(false);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const download = () => {
    downloadBlob(new Blob([getCsv()], { type: "text/csv;charset=utf-8" }), fileName);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getCsv());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {errors.length === 0 && warnings.length === 0 ? (
          <Badge tone="success">
            <Check className="size-3" /> Ready for Shopify
          </Badge>
        ) : (
          <>
            {errors.length > 0 && <Badge tone="danger">{pluralize(errors.length, "error")}</Badge>}
            {warnings.length > 0 && <Badge tone="warning">{pluralize(warnings.length, "warning")}</Badge>}
          </>
        )}
      </div>

      {issues.length > 0 && (
        <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border text-xs">
          {[...errors, ...warnings].slice(0, 200).map((issue, i) => (
            <li key={i} className="flex gap-2 px-3 py-2">
              <span
                className={cn(
                  "mt-1 size-1.5 shrink-0 rounded-full",
                  issue.severity === "error" ? "bg-danger" : "bg-warning",
                )}
              />
              <span>
                {issue.handle && <span className="mr-1 font-mono font-medium">{issue.handle}:</span>}
                <span className="text-muted">{issue.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="lg" onClick={download} disabled={blocked || rowCount === 0}>
          <Download className="size-4" /> Download CSV
        </Button>
        <Button size="lg" variant="secondary" onClick={copy} disabled={blocked || rowCount === 0}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "Copied" : "Copy CSV"}
        </Button>
      </div>
      {blocked && <p className="text-xs text-danger">Fix the errors above to enable export.</p>}
      <p className="text-xs text-subtle">
        Import in Shopify admin → Products → Import. Tick “Overwrite products with matching handles” only if you want to
        update existing products.
      </p>
    </div>
  );
}
