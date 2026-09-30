"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Steps } from "@/components/layout/Steps";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { useRenamerStore } from "@/store/renamer-store";
import { useRenameImages } from "@/hooks/useRenameImages";
import { useNotice } from "@/hooks/useNotice";
import { pluralize } from "@/lib/utils/format-utils";
import { ImageDropzone } from "./ImageDropzone";
import { ProductForm } from "./ProductForm";
import { RenameToolbar, type ViewMode } from "./RenameToolbar";
import { ImagePreviewGrid } from "./ImagePreviewGrid";
import { RenamePreviewTable } from "./RenamePreviewTable";
import { RenameProgress } from "./RenameProgress";

const STEPS = ["Upload", "Product details", "Sort", "Preview", "Rename", "Download"];

export function RenamerView() {
  const hasFiles = useRenamerStore((s) => s.files.length > 0);
  const reset = useRenamerStore((s) => s.reset);
  const { notice, setNotice, clear } = useNotice();
  const [view, setView] = useState<ViewMode>("grid");
  const [confirmClear, setConfirmClear] = useState(false);
  const [sentHandle, setSentHandle] = useState<string | null>(null);
  const r = useRenameImages();

  const step = !hasFiles ? 0 : r.handleError ? 1 : r.status === "zipping" ? 4 : r.status === "done" ? 5 : 3;

  return (
    <>
      <PageHeader
        title="Bulk Image Renamer"
        description="Rename hundreds of product images into a consistent, Shopify-friendly format like red-ring1.webp. Everything runs in your browser."
      />
      <Steps steps={STEPS} current={step} />

      {notice && (
        <Alert tone={notice.tone} title={notice.title} onClose={clear} className="mb-4">
          {notice.body}
        </Alert>
      )}

      {!hasFiles ? (
        <ImageDropzone onReport={setNotice} />
      ) : (
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Product details" description="The handle becomes the base of every file name." />
            <CardBody>
              <ProductForm handleError={r.handleError} />
            </CardBody>
          </Card>

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
            <CardHeader title="Rename" description={`${pluralize(r.ordered.length, "file")} will be renamed and zipped.`} />
            <CardBody>
              <RenameProgress
                count={r.ordered.length}
                status={r.status}
                progress={r.progress}
                error={r.error}
                canRename={r.canRename}
                sentHandle={sentHandle}
                onDownload={r.downloadZip}
                onSend={() => setSentHandle(r.sendToProducts())}
              />
            </CardBody>
          </Card>
        </div>
      )}

      <Modal
        open={confirmClear}
        title="Clear all images?"
        confirmLabel="Clear all"
        tone="danger"
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          reset();
          r.resetStatus();
          setSentHandle(null);
          clear();
        }}
      >
        This removes every image and the product details from the renamer. Your original files are not touched.
      </Modal>
    </>
  );
}
