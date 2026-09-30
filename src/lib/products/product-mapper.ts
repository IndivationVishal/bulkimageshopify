import type { Product, ProductImage } from "@/types/product";
import type { CdnImage, CsvDefaults } from "@/types/csv";
import { generateImageName } from "@/lib/image/image-naming";
import { createId } from "@/lib/utils/file-utils";
import { unslugify } from "@/lib/utils/slugify";

/** Build a full Product from partial data, filling blanks from CSV defaults. */
export function createProduct(
  data: Partial<Product> & Pick<Product, "title" | "handle">,
  defaults: CsvDefaults,
): Product {
  return {
    id: data.id ?? createId("prod"),
    title: data.title,
    handle: data.handle,
    description: data.description ?? "",
    vendor: data.vendor ?? defaults.vendor,
    productType: data.productType ?? defaults.productType,
    tags: data.tags ?? parseTags(defaults.tags),
    status: data.status ?? defaults.status,
    price: data.price ?? defaults.price,
    compareAtPrice: data.compareAtPrice ?? "",
    sku: data.sku ?? "",
    inventory: data.inventory ?? defaults.inventory,
    images: data.images ?? [],
  };
}

export function parseTags(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(",")
    .map((t) => t.trim())
    .filter((t) => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Re-number images 1..n in their current order and recompute file names
 * from the product handle: red-ring1.jpg, red-ring2.jpg …
 */
export function renameProductImages(product: Product, separator: string, startNumber = 1): Product {
  const images = [...product.images]
    .sort((a, b) => a.position - b.position)
    .map((img, i) => ({
      ...img,
      position: i + 1,
      fileName: generateImageName(product.handle, startNumber + i, img.extension, { separator }),
    }));
  return { ...product, images };
}

export type CdnMappingResult = {
  products: Product[];
  matched: number;
  created: number;
  /** URLs whose handle didn't match any product (only when createMissing is false). */
  unmatched: CdnImage[];
};

/**
 * Attach CDN URLs to product images by handle + position.
 *
 * - red-ring2_xxx.webp -> product "red-ring", image #2
 * - If the product exists but has no image #2, a new image entry is added.
 * - If no product has that handle and `createMissing` is true, a product is
 *   created with a title derived from the handle ("Red Ring").
 */
export function mapCdnImagesToProducts(
  products: Product[],
  cdnImages: CdnImage[],
  defaults: CsvDefaults,
  { createMissing }: { createMissing: boolean },
): CdnMappingResult {
  const byHandle = new Map(products.map((p) => [p.handle, { ...p, images: [...p.images] }]));
  const order = products.map((p) => p.handle);
  const unmatched: CdnImage[] = [];
  let matched = 0;
  let created = 0;

  for (const cdn of cdnImages) {
    let product = byHandle.get(cdn.handle);
    if (!product) {
      if (!createMissing) {
        unmatched.push(cdn);
        continue;
      }
      product = createProduct({ title: unslugify(cdn.handle), handle: cdn.handle }, defaults);
      byHandle.set(cdn.handle, product);
      order.push(cdn.handle);
      created += 1;
    }

    const position =
      cdn.position > 0 ? cdn.position : Math.max(0, ...product.images.map((i) => i.position)) + 1;
    const idx = product.images.findIndex((i) => i.position === position);
    if (idx >= 0) {
      product.images[idx] = { ...product.images[idx], src: cdn.url };
    } else {
      const image: ProductImage = {
        id: createId("pimg"),
        originalName: cdn.fileName,
        extension: cdn.extension,
        fileName: cdn.fileName,
        position,
        src: cdn.url,
      };
      product.images.push(image);
    }
    matched += 1;
  }

  const result = order.map((h) => {
    const p = byHandle.get(h)!;
    return { ...p, images: p.images.sort((a, b) => a.position - b.position) };
  });
  return { products: result, matched, created, unmatched };
}

/** Remove every CDN URL from products (keeps the local images). */
export function clearCdnUrls(products: Product[]): Product[] {
  return products.map((p) => ({
    ...p,
    images: p.images
      .filter((i) => i.file) // drop images that only existed as URLs
      .map((i) => ({ ...i, src: undefined })),
  }));
}

export type CdnBaseResult = {
  products: Product[];
  /** Links generated. */
  applied: number;
  /** Images left alone because they already had a link. */
  kept: number;
  /** Images that have no file name to build a link from. */
  skipped: number;
  /** First generated link, so the user can open it and check. */
  sample?: string;
};

/**
 * Build every image's CDN link from one shared folder URL + the image's
 * final file name (which the app already knows).
 * Images that already have a link are kept unless `overwrite` is true.
 */
export function applyCdnBase(
  products: Product[],
  base: string,
  { overwrite = false }: { overwrite?: boolean } = {},
): CdnBaseResult {
  const folder = base.endsWith("/") ? base : `${base}/`;
  let applied = 0;
  let kept = 0;
  let skipped = 0;
  let sample: string | undefined;

  const next = products.map((p) => ({
    ...p,
    images: p.images.map((img) => {
      if (img.src && !overwrite) {
        kept += 1;
        return img;
      }
      if (!img.fileName) {
        skipped += 1;
        return img;
      }
      const src = `${folder}${encodeURIComponent(img.fileName)}`;
      sample ??= src;
      applied += 1;
      return { ...img, src };
    }),
  }));
  return { products: next, applied, kept, skipped, sample };
}
