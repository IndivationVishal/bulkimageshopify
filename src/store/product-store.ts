"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { revokePreview } from "@/lib/utils/file-utils";

type ProductState = {
  products: Product[];
  /** Raw text pasted into the CDN URL box (kept so navigation doesn't lose it). */
  cdnText: string;
  /** The single sample link used to build every image link. */
  cdnBase: string;

  addProducts: (products: Product[]) => void;
  setProducts: (products: Product[]) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setCdnText: (text: string) => void;
  setCdnBase: (text: string) => void;
  clear: () => void;
};

function revokeProduct(p: Product) {
  p.images.forEach((i) => revokePreview(i.previewUrl));
}

/**
 * Product data (titles, prices, handles, image names, CDN links) is saved in
 * this browser so a refresh does not lose it. File objects and thumbnails are
 * NOT saved: drop the renamed images again to re-attach them.
 */
export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
  products: [],
  cdnText: "",
  cdnBase: "",

  addProducts: (incoming) => set((s) => ({ products: [...s.products, ...incoming] })),

  setProducts: (products) => {
    // Revoke previews of images that are no longer referenced.
    const keep = new Set(products.flatMap((p) => p.images.map((i) => i.previewUrl)));
    get().products.forEach((p) =>
      p.images.forEach((i) => {
        if (i.previewUrl && !keep.has(i.previewUrl)) revokePreview(i.previewUrl);
      }),
    );
    set({ products });
  },

  updateProduct: (id, patch) =>
    set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

  removeProduct: (id) =>
    set((s) => {
      const target = s.products.find((p) => p.id === id);
      if (target) revokeProduct(target);
      return { products: s.products.filter((p) => p.id !== id) };
    }),

  setCdnText: (cdnText) => set({ cdnText }),
  setCdnBase: (cdnBase) => set({ cdnBase }),

  clear: () => {
    get().products.forEach(revokeProduct);
    set({ products: [], cdnText: "", cdnBase: "" });
  },
}),
    {
      name: "sbs-products-v1",
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      skipHydration: true, // rehydrated in AppShell to avoid SSR mismatch
      partialize: (s) => ({
        cdnBase: s.cdnBase,
        products: s.products.map((p) => ({
          ...p,
          images: p.images.map((i) => ({ ...i, file: undefined, previewUrl: undefined })),
        })),
      }),
    },
  ),
);
