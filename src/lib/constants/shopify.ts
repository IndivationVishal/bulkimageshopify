import type { CsvDefaults } from "@/types/csv";

/** Shopify handles: lower-case letters, numbers and single hyphens. */
export const SHOPIFY_HANDLE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SHOPIFY_MAX_HANDLE_LENGTH = 255;
export const SHOPIFY_MAX_TITLE_LENGTH = 255;

export const DEFAULT_CSV_DEFAULTS: CsvDefaults = {
  vendor: "",
  productType: "",
  price: "0.00",
  inventory: 10,
  status: "draft",
  tags: "new",
  published: true,
  requiresShipping: true,
  taxable: true,
  trackInventory: true,
  inventoryPolicy: "deny",
  grams: 0,
};
