"use client";

import { LayoutGrid, List, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useRenamerStore } from "@/store/renamer-store";
import { formatBytes, pluralize } from "@/lib/utils/format-utils";
import { cn } from "@/lib/utils/cn";
import type { SortMode } from "@/types/image";

export type ViewMode = "grid" | "table";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "selection", label: "Manual order" },
  { value: "nameAsc", label: "Name A → Z" },
  { value: "nameDesc", label: "Name Z → A" },
];

export function RenameToolbar({
  view,
  onView,
  onClear,
}: {
  view: ViewMode;
  onView: (v: ViewMode) => void;
  onClear: () => void;
}) {
  const files = useRenamerStore((s) => s.files);
  const sortMode = useRenamerStore((s) => s.sortMode);
  const setSortMode = useRenamerStore((s) => s.setSortMode);
  const total = files.reduce((n, f) => n + f.size, 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        <span className="font-medium text-text">{pluralize(files.length, "image")}</span> · {formatBytes(total)}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select
            aria-label="Sort order"
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          />
        </div>
        <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="View">
          {(["grid", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              aria-pressed={view === v}
              aria-label={v === "grid" ? "Grid view" : "List view"}
              className={cn(
                "rounded-md p-1.5",
                view === v ? "bg-surface-2 text-text" : "text-subtle hover:text-text",
              )}
            >
              {v === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>
          ))}
        </div>
        <Button variant="danger" size="sm" onClick={onClear}>
          <Trash2 className="size-3.5" /> Clear all
        </Button>
      </div>
    </div>
  );
}
