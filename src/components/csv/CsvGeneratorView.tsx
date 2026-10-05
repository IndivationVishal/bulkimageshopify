"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Steps } from "@/components/layout/Steps";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useCsvGenerator } from "@/hooks/useCsvGenerator";
import { useProductStore } from "@/store/product-store";
import { useSettingsStore } from "@/store/settings-store";
import { parseTags } from "@/lib/products/product-mapper";
import { pluralize } from "@/lib/utils/format-utils";
import { CdnBaseInput } from "./CdnBaseInput";
import { CdnUrlInput } from "./CdnUrlInput";
import { ImageMappingTable } from "./ImageMappingTable";
import { CsvProductForm } from "./CsvProductForm";
import { CsvPreviewTable } from "./CsvPreviewTable";
import { CsvExportButton } from "./CsvExportButton";

const STEPS = ["Paste CDN URLs", "Map to products", "Defaults", "Validate", "Export"];

export function CsvGeneratorView() {
  const csv = useCsvGenerator();
  const updateAll = () => {
    const d = useSettingsStore.getState().csv;
    const { products, setProducts } = useProductStore.getState();
    setProducts(
      products.map((p) => ({
        ...p,
        price: d.price,
        inventory: d.inventory,
        status: d.status,
        tags: parseTags(d.tags),
        vendor: d.vendor,
        productType: d.productType,
      })),
    );
  };

  const mappedImages = csv.products.reduce((n, p) => n + p.images.filter((i) => i.src).length, 0);
  const step =
    csv.products.length === 0
      ? csv.parsed.images.length
        ? 1
        : 0
      : mappedImages === 0
        ? 1
        : csv.blocked
          ? 3
          : 4;

  return (
    <>
      <PageHeader
        title="Product CSV Generator"
        description="Paste the Shopify CDN URLs of your uploaded images. They are matched to products by file name (red-ring2.webp → red-ring, image 2) and turned into an import-ready CSV."
      />
      <Steps steps={STEPS} current={step} />

      <Alert tone="info" title="Products Shopify me pehle se bane hain?" className="mb-5">
        Sirf images lagani hain to{" "}
        <Link href="/existing-products" className="font-medium underline">
          Existing Products
        </Link>{" "}
        use karo. Shopify export CSV + renamed images se images-only CSV banti hai, title/description safe rehte hain.
      </Alert>

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader
            title="Quick way: sirf ek link paste karo"
            description="Shopify Files me se koi bhi ek uploaded image ka link daalo. Baaki sabhi images ke links file naam se khud ban jayenge."
          />
          <CardBody>
            <CdnBaseInput
              value={csv.cdnBase}
              onChange={csv.setCdnBase}
              imageCount={csv.imageCount}
              result={csv.baseResult}
              onApply={csv.applyBase}
            />
          </CardBody>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Ya: sabhi links khud paste karo"
              description="Agar aapke paas har image ka link hai. Ek line me ek link."
            />
            <CardBody>
              <CdnUrlInput
                value={csv.cdnText}
                onChange={csv.setCdnText}
                parsed={csv.parsed}
                createMissing={csv.createMissing}
                onCreateMissing={csv.setCreateMissing}
                onApply={csv.applyUrls}
                onClear={csv.clearUrls}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="URL mapping"
              description={
                csv.parsed.images.length
                  ? `${pluralize(csv.parsed.images.length, "URL")} detected`
                  : "Detected handles and image numbers appear here."
              }
            />
            <CardBody className="flex flex-col gap-3">
              {csv.lastApply && (
                <Alert
                  tone={csv.lastApply.unmatched.length ? "warning" : "success"}
                  title={`${pluralize(csv.lastApply.matched, "URL")} mapped${
                    csv.lastApply.created ? `, ${pluralize(csv.lastApply.created, "product")} created` : ""
                  }`}
                >
                  {csv.lastApply.unmatched.length > 0 &&
                    `${pluralize(csv.lastApply.unmatched.length, "URL")} skipped because no product has that handle.`}
                </Alert>
              )}
              {csv.parsed.images.length ? (
                <ImageMappingTable images={csv.parsed.images} knownHandles={csv.knownHandles} />
              ) : (
                <p className="text-sm text-muted">
                  {csv.products.length
                    ? `${pluralize(csv.products.length, "product")} loaded from the `
                    : "No products yet. Build them in the "}
                  <Link href="/products" className="font-medium text-accent underline">
                    Product Builder
                  </Link>
                  {csv.products.length ? "." : ", or just paste URLs and products are created from the file names."}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Product defaults" description="Saved in this browser. Used for new products and blank fields." />
          <CardBody>
            <CsvProductForm onApplyAll={updateAll} disabled={csv.products.length === 0} />
          </CardBody>
        </Card>

        {csv.products.length > 0 && (
          <Card>
            <CardHeader
              title="CSV preview"
              description={`${pluralize(csv.products.length, "product")} · ${pluralize(csv.rows.length, "row")}. Edit titles, prices and descriptions in the Product Builder.`}
            />
            <CardBody>
              <CsvPreviewTable rows={csv.rows} />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Validate & export" />
          <CardBody>
            <CsvExportButton
              issues={csv.issues}
              blocked={csv.blocked}
              rowCount={csv.rows.length}
              getCsv={csv.csvText}
              fileName={csv.fileName}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
