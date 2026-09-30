"use client";

import { Wand2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Alert } from "@/components/ui/Alert";
import { extractCdnBase } from "@/lib/csv/cdn-parser";
import { pluralize } from "@/lib/utils/format-utils";
import type { CdnBaseResult } from "@/lib/products/product-mapper";

type Props = {
  value: string;
  onChange: (v: string) => void;
  imageCount: number;
  result: Omit<CdnBaseResult, "products"> | null;
  onApply: (overwrite: boolean) => void;
};

/** Paste ONE Shopify file link; links for every product image are built from it. */
export function CdnBaseInput({ value, onChange, imageCount, result, onApply }: Props) {
  const [overwrite, setOverwrite] = useState(false);
  const base = value.trim() ? extractCdnBase(value) : null;
  const invalid = value.trim() !== "" && !base;

  return (
    <div className="flex flex-col gap-3">
      <Input
        aria-label="One Shopify image link"
        aria-invalid={invalid}
        className="font-mono text-xs"
        spellCheck={false}
        placeholder="https://cdn.shopify.com/s/files/1/0842/3099/6221/files/test-pro3.png?v=1790770489"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {invalid && <p className="text-xs text-danger">Ye valid link nahi hai. https:// se shuru hone wala link daalo.</p>}
      {base && (
        <p className="text-xs text-muted">
          Store folder: <span className="font-mono text-text">{base}</span>
        </p>
      )}
      <Switch
        id="base-overwrite"
        label="Pehle se mapped links bhi badlo"
        description="Off: sirf jin images ka link nahi hai unke liye banega."
        checked={overwrite}
        onChange={setOverwrite}
      />
      <div>
        <Button onClick={() => onApply(overwrite)} disabled={!base || imageCount === 0}>
          <Wand2 className="size-4" /> Generate links for all {imageCount > 0 ? pluralize(imageCount, "image") : "images"}
        </Button>
        {imageCount === 0 && (
          <p className="mt-2 text-xs text-subtle">Pehle Product Builder ya Bulk Renamer se images add karo.</p>
        )}
      </div>
      {result && (
        <Alert
          tone={result.applied ? "success" : "warning"}
          title={`${pluralize(result.applied, "link")} generated`}
        >
          {result.kept > 0 && <p>{pluralize(result.kept, "image")} ka link pehle se tha, wo waise hi rakha.</p>}
          {result.skipped > 0 && <p>{pluralize(result.skipped, "image")} ka file naam nahi mila, skip hui.</p>}
          {result.sample && (
            <p>
              Check karo, ye khulke image dikhaye:{" "}
              <a href={result.sample} target="_blank" rel="noreferrer" className="font-mono underline break-all">
                {result.sample}
              </a>
            </p>
          )}
        </Alert>
      )}
    </div>
  );
}
