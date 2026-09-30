/** A single image queued in the Bulk Renamer. */
export type RenameFile = {
  id: string;
  file: File;
  originalName: string;
  /** Lower-cased extension without the dot, e.g. "webp". */
  extension: string;
  size: number;
  /** Object URL for thumbnails. Must be revoked when the file is removed. */
  previewUrl?: string;
};

/** Selection = the order the user added/arranged files in. */
export type SortMode = "selection" | "nameAsc" | "nameDesc";

export type RenamePreview = {
  id: string;
  originalName: string;
  newName: string;
};
