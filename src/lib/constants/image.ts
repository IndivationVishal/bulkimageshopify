export const ACCEPTED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "heic",
  "svg",
] as const;

/** Value for <input accept="…"> */
export const IMAGE_ACCEPT_ATTR = ACCEPTED_IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",") + ",image/*";

/** Shopify rejects images larger than 20 MB. */
export const SHOPIFY_MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Shopify's product image limit. */
export const SHOPIFY_MAX_IMAGES_PER_PRODUCT = 250;
