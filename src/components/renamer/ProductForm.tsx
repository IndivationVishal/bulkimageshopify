"use client";

import { useShallow } from "zustand/react/shallow";
import { Field, Input } from "@/components/ui/Input";
import { selectActive, useRenamerStore } from "@/store/renamer-store";
import { useSettingsStore } from "@/store/settings-store";
import { generateImageName } from "@/lib/image/image-naming";

export function ProductForm({ handleError }: { handleError: string | null }) {
  const { productName, handle, startNumber, setProductName, setHandle, setStartNumber, fileCount } = useRenamerStore(
    useShallow((s) => {
      const p = selectActive(s);
      return {
        productName: p.productName,
        handle: p.handle,
        startNumber: p.startNumber,
        setProductName: s.setProductName,
        setHandle: s.setHandle,
        setStartNumber: s.setStartNumber,
        fileCount: p.files.length,
      };
    }),
  );
  const separator = useSettingsStore((s) => s.nameSeparator);
  const example = generateImageName(handle.replace(/^-+|-+$/g, "") || "red-ring", startNumber, "webp", { separator });

  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
      <Field label="Product name" htmlFor="product-name">
        <Input
          id="product-name"
          placeholder="Red Ring"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <Field
        label="Handle"
        htmlFor="product-handle"
        error={fileCount > 0 && handle ? (handleError ?? undefined) : undefined}
        hint={<>Files will be named <span className="font-mono text-text">{example}</span></>}
      >
        <Input
          id="product-handle"
          placeholder="red-ring"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          aria-invalid={fileCount > 0 && !!handle && !!handleError}
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <Field label="Start number" htmlFor="start-number">
        <Input
          id="start-number"
          type="number"
          min={0}
          value={startNumber}
          onChange={(e) => setStartNumber(e.target.valueAsNumber)}
        />
      </Field>
    </div>
  );
}
