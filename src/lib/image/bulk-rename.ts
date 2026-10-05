import type { RenameFile, RenamePreview, SortMode } from "@/types/image";
import type { ZipEntry } from "@/lib/zip/zip-generator";
import { SHOPIFY_HANDLE_REGEX } from "@/lib/constants/shopify";
import { sortByMode } from "./image-sorting";
import { buildRenamePreview, type NamingOptions } from "./image-naming";

type RenameSource = {
  id: string;
  files: RenameFile[];
  handle: string;
  startNumber: number;
  sortMode: SortMode;
};

export type ProductPlan = {
  id: string;
  handle: string;
  ordered: RenameFile[];
  preview: RenamePreview[];
  error: string | null;
};

export function cleanHandle(handle: string): string {
  return handle.replace(/^-+|-+$/g, "");
}

/** Why a handle can't be used, or null. `taken` = handles of the other products. */
export function handleError(handle: string, taken: ReadonlySet<string> = new Set()): string | null {
  const h = cleanHandle(handle);
  if (!h) return "Enter a product name or handle";
  if (!SHOPIFY_HANDLE_REGEX.test(h)) return "Use lower-case letters, numbers and single hyphens";
  if (taken.has(h)) return "Another product already uses this handle";
  return null;
}

/** Order, name and validate every product. Empty products get no error and are skipped on export. */
export function planProducts(products: RenameSource[], options: NamingOptions = {}): ProductPlan[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    if (!p.files.length) continue;
    const h = cleanHandle(p.handle);
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const duplicated = new Set([...counts].filter(([, n]) => n > 1).map(([h]) => h));

  return products.map((p) => {
    const handle = cleanHandle(p.handle);
    const ordered = sortByMode(p.files, p.sortMode, (f) => f.originalName);
    return {
      id: p.id,
      handle,
      ordered,
      preview: buildRenamePreview(ordered, handle || "product", p.startNumber, options),
      error: p.files.length ? handleError(handle, duplicated) : null,
    };
  });
}

/** ZIP entries with one folder per product: red-ring/red-ring1.jpg */
export function bulkZipEntries(plans: ProductPlan[]): ZipEntry[] {
  return plans.flatMap((plan) => {
    const byId = new Map(plan.ordered.map((f) => [f.id, f.file]));
    return plan.preview.map((p) => ({ path: `${plan.handle}/${p.newName}`, file: byId.get(p.id)! }));
  });
}
