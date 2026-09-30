import { slugify } from "@/lib/utils/slugify";
import { SHOPIFY_MAX_HANDLE_LENGTH } from "@/lib/constants/shopify";

/** "Red Ring" -> "red-ring". Falls back to "product" for empty/emoji-only titles. */
export function generateHandle(title: string): string {
  const handle = slugify(title).slice(0, SHOPIFY_MAX_HANDLE_LENGTH).replace(/-+$/, "");
  return handle || "product";
}

/**
 * Make `handle` unique against `taken` by appending -2, -3, …
 * Adds the result to `taken` so it can be called in a loop.
 */
export function uniqueHandle(handle: string, taken: Set<string>): string {
  let candidate = handle;
  let n = 2;
  while (taken.has(candidate)) {
    candidate = `${handle}-${n}`;
    n += 1;
  }
  taken.add(candidate);
  return candidate;
}

/**
 * Live-typing version of a handle: lower-case, spaces -> hyphens,
 * invalid characters dropped. Trailing hyphens are allowed while typing.
 */
export function sanitizeHandleInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}
