"use client";

import { AlertCircle, Plus, X } from "lucide-react";
import { useRenamerStore } from "@/store/renamer-store";
import type { ProductPlan } from "@/lib/image/bulk-rename";
import { cn } from "@/lib/utils/cn";

/** One chip per product in the renamer, plus "Add product". */
export function ProductTabs({ plans, onRemove }: { plans: ProductPlan[]; onRemove: (id: string) => void }) {
  const products = useRenamerStore((s) => s.products);
  const activeId = useRenamerStore((s) => s.activeId);
  const setActive = useRenamerStore((s) => s.setActive);
  const addProduct = useRenamerStore((s) => s.addProduct);

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Products">
      {products.map((p, i) => {
        const plan = plans.find((x) => x.id === p.id);
        const active = p.id === activeId;
        const label = p.productName.trim() || p.handle || `Product ${i + 1}`;
        return (
          <div
            key={p.id}
            className={cn(
              "group flex max-w-60 items-center rounded-lg border text-sm transition-colors",
              active ? "border-accent bg-accent-soft text-accent" : "border-border bg-surface text-text hover:bg-surface-2",
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActive(p.id)}
              className="flex min-w-0 items-center gap-1.5 py-1.5 pr-1 pl-3"
            >
              {plan?.error && <AlertCircle className="size-3.5 shrink-0 text-danger" aria-label="Needs attention" />}
              <span className="truncate font-medium">{label}</span>
              <span className="shrink-0 text-xs text-subtle tabular-nums">{p.files.length}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="mr-1 rounded p-1 text-subtle hover:bg-danger-soft hover:text-danger"
              aria-label={`Remove ${label}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addProduct}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-soft"
      >
        <Plus className="size-4" /> Add product
      </button>
    </div>
  );
}
