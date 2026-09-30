"use client";

import { memo, useState } from "react";
import { ChevronDown, Link2, Trash2, Wand2 } from "lucide-react";
import type { Product, ProductStatus } from "@/types/product";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Thumb } from "@/components/renamer/Thumb";
import { generateHandle, sanitizeHandleInput } from "@/lib/products/handle-generator";
import { parseTags } from "@/lib/products/product-mapper";
import { SHOPIFY_HANDLE_REGEX } from "@/lib/constants/shopify";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format-utils";

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const MAX_THUMBS = 8;

type Props = {
  product: Product;
  onUpdate: (id: string, patch: Partial<Product>) => void;
  onRemove: (id: string) => void;
};

export const ProductRow = memo(function ProductRow({ product, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [tagsText, setTagsText] = useState(product.tags.join(", "));
  const id = product.id;
  const handleValid = SHOPIFY_HANDLE_REGEX.test(product.handle);
  const mapped = product.images.filter((i) => i.src).length;
  const extra = product.images.length - MAX_THUMBS;

  return (
    <li className="rounded-xl border border-border bg-surface [content-visibility:auto] [contain-intrinsic-size:auto_132px]">
      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
        <div className="flex shrink-0 gap-1.5 md:w-64 md:flex-wrap">
          {product.images.slice(0, MAX_THUMBS).map((img) => (
            <div key={img.id} className="relative" title={`${img.fileName}${img.src ? " · CDN URL mapped" : ""}`}>
              <Thumb src={img.previewUrl ?? img.src} alt={img.fileName} className="size-12 rounded-md md:size-14" />
              {img.src && (
                <span className="absolute -right-1 -bottom-1 rounded-full bg-success p-0.5 text-white">
                  <Link2 className="size-2.5" aria-label="CDN URL mapped" />
                </span>
              )}
            </div>
          ))}
          {extra > 0 && (
            <div className="flex size-12 items-center justify-center rounded-md bg-surface-2 text-xs text-muted md:size-14">
              +{extra}
            </div>
          )}
          {product.images.length === 0 && (
            <div className="flex h-12 items-center text-xs text-subtle">No images</div>
          )}
        </div>

        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_0.7fr_0.6fr_0.8fr]">
          <Field label="Title" htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={product.title}
              onChange={(e) => onUpdate(id, { title: e.target.value })}
              aria-invalid={!product.title.trim()}
            />
          </Field>
          <Field label="Handle" htmlFor={`${id}-handle`} error={handleValid ? undefined : "Invalid handle"}>
            <div className="flex gap-1">
              <Input
                id={`${id}-handle`}
                value={product.handle}
                className="font-mono"
                spellCheck={false}
                aria-invalid={!handleValid}
                onChange={(e) => onUpdate(id, { handle: sanitizeHandleInput(e.target.value) })}
                onBlur={() => onUpdate(id, { handle: product.handle.replace(/^-+|-+$/g, "") })}
              />
              <button
                type="button"
                className="shrink-0 rounded-lg border border-border px-2 text-subtle hover:bg-surface-2 hover:text-text"
                title="Generate handle from title"
                aria-label="Generate handle from title"
                onClick={() => onUpdate(id, { handle: generateHandle(product.title) })}
              >
                <Wand2 className="size-4" />
              </button>
            </div>
          </Field>
          <Field label="Price" htmlFor={`${id}-price`}>
            <Input
              id={`${id}-price`}
              inputMode="decimal"
              value={product.price}
              placeholder="0.00"
              onChange={(e) => onUpdate(id, { price: e.target.value.replace(/[^\d.]/g, "") })}
            />
          </Field>
          <Field label="Stock" htmlFor={`${id}-inv`}>
            <Input
              id={`${id}-inv`}
              type="number"
              min={0}
              value={product.inventory}
              onChange={(e) => onUpdate(id, { inventory: Math.max(0, Math.floor(e.target.valueAsNumber || 0)) })}
            />
          </Field>
          <Field label="Status" htmlFor={`${id}-status`}>
            <Select
              id={`${id}-status`}
              value={product.status}
              options={STATUS_OPTIONS}
              onChange={(e) => onUpdate(id, { status: e.target.value as ProductStatus })}
            />
          </Field>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:flex-col md:pt-5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-text"
            aria-label="More fields"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="rounded-lg p-2 text-subtle hover:bg-danger-soft hover:text-danger"
            aria-label={`Remove ${product.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted">
        <Badge>{pluralize(product.images.length, "image")}</Badge>
        {product.images.length > 0 && (
          <Badge tone={mapped === product.images.length ? "success" : mapped ? "warning" : "neutral"}>
            {mapped}/{product.images.length} CDN URLs
          </Badge>
        )}
        <span className="truncate font-mono text-subtle">
          {product.images
            .slice(0, 3)
            .map((i) => i.fileName)
            .join(", ")}
          {product.images.length > 3 ? ", …" : ""}
        </span>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
          <Field label="Description" htmlFor={`${id}-desc`} className="sm:col-span-2" hint="Plain text or HTML.">
            <Textarea
              id={`${id}-desc`}
              value={product.description}
              onChange={(e) => onUpdate(id, { description: e.target.value })}
            />
          </Field>
          <Field label="Tags" htmlFor={`${id}-tags`} hint="Comma separated">
            <Input
              id={`${id}-tags`}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              onBlur={() => {
                const tags = parseTags(tagsText);
                setTagsText(tags.join(", "));
                onUpdate(id, { tags });
              }}
            />
          </Field>
          <Field label="SKU" htmlFor={`${id}-sku`}>
            <Input id={`${id}-sku`} value={product.sku} onChange={(e) => onUpdate(id, { sku: e.target.value })} />
          </Field>
          <Field label="Compare-at price" htmlFor={`${id}-cmp`}>
            <Input
              id={`${id}-cmp`}
              inputMode="decimal"
              value={product.compareAtPrice}
              onChange={(e) => onUpdate(id, { compareAtPrice: e.target.value.replace(/[^\d.]/g, "") })}
            />
          </Field>
          <Field label="Vendor" htmlFor={`${id}-vendor`}>
            <Input id={`${id}-vendor`} value={product.vendor} onChange={(e) => onUpdate(id, { vendor: e.target.value })} />
          </Field>
          <Field label="Product type" htmlFor={`${id}-type`}>
            <Input
              id={`${id}-type`}
              value={product.productType}
              onChange={(e) => onUpdate(id, { productType: e.target.value })}
            />
          </Field>
        </div>
      )}
    </li>
  );
});
