import type { CdnImage, CdnParseError, CdnParseResult } from "@/types/csv";
import { getExtension, stripExtension } from "@/lib/utils/file-utils";

/**
 * Shopify adds a random suffix when a file name already exists:
 *   red-ring1_3f2a9b1c-5d6e-4f70-8a9b-0c1d2e3f4a5b.webp
 *   red-ring1_a1b2c3d4.webp
 * Resized CDN links may also carry a size suffix: red-ring1_600x600.webp
 */
const SHOPIFY_SUFFIX_REGEX =
  /_(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?=[0-9]*[a-f])[0-9a-f]{8,}|\d+x\d*|x\d+)$/i;

/** Fallback when the handle is unknown: "red-ring1" / "red-ring-1" / "red-ring_1". */
const HANDLE_NUMBER_REGEX = /^(.+?)[-_]?(\d+)$/;

/** Extract "red-ring1" from a full CDN URL (no query, no suffix, no extension). */
export function extractFileName(url: URL): { base: string; fileName: string; extension: string } {
  const last = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    /* keep raw */
  }
  const extension = getExtension(decoded);
  let base = stripExtension(decoded);
  // Strip at most two suffixes (e.g. uuid + size).
  for (let i = 0; i < 2 && SHOPIFY_SUFFIX_REGEX.test(base); i++) {
    base = base.replace(SHOPIFY_SUFFIX_REGEX, "");
  }
  return { base, fileName: extension ? `${base}.${extension}` : base, extension };
}

/**
 * Split "red-ring12" into handle + number.
 * Known handles win (longest first), which resolves ambiguous names like
 * "ring-2024" + "1" = "ring-20241". Otherwise a regex guess is used.
 */
export function splitHandleAndNumber(
  base: string,
  knownHandles: string[] = [],
  separator = "",
): { handle: string; position: number } {
  const lower = base.toLowerCase();
  const sorted = [...knownHandles].sort((a, b) => b.length - a.length);
  for (const handle of sorted) {
    for (const sep of new Set([separator, "", "-", "_"])) {
      const prefix = handle + sep;
      if (lower.startsWith(prefix)) {
        const rest = lower.slice(prefix.length);
        if (/^\d+$/.test(rest)) return { handle, position: Number(rest) };
      }
    }
    if (lower === handle) return { handle, position: 0 };
  }
  const m = lower.match(HANDLE_NUMBER_REGEX);
  if (m) return { handle: m[1].replace(/[-_]+$/, ""), position: Number(m[2]) };
  return { handle: lower, position: 0 };
}

/**
 * Parse a pasted block of URLs (newline, space or comma separated).
 * position 0 means "no number in the filename" – the mapper appends it.
 */
export function parseCdnUrls(
  text: string,
  options: { knownHandles?: string[]; separator?: string } = {},
): CdnParseResult {
  const images: CdnImage[] = [];
  const errors: CdnParseError[] = [];
  const seen = new Set<string>();
  const tokens = text
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^["'<(]+|["'>)]+$/g, ""))
    .filter(Boolean);

  tokens.forEach((input, i) => {
    const line = i + 1;
    let url: URL;
    try {
      url = new URL(input.startsWith("//") ? `https:${input}` : input);
    } catch {
      errors.push({ line, input, reason: "Not a valid URL" });
      return;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      errors.push({ line, input, reason: "URL must start with https://" });
      return;
    }
    const normalized = url.toString();
    if (seen.has(normalized)) {
      errors.push({ line, input, reason: "Duplicate URL" });
      return;
    }
    seen.add(normalized);

    const { base, fileName, extension } = extractFileName(url);
    if (!base) {
      errors.push({ line, input, reason: "URL has no file name" });
      return;
    }
    const { handle, position } = splitHandleAndNumber(base, options.knownHandles, options.separator);
    images.push({ url: normalized, fileName, handle, position, extension });
  });

  return { images, errors };
}

/**
 * Take ONE Shopify file link and return the folder part shared by every file:
 *   https://cdn.shopify.com/s/files/1/0842/3099/6221/files/test-pro3.png?v=1
 *   -> https://cdn.shopify.com/s/files/1/0842/3099/6221/files/
 * Returns null when the input is not a usable http(s) URL.
 */
export function extractCdnBase(input: string): string | null {
  let url: URL;
  try {
    const text = input.trim().replace(/^["'<(]+|["'>)]+$/g, "");
    url = new URL(text.startsWith("//") ? `https:${text}` : text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const slash = url.pathname.lastIndexOf("/");
  if (slash < 0) return null;
  return `${url.origin}${url.pathname.slice(0, slash + 1)}`;
}
