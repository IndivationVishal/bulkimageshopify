export type ProductStatus = "draft" | "active" | "archived";

/** An image that belongs to a product. `file` is present when it came from disk. */
export type ProductImage = {
  id: string;
  file?: File;
  originalName: string;
  extension: string;
  /** Final filename after renaming, e.g. red-ring1.webp */
  fileName: string;
  /** 1-based position inside the product. */
  position: number;
  /** Shopify CDN URL once mapped. */
  src?: string;
  alt?: string;
  previewUrl?: string;
};

export type Product = {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: ProductStatus;
  price: string;
  compareAtPrice: string;
  sku: string;
  inventory: number;
  images: ProductImage[];
};
