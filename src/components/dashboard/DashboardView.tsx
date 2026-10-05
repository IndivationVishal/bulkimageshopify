"use client";

import Link from "next/link";
import { ArrowRight, FileSpreadsheet, FolderTree, Images, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { useProductStore } from "@/store/product-store";
import { useRenamerStore } from "@/store/renamer-store";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/app";
import { formatNumber } from "@/lib/utils/format-utils";

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </Card>
  );
}

function ToolCard({
  href,
  icon,
  title,
  children,
  step,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  step: number;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-accent-soft p-2 text-accent">{icon}</span>
        <span className="text-xs text-subtle">Step {step}</span>
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{children}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent">
        Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function DashboardView() {
  const products = useProductStore((s) => s.products);
  const renamerFiles = useRenamerStore((s) => s.products.reduce((n, p) => n + p.files.length, 0));
  const productImages = products.reduce((n, p) => n + p.images.length, 0);
  const mapped = products.reduce((n, p) => n + p.images.filter((i) => i.src).length, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{APP_NAME}</h1>
        <p className="mt-2 max-w-xl text-muted">{APP_TAGLINE}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={products.length} hint="In the Product Builder" />
        <StatCard label="Images" value={productImages + renamerFiles} hint={`${formatNumber(renamerFiles)} in the renamer`} />
        <StatCard label="CDN URLs mapped" value={mapped} hint="Ready for the CSV" />
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold tracking-wider text-subtle uppercase">Tools</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ToolCard href="/renamer" icon={<Images className="size-5" />} title="Bulk Image Renamer" step={1}>
            Rename hundreds of images for one product into a consistent Shopify-friendly format.
          </ToolCard>
          <ToolCard href="/products" icon={<FolderTree className="size-5" />} title="Product Builder" step={2}>
            Drop a folder of product folders. Each becomes a product with renamed images.
          </ToolCard>
          <ToolCard href="/csv" icon={<FileSpreadsheet className="size-5" />} title="Product CSV Generator" step={3}>
            Paste CDN image URLs and generate a Shopify-ready product import CSV.
          </ToolCard>
        </div>
      </section>

      <Card className="flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
        <div className="text-sm">
          <p className="font-medium">100% local</p>
          <p className="mt-0.5 text-muted">
            No Shopify API, no account, no server. Images are read and zipped in your browser and never uploaded.
            Work in progress is kept only while this tab is open; preferences are saved in this browser.
          </p>
        </div>
      </Card>
    </div>
  );
}
