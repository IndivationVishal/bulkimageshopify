/**
 * Column headers exactly as Shopify's product import template spells them.
 * Order matches the official template so the file opens cleanly in Shopify.
 */
export const SHOPIFY_CSV_COLUMNS = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Variant SKU",
  "Variant Grams",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Fulfillment Service",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Gift Card",
  "Variant Weight Unit",
  "Status",
] as const;

/** Columns shown in the on-screen preview (the full set is always exported). */
export const PREVIEW_COLUMNS = [
  "Handle",
  "Title",
  "Tags",
  "Status",
  "Variant Price",
  "Variant Inventory Qty",
  "Image Position",
  "Image Src",
] as const;
