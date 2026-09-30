# Shopify Bulk Studio

Create Shopify-ready product files without APIs or complicated setup.
Everything runs in the browser: no Shopify API, no database, no login, no server uploads.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for the business logic
npm run build      # production build
```

## Workflow

1. **Bulk Renamer** (`/renamer`): drop images for one product, set the name, sort or drag to reorder, then download a ZIP of `red-ring1.webp`, `red-ring2.webp`, … or send them to the Product Builder.
2. **Product Builder** (`/products`): drop a folder of product folders. Each sub-folder becomes a product and its images are renamed from the handle. Edit title, handle, price, stock, status, tags and description. Download all renamed images as one ZIP.
3. Upload the ZIP contents in Shopify admin → Content → Files and copy the file URLs.
4. **CSV Generator** (`/csv`): paste the CDN URLs. They are matched by file name (`red-ring2_xxx.webp` → product `red-ring`, image 2). Unknown handles can create products automatically. Validate, then download the CSV and import it in Shopify admin → Products → Import.

## Naming rules

- Handle = slugified product name: `Red Ring (Gold)` → `red-ring-gold`.
- Image name = `{handle}{separator}{n}.{ext}`. The separator is set in Settings and is empty by default.
- If a handle ends in a digit, a hyphen is always inserted (`ring-2024-1.jpg`) so the number stays unambiguous.
- Duplicate handles get `-2`, `-3`, … appended.

## Architecture

```
src/
  app/          routes only (thin server pages that render client views)
  components/   UI only: layout/, ui/, renamer/, products/, csv/, settings/, dashboard/
  lib/          business logic, framework-free and unit tested
    image/      naming, sorting, validation
    products/   folder reader, folder parser, handle generator, product mapper
    csv/        Shopify columns, CDN URL parser, CSV generator, validator (zod)
    zip/        JSZip wrapper
    utils/ constants/
  hooks/        React behavior that connects stores to lib
  store/        Zustand stores (renamer, products in memory; settings persisted)
  types/        shared TypeScript types
```

Only lightweight preferences are saved to `localStorage`. `File` objects stay in memory and object URLs are revoked when images are removed.
Large image sets use virtualized lists, so only visible thumbnails are rendered.
