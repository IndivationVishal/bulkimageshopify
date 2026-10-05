"use client";

import { useCallback, type DragEvent } from "react";
import { useRenamerStore, type AddFilesReport } from "@/store/renamer-store";
import { filesFromDataTransfer, type PathedFile } from "@/lib/products/folder-reader";
import { naturalCompare } from "@/lib/utils/file-utils";
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

/**
 * Group dropped files by the folder that directly contains them.
 * Returns null when everything sits in one folder (or no folder at all).
 */
export function groupByFolder(items: PathedFile[]): { name: string; files: File[] }[] | null {
  const groups = new Map<string, { name: string; files: File[] }>();
  for (const { file, path } of items) {
    const parent = path.split("/").filter(Boolean).slice(0, -1);
    const key = parent.join("/");
    const group = groups.get(key) ?? { name: parent.at(-1) ?? "", files: [] };
    group.files.push(file);
    groups.set(key, group);
  }
  if (groups.size < 2) return null;
  return [...groups.values()]
    .map((g) => ({ ...g, files: [...g.files].sort((a, b) => naturalCompare(a.name, b.name)) }))
    .sort((a, b) => naturalCompare(a.name, b.name));
}

/**
 * Handlers for the renamer dropzone. Loose files / one folder go into the
 * active product; a folder of product folders becomes one product per folder.
 */
export function useImageFiles(onReport: (n: Notice) => void) {
  const addFiles = useRenamerStore((s) => s.addFiles);
  const addProductsFromFolders = useRenamerStore((s) => s.addProductsFromFolders);

  const onFiles = useCallback((list: FileList | File[]) => onReport(describeAddReport(addFiles(Array.from(list)))), [
    addFiles,
    onReport,
  ]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      filesFromDataTransfer(e.dataTransfer)
        .then((items) => {
          const groups = groupByFolder(items);
          if (!groups) return onFiles(items.map((i) => i.file));
          const r = addProductsFromFolders(groups);
          const notice = describeAddReport(r);
          onReport({ ...notice, title: `${pluralize(r.products, "product")} with ${notice.title}` });
        })
        .catch(() => onReport({ tone: "danger", title: "Could not read the dropped files." }));
    },
    [onFiles, onReport, addProductsFromFolders],
  );

  return { onFiles, onDrop };
}
