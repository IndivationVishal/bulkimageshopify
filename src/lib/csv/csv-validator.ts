import { z } from "zod";
import type { Product } from "@/types/product";
import type { ValidationIssue } from "@/types/csv";
import {
  SHOPIFY_HANDLE_REGEX,
  SHOPIFY_MAX_HANDLE_LENGTH,
  SHOPIFY_MAX_TITLE_LENGTH,
} from "@/lib/constants/shopify";
import { SHOPIFY_MAX_IMAGES_PER_PRODUCT } from "@/lib/constants/image";

const priceSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "must be a number like 499 or 499.00");

export const productSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(SHOPIFY_MAX_TITLE_LENGTH),
  handle: z
    .string()
    .min(1, "Handle is required")
    .max(SHOPIFY_MAX_HANDLE_LENGTH)
    .regex(SHOPIFY_HANDLE_REGEX, "Handle may only use a-z, 0-9 and single hyphens"),
  price: priceSchema.or(z.literal("")),
  compareAtPrice: priceSchema.or(z.literal("")),
  inventory: z.number().int("Inventory must be a whole number").min(0, "Inventory cannot be negative"),
  status: z.enum(["draft", "active", "archived"]),
});

const httpsUrl = z.url({ protocol: /^https?$/ });

/**
 * Check everything Shopify would reject (errors) and things that are
 * probably mistakes (warnings). Errors block the export.
 */
export function validateProducts(products: Product[], defaultPrice: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (products.length === 0) {
    issues.push({ severity: "error", message: "No products to export." });
    return issues;
  }

  if (!priceSchema.safeParse(defaultPrice).success) {
    issues.push({ severity: "error", message: `Default price "${defaultPrice}" is not a valid number.` });
  }

  const handleCount = new Map<string, number>();
  for (const p of products) handleCount.set(p.handle, (handleCount.get(p.handle) ?? 0) + 1);

  for (const p of products) {
    const handle = p.handle || "(no handle)";
    const parsed = productSchema.safeParse(p);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        issues.push({ severity: "error", handle, message: `${label(field)}: ${issue.message}` });
      }
    }
    if ((handleCount.get(p.handle) ?? 0) > 1) {
      issues.push({ severity: "error", handle, message: "Handle is used by more than one product." });
    }

    const mapped = p.images.filter((i) => i.src);
    const missing = p.images.length - mapped.length;
    if (mapped.length === 0) {
      issues.push({
        severity: "warning",
        handle,
        message: "No CDN image URLs – product will be imported without images.",
      });
    } else if (missing > 0) {
      issues.push({
        severity: "warning",
        handle,
        message: `${missing} image(s) have no CDN URL and will be skipped.`,
      });
    }
    if (mapped.length > SHOPIFY_MAX_IMAGES_PER_PRODUCT) {
      issues.push({
        severity: "error",
        handle,
        message: `Shopify allows at most ${SHOPIFY_MAX_IMAGES_PER_PRODUCT} images per product.`,
      });
    }
    for (const img of mapped) {
      if (!httpsUrl.safeParse(img.src).success) {
        issues.push({ severity: "error", handle, message: `Invalid image URL: ${img.src}` });
      }
    }
    const positions = mapped.map((i) => i.position);
    if (new Set(positions).size !== positions.length) {
      issues.push({ severity: "warning", handle, message: "Two URLs point to the same image number." });
    }
    if (p.status === "active" && !p.price && Number(defaultPrice) === 0) {
      issues.push({ severity: "warning", handle, message: "Active product with a price of 0." });
    }
  }
  return issues;
}

function label(field: string): string {
  const map: Record<string, string> = {
    title: "Title",
    handle: "Handle",
    price: "Price",
    compareAtPrice: "Compare-at price",
    inventory: "Inventory",
    status: "Status",
  };
  return map[field] ?? field;
}

export const hasErrors = (issues: ValidationIssue[]) => issues.some((i) => i.severity === "error");
