import type { SHOPIFY_CSV_COLUMNS } from "@/lib/csv/csv-columns";

export type ShopifyCsvColumn = (typeof SHOPIFY_CSV_COLUMNS)[number];

/** One row of a Shopify product import CSV, keyed by the exact Shopify header. */
export type ShopifyCsvRow = Record<ShopifyCsvColumn, string>;
