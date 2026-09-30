export const APP_NAME = "Shopify Bulk Studio";
export const APP_TAGLINE = "Create Shopify-ready product files without APIs or complicated setup.";

export type NavItem = { href: string; label: string; icon: "dashboard" | "renamer" | "products" | "csv" | "settings" };
export type NavSection = { title?: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  { items: [{ href: "/", label: "Dashboard", icon: "dashboard" }] },
  { title: "Image tools", items: [{ href: "/renamer", label: "Bulk Renamer", icon: "renamer" }] },
  { title: "Products", items: [{ href: "/products", label: "Product Builder", icon: "products" }] },
  { title: "Shopify", items: [{ href: "/csv", label: "CSV Generator", icon: "csv" }] },
];

export const SETTINGS_NAV: NavItem = { href: "/settings", label: "Settings", icon: "settings" };

/** localStorage key for lightweight settings. Files are never persisted. */
export const SETTINGS_STORAGE_KEY = "sbs-settings-v1";
