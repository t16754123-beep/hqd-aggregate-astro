# HQD Aggregate Catalogue

Astro 6 static website. Product catalogue, filterable product finder, 11 model pages, technical drawings, local shortlist, comparison, and direct email enquiries.

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

Cloudflare Pages Functions handles `POST /api/enquiry` through `functions/api/enquiry.js` and `server/enquiry.mjs`. Valid submissions are sent through FormSubmit to the fixed recipient `lisa@hqd-spindlemotor.com`; customer addresses are used only as Reply-To. No SMTP/API secrets are required or embedded in the frontend.

**First-use activation:** FormSubmit sends an activation email to the recipient mailbox when this website's form is first submitted. The mailbox owner must click its activation link. Provider activation responses return an error rather than a false success. A provider acceptance response confirms submission, not inbox delivery; verify an actual test email with the mailbox owner before calling the service fully active.

Requests have same-origin checks, body/field limits, a honeypot, and best-effort per-IP throttling using the Cloudflare Cache API (one submission per minute at the serving data center; not a global atomic rate limiter). Provider failures preserve form inputs and offer direct email as a fallback. No autoresponder is enabled. The server does not log enquiry content or save enquiries in a database. FormSubmit documents a 30-day submission archive. The privacy page explains third-party processing.

`pnpm test` mocks the mail provider and never sends real messages. `astro dev` serves only the frontend; to run Pages Functions locally, build and run `wrangler pages dev dist`. Do not submit real recipient data during automated browser QA. Production Pages continues to use `npm run build` and `dist`.

Shortlist data stays in browser local storage. No advertising analytics or third-party font requests are added.

## Hosting

`.openai/hosting.json` contains the private Site identity and static `dist` output configuration. Credentials are not stored in the project.
