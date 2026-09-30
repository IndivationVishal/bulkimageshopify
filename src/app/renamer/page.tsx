import type { Metadata } from "next";
import { RenamerView } from "@/components/renamer/RenamerView";

export const metadata: Metadata = { title: "Bulk Renamer" };

export default function RenamerPage() {
  return <RenamerView />;
}
