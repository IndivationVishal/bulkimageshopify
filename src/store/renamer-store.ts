"use client";

import { create } from "zustand";
import type { RenameFile, SortMode } from "@/types/image";
import { createRenameFile } from "@/lib/image/image-utils";
import { fileFingerprint, partitionImageFiles, type RejectedFile } from "@/lib/image/image-validation";
import { moveItem, sortByMode } from "@/lib/image/image-sorting";
import { generateHandle, sanitizeHandleInput } from "@/lib/products/handle-generator";
import { createId, revokePreview } from "@/lib/utils/file-utils";

export type AddFilesReport = {
  added: number;
  duplicates: number;
  rejected: RejectedFile[];
  warnings: RejectedFile[];
};

/** One product being renamed: its own images, name, handle and numbering. */
export type RenamerProduct = {
  id: string;
  /** Files in "selection" order (the order added / manually arranged). */
  files: RenameFile[];
  productName: string;
  handle: string;
  /** True once the user edits the handle by hand; stops auto-generation. */
  handleTouched: boolean;
  startNumber: number;
  sortMode: SortMode;
};

/** Images from one dropped sub-folder, to become one product. */
export type FolderGroup = { name: string; files: File[] };

type RenamerState = {
  products: RenamerProduct[];
  activeId: string;

  /** Add an empty product and switch to it. */
  addProduct: () => void;
  /** One product per folder. An untouched empty active product is reused for the first. */
  addProductsFromFolders: (groups: FolderGroup[]) => AddFilesReport & { products: number };
  removeProduct: (id: string) => void;
  setActive: (id: string) => void;

  // The actions below work on the active product.
  addFiles: (files: File[]) => AddFilesReport;
  removeFile: (id: string) => void;
  /** Move within the currently displayed order; switches to "selection". */
  moveFile: (fromIndex: number, toIndex: number) => void;
  setProductName: (name: string) => void;
  setHandle: (handle: string) => void;
  setStartNumber: (n: number) => void;
  setSortMode: (mode: SortMode) => void;
  /** Remove the active product's images and details. */
  clearProduct: () => void;

  /** Remove every product. */
  reset: () => void;
};

function emptyProduct(): RenamerProduct {
  return {
    id: createId("rprod"),
    files: [],
    productName: "",
    handle: "",
    handleTouched: false,
    startNumber: 1,
    sortMode: "selection",
  };
}

function isBlank(p: RenamerProduct): boolean {
  return p.files.length === 0 && !p.productName && !p.handle;
}

/** Files ordered for display and renaming. */
export const selectOrderedFiles = (s: Pick<RenamerProduct, "files" | "sortMode">) =>
  sortByMode(s.files, s.sortMode, (f) => f.originalName);

export const selectActive = (s: Pick<RenamerState, "products" | "activeId">): RenamerProduct =>
  s.products.find((p) => p.id === s.activeId) ?? s.products[0];

/** Filter out invalid files and ones already in `existing`; wrap the rest. */
function prepareFiles(incoming: File[], existing: RenameFile[]): { fresh: RenameFile[]; report: AddFilesReport } {
  const { accepted, rejected, warnings } = partitionImageFiles(incoming);
  const seen = new Set(existing.map((f) => fileFingerprint(f.file)));
  const fresh: RenameFile[] = [];
  let duplicates = 0;
  for (const file of accepted) {
    const key = fileFingerprint(file);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    fresh.push(createRenameFile(file));
  }
  return { fresh, report: { added: fresh.length, duplicates, rejected, warnings } };
}

const initial = emptyProduct();

export const useRenamerStore = create<RenamerState>()((set, get) => {
  /** Apply a patch (or patch function) to the active product. */
  const patchActive = (patch: Partial<RenamerProduct> | ((p: RenamerProduct) => Partial<RenamerProduct>)) =>
    set((s) => {
      const active = selectActive(s);
      return {
        products: s.products.map((p) =>
          p.id === active.id ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p,
        ),
      };
    });

  return {
    products: [initial],
    activeId: initial.id,

    addProduct: () => {
      const p = emptyProduct();
      set((s) => ({ products: [...s.products, p], activeId: p.id }));
    },

    addProductsFromFolders: (groups) => {
      const total: AddFilesReport & { products: number } = {
        added: 0,
        duplicates: 0,
        rejected: [],
        warnings: [],
        products: 0,
      };
      const created: RenamerProduct[] = [];
      for (const group of groups) {
        const { fresh, report } = prepareFiles(group.files, []);
        total.added += report.added;
        total.duplicates += report.duplicates;
        total.rejected.push(...report.rejected);
        total.warnings.push(...report.warnings);
        if (!fresh.length) continue;
        const name = group.name.trim();
        created.push({ ...emptyProduct(), files: fresh, productName: name, handle: generateHandle(name) });
      }
      total.products = created.length;
      if (!created.length) return total;

      set((s) => {
        const active = selectActive(s);
        const products = isBlank(active)
          ? s.products.flatMap((p) => (p.id === active.id ? created : [p]))
          : [...s.products, ...created];
        return { products, activeId: created[0].id };
      });
      return total;
    },

    removeProduct: (id) =>
      set((s) => {
        const target = s.products.find((p) => p.id === id);
        target?.files.forEach((f) => revokePreview(f.previewUrl));
        const rest = s.products.filter((p) => p.id !== id);
        if (!rest.length) {
          const fresh = emptyProduct();
          return { products: [fresh], activeId: fresh.id };
        }
        if (s.activeId !== id) return { products: rest };
        const idx = s.products.findIndex((p) => p.id === id);
        return { products: rest, activeId: rest[Math.min(idx, rest.length - 1)].id };
      }),

    setActive: (activeId) => set({ activeId }),

    addFiles: (incoming) => {
      const { fresh, report } = prepareFiles(incoming, selectActive(get()).files);
      if (fresh.length) patchActive((p) => ({ files: [...p.files, ...fresh] }));
      return report;
    },

    removeFile: (id) =>
      patchActive((p) => {
        revokePreview(p.files.find((f) => f.id === id)?.previewUrl);
        return { files: p.files.filter((f) => f.id !== id) };
      }),

    moveFile: (from, to) =>
      patchActive((p) => ({ files: moveItem(selectOrderedFiles(p), from, to), sortMode: "selection" })),

    setProductName: (productName) =>
      patchActive((p) => ({
        productName,
        handle: p.handleTouched ? p.handle : productName.trim() ? generateHandle(productName) : "",
      })),

    setHandle: (value) => {
      const handle = sanitizeHandleInput(value);
      // Clearing the field re-enables auto-generation from the name.
      patchActive({ handle, handleTouched: handle.length > 0 });
    },

    setStartNumber: (n) => patchActive({ startNumber: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1 }),

    // Freeze the current order when switching back to manual.
    setSortMode: (mode) =>
      patchActive((p) => (mode === "selection" ? { files: selectOrderedFiles(p), sortMode: mode } : { sortMode: mode })),

    clearProduct: () =>
      patchActive((p) => {
        p.files.forEach((f) => revokePreview(f.previewUrl));
        return { files: [], productName: "", handle: "", handleTouched: false, startNumber: 1, sortMode: "selection" };
      }),

    reset: () => {
      get().products.forEach((p) => p.files.forEach((f) => revokePreview(f.previewUrl)));
      const fresh = emptyProduct();
      set({ products: [fresh], activeId: fresh.id });
    },
  };
});
