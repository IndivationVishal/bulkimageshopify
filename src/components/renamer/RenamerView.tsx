"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Steps } from "@/components/layout/Steps";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { selectActive, useRenamerStore } from "@/store/renamer-store";
import { useRenameImages } from "@/hooks/useRenameImages";
import { useNotice } from "@/hooks/useNotice";
import { pluralize } from "@/lib/utils/format-utils";
import { ImageDropzone } from "./ImageDropzone";
import { ProductForm } from "./ProductForm";
import { ProductTabs } from "./ProductTabs";
import { RenameToolbar, type ViewMode } from "./RenameToolbar";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { RenamePreviewTable } from "./RenamePreviewTable";
import { RenameProgress } from "./RenameProgress";
import { BulkExport } from "./BulkExport";

const STEPS = ["Upload", "Product details", "Sort", "Preview", "Rename", "Download"];

export function RenamerView() {
  const products = useRenamerStore((s) => s.products);
  const active = useRenamerStore(selectActive);
  const setActive = useRenamerStore((s) => s.setActive);
  const clearProduct = useRenamerStore((s) => s.clearProduct);
  const removeProduct = useRenamerStore((s) => s.removeProduct);
  const reset = useRenamerStore((s) => s.reset);
  const { notice, setNotice, clear } = useNotice();
  const [view, setView] = useState<ViewMode>("grid");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [sent, setSent] = useState<{ id: string; handle: string } | null>(null);
  const [sentAll, setSentAll] = useState<number | null>(null);
  const r = useRenameImages();

  const hasFiles = active.files.length > 0;
  const isEmpty = products.length === 1 && !hasFiles;
  const multi = products.length > 1;
  const job = r.activeJob;
  const step = !hasFiles ? 0 : r.handleError ? 1 : job.status === "zipping" ? 4 : job.status === "done" ? 5 : 3;
  const names = useMemo(
    () => new Map(products.map((p, i) => [p.id, p.productName.trim() || `Product ${i + 1}`])),
    [products],
  );

  const requestRemove = (id: string) => {
    if (products.find((p) => p.id === id)?.files.length) setConfirmRemove(id);
    else removeProduct(id);
  };

  return (
    <>
      <PageHeader
        title="Bulk Image Renamer"
        description="Rename hundreds of product images into a consistent, Shopify-friendly format like red-ring1.webp. Add as many products as you like and download them all in one ZIP. Everything runs in your browser."
      />
      <Steps steps={STEPS} current={step} />

      {notice && (
        <Alert tone={notice.tone} title={notice.title} onClose={clear} className="mb-4">
          {notice.body}
        </Alert>
      )}

      {isEmpty ? (
        <ImageDropzone onReport={setNotice} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader
              title="Products"
              description="Each product gets its own folder in the bulk ZIP. Tip: drop a folder of product folders to add them all at once."
              action={
                multi ? (
                  <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                    <Trash2 className="size-3.5" /> Remove all
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              <ProductTabs plans={r.plans} onRemove={requestRemove} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Product details" description="The handle becomes the base of every file name." />
            <CardBody>
              <ProductForm handleError={r.handleError} />
            </CardBody>
          </Card>

          {hasFiles ? (
            <>
              <Card>
                <CardHeader
                  title="Arrange & preview"
                  description="Drag images or use the arrows to set the order. Image #1 becomes the main product image."
                />
                <CardBody className="flex flex-col gap-4">
                  <RenameToolbar view={view} onView={setView} onClear={() => setConfirmClear(true)} />
                  {view === "grid" ? (
                    <ImagePreviewGrid files={r.ordered} preview={r.preview} />
                  ) : (
                    <RenamePreviewTable files={r.ordered} preview={r.preview} />
                  )}
                  <ImageDropzone onReport={setNotice} compact />
                </CardBody>
              </Card>

              <Card>
                <CardHeader
                  title={multi ? "Rename this product" : "Rename"}
                  description={`${pluralize(r.ordered.length, "file")} will be renamed and zipped.`}
                />
                <CardBody>
                  <RenameProgress
                    count={r.ordered.length}
                    status={job.status}
                    progress={job.progress}
                    error={job.error}
                    canRename={r.canRename}
                    sentHandle={sent?.id === active.id ? sent.handle : null}
                    onDownload={r.downloadZip}
                    onSend={() => setSent({ id: active.id, handle: r.sendToProducts() })}
                  />
                </CardBody>
              </Card>
            </>
          ) : (
            <ImageDropzone onReport={setNotice} />
          )}

          {multi && (
            <Card>
              <CardHeader
                title="Download all products"
                description="One ZIP with a folder per product, e.g. red-ring/red-ring1.jpg, blue-ring/blue-ring1.jpg."
              />
              <CardBody>
                <BulkExport
                  plans={r.plans}
                  names={names}
                  status={r.allJob.status}
                  progress={r.allJob.progress}
                  error={r.allJob.error}
                  canRename={r.canRenameAll}
                  sentCount={sentAll}
                  onDownload={r.downloadAllZip}
                  onSend={() => setSentAll(r.sendAllToProducts().length)}
                  onSelect={setActive}
                />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={confirmClear}
        title="Clear this product?"
        confirmLabel="Clear product"
        tone="danger"
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearProduct();
          r.resetStatus();
          setSent(null);
          clear();
        }}
      >
        This removes every image and the details of this product from the renamer. Your original files are not touched.
      </Modal>

      <Modal
        open={confirmRemove !== null}
        title="Remove this product?"
        confirmLabel="Remove"
        tone="danger"
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) removeProduct(confirmRemove);
          r.resetStatus();
        }}
      >
        Its images are removed from the renamer. Your original files are not touched.
      </Modal>

      <Modal
        open={confirmReset}
        title="Remove all products?"
        confirmLabel="Remove all"
        tone="danger"
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          r.resetStatus();
          setSent(null);
          setSentAll(null);
          clear();
        }}
      >
        Every product and image is removed from the renamer. Your original files are not touched.
      </Modal>
    </>
  );
}
