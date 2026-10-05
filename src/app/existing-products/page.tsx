import type { Metadata } from "next";
import { ExistingImagesView } from "@/components/existing/ExistingImagesView";

export const metadata: Metadata = { title: "Existing Products" };

export default function ExistingProductsPage() {
  return <ExistingImagesView />;
}
