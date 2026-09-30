/** Parsed information extracted from one pasted CDN URL. */
export type CdnImage = {
  url: string;
  /** Filename with Shopify's random suffix and query string removed. */
  fileName: string;
  /** Handle guessed from the filename (e.g. "red-ring"). */
  handle: string;
  /** Image number parsed from the filename (e.g. 1). */
  position: number;
  extension: string;
};

export type CdnParseError = { line: number; input: string; reason: string };

export type CdnParseResult = { images: CdnImage[]; errors: CdnParseError[] };

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: ValidationSeverity;
  handle?: string;
  message: string;
};

export type CsvDefaults = {
  vendor: string;
  productType: string;
  price: string;
  inventory: number;
  status: "draft" | "active" | "archived";
  tags: string;
  published: boolean;
  requiresShipping: boolean;
  taxable: boolean;
  trackInventory: boolean;
  /** "deny" = stop selling when out of stock, "continue" = keep selling. */
  inventoryPolicy: "deny" | "continue";
  grams: number;
};
