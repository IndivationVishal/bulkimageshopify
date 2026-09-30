import Papa from "papaparse";
import type { Product } from "@/types/product";
import type { CsvDefaults } from "@/types/csv";
import type { ShopifyCsvRow } from "@/types/shopify";
import { SHOPIFY_CSV_COLUMNS } from "./csv-columns";

function emptyRow(): ShopifyCsvRow {
  return Object.fromEntries(SHOPIFY_CSV_COLUMNS.map((c) => [c, ""])) as ShopifyCsvRow;
}

const bool = (v: boolean) => (v ? "TRUE" : "FALSE");

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Descriptions that already contain HTML are passed through.
 * Plain text becomes <p> paragraphs with <br> line breaks.
 */
export function toBodyHtml(description: string): string {
  const text = description.trim();
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * Product -> Shopify rows.
 *
 * Row 1 carries every product + variant field and the first image.
 * Rows 2..n carry only Handle + image columns, which is how Shopify
 * attaches extra images to the same product.
 * Images without a CDN URL are skipped.
 */
export function productToRows(product: Product, defaults: CsvDefaults): ShopifyCsvRow[] {
  const images = product.images
    .filter((img) => img.src)
    .sort((a, b) => a.position - b.position);

  const first = emptyRow();
  Object.assign(first, {
    Handle: product.handle,
    Title: product.title,
    "Body (HTML)": toBodyHtml(product.description),
    Vendor: product.vendor || defaults.vendor,
    Type: product.productType || defaults.productType,
    Tags: product.tags.join(", "),
    Published: bool(defaults.published),
    "Option1 Name": "Title",
    "Option1 Value": "Default Title",
    "Variant SKU": product.sku,
    "Variant Grams": String(defaults.grams),
    "Variant Inventory Tracker": defaults.trackInventory ? "shopify" : "",
    "Variant Inventory Qty": defaults.trackInventory ? String(product.inventory) : "",
    "Variant Inventory Policy": defaults.inventoryPolicy,
    "Variant Fulfillment Service": "manual",
    "Variant Price": product.price || defaults.price,
    "Variant Compare At Price": product.compareAtPrice,
    "Variant Requires Shipping": bool(defaults.requiresShipping),
    "Variant Taxable": bool(defaults.taxable),
    "Gift Card": "FALSE",
    "Variant Weight Unit": "g",
    Status: product.status,
  } satisfies Partial<ShopifyCsvRow>);

  if (images.length === 0) return [first];

  return images.map((img, i) => {
    const row = i === 0 ? first : emptyRow();
    row.Handle = product.handle;
    row["Image Src"] = img.src!;
    row["Image Position"] = String(i + 1);
    row["Image Alt Text"] = img.alt?.trim() || product.title;
    return row;
  });
}

export function productsToRows(products: Product[], defaults: CsvDefaults): ShopifyCsvRow[] {
  return products.flatMap((p) => productToRows(p, defaults));
}

/** Rows -> CSV text with Shopify's exact header order. */
export function rowsToCsv(rows: ShopifyCsvRow[]): string {
  return Papa.unparse(
    { fields: [...SHOPIFY_CSV_COLUMNS], data: rows.map((r) => SHOPIFY_CSV_COLUMNS.map((c) => r[c])) },
    { newline: "\r\n", quotes: false },
  );
}

export function generateShopifyCsv(products: Product[], defaults: CsvDefaults): string {
  return rowsToCsv(productsToRows(products, defaults));
}
