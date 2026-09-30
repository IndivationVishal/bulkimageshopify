import type { RenameFile, RenamePreview } from "@/types/image";

export type NamingOptions = {
  /** Text between handle and number. "" -> red-ring1, "-" -> red-ring-1 */
  separator?: string;
};

/**
 * The single source of truth for image names.
 * generateImageName("red-ring", 1, "webp") -> "red-ring1.webp"
 */
export function generateImageName(
  handle: string,
  index: number,
  extension: string,
  { separator = "" }: NamingOptions = {},
): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  // "ring-2024" + 1 would read as "ring-20241", so force a hyphen after a trailing digit.
  const sep = separator === "" && /\d$/.test(handle) ? "-" : separator;
  const base = `${handle}${sep}${index}`;
  return ext ? `${base}.${ext}` : base;
}

/** Build old -> new name pairs for an already-sorted list of files. */
export function buildRenamePreview(
  files: Pick<RenameFile, "id" | "originalName" | "extension">[],
  handle: string,
  startNumber: number,
  options: NamingOptions = {},
): RenamePreview[] {
  return files.map((f, i) => ({
    id: f.id,
    originalName: f.originalName,
    newName: generateImageName(handle, startNumber + i, f.extension, options),
  }));
}
