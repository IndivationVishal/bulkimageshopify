import { FileSpreadsheet, FolderTree, ImagePlus, Images, LayoutDashboard, Settings } from "lucide-react";
import type { NavItem } from "@/lib/constants/app";

const icons = {
  dashboard: LayoutDashboard,
  renamer: Images,
  products: FolderTree,
  csv: FileSpreadsheet,
  existing: ImagePlus,
  settings: Settings,
} satisfies Record<NavItem["icon"], unknown>;

export function NavIcon({ name, className }: { name: NavItem["icon"]; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} aria-hidden />;
}
