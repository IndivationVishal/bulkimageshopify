"use client";

import { useCallback, useMemo, useState } from "react";
import { useRenamerStore, type RenamerProduct } from "@/store/renamer-store";
import { useSettingsStore } from "@/store/settings-store";
import { useProductStore } from "@/store/product-store";
import { bulkZipEntries, planProducts, type ProductPlan } from "@/lib/image/bulk-rename";
import { createZip } from "@/lib/zip/zip-generator";
import { createId, downloadBlob } from "@/lib/utils/file-utils";
import { timestampForFile } from "@/lib/utils/format-utils";
import { createProduct, renameProductImages } from "@/lib/products/product-mapper";
import { uniqueHandle } from "@/lib/products/handle-generator";
import { canPreview } from "@/lib/image/image-utils";

export type RenameStatus = "idle" | "zipping" | "done" | "error";

/** Which download a status belongs to: a product id, or "all". */
type Job = { target: string; status: RenameStatus; progress: number; error: string | null };

const IDLE: Job = { target: "", status: "idle", progress: 0, error: null };

export function useRenameImages() {
  const products = useRenamerStore((s) => s.products);
  const activeId = useRenamerStore((s) => s.activeId);
  const separator = useSettingsStore((s) => s.nameSeparator);
  const csvDefaults = useSettingsStore((s) => s.csv);
  const [job, setJob] = useState<Job>(IDLE);

  const plans = useMemo(() => planProducts(products, { separator }), [products, separator]);
  const active = plans.find((p) => p.id === activeId) ?? plans[0];
  const activeProduct = products.find((p) => p.id === active.id)!;

  const filled = plans.filter((p) => p.ordered.length > 0);
  const zipping = job.status === "zipping";
  const canRename = active.ordered.length > 0 && !active.error && !zipping;
  const canRenameAll = filled.length > 0 && filled.every((p) => !p.error) && !zipping;

  const runZip = useCallback(async (target: string, build: () => Promise<Blob>, fileName: string) => {
    setJob({ target, status: "zipping", progress: 0, error: null });
    try {
      downloadBlob(await build(), fileName);
      setJob({ target, status: "done", progress: 100, error: null });
    } catch (e) {
      setJob({
        target,
        status: "error",
        progress: 0,
        error: e instanceof Error ? e.message : "Could not create the ZIP file.",
      });
    }
  }, []);

  const onProgress = useCallback((progress: number) => setJob((j) => ({ ...j, progress })), []);

  /** The active product only, flat: red-ring1.jpg, red-ring2.jpg … */
  const downloadZip = useCallback(async () => {
    if (!canRename) return;
    const byId = new Map(active.ordered.map((f) => [f.id, f.file]));
    await runZip(
      active.id,
      () => createZip(active.preview.map((p) => ({ path: p.newName, file: byId.get(p.id)! })), onProgress),
      `${active.handle}-images.zip`,
    );
  }, [canRename, active, runZip, onProgress]);

  /** Every product, one folder each: red-ring/red-ring1.jpg, blue-ring/blue-ring1.jpg … */
  const downloadAllZip = useCallback(async () => {
    if (!canRenameAll) return;
    await runZip("all", () => createZip(bulkZipEntries(filled), onProgress), `products-images_${timestampForFile()}.zip`);
  }, [canRenameAll, filled, runZip, onProgress]);

  /** Hand products over to the Product Builder / CSV Generator. Returns the final handles. */
  const send = useCallback(
    (items: { plan: ProductPlan; source: RenamerProduct }[]) => {
      const { products: existing, addProducts } = useProductStore.getState();
      const taken = new Set(existing.map((p) => p.handle));
      const built = items.map(({ plan, source }) => {
        const finalHandle = uniqueHandle(plan.handle, taken);
        const images = plan.ordered.map((f, i) => ({
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
          { title: source.productName.trim() || finalHandle, handle: finalHandle, images },
          csvDefaults,
        );
        return renameProductImages(product, separator, source.startNumber);
      });
      addProducts(built);
      return built.map((p) => p.handle);
    },
    [csvDefaults, separator],
  );

  const sendToProducts = useCallback(
    () => send([{ plan: active, source: activeProduct }])[0],
    [send, active, activeProduct],
  );

  const sendAllToProducts = useCallback(
    () => send(filled.map((plan) => ({ plan, source: products.find((p) => p.id === plan.id)! }))),
    [send, filled, products],
  );

  const resetStatus = useCallback(() => setJob(IDLE), []);

  /** Status of a given download target (product id or "all"). */
  const jobFor = (target: string) => (job.target === target ? job : IDLE);

  return {
    plans,
    ordered: active.ordered,
    preview: active.preview,
    handleError: active.error,
    canRename,
    canRenameAll,
    activeJob: jobFor(active.id),
    allJob: jobFor("all"),
    downloadZip,
    downloadAllZip,
    sendToProducts,
    sendAllToProducts,
    resetStatus,
  };
}
