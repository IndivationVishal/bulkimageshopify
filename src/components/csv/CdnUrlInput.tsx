"use client";

import { ClipboardPaste, Eraser, Link2 } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import type { CdnParseResult } from "@/types/csv";
import { pluralize } from "@/lib/utils/format-utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  parsed: CdnParseResult;
  createMissing: boolean;
  onCreateMissing: (v: boolean) => void;
  onApply: () => void;
  onClear: () => void;
};

export function CdnUrlInput({ value, onChange, parsed, createMissing, onCreateMissing, onApply, onClear }: Props) {
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(value ? `${value.trimEnd()}\n${text}` : text);
    } catch {
      /* clipboard permission denied – user can paste manually */
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        aria-label="Shopify CDN URLs"
        className="min-h-40 font-mono text-xs"
        spellCheck={false}
        placeholder={`https://your-store.com/cdn/shop/files/red-ring1_xxx.webp?v=1712345
https://your-store.com/cdn/shop/files/red-ring2_xxx.webp?v=1712345
https://cdn.shopify.com/s/files/1/0123/4567/files/blue-ring1.jpg`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone={parsed.images.length ? "accent" : "neutral"}>{parsed.images.length} valid URLs</Badge>
        {parsed.errors.length > 0 && <Badge tone="danger">{pluralize(parsed.errors.length, "problem")}</Badge>}
      </div>
      {parsed.errors.length > 0 && (
        <ul className="max-h-28 overflow-y-auto rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          {parsed.errors.slice(0, 50).map((e) => (
            <li key={`${e.line}-${e.input}`} className="truncate">
              #{e.line}: {e.reason} – <span className="font-mono">{e.input}</span>
            </li>
          ))}
        </ul>
      )}
      <Switch
        id="create-missing"
        label="Create products for unknown handles"
        description="e.g. blue-ring1.jpg with no Blue Ring product creates it automatically."
        checked={createMissing}
        onChange={onCreateMissing}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onApply} disabled={parsed.images.length === 0}>
          <Link2 className="size-4" /> Map URLs to products
        </Button>
        <Button variant="secondary" onClick={paste}>
          <ClipboardPaste className="size-4" /> Paste from clipboard
        </Button>
        <Button variant="ghost" onClick={onClear}>
          <Eraser className="size-4" /> Clear URLs
        </Button>
      </div>
    </div>
  );
}
