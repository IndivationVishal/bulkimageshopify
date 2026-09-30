"use client";

import { useCallback, useState, type DragEvent } from "react";
import { useProductStore } from "@/store/product-store";
import { useSettingsStore } from "@/store/settings-store";
import { filesFromDataTransfer, filesFromInput, type PathedFile } from "@/lib/products/folder-reader";
import { importRenamedImages, parseProductFolders } from "@/lib/products/product-parser";
import { renameProductImages } from "@/lib/products/product-mapper";
import { generateHandle } from "@/lib/products/handle-generator";
import { createZip } from "@/lib/zip/zip-generator";
import { downloadBlob } from "@/lib/utils/file-utils";
import { pluralize, timestampForFile } from "@/lib/utils/format-utils";
import type { Product } from "@/types/product";
import type { Notice } from "./useNotice";

export function useProducts(onReport: (n: Notice) => void, renamedMode = false) {
  const products = useProductStore((s) => s.products);
  const separator = useSettingsStore((s) => s.nameSeparator);
  const startNumber = useSettingsStore((s) => s.startNumber);
  const folderPerProduct = useSettingsStore((s) => s.zipFolderPerProduct);
  const [zipProgress, setZipProgress] = useState<number | null>(null);

  const importFiles = useCallback(
    (items: PathedFile[]) => {
      const { products: current, addProducts } = useProductStore.getState();
      const { csv } = useSettingsStore.getState();

      if (renamedMode) {
        const r = importRenamedImages(items, current, csv, separator);
        useProductStore.getState().setProducts(r.products);
        const notes = r.rejected.slice(0, 3).map((x) => `${x.name}: ${x.reason}`);
        const total = r.attached + r.added;
        onReport({
          tone: total === 0 ? "warning" : notes.length ? "warning" : "success",
          title:
            total === 0
              ? "No usable images found"
              : `${pluralize(total, "image")} matched: ${r.attached} re-attached, ${r.added} added, ${pluralize(r.created, "product")} created`,
          body: notes.length ? `${pluralize(r.rejected.length, "file")} skipped. ${notes.join("; ")}` : undefined,
        });
        return;
      }

      const result = parseProductFolders(items, csv, {
        separator,
        startNumber,
        existingHandles: current.map((p) => p.handle),
      });
      addProducts(result.products);
      const imageCount = result.products.reduce((n, p) => n + p.images.length, 0);
      const notes = [
        ...result.rejected.slice(0, 3).map((r) => `${r.name}: ${r.reason}`),
        ...result.warnings.slice(0, 3).map((r) => `${r.name}: ${r.reason}`),
      ];
      onReport({
        tone: result.products.length === 0 ? "warning" : notes.length ? "warning" : "success",
        title:
          result.products.length === 0
            ? "No images found in that folder"
            : `${pluralize(result.products.length, "product")} with ${pluralize(imageCount, "image")} imported`,
        body: notes.length
          ? `${pluralize(result.rejected.length, "file")} skipped. ${notes.join("; ")}`
          : undefined,
      });
    },
    [separator, startNumber, onReport, renamedMode],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      filesFromDataTransfer(e.dataTransfer)
        .then(importFiles)
        .catch(() => onReport({ tone: "danger", title: "Could not read the dropped folder." }));
    },
    [importFiles, onReport],
  );

  const onFiles = useCallback((list: FileList) => importFiles(filesFromInput(list)), [importFiles]);

  /** Update a product; changing the handle renames its images too. */
  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      const { products: current, setProducts } = useProductStore.getState();
      setProducts(
        current.map((p) => {
          if (p.id !== id) return p;
          const next = { ...p, ...patch };
          return patch.handle !== undefined ? renameProductImages(next, separator, startNumber) : next;
        }),
      );
    },
    [separator, startNumber],
  );

  const setTitle = useCallback(
    (product: Product, title: string, syncHandle: boolean) =>
      updateProduct(product.id, syncHandle ? { title, handle: generateHandle(title) } : { title }),
    [updateProduct],
  );

  /** Re-apply naming settings to all products (e.g. after changing separator). */
  const renumberAll = useCallback(() => {
    const { products: current, setProducts } = useProductStore.getState();
    setProducts(current.map((p) => renameProductImages(p, separator, startNumber)));
  }, [separator, startNumber]);

  const downloadZip = useCallback(async () => {
    const entries = products.flatMap((p) =>
      p.images
        .filter((img) => img.file)
        .map((img) => ({ path: folderPerProduct ? `${p.handle}/${img.fileName}` : img.fileName, file: img.file! })),
    );
    if (!entries.length) {
      onReport({ tone: "warning", title: "No local image files to export." });
      return;
    }
    setZipProgress(0);
    try {
      const blob = await createZip(entries, setZipProgress);
      downloadBlob(blob, `shopify-images_${timestampForFile()}.zip`);
      onReport({
        tone: "success",
        title: `ZIP with ${pluralize(entries.length, "image")} downloaded`,
        body: "Upload these files in Shopify admin → Content → Files, then copy the URLs into the CSV Generator.",
      });
    } catch (e) {
      onReport({ tone: "danger", title: "ZIP failed", body: e instanceof Error ? e.message : undefined });
    } finally {
      setZipProgress(null);
    }
  }, [products, folderPerProduct, onReport]);

  return { products, onDrop, onFiles, updateProduct, setTitle, renumberAll, downloadZip, zipProgress };
}
