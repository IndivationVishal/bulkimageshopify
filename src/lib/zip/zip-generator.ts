import JSZip from "jszip";

export type ZipEntry = { path: string; file: Blob };

/**
 * Build a ZIP in the browser. Images are already compressed, so STORE
 * (no re-compression) keeps it fast even for thousands of files.
 * Duplicate paths get " (2)" appended so nothing is silently overwritten.
 */
export async function createZip(
  entries: ZipEntry[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const zip = new JSZip();
  const used = new Set<string>();
  for (const { path, file } of entries) {
    zip.file(dedupePath(path, used), file, { binary: true });
  }
  return zip.generateAsync({ type: "blob", compression: "STORE", streamFiles: true }, (meta) =>
    onProgress?.(Math.round(meta.percent)),
  );
}

function dedupePath(path: string, used: Set<string>): string {
  let candidate = path;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const dot = path.lastIndexOf(".");
    candidate = dot > 0 ? `${path.slice(0, dot)} (${n})${path.slice(dot)}` : `${path} (${n})`;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
