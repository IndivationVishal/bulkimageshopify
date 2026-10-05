"use client";

import { useMemo, useState, type DragEvent } from "react";
import JSZip from "jszip";
import { Download, FileSpreadsheet, FolderArchive, Images, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Steps } from "@/components/layout/Steps";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropzone } from "@/components/ui/Dropzone";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { useNotice } from "@/hooks/useNotice";
import { useRenamerStore } from "@/store/renamer-store";
import { useSettingsStore } from "@/store/settings-store";
import { planProducts } from "@/lib/image/bulk-rename";
import { extractCdnBase } from "@/lib/csv/cdn-parser";
import {
  buildUpdatedExportCsv,
  cdnUrl,
  imageNamesFromPaths,
  matchImagesToProducts,
  parseShopifyExport,
  type ExistingProduct,
  type ExportTable,
} from "@/lib/csv/existing-products";
import { filesFromDataTransfer } from "@/lib/products/folder-reader";
import { downloadBlob, getExtension } from "@/lib/utils/file-utils";
import { pluralize, timestampForFile } from "@/lib/utils/format-utils";

const STEPS = ["Shopify CSV", "Images / ZIP", "CDN link", "Check", "Download CSV"];

/** File names from dropped/picked files: ZIPs are opened, images are taken as-is. */
async function namesFromFiles(files: { file: File; path: string }[]): Promise<string[]> {
  const paths: string[] = [];
  for (const { file, path } of files) {
    if (getExtension(file.name) === "zip") {
      const zip = await JSZip.loadAsync(file);
      zip.forEach((p, entry) => {
        if (!entry.dir) paths.push(p);
      });
    } else {
      paths.push(path);
    }
  }
  return imageNamesFromPaths(paths);
}

export function ExistingImagesView() {
  const { notice, setNotice, clear } = useNotice();
  const [csvName, setCsvName] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingProduct[]>([]);
  const [table, setTable] = useState<ExportTable>({ fields: [], rows: [] });
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const separator = useSettingsStore((s) => s.nameSeparator);
  const renamerProducts = useRenamerStore((s) => s.products);
  const renamerCount = renamerProducts.reduce((n, p) => n + p.files.length, 0);

  const base = link.trim() ? extractCdnBase(link) : null;
  const match = useMemo(
    () => matchImagesToProducts(existing, imageNames, separator),
    [existing, imageNames, separator],
  );
  const withImages = match.products.filter((p) => p.images.length > 0);
  const withoutImages = match.products.filter((p) => p.images.length === 0);
  const matchedCount = withImages.reduce((n, p) => n + p.images.length, 0);
  const alreadyHaveImages = withImages.filter((p) => p.existingImages > 0);
  const ready = existing.length > 0 && matchedCount > 0 && !!base;

  const step = !existing.length ? 0 : !imageNames.length ? 1 : !base ? 2 : ready ? 4 : 3;

  const loadCsv = async (files: FileList | File[]) => {
    const file = Array.from(files).find((f) => getExtension(f.name) === "csv") ?? Array.from(files)[0];
    if (!file) return;
    const r = parseShopifyExport(await file.text());
    if (r.error) {
      setNotice({ tone: "danger", title: "Could not read the CSV", body: r.error });
      return;
    }
    setExisting(r.products);
    setTable(r.table);
    setCsvName(file.name);
    setNotice({ tone: "success", title: `${pluralize(r.products.length, "product")} found in the CSV` });
  };

  const addNames = (names: string[]) => {
    if (!names.length) {
      setNotice({ tone: "warning", title: "No images found", body: "Add the ZIP of renamed images, the images, or a folder." });
      return;
    }
    setImageNames((prev) => [...new Set([...prev, ...names])]);
    setNotice({ tone: "success", title: `${pluralize(names.length, "image")} found` });
  };

  const loadImages = (files: { file: File; path: string }[]) =>
    namesFromFiles(files)
      .then(addNames)
      .catch(() => setNotice({ tone: "danger", title: "Could not read the ZIP or images." }));

  const fromRenamer = () =>
    addNames(
      planProducts(renamerProducts, { separator })
        .filter((p) => p.ordered.length > 0 && !p.error)
        .flatMap((p) => p.preview.map((x) => x.newName)),
    );

  const downloadCsv = () => {
    if (!base) return;
    const text = buildUpdatedExportCsv(table, withImages, base, { replaceExisting });
    downloadBlob(new Blob([text], { type: "text/csv;charset=utf-8" }), `shopify-images-update_${timestampForFile()}.csv`);
  };

  const resetAll = () => {
    setExisting([]);
    setTable({ fields: [], rows: [] });
    setCsvName(null);
    setImageNames([]);
    setLink("");
    clear();
  };

  return (
    <>
      <PageHeader
        title="Add Images to Existing Products"
        description="Add images to products that already exist in Shopify. Provide your Shopify export CSV, the renamed images (pink1.jpg, pink2.jpg…) and one CDN link. You get your own CSV back with the images filled in; everything else stays the same."
      />
      <Steps steps={STEPS} current={step} />

      {notice && (
        <Alert tone={notice.tone} title={notice.title} onClose={clear} className="mb-4">
          {notice.body}
        </Alert>
      )}

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="1. Shopify product CSV"
              description="The CSV from Shopify admin → Products → Export. It gives the real handle of every product."
            />
            <CardBody className="flex flex-col gap-3">
              <Dropzone
                compact={!!csvName}
                multiple={false}
                accept=".csv,text/csv"
                icon={<FileSpreadsheet className={csvName ? "size-4" : "size-6"} />}
                title={csvName ? "Use a different CSV" : "Drop your Shopify export CSV here"}
                description={csvName ? undefined : "or click to choose a file"}
                onFiles={loadCsv}
                onDrop={(e: DragEvent) => loadCsv(e.dataTransfer.files)}
              />
              {csvName && (
                <p className="text-sm text-muted">
                  <span className="font-medium text-text">{csvName}</span> · {pluralize(existing.length, "product")}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="2. Renamed images"
              description="The same ZIP / images you uploaded to Shopify → Content → Files. Only the file names are read."
            />
            <CardBody className="flex flex-col gap-3">
              <Dropzone
                compact={imageNames.length > 0}
                accept=".zip,application/zip,image/*"
                icon={<FolderArchive className={imageNames.length ? "size-4" : "size-6"} />}
                title={imageNames.length ? "Add more ZIPs / images" : "Drop a ZIP, images or a folder here"}
                description={imageNames.length ? undefined : "e.g. pink1.jpg, pink2.jpg, blue1.png"}
                onFiles={(list) => loadImages(Array.from(list).map((file) => ({ file, path: file.name })))}
                onDrop={(e: DragEvent) => {
                  filesFromDataTransfer(e.dataTransfer)
                    .then(loadImages)
                    .catch(() => setNotice({ tone: "danger", title: "Could not read the files." }));
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                {renamerCount > 0 && (
                  <Button variant="secondary" size="sm" onClick={fromRenamer}>
                    <Images className="size-3.5" /> Use images from Bulk Renamer ({pluralize(renamerCount, "image")})
                  </Button>
                )}
                {imageNames.length > 0 && (
                  <>
                    <span className="text-sm text-muted">{pluralize(imageNames.length, "image")} loaded</span>
                    <Button variant="ghost" size="sm" onClick={() => setImageNames([])}>
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="3. One CDN link"
            description="Copy the link of any one image uploaded to Shopify Files. The other links are built from the file names."
          />
          <CardBody className="flex flex-col gap-2">
            <Input
              aria-label="One Shopify image link"
              aria-invalid={link.trim() !== "" && !base}
              className="font-mono text-xs"
              spellCheck={false}
              placeholder="https://cdn.shopify.com/s/files/1/0842/3099/6221/files/pink1.jpg?v=1790770489"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            {link.trim() !== "" && !base && (
              <p className="text-xs text-danger">This is not a valid link. Paste a link that starts with https://.</p>
            )}
            {base && (
              <p className="text-xs text-muted">
                Store folder: <span className="font-mono text-text">{base}</span>
              </p>
            )}
          </CardBody>
        </Card>

        {existing.length > 0 && imageNames.length > 0 && (
          <Card>
            <CardHeader
              title="4. Review"
              description="Images per product. Click a link to check that the image opens."
              action={
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="success">{pluralize(withImages.length, "product")} matched</Badge>
                  <Badge tone="success">{pluralize(matchedCount, "image")}</Badge>
                  {withoutImages.length > 0 && <Badge tone="warning">{withoutImages.length} without images</Badge>}
                  {match.unmatched.length > 0 && <Badge tone="danger">{match.unmatched.length} unmatched</Badge>}
                </div>
              }
            />
            <CardBody className="flex flex-col gap-4">
              {alreadyHaveImages.length > 0 && (
                <Alert tone="warning" title={`${pluralize(alreadyHaveImages.length, "product")} already have images`}>
                  {alreadyHaveImages
                    .slice(0, 5)
                    .map((p) => p.handle)
                    .join(", ")}
                  {alreadyHaveImages.length > 5 ? "…" : ""}. Choose below whether to keep or remove the existing images.
                </Alert>
              )}

              {withImages.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <div className="grid grid-cols-[1fr_1fr_70px] gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[11px] font-semibold tracking-wide text-subtle uppercase max-sm:grid-cols-[1fr_60px]">
                    <span>Product</span>
                    <span className="max-sm:hidden">Images</span>
                    <span className="text-right">Count</span>
                  </div>
                  <ul className="max-h-[480px] divide-y divide-border overflow-y-auto text-sm">
                    {withImages.map((p) => (
                      <li key={p.handle} className="grid grid-cols-[1fr_1fr_70px] items-center gap-3 px-3 py-2 max-sm:grid-cols-[1fr_60px]">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-[13px] font-medium">{p.handle}</p>
                          <p className="truncate text-xs text-muted">
                            {p.title}
                            {p.images.some((i) => i.matchedBy === "title") && (
                              <span className="ml-1 text-warning">· matched by title</span>
                            )}
                          </p>
                        </div>
                        <p className="truncate font-mono text-xs text-muted max-sm:hidden">
                          {base ? (
                            <a href={cdnUrl(base, p.images[0].fileName)} target="_blank" rel="noreferrer" className="underline">
                              {p.images[0].fileName}
                            </a>
                          ) : (
                            p.images[0].fileName
                          )}
                          {p.images.length > 1 ? ` … ${p.images.at(-1)!.fileName}` : ""}
                        </p>
                        <span className="text-right tabular-nums">{p.images.length}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {match.unmatched.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-danger">
                    {pluralize(match.unmatched.length, "image")} did not match any product (not included in the CSV)
                  </p>
                  <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border text-xs">
                    {match.unmatched.map((u) => (
                      <li key={u.fileName} className="flex justify-between gap-3 px-3 py-1.5">
                        <span className="truncate font-mono">{u.fileName}</span>
                        <span className="shrink-0 text-muted">{u.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {withoutImages.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted">
                    {pluralize(withoutImages.length, "product")} have no images
                  </summary>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-subtle">
                    {withoutImages.map((p) => p.handle).join(", ")}
                  </p>
                </details>
              )}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="5. CSV download" />
          <CardBody className="flex flex-col gap-3">
            <Switch
              id="replace-existing"
              label="Remove existing images"
              description="Off: existing images are kept and the new images are added after them. On: only the new images are kept."
              checked={replaceExisting}
              onChange={setReplaceExisting}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={downloadCsv} disabled={!ready}>
                <Download className="size-4" /> Download CSV ({pluralize(matchedCount, "image")})
              </Button>
              <Button size="lg" variant="ghost" onClick={resetAll}>
                <RotateCcw className="size-4" /> Start over
              </Button>
            </div>
            {!ready && (
              <p className="text-xs text-subtle">
                {!existing.length
                  ? "Add your Shopify CSV first."
                  : !matchedCount
                    ? "Add images whose names match the handles in the CSV."
                    : "Paste a CDN link."}
              </p>
            )}
            <p className="text-xs text-muted">
              This is your own export CSV, limited to the products that received images. Every column and variant is unchanged; only{" "}
              <span className="font-mono">Image Src, Image Position, Image Alt Text</span> are filled in. Import it in Shopify
              admin → Products → Import and tick{" "}
              <span className="font-medium text-text">“Overwrite products with matching handles”</span>.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
