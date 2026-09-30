import type { Metadata } from "next";
import { CsvGeneratorView } from "@/components/csv/CsvGeneratorView";

export const metadata: Metadata = { title: "CSV Generator" };

export default function CsvPage() {
  return <CsvGeneratorView />;
}
