import type { Product, ProductImage } from "@/types/product";
import type { CsvDefaults } from "@/types/csv";
import type { RejectedFile } from "@/lib/image/image-validation";
import { partitionImageFiles } from "@/lib/image/image-validation";
import { canPreview, mimeToExtension } from "@/lib/image/image-utils";
import { createId, getExtension, naturalCompare, stripExtension } from "@/lib/utils/file-utils";
import { unslugify } from "@/lib/utils/slugify";
import { splitHandleAndNumber } from "@/lib/csv/cdn-parser";
import { generateHandle, uniqueHandle } from "./handle-generator";
import { createProduct, renameProductImages } from "./product-mapper";

export type ParseInput = { file: File; path: string };

export type ParseResult = { products: Product[]; rejected: RejectedFile[]; warnings: RejectedFile[] };

/**
 * Group files by the folder that directly contains them:
 *
 *   Products/Red Ring/a.jpg   -> product "Red Ring"
 *   Products/Blue Ring/1.webp -> product "Blue Ring"
 *
 * Images inside each folder are sorted naturally (2 before 10) and renamed
 * to {handle}{n}.{ext}. Handles are made unique across all products,
 * including `existingHandles` already in the app.
 */
export function parseProductFolders(
  inputs: ParseInput[],
  defaults: CsvDefaults,
  options: { separator: string; startNumber: number; existingHandles?: Iterable<string> },
): ParseResult {
  const { accepted, rejected, warnings } = partitionImageFiles(inputs.map((i) => i.file));
  const acceptedSet = new Set(accepted);

  // Group by full parent path so "A/Red" and "B/Red" stay separate products.
  const groups = new Map<string, { name: string; items: ParseInput[] }>();
  for (const input of inputs) {
    if (!acceptedSet.has(input.file)) continue;
    const parts = input.path.split("/").filter(Boolean);
    const parentParts = parts.slice(0, -1);
    const key = parentParts.join("/") || "__root__";
    const name = parentParts.at(-1) ?? "Untitled Product";
    const group = groups.get(key) ?? { name, items: [] };
    group.items.push(input);
    groups.set(key, group);
  }

  const taken = new Set(options.existingHandles ?? []);
  const products: Product[] = [];
  const sortedGroups = [...groups.values()].sort((a, b) => naturalCompare(a.name, b.name));

  for (const group of sortedGroups) {
    const title = group.name.trim();
    const handle = uniqueHandle(generateHandle(title), taken);
    const items = [...group.items].sort((a, b) => naturalCompare(a.file.name, b.file.name));
    const images: ProductImage[] = items.map(({ file }, i) => ({
      id: createId("pimg"),
      file,
      originalName: file.name,
      extension: getExtension(file.name) || mimeToExtension(file.type),
      fileName: "",
      position: i + 1,
      previewUrl: canPreview(file) ? URL.createObjectURL(file) : undefined,
    }));
    const product = createProduct({ title, handle, images }, defaults);
    products.push(renameProductImages(product, options.separator, options.startNumber));
  }

  return { products, rejected, warnings };
}

export type RenamedImportResult = {
  products: Product[];
  /** Products that did not exist before. */
  created: number;
  /** Files attached to an image the app already knew (e.g. after a refresh). */
  attached: number;
  /** Files that became brand-new images. */
  added: number;
  rejected: RejectedFile[];
  warnings: RejectedFile[];
};

/**
 * Import images that are ALREADY named like `red-ring1.png`.
 * Nothing is renamed: the handle and image number come from the file name.
 *
 * - Product with that handle exists (e.g. restored after a refresh):
 *   the file is attached to the matching image, so thumbnails and ZIP work again.
 * - Otherwise a product is created with the title "Red Ring".
 */
export function importRenamedImages(
  inputs: ParseInput[],
  existing: Product[],
  defaults: CsvDefaults,
  separator: string,
): RenamedImportResult {
  const { accepted, rejected, warnings } = partitionImageFiles(inputs.map((i) => i.file));
  const byHandle = new Map(existing.map((p) => [p.handle, { ...p, images: [...p.images] }]));
  const touched = new Set<string>();
  let created = 0;
  let attached = 0;
  let added = 0;

  const files = [...accepted].sort((a, b) => naturalCompare(a.name, b.name));
  for (const file of files) {
    const parsed = splitHandleAndNumber(stripExtension(file.name), [...byHandle.keys()], separator);
    if (parsed.position === 0) {
      rejected.push({ name: file.name, reason: "No image number in the name (expected e.g. red-ring1.jpg)" });
      continue;
    }
    const handle = byHandle.has(parsed.handle) ? parsed.handle : generateHandle(parsed.handle);
    let product = byHandle.get(handle);
    if (!product) {
      product = createProduct({ title: unslugify(handle), handle }, defaults);
      byHandle.set(handle, product);
      created += 1;
    }
    touched.add(handle);

    const extension = getExtension(file.name) || mimeToExtension(file.type);
    const previewUrl = canPreview(file) ? URL.createObjectURL(file) : undefined;
    const lower = file.name.toLowerCase();
    let idx = product.images.findIndex((i) => i.fileName.toLowerCase() === lower);
    if (idx < 0) idx = product.images.findIndex((i) => i.position === parsed.position && !i.file);

    if (idx >= 0) {
      product.images[idx] = {
        ...product.images[idx],
        file,
        previewUrl,
        originalName: file.name,
        fileName: file.name,
        extension,
      };
      attached += 1;
    } else {
      product.images.push({
        id: createId("pimg"),
        file,
        previewUrl,
        originalName: file.name,
        fileName: file.name,
        extension,
        position: parsed.position,
      });
      added += 1;
    }
  }

  const products = [...byHandle.values()].map((p) =>
    touched.has(p.handle) ? { ...p, images: [...p.images].sort((a, b) => a.position - b.position) } : p,
  );
  return { products, created, attached, added, rejected, warnings };
}
