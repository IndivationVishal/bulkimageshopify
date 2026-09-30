"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CsvProductForm } from "@/components/csv/CsvProductForm";
import { useSettingsStore } from "@/store/settings-store";
import { generateImageName } from "@/lib/image/image-naming";

const SEPARATORS = [
  { value: "", label: "None (red-ring1)" },
  { value: "-", label: "Hyphen (red-ring-1)" },
  { value: "_", label: "Underscore (red-ring_1)" },
];

export function SettingsView() {
  const s = useSettingsStore();
  const [confirm, setConfirm] = useState(false);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Preferences are saved in this browser only. Images and products are never stored."
        actions={
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            <RotateCcw className="size-4" /> Reset to defaults
          </Button>
        }
      />
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Image naming" description="Used by the Bulk Renamer and Product Builder." />
          <CardBody className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Separator before the number" htmlFor="sep">
                <Select
                  id="sep"
                  value={s.nameSeparator}
                  options={SEPARATORS}
                  onChange={(e) => s.update({ nameSeparator: e.target.value })}
                />
              </Field>
              <Field label="Product Builder start number" htmlFor="start">
                <Input
                  id="start"
                  type="number"
                  min={0}
                  value={s.startNumber}
                  onChange={(e) => s.update({ startNumber: Math.max(0, Math.floor(e.target.valueAsNumber || 0)) })}
                />
              </Field>
              <Field label="Example">
                <p className="flex h-9 items-center font-mono text-sm">
                  {generateImageName("red-ring", s.startNumber, "webp", { separator: s.nameSeparator })}
                </p>
              </Field>
            </div>
            <Switch
              id="zip-folders"
              label="One folder per product in the ZIP"
              description="Off: all images in one flat folder – easiest to upload to Shopify Files."
              checked={s.zipFolderPerProduct}
              onChange={(v) => s.update({ zipFolderPerProduct: v })}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="CSV defaults" description="Pre-filled values for new products and blank fields." />
          <CardBody>
            <CsvProductForm />
          </CardBody>
        </Card>
      </div>
      <Modal
        open={confirm}
        title="Reset all settings?"
        confirmLabel="Reset"
        tone="danger"
        onClose={() => setConfirm(false)}
        onConfirm={s.reset}
      >
        Naming and CSV defaults go back to their original values.
      </Modal>
    </>
  );
}
