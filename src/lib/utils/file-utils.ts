import { ACCEPTED_IMAGE_EXTENSIONS } from "@/lib/constants/image";

let counter = 0;
/** Stable-enough unique id for client-side lists. */
export function createId(prefix = "id"): string {
  counter += 1;
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}_${counter}`;
}

/** "Photo.JPG" -> "jpg" (always lower-case, no dot). */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

/** "Photo.final.JPG" -> "Photo.final" */
export function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function isImageFileName(fileName: string): boolean {
  return (ACCEPTED_IMAGE_EXTENSIONS as readonly string[]).includes(getExtension(fileName));
}

/** Ignore macOS / Windows junk that shows up when dropping folders. */
export function isJunkFile(fileName: string): boolean {
  return fileName.startsWith(".") || fileName === "Thumbs.db" || fileName === "desktop.ini";
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Natural sort: "img2" comes before "img10". */
export function naturalCompare(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Trigger a browser download for a Blob. Browser only. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function revokePreview(url?: string): void {
  if (url) URL.revokeObjectURL(url);
}
