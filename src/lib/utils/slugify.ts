/**
 * Convert any text into a Shopify-friendly handle.
 * "Red Ring (Gold) 18K" -> "red-ring-gold-18k"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Title-case a handle back into a readable name: "red-ring" -> "Red Ring". */
export function unslugify(handle: string): string {
  return handle
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
