/**
 * Browser helpers that turn a dropped folder (or a webkitdirectory input)
 * into a flat list of files with their relative paths.
 * Nothing is uploaded anywhere – this only reads local File handles.
 */

export type PathedFile = { file: File; path: string };

/** Files from <input webkitdirectory> already carry webkitRelativePath. */
export function filesFromInput(list: FileList | File[]): PathedFile[] {
  return Array.from(list).map((file) => ({
    file,
    path: file.webkitRelativePath || file.name,
  }));
}

/**
 * Read a drag & drop DataTransfer, walking directories recursively.
 * Must be called synchronously inside the drop handler (the entries are
 * captured before the first await, as browsers require).
 */
export function filesFromDataTransfer(dt: DataTransfer): Promise<PathedFile[]> {
  const entries: FileSystemEntry[] = [];
  const looseFiles: File[] = [];
  for (const item of Array.from(dt.items)) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) entries.push(entry);
    else {
      const f = item.getAsFile();
      if (f) looseFiles.push(f);
    }
  }
  return (async () => {
    const out: PathedFile[] = looseFiles.map((file) => ({ file, path: file.name }));
    for (const entry of entries) await walkEntry(entry, "", out);
    return out;
  })();
}

async function walkEntry(entry: FileSystemEntry, parent: string, out: PathedFile[]): Promise<void> {
  const path = parent ? `${parent}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    out.push({ file, path });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns results in batches (~100); keep reading until empty.
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) break;
      for (const child of batch) await walkEntry(child, path, out);
    }
  }
}
