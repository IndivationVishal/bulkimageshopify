import type { RenameFile } from "@/types/image";
import { createId, getExtension } from "@/lib/utils/file-utils";

/** Wrap a browser File for the renamer. Creates an object URL for the thumbnail. */
export function createRenameFile(file: File): RenameFile {
  return {
    id: createId("img"),
    file,
    originalName: file.name,
    extension: getExtension(file.name) || mimeToExtension(file.type),
    size: file.size,
    previewUrl: canPreview(file) ? URL.createObjectURL(file) : undefined,
  };
}

/** Browsers cannot render HEIC, so skip the preview for it. */
export function canPreview(file: Pick<File, "name" | "type">): boolean {
  const ext = getExtension(file.name);
  return ext !== "heic" && file.type !== "image/heic";
}

export function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? "";
}
