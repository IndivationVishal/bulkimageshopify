"use client";

import { CopyCheck } from "lucide-react";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { STATUS_OPTIONS } from "@/components/products/ProductRow";
import { useSettingsStore } from "@/store/settings-store";
import type { CsvDefaults } from "@/types/csv";

/**
 * Store-wide defaults. They fill in any field a product leaves blank and
 * are saved in this browser for next time.
 */
export function CsvProductForm({ onApplyAll, disabled }: { onApplyAll?: () => void; disabled?: boolean }) {
  const csv = useSettingsStore((s) => s.csv);
  const updateCsv = useSettingsStore((s) => s.updateCsv);
  const set = <K extends keyof CsvDefaults>(key: K, value: CsvDefaults[K]) => updateCsv({ [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Default price" htmlFor="d-price">
          <Input
            id="d-price"
            inputMode="decimal"
            value={csv.price}
            onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
          />
        </Field>
        <Field label="Default stock" htmlFor="d-inv">
          <Input
            id="d-inv"
            type="number"
            min={0}
            value={csv.inventory}
            onChange={(e) => set("inventory", Math.max(0, Math.floor(e.target.valueAsNumber || 0)))}
          />
        </Field>
        <Field label="Default status" htmlFor="d-status">
          <Select
            id="d-status"
            value={csv.status}
            options={STATUS_OPTIONS}
            onChange={(e) => set("status", e.target.value as CsvDefaults["status"])}
          />
        </Field>
        <Field label="Default tags" htmlFor="d-tags" hint="Comma separated">
          <Input id="d-tags" value={csv.tags} onChange={(e) => set("tags", e.target.value)} />
        </Field>
        <Field label="Vendor" htmlFor="d-vendor">
          <Input id="d-vendor" value={csv.vendor} placeholder="Your brand" onChange={(e) => set("vendor", e.target.value)} />
        </Field>
        <Field label="Product type" htmlFor="d-type">
          <Input
            id="d-type"
            value={csv.productType}
            placeholder="Rings"
            onChange={(e) => set("productType", e.target.value)}
          />
        </Field>
        <Field label="Weight (grams)" htmlFor="d-grams">
          <Input
            id="d-grams"
            type="number"
            min={0}
            value={csv.grams}
            onChange={(e) => set("grams", Math.max(0, Math.floor(e.target.valueAsNumber || 0)))}
          />
        </Field>
        <Field label="When out of stock" htmlFor="d-policy">
          <Select
            id="d-policy"
            value={csv.inventoryPolicy}
            options={[
              { value: "deny", label: "Stop selling" },
              { value: "continue", label: "Continue selling" },
            ]}
            onChange={(e) => set("inventoryPolicy", e.target.value as CsvDefaults["inventoryPolicy"])}
          />
        </Field>
      </div>
      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <Switch
          id="d-published"
          label="Publish to Online Store"
          checked={csv.published}
          onChange={(v) => set("published", v)}
        />
        <Switch
          id="d-track"
          label="Track inventory"
          checked={csv.trackInventory}
          onChange={(v) => set("trackInventory", v)}
        />
        <Switch
          id="d-ship"
          label="Requires shipping"
          checked={csv.requiresShipping}
          onChange={(v) => set("requiresShipping", v)}
        />
        <Switch id="d-tax" label="Charge tax" checked={csv.taxable} onChange={(v) => set("taxable", v)} />
      </div>
      {onApplyAll && (
        <div>
          <Button variant="secondary" size="sm" onClick={onApplyAll} disabled={disabled}>
            <CopyCheck className="size-3.5" /> Apply price, stock, status, tags, vendor & type to all products
          </Button>
        </div>
      )}
    </div>
  );
}
