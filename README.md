# HQD Aggregate Catalogue

Astro 6 static website. Product catalogue, filterable product finder, 11 model pages, technical drawings, local shortlist, comparison, and email-draft enquiries.

## Run

Requires Node.js 22.12+ and pnpm 11.25.0.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm preview
```

## Content

- `src/data/products.json`: product facts and independently written summaries.
- `data/category-listings.json`: all 12 entries across the two HQD category pages.
- `data/source-audit.json`: one duplicate redirect, one unavailable detail URL, and collection date.
- `data/assets.json`: original HQD image URLs and matching local WebP assets.
- `data/brand.json`: official HQD logo source and verified homepage blue (`#004892`).
- `data/font-sources.json`: self-hosted Open Sans / Barlow Condensed; OFL licenses in `public/fonts/`.
- `data/source/`: local research only; ignored by Git.

The inaccessible AD-ISO30-ER25 listing uses the parameters supplied by the project owner in the originating conversation. The category thumbnail provides its matching photo. The 12th category listing redirects to the existing fixed 45° model and is recorded as an alias rather than invented as a separate product.

HQD supplies the official logo and blue (`#004892`) brand palette. ATEMAG supplied visual reference only for industrial page hierarchy. No ATEMAG product descriptions, technical specifications, images, logo, HTML or CSS are used in the website.

## Enquiries and privacy

No email backend is configured. Contact prepares an email draft; visitors review and send it in their own email app. Shortlist data stays in browser local storage. No analytics or third-party font requests are added.

## Hosting

`.openai/hosting.json` contains the private Site identity and static `dist` output configuration. Credentials are not stored in the project.
