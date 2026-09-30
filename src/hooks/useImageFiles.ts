"use client";

import { useCallback, type DragEvent } from "react";
import { useRenamerStore, type AddFilesReport } from "@/store/renamer-store";
import { filesFromDataTransfer } from "@/lib/products/folder-reader";
import { pluralize } from "@/lib/utils/format-utils";
import type { Notice } from "./useNotice";

export function describeAddReport(r: AddFilesReport): Notice {
  const parts: string[] = [];
  if (r.duplicates) parts.push(`${pluralize(r.duplicates, "duplicate")} skipped`);
  if (r.rejected.length)
    parts.push(
      `${pluralize(r.rejected.length, "file")} ignored (${r.rejected
        .slice(0, 3)
        .map((f) => `${f.name}: ${f.reason}`)
        .join("; ")}${r.rejected.length > 3 ? "…" : ""})`,
    );
  if (r.warnings.length) parts.push(r.warnings.map((w) => `${w.name}: ${w.reason}`).join("; "));
  const tone = r.added === 0 ? "warning" : r.rejected.length || r.warnings.length ? "warning" : "success";
  return { tone, title: `${pluralize(r.added, "image")} added`, body: parts.join(". ") || undefined };
}

/** Handlers for the renamer dropzone (files or folders). */
export function useImageFiles(onReport: (n: Notice) => void) {
  const addFiles = useRenamerStore((s) => s.addFiles);

  const onFiles = useCallback((list: FileList | File[]) => onReport(describeAddReport(addFiles(Array.from(list)))), [
    addFiles,
    onReport,
  ]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      filesFromDataTransfer(e.dataTransfer)
        .then((items) => onFiles(items.map((i) => i.file)))
        .catch(() => onReport({ tone: "danger", title: "Could not read the dropped files." }));
    },
    [onFiles, onReport],
  );

  return { onFiles, onDrop };
}
