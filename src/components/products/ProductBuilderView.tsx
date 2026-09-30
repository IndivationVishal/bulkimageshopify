"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useProducts } from "@/hooks/useProducts";
import { useNotice } from "@/hooks/useNotice";
import { useProductStore } from "@/store/product-store";
import { ProductFolderDropzone } from "./ProductFolderDropzone";
import { ProductSummary } from "./ProductSummary";
import { ProductList } from "./ProductList";

export function ProductBuilderView() {
  const { notice, setNotice, clear } = useNotice();
  const [renamedMode, setRenamedMode] = useState(false);
  const { products, onDrop, onFiles, updateProduct, renumberAll, downloadZip, zipProgress } = useProducts(setNotice, renamedMode);
  const removeProduct = useProductStore((s) => s.removeProduct);
  const clearAll = useProductStore((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <>
      <PageHeader
        title="Product Builder"
        description="Drop a folder of product folders. Each folder becomes a product, its images are renamed from the handle, and you can edit details before exporting."
      />

      {notice && (
        <Alert tone={notice.tone} title={notice.title} onClose={clear} className="mb-4">
          {notice.body}
        </Alert>
      )}

      <Card className="mb-4 px-5 py-3">
        <Switch
          id="renamed-mode"
          label="My images are already renamed (like red-ring1.png)"
          description="Use this after a refresh or for images you already uploaded to Shopify. Products are built from the file names and nothing is renamed again."
          checked={renamedMode}
          onChange={setRenamedMode}
        />
      </Card>

      {products.length === 0 ? (
        <div className="flex flex-col gap-4">
          <ProductFolderDropzone onDrop={onDrop} onFiles={onFiles} renamedMode={renamedMode} />
          <Card>
            <CardBody className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-medium">Expected folder layout</p>
                <pre className="mt-2 rounded-lg bg-surface-2 p-3 font-mono text-xs leading-relaxed text-muted">
{`Products/
├── Red Ring/
│   ├── front.jpg
│   └── side.jpg
├── Blue Ring/
└── Gold Ring/`}
                </pre>
              </div>
              <div>
                <p className="font-medium">What happens</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-muted">
                  <li>Folder name → product title → handle (Red Ring → red-ring).</li>
                  <li>Images sorted naturally and renamed: red-ring1.jpg, red-ring2.jpg…</li>
                  <li>Download the ZIP and upload it to Shopify → Content → Files.</li>
                  <li>Paste the CDN URLs in the CSV Generator and export.</li>
                </ol>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Summary" />
            <CardBody>
              <ProductSummary
                products={products}
                zipProgress={zipProgress}
                onDownload={downloadZip}
                onRenumber={() => {
                  renumberAll();
                  setNotice({ tone: "success", title: "Image names updated from current settings" });
                }}
                onClear={() => setConfirmClear(true)}
              />
            </CardBody>
          </Card>
          <ProductList products={products} onUpdate={updateProduct} onRemove={removeProduct} />
          <ProductFolderDropzone onDrop={onDrop} onFiles={onFiles} compact renamedMode={renamedMode} />
        </div>
      )}

      <Modal
        open={confirmClear}
        title="Remove all products?"
        confirmLabel="Remove all"
        tone="danger"
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          clear();
        }}
      >
        Products, edits and mapped CDN URLs will be cleared. Files on your computer are not touched.
      </Modal>
    </>
  );
}
