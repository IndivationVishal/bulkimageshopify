"use client";

import { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectOrderedFiles, useRenamerStore } from "@/store/renamer-store";
import { useSettingsStore } from "@/store/settings-store";
import { useProductStore } from "@/store/product-store";
import { buildRenamePreview } from "@/lib/image/image-naming";
import { createZip } from "@/lib/zip/zip-generator";
import { createId, downloadBlob } from "@/lib/utils/file-utils";
import { SHOPIFY_HANDLE_REGEX } from "@/lib/constants/shopify";
import { createProduct, renameProductImages } from "@/lib/products/product-mapper";
import { uniqueHandle } from "@/lib/products/handle-generator";
import { canPreview } from "@/lib/image/image-utils";

export type RenameStatus = "idle" | "zipping" | "done" | "error";

export function useRenameImages() {
  const { files, sortMode, handle, startNumber, productName } = useRenamerStore(
    useShallow((s) => ({
      files: s.files,
      sortMode: s.sortMode,
      handle: s.handle,
      startNumber: s.startNumber,
      productName: s.productName,
    })),
  );
  const separator = useSettingsStore((s) => s.nameSeparator);
  const csvDefaults = useSettingsStore((s) => s.csv);

  const [status, setStatus] = useState<RenameStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ordered = useMemo(() => selectOrderedFiles({ files, sortMode }), [files, sortMode]);
  const cleanHandle = handle.replace(/^-+|-+$/g, "");
  const handleError = !cleanHandle
    ? "Enter a product name or handle"
    : !SHOPIFY_HANDLE_REGEX.test(cleanHandle)
      ? "Use lower-case letters, numbers and single hyphens"
      : null;

  const preview = useMemo(
    () => buildRenamePreview(ordered, cleanHandle || "product", startNumber, { separator }),
    [ordered, cleanHandle, startNumber, separator],
  );

  const canRename = ordered.length > 0 && !handleError && status !== "zipping";

  const downloadZip = useCallback(async () => {
    if (!canRename) return;
    setStatus("zipping");
    setProgress(0);
    setError(null);
    try {
      const byId = new Map(ordered.map((f) => [f.id, f.file]));
      const blob = await createZip(
        preview.map((p) => ({ path: p.newName, file: byId.get(p.id)! })),
        setProgress,
      );
      downloadBlob(blob, `${cleanHandle}-images.zip`);
      setProgress(100);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the ZIP file.");
      setStatus("error");
    }
  }, [canRename, ordered, preview, cleanHandle]);

  /** Hand the current set over to the Product Builder / CSV Generator. */
  const sendToProducts = useCallback(() => {
    const { products, addProducts } = useProductStore.getState();
    const finalHandle = uniqueHandle(cleanHandle, new Set(products.map((p) => p.handle)));
    const images = ordered.map((f, i) => ({
      id: createId("pimg"),
      file: f.file,
      originalName: f.originalName,
      extension: f.extension,
      fileName: "",
      position: i + 1,
      // New object URL: the renamer revokes its own when cleared.
      previewUrl: canPreview(f.file) ? URL.createObjectURL(f.file) : undefined,
    }));
    const product = createProduct(
      { title: productName.trim() || finalHandle, handle: finalHandle, images },
      csvDefaults,
    );
    addProducts([renameProductImages(product, separator, startNumber)]);
    return finalHandle;
  }, [cleanHandle, ordered, productName, csvDefaults, separator, startNumber]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { ordered, preview, handleError, canRename, status, progress, error, downloadZip, sendToProducts, resetStatus };
}
