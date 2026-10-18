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

The browser sends enquiries to FormSubmit's documented AJAX endpoint for `lisa@hqd-spindlemotor.com`, using `src/lib/enquiry.mjs`. The form also supports a native FormSubmit POST without JavaScript. Customer addresses are used as Reply-To. No SMTP/API secrets are required or embedded in the frontend. Cloudflare Pages hosts the static site and does not relay or store enquiry bodies.

**First-use activation:** FormSubmit sends an activation email to the recipient mailbox when this website's form is first submitted. The mailbox owner must click its activation link. Provider activation responses return an error rather than a false success. A provider acceptance response confirms submission, not inbox delivery; verify an actual test email with the mailbox owner before calling the service fully active.

The browser validates field lengths and email format, allowlists outgoing fields, and includes FormSubmit's honeypot. FormSubmit controls server-side abuse protection and rate limits; browser validation is not a security boundary. No CAPTCHA or provider security control is disabled. Provider failures preserve form inputs and offer direct email as a fallback. No autoresponder is enabled. The website has no enquiry database or application logs. FormSubmit documents a 30-day submission archive. The privacy page explains third-party processing.

`pnpm test` mocks the mail provider and never sends real messages. Do not submit the live form during automated browser QA unless a real test email is explicitly authorized. Production Pages uses `npm run build` and `dist`. The earlier Pages Function relay was removed after production tests showed upstream HTTP 429 responses from the shared server connection; the current browser submission follows FormSubmit's official AJAX integration.

Shortlist data stays in browser local storage. No advertising analytics or third-party font requests are added.

## Hosting

`.openai/hosting.json` contains the private Site identity and static `dist` output configuration. Credentials are not stored in the project.
