"use client";

import { create } from "zustand";
import type { RenameFile, SortMode } from "@/types/image";
import { createRenameFile } from "@/lib/image/image-utils";
import { fileFingerprint, partitionImageFiles, type RejectedFile } from "@/lib/image/image-validation";
import { moveItem, sortByMode } from "@/lib/image/image-sorting";
import { generateHandle, sanitizeHandleInput } from "@/lib/products/handle-generator";
import { revokePreview } from "@/lib/utils/file-utils";

export type AddFilesReport = {
  added: number;
  duplicates: number;
  rejected: RejectedFile[];
  warnings: RejectedFile[];
};

type RenamerState = {
  /** Files in "selection" order (the order added / manually arranged). */
  files: RenameFile[];
  productName: string;
  handle: string;
  /** True once the user edits the handle by hand; stops auto-generation. */
  handleTouched: boolean;
  startNumber: number;
  sortMode: SortMode;

  addFiles: (files: File[]) => AddFilesReport;
  removeFile: (id: string) => void;
  /** Move within the currently displayed order; switches to "selection". */
  moveFile: (fromIndex: number, toIndex: number) => void;
  setProductName: (name: string) => void;
  setHandle: (handle: string) => void;
  setStartNumber: (n: number) => void;
  setSortMode: (mode: SortMode) => void;
  reset: () => void;
};

/** Files ordered for display and renaming. */
export const selectOrderedFiles = (s: Pick<RenamerState, "files" | "sortMode">) =>
  sortByMode(s.files, s.sortMode, (f) => f.originalName);

export const useRenamerStore = create<RenamerState>()((set, get) => ({
  files: [],
  productName: "",
  handle: "",
  handleTouched: false,
  startNumber: 1,
  sortMode: "selection",

  addFiles: (incoming) => {
    const { accepted, rejected, warnings } = partitionImageFiles(incoming);
    const existing = new Set(get().files.map((f) => fileFingerprint(f.file)));
    const fresh: RenameFile[] = [];
    let duplicates = 0;
    for (const file of accepted) {
      const key = fileFingerprint(file);
      if (existing.has(key)) {
        duplicates += 1;
        continue;
      }
      existing.add(key);
      fresh.push(createRenameFile(file));
    }
    if (fresh.length) set((s) => ({ files: [...s.files, ...fresh] }));
    return { added: fresh.length, duplicates, rejected, warnings };
  },

  removeFile: (id) =>
    set((s) => {
      revokePreview(s.files.find((f) => f.id === id)?.previewUrl);
      return { files: s.files.filter((f) => f.id !== id) };
    }),

  moveFile: (from, to) =>
    set((s) => ({ files: moveItem(selectOrderedFiles(s), from, to), sortMode: "selection" })),

  setProductName: (productName) =>
    set((s) => ({
      productName,
      handle: s.handleTouched ? s.handle : productName.trim() ? generateHandle(productName) : "",
    })),

  setHandle: (value) => {
    const handle = sanitizeHandleInput(value);
    // Clearing the field re-enables auto-generation from the name.
    set({ handle, handleTouched: handle.length > 0 });
  },

  setStartNumber: (n) => set({ startNumber: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1 }),

  // Freeze the current order when switching back to manual.
  setSortMode: (mode) =>
    set((s) => (mode === "selection" ? { files: selectOrderedFiles(s), sortMode: mode } : { sortMode: mode })),

  reset: () => {
    get().files.forEach((f) => revokePreview(f.previewUrl));
    set({ files: [], productName: "", handle: "", handleTouched: false, startNumber: 1, sortMode: "selection" });
  },
}));
