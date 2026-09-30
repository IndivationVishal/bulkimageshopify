"use client";

import type { ShopifyCsvRow } from "@/types/shopify";
import { PREVIEW_COLUMNS } from "@/lib/csv/csv-columns";
import { SHOPIFY_CSV_COLUMNS } from "@/lib/csv/csv-columns";
import { cn } from "@/lib/utils/cn";

const MAX_ROWS = 100;

export function CsvPreviewTable({ rows }: { rows: ShopifyCsvRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="max-h-[480px] overflow-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="sticky top-0 bg-surface-2 text-[11px] tracking-wide text-subtle uppercase">
            <tr>
              {PREVIEW_COLUMNS.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, MAX_ROWS).map((row, i) => {
              const firstOfProduct = row.Title !== "";
              return (
                <tr key={i} className={cn("border-t border-border", firstOfProduct && i > 0 && "border-t-2")}>
                  {PREVIEW_COLUMNS.map((c) => (
                    <td
                      key={c}
                      className={cn(
                        "max-w-[260px] truncate px-3 py-2",
                        c === "Handle" || c === "Image Src" ? "font-mono" : "",
                        !row[c] && "text-subtle",
                      )}
                      title={row[c]}
                    >
                      {row[c] || "–"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-subtle">
        Showing {Math.min(rows.length, MAX_ROWS)} of {rows.length} rows and {PREVIEW_COLUMNS.length} of{" "}
        {SHOPIFY_CSV_COLUMNS.length} columns. The downloaded file contains everything.
      </p>
    </div>
  );
}
