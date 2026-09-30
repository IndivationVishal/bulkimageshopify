"use client";

import { useCallback, useMemo, useState } from "react";
import { useProductStore } from "@/store/product-store";
import { useSettingsStore } from "@/store/settings-store";
import { extractCdnBase, parseCdnUrls } from "@/lib/csv/cdn-parser";
import { applyCdnBase, clearCdnUrls, mapCdnImagesToProducts, type CdnBaseResult } from "@/lib/products/product-mapper";
import { productsToRows, rowsToCsv } from "@/lib/csv/csv-generator";
import { hasErrors, validateProducts } from "@/lib/csv/csv-validator";
import { timestampForFile } from "@/lib/utils/format-utils";
import type { CdnImage } from "@/types/csv";

export function useCsvGenerator() {
  const products = useProductStore((s) => s.products);
  const cdnText = useProductStore((s) => s.cdnText);
  const setCdnText = useProductStore((s) => s.setCdnText);
  const cdnBase = useProductStore((s) => s.cdnBase);
  const setCdnBase = useProductStore((s) => s.setCdnBase);
  const [baseResult, setBaseResult] = useState<Omit<CdnBaseResult, "products"> | null>(null);
  const defaults = useSettingsStore((s) => s.csv);
  const separator = useSettingsStore((s) => s.nameSeparator);
  const [createMissing, setCreateMissing] = useState(true);
  const [lastApply, setLastApply] = useState<{ matched: number; created: number; unmatched: CdnImage[] } | null>(
    null,
  );

  // Live parse of the textarea so the user sees what each URL maps to.
  const parsed = useMemo(
    () => parseCdnUrls(cdnText, { knownHandles: products.map((p) => p.handle), separator }),
    [cdnText, products, separator],
  );

  const knownHandles = useMemo(() => new Set(products.map((p) => p.handle)), [products]);

  /** Attach the parsed URLs to products (creating products if allowed). */
  const applyUrls = useCallback(() => {
    const { products: current, setProducts } = useProductStore.getState();
    const result = mapCdnImagesToProducts(current, parsed.images, defaults, { createMissing });
    setProducts(result.products);
    setLastApply({ matched: result.matched, created: result.created, unmatched: result.unmatched });
    return result;
  }, [parsed.images, defaults, createMissing]);

  /** One sample link -> links for every image in every product. */
  const applyBase = useCallback(
    (overwrite: boolean) => {
      const base = extractCdnBase(cdnBase);
      if (!base) return null;
      const { products: current, setProducts } = useProductStore.getState();
      const { products: next, ...stats } = applyCdnBase(current, base, { overwrite });
      setProducts(next);
      setBaseResult(stats);
      return stats;
    },
    [cdnBase],
  );

  const clearUrls = useCallback(() => {
    const { products: current, setProducts } = useProductStore.getState();
    setProducts(clearCdnUrls(current));
    setCdnText("");
    setLastApply(null);
    setBaseResult(null);
  }, [setCdnText]);

  const rows = useMemo(() => productsToRows(products, defaults), [products, defaults]);
  const issues = useMemo(() => validateProducts(products, defaults.price), [products, defaults.price]);
  const blocked = hasErrors(issues);

  const csvText = useCallback(() => rowsToCsv(rows), [rows]);
  const fileName = `shopify-products_${timestampForFile()}.csv`;

  return {
    products,
    cdnText,
    setCdnText,
    cdnBase,
    setCdnBase,
    applyBase,
    baseResult,
    imageCount: products.reduce((n, p) => n + p.images.length, 0),
    parsed,
    knownHandles,
    createMissing,
    setCreateMissing,
    applyUrls,
    clearUrls,
    lastApply,
    rows,
    issues,
    blocked,
    csvText,
    fileName,
  };
}
