# HQD Aggregate Catalogue Implementation Plan

**Goal:** Build an Astro website for all HQD Aggregate category entries, with an industrial visual direction informed by ATEMAG.

**Architecture:** Static Astro routes read a local product catalogue with source URLs and downloaded HQD images. Browser scripts implement filtering, a shortlist, accessible galleries, and an email quotation draft. No request is sent automatically.

**Tech Stack:** Astro 6, TypeScript, CSS, static JSON, browser JavaScript.

1. Discover both category pages, canonical product URLs and source parameter tables. Preserve redirect and data conflicts in `data/source-audit.json`.
2. Download product imagery, retain attribution and original URLs, and write factual product records in `src/data/products.json`; write original marketing summaries.
3. Create a shared navigation/footer, industrial green/white/charcoal design tokens, homepage, product finder, product pages, shortlist, and contact page.
4. Run data completeness, internal-link, asset and source-parameter checks and an Astro production build. Preview locally and perform browser QA if the browser connection is available.
5. Register one private Site, persist its project ID, package and push the exact source state, and deploy through Sites. If hosted provisioning is unavailable, retain and deliver the tested local Astro project and explain the concrete error.
