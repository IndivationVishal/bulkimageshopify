import Papa from "papaparse";
import { generateHandle } from "@/lib/products/handle-generator";
import { isImageFileName, isJunkFile, naturalCompare, stripExtension } from "@/lib/utils/file-utils";
import { splitHandleAndNumber } from "./cdn-parser";

/** A product found in a Shopify product export. */
export type ExistingProduct = {
  handle: string;
  title: string;
  /** Rows that already had an Image Src in the export. */
  existingImages: number;
};

/** The export exactly as read, so it can be written back unchanged. */
export type ExportTable = { fields: string[]; rows: Record<string, string>[] };

export type ExistingCsvResult = { products: ExistingProduct[]; table: ExportTable; error: string | null };

/**
 * Read a Shopify product export (Products → Export). One product can span
 * many rows (variants, extra images); only the first row has the Title.
 */
export function parseShopifyExport(text: string): ExistingCsvResult {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const fields = parsed.meta.fields ?? [];
  if (!fields.includes("Handle")) {
    return { products: [], table: { fields, rows: [] }, error: "Is CSV me “Handle” column nahi hai. Shopify → Products → Export wali CSV daalo." };
  }

  const byHandle = new Map<string, ExistingProduct>();
  for (const row of parsed.data) {
    const handle = row.Handle?.trim().toLowerCase();
    if (!handle) continue;
    const product = byHandle.get(handle) ?? { handle, title: "", existingImages: 0 };
    if (!product.title && row.Title?.trim()) product.title = row.Title.trim();
    if (row["Image Src"]?.trim()) product.existingImages += 1;
    byHandle.set(handle, product);
  }
  const products = [...byHandle.values()];
  return {
    products,
    table: { fields, rows: parsed.data },
    error: products.length ? null : "CSV me koi product nahi mila.",
  };
}

export type MatchedImage = { fileName: string; number: number; matchedBy: "handle" | "title" };

export type ProductMatch = ExistingProduct & { images: MatchedImage[] };

export type UnmatchedImage = { fileName: string; reason: string };

export type MatchResult = {
  products: ProductMatch[];
  unmatched: UnmatchedImage[];
};

/**
 * Attach image file names (pink1.jpg, pink2.jpg …) to existing products.
 * The file name's handle is matched against the export's handles first,
 * then against a handle generated from each product's title.
 */
export function matchImagesToProducts(
  products: ExistingProduct[],
  fileNames: string[],
  separator = "",
): MatchResult {
  const handles = products.map((p) => p.handle);
  const byHandle = new Map<string, ProductMatch>(products.map((p) => [p.handle, { ...p, images: [] }]));
  const byTitle = new Map<string, string>();
  for (const p of products) {
    const slug = p.title ? generateHandle(p.title) : "";
    if (slug && !byHandle.has(slug) && !byTitle.has(slug)) byTitle.set(slug, p.handle);
  }

  const unmatched: UnmatchedImage[] = [];
  const unique = [...new Set(fileNames)].sort(naturalCompare);
  for (const fileName of unique) {
    const { handle, position } = splitHandleAndNumber(stripExtension(fileName), handles, separator);
    if (position === 0) {
      unmatched.push({ fileName, reason: "Naam me image number nahi hai (jaise pink1.jpg)" });
      continue;
    }
    const viaTitle = byHandle.has(handle) ? undefined : byTitle.get(handle);
    const product = byHandle.get(viaTitle ?? handle);
    if (!product) {
      unmatched.push({ fileName, reason: `CSV me “${handle}” handle wala product nahi hai` });
      continue;
    }
    const clash = product.images.find((i) => i.number === position);
    if (clash) {
      unmatched.push({ fileName, reason: `${clash.fileName} ka number bhi ${position} hai` });
      continue;
    }
    product.images.push({ fileName, number: position, matchedBy: viaTitle ? "title" : "handle" });
  }

  const result = [...byHandle.values()].map((p) => ({
    ...p,
    images: p.images.sort((a, b) => a.number - b.number),
  }));
  return { products: result, unmatched };
}

/** CDN link for a file uploaded to Shopify Files. `base` ends with "/". */
export function cdnUrl(base: string, fileName: string): string {
  return `${base}${encodeURIComponent(fileName)}`;
}

const IMAGE_COLUMNS = ["Image Src", "Image Position", "Image Alt Text"] as const;

/** A row that only carries an image (no title, variant or option data). */
function isImageOnlyRow(row: Record<string, string>, fields: string[]): boolean {
  return fields.every(
    (f) => f === "Handle" || (IMAGE_COLUMNS as readonly string[]).includes(f) || !row[f]?.trim(),
  );
}

/**
 * The user's own Shopify export with images filled in, for import with
 * “Overwrite products with matching handles”. Every product, variant and
 * option column is written back unchanged, so Shopify only sees new images.
 * Only products that received images are included.
 *
 * Image i goes into the product's i-th variant row; extra images get
 * Handle-only rows, which is how Shopify's own exports list them.
 */
export function buildUpdatedExportCsv(
  table: ExportTable,
  products: ProductMatch[],
  base: string,
  { replaceExisting = false }: { replaceExisting?: boolean } = {},
): string {
  const fields = [...table.fields, ...IMAGE_COLUMNS.filter((c) => !table.fields.includes(c))];
  const byHandle = new Map(products.filter((p) => p.images.length).map((p) => [p.handle, p]));
  const rowsByHandle = new Map<string, Record<string, string>[]>();
  for (const row of table.rows) {
    const handle = row.Handle?.trim().toLowerCase();
    if (!handle || !byHandle.has(handle)) continue;
    rowsByHandle.set(handle, [...(rowsByHandle.get(handle) ?? []), row]);
  }

  const out: Record<string, string>[] = [];
  for (const [handle, rows] of rowsByHandle) {
    const product = byHandle.get(handle)!;
    const kept = replaceExisting
      ? []
      : rows
          .filter((r) => r["Image Src"]?.trim())
          .sort((a, b) => Number(a["Image Position"] || 0) - Number(b["Image Position"] || 0))
          .map((r) => ({ src: r["Image Src"].trim(), alt: r["Image Alt Text"] ?? "" }));
    const added = product.images.map((img) => ({ src: cdnUrl(base, img.fileName), alt: product.title }));
    const images = [...kept, ...added];

    const variantRows = rows.filter((r) => !isImageOnlyRow(r, table.fields));
    const handleValue = variantRows[0]?.Handle ?? rows[0].Handle;
    const count = Math.max(variantRows.length, images.length);
    for (let i = 0; i < count; i++) {
      const row: Record<string, string> = variantRows[i]
        ? { ...variantRows[i] }
        : Object.fromEntries(fields.map((f) => [f, ""]));
      row.Handle = variantRows[i]?.Handle ?? handleValue;
      row["Image Src"] = images[i]?.src ?? "";
      row["Image Position"] = images[i] ? String(i + 1) : "";
      row["Image Alt Text"] = images[i]?.alt ?? "";
      out.push(row);
    }
  }

  return Papa.unparse(
    { fields, data: out.map((r) => fields.map((f) => r[f] ?? "")) },
    { newline: "\r\n" },
  );
}

/** Keep only image file names, dropping folders and OS junk (__MACOSX, .DS_Store). */
export function imageNamesFromPaths(paths: string[]): string[] {
  return paths
    .filter((path) => !path.split("/").includes("__MACOSX"))
    .map((path) => path.split("/").filter(Boolean).at(-1) ?? "")
    .filter((name) => name && !isJunkFile(name) && isImageFileName(name));
}
