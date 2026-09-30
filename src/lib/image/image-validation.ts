import { SHOPIFY_MAX_IMAGE_BYTES } from "@/lib/constants/image";
import { isImageFileName, isJunkFile } from "@/lib/utils/file-utils";
import { formatBytes } from "@/lib/utils/format-utils";

export type RejectedFile = { name: string; reason: string };

export type ImageCheck = { ok: true; warning?: string } | { ok: false; reason: string };

export function checkImageFile(file: Pick<File, "name" | "size" | "type">): ImageCheck {
  if (isJunkFile(file.name)) return { ok: false, reason: "System file" };
  const looksLikeImage = isImageFileName(file.name) || file.type.startsWith("image/");
  if (!looksLikeImage) return { ok: false, reason: "Not an image" };
  if (file.size === 0) return { ok: false, reason: "Empty file" };
  if (file.size > SHOPIFY_MAX_IMAGE_BYTES) {
    return { ok: true, warning: `${formatBytes(file.size)} is over Shopify's 20 MB limit` };
  }
  return { ok: true };
}

/** Key used to skip the same file being added twice. */
export function fileFingerprint(file: Pick<File, "name" | "size" | "lastModified">): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/** Split a list into accepted images and rejected files (with reasons). */
export function partitionImageFiles<T extends Pick<File, "name" | "size" | "type">>(
  files: T[],
): { accepted: T[]; rejected: RejectedFile[]; warnings: RejectedFile[] } {
  const accepted: T[] = [];
  const rejected: RejectedFile[] = [];
  const warnings: RejectedFile[] = [];
  for (const file of files) {
    const check = checkImageFile(file);
    if (!check.ok) {
      // Silently drop OS junk; report everything else.
      if (check.reason !== "System file") rejected.push({ name: file.name, reason: check.reason });
      continue;
    }
    if (check.warning) warnings.push({ name: file.name, reason: check.warning });
    accepted.push(file);
  }
  return { accepted, rejected, warnings };
}
