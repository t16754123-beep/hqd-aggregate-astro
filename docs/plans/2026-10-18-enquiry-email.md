# Enquiry Email Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Submit the HQD contact form directly to lisa@hqd-spindlemotor.com without opening a mail application.

**Architecture:** A same-origin Cloudflare Pages Function validates enquiries and forwards only approved fields to FormSubmit's documented AJAX endpoint. The recipient is fixed on the server. FormSubmit requires the mailbox owner to activate the form before delivery can be confirmed; activation responses must not appear as successful delivery.

**Tech Stack:** Astro static frontend, Pages Functions, Web Fetch/Cache APIs, Node native tests, FormSubmit.

---

### Task 1: Validated mail endpoint

Files: create `server/enquiry.mjs`, `functions/api/enquiry.js`, and `tests/enquiry.test.mjs`.

1. Test a valid enquiry, invalid email, header injection, unapproved origin, oversized body, honeypot, malformed JSON, provider failure, activation response, non-JSON provider response, and repeated submissions. All tests use mocked delivery and send no real email.
2. Implement POST `/api/enquiry`: require same-origin requests, bound body/field sizes, allowlist form fields, fix the recipient, and apply honeypot and best-effort per-IP Cache API throttling.
3. Forward the visitor email as Reply-To. Never forward client-supplied recipient, CC, webhook, subject headers or autoresponder instructions.
4. Return explicit success only after the provider accepts a submission. Return an error for activation, timeout, invalid provider output, or provider rejection. Preserve the visitor's inputs on failure.
5. Run `node --test tests/enquiry.test.mjs`; require all tests to pass.

### Task 2: Contact experience and disclosure

Files: modify `src/pages/contact.astro`, `src/scripts/site.ts`, `src/styles/global.css`, `src/pages/privacy.astro`, `README.md`, and `package.json`.

1. Replace email-draft behavior with asynchronous POST, disable duplicate submission while pending, and provide accessible status messages and a direct-email fallback on failure.
2. Keep native form POST available without JavaScript and preserve product preselection from the query string.
3. Identify FormSubmit's role and its documented 30-day submission archive in the privacy notice. Explain first-use activation in maintenance instructions.
4. Run all native tests, build with the production site URL, and verify local links. Use browser QA with mocked HTTP delivery so no mailbox is contacted.

### Task 3: Deploy and activate

1. Upload the reviewed changes to the existing GitHub `main` branch; preserve unrelated repository contents.
2. Follow Cloudflare's automatic deployment to a successful terminal state and verify that `/api/enquiry` rejects invalid submissions without sending mail.
3. Request authorization for one clearly labelled activation/test enquiry to the fixed recipient before sending it. Mailbox activation and actual inbox receipt require the mailbox owner's participation.
4. Record provider acceptance separately from confirmed inbox delivery. Do not claim fully active delivery before activation is complete.
