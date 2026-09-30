"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Product } from "@/types/product";
import { Input } from "@/components/ui/Input";
import { ProductRow } from "./ProductRow";

const PAGE = 50;

export function ProductList({
  products,
  onUpdate,
  onRemove,
}: {
  products: Product[];
  onUpdate: (id: string, patch: Partial<Product>) => void;
  onRemove: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.title.toLowerCase().includes(q) || p.handle.includes(q));
  }, [products, query]);

  return (
    <div className="flex flex-col gap-3">
      {products.length > 5 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            placeholder="Search products…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {filtered.slice(0, limit).map((p) => (
          <ProductRow key={p.id} product={p} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </ul>
      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="self-center rounded-lg px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft"
        >
          Show {Math.min(PAGE, filtered.length - limit)} more of {filtered.length - limit} remaining
        </button>
      )}
      {filtered.length === 0 && <p className="py-6 text-center text-sm text-muted">No products match “{query}”.</p>}
    </div>
  );
}
