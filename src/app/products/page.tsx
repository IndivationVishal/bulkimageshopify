import type { Metadata } from "next";
import { ProductBuilderView } from "@/components/products/ProductBuilderView";

export const metadata: Metadata = { title: "Product Builder" };

export default function ProductsPage() {
  return <ProductBuilderView />;
}
